// Função para carregar dados iniciais e atualizar a tabela
function carregarDadosIniciais() {
    fetch('/obter_tabela_atual')
        .then(response => response.json())
        .then(data => {
            console.log("Dados recebidos:", data); // Debug: verifique o que está vindo
            atualizarTabelas(data);
            
            // Se houver turno_atual, mostra a tabela correspondente
            if (data.turno_atual) {
                mostrarTabela(data.turno_atual);
            }
        })
        .catch(error => console.error('Erro ao carregar dados iniciais:', error));
}

// Função para atualizar todas as tabelas com os dados fornecidos
function atualizarTabelas(data) {
    // Verifica se os dados têm a estrutura esperada
    if (data.manha !== undefined && data.tarde !== undefined && data.noite !== undefined) {
        atualizarTabela('tabela_manha', data.manha, 'enfermeiro_manha', 'countManha', 'manha');
        atualizarTabela('tabela_tarde', data.tarde, 'enfermeiro_tarde', 'countTarde', 'tarde');
        atualizarTabela('tabela_noite', data.noite, 'enfermeiro_noite', 'countNoite', 'noite');
    } else {
        console.error('Estrutura de dados inesperada:', data);
    }
}

// Função para atualizar todas as tabelas com os dados fornecidos
function atualizarTabelas(data) {
    atualizarTabela('tabela_manha', data.manha, 'enfermeiro_manha', 'countManha', 'manha');
    atualizarTabela('tabela_tarde', data.tarde, 'enfermeiro_tarde', 'countTarde', 'tarde');
    atualizarTabela('tabela_noite', data.noite, 'enfermeiro_noite', 'countNoite', 'noite');
}

// Inicializa a tabela ao carregar a página
document.addEventListener('DOMContentLoaded', function () {
    carregarDadosIniciais();
});

// Monitora eventos do EventSource e atualiza a tabela quando há novos dados
const eventSourceAtualizacao = new EventSource('/evento-atualizacao-mapa');

eventSourceAtualizacao.onmessage = function (event) {
    const data = JSON.parse(event.data);
    atualizarTabelas(data);
};

// Função já existente para atualizar uma tabela específica
function atualizarTabela(tabelaId, dados, enfermeiroId, contagemId, periodo) {
    const tabela = document.getElementById(tabelaId);
    const tbody = tabela.querySelector('tbody');
    const enfermeiroInfo = document.getElementById(enfermeiroId);

    // Atualiza o nome do enfermeiro, se disponível
    enfermeiroInfo.textContent = dados.length > 0 ? dados[0].enfermeiro : "Sem enfermeiro";

    tbody.innerHTML = ''; // Limpa a tabela

    // Adiciona as linhas à tabela
    dados.forEach(item => {
        const tr = document.createElement('tr');

        // Adiciona a classe de destaque de acordo com a origem da linha
        if (item.origem_tabela && item.origem_tabela.toLowerCase() !== periodo.toLowerCase()) {
            tr.classList.add(`destaque-${item.origem_tabela.toLowerCase()}`);
        }

        if (item.status && item.status.toLowerCase() == "concluido") {
            tr.classList.add("destaque-concluido");
            tr.classList.remove(
                "destaque-manha",
                "destaque-tarde",
                "destaque-noite"
            );
        }

        // Extrai e processa o conteúdo de 'procedimento' e 'especialidade'
        let procedimentoText = item.procedimento || '';
        let especialidadeText = item.especialidade || '';

        procedimentoText = procedimentoText.replace(/-/g, '').trim();

        if (procedimentoText.includes("ESPECIALIDADE:")) {
            let splitText = procedimentoText.split("ESPECIALIDADE:");
            procedimentoText = splitText[0].trim();
            especialidadeText = splitText[1].trim();
        }

        if (procedimentoText.includes("LATERALIDADE:")) {
            procedimentoText = procedimentoText.split("LATERALIDADE:")[0].trim();
        }

        if (especialidadeText.includes("LATERALIDADE:")) {
            especialidadeText = especialidadeText.split("LATERALIDADE:")[0].trim();
        }

        // Preenche as células da tabela com os dados processados
        let tdP = document.createElement('td');
        tdP.textContent = item.p;
        tr.appendChild(tdP);

        let tdHorario = document.createElement('td');
        tdHorario.textContent = item.horario;
        tr.appendChild(tdHorario);

        let tdSala = document.createElement('td');
        tdSala.textContent = item.sala;
        tr.appendChild(tdSala);

        let tdProcedimento = document.createElement('td');
        tdProcedimento.textContent = procedimentoText;
        tr.appendChild(tdProcedimento);

        let tdEspecialidade = document.createElement('td');
        tdEspecialidade.textContent = especialidadeText;
        tr.appendChild(tdEspecialidade);

        let tdEquipe = document.createElement('td');
        tdEquipe.textContent = item.equipe;
        tr.appendChild(tdEquipe);

        tbody.appendChild(tr);
    });

    // Atualiza a contagem de linhas
    const linhaCount = dados.length;
    const countElement = document.getElementById(contagemId);
    countElement.textContent = linhaCount;
}





