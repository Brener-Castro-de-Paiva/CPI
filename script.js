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
  onAuthStateChanged,
  setPersistence,
  inMemoryPersistence
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
   CONFIGURAÇÃO DA AUTENTICAÇÃO
========================================================= */

/*
  Idioma utilizado pelo Firebase.
*/

auth.languageCode =
  'pt-BR';


/*
  A autenticação existe somente enquanto
  esta página permanecer aberta.

  Ao atualizar a página ou abrir novamente,
  será necessário realizar novo login.
*/

try {

  await setPersistence(
    auth,
    inMemoryPersistence
  );


  /*
    Remove eventual autenticação anterior
    que ainda tenha sido recuperada durante
    a inicialização.
  */

  await signOut(auth);

}

catch (erro) {

  console.error(
    'Erro ao configurar a sessão:',
    erro
  );

}


/*
  Ao clicar em "Entrar com Google",
  o Google exibirá a escolha da conta.
*/

googleProvider.setCustomParameters({
  prompt: 'select_account'
});


/* =========================================================
   CONFIGURAÇÃO DA CPI
========================================================= */

const CONFIG = {

  inicio:
    '2026-08-20T00:00:00',

  fim:
    '2026-11-18T23:59:59'

};


/* =========================================================
   REFERÊNCIAS FIRESTORE
========================================================= */

const atividadesRef =
  collection(
    db,
    'atividades'
  );


const logsAcessoRef =
  collection(
    db,
    'logsAcesso'
  );


const progressoRef =
  doc(
    db,
    'configuracoes',
    'progresso'
  );


/* =========================================================
   CONTROLE INTERNO
========================================================= */

let painelIniciado =
  false;


let usuarioEhAdmin =
  false;


let unsubscribeAtividades =
  null;


let intervaloPrazo =
  null;


let acessoRegistradoNestaSessao =
  false;


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function $(seletor) {

  return document.querySelector(
    seletor
  );

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
   CRIAÇÃO SEGURA DE ELEMENTOS DE TEXTO
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

function verificarAdministrador(
  usuario
) {

  if (!usuario) {

    usuarioEhAdmin =
      false;

    return false;

  }


  const email =
    (
      usuario.email ||
      ''
    ).toLowerCase();


  usuarioEhAdmin =
    email ===
    EMAIL_ADMIN.toLowerCase();


  return usuarioEhAdmin;

}


/* =========================================================
   REGISTRAR LOG DE ACESSO
========================================================= */

async function registrarAcesso(
  usuario
) {

  if (!usuario) {

    return;

  }


  /*
    Registra apenas uma vez durante
    a sessão atual da página.
  */

  if (acessoRegistradoNestaSessao) {

    return;

  }


  try {

    await addDoc(
      logsAcessoRef,
      {

        tipo:
          'entrada',

        uid:
          usuario.uid || '',

        nome:
          usuario.displayName || '',

        email:
          usuario.email || '',

        dataHora:
          serverTimestamp(),

        pagina:
          'Controle cronológico da CPI'

      }
    );


    acessoRegistradoNestaSessao =
      true;

  }

  catch (erro) {

    /*
      Uma eventual falha no log
      não impedirá o acesso ao painel.
    */

    console.error(
      'Erro ao registrar acesso:',
      erro
    );

  }

}


/* =========================================================
   PERMISSÕES DA INTERFACE
========================================================= */

function aplicarPermissoesInterface() {

  const adicionar =
    $('#adicionarAtividade');


  const progressoManual =
    $('#progressoManual');


  const progressoNumero =
    $('#progressoNumero');


  const ajuda =
    document.querySelector(
      '.controle-manual .ajuda'
    );


  /*
    Somente administrador vê o botão
    para adicionar nova atividade.
  */

  if (adicionar) {

    adicionar.hidden =
      !usuarioEhAdmin;

  }


  /*
    Usuários comuns podem visualizar
    o progresso, mas não alterá-lo.
  */

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

    }

    else {

      ajuda.textContent =
        'Modo de visualização. Somente o administrador pode alterar o progresso.';

    }

  }

}


/* =========================================================
   LOGIN COM GOOGLE
========================================================= */

