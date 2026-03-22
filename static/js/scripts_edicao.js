

document.addEventListener('DOMContentLoaded', function() {
    // Primeiro, exibe as tabelas uma por uma, com um intervalo de tempo entre elas
    showTabela('tabela_manha', 'Manha');
    setTimeout(() => {
        showTabela('tabela_tarde', 'Tarde');
        setTimeout(() => {
            showTabela('tabela_noite', 'Noite');
            // Após exibir todas, esconde as tabelas
            setTimeout(clearTabelas, 1000);  // Espera 1 segundo antes de esconder
        }, 1000);  // Exibe a tabela "Tarde" após 1 segundo
    }, 1000);  // Exibe a tabela "Manha" e depois "Tarde" após 1 segundo
});



function showTabela(tabelaId, periodo) {
    let periodoCorrigido = periodo === "Manha" ? "Manhã" : periodo;
    document.getElementById("titulo_periodo").textContent = periodoCorrigido;

    fetch(`/dados_${periodo.toLowerCase()}`)
        .then(response => response.json())
        .then(data => {
            let tabela = document.getElementById(tabelaId);
            let tbody = tabela.getElementsByTagName('tbody')[0];
            let thead = tabela.getElementsByTagName('thead')[0];
            tbody.innerHTML = '';

            if (!thead.querySelector('.info-enfermeiro')) {
                let headerRow = document.createElement('tr');
                headerRow.classList.add('info-enfermeiro');

                let headerCell = document.createElement('td');
                headerCell.colSpan = 7;
                headerCell.textContent = 'Enfermeiro(a): ';
                headerCell.contentEditable = "true";
                headerCell.style.textAlign = 'center';
                headerCell.style.fontWeight = 'bold';

                headerCell.addEventListener('input', function() {
                    saveChanges(headerCell.textContent);
                });

                // Adiciona funcionalidade de confirmação com Enter
                headerCell.addEventListener('keydown', function(event) {
                    if (event.key === 'Enter') {
                        event.preventDefault(); // Evita que o Enter crie uma nova linha
                        headerCell.blur(); // Sai do modo de edição
                        saveChanges(headerCell.textContent); // Salva as alterações
                    }
                });

                headerRow.appendChild(headerCell);
                thead.insertBefore(headerRow, thead.firstChild);
            }

            const headerCell = thead.querySelector('.info-enfermeiro td');
            if (data.length > 0 && data[0].enfermeiro) {
                headerCell.textContent = `${data[0].enfermeiro}`;
            }

            data.forEach(item => {
                let tr = document.createElement('tr');
                tr.setAttribute('draggable', 'false');

                let tdCheckbox = document.createElement('td');
                let checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.classList.add('row-checkbox');

                checkbox.addEventListener('change', () => {
                    tr.classList.toggle('selected', checkbox.checked);
                });

                tdCheckbox.appendChild(checkbox);
                tr.appendChild(tdCheckbox);

                let procedimentoText = item[`procedimento`] || '';
                let especialidadeText = item[`especialidade`] || '';

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

                let tdID = document.createElement('td');
                tdID.textContent = item[`p`] || '';
                tdID.contentEditable = "true";
                tdID.setAttribute('inputmode', 'numeric'); // Forçar teclado numérico
                tdID.addEventListener('input', saveChanges);
                tdID.addEventListener('keydown', handleCellEdit); // Ouve a tecla Enter
                tr.appendChild(tdID);

                let tdSala = document.createElement('td');
                tdSala.textContent = item[`sala`] || '';
                tdSala.contentEditable = "true";
                tdSala.setAttribute('inputmode', 'numeric'); // Forçar teclado numérico
                tdSala.addEventListener('input', saveChanges);
                tdSala.addEventListener('keydown', handleCellEdit); // Ouve a tecla Enter
                tr.appendChild(tdSala);
                
                let tdHorario = document.createElement('td');
                tdHorario.textContent = item[`horario`] || '';
                tdHorario.contentEditable = "true";
                tdHorario.setAttribute('inputmode', 'numeric'); // Forçar teclado numérico
                tdHorario.addEventListener('input', saveChanges);
                tdHorario.addEventListener('keydown', handleCellEdit); // Ouve a tecla Enter
                tr.appendChild(tdHorario);

                let tdProcedimento = document.createElement('td');
                tdProcedimento.textContent = procedimentoText;
                tdProcedimento.contentEditable = "true";
                tdProcedimento.addEventListener('input', saveChanges);
                tdProcedimento.addEventListener('keydown', handleCellEdit); // Ouve a tecla Enter
                tr.appendChild(tdProcedimento);

                let tdEspecialidade = document.createElement('td');
                tdEspecialidade.textContent = especialidadeText;
                tdEspecialidade.contentEditable = "true";
                tdEspecialidade.addEventListener('input', saveChanges);
                tdEspecialidade.addEventListener('keydown', handleCellEdit); // Ouve a tecla Enter
                tr.appendChild(tdEspecialidade);
               

                let tdEquipe = document.createElement('td');
                tdEquipe.textContent = item[`equipe`] || '';
                tdEquipe.contentEditable = "true";
                tdEquipe.addEventListener('input', saveChanges);
                tdEquipe.addEventListener('keydown', handleCellEdit); // Ouve a tecla Enter
                tr.appendChild(tdEquipe);

                

                tr.dataset.origemTabela = item.origem_tabela || '';  // Armazena a origem da tabela no atributo data
                tr.dataset.status = item.status || 'pendente';
                tr.dataset.prontuario = item.prontuario;
                tr.dataset.paciente = item.paciente;
                tr.dataset.localizacao = item.localizacao;
                tr.dataset.cirurgiao = item.cirurgiao;
                tbody.appendChild(tr);
            });

            document.querySelectorAll('.tabela').forEach(table => {
                table.style.display = 'none';
            });
            tabela.style.display = 'block';

            // Reaplica a classe de destaque a todas as linhas com origem diferente do período atual
            Array.from(tbody.getElementsByTagName('tr')).forEach(tr => {
                const origemTabela = tr.dataset.origemTabela.toLowerCase();
                if (origemTabela && origemTabela !== periodo.toLowerCase()) {
                    tr.classList.add(`destaque-${origemTabela}`);
                }

                // Reaplica as classes com base no status
                const statusLinha = tr.dataset.status.toLowerCase(); // Obtém o status da linha
                

                if (statusLinha === "concluido") {
                    tr.classList.add("destaque-concluido"); // Adiciona classe para status "Concluído"
                    tr.classList.remove(`destaque-${origemTabela}`)
                    tbody.appendChild(tr);
                    
                    
                } 
            });


            
        })
        .catch(error => {
            console.error('Erro ao carregar os dados:', error);
        });
}



