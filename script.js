'use strict';

/* =========================================================
   FIREBASE SDK
========================================================= */

import {
  initializeApp
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';

import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';


/* =========================================================
   CONFIGURAÇÃO FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyDDNJK6lQdCwwfkAlNTXjZZSGCWY1yyYF8",
  authDomain: "ceip-31aae.firebaseapp.com",
  projectId: "ceip-31aae",
  storageBucket: "ceip-31aae.firebasestorage.app",
  messagingSenderId: "398480411066",
  appId: "1:398480411066:web:9ef349268e6524e8fa3583",
  measurementId: "G-470PQTD7V7"
};


/* =========================================================
   ADMINISTRADOR
========================================================= */

const EMAIL_ADMIN =
  'breneradvocacia@gmail.com';


/* =========================================================
   INICIALIZAÇÃO FIREBASE
========================================================= */

const app =
  initializeApp(firebaseConfig);

const auth =
  getAuth(app);

const db =
  getFirestore(app);

const googleProvider =
  new GoogleAuthProvider();


/* =========================================================
   CONFIGURAÇÃO DA CPI
========================================================= */

const CONFIG = {
  inicio: '2026-08-20T00:00:00',
  fim: '2026-11-18T23:59:59'
};


/* =========================================================
   FIRESTORE
========================================================= */

const atividadesRef =
  collection(
    db,
    'atividades'
  );

const progressoRef =
  doc(
    db,
    'configuracoes',
    'progresso'
  );


/* =========================================================
   CONTROLE
========================================================= */

let painelIniciado = false;

let unsubscribeAtividades = null;

let usuarioEhAdmin = false;


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function $(seletor) {
  return document.querySelector(seletor);
}


function limitar(
  valor,
  minimo,
  maximo
) {
  return Math.min(
    Math.max(
      valor,
      minimo
    ),
    maximo
  );
}


function formatarData(data) {
  return new Intl.DateTimeFormat(
    'pt-BR'
  ).format(data);
}


function formatarDataISO(dataISO) {

  if (!dataISO) {
    return '';
  }

  const partes =
    dataISO.split('-');

  if (partes.length !== 3) {
    return dataISO;
  }

  return (
    partes[2] +
    '/' +
    partes[1] +
    '/' +
    partes[0]
  );
}


/* =========================================================
   CRIAR ELEMENTO SEGURO
========================================================= */

function criarElementoTexto(
  tag,
  classe,
  texto
) {

  const elemento =
    document.createElement(tag);

  if (classe) {
    elemento.className =
      classe;
  }

  elemento.textContent =
    texto || '';

  return elemento;
}


/* =========================================================
   VERIFICAR ADMINISTRADOR
========================================================= */

function verificarAdministrador(usuario) {

  if (!usuario) {
    usuarioEhAdmin = false;
    return false;
  }

  const email =
    (usuario.email || '')
      .toLowerCase();

  usuarioEhAdmin =
    email ===
    EMAIL_ADMIN.toLowerCase();

  return usuarioEhAdmin;
}


/* =========================================================
   AJUSTAR INTERFACE CONFORME PERFIL
========================================================= */

function aplicarPermissoesInterface() {

  const botaoAdicionar =
    $('#adicionarAtividade');

  const progressoManual =
    $('#progressoManual');

  const progressoNumero =
    $('#progressoNumero');

  const ajuda =
    document.querySelector(
      '.controle-manual .ajuda'
    );


  if (botaoAdicionar) {

    botaoAdicionar.hidden =
      !usuarioEhAdmin;

  }


  if (progressoManual) {

    progressoManual.disabled =
      !usuarioEhAdmin;

  }


  if (progressoNumero) {

    progressoNumero.disabled =
      !usuarioEhAdmin;

  }


  if (ajuda) {

    if (usuarioEhAdmin) {

      ajuda.textContent =
        'O percentual é salvo no Firebase e sincronizado entre os dispositivos.';

    } else {

      ajuda.textContent =
        'Modo de visualização. Somente o administrador pode alterar o progresso.';

    }

  }

}


/* =========================================================
   LOGIN
========================================================= */

async function entrarComGoogle() {

  try {

    await signInWithPopup(
      auth,
      googleProvider
    );

  } catch (erro) {

    console.error(
      'Erro no login:',
      erro
    );

    alert(
      'Não foi possível entrar com a conta Google.'
    );

  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function sairDaConta() {

  try {

    await signOut(auth);

  } catch (erro) {

    console.error(
      'Erro ao sair:',
      erro
    );

  }

}


/* =========================================================
   AUTENTICAÇÃO
========================================================= */

onAuthStateChanged(
  auth,
  async function (usuario) {

    const telaLogin =
      $('#telaLogin');

    const conteudo =
      $('#conteudoProtegido');


    if (usuario) {

      verificarAdministrador(
        usuario
      );


      if (telaLogin) {

        telaLogin.hidden =
          true;

      }


      if (conteudo) {

        conteudo.hidden =
          false;

      }


      aplicarPermissoesInterface();


      await iniciarPainel();

    }

    else {

      usuarioEhAdmin =
        false;


      if (conteudo) {

        conteudo.hidden =
          true;

      }


      if (telaLogin) {

        telaLogin.hidden =
          false;

      }


      painelIniciado =
        false;


      if (unsubscribeAtividades) {

        unsubscribeAtividades();

        unsubscribeAtividades =
          null;

      }

    }

  }
);


/* =========================================================
   PRAZO TOTAL
========================================================= */

function atualizarPrazo() {

  const inicio =
    new Date(
      CONFIG.inicio
    );

  const fim =
    new Date(
      CONFIG.fim
    );

  const agora =
    new Date();


  const total =
    fim.getTime() -
    inicio.getTime();


  let decorrido =
    agora.getTime() -
    inicio.getTime();


  decorrido =
    limitar(
      decorrido,
      0,
      total
    );


  const percentual =
    total > 0
      ? (
          decorrido /
          total
        ) * 100
      : 0;


  const umDia =
    1000 *
    60 *
    60 *
    24;


  const diasDecorridos =
    agora < inicio
      ? 0
      : Math.floor(
          decorrido /
          umDia
        );


  const diasRestantes =
    agora >= fim
      ? 0
      : Math.max(
          0,
          Math.ceil(
            (
              fim.getTime() -
              agora.getTime()
            ) /
            umDia
          )
        );


  if ($('#dataInicio')) {

    $('#dataInicio').textContent =
      formatarData(inicio);

  }


  if ($('#dataAtual')) {

    $('#dataAtual').textContent =
      formatarData(agora);

  }


  if ($('#dataFim')) {

    $('#dataFim').textContent =
      formatarData(fim);

  }


  if ($('#percentualPrazo')) {

    $('#percentualPrazo').textContent =
      percentual.toFixed(1) +
      '%';

  }


  if ($('#barraPrazo')) {

    $('#barraPrazo').style.width =
      percentual + '%';

  }


  if ($('#diasDecorridos')) {

    $('#diasDecorridos').textContent =
      diasDecorridos +
      (
        diasDecorridos === 1
          ? ' dia decorrido'
          : ' dias decorridos'
      );

  }


  if ($('#diasRestantes')) {

    $('#diasRestantes').textContent =
      diasRestantes +
      (
        diasRestantes === 1
          ? ' dia restante'
          : ' dias restantes'
      );

  }


  if ($('#statusPrazo')) {

    if (agora < inicio) {

      $('#statusPrazo').textContent =
        'Ainda não iniciado';

    }

    else if (agora > fim) {

      $('#statusPrazo').textContent =
        'Prazo encerrado';

    }

    else {

      $('#statusPrazo').textContent =
        'Em andamento';

    }

  }

}


/* =========================================================
   PROGRESSO
========================================================= */

function mostrarProgresso(valor) {

  const numero =
    limitar(
      Number(valor) || 0,
      0,
      100
    );


  if ($('#progressoManual')) {

    $('#progressoManual').value =
      numero;

  }


  if ($('#progressoNumero')) {

    $('#progressoNumero').value =
      numero;

  }


  if ($('#barraTrabalho')) {

    $('#barraTrabalho').style.width =
      numero + '%';

  }


  if ($('#percentualTrabalhoBadge')) {

    $('#percentualTrabalhoBadge')
      .textContent =
      numero + '%';

  }

}


/* =========================================================
   CARREGAR PROGRESSO
========================================================= */

async function carregarProgresso() {

  try {

    const snapshot =
      await getDoc(
        progressoRef
      );


    if (snapshot.exists()) {

      mostrarProgresso(
        snapshot.data()
          .percentual || 0
      );

    } else {

      mostrarProgresso(0);

    }

  } catch (erro) {

    console.error(
      'Erro ao carregar progresso:',
      erro
    );

  }

}


/* =========================================================
   SALVAR PROGRESSO
========================================================= */

async function salvarProgresso(
  valor
) {

  if (!usuarioEhAdmin) {

    alert(
      'Somente o administrador pode alterar o progresso.'
    );

    return;
  }


  const percentual =
    limitar(
      Number(valor) || 0,
      0,
      100
    );


  mostrarProgresso(
    percentual
  );


  try {

    await setDoc(
      progressoRef,
      {

        percentual,

        atualizadoEm:
          serverTimestamp(),

        atualizadoPor:
          auth.currentUser
            ? auth.currentUser.email
            : null

      },
      {
        merge: true
      }
    );

  } catch (erro) {

    console.error(
      'Erro ao salvar progresso:',
      erro
    );


    alert(
      'Não foi possível salvar o progresso.'
    );

  }

}


/* =========================================================
   NOVA ATIVIDADE
========================================================= */

function abrirFormularioAtividade() {

  if (!usuarioEhAdmin) {

    alert(
      'Somente o administrador pode incluir atividades.'
    );

    return;
  }


  if ($('#formNovaAtividade')) {
    return;
  }


  if ($('#formEditarAtividade')) {
    return;
  }


  const lista =
    $('#listaAtividades');


  if (!lista) {
    return;
  }


  const formulario =
    document.createElement(
      'div'
    );


  formulario.id =
    'formNovaAtividade';


  formulario.className =
    'form-nova-atividade';


  formulario.innerHTML = `

    <div class="form-atividade-cabecalho">

      <h3>
        Nova atividade
      </h3>

      <button
        id="cancelarNovaAtividade"
        type="button"
        class="btn-cancelar-atividade"
      >
        ×
      </button>

    </div>


    <div class="campo-atividade">

      <label for="novaAtividadeTitulo">
        Atividade
      </label>

      <input
        id="novaAtividadeTitulo"
        type="text"
        maxlength="200"
      >

    </div>


    <div class="campo-atividade">

      <label for="novaAtividadeData">
        Data
      </label>

      <input
        id="novaAtividadeData"
        type="date"
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
        maxlength="2000"
      ></textarea>

    </div>


    <button
      id="salvarNovaAtividade"
      type="button"
      class="btn-salvar-atividade"
    >
      Salvar atividade
    </button>

  `;


  lista.parentNode.insertBefore(
    formulario,
    lista
  );


  $('#cancelarNovaAtividade')
    .addEventListener(
      'click',
      function () {

        formulario.remove();

      }
    );


  $('#salvarNovaAtividade')
    .addEventListener(
      'click',
      salvarNovaAtividade
    );


  $('#novaAtividadeTitulo')
    .focus();

}


/* =========================================================
   SALVAR ATIVIDADE
========================================================= */

async function salvarNovaAtividade() {

  if (!usuarioEhAdmin) {
    return;
  }


  const titulo =
    $('#novaAtividadeTitulo')
      .value
      .trim();


  const data =
    $('#novaAtividadeData')
      .value;


  const status =
    $('#novaAtividadeStatus')
      .value;


  const descricao =
    $('#novaAtividadeDescricao')
      .value
      .trim();


  if (!titulo) {

    alert(
      'Informe a atividade.'
    );

    return;

  }


  if (!data) {

    alert(
      'Informe a data.'
    );

    return;

  }


  try {

    await addDoc(
      atividadesRef,
      {

        titulo,

        data,

        status,

        descricao,

        criadaEm:
          serverTimestamp(),

        atualizadaEm:
          null,

        criadoPor:
          auth.currentUser
            ? auth.currentUser.email
            : null

      }
    );


    $('#formNovaAtividade')
      .remove();


  } catch (erro) {

    console.error(
      'Erro ao salvar atividade:',
      erro
    );


    alert(
      'Não foi possível salvar a atividade.'
    );

  }

}


/* =========================================================
   ABRIR EDIÇÃO
========================================================= */

function abrirEdicao(
  id,
  atividade
) {

  if (!usuarioEhAdmin) {

    alert(
      'Somente o administrador pode editar atividades.'
    );

    return;
  }


  if ($('#formEditarAtividade')) {
    return;
  }


  const formularioNova =
    $('#formNovaAtividade');


  if (formularioNova) {
    formularioNova.remove();
  }


  const lista =
    $('#listaAtividades');


  const formulario =
    document.createElement(
      'div'
    );


  formulario.id =
    'formEditarAtividade';


  formulario.className =
    'form-nova-atividade';


  formulario.innerHTML = `

    <div class="form-atividade-cabecalho">

      <h3>
        Editar atividade
      </h3>

      <button
        id="cancelarEdicaoAtividade"
        type="button"
        class="btn-cancelar-atividade"
      >
        ×
      </button>

    </div>


    <div class="campo-atividade">

      <label>
        Atividade
      </label>

      <input
        id="editarTitulo"
        type="text"
      >

    </div>


    <div class="campo-atividade">

      <label>
        Data
      </label>

      <input
        id="editarData"
        type="date"
      >

    </div>


    <div class="campo-atividade">

      <label>
        Status
      </label>

      <select
        id="editarStatus"
      >

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

      <label>
        Observação
      </label>

      <textarea
        id="editarDescricao"
        rows="4"
      ></textarea>

    </div>


    <button
      id="salvarEdicaoAtividade"
      type="button"
      class="btn-salvar-atividade"
    >
      Salvar alterações
    </button>

  `;


  lista.parentNode.insertBefore(
    formulario,
    lista
  );


  $('#editarTitulo').value =
    atividade.titulo || '';


  $('#editarData').value =
    atividade.data || '';


  $('#editarStatus').value =
    atividade.status || 'Pendente';


  $('#editarDescricao').value =
    atividade.descricao || '';


  $('#cancelarEdicaoAtividade')
    .addEventListener(
      'click',
      function () {

        formulario.remove();

      }
    );


  $('#salvarEdicaoAtividade')
    .addEventListener(
      'click',
      function () {

        salvarEdicaoAtividade(
          id
        );

      }
    );

}


/* =========================================================
   SALVAR EDIÇÃO
========================================================= */

async function salvarEdicaoAtividade(
  id
) {

  if (!usuarioEhAdmin) {
    return;
  }


  const titulo =
    $('#editarTitulo')
      .value
      .trim();


  const data =
    $('#editarData')
      .value;


  const status =
    $('#editarStatus')
      .value;


  const descricao =
    $('#editarDescricao')
      .value
      .trim();


  if (!titulo || !data) {

    alert(
      'Informe título e data.'
    );

    return;

  }


  try {

    await updateDoc(
      doc(
        db,
        'atividades',
        id
      ),
      {

        titulo,

        data,

        status,

        descricao,

        atualizadaEm:
          serverTimestamp(),

        atualizadoPor:
          auth.currentUser
            ? auth.currentUser.email
            : null

      }
    );


    $('#formEditarAtividade')
      .remove();


  } catch (erro) {

    console.error(
      'Erro ao editar atividade:',
      erro
    );


    alert(
      'Não foi possível salvar a alteração.'
    );

  }

}


/* =========================================================
   EXCLUIR
========================================================= */

async function excluirAtividade(id) {

  if (!usuarioEhAdmin) {

    alert(
      'Somente o administrador pode excluir atividades.'
    );

    return;
  }


  const confirmar =
    confirm(
      'Tem certeza que deseja excluir esta atividade?'
    );


  if (!confirmar) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        'atividades',
        id
      )
    );

  } catch (erro) {

    console.error(
      'Erro ao excluir:',
      erro
    );


    alert(
      'Não foi possível excluir a atividade.'
    );

  }

}


