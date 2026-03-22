from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask import Response
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from threading import Event
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
import time
from threading import Timer
from datetime import datetime, timedelta
from selenium.common.exceptions import TimeoutException
from functools import wraps

app = Flask(__name__)

# Evento de atualização (aqui vamos usar um Event do threading para sinalizar a atualização)
atualizacao_evento = Event()
notificacao_evento = Event()
tabela_atual = "manha"  # Valor inicial padrão
app.secret_key = os.urandom(24)  # Necessária para gerenciar sessões
visualizacao_automatica = True # Variável global para armazenar o estado do checkbox

# Variável para armazenar o caminho do arquivo JSON
json_file_import = 'importa_dados.json'
usuarios_file = 'usuarios.json'


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'usuario' not in session:
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function


@app.route('/')
def index():
    """Renderiza a página inicial com os dados do arquivo JSON ou capturados."""
    dados = carregar_dados()
    return render_template('index.html', **dados)


# Função para carregar usuários do arquivo JSON
def carregar_usuarios():
    if os.path.exists(usuarios_file):
        with open(usuarios_file, 'r') as file:
            try:
                return json.load(file)
            except json.JSONDecodeError:
                return {}
    return {}


# Função para salvar usuários no arquivo JSON
def salvar_usuarios(usuarios):
    with open(usuarios_file, 'w') as file:
        json.dump(usuarios, file, indent=4)


# Função para atualizar o formato do JSON existente
def atualizar_formato_usuarios(usuarios):
    for login, dados in usuarios.items():
        # Se o formato for antigo (apenas senha como string), atualize
        if isinstance(dados, str):
            usuarios[login] = {
                "senha": dados,
                "permissao": "Colaborador"  # Permissão padrão
            }
    salvar_usuarios(usuarios)  # Salva o arquivo atualizado


@app.route('/login', methods=['POST'])
def login():
    """Processa o login."""
    login = request.form.get('login')
    senha = request.form.get('senha')
    usuarios = carregar_usuarios()

    # Atualiza o formato do JSON (se necessário)
    atualizar_formato_usuarios(usuarios)

    # Verifica se o login existe e a senha é válida
    if login in usuarios and check_password_hash(usuarios[login]['senha'], senha):
        session['usuario'] = login  # Armazena o usuário na sessão
        session['permissao'] = usuarios[login]['permissao']  # Armazena a permissão
        return redirect(url_for('pagina_edicao'))
    else:
        return render_template('index.html', error='Login ou senha inválidos.')


@app.route('/register', methods=['POST'])
@login_required 
def register():
    """Cadastra um novo usuário."""
    login = request.form.get('login')
    senha = request.form.get('senha')
    permissao = request.form.get('permissao')  # Captura a permissão
    usuarios = carregar_usuarios()

    if login in usuarios:
        return render_template('index.html', error='Usuário já existe.')
    else:
        # Gera o hash da senha antes de salvar
        senha_hash = generate_password_hash(senha)
        usuarios[login] = {
            "senha": senha_hash,
            "permissao": permissao or "Colaborador"  # Permissão padrão
        }
        salvar_usuarios(usuarios)
        return render_template('index.html', success='Usuário cadastrado com sucesso.')


@app.route('/pagina_edicao')
def pagina_edicao():
    if 'usuario' not in session:
        return redirect(url_for('index'))
    permissao_usuario = session.get('permissao', 'Colaborador')
    print(f"Permissão do usuário logado: {permissao_usuario}")  # Verifique no terminal
    return render_template('paginaEdicao.html', permissao_usuario=permissao_usuario)


@app.route('/logout')
def logout():
    """Faz logout do usuário."""
    session.pop('usuario', None)
    return redirect(url_for('index'))        