function handleCellEdit(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Previne a quebra de linha
        saveChanges(event.target.textContent); // Confirma os dados
        event.target.blur(); // Remove o foco da célula
    }
}







document.addEventListener('DOMContentLoaded', function () {
    // Seleciona todas as tabelas (manha, tarde, noite)
    let tabelas = ['tabela_manha', 'tabela_tarde', 'tabela_noite'];
    
    // Adiciona ouvintes de evento de clique para cada tabela
    tabelas.forEach(tabelaId => {
        let headers = document.querySelectorAll(`#${tabelaId} thead th`);
        headers.forEach((header, index) => {
            // Ignora o clique no cabeçalho da primeira coluna
            if (index !== 0) {
                header.addEventListener('click', () => sortTableByColumn(header, index));
            }
        });
    });
});

// Função para ordenar a tabela na coluna correspondente
function sortTableByColumn(header, columnIndex) {
    // Identifica a tabela específica a partir do cabeçalho clicado
    let tabela = header.closest('table').querySelector('tbody');
    let rows = Array.from(tabela.rows);

    // Alterna a direção com base na classe atual
    let isAscending = !header.classList.contains('sorted-asc');

    // Limpar classes de ordenação de todos os cabeçalhos na tabela específica
    header.closest('table').querySelectorAll('thead th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });

    // Adicionar a classe de ordenação correspondente
    header.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');

    // Ordenar as linhas com base no conteúdo da coluna
    rows.sort((rowA, rowB) => {
        let cellA = rowA.cells[columnIndex].textContent.trim();
        let cellB = rowB.cells[columnIndex].textContent.trim();

        // Tratamento para células vazias
        if (!cellA && !cellB) return 0; // Ambas vazias são iguais
        if (!cellA) return 1; // Célula A vazia vai para o final
        if (!cellB) return -1; // Célula B vazia vai para o final

        let isNumeric = !isNaN(cellA) && !isNaN(cellB);

        if (isNumeric) {
            return isAscending ? cellA - cellB : cellB - cellA;
        } else {
            return isAscending
                ? cellA.localeCompare(cellB)
                : cellB.localeCompare(cellA);
        }
    });

    // Adicionar as linhas ordenadas de volta à tabela
    rows.forEach(row => tabela.appendChild(row));
    saveChanges();
}



// Evento para ocultar o ícone de ordenação ao clicar fora da tabela
document.addEventListener('click', function(event) {
    let tabelas = document.querySelectorAll('.tabela');
    
    // Verifica se o clique foi fora de qualquer tabela
    if (![...tabelas].some(tabela => tabela.contains(event.target))) {
        document.querySelectorAll('.tabela thead th').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc'); // Remove classes de ordenação
        });
    }
});



function addRow() {
    const tabelaVisivel = document.querySelector('.tabela[style="display: block;"] tbody');

    if (tabelaVisivel) {
        // Solicita o número do prontuário ao usuário
        const prontuario = prompt("Digite o número do prontuário:");

        // Verifica se o usuário digitou algo
        if (!prontuario) {
            alert("Prontuário inválido! A linha não será adicionada.");
            return; // Não adiciona a linha caso o prontuário seja inválido
        }

        // Cria uma nova linha
        let newRow = document.createElement('tr');
        newRow.setAttribute('data-prontuario', prontuario); // Adiciona o atributo `data-prontuario` com o número fornecido

        // Cria a célula de checkbox e adiciona à linha
        let checkCell = document.createElement('td');
        let checkBox = document.createElement('input');
        checkBox.type = "checkbox";
        checkBox.classList.add('row-checkbox');

        // Adiciona evento de seleção com base no checkbox
        checkBox.addEventListener('change', function() {
            newRow.classList.toggle('selected', checkBox.checked);
        });

        checkCell.appendChild(checkBox);
        newRow.appendChild(checkCell);

        // Adiciona células editáveis para cada coluna existente
        const cols = tabelaVisivel.parentElement.querySelectorAll('thead th').length - 1;
        for (let i = 0; i < cols; i++) {
            let newCell = document.createElement('td');
            newCell.contentEditable = "true";

            // Define configurações específicas para colunas numéricas
            if (i >= 0 && i <= 2) {
                newCell.setAttribute('inputmode', 'numeric'); // Força teclado numérico
            }

            // Adiciona eventos para confirmação com Enter
            newCell.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Impede a ação padrão de pular para a próxima linha
                    newCell.blur(); // Sai do modo de edição
                    saveChanges(); // Salva as alterações
                }
            });

            // Adiciona um evento para monitorar alterações nas células
            newCell.addEventListener('input', function() {
                saveChanges(); // Salva os dados após a edição de qualquer célula
            });

            newRow.appendChild(newCell);
        }

        // Adiciona a nova linha na primeira posição do tbody
        tabelaVisivel.insertBefore(newRow, tabelaVisivel.firstChild);

        // Salva as alterações automaticamente após adicionar a linha
        saveChanges();
    }
}





