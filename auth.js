
/* =========================================================
   CPI DE ROSEIRA — AUTENTICAÇÃO E CONTROLE DE ACESSO

   Projeto: CPI nº 01/2026

   Responsabilidades:
   1. Autenticação com Google;
   2. Persistência da sessão;
   3. Verificação de acesso ao painel;
   4. Identificação do administrador;
   5. Registro de acessos no Firestore;
   6. Encerramento da sessão.

   Arquivos relacionados:
   - index.html
   - painel.html
   - firebase-config.js
   - script.js

========================================================= */


/* =========================================================
   1. IMPORTAÇÃO DO FIREBASE
========================================================= */

import {
  auth,
  db,
  googleProvider,
  EMAIL_ADMIN
} from "./firebase-config.js";


import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =========================================================
   2. CONFIGURAÇÕES GERAIS
========================================================= */

const PAGINA_LOGIN = "index.html";

const PAGINA_PAINEL = "painel.html";


/*
  Identifica qual página está aberta.
*/

const paginaAtual =
  window.location.pathname
    .split("/")
    .pop()
    .toLowerCase();


const estaNoPainel =
  paginaAtual === PAGINA_PAINEL;


const estaNoLogin =
  paginaAtual === PAGINA_LOGIN ||
  paginaAtual === "";


/*
  Controle interno para evitar
  operações simultâneas de login.
*/

let loginEmAndamento = false;


/*
  Controle do registro de acesso
  durante a execução atual.
*/

let acessoRegistrado = false;


/* =========================================================
   3. ELEMENTOS DO HTML
========================================================= */

const botaoEntrar =
  document.getElementById("entrarGoogle");


const botaoSair =
  document.getElementById("sairConta");


const conteudoProtegido =
  document.getElementById("conteudoProtegido");


/* =========================================================
   4. IDENTIFICAÇÃO DO ADMINISTRADOR
========================================================= */

function verificarAdministrador(usuario) {

  if (!usuario || !usuario.email) {
    return false;
  }

  const emailUsuario =
    usuario.email
      .trim()
      .toLowerCase();

  const emailAdministrador =
    EMAIL_ADMIN
      .trim()
      .toLowerCase();

  return emailUsuario === emailAdministrador;

}


/* =========================================================
   5. PERSISTÊNCIA DA SESSÃO
========================================================= */

/*
  browserSessionPersistence:

  - Permite navegar do login para o painel;
  - Mantém a autenticação durante a sessão
    da aba do navegador;
  - Não utiliza persistência permanente;
  - Evita solicitar novo login ao navegar
    entre as duas páginas.

  Observação:
  A sessão pode sobreviver ao recarregamento
  e, dependendo do navegador, à restauração
  da aba. A autorização deve ser validada
  pelas regras do Firestore.
*/

async function configurarPersistencia() {

  await setPersistence(
    auth,
    browserSessionPersistence
  );

}


/* =========================================================
   6. REGISTRO DE ACESSO NO FIRESTORE
========================================================= */

/*
  Coleção utilizada:
  logsAcesso

  Os registros são armazenados no mesmo
  projeto Firebase já utilizado pela CPI.

  IMPORTANTE:
  O log é um registro operacional do
  aplicativo, não uma trilha de auditoria
  inviolável.
*/

async function registrarAcesso(usuario) {

  if (!usuario) {
    return;
  }

  if (acessoRegistrado) {
    return;
  }

  acessoRegistrado = true;

  try {

    await addDoc(
      collection(db, "logsAcesso"),
      {

        tipo: "entrada",

        uid: usuario.uid,

        nome: usuario.displayName || "",

        email: usuario.email || "",

        dataHora: serverTimestamp(),

        pagina: "Controle cronológico da CPI"

      }
    );

  } catch (erro) {

    acessoRegistrado = false;

    console.error(
      "Falha ao registrar acesso:",
      erro
    );

  }

}


/* =========================================================
   7. LOGIN COM GOOGLE
========================================================= */