/* =========================================================
   CARD ATIVIDADE
========================================================= */

function criarCardAtividade(
  id,
  atividade
) {

  const card =
    document.createElement(
      'article'
    );


  card.className =
    'atividade-card';


  const topo =
    document.createElement(
      'div'
    );


  topo.className =
    'atividade-topo';


  const blocoDados =
    document.createElement(
      'div'
    );


  const titulo =
    criarElementoTexto(
      'h3',
      'atividade-titulo',
      atividade.titulo
    );


  const meta =
    document.createElement(
      'div'
    );


  meta.className =
    'atividade-meta';


  const data =
    criarElementoTexto(
      'span',
      'atividade-data',
      formatarDataISO(
        atividade.data
      )
    );


  const status =
    criarElementoTexto(
      'span',
      'atividade-status',
      atividade.status
    );


  const classeStatus =
    (
      atividade.status || ''
    )
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /\s+/g,
        '-'
      );


  status.classList.add(
    'status-' + classeStatus
  );


  meta.appendChild(data);
  meta.appendChild(status);


  blocoDados.appendChild(
    titulo
  );


  blocoDados.appendChild(
    meta
  );


  topo.appendChild(
    blocoDados
  );


  /*
     AÇÕES APARECEM SOMENTE
     PARA O ADMINISTRADOR
  */

  if (usuarioEhAdmin) {

    const acoes =
      document.createElement(
        'div'
      );


    acoes.className =
      'atividade-acoes';


    const editar =
      document.createElement(
        'button'
      );


    editar.type =
      'button';


    editar.className =
      'botao-editar';


    editar.title =
      'Editar atividade';


    editar.textContent =
      '✏️';


    const excluir =
      document.createElement(
        'button'
      );


    excluir.type =
      'button';


    excluir.className =
      'botao-excluir';


    excluir.title =
      'Excluir atividade';


    excluir.textContent =
      '🗑️';


    editar.addEventListener(
      'click',
      function () {

        abrirEdicao(
          id,
          atividade
        );

      }
    );


    excluir.addEventListener(
      'click',
      function () {

        excluirAtividade(
          id
        );

      }
    );


    acoes.appendChild(
      editar
    );


    acoes.appendChild(
      excluir
    );


    topo.appendChild(
      acoes
    );

  }


  card.appendChild(
    topo
  );


  if (atividade.descricao) {

    const descricao =
      criarElementoTexto(
        'p',
        'atividade-descricao',
        atividade.descricao
      );


    card.appendChild(
      descricao
    );

  }


  return card;

}


