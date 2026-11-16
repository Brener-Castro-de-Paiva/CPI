
/* =========================================================
   CPI DE ROSEIRA — CONFIGURAÇÃO DO FIREBASE

   Projeto: ceip-31aae

   Responsabilidades:
   - Inicializar o Firebase;
   - Configurar a autenticação Google;
   - Inicializar o Cloud Firestore;
   - Exportar os serviços para os demais arquivos.

   IMPORTANTE:
   Este arquivo não controla o login,
   não altera atividades e não modifica
   os dados armazenados no Firebase.
========================================================= */


/* =========================================================
   1. IMPORTAÇÃO DOS SERVIÇOS FIREBASE
========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";


import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =========================================================
   2. CONFIGURAÇÃO DO PROJETO
========================================================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyDDNJK6lQdCwwfkAlNTXjZZSGCWY1yyYF8",

  authDomain:
    "ceip-31aae.firebaseapp.com",

  projectId:
    "ceip-31aae",

  storageBucket:
    "ceip-31aae.firebasestorage.app",

  messagingSenderId:
    "398480411066",

  appId:
    "1:398480411066:web:9ef349268e6524e8fa3583",

  measurementId:
    "G-470PQTD7V7"

};


/* =========================================================
   3. INICIALIZAÇÃO DO FIREBASE
========================================================= */

const app = initializeApp(
  firebaseConfig
);


/* =========================================================
   4. AUTENTICAÇÃO GOOGLE
========================================================= */

const auth = getAuth(app);


/*
  Define o idioma utilizado
  nas mensagens de autenticação.
*/

auth.languageCode = "pt-BR";


/*
  Provedor de autenticação Google.
*/

const googleProvider =
  new GoogleAuthProvider();


/*
  Solicita ao Google que apresente
  a seleção de conta no login.
*/

googleProvider.setCustomParameters({

  prompt: "select_account"

});


/* =========================================================
   5. BANCO DE DADOS FIRESTORE
========================================================= */

const db = getFirestore(app);


/* =========================================================
   6. ADMINISTRADOR DO SISTEMA
========================================================= */

/*
  Este e-mail será utilizado pelo auth.js
  para identificar o administrador.

  A proteção efetiva das operações
  deverá ser garantida também pelas
  regras de segurança do Firestore.
*/

const EMAIL_ADMIN =
  "breneradvocacia@gmail.com";


/* =========================================================
   7. EXPORTAÇÃO DOS SERVIÇOS
========================================================= */

export {

  app,

  auth,

  db,

  googleProvider,

  EMAIL_ADMIN

};


/* =========================================================
   FIM — CONFIGURAÇÃO DO FIREBASE
========================================================= */