function deselectAllRows() {
    // Seleciona a tabela visível (com estilo display: block)
    const table = document.querySelector('.tabela[style*="display: block;"]');

    if (table) {
        const rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");

        for (let row of rows) {
            const rowCheckbox = row.querySelector("input[type='checkbox']");
            if (rowCheckbox) {
                rowCheckbox.checked = false; // Desmarca o checkbox
                row.classList.remove("selected"); // Remove a classe 'selected', se existir
            }
        }
    } else {
        console.warn("Nenhuma tabela visível encontrada para desmarcar as linhas.");
    }
}





function selectAllRows(checkbox, tableId) {
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");

    for (let row of rows) {
        const rowCheckbox = row.querySelector("input[type='checkbox']");
        if (rowCheckbox) {
            rowCheckbox.checked = checkbox.checked;

            // Adiciona ou remove a classe 'selected' com base na seleção
            if (checkbox.checked) {
                row.classList.add("selected");
            } else {
                row.classList.remove("selected");
            }
        }
    }
}

function deleteSelectedRows() {
    // Encontra a tabela visível no momento
    const tabelaVisivel = document.querySelector('.tabela[style="display: block;"] tbody');

    if (tabelaVisivel) {
        // Verifica se há uma linha selecionada
        const linhaSelecionada = tabelaVisivel.querySelector('.selected');
        if (!linhaSelecionada) {
            alert("Selecione uma linha antes de tentar excluir.");
            return;
        }

        // Obtém todas as linhas da tabela visível
        const rows = Array.from(tabelaVisivel.querySelectorAll('tr'));

        // Remove as linhas selecionadas
        rows.forEach(row => {
            const checkbox = row.querySelector('.row-checkbox');
            if (checkbox && checkbox.checked) {
                tabelaVisivel.removeChild(row);
            }
        });

        // Salva as alterações após remover as linhas
        saveChanges();
    }
}







// Função para obter a tabela atualmente visível
function getVisibleTable() {
    return document.querySelector('.tabela:not([style*="display: none"]) tbody');
}

/// Função para mover a linha selecionada para cima
function moveRowUp() {
    const table = getVisibleTable(); // Obtém o corpo da tabela visível
    const selectedRow = table.querySelector('.selected');
    
    // Verifica se há uma linha selecionada
    if (!selectedRow) {
        alert("Selecione uma linha antes de tentar mover.");
        return;
    }

    // Verifica se a linha selecionada tem uma linha anterior
    if (!selectedRow.previousElementSibling) {
        alert("A linha selecionada já está no topo.");
        return;
    }

    // Move a linha para cima
    selectedRow.parentElement.insertBefore(selectedRow, selectedRow.previousElementSibling);

    // Salva as alterações após mover a linha
    saveChanges();
}

// Função para mover a linha selecionada para baixo
function moveRowDown() {
    const table = getVisibleTable(); // Obtém o corpo da tabela visível
    const selectedRow = table.querySelector('.selected');
    
    // Verifica se há uma linha selecionada
    if (!selectedRow) {
        alert("Selecione uma linha antes de tentar mover.");
        return;
    }

    // Verifica se a linha selecionada tem uma linha seguinte
    if (!selectedRow.nextElementSibling) {
        alert("A linha selecionada já está na parte inferior.");
        return;
    }

    // Move a linha para baixo
    selectedRow.parentElement.insertBefore(selectedRow.nextElementSibling, selectedRow);

    // Salva as alterações após mover a linha
    saveChanges();
}


let selectedRowIndex = null;

function updateRowSelectionAndMovement(tableId) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll('tbody tr');

    // Remove os event listeners antigos para evitar duplicações
    rows.forEach(row => {
        row.removeEventListener('click', handleRowClick);
    });

    // Adiciona o event listener novamente
    rows.forEach((row, index) => {
        row.addEventListener('click', handleRowClick);
    });

    function handleRowClick(event) {
        // Remove a seleção de todas as outras linhas
        rows.forEach(row => row.classList.remove('selected'));

        // Marca a linha atual como selecionada
        event.currentTarget.classList.add('selected');

        // Armazena o índice da linha selecionada
        selectedRowIndex = event.currentTarget.rowIndex - 1; // rowIndex é 1-based, subtrai 1 para 0-based
    }
}



function displayInfo() {
    // Captura a tabela visível
    const table = document.querySelector('.tabela[style="display: block;"]');
    const colorPickerStatus = document.getElementById("colorPicker_status"); // Select para escolher o status
    const statusSelecionado = colorPickerStatus.value.toLowerCase(); // Garante que o valor seja em minúsculas

    // Verifica se existe alguma tabela visível
    if (!table) {
        alert("Nenhuma tabela visível no momento. Verifique a exibição antes de aplicar o Status.");
        colorPickerStatus.value = "inicio"; // Reseta o select
        return;
    }

    // Captura o período (manhã, tarde ou noite) da tabela visível
    const periodoTabela = table ? table.id.split("_")[1].toLowerCase() : null;

    // Captura todas as linhas selecionadas
    const linhasSelecionadas = table.querySelectorAll('.selected');
    if (linhasSelecionadas.length === 0) {
        alert("Selecione pelo menos uma linha antes de aplicar o status.");
        colorPickerStatus.value = "inicio"; // Reseta o select
        return;
    }

    // Obtém o índice da primeira linha selecionada
    const selectedRow = linhasSelecionadas[0];  // Pega a primeira linha selecionada
    const selectedRowIndex = selectedRow.rowIndex - 2;  // Subtrai 1 para obter o índice 0-based

    // Envia o índice e o período da linha selecionada ao backend
    fetch('/buscar_informacoes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ index: selectedRowIndex, periodo: periodoTabela })
    })
    .then(response => response.json())
    .then(data => {
        // Preenche o modal com as informações recebidas
        document.getElementById('paciente').innerText = data.paciente;
        document.getElementById('prontuario').innerText = data.prontuario;
        document.getElementById('localizacao').innerText = data.localizacao;
        document.getElementById('cirurgiao').innerText = data.cirurgiao;

        // Exibe o modal
        document.getElementById('popupInfo').style.display = 'block';
    })
    .catch(error => {
        console.error('Erro ao buscar informações:', error);
    });
}