@app.route('/atualizar_dados')
@login_required 
def atualizar_dados():
    """Força a captura de dados do sistema e salva em JSON."""
    try:
        # Captura os dados mais recentes
        novos_dados = captura_vitae()

        # Carrega os dados existentes do arquivo JSON, se existirem
        try:
            with open(json_file_import, 'r') as json_file:
                dados_existentes = json.load(json_file)
        except FileNotFoundError:
            dados_existentes = {'dados_manha': [], 'dados_tarde': [], 'dados_noite': []}

        # Combina todos os prontuários existentes no JSON atual em um único conjunto
        prontuarios_existentes = {
            item['prontuario']
            for periodo in ['dados_manha', 'dados_tarde', 'dados_noite']
            for item in dados_existentes.get(periodo, [])
        }

        # Combina todos os prontuários capturados em um único conjunto
        prontuarios_capturados = {
            item['prontuario']
            for periodo in ['dados_manha', 'dados_tarde', 'dados_noite']
            for item in novos_dados.get(periodo, [])
        }

        # Inicializa os dados atualizados
        dados_atualizados = {}

        # Filtra os dados do JSON atual para manter apenas os prontuários presentes nos capturados
        for periodo in ['dados_manha', 'dados_tarde', 'dados_noite']:
            dados_atualizados[periodo] = [
                item for item in dados_existentes.get(periodo, [])
                if item['prontuario'] in prontuarios_capturados
            ]

        # Adiciona novos prontuários capturados que não estão no JSON atual
        for periodo in ['dados_manha', 'dados_tarde', 'dados_noite']:
            for item in novos_dados.get(periodo, []):
                if item['prontuario'] not in prontuarios_existentes:  # Verifica se o prontuário não está no JSON atual
                    dados_atualizados[periodo].append(item)

        # Adiciona os contadores de cada período
        dados_atualizados['cont_manha'] = len(dados_atualizados['dados_manha'])
        dados_atualizados['cont_tarde'] = len(dados_atualizados['dados_tarde'])
        dados_atualizados['cont_noite'] = len(dados_atualizados['dados_noite'])

        # Salva os dados atualizados no arquivo JSON
        with open(json_file_import, 'w') as json_file:
            json.dump(dados_atualizados, json_file, ensure_ascii=False, indent=4)

        # Retorna uma resposta JSON de sucesso
        return jsonify({
            'success': True,
            'message': 'Dados atualizados com sucesso'
        }), 200

    except Exception as e:
        # Retorna uma resposta JSON de erro
        return jsonify({
            'success': False,
            'message': f'Erro ao atualizar dados: {str(e)}'
        }), 500






def carregar_dados():
    """Carrega dados do arquivo JSON."""
    if os.path.exists(json_file_import):
        with open(json_file_import, 'r') as json_file:
            try:
                return json.load(json_file)
            except json.JSONDecodeError:
                print("Erro ao ler o arquivo JSON. O arquivo pode estar corrompido.")
                return {}
    else:
        dados = captura_vitae()
        with open(json_file_import, 'w') as json_file:
            json.dump(dados, json_file)
        return dados

