'use strict';

/* =========================================================
   CONFIGURAÇÃO DO PRAZO DA CPI
========================================================= */

const CONFIG = {
  inicio: '2026-08-20T00:00:00',
  fim: '2026-11-18T23:59:59'
};

const CHAVE_ATIVIDADES = 'cpiRoseiraAtividades';
const CHAVE_PROGRESSO = 'cpiRoseiraProgresso';


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function $(seletor) {
  return document.querySelector(seletor);
}

function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo);
}

function formatarData(data) {
  return new Intl.DateTimeFormat('pt-BR').format(data);
}

function formatarDataISO(dataISO) {
  if (!dataISO) return '';

  const partes = dataISO.split('-');

  if (partes.length !== 3) {
    return dataISO;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function lerStorage(chave, valorPadrao) {
  try {
    const valor = localStorage.getItem(chave);

    if (valor === null) {
      return valorPadrao;
    }

    return JSON.parse(valor);

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

  const total = fim.getTime() - inicio.getTime();

  let decorrido = agora.getTime() - inicio.getTime();

  decorrido = limitar(
    decorrido,
    0,
    total
  );

  const percentual =
    total > 0
      ? (decorrido / total) * 100
      : 0;

  const umDia =
    1000 * 60 * 60 * 24;


  const diasDecorridos =
    agora < inicio
      ? 0
      : Math.floor(decorrido / umDia);


  const diasRestantes =
    agora >= fim
      ? 0
      : Math.max(
          0,
          Math.ceil(
            (fim.getTime() - agora.getTime()) / umDia
          )
        );


  const dataInicio = $('#dataInicio');
  const dataAtual = $('#dataAtual');
  const dataFim = $('#dataFim');

  const percentualPrazo =
    $('#percentualPrazo');

  const barraPrazo =
    $('#barraPrazo');

  const diasDecorridosEl =
    $('#diasDecorridos');

  const diasRestantesEl =
    $('#diasRestantes');

  const statusPrazo =
    $('#statusPrazo');


  if (dataInicio) {
    dataInicio.textContent =
      formatarData(inicio);
  }

  if (dataAtual) {
    dataAtual.textContent =
      formatarData(agora);
  }

  if (dataFim) {
    dataFim.textContent =
      formatarData(fim);
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
      diasDecorridos + ' dias decorridos';
  }

  if (diasRestantesEl) {
    diasRestantesEl.textContent =
      diasRestantes + ' dias restantes';
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
   BARRA MANUAL DO CRONOGRAMA
========================================================= */

function atualizarProgressoManual(valor) {

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
   ABRIR FORMULÁRIO PARA NOVA ATIVIDADE
========================================================= */

function abrirFormularioAtividade() {

  /*
    Impede abrir mais de um formulário.
  */

  if ($('#formNovaAtividade')) {
    return;
  }


  const lista =
    $('#listaAtividades');

  if (!lista) {

    alert(
      'Não foi possível localizar a área de atividades.'
    );

    return;
  }


  const formulario =
    document.createElement('div');

  formulario.id =
    'formNovaAtividade';

  formulario.className =
    'form-nova-atividade';


  formulario.innerHTML = `

    <div class="form-atividade-cabecalho">

      <h3>Nova atividade</h3>

      <button
        type="button"
        id="cancelarNovaAtividade"
        class="btn-cancelar-atividade"
        title="Cancelar"
      >
        ×
      </button>

    </div>


    <div class="campo-atividade">

      <label for="novaAtividadeTitulo">
        Atividade
      </label>

      <input
        type="text"
        id="novaAtividadeTitulo"
        placeholder="Ex.: Solicitação de documentos"
        autocomplete="off"
      >

    </div>


    <div class="campo-atividade">

      <label for="novaAtividadeData">
        Data
      </label>

      <input
        type="date"
        id="novaAtividadeData"
      >

    </div>


    <div class="campo-atividade">

      <label for="novaAtividadeStatus">
        Status
      </label>

      <select id="novaAtividadeStatus">

        <option value="Pendente">
          Pendente
        </option>

        <option value="Em andamento">
          Em andamento
        </option>

        <option value="Concluída">
          Concluída
        </option>

      </select>

    </div>


    <div class="campo-atividade">

      <label for="novaAtividadeDescricao">
        Observação
      </label>

      <textarea
        id="novaAtividadeDescricao"
        rows="4"
        placeholder="Descreva brevemente a atividade..."
      ></textarea>

    </div>


    <button
      type="button"
      id="salvarNovaAtividade"
      class="btn-salvar-atividade"
    >
      Salvar atividade
    </button>

  `;


  /*
    O formulário aparece antes da lista
    de atividades.
  */

  lista.parentNode.insertBefore(
    formulario,
    lista
  );


  const titulo =
    $('#novaAtividadeTitulo');

  if (titulo) {
    titulo.focus();
  }


  const cancelar =
    $('#cancelarNovaAtividade');

  if (cancelar) {

    cancelar.addEventListener(
      'click',
      function () {

        formulario.remove();

      }
    );

  }


  const salvar =
    $('#salvarNovaAtividade');

  if (salvar) {

    salvar.addEventListener(
      'click',
      salvarNovaAtividade
    );

  }

}


/* =========================================================
   SALVAR NOVA ATIVIDADE
========================================================= */

function salvarNovaAtividade() {

  const tituloInput =
    $('#novaAtividadeTitulo');

  const dataInput =
    $('#novaAtividadeData');

  const statusInput =
    $('#novaAtividadeStatus');

  const descricaoInput =
    $('#novaAtividadeDescricao');


  if (
    !tituloInput ||
    !dataInput ||
    !statusInput
  ) {

    alert(
      'Não foi possível localizar os campos do formulário.'
    );

    return;
  }


  const titulo =
    tituloInput.value.trim();

  const data =
    dataInput.value;

  const status =
    statusInput.value;

  const descricao =
    descricaoInput
      ? descricaoInput.value.trim()
      : '';


  if (!titulo) {

    alert(
      'Informe a atividade.'
    );

    tituloInput.focus();

    return;
  }


  if (!data) {

    alert(
      'Informe a data da atividade.'
    );

    dataInput.focus();

    return;
  }


  const novaAtividade = {

    id:
      Date.now(),

    titulo:
      titulo,

    data:
      data,

    status:
      status,

    descricao:
      descricao,

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


  const formulario =
    $('#formNovaAtividade');

  if (formulario) {
    formulario.remove();
  }


  carregarAtividades();

}


/* =========================================================
   CRIAR CARTÃO DA ATIVIDADE
   APENAS LEITURA
========================================================= */

function criarCardAtividade(atividade) {

  const card =
    document.createElement('article');

  card.className =
    'atividade-card';


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
    formatarDataISO(
      atividade.data
    );


  const status =
    document.createElement('span');

  status.className =
    'atividade-status';


  /*
    Cria classe CSS de acordo com o status.
  */

  const classeStatus =
    atividade.status
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');


  status.classList.add(
    'status-' + classeStatus
  );


  status.textContent =
    atividade.status;


  meta.appendChild(data);
  meta.appendChild(status);


  topo.appendChild(titulo);
  topo.appendChild(meta);


  card.appendChild(topo);


  if (atividade.descricao) {

    const descricao =
      document.createElement('p');

    descricao.className =
      'atividade-descricao';

    descricao.textContent =
      atividade.descricao;

    card.appendChild(
      descricao
    );

  }


  /*
    IMPORTANTE:

    Aqui NÃO existem:

    - botão editar;
    - botão excluir;
    - select de alteração;
    - botão alterar status.

    Após salva, a atividade fica
    somente para leitura.
  */


  return card;

}


/* =========================================================
   CARREGAR ATIVIDADES SALVAS
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


  /*
    Ordena cronologicamente.
  */

  atividades.sort(
    function (a, b) {

      return (
        new Date(a.data) -
        new Date(b.data)
      );

    }
  );


  atividades.forEach(
    function (atividade) {

      const card =
        criarCardAtividade(
          atividade
        );

      lista.appendChild(
        card
      );

    }
  );


  if (semAtividades) {

    semAtividades.hidden =
      atividades.length > 0;

  }

}


/* =========================================================
   CONFIGURAÇÃO DOS BOTÕES
========================================================= */

function configurarEventos() {

  /*
    BOTÃO + NOVA ATIVIDADE
  */

  const adicionarAtividade =
    $('#adicionarAtividade');


  if (adicionarAtividade) {

    adicionarAtividade.addEventListener(
      'click',
      function (evento) {

        evento.preventDefault();

        abrirFormularioAtividade();

      }
    );

  }


  /*
    BARRA MANUAL
  */

  const progressoManual =
    $('#progressoManual');

  const progressoNumero =
    $('#progressoNumero');


  if (progressoManual) {

    progressoManual.addEventListener(
      'input',
      function () {

        atualizarProgressoManual(
          progressoManual.value
        );

      }
    );

  }


  if (progressoNumero) {

    progressoNumero.addEventListener(
      'input',
      function () {

        atualizarProgressoManual(
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


  /*
    Recupera o percentual manual.
  */

  const progressoSalvo =
    lerStorage(
      CHAVE_PROGRESSO,
      0
    );


  atualizarProgressoManual(
    progressoSalvo
  );


  /*
    Carrega atividades existentes.
  */

  carregarAtividades();


  /*
    Configura os botões.
  */

  configurarEventos();


  /*
    Atualiza o prazo automaticamente.
  */

  setInterval(
    atualizarPrazo,
    60 * 60 * 1000
  );

}


/* =========================================================
   INICIAR SOMENTE APÓS CARREGAMENTO DO HTML
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