// Função principal para salvar as alterações
function saveChanges() {
    // Seleciona todas as tabelas com a classe 'tabela', independente de estarem visíveis ou não
    const tabelas = document.querySelectorAll('.tabela'); 

    // Cria um objeto para armazenar os dados organizados por período
    let dataToSave = {};

    tabelas.forEach(tabela => {
        // Obtém o nome do período a partir do id da tabela (manhã, tarde, noite)
        const periodo = tabela.id.split('_')[1];

        // Captura o valor do enfermeiro para o período específico
        const headerCell = tabela.querySelector('.info-enfermeiro td');
        const enfermeiro = headerCell ? headerCell.textContent.trim() : '';

        // Seleciona todas as linhas da tabela
        const rows = tabela.querySelectorAll('tbody tr'); 

        let periodoData = [];  // Array para armazenar os dados de cada tabela (Manhã, Tarde, Noite)

        rows.forEach(row => {
            let rowData = {};
            let cells = row.querySelectorAll('td'); // Captura as células da linha
            
            // Captura as colunas da tabela no cabeçalho
            const columnNames = tabela.querySelectorAll('thead th');

            // Capturar atributos ou colunas específicas (incluindo prontuário)
            rowData.prontuario = row.getAttribute('data-prontuario'); // Exemplo: armazenado como atributo `data-prontuario`
            rowData.paciente = row.getAttribute('data-paciente'); // Exemplo: armazenado como atributo `data-prontuario`
            rowData.localizacao = row.getAttribute('data-localizacao'); // Exemplo: armazenado como atributo `data-prontuario`
            rowData.cirurgiao = row.getAttribute('data-cirurgiao'); // Exemplo: armazenado como atributo `data-prontuario`
            
            // Para cada célula, atribui o valor à coluna correspondente
            cells.forEach((cell, index) => {
                if (index === 0) return;  // Ignorar a primeira célula (checkbox)
                
                // Usa a ordem das colunas no cabeçalho para capturar corretamente os dados
                const columnName = removeAccents(columnNames[index].textContent.trim().toLowerCase().replace(' ', '_'));
                rowData[columnName] = cell.textContent.trim();  // Captura o conteúdo da célula
            });

            // Adiciona o valor do enfermeiro específico ao objeto rowData
            rowData.enfermeiro = enfermeiro;

            // Adiciona a origem da tabela a partir do atributo 'data-origem-tabela' da linha
            rowData.origem_tabela = row.getAttribute('data-origem-tabela') || periodo;
            // Adiciona o atributo status com valor padrão "Pendente"
            rowData.status = row.getAttribute('data-status') || "Pendente";

            

            // Adiciona os dados da linha ao array de dados do período
            periodoData.push(rowData);
        });

        // Adiciona os dados da tabela para o período
        dataToSave[`dados_${periodo.toLowerCase()}`] = periodoData; 
    });

    // Validação dos dados antes de enviar
    if (Object.keys(dataToSave).length === 0) {
        console.log('Nenhum dado para salvar!');
        return;
    }

    // Salvar os dados de forma assíncrona
    setTimeout(() => {
        // Enviar os dados para o servidor usando fetch
        fetch('/salvar_dados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSave)  // Enviar os dados no formato correto
        })
        .then(response => response.json())
        .then(data => {
            console.log('Alterações salvas com sucesso!', data);
            // Nenhum feedback visível é mostrado
        })
        .catch(error => {
            console.error('Erro ao salvar os dados:', error);
            // Nenhum feedback de erro é mostrado
        });
    }, 0); // Executa o salvamento em segundo plano
}

// Função para remover acentos e deixar a string formatada
function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}







let origemTabela = null;

function abrirPopup() {
    const tabelas = ["manha", "tarde", "noite"];
    origemTabela = tabelas.find(t => document.querySelector(`#tabela_${t} tbody input[type='checkbox']:checked`));

    if (!origemTabela) {
        alert("Selecione uma linha para transferir.");
        return;
    }

    const select = document.getElementById("destinationSelect");
    select.innerHTML = "";

    tabelas.filter(t => t !== origemTabela).forEach(t => {
        const option = document.createElement("option");
        option.value = t;
        option.text = `Mapa da ${t.charAt(0).toUpperCase() + t.slice(1)}`;
        select.appendChild(option);
    });

    document.getElementById("popupTransferencia").style.display = "block";
}

function fecharPopup() {
    document.getElementById("popupTransferencia").style.display = "none";
}

document.getElementById("closePopup-trans").addEventListener("click", fecharPopup);