def captura_vitae():
    """Captura dados do site usando Selenium e retorna o resultado."""
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    wait = WebDriverWait(driver, 50)
    
    try:
        print("Acessando o site...")
        driver.get("http://10.2.2.8:8080/pacientehrn/login.jsf")
        
        # Login
        print("Fazendo login...")
        username = driver.find_element(By.ID, "login")
        password = driver.find_element(By.ID, "xyb-ac")
        username.send_keys("mapaccg")
        password.send_keys("@isgh#nti2")
        login_button = driver.find_element(By.ID, "formulario:botaoLogin")
        driver.execute_script("arguments[0].click();", login_button)
        
        # Função para fechar todos os modais
        def fechar_todos_modais():
            modais_fechados = 0
            max_tentativas = 10  # Limite de segurança
            tentativa = 0
            
            while tentativa < max_tentativas:
                try:
                    # Procura por botões de fechar em modais
                    botoes_fechar = driver.find_elements(By.XPATH, '//*[contains(@id, "btnFechar") or contains(@class, "btn-close") or contains(@class, "close")]')
                    
                    # Filtra apenas botões visíveis e clicáveis
                    botoes_visiveis = [btn for btn in botoes_fechar if btn.is_displayed() and btn.is_enabled()]
                    
                    if not botoes_visiveis:
                        if modais_fechados > 0:
                            print(f"Total de {modais_fechados} modais fechados")
                        break
                    
                    for btn in botoes_visiveis:
                        try:
                            # Tenta diferentes métodos de clique
                            try:
                                btn.click()
                                print(f"Modal {modais_fechados + 1} fechado com click normal")
                            except:
                                try:
                                    driver.execute_script("arguments[0].click();", btn)
                                    print(f"Modal {modais_fechados + 1} fechado via JavaScript")
                                except:
                                    ActionChains(driver).move_to_element(btn).click().perform()
                                    print(f"Modal {modais_fechados + 1} fechado via ActionChains")
                            
                            modais_fechados += 1
                            time.sleep(1)  # Aguarda o modal fechar
                            
                        except Exception as e:
                            print(f"Erro ao clicar em botão: {e}")
                            continue
                    
                    tentativa += 1
                    time.sleep(1)  # Aguarda antes de procurar novos modais
                    
                except Exception as e:
                    print(f"Erro na iteração {tentativa}: {e}")
                    tentativa += 1
                    time.sleep(1)
            
            return modais_fechados

        # Fecha todos os modais iniciais
        print("Verificando modais de notificação...")
        total_modais = fechar_todos_modais()
        print(f"Processo inicial: {total_modais} modais fechados")

        # Navegação para o mapa cirúrgico
        print("Procurando aba 'Mapa'...")
        aba_mapa = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//a[@class='img' and text()='Mapa']"))
        )
        ActionChains(driver).move_to_element(aba_mapa).perform()
        print("Aba 'Mapa' encontrada")

        print("Clicando na aba cirúrgico...")
        aba_cirurgico = wait.until(EC.element_to_be_clickable((By.ID, "formCabecalho:j_id136")))
        aba_cirurgico.click()
        print("Aba cirúrgico clicada")

        # Verifica se novos modais apareceram após o clique
        print("Verificando modais após navegação...")
        total_modais = fechar_todos_modais()
        if total_modais > 0:
            print(f"Mais {total_modais} modais fechados após navegação")

        print("Aguardando tabelas carregarem...")
        wait.until(EC.visibility_of_all_elements_located((By.ID, "geral")))
        print("Tabelas carregadas")

        # Captura das tabelas
        print("Capturando tabela da manhã...")
        tabela_manha = driver.find_element(By.XPATH, '//*[@id="formularioMapas:tblMapa:0:j_id251:tb"]')
        linhas_manha = tabela_manha.find_elements(By.TAG_NAME, "tr")
        print(f"Encontradas {len(linhas_manha)} linhas na tabela da manhã")

        print("Capturando tabela da tarde...")
        tabela_tarde = driver.find_element(By.XPATH, '//*[@id="formularioMapas:tblMapa:0:j_id334:tb"]')
        linhas_tarde = tabela_tarde.find_elements(By.TAG_NAME, "tr")
        print(f"Encontradas {len(linhas_tarde)} linhas na tabela da tarde")

        print("Capturando tabela da noite...")
        tabela_noite = driver.find_element(By.XPATH, '//*[@id="formularioMapas:tblMapa:0:j_id418:tb"]')
        linhas_noite = tabela_noite.find_elements(By.TAG_NAME, "tr")
        print(f"Encontradas {len(linhas_noite)} linhas na tabela da noite")

        # Processamento dos dados
        def processar_linhas(linhas, periodo):
            dados = []
            for i, tr in enumerate(linhas):
                try:
                    # Verifica se a linha tem dados (ignora linhas vazias)
                    if tr.text.strip():
                        dado = {
                            "prontuario": tr.find_element(By.XPATH, "./td[1]").text.strip(),
                            "paciente": tr.find_element(By.XPATH, "./td[2]").text.strip(),
                            "horario": tr.find_element(By.XPATH, "./td[4]").text.strip(),
                            "sala": tr.find_element(By.XPATH, "./td[5]").text.strip(),
                            "localizacao": tr.find_element(By.XPATH, "./td[6]").text.strip(),
                            "procedimento": tr.find_element(By.XPATH, "./td[8]").text.strip(),
                            "cirurgiao": tr.find_element(By.XPATH, "./td[9]").text.strip(),
                            "equipe": "",
                            "enfermeiro": "",
                            "p": "",
                            "status": "",
                            "especialidade": ""
                        }
                        dados.append(dado)
                        print(f"Linha {i+1} do {periodo} processada: {dado['paciente'][:30]}...")
                except Exception as e:
                    print(f"Erro ao processar linha {i+1} do {periodo}: {e}")
            return dados

        dados_manha = processar_linhas(linhas_manha, "manhã")
        dados_tarde = processar_linhas(linhas_tarde, "tarde")
        dados_noite = processar_linhas(linhas_noite, "noite")

        print(f"Total capturado - Manhã: {len(dados_manha)}, Tarde: {len(dados_tarde)}, Noite: {len(dados_noite)}")
        
        driver.quit()
        
        return {
            'dados_manha': dados_manha,
            'dados_tarde': dados_tarde,
            'dados_noite': dados_noite,
            'cont_manha': len(dados_manha),
            'cont_tarde': len(dados_tarde),
            'cont_noite': len(dados_noite)
        }
        
    except Exception as e:
        print(f"ERRO PRINCIPAL: {str(e)}")
        import traceback
        traceback.print_exc()
        driver.quit()
        return None


@app.route('/dados_manha')
@login_required 
def dados_manha():
    """Retorna os dados da Manhã do arquivo JSON."""
    dados = carregar_dados()
    return jsonify(dados['dados_manha'])

