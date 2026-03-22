import os
import sys
import tkinter as tk
from pystray import Icon, Menu, MenuItem
from PIL import Image, ImageDraw
import threading
from waitress import serve
from app import app, determinar_turno, agendar_proxima_mudanca
import subprocess
import time

# Variável global para controle do servidor e processo de logs
server_running = True
log_process = None  # Para manter o processo do console aberto

# Cria um ícone a partir de uma imagem JPG
def create_image():
    image_path = "C:\\Projeto Mapa CCG Novo\\static\\img\\icone_map.ico"
    image = Image.open(image_path)
    image = image.resize((32, 32))
    return image

# Função para parar o servidor
def stop_server():
    global server_running
    server_running = False
    print("🛑 Parando servidor...")

# Mostra uma janela de debug com logs ao clicar em "Sobre"
def show_logs():
    global log_process
    if log_process is None or log_process.poll() is not None:
        # Abre um terminal que exibe o log do servidor Flask
        log_process = subprocess.Popen([sys.executable, "-u", "app.py"], creationflags=subprocess.CREATE_NEW_CONSOLE)

# Ação para sair e fechar completamente o aplicativo
def quit_action(icon, item):
    print("🔴 Saindo do aplicativo...")
    icon.stop()  # Para o ícone da bandeja
    stop_server()  # Para o servidor
    if log_process:
        log_process.terminate()  # Termina o processo de logs, se aberto
    time.sleep(1)  # Dá tempo para encerrar
    os._exit(0)   # Fecha o programa imediatamente

# Função principal do ícone de bandeja
def setup_tray_icon():
    try:
        icon = Icon("MapaCCG")
        icon.icon = create_image()
        icon.title = "Mapa CCG - 1.0"
        icon.menu = Menu(
            MenuItem("Sobre", lambda icon, item: show_logs()),
            MenuItem("Sair", quit_action)
        )
        icon.run()
    except Exception as e:
        print(f"❌ Erro no tray icon: {e}")

# Função para iniciar o servidor Waitress
def run_server():
    print("🚀 Iniciando servidor Waitress na porta 5000...")
    print("📊 Acesse: http://localhost:5000")
    
    try:
        while server_running:
            serve(app, host='0.0.0.0', port=5050, threads=1000)
            time.sleep(1)  # Pequena pausa se o servidor cair
    except Exception as e:
        print(f"❌ Erro no servidor: {e}")
    finally:
        print("🔴 Servidor parado")

if __name__ == "__main__":
    # Inicia o ícone da bandeja em uma thread separada
    tray_thread = threading.Thread(target=setup_tray_icon, daemon=True)
    tray_thread.start()
    
    # Inicia o servidor Flask com waitress em outra thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    try:
        # Mantém o programa principal ativo
        while server_running:
            time.sleep(1)
    except KeyboardInterrupt:
        print("🛑 Interrompido pelo usuário")
        stop_server()
    finally:
        print("👋 Encerrando aplicação...")