function confirmarTransferencia() {
    const destinoTabela = document.getElementById("destinationSelect").value;

    if (!destinoTabela || !origemTabela) {
        alert("Selecione um Mapa de Destino válido.");
        return;
    }

    const origemTableElement = document.getElementById(`tabela_${origemTabela}`);
    const destinoTableElement = document.getElementById(`tabela_${destinoTabela}`);

    const linhasSelecionadas = origemTableElement.querySelectorAll("tbody input[type='checkbox']:checked");

    linhasSelecionadas.forEach(checkbox => {
        const linha = checkbox.closest("tr");

        // Captura os dados da linha e define a origem_tabela
        let rowData = {};
        let cells = linha.querySelectorAll("td"); // Captura as células da linha
        const columnNames = origemTableElement.querySelectorAll("thead th");

        cells.forEach((cell, index) => {
            if (index === 0) return;  // Ignorar a primeira célula (checkbox)
            
            const columnName = removeAccents(columnNames[index].textContent.trim().toLowerCase().replace(' ', '_'));
            rowData[columnName] = cell.textContent.trim();
        });

        // Defina a origem da linha corretamente
        rowData.origem_tabela = origemTabela;
        linha.setAttribute('data-origem-tabela', origemTabela);

        // Move a linha para a tabela de destino
        destinoTableElement.querySelector("tbody").appendChild(linha);
        checkbox.checked = false;
    });

    // Aplicar a classe de destaque após a transferência de todas as linhas
    const linhasDestino = destinoTableElement.querySelectorAll("tbody tr");
    linhasDestino.forEach(linha => {
        const origemTabelaLinha = linha.getAttribute('data-origem-tabela');

        // Verifica se a origem_tabela da linha é diferente da tabela de destino
        if (origemTabelaLinha && origemTabelaLinha !== destinoTabela) {
            linha.classList.add(`destaque-${origemTabelaLinha}`);
            console.log(`Classe destaque-${origemTabelaLinha} adicionada à linha transferida.`);
        } else {
            // Se a origem_tabela for igual ao destinoTabela ou não estiver definida, remove qualquer classe de destaque
            linha.classList.remove(`destaque-${origemTabelaLinha}`);
        }
    });

    // Chama a função de salvar mudanças após aplicar as classes
    saveChanges();

    fecharPopup();
}










// Evento de Clique na tela de Edição para Atualizar o Mapa 
document.getElementById('atualizar_mapa').addEventListener('click', function() {
    // Envia a requisição POST para o servidor quando o botão for clicado
    fetch('/atualizar-mapa', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            console.log('Pedido de atualização de mapa enviado!');
            deselectAllRows();

            // Exibe uma mensagem de sucesso ao usuário
            const mensagemSucesso = document.createElement('div');
            mensagemSucesso.innerText = 'Atualização realizada com sucesso!';
            mensagemSucesso.style.position = 'fixed';
            mensagemSucesso.style.top = '50%';
            mensagemSucesso.style.left = '50%';
            mensagemSucesso.style.backgroundColor = '#006600';
            mensagemSucesso.style.transform = 'translate(-50%, -50%)';
            mensagemSucesso.style.color = 'white';
            mensagemSucesso.style.padding = '10px';
            mensagemSucesso.style.borderRadius = '5px';
            mensagemSucesso.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            document.body.appendChild(mensagemSucesso);

            // Remove a mensagem após 3 segundos
            setTimeout(() => {
                mensagemSucesso.remove();
            }, 3000);
        })
        .catch(error => {
            console.error('Erro ao atualizar o mapa:', error);
        });
});




 // Exibir o pop-up quando o botão de Controle de Visualização for clicado
 document.getElementById("btnControleVisualizacao").addEventListener("click", function() {
    document.getElementById("popupControleVisualizacao").style.display = "block";
});

 // Exibir o pop-up quando o botão de Controle de Visualização for clicado
 document.getElementById("botao_registro").addEventListener("click", function() {
    document.getElementById("popupRegistro").style.display = "block";
});

 




// Fechar o pop-up quando o 'X' for clicado
document.getElementById("closePopup").addEventListener("click", function() {
    document.getElementById("popupControleVisualizacao").style.display = "none";
    deselectAllRows();
});

// Fechar o pop-up quando o 'X' for clicado
document.getElementById("closePopup2").addEventListener("click", function() {
    document.getElementById("popupRegistro").style.display = "none";
    deselectAllRows();
});

// Fecha o modal ao clicar no "X"
document.getElementById('closePopup3').addEventListener('click', function() {
    document.getElementById('popupInfo').style.display = 'none';
    deselectAllRows();
});




// Envia a notificação de tabela ao servidor
function enviarNotificacao(tabela) {
    fetch('/controlar_visualizacao', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tabela: tabela })
    });
}

function atualizarVisualizacaoAutomatica(estadoCheckbox) {
    localStorage.setItem("visualizacaoAutomatica", estadoCheckbox);
    
    // Primeiro obtém a tabela atual
    fetch('/obter_tabela_atual')
        .then(response => response.json())
        .then(data => {
            const tabelaAtual = data.turno_atual;
            console.log("Tabela atual obtida:", tabelaAtual);
            
            // Depois envia o estado para o backend
            return fetch('/controlar_visualizacao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    visualizacaoAutomatica: estadoCheckbox,
                    tabela: tabelaAtual // Envia também a tabela atual
                }),
            });
        })
        .then(() => {
            console.log("Estado de notificação automática atualizado no backend");
            
            // Habilitar/desabilitar os radios com base no estado do checkbox
            document.querySelectorAll('input[name="visualizacao"]').forEach(radio => {
                radio.disabled = estadoCheckbox;
            });
            
            // Se estiver no modo automático, atualiza o radio selecionado
            if (estadoCheckbox) {
                fetch('/obter_tabela_atual')
                    .then(response => response.json())
                    .then(data => {
                        const tabelaAtual = data.tabela;
                        const radioId = "radio" + tabelaAtual.charAt(0).toUpperCase() + tabelaAtual.slice(1);
                        const radioElement = document.getElementById(radioId);
                        if (radioElement) {
                            radioElement.checked = true;
                            localStorage.setItem("radioSelecionado", radioId);
                        }
                    });
            }
        })
        .catch(err => console.error("Erro ao atualizar o estado:", err));
}

// Escuta alterações no checkbox
document.getElementById("autoViewCheckbox").addEventListener("change", function () {
    atualizarVisualizacaoAutomatica(this.checked);
});