@app.route('/dados_tarde')
@login_required 
def dados_tarde():
    """Retorna os dados da Tarde do arquivo JSON."""
    dados = carregar_dados()
    return jsonify(dados['dados_tarde'])

@app.route('/dados_noite')
@login_required 
def dados_noite():
    """Retorna os dados da Noite do arquivo JSON."""
    dados = carregar_dados()
    return jsonify(dados['dados_noite'])

@app.route('/buscar_informacoes', methods=['POST'])
@login_required 
def buscar_informacoes():
    """Busca informações específicas no JSON com base no índice e período fornecidos."""
    dados_recebidos = request.get_json()
    index = dados_recebidos.get('index')
    periodo = dados_recebidos.get('periodo')

    # Carrega os dados do JSON
    dados = carregar_dados()

    # Determina a lista de dados com base no período
    if periodo == 'manha':
        dados_periodo = dados.get('dados_manha', [])
    elif periodo == 'tarde':
        dados_periodo = dados.get('dados_tarde', [])
    elif periodo == 'noite':
        dados_periodo = dados.get('dados_noite', [])
    else:
        return jsonify({
            'prontuario': 'Período inválido',
            'paciente': 'Período inválido',
            'localizacao': 'Período inválido',
            'cirurgiao': 'Período inválido',
        })

    # Verifica se o índice está dentro do intervalo de dados do período
    if 0 <= index < len(dados_periodo):
        item = dados_periodo[index]
        return jsonify({
            'prontuario': item['prontuario'],
            'paciente': item['paciente'],
            'localizacao': item['localizacao'],
            'cirurgiao': item['cirurgiao']
        })
    else:
        # Caso o índice não seja válido
        return jsonify({
            'prontuario': 'Não encontrado',
            'paciente': 'Não encontrado',
            'localizacao': 'Não encontrado',
            'cirurgiao': 'Não encontrado',
        })








