const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('view'));

const perguntas = JSON.parse(fs.readFileSync('perguntas.json'));

let clientes = [];
let pontuacoes = {};
let indicePerguntaAtual = 0;

wss.on('connection', (ws) => {
  console.log('Novo jogador conectado');

  clientes.push(ws);

  ws.on('message', (mensagem) => {
    const dados = JSON.parse(mensagem);
    lidarComMensagem(ws, dados);
  });

  ws.on('close', () => {
    console.log('Jogador desconectado');
    clientes = clientes.filter(cliente => cliente !== ws);
  });

  enviarPergunta(ws);
});

function enviarPergunta(ws) {
  if (indicePerguntaAtual < perguntas.length) {
    const pergunta = perguntas[indicePerguntaAtual];
    ws.send(JSON.stringify({ tipo: 'pergunta', pergunta }));
  } else {
    ws.send(JSON.stringify({ tipo: 'fim' }));
  }
}

function lidarComMensagem(ws, dados) {
  const { tipo, nomeJogador, resposta } = dados;

  if (tipo === 'iniciar') {
    if (!pontuacoes[nomeJogador]) {
      pontuacoes[nomeJogador] = 0;
    }
    enviarPergunta(ws);
  }

  if (tipo === 'resposta') {
    const pergunta = perguntas[indicePerguntaAtual];

    if (pergunta && resposta === pergunta.correta) {
      pontuacoes[nomeJogador] += 1;
    }

    const respostaCliente = {
      tipo: 'resposta',
      nomeJogador,
      resposta,
      correta: pergunta && resposta === pergunta.correta,
      pergunta,
      pontuacoes
    };

    transmitir(respostaCliente);
    indicePerguntaAtual++; 

    if (indicePerguntaAtual < perguntas.length) {
      setTimeout(() => {
        clientes.forEach(cliente => enviarPergunta(cliente));
      }, 2000);
    } else {
      transmitir({ tipo: 'fim', pontuacoes });
    }
  }
}

function transmitir(mensagem) {
  clientes.forEach(cliente => cliente.send(JSON.stringify(mensagem)));
}

server.listen(3000, () => {
  console.log('Servidor está ouvindo na porta 3000');
});