// Recuperar o estado ao carregar a página
document.addEventListener("DOMContentLoaded", function() {
    let estadoCheckbox = localStorage.getItem("visualizacaoAutomatica");
    const estadoRadio = localStorage.getItem("radioSelecionado");
    const checkbox = document.getElementById("autoViewCheckbox");
    
    if (estadoCheckbox === null) {
        // Primeira execução: define como ativo por padrão
        estadoCheckbox = "true";
        localStorage.setItem("visualizacaoAutomatica", estadoCheckbox);
    }
    
    // Converte string para booleano
    const ativo = (estadoCheckbox === "true");
    
    // Marca/desmarca o checkbox na tela
    checkbox.checked = ativo;
    
    // Primeiro obtém a tabela atual
    fetch('/obter_tabela_atual')
        .then(response => response.json())
        .then(data => {
            const tabelaAtual = data.tabela;
            console.log("Tabela atual ao carregar:", tabelaAtual);
            
            // Atualiza o radio selecionado baseado na tabela atual
            const radioId = "radio" + tabelaAtual.charAt(0).toUpperCase() + tabelaAtual.slice(1);
            const radioElement = document.getElementById(radioId);
            
            if (radioElement) {
                radioElement.checked = true;
                localStorage.setItem("radioSelecionado", radioId);
            }
            
            // Chama backend automaticamente conforme estado
            atualizarVisualizacaoAutomatica(ativo);
        })
        .catch(err => console.error("Erro ao obter tabela atual:", err));
});

// Listener para os radios (Manhã, Tarde, Noite)
document.querySelectorAll('input[name="visualizacao"]').forEach(radio => {
    radio.addEventListener("change", function() {
        // Salva o estado do rádio no localStorage
        localStorage.setItem("radioSelecionado", this.id);
        
        // Envia a notificação de acordo com o rádio selecionado
        if (this.id === "radioManha") {
            enviarNotificacao("manha");
        } else if (this.id === "radioTarde") {
            enviarNotificacao("tarde");
        } else if (this.id === "radioNoite") {
            enviarNotificacao("noite");
        }
    });
});

function importarDadosVitae(event) {
    event.preventDefault();  // Impede o comportamento padrão do link

    const button = document.getElementById("importarDadosBtn");
    const originalContent = button.innerHTML; // Salva o conteúdo original

    // Altera o conteúdo do botão para incluir o spinner
    button.innerHTML = `
        <div class="loading-icon"></div>
        Carregando...
    `;
    button.disabled = true;  // Desativa o botão durante o carregamento
    deselectAllRows();
    
    // Variável para controlar se deve recarregar a página
    let shouldReload = true;
    
    // Envia a requisição para a rota de atualização
    fetch('/atualizar_dados')
        .then(response => {
            if (!response.ok) {
                // Tenta obter mais detalhes do erro se disponível
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
                }).catch(() => {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Verifica se a resposta tem uma propriedade de sucesso ou erro
            if (data.success === false || data.error) {
                throw new Error(data.error || data.message || 'Erro desconhecido na importação');
            }
            
            // Caso a importação seja bem-sucedida
            alert('Importação concluída com sucesso!');
            console.log('Dados importados:', data);
        })
        .catch(error => {
            // Caso ocorra um erro durante a importação
            console.error('Erro na importação:', error);
            
            // Impede o reload automático quando há erro
            shouldReload = false;
            
            // CHAMA A FUNÇÃO DO MODAL
            showErrorModal(error);
        })
        .finally(() => {
            // Restaura o conteúdo original do botão após a importação
            button.innerHTML = originalContent;
            button.disabled = false;  // Reativa o botão

            // Recarrega a página apenas se não houve erro
            if (shouldReload) {
                setTimeout(() => {
                    location.reload();
                }, 500);
            }
        });
}

function showErrorModal(error) {
    // Cria o modal
    const modal = document.createElement('div');
    modal.className = 'error-modal';
    
    // Corrige o problema de escapamento de caracteres e quebras de linha
    const safeErrorMessage = error.message ? error.message.replace(/'/g, "\\'") : 'Erro desconhecido';
    
    modal.innerHTML = `
        <div class="error-modal-content">
            <div class="error-modal-icon">⚠️</div>
            <h3 class="error-modal-title">Erro na Importação</h3>
            <p class="error-modal-message">
                Ocorreu um erro ao importar os dados do Vitae.
            </p>
            <p class="error-modal-details">
                ${safeErrorMessage}
            </p>
            <p class="error-modal-message">
                Se o problema persistir, entre em contato com o suporte.
            </p>
            <div class="error-modal-buttons">
                <button id="closeModalBtn" class="modal-close-btn">
                    Fechar
                </button>
                <button id="whatsappSupportBtn" class="modal-whatsapp-btn">
                    📱 Contatar Suporte
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Adiciona os event listeners após o modal ser criado
    document.getElementById('closeModalBtn').addEventListener('click', function() {
        modal.remove();
    });
    
    document.getElementById('whatsappSupportBtn').addEventListener('click', function() {
        openWhatsAppSupport(safeErrorMessage);
        modal.remove();
    });
}

function openWhatsAppSupport(errorMessage) {
    const phoneNumber = '5588999290293'; // SUBSTITUA pelo seu número
    const message = `Olá! Preciso de ajuda com a importação de dados do Vitae.\n\nErro: ${errorMessage}\n\nData: ${new Date().toLocaleString()}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}




function abrirMapa() {
       
    // Abre a URL em uma nova aba
    window.open("http://10.2.2.54:5050/mapa", "_blank", "fullscreen=yes, width=" + screen.width + ", height=" + screen.height);
}

function atualizarLinhaPorPeriodo() {
    const table = document.querySelector('.tabela[style="display: block;"]');
    const colorPicker = document.getElementById("colorPicker");
    const periodoSelecionado = colorPicker.value.toLowerCase();


    // Verifica se existe alguma tabela visível
    if (!table) {
        alert("Nenhuma tabela visível no momento. Verifique a exibição antes de aplicar o período.");
        colorPicker.value = "inicio"; // Reseta o select
        return;
    }

    const periodoTabela = table ? table.id.split("_")[1].toLowerCase() : null;

    if (periodoSelecionado === "none") {
        const linhasSelecionadas = table.querySelectorAll('.selected');
        if (linhasSelecionadas.length === 0) {
            alert("Selecione pelo menos uma linha antes de aplicar o período.");
            colorPicker.value = "inicio";
            return;
        }

        linhasSelecionadas.forEach((linhaSelecionada) => {
            linhaSelecionada.removeAttribute("data-origem-tabela");
            linhaSelecionada.classList.remove("destaque-manha", "destaque-tarde", "destaque-noite");

            const checkbox = linhaSelecionada.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = false;
            }

            linhaSelecionada.classList.remove("selected");
        });

        colorPicker.value = "inicio";

        console.log("Origem restaurada, classes removidas.");
        return;
    }

    const linhasSelecionadas = table.querySelectorAll('.selected');
    if (linhasSelecionadas.length === 0) {
        alert("Selecione pelo menos uma linha antes de aplicar o período.");
        colorPicker.value = "inicio";
        return;
    }

    linhasSelecionadas.forEach((linhaSelecionada) => {
        // Verifica o atributo "data-origem-tabela" da linha selecionada
        const origemTabelaAtual = linhaSelecionada.dataset.origemTabela 
            ? linhaSelecionada.dataset.origemTabela.toLowerCase() 
            : null;

        // Se a linha já pertence ao período selecionado, atualiza
        if (periodoTabela === periodoSelecionado) {
            linhaSelecionada.setAttribute("data-origem-tabela", periodoSelecionado);

            const checkbox = linhaSelecionada.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = false;
            }

            linhaSelecionada.classList.remove("destaque-manha", "destaque-tarde", "destaque-noite");
            linhaSelecionada.classList.remove("selected");
            return;
        }

        // Atualizar a origem_tabela no JSON e na linha
        linhaSelecionada.setAttribute("data-origem-tabela", periodoSelecionado);

        // Atualizar a classe de destaque na linha
        linhaSelecionada.classList.remove("destaque-manha", "destaque-tarde", "destaque-noite");
        linhaSelecionada.classList.add(`destaque-${periodoSelecionado}`);

        const checkbox = linhaSelecionada.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = false;
        }

        linhaSelecionada.classList.remove("selected");
    });

    console.log(`Linhas atualizadas para o período: ${periodoSelecionado}`);
    console.log("Linhas atualizadas com sucesso.");

    colorPicker.value = "inicio";
}


