'use strict';

const CONFIG = {
  inicio: '2026-08-20T00:00:00',
  fim: '2026-11-18T23:59:59'
};

const chaveProgresso = 'cpiRoseiraProgressoTrabalhos';
const chaveAtividades = 'cpiRoseiraAtividades';

function $(seletor) {
  return document.querySelector(seletor);
}

function formatarData(data) {
  return new Intl.DateTimeFormat('pt-BR').format(data);
}

function limitar(valor, min, max) {
  return Math.min(Math.max(valor, min), max);
}

function lerLocalStorage(chave, valorPadrao) {
  try {
    const valor = localStorage.getItem(chave);
    return valor !== null ? valor : valorPadrao;
  } catch (erro) {
    console.warn('Não foi possível acessar o armazenamento local:', erro);
    return valorPadrao;
  }
}

function salvarLocalStorage(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
  } catch (erro) {
    console.warn('Não foi possível salvar no armazenamento local:', erro);
  }
}

function atualizarPrazo() {
  const inicio = new Date(CONFIG.inicio);
  const fim = new Date(CONFIG.fim);
  const agora = new Date();

  const total = fim.getTime() - inicio.getTime();
  const decorridoMs = limitar(agora.getTime() - inicio.getTime(), 0, total);
  const percentual = total > 0 ? (decorridoMs / total) * 100 : 0;

  const umDia = 1000 * 60 * 60 * 24;
  const diasDecorridos = Math.floor(decorridoMs / umDia);
  const diasRestantes = agora < inicio
    ? Math.ceil(total / umDia)
    : Math.max(0, Math.ceil((fim.getTime() - agora.getTime()) / umDia));

  const dataInicio = $('#dataInicio');
  const dataAtual = $('#dataAtual');
  const dataFim = $('#dataFim');
  const percentualPrazo = $('#percentualPrazo');
  const barraPrazo = $('#barraPrazo');
  const diasDecorridosEl = $('#diasDecorridos');
  const diasRestantesEl = $('#diasRestantes');
  const status = $('#statusPrazo');

  if (dataInicio) dataInicio.textContent = formatarData(inicio);
  if (dataAtual) dataAtual.textContent = formatarData(agora);
  if (dataFim) dataFim.textContent = formatarData(fim);
  if (percentualPrazo) percentualPrazo.textContent = percentual.toFixed(1) + '%';
  if (barraPrazo) barraPrazo.style.width = percentual + '%';
  if (diasDecorridosEl) {
    diasDecorridosEl.textContent = diasDecorridos + (diasDecorridos === 1 ? ' dia decorrido' : ' dias decorridos');
  }
  if (diasRestantesEl) {
    diasRestantesEl.textContent = diasRestantes + (diasRestantes === 1 ? ' dia restante' : ' dias restantes');
  }

  if (status) {
    if (agora < inicio) {
      status.textContent = 'Ainda não iniciado';
    } else if (agora > fim) {
      status.textContent = 'Prazo encerrado';
    } else {
      status.textContent = 'Em andamento';
    }
  }
}

function definirProgressoTrabalho(valor) {
  const numero = limitar(Number(valor) || 0, 0, 100);

  const progressoManual = $('#progressoManual');
  const progressoNumero = $('#progressoNumero');
  const barraTrabalho = $('#barraTrabalho');
  const percentualTrabalhoBadge = $('#percentualTrabalhoBadge');

  if (progressoManual) progressoManual.value = numero;
  if (progressoNumero) progressoNumero.value = numero;
  if (barraTrabalho) barraTrabalho.style.width = numero + '%';
  if (percentualTrabalhoBadge) percentualTrabalhoBadge.textContent = numero + '%';

  salvarLocalStorage(chaveProgresso, String(numero));
}

function obterAtividades() {
  try {
    return JSON.parse(lerLocalStorage(chaveAtividades, '[]')) || [];
  } catch (erro) {
    console.warn('Não foi possível carregar as atividades:', erro);
    return [];
  }
}

function salvarAtividades() {
  const cards = Array.from(document.querySelectorAll('.atividade-card'));

  const atividades = cards.map(function (card) {
    return {
      titulo: card.querySelector('.atividade-titulo').value.trim(),
      data: card.querySelector('.atividade-data').value,
      status: card.querySelector('.atividade-status').value,
      descricao: card.querySelector('.atividade-descricao').value.trim()
    };
  });

  salvarLocalStorage(chaveAtividades, JSON.stringify(atividades));
  atualizarMensagemVazia();
}

function atualizarMensagemVazia() {
  const semAtividades = $('#semAtividades');
  if (!semAtividades) return;

  const possuiAtividades = document.querySelectorAll('.atividade-card').length > 0;
  semAtividades.hidden = possuiAtividades;
}

function criarAtividade(dados) {
  dados = dados || {};

  const template = $('#atividadeTemplate');
  const lista = $('#listaAtividades');

  if (!template || !lista) return;

  const fragmento = template.content.cloneNode(true);
  const card = fragmento.querySelector('.atividade-card');

  if (!card) return;

  card.querySelector('.atividade-titulo').value = dados.titulo || 'Nova atividade';
  card.querySelector('.atividade-data').value = dados.data || '';
  card.querySelector('.atividade-status').value = dados.status || 'Pendente';
  card.querySelector('.atividade-descricao').value = dados.descricao || '';

  card.querySelectorAll('input, select, textarea').forEach(function (campo) {
    campo.addEventListener('input', salvarAtividades);
    campo.addEventListener('change', salvarAtividades);
  });

  const botaoRemover = card.querySelector('.remover-atividade');
  if (botaoRemover) {
    botaoRemover.addEventListener('click', function () {
      card.remove();
      salvarAtividades();
    });
  }

  lista.appendChild(fragmento);
  atualizarMensagemVazia();
}

function carregarAtividades() {
  obterAtividades().forEach(function (atividade) {
    criarAtividade(atividade);
  });
  atualizarMensagemVazia();
}

function iniciarPagina() {
  atualizarPrazo();
  definirProgressoTrabalho(lerLocalStorage(chaveProgresso, '0'));
  carregarAtividades();

  const progressoManual = $('#progressoManual');
  const progressoNumero = $('#progressoNumero');
  const adicionarAtividade = $('#adicionarAtividade');

  if (progressoManual) {
    progressoManual.addEventListener('input', function (evento) {
      definirProgressoTrabalho(evento.target.value);
    });
  }

  if (progressoNumero) {
    progressoNumero.addEventListener('input', function (evento) {
      definirProgressoTrabalho(evento.target.value);
    });
  }

  if (adicionarAtividade) {
    adicionarAtividade.addEventListener('click', function () {
      criarAtividade();
      salvarAtividades();
    });
  }

  setInterval(atualizarPrazo, 60 * 60 * 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarPagina);
} else {
  iniciarPagina();
}
