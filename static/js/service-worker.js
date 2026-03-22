// Intervalo para verificar o turno
const intervaloVerificacao = 10 * 1000; // 10 segundos

// Função para verificar e enviar notificação
async function verificarTurno() {
    const horaAtual = new Date().getHours();
    let turno;

    if (horaAtual >= 7 && horaAtual < 13) {
        turno = "manha";
    } else if (horaAtual >= 13 && horaAtual < 19) {
        turno = "tarde";
    } else {
        turno = "noite";
    }

    // Enviar para o servidor
    await fetch('/controlar_visualizacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabela: turno }),
    });
}

// Inicializa o intervalo
setInterval(verificarTurno, intervaloVerificacao);