// Adicionar o evento ao select colorPicker
document.getElementById("colorPicker").addEventListener("change", () => {
    atualizarLinhaPorPeriodo();
    
});



// Função para remover acentos (utilizada para transformar o nome da coluna)
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}



// Variável para armazenar o valor original de origem_tabela
let origemTabelaOriginal = 'inicio';

// Seleciona o select pelo id
const select = document.getElementById("colorPicker");

// Adiciona um evento de mudança no select
select.addEventListener("change", function() {
    const selectedValue = select.value;

    // Verifica se a seleção foi "Limpar" (none)
    if (selectedValue === "none") {
        // Restaura o valor original de origem_tabela
        document.querySelectorAll('[data-origem-tabela]').forEach(item => {
            item.setAttribute('data-origem-tabela', origemTabelaOriginal);
            saveChanges();
        });
    } else if (selectedValue !== "inicio") {
        // Atualiza o valor de origem_tabela conforme a seleção
        origemTabelaOriginal = selectedValue;  // Atualiza o valor original
        document.querySelectorAll('[data-origem-tabela]').forEach(item => {
            item.setAttribute('data-origem-tabela', selectedValue);  // Define o novo valor
            saveChanges();
        });
    }

    saveChanges();
});



function atualizarLinhaPorStatus() {
    // Captura a tabela visível
    const table = document.querySelector('.tabela[style="display: block;"]');
    const colorPickerStatus = document.getElementById("colorPicker_status"); // Select para escolher o status
    const statusSelecionado = colorPickerStatus.value.toLowerCase(); // Garante que o valor seja em minúsculas

    // Verifica se existe alguma tabela visível
    if (!table) {
        alert("Nenhuma tabela visível no momento. Verifique a exibição antes de aplicar o Status.");
        colorPickerStatus.value = "inicio"; // Reseta o select
        return;
    }

    const periodoTabela = table ? table.id.split("_")[1].toLowerCase() : null;

    // Captura todas as linhas selecionadas
    const linhasSelecionadas = table.querySelectorAll('.selected');
    if (linhasSelecionadas.length === 0) {
        alert("Selecione pelo menos uma linha antes de aplicar o status.");
        colorPickerStatus.value = "inicio";
        return;
    }

    linhasSelecionadas.forEach((linhaSelecionada) => {
        // Captura a célula da coluna ID (segunda célula da linha, índice 1)
        const celulaID = linhaSelecionada.querySelector('td:nth-child(2)'); // Supondo que a segunda coluna seja ID

        if (statusSelecionado === "concluido") {
            linhaSelecionada.setAttribute("data-status", "Concluido"); // Atualiza o atributo no HTML
            linhaSelecionada.classList.add("destaque-concluido"); // Adiciona a classe de destaque à linha
            linhaSelecionada.classList.remove("destaque-manha", "destaque-tarde", "destaque-noite"); // Remove classes de períodos anteriores
            
            // Adiciona a classe de destaque à célula ID e atualiza o conteúdo da célula
            if (celulaID) {
                celulaID.textContent = "OK"; // Altera o conteúdo da célula ID para "OK"
            }

            // Move a linha para a última posição da tabela
            const tbody = linhaSelecionada.closest("tbody"); // Obtém o tbody da linha
            if (tbody) {
                tbody.appendChild(linhaSelecionada); // Move a linha para o final do tbody
            }

            const checkbox = linhaSelecionada.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = false;
            }

            linhaSelecionada.classList.remove("selected");
            // Atualiza o arquivo JSON com o valor "OK" no ID
            atualizarArquivoJSON(linhaSelecionada, "OK");

        } else if (statusSelecionado === "pendente") {
            linhaSelecionada.setAttribute("data-status", "Pendente"); // Atualiza o atributo no HTML
            linhaSelecionada.classList.remove("destaque-concluido"); // Remove o destaque de concluído
            if (celulaID) {
                celulaID.textContent = ""; // Limpa o conteúdo da célula ID
            }

            // Verifica o atributo "data-origem-tabela" da linha selecionada
            const origemTabela = linhaSelecionada.dataset.origemTabela 
                ? linhaSelecionada.dataset.origemTabela.toLowerCase() 
                : null;

            // Se o período da tabela atual for igual ao da origem da linha, remove todas as classes
            if (periodoTabela === origemTabela) {
                linhaSelecionada.classList.remove("destaque-manha", "destaque-tarde", "destaque-noite");
            } else {
                // Aplica o destaque correspondente ao período atual
                linhaSelecionada.classList.remove("destaque-manha", "destaque-tarde", "destaque-noite"); // Remove classes existentes
                linhaSelecionada.classList.add(`destaque-${origemTabela}`); // Aplica a nova classe
            }

            const checkbox = linhaSelecionada.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = false;
            }

            linhaSelecionada.classList.remove("selected");

            // Atualiza o arquivo JSON para remover a marcação "OK" no ID
            atualizarArquivoJSON(linhaSelecionada, null);

        } else if (statusSelecionado === "inicio") {
            // Reseta o status
            linhaSelecionada.removeAttribute("data-status", "data-origem-tabela");
            linhaSelecionada.classList.remove("destaque-concluido"); // Remove qualquer destaque da linha

            if (celulaID) {
                celulaID.textContent = ""; // Limpa o conteúdo da célula ID
            }

            // Atualiza o arquivo JSON para remover a marcação "OK" no ID
            atualizarArquivoJSON(linhaSelecionada, null);
        }

        console.log(`Linha atualizada para o status: ${statusSelecionado}`);
    });

    // Chama a função para salvar as alterações no backend
    saveChanges();

    // Restaura o valor de colorPicker_status para "inicio"
    colorPickerStatus.value = "inicio";
}