/* =========================================================
   ATIVIDADES EM TEMPO REAL
========================================================= */

function escutarAtividades() {

  const lista =
    $('#listaAtividades');


  const semAtividades =
    $('#semAtividades');


  if (!lista) {
    return;
  }


  const consulta =
    query(
      atividadesRef,
      orderBy(
        'data',
        'asc'
      )
    );


  unsubscribeAtividades =
    onSnapshot(
      consulta,

      function (snapshot) {

        lista.innerHTML =
          '';


        snapshot.forEach(
          function (documento) {

            lista.appendChild(
              criarCardAtividade(
                documento.id,
                documento.data()
              )
            );

          }
        );


        if (semAtividades) {

          semAtividades.hidden =
            !snapshot.empty;

        }

      },

      function (erro) {

        console.error(
          'Erro ao carregar atividades:',
          erro
        );

      }
    );

}


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventosPainel() {

  const adicionar =
    $('#adicionarAtividade');


  const range =
    $('#progressoManual');


  const numero =
    $('#progressoNumero');


  if (adicionar) {

    adicionar.addEventListener(
      'click',
      abrirFormularioAtividade
    );

  }


  if (range) {

    range.addEventListener(
      'input',
      function () {

        mostrarProgresso(
          this.value
        );

      }
    );


    range.addEventListener(
      'change',
      function () {

        salvarProgresso(
          this.value
        );

      }
    );

  }


  if (numero) {

    numero.addEventListener(
      'input',
      function () {

        mostrarProgresso(
          this.value
        );

      }
    );


    numero.addEventListener(
      'change',
      function () {

        salvarProgresso(
          this.value
        );

      }
    );

  }

}


/* =========================================================
   INICIAR PAINEL
========================================================= */

async function iniciarPainel() {

  if (painelIniciado) {
    return;
  }


  painelIniciado =
    true;


  atualizarPrazo();


  await carregarProgresso();


  aplicarPermissoesInterface();


  configurarEventosPainel();


  escutarAtividades();


  setInterval(
    atualizarPrazo,
    60 * 60 * 1000
  );

}


/* =========================================================
   LOGIN / LOGOUT
========================================================= */

const botaoEntrar =
  $('#entrarGoogle');


const botaoSair =
  $('#sairConta');


if (botaoEntrar) {

  botaoEntrar.addEventListener(
    'click',
    entrarComGoogle
  );

}


if (botaoSair) {

  botaoSair.addEventListener(
    'click',
    sairDaConta
  );

}