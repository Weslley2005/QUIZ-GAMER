const ws = new WebSocket('ws://localhost:3000');
const containerBoasVindas = document.getElementById('container-boas-vindas');
const botaoIniciar = document.getElementById('botao-iniciar');
const containerPergunta = document.getElementById('container-pergunta');
const elementoPergunta = document.getElementById('pergunta');
const elementoOpcoes = document.getElementById('opcoes');
const elementoPontuacoes = document.getElementById('pontuacoes');
const feedbackDiv = document.getElementById('feedback');
const inputNomeJogador = document.getElementById('nome-jogador');

let nomeJogador = '';

botaoIniciar.addEventListener('click', () => {
  nomeJogador = inputNomeJogador.value.trim();
  if (nomeJogador) {
    containerBoasVindas.style.display = 'none';
    containerPergunta.style.display = 'block';
    elementoPontuacoes.parentElement.style.display = 'block';
    iniciarQuiz();
  } else {
    alert('Por favor, digite o nome para iniciar o quiz.');
  }
});

ws.onmessage = (evento) => {
  const dados = JSON.parse(evento.data);

  if (dados.tipo === 'pergunta') {
    mostrarPergunta(dados.pergunta);
  } else if (dados.tipo === 'resposta') {
    console.log('Resposta recebida:', dados);
    atualizarPontuacoes(dados.pontuacoes);
    mostrarFeedback(dados.nomeJogador, dados.resposta, dados.pergunta, dados.correta);
  } else if (dados.tipo === 'fim') {
    mostrarPontuacoesFinais(dados.pontuacoes);
  }
};

function iniciarQuiz() {
  ws.send(JSON.stringify({ tipo: 'iniciar', nomeJogador }));
}

function mostrarPergunta(pergunta) {
  elementoPergunta.textContent = pergunta.pergunta;
  elementoOpcoes.innerHTML = '';

  const divOpcoes = document.createElement('div');

  pergunta.opcoes.forEach(opcao => {
    const botao = document.createElement('button');
    botao.textContent = opcao;
    botao.onclick = () => enviarResposta(opcao);
    divOpcoes.appendChild(botao);
    divOpcoes.appendChild(document.createElement('br'));
  });

  elementoOpcoes.appendChild(divOpcoes);
}

function enviarResposta(resposta) {
  ws.send(JSON.stringify({ tipo: 'resposta', nomeJogador, resposta }));
}

function atualizarPontuacoes(pontuacoes) {
  const pontuacoesArray = Object.entries(pontuacoes).map(([jogador, pontuacao]) => ({ jogador, pontuacao }));

  pontuacoesArray.sort((a, b) => b.pontuacao - a.pontuacao);

  elementoPontuacoes.innerHTML = '';
  pontuacoesArray.forEach(({ jogador, pontuacao }) => {
    const li = document.createElement('li');
    li.textContent = `${jogador}: ${pontuacao}`;
    elementoPontuacoes.appendChild(li);
  });
}

function mostrarPontuacoesFinais(pontuacoes) {
  containerPergunta.innerHTML = '<h2>Fim do Jogo</h2>';
  atualizarPontuacoes(pontuacoes);
}

function mostrarFeedback(nomeJogador, resposta, pergunta, correta) {
  console.log('Mostrando feedback');
  feedbackDiv.innerHTML = `
    <h2>${nomeJogador}: ${correta ? 'ACERTOU!' : 'ERROU!'}!</h2>
    <p>Respondeu: ${resposta}</p>
    <p>Resposta correta: ${pergunta.correta}</p>
  `;
  feedbackDiv.style.backgroundColor = correta ? 'green' : 'red';
  feedbackDiv.style.display = 'block';

  setTimeout(() => {
    feedbackDiv.style.display = 'none';
  }, 5000);
}
