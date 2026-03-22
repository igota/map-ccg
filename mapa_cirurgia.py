from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import webbrowser
from datetime import datetime
import pytz  # Biblioteca para trabalhar com fusos horários

# Configurações do ChromeDriver
chrome_options = Options()
#chrome_options.add_argument("--start-maximized")  # Abre o navegador maximizado
#chrome_options.add_argument("--disable-notifications")  # Desabilita notificações
#chrome_options.add_argument("--headless")  # Abre o navegador sem segundo plano
chrome_options.add_argument("--no-sandbox")  # Desabilita notificações
chrome_options.add_argument("--disable-dev-shm-usage")  # Desabilita notificações

# Inicializa o navegador com o ChromeDriver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
wait = WebDriverWait(driver, 50)

# Abre a página de login
driver.get("http://10.2.2.8:8080/pacientehrn/login.jsf")

# Insere o nome de usuário e senha
username = driver.find_element(By.ID, "login")
password = driver.find_element(By.ID, "xyb-ac")

username.send_keys("igorims")
password.send_keys("timao15@")

# Clica no botão de login
login_button = driver.find_element(By.ID, "formulario:botaoLogin")
login_button.click()

# Localiza a aba "Mapa" e simula passar o mouse sobre ela
aba_mapa = driver.find_element(By.XPATH, "/html/body/div[2]/form/div[3]/div/ul/li[3]")
ActionChains(driver).move_to_element(aba_mapa).perform()

# Espera a opção "Cirúrgico" estar clicável e clica
aba_cirurgico = wait.until(EC.element_to_be_clickable((By.ID, "formCabecalho:j_id134")))
aba_cirurgico.click()

# Espera até que os prontuários estejam visíveis
wait.until(EC.visibility_of_all_elements_located((By.ID, "geral")))

# Captura o corpo da tabela usando o XPath do tbody
tabela_manha = driver.find_element(By.XPATH, '//*[@id="formularioMapas:tblMapa:0:j_id246:tb"]')
tabela_tarde = driver.find_element(By.XPATH, '//*[@id="formularioMapas:tblMapa:0:j_id329:tb"]')
tabela_noite = driver.find_element(By.XPATH, '//*[@id="formularioMapas:tblMapa:0:j_id413:tb"]')

# Captura todas as linhas da tabela (tr)
mapa_manha = tabela_manha.find_elements(By.TAG_NAME, "tr")
mapa_tarde = tabela_tarde.find_elements(By.TAG_NAME, "tr")
mapa_noite = tabela_noite.find_elements(By.TAG_NAME, "tr")

# Armazena os dados em uma lista
dados_manha = []
dados_tarde = []
dados_noite = []

# Contadores de linhas
cont_manha = len(mapa_manha)
cont_tarde = len(mapa_tarde)
cont_noite = len(mapa_noite)

# Itera sobre as linhas e captura as células específicas
for linhas_manha in mapa_manha:
    sala_manha = linhas_manha.find_element(By.XPATH, "./td[5]")  # Captura a quinta célula (Sala)
    procedimento_manha = linhas_manha.find_element(By.XPATH, "./td[8]")  # Captura a oitava célula (Procedimento)
    
    # Adiciona os dados capturados na lista
    dados_manha.append({
        "sala_manha": sala_manha.text,
        "procedimento_manha": procedimento_manha.text
    })

for linhas_tarde in mapa_tarde:
    sala_tarde = linhas_tarde.find_element(By.XPATH, "./td[5]")  # Captura a quinta célula (Sala)
    procedimento_tarde = linhas_tarde.find_element(By.XPATH, "./td[8]")  # Captura a oitava célula (Procedimento)
    
    # Adiciona os dados capturados na lista
    dados_tarde.append({
        "sala_tarde": sala_tarde.text,
        "procedimento_tarde": procedimento_tarde.text
    })   

for linhas_noite in mapa_noite:
    sala_noite = linhas_noite.find_element(By.XPATH, "./td[5]")  # Captura a quinta célula (Sala)
    procedimento_noite = linhas_noite.find_element(By.XPATH, "./td[8]")  # Captura a oitava célula (Procedimento)
    
    # Adiciona os dados capturados na lista
    dados_noite.append({
        "sala_noite": sala_noite.text,
        "procedimento_noite": procedimento_noite.text
    })