async function entrarComGoogle() {

  if (loginEmAndamento) {
    return;
  }

  loginEmAndamento = true;

  if (botaoEntrar) {
    botaoEntrar.disabled = true;
    botaoEntrar.textContent = "Autenticando...";
  }

  try {

    /*
      Configura a sessão antes de iniciar
      a autenticação com o Google.
    */

    await configurarPersistencia();


    /*
      Abre a janela de autenticação Google.
    */

    await signInWithPopup(
      auth,
      googleProvider
    );


    /*
      O redirecionamento será realizado
      pelo observador de autenticação.
    */

  } catch (erro) {

    console.error(
      "Erro na autenticação Google:",
      erro
    );

    if (
      erro.code !== "auth/popup-closed-by-user" &&
      erro.code !== "auth/cancelled-popup-request"
    ) {

      alert(
        "Não foi possível realizar a autenticação. " +
        "Verifique sua conexão e tente novamente."
      );

    }

  } finally {

    loginEmAndamento = false;

    if (botaoEntrar) {
      botaoEntrar.disabled = false;
      botaoEntrar.textContent = "Entrar com Google";
    }

  }

}


/* =========================================================
   8. SAIR DA CONTA
========================================================= */

async function sairDaConta() {

  try {

    /*
      Oculta imediatamente o painel.
    */

    if (conteudoProtegido) {
      conteudoProtegido.hidden = true;
    }


    /*
      Encerra a sessão Firebase.
    */

    await signOut(auth);


    acessoRegistrado = false;


    /*
      Retorna à tela de login.
    */

    window.location.replace(
      PAGINA_LOGIN
    );

  } catch (erro) {

    console.error(
      "Erro ao encerrar sessão:",
      erro
    );

    alert(
      "Não foi possível encerrar a sessão. " +
      "Tente novamente."
    );

  }

}


/* =========================================================
   9. OBSERVADOR DE AUTENTICAÇÃO
========================================================= */

/*
  O Firebase verifica automaticamente
  se existe uma sessão autenticada.

  Essa verificação ocorre tanto no
  index.html quanto no painel.html.
*/

onAuthStateChanged(

  auth,

  async (usuario) => {

    /* =====================================================
       USUÁRIO NÃO AUTENTICADO
    ===================================================== */

    if (!usuario) {

      acessoRegistrado = false;

      /*
        Nunca mostrar o painel
        sem autenticação.
      */

      if (conteudoProtegido) {
        conteudoProtegido.hidden = true;
      }


      /*
        Se estiver no painel,
        retorna à página de login.
      */

      if (estaNoPainel) {

        window.location.replace(
          PAGINA_LOGIN
        );

      }

      return;
    }


    /* =====================================================
       USUÁRIO AUTENTICADO
    ===================================================== */

    /*
      Identifica se o usuário é
      o administrador.
    */

    const administrador =
      verificarAdministrador(usuario);


    /*
      Disponibiliza a informação
      para os demais módulos.
    */

    document.documentElement.dataset.admin =
      administrador ? "true" : "false";


    /*
      No login, redireciona ao painel.
    */

    if (estaNoLogin) {

      window.location.replace(
        PAGINA_PAINEL
      );

      return;
    }


    /*
      No painel, registra o acesso
      sem bloquear a exibição.
    */

    if (estaNoPainel) {

      registrarAcesso(usuario);


      /*
        Exibe o conteúdo somente
        após a autenticação.
      */

      if (conteudoProtegido) {

        conteudoProtegido.hidden = false;

      }

    }

  },

  (erro) => {

    console.error(
      "Erro ao verificar autenticação:",
      erro
    );

    if (conteudoProtegido) {
      conteudoProtegido.hidden = true;
    }

  }

);


/* =========================================================
   10. EVENTOS DOS BOTÕES
========================================================= */

/*
  Botão de login.
*/

if (botaoEntrar) {

  botaoEntrar.addEventListener(
    "click",
    entrarComGoogle
  );

}


/*
  Botão de saída.
*/

if (botaoSair) {

  botaoSair.addEventListener(
    "click",
    sairDaConta
  );

}


/* =========================================================
   11. EXPORTAÇÃO DAS FUNÇÕES
========================================================= */

/*
  As funções poderão ser utilizadas
  pelo script.js quando necessário.
*/

export {

  verificarAdministrador,

  configurarPersistencia,

  registrarAcesso,

  sairDaConta

};


/* =========================================================
   FIM — AUTENTICAÇÃO DA CPI
========================================================= */