const eventSourceControleTabela = new EventSource('/event-stream');

eventSourceControleTabela.onmessage = function(event) {
    const tabela = event.data;
    console.log("Tabela recebida via SSE:", tabela);
    
    // Em vez de apenas mostrar a tabela, busca os dados completos
    fetch('/obter_tabela_atual')
        .then(response => response.json())
        .then(data => {
            atualizarTabelas(data);
            mostrarTabela(tabela);
        })
        .catch(error => console.error('Erro ao atualizar tabela via SSE:', error));
};

function mostrarTabela(tabela) {
    // Oculta todas as tabelas, títulos e contadores
    document.getElementById("tabela_manha").style.display = "none";
    document.getElementById("titulo_manha").style.display = "none";
    document.getElementById("contagem_manha").style.display = "none";
    document.getElementById("icone_manha").style.display = "none";
    
    document.getElementById("tabela_tarde").style.display = "none";
    document.getElementById("titulo_tarde").style.display = "none";
    document.getElementById("contagem_tarde").style.display = "none";
    document.getElementById("icone_tarde").style.display = "none";
    
    document.getElementById("tabela_noite").style.display = "none";
    document.getElementById("titulo_noite").style.display = "none";
    document.getElementById("contagem_noite").style.display = "none";
    document.getElementById("icone_noite").style.display = "none";

    // Exibe a tabela, título e contador selecionados
    const tabelaExibida = document.getElementById(`tabela_${tabela}`);
    tabelaExibida.style.display = "block";
    
    const tituloExibido = document.getElementById(`titulo_${tabela}`);
    tituloExibido.style.display = "block";

    const iconeExibido = document.getElementById(`icone_${tabela}`);
    iconeExibido.style.display = "block";

    const contagemExibida = document.getElementById(`contagem_${tabela}`);
    contagemExibida.style.display = "block";



    // Conta o número de linhas no tbody da tabela exibida
    const linhaCount = tabelaExibida.querySelectorAll('tbody tr').length;

    // Atualiza o contador no HTML
    const countElement = document.getElementById(`count${tabela.charAt(0).toUpperCase() + tabela.slice(1)}`);
    countElement.textContent = linhaCount;
}


async function updateClock() {
    try {
        // Substitua pelo IP do servidor Flask
        const response = await fetch('http://10.2.2.54:5050/time');
        if (!response.ok) {
            throw new Error('Erro ao obter o horário do servidor');
        }

        const data = await response.json();
        const serverTime = new Date(data.currentTime); // Converte o horário ISO para objeto Date

        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // Formato 24 horas
        };

        const formattedDate = serverTime.toLocaleDateString('pt-BR', options);
        document.getElementById('clock').textContent = formattedDate;
    } catch (error) {
        console.error('Erro ao atualizar o relógio:', error);
        document.getElementById('clock').textContent = 'Erro ao obter horário';
    }
}

setInterval(updateClock, 1000);
updateClock();