async function entrarComGoogle() {

  try {

    /*
      Mantém a autenticação apenas
      enquanto esta página permanecer aberta.
    */

    await setPersistence(
      auth,
      inMemoryPersistence
    );


    await signInWithPopup(
      auth,
      googleProvider
    );

  }

  catch (erro) {

    console.error(
      'Erro no login:',
      erro
    );


    /*
      Não mostra mensagem se o próprio
      usuário fechou a janela de login.
    */

    if (
      erro.code !==
      'auth/popup-closed-by-user'
    ) {

      alert(
        'Não foi possível entrar com a conta Google.'
      );

    }

  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function sairDaConta() {

  try {

    await signOut(auth);


    /*
      Volta para o início da página.
    */

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }

  catch (erro) {

    console.error(
      'Erro ao sair:',
      erro
    );

  }

}


/* =========================================================
   CONTROLE DE AUTENTICAÇÃO
========================================================= */

onAuthStateChanged(
  auth,
  async function (usuario) {

    const telaLogin =
      $('#telaLogin');


    const conteudo =
      $('#conteudoProtegido');


    /*
      =======================================================
      USUÁRIO AUTENTICADO
      =======================================================
    */

    if (usuario) {

      verificarAdministrador(
        usuario
      );


      /*
        Só registra o log depois
        da autenticação efetiva.
      */

      await registrarAcesso(
        usuario
      );


      /*
        Esconde completamente
        a tela de login.
      */

      if (telaLogin) {

        telaLogin.hidden =
          true;

      }


      /*
        Exibe o painel.
      */

      if (conteudo) {

        conteudo.hidden =
          false;

      }


      /*
        Garante que o usuário vá
        para o início do painel.
      */

      window.scrollTo(
        0,
        0
      );


      aplicarPermissoesInterface();


      await iniciarPainel();

    }


    /*
      =======================================================
      USUÁRIO NÃO AUTENTICADO
      =======================================================
    */

    else {

      usuarioEhAdmin =
        false;


      acessoRegistradoNestaSessao =
        false;


      /*
        O conteúdo protegido sempre
        fica escondido sem autenticação.
      */

      if (conteudo) {

        conteudo.hidden =
          true;

      }


      /*
        Exibe somente a tela de login.
      */

      if (telaLogin) {

        telaLogin.hidden =
          false;

      }


      /*
        Volta a página para o topo.
      */

      window.scrollTo(
        0,
        0
      );


      painelIniciado =
        false;


      /*
        Para a escuta do Firestore.
      */

      if (unsubscribeAtividades) {

        unsubscribeAtividades();

        unsubscribeAtividades =
          null;

      }


      /*
        Cancela o temporizador.
      */

      if (intervaloPrazo) {

        clearInterval(
          intervaloPrazo
        );


        intervaloPrazo =
          null;

      }

    }

  }
);


/* =========================================================
   PRAZO TOTAL DA CPI
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


  const dataInicio =
    $('#dataInicio');


  const dataAtual =
    $('#dataAtual');


  const dataFim =
    $('#dataFim');


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
      formatarData(
        inicio
      );

  }


  if (dataAtual) {

    dataAtual.textContent =
      formatarData(
        agora
      );

  }


  if (dataFim) {

    dataFim.textContent =
      formatarData(
        fim
      );

  }


  if (percentualPrazo) {

    percentualPrazo.textContent =
      percentual.toFixed(1) +
      '%';

  }


  if (barraPrazo) {

    barraPrazo.style.width =
      percentual +
      '%';

  }


  if (diasDecorridosEl) {

    diasDecorridosEl.textContent =
      diasDecorridos +
      (
        diasDecorridos === 1
          ? ' dia decorrido'
          : ' dias decorridos'
      );

  }


  if (diasRestantesEl) {

    diasRestantesEl.textContent =
      diasRestantes +
      (
        diasRestantes === 1
          ? ' dia restante'
          : ' dias restantes'
      );

  }


  if (statusPrazo) {

    if (agora < inicio) {

      statusPrazo.textContent =
        'Ainda não iniciado';

    }

    else if (agora > fim) {

      statusPrazo.textContent =
        'Prazo encerrado';

    }

    else {

      statusPrazo.textContent =
        'Em andamento';

    }

  }

}


/* =========================================================
   EXIBIR PROGRESSO DOS TRABALHOS
========================================================= */

function mostrarProgresso(
  valor
) {

  const numero =
    limitar(
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

    range.value =
      numero;

  }


  if (numeroInput) {

    numeroInput.value =
      numero;

  }


  if (barra) {

    barra.style.width =
      numero +
      '%';

  }


  if (badge) {

    badge.textContent =
      numero +
      '%';

  }

}


/* =========================================================
   CARREGAR PROGRESSO FIRESTORE
========================================================= */

async function carregarProgresso() {

  try {

    const snapshot =
      await getDoc(
        progressoRef
      );


    if (
      snapshot.exists()
    ) {

      const dados =
        snapshot.data();


      mostrarProgresso(
        dados.percentual ||
        0
      );

    }

    else {

      mostrarProgresso(
        0
      );

    }

  }

  catch (erro) {

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

        percentual:
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

  }

  catch (erro) {

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
   ABRIR FORMULÁRIO DE NOVA ATIVIDADE
========================================================= */

function abrirFormularioAtividade() {

  if (!usuarioEhAdmin) {

    alert(
      'Somente o administrador pode incluir atividades.'
    );

    return;

  }


  /*
    Impede dois formulários simultâneos.
  */

  if (
    $('#formNovaAtividade')
  ) {

    return;

  }


  const formularioEdicao =
    $('#formEditarAtividade');


  if (formularioEdicao) {

    formularioEdicao.remove();

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
        aria-label="Cancelar"
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
        placeholder="Ex.: Solicitação de documentos"
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

      <select
        id="novaAtividadeStatus"
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

      <label for="novaAtividadeDescricao">
        Observação
      </label>

      <textarea
        id="novaAtividadeDescricao"
        rows="4"
        maxlength="2000"
        placeholder="Descreva a atividade ou providência..."
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


  const cancelar =
    $('#cancelarNovaAtividade');


  const salvar =
    $('#salvarNovaAtividade');


  const titulo =
    $('#novaAtividadeTitulo');


  if (cancelar) {

    cancelar.addEventListener(
      'click',
      function () {

        formulario.remove();

      }
    );

  }


  if (salvar) {

    salvar.addEventListener(
      'click',
      salvarNovaAtividade
    );

  }


  if (titulo) {

    titulo.focus();

  }

}


/* =========================================================
   SALVAR NOVA ATIVIDADE
========================================================= */

async function salvarNovaAtividade() {

  if (!usuarioEhAdmin) {

    return;

  }


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

    return;

  }


  const titulo =
    tituloInput
      .value
      .trim();


  const data =
    dataInput.value;


  const status =
    statusInput.value;


  const descricao =
    descricaoInput
      ? descricaoInput
          .value
          .trim()
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
      'Informe a data.'
    );


    dataInput.focus();

    return;

  }


  const botao =
    $('#salvarNovaAtividade');


  if (botao) {

    botao.disabled =
      true;


    botao.textContent =
      'Salvando...';

  }


  try {

    await addDoc(
      atividadesRef,
      {

        titulo:
          titulo,

        data:
          data,

        status:
          status,

        descricao:
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


    const formulario =
      $('#formNovaAtividade');


    if (formulario) {

      formulario.remove();

    }

  }

  catch (erro) {

    console.error(
      'Erro ao salvar atividade:',
      erro
    );


    alert(
      'Não foi possível salvar a atividade.'
    );


    if (botao) {

      botao.disabled =
        false;


      botao.textContent =
        'Salvar atividade';

    }

  }

}


/* =========================================================
   ABRIR EDIÇÃO DE ATIVIDADE
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


  const formularioNova =
    $('#formNovaAtividade');


  if (formularioNova) {

    formularioNova.remove();

  }


  const formularioExistente =
    $('#formEditarAtividade');


  if (formularioExistente) {

    formularioExistente.remove();

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
        aria-label="Cancelar"
      >
        ×
      </button>

    </div>


    <div class="campo-atividade">

      <label for="editarTitulo">
        Atividade
      </label>

      <input
        id="editarTitulo"
        type="text"
        maxlength="200"
      >

    </div>


    <div class="campo-atividade">

      <label for="editarData">
        Data
      </label>

      <input
        id="editarData"
        type="date"
      >

    </div>


    <div class="campo-atividade">

      <label for="editarStatus">
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

      <label for="editarDescricao">
        Observação
      </label>

      <textarea
        id="editarDescricao"
        rows="4"
        maxlength="2000"
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
    atividade.titulo ||
    '';


  $('#editarData').value =
    atividade.data ||
    '';


  $('#editarStatus').value =
    atividade.status ||
    'Pendente';


  $('#editarDescricao').value =
    atividade.descricao ||
    '';


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


  formulario.scrollIntoView({
    behavior:
      'smooth',

    block:
      'center'
  });

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


  const tituloInput =
    $('#editarTitulo');


  const dataInput =
    $('#editarData');


  const statusInput =
    $('#editarStatus');


  const descricaoInput =
    $('#editarDescricao');


  if (
    !tituloInput ||
    !dataInput ||
    !statusInput
  ) {

    return;

  }


  const titulo =
    tituloInput
      .value
      .trim();


  const data =
    dataInput.value;


  const status =
    statusInput.value;


  const descricao =
    descricaoInput
      ? descricaoInput
          .value
          .trim()
      : '';


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


  const botao =
    $('#salvarEdicaoAtividade');


  if (botao) {

    botao.disabled =
      true;


    botao.textContent =
      'Salvando...';

  }


  try {

    await updateDoc(
      doc(
        db,
        'atividades',
        id
      ),
      {

        titulo:
          titulo,

        data:
          data,

        status:
          status,

        descricao:
          descricao,

        atualizadaEm:
          serverTimestamp(),

        atualizadoPor:
          auth.currentUser
            ? auth.currentUser.email
            : null

      }
    );


    const formulario =
      $('#formEditarAtividade');


    if (formulario) {

      formulario.remove();

    }

  }

  catch (erro) {

    console.error(
      'Erro ao editar atividade:',
      erro
    );


    alert(
      'Não foi possível salvar a alteração.'
    );


    if (botao) {

      botao.disabled =
        false;


      botao.textContent =
        'Salvar alterações';

    }

  }

}


/* =========================================================
   EXCLUIR ATIVIDADE
========================================================= */

async function excluirAtividade(
  id
) {

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

  }

  catch (erro) {

    console.error(
      'Erro ao excluir atividade:',
      erro
    );


    alert(
      'Não foi possível excluir a atividade.'
    );

  }

}


/* =========================================================
   CRIAR CARD DA ATIVIDADE
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
      atividade.status ||
      ''
    )
      .toLowerCase()
      .normalize(
        'NFD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /\s+/g,
        '-'
      );


  status.classList.add(
    'status-' +
    classeStatus
  );


  meta.appendChild(
    data
  );


  meta.appendChild(
    status
  );


  blocoDados.appendChild(
    titulo
  );


  blocoDados.appendChild(
    meta
  );


  topo.appendChild(
    blocoDados
  );


  /* =======================================================
     BOTÕES APENAS PARA ADMINISTRADOR
  ======================================================= */

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


  if (
    atividade.descricao
  ) {

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

      function (
        snapshot
      ) {

        lista.innerHTML =
          '';


        snapshot.forEach(
          function (
            documento
          ) {

            const atividade =
              documento.data();


            const card =
              criarCardAtividade(
                documento.id,
                atividade
              );


            lista.appendChild(
              card
            );

          }
        );


        if (semAtividades) {

          semAtividades.hidden =
            !snapshot.empty;

        }

      },

      function (
        erro
      ) {

        console.error(
          'Erro ao carregar atividades:',
          erro
        );


        alert(
          'Não foi possível carregar as atividades.'
        );

      }
    );

}


/* =========================================================
   EVENTOS DO PAINEL
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


  intervaloPrazo =
    setInterval(
      atualizarPrazo,
      60 *
      60 *
      1000
    );

}


/* =========================================================
   BOTÕES DE LOGIN E LOGOUT
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