@app.route('/salvar_dados', methods=['POST'])
@login_required 
def salvar_dados():
    try:
        # Recebe os dados do front-end
        dados = request.json
        
        # Limpar os dados antigos (substituindo todo o conteúdo)
        with open(json_file_import, 'w') as file:
            json.dump(dados, file)

        return jsonify({"status": "success", "message": "Dados salvos com sucesso!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    


@app.route('/mapa')
def mapa():
    """Renderiza a página de mapa com os dados."""
    dados = carregar_dados()  # Carrega os dados do JSON
    return render_template('paginaMapa.html', **dados)

    
# Endpoint que o botão de "Atualizar Mapa" aciona
@app.route('/atualizar-mapa', methods=['POST'])
@login_required 
def atualizar_mapa():
    # Aciona o evento de atualização para a página do mapa
    atualizacao_evento.set()  # Notifica que há uma atualização para ser feita
    return jsonify(status='success')

@app.route('/evento-atualizacao-mapa')
@login_required 
def evento_atualizacao_mapa():
    def generate():
        while True:
            atualizacao_evento.wait()  # Espera até que o evento seja acionado
            with app.app_context():  # Garante o contexto do aplicativo
                # Extrai os dados JSON em vez de retornar o objeto Response
                dados_mapa = {
                    'manha': dados_manha().json,  # Extrai o JSON dos dados
                    'tarde': dados_tarde().json,
                    'noite': dados_noite().json
                }
            # Envia os dados atualizados como string JSON
            yield f"data: {json.dumps(dados_mapa)}\n\n"
            atualizacao_evento.clear()  # Reseta o evento após enviar a notificação

    return Response(generate(), content_type='text/event-stream')

# --- Determina o turno atual com base na hora ---
def determinar_turno():
    hora = datetime.now().hour
    if 7 <= hora < 13:
        return "manha"
    elif 13 <= hora <= 19:
        return "tarde"
    else:
        return "noite"


@app.route('/obter_tabela_atual', methods=['GET'])
def obter_tabela_atual():
    global tabela_atual
    turno = determinar_turno()
    tabela_atual = turno
    
    # Retorna os dados COMPLETOS igual à rota dados-iniciais-mapa
    dados_mapa = {
        'manha': dados_manha().json,  # Dados completos da manhã
        'tarde': dados_tarde().json,  # Dados completos da tarde
        'noite': dados_noite().json,  # Dados completos da noite
        'turno_atual': turno          # Turno atual como informação adicional
    }
    
    return jsonify(dados_mapa)


# --- Agenda a próxima mudança automática de turno ---
def agendar_proxima_mudanca():
    global tabela_atual, visualizacao_automatica

    if not visualizacao_automatica:
        print("⏸️ Visualização automática desativada — não será agendada nova troca.")
        return

    turno_atual = determinar_turno()
    agora = datetime.now()

    # Define o próximo horário de mudança
    if turno_atual == "manha":
        proxima = agora.replace(hour=13, minute=0, second=0, microsecond=0)
    elif turno_atual == "tarde":
        proxima = agora.replace(hour=19, minute=0, second=0, microsecond=0)
    else:  # noite
        # CORREÇÃO: Verifica se 07:00 do mesmo dia já passou
        sete_hoje = agora.replace(hour=7, minute=0, second=0, microsecond=0)
        if agora < sete_hoje:
            # Ainda não são 07:00 hoje → usa 07:00 do mesmo dia
            proxima = sete_hoje
        else:
            # Já passou das 07:00 hoje → usa 07:00 do próximo dia
            proxima = (agora + timedelta(days=1)).replace(hour=7, minute=0, second=0, microsecond=0)

    # Garante que o horário é sempre futuro
    if proxima <= agora:
        # CORREÇÃO: Se ainda assim o horário não for futuro, adiciona tempo baseado no turno
        if turno_atual == "manha":
            proxima += timedelta(hours=1)  # próxima hora
        elif turno_atual == "tarde":
            proxima += timedelta(hours=1)
        else:  # noite
            proxima += timedelta(hours=1)

    segundos = (proxima - agora).total_seconds()
    print(f"🕒 Turno atual: {turno_atual} | Próxima troca em {segundos/60:.1f} minutos.")
    Timer(segundos, mudar_turno_automaticamente).start()


# --- Função que troca o turno automaticamente ---
def mudar_turno_automaticamente():
    global tabela_atual
    tabela_atual = determinar_turno()
    print(f"🔄 Mudança automática: turno agora é {tabela_atual}")
    notificacao_evento.set()
    agendar_proxima_mudanca()  # agenda a próxima troca


# --- SSE: envia eventos de mudança de turno ao mapa ---
@app.route('/event-stream')
def event_stream():
    def gerar():
        while True:
            notificacao_evento.wait()
            notificacao_evento.clear()
            yield f"data: {tabela_atual}\n\n"  # ⚠️ corrigido para enviar apenas o nome, como o JS espera
    return Response(gerar(), mimetype='text/event-stream')


# --- Rota para controlar a visualização (manual ou automática) ---
@app.route('/controlar_visualizacao', methods=['POST'])
@login_required 
def controlar_visualizacao():
    global tabela_atual, visualizacao_automatica
    data = request.json or {}
    
    print("📋 Dados recebidos:", data)  # Para debug
    
    # Controle do modo automático
    if "visualizacaoAutomatica" in data:
        visualizacao_automatica = data["visualizacaoAutomatica"]
        print("🧭 Visualização automática:", "Ativa" if visualizacao_automatica else "Desativada")
        
        # Se veio com tabela, atualiza também
        if "tabela" in data:
            tabela_atual = data["tabela"]
            print(f"📋 Tabela atualizada para: {tabela_atual}")
            notificacao_evento.set()
        
        if visualizacao_automatica:
            agendar_proxima_mudanca()
        return '', 204
    
    # Controle manual de troca de tabela
    if "tabela" in data:
        tabela_atual = data["tabela"]
        notificacao_evento.set()
        print(f"📋 Mapa alterado manualmente para: {tabela_atual}")
        return '', 204
    
    return '', 400


# --- Rotas auxiliares ---
@app.route('/turno-atual')
def turno_atual():
    global tabela_atual
    tabela_atual = determinar_turno()
    return jsonify({"turno": tabela_atual})



@app.route('/time', methods=['GET'])
def get_server_time():
    # Obtém a data e hora atual do servidor
    now = datetime.now()
    # Retorna a data no formato ISO
    return jsonify({"currentTime": now.isoformat()})


# --- INICIALIZAÇÃO DO SISTEMA --- 
def inicializar_sistema():
    global tabela_atual, visualizacao_automatica
    tabela_atual = determinar_turno()
    visualizacao_automatica = True
    
    print(f"🎯 Sistema de turnos inicializado | Turno: {tabela_atual} | Modo automático: {visualizacao_automatica}")
    
    # Agenda a primeira mudança automática
    agendar_proxima_mudanca()

# Chama a inicialização quando o módulo é importado
inicializar_sistema()


if __name__ == "__main__":
    app.run(debug=True)