// Função para atualizar o atributo ID no arquivo JSON
function atualizarArquivoJSON(linha, valor) {
    const p = linha.querySelector('td:nth-child(2)').textContent; // Supondo que a coluna ID seja a segunda
    const dadosLinha = {
        p: p,
        status: linha.dataset.status,
        pAlterado: valor // Atribui "OK" ou null, dependendo do status
    };

    // Aqui você deveria implementar a lógica para atualizar o arquivo JSON no backend.
    // Por exemplo, você pode fazer uma requisição HTTP para atualizar o arquivo JSON no servidor.

    console.log("Atualizando JSON com: ", dadosLinha); // Apenas para mostrar o que seria enviado para o backend
}

// Adicionar o evento ao select colorPicker_status
document.getElementById("colorPicker_status").addEventListener("change", atualizarLinhaPorStatus);

















function clearTabelas() {
    var tabelas = document.getElementsByClassName("tabela");
    for (var i = 0; i < tabelas.length; i++) {
        tabelas[i].style.display = "none"; // Oculta todas as tabelas
    }
    document.getElementById("titulo_periodo").innerText = "";
    document.getElementById("contador_periodo").innerText = "";
    const checkbox = document.getElementById('visualizacaoAutomatica');

    // Limpa o intervalo ao ocultar as tabelas
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null; // Reinicializa a variável
        checkbox.checked = false;
    }
}

function apagaTabelas() {
    var tabelas = document.getElementsByClassName("tabela");

    for (var i = 0; i < tabelas.length; i++) {
        // Verifica se a tabela está sendo exibida (está visível)
        if (tabelas[i].style.display !== "none") {
            var tbody = tabelas[i].querySelector("tbody");
            var thead = tabelas[i].querySelector("thead");

            // Exibe a caixa de diálogo para confirmar a ação
            var confirmar = confirm("Você tem certeza que deseja apagar o conteúdo da tabela?");
            
            if (confirmar) {
                // Remove todas as linhas do corpo da tabela (tbody)
                while (tbody.firstChild) {
                    tbody.removeChild(tbody.firstChild);
                }

                // Atualiza o cabeçalho "Enfermeiro" para "Enfermeiro(a):"
                if (thead) {
                    let headerCell = thead.querySelector('.info-enfermeiro td');
                    if (headerCell) {
                        // Atualiza o texto existente no cabeçalho
                        headerCell.textContent = "Enfermeiro(a):";
                    } else {
                        // Cria um novo cabeçalho se não existir
                        let headerRow = document.createElement('tr');
                        headerRow.classList.add('info-enfermeiro');

                        headerCell = document.createElement('td');
                        headerCell.colSpan = 6; // Ajuste o colSpan conforme necessário
                        headerCell.textContent = "Enfermeiro(a):";
                        headerCell.contentEditable = "true";
                        headerCell.style.textAlign = 'center';
                        headerCell.style.fontWeight = 'bold';

                        headerRow.appendChild(headerCell);
                        thead.insertBefore(headerRow, thead.firstChild);
                    }
                }

                alert("Conteúdo apagado com sucesso!");
                saveChanges();
            } else {
                alert("Ação cancelada.");
                clearTabelas();
            }

            break; // Encerra o loop após processar a tabela visível
        }
    }
}