# Gera o arquivo HTML com os dados capturados
html_content = f'''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mapa Cirúrgico</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {{
            padding: 20px;
        }}
        table {{
            width: 100%;
        }}
        th, td {{
            padding: 12px;
            text-align: center;
            border-bottom: 1px solid #ddd;
        }}
        .tabela thead th{{
            background-color: #053994;
            color: white;
            font-family: Arial, sans-serif;
            
        }}
        .tabela tbody tr:nth-child(even) {{
            background-color: #f4f4f4;
        }}
        .tabela {{
            display: none; /* Inicialmente oculta todas as tabelas */
            border-collapse: collapse;
        }}
        h3 {{
            text-align: center;
            margin-bottom: 20px;
            font-weight: bold;
        }}
        .botoes {{
            text-align: center;
            margin-bottom: 20px;
        }}
        h4 {{
            position: absolute;
            left: 20px; /* Distância do lado direito */
            top: 20px; /* Distância do topo */
            font-weight: bold;
            
        }}
        .clock {{
            position: absolute;
            right: 20px; /* Distância do lado direito */
            top: 20px; /* Distância do topo */
            font-size: 25px;
            color: #333; /* Cor do texto */
            font-weight: bold;
        }}
    </style>
    <script>
        function showTabela(tabelaId, periodo, contador) {{
            // Oculta todas as tabelas
            var tabelas = document.getElementsByClassName("tabela");
            for (var i = 0; i < tabelas.length; i++) {{
                tabelas[i].style.display = "none"; // Oculta todas as tabelas
            }}
            // Exibe a tabela selecionada
            var tabela = document.getElementById(tabelaId);
            tabela.style.display = "table"; // Exibe a tabela selecionada
            
            // Atualiza o título
            document.getElementById("titulo_periodo").innerText = periodo;
            document.getElementById("contador_periodo").innerText = "Quantidade de Cirurgias: " + contador;


        }}

        function clearTabelas() {{
            // Oculta todas as tabelas
            var tabelas = document.getElementsByClassName("tabela");
            for (var i = 0; i < tabelas.length; i++) {{
                tabelas[i].style.display = "none"; // Oculta todas as tabelas
            }}
            // Limpa o título
            document.getElementById("titulo_periodo").innerText = "";
            document.getElementById("contador_periodo").innerText = "";
        }}

        function updateClock() {{
            const now = new Date();
            const options = {{
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false // Para usar o formato 24 horas
            }};
            const formattedDate = now.toLocaleDateString('pt-BR', options);
            document.getElementById('clock').textContent = formattedDate;
        }}

        // Atualiza o relógio a cada segundo
        setInterval(updateClock, 1000);
        updateClock(); // Chama imediatamente para evitar esperar 1 segundo    

    </script>
</head>
<body>

    <h3>Mapa Cirúrgico - HRN</h3>
    <h3 id="titulo_periodo"></h3> <!-- Título dinâmico -->

    <div class="botoes">
        <button class="btn btn-primary" onclick="showTabela('tabela_manha', 'Manhã',{cont_manha})">Mapa da Manhã</button>
        <button class="btn btn-primary" onclick="showTabela('tabela_tarde', 'Tarde',{cont_tarde})">Mapa da Tarde</button>
        <button class="btn btn-primary" onclick="showTabela('tabela_noite', 'Noite',{cont_noite})">Mapa da Noite</button>
        <button class="btn btn-danger" onclick="clearTabelas()">Limpar Mapas</button>
    </div>
    
    <div class="clock" id="clock"></div>
    <h4 id="contador_periodo"></h4>
    
    <table id="tabela_manha" class="tabela table table-striped">
        <thead>
            <tr>
                <th>Sala</th>
                <th>Procedimento</th>
                <th>Observações</th>  <!-- Nova coluna -->
            </tr>
        </thead>
        <tbody>
'''

# Adicionar os dados capturados na tabela
for manha in dados_manha:
    html_content += f'''
        <tr>
            <td>{manha["sala_manha"]}</td>
            <td>{manha["procedimento_manha"]}</td>
            <td><input type="text" /> </td>  <!-- Campo de observações -->
        </tr>
    '''

# Finalizar o conteúdo do HTML
html_content += '''
        </tbody>
    </table>

    <table id="tabela_tarde" class="tabela table table-striped">
        <thead>
            <tr>
                <th>Sala</th>
                <th>Procedimento</th>
                <th>Observações</th>  <!-- Nova coluna -->
            </tr>
        </thead>
        <tbody>
'''

# Adicionar os dados capturados na tabela da tarde
for tarde in dados_tarde:
    html_content += f'''
        <tr>
            <td>{tarde["sala_tarde"]}</td>
            <td>{tarde["procedimento_tarde"]}</td>
            <td><input type="text" /> </td>  <!-- Campo de observações -->
        </tr>
    '''

# Finalizar o conteúdo do HTML
html_content += '''
        </tbody>
    </table>

    <table id="tabela_noite" class="tabela table table-striped">
        <thead>
            <tr>
                <th>Sala</th>
                <th>Procedimento</th>
                <th>Observações</th>  <!-- Nova coluna -->
            </tr>
        </thead>
        <tbody>
'''

# Adicionar os dados capturados na tabela da noite
for noite in dados_noite:
    html_content += f'''
        <tr>
            <td>{noite["sala_noite"]}</td>
            <td>{noite["procedimento_noite"]}</td>
            <td><input type="text" /> </td>  <!-- Campo de observações -->
        </tr>
    '''

# Finalizar o conteúdo do HTML
html_content += '''
        </tbody>
    </table>

</body>
</html>
'''

# Salva o arquivo HTML
with open("mapa_cirurgia.html", "w", encoding="utf-8") as file:
    file.write(html_content)

# Abre o arquivo HTML no navegador padrão
webbrowser.open("mapa_cirurgia.html")

# Fechar o driver
driver.quit()
