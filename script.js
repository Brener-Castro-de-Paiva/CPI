'use strict';

const CONFIG = {
  inicio: '2026-08-20T00:00:00',
  fim: '2026-11-18T23:59:59'
};

const CHAVE_ATIVIDADES = 'cpiRoseiraAtividades';
const CHAVE_PROGRESSO = 'cpiRoseiraProgressoTrabalhos';


function $(seletor) {
  return document.querySelector(seletor);
}


function formatarData(data) {
  return new Intl.DateTimeFormat('pt-BR').format(data);
}


function formatarDataTexto(dataISO) {
  if (!dataISO) {
    return 'Data não informada';
  }

  const partes = dataISO.split('-');

  if (partes.length !== 3) {
    return dataISO;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo);
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function lerStorage(chave, valorPadrao) {
  try {
    const valor = localStorage.getItem(chave);

    return valor !== null
      ? JSON.parse(valor)
      : valorPadrao;

  } catch (erro) {
    console.error('Erro ao ler localStorage:', erro);
    return valorPadrao;
  }
}


function salvarStorage(chave, valor) {
  try {
    localStorage.setItem(
      chave,
      JSON.stringify(valor)
    );

  } catch (erro) {
    console.error('Erro ao salvar localStorage:', erro);
  }
}


/* =========================================================
   PRAZO TOTAL DA CPI
========================================================= */

function atualizarPrazo() {
  const inicio = new Date(CONFIG.inicio);
  const fim = new Date(CONFIG.fim);
  const agora = new Date();

  const totalMs =
    fim.getTime() - inicio.getTime();

  const decorridoMs = limitar(
    agora.getTime() - inicio.getTime(),
    0,
    totalMs
  );

  const percentual =
    totalMs > 0
      ? (decorridoMs / totalMs) * 100
      : 0;

  const umDia =
    1000 * 60 * 60 * 24;

  const totalDias =
    Math.ceil(totalMs / umDia);

  const diasDecorridos =
    agora < inicio
      ? 0
      : Math.floor(decorridoMs / umDia);

  let diasRestantes;

  if (agora < inicio) {
    diasRestantes = totalDias;

  } else {
    diasRestantes = Math.max(
      0,
      Math.ceil(
        (fim.getTime() - agora.getTime()) / umDia
      )
    );
  }

  const dataInicio = $('#dataInicio');
  const dataAtual = $('#dataAtual');
  const dataFim = $('#dataFim');
  const percentualPrazo = $('#percentualPrazo');
  const barraPrazo = $('#barraPrazo');
  const diasDecorridosEl = $('#diasDecorridos');
  const diasRestantesEl = $('#diasRestantes');
  const statusPrazo = $('#statusPrazo');

  if (dataInicio) {
    dataInicio.textContent = formatarData(inicio);
  }

  if (dataAtual) {
    dataAtual.textContent = formatarData(agora);
  }

  if (dataFim) {
    dataFim.textContent = formatarData(fim);
  }

  if (percentualPrazo) {
    percentualPrazo.textContent =
      percentual.toFixed(1) + '%';
  }

  if (barraPrazo) {
    barraPrazo.style.width =
      percentual + '%';
  }

  if (diasDecorridosEl) {
    diasDecorridosEl.textContent =
      `${diasDecorridos} dias decorridos`;
  }

  if (diasRestantesEl) {
    diasRestantesEl.textContent =
      `${diasRestantes} dias restantes`;
  }

  if (statusPrazo) {
    if (agora < inicio) {
      statusPrazo.textContent =
        'Ainda não iniciado';

    } else if (agora > fim) {
      statusPrazo.textContent =
        'Prazo encerrado';

    } else {
      statusPrazo.textContent =
        'Em andamento';
    }
  }
}


/* =========================================================
   PROGRESSO MANUAL DOS TRABALHOS
========================================================= */

function definirProgresso(valor) {
  const numero = limitar(
    Number(valor) || 0,
    0,
    100
  );

  const range =
    $('#progressoManual');

  const numeroInput =
    $('#progressoNumero');

  const barra =
    $('#barraTrabalho');

  const badge =
    $('#percentualTrabalhoBadge');

  if (range) {
    range.value = numero;
  }

  if (numeroInput) {
    numeroInput.value = numero;
  }

  if (barra) {
    barra.style.width =
      numero + '%';
  }

  if (badge) {
    badge.textContent =
      numero + '%';
  }

  salvarStorage(
    CHAVE_PROGRESSO,
    numero
  );
}


/* =========================================================
   ATIVIDADES
========================================================= */

function obterAtividades() {
  return lerStorage(
    CHAVE_ATIVIDADES,
    []
  );
}


function salvarAtividades(atividades) {
  salvarStorage(
    CHAVE_ATIVIDADES,
    atividades
  );
}


/* =========================================================
   CRIA UMA ATIVIDADE NA TELA
   SEM EDIÇÃO E SEM EXCLUSÃO
========================================================= */

function criarCardAtividade(atividade) {
  const card =
    document.createElement('article');

  card.className =
    'atividade-card atividade-bloqueada';


  const topo =
    document.createElement('div');

  topo.className =
    'atividade-topo';


  const titulo =
    document.createElement('h3');

  titulo.className =
    'atividade-titulo';

  titulo.textContent =
    atividade.titulo;


  const meta =
    document.createElement('div');

  meta.className =
    'atividade-meta';


  const data =
    document.createElement('span');

  data.className =
    'atividade-data';

  data.textContent =
    formatarDataTexto(
      atividade.data
    );


  const status =
    document.createElement('span');

  status.className =
    'atividade-status';

  status.textContent =
    atividade.status;


  const statusClasse =
    atividade.status
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');

  status.classList.add(
    'status-' + statusClasse
  );


  meta.appendChild(data);
  meta.appendChild(status);


  topo.appendChild(titulo);
  topo.appendChild(meta);


  const descricao =
    document.createElement('p');

  descricao.className =
    'atividade-descricao';

  descricao.textContent =
    atividade.descricao || '';


  card.appendChild(topo);

  if (atividade.descricao) {
    card.appendChild(descricao);
  }


  /*
    Importante:
    não existe botão de editar
    e não existe botão de excluir.
  */

  return card;
}


/* =========================================================
   EXIBIR ATIVIDADES
========================================================= */

function carregarAtividades() {
  const lista =
    $('#listaAtividades');

  const semAtividades =
    $('#semAtividades');

  if (!lista) {
    return;
  }

  lista.innerHTML = '';

  const atividades =
    obterAtividades();


  atividades.sort(
    function (a, b) {
      return new Date(a.data) -
             new Date(b.data);
    }
  );


  atividades.forEach(
    function (atividade) {
      lista.appendChild(
        criarCardAtividade(atividade)
      );
    }
  );


  if (semAtividades) {
    semAtividades.hidden =
      atividades.length > 0;
  }
}


/* =========================================================
   INCLUSÃO DE NOVA ATIVIDADE
========================================================= */

function adicionarAtividade() {
  const titulo =
    $('#novaAtividadeTitulo');

  const data =
    $('#novaAtividadeData');

  const status =
    $('#novaAtividadeStatus');

  const descricao =
    $('#novaAtividadeDescricao');


  if (!titulo || !data || !status) {
    console.error(
      'Campos do formulário não encontrados.'
    );

    return;
  }


  const tituloValor =
    titulo.value.trim();

  const dataValor =
    data.value;

  const statusValor =
    status.value;

  const descricaoValor =
    descricao
      ? descricao.value.trim()
      : '';


  if (!tituloValor) {
    alert(
      'Informe o nome da atividade.'
    );

    titulo.focus();
    return;
  }


  if (!dataValor) {
    alert(
      'Informe a data da atividade.'
    );

    data.focus();
    return;
  }


  const novaAtividade = {
    id: Date.now(),
    titulo: tituloValor,
    data: dataValor,
    status: statusValor,
    descricao: descricaoValor,
    criadaEm:
      new Date().toISOString()
  };


  const atividades =
    obterAtividades();


  atividades.push(
    novaAtividade
  );


  salvarAtividades(
    atividades
  );


  /*
    Limpa o formulário depois
    da inclusão.
  */

  titulo.value = '';
  data.value = '';

  if (descricao) {
    descricao.value = '';
  }


  carregarAtividades();
}


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventos() {
  const botaoAdicionar =
    $('#adicionarAtividade');

  const progressoManual =
    $('#progressoManual');

  const progressoNumero =
    $('#progressoNumero');


  if (botaoAdicionar) {
    botaoAdicionar.addEventListener(
      'click',
      function (evento) {
        evento.preventDefault();

        adicionarAtividade();
      }
    );
  }


  if (progressoManual) {
    progressoManual.addEventListener(
      'input',
      function () {
        definirProgresso(
          progressoManual.value
        );
      }
    );
  }


  if (progressoNumero) {
    progressoNumero.addEventListener(
      'input',
      function () {
        definirProgresso(
          progressoNumero.value
        );
      }
    );
  }
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

function iniciarPagina() {
  atualizarPrazo();

  const progressoSalvo =
    lerStorage(
      CHAVE_PROGRESSO,
      0
    );

  definirProgresso(
    progressoSalvo
  );

  carregarAtividades();

  configurarEventos();


  setInterval(
    atualizarPrazo,
    60 * 60 * 1000
  );
}


/* =========================================================
   INICIA APÓS CARREGAMENTO DO HTML
========================================================= */

if (
  document.readyState === 'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    iniciarPagina
  );

} else {
  iniciarPagina();
}