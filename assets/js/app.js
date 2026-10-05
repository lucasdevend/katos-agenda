/* =========================================================
   KATO'S AGENDA
   FUNÇÕES GLOBAIS DO PAINEL
========================================================= */


/* =========================================================
   TOAST
========================================================= */

function toast(message) {

  let element =
    document.querySelector(
      ".toast"
    );


  if (!element) {

    element =
      document.createElement(
        "div"
      );

    element.className =
      "toast";

    document.body.appendChild(
      element
    );

  }


  element.textContent =
    message;


  element.classList.add(
    "show"
  );


  clearTimeout(
    window.__katoToast
  );


  window.__katoToast =
    setTimeout(
      () => {

        element.classList.remove(
          "show"
        );

      },
      2200
    );

}


/* =========================================================
   MODAIS
========================================================= */

function openModal(selector) {

  document
    .querySelector(selector)
    ?.classList.add(
      "open"
    );

}


function closeModal(selector) {

  document
    .querySelector(selector)
    ?.classList.remove(
      "open"
    );

}


/* =========================================================
   FORMATAÇÕES
========================================================= */

function formatDate(value) {

  if (!value) {
    return "-";
  }


  const date =
    new Date(
      `${value}T00:00:00`
    );


  return date.toLocaleDateString(
    "pt-BR"
  );

}


function money(value) {

  return Number(
    value || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}


/* =========================================================
   COMPATIBILIDADE COM DADOS ANTIGOS
========================================================= */

function userData() {

  const db =
    typeof DB !== "undefined"
      ? DB.read()
      : null;


  const user =
    typeof currentUser === "function"
      ? currentUser()
      : null;


  return {
    db,
    u: user
  };

}


/* =========================================================
   CABEÇALHO
========================================================= */

function populateHeader() {

  if (
    typeof currentUser !==
    "function"
  ) {
    return;
  }


  const user =
    currentUser();


  if (!user) {
    return;
  }


  document
    .querySelectorAll(
      "[data-user-name]"
    )
    .forEach(
      element => {

        element.textContent =
          user.name ||
          user.fullName ||
          "";

      }
    );


  document
    .querySelectorAll(
      "[data-shop-name]"
    )
    .forEach(
      element => {

        element.textContent =
          user.shopName ||
          user.barbershop ||
          "";

      }
    );


  document
    .querySelectorAll(
      "[data-plan]"
    )
    .forEach(
      element => {

        element.textContent =
          String(
            user.plan || ""
          ).toUpperCase();

      }
    );

}


/* =========================================================
   HELPERS ANTIGOS
========================================================= */

function getUserItems(key) {

  const {
    db,
    u
  } =
    userData();


  if (
    !db ||
    !u ||
    !Array.isArray(db[key])
  ) {

    return [];

  }


  return db[key].filter(
    item =>
      item.userId ===
      u.id
  );

}


function fillSelect(
  selector,
  items,
  labelKey = "name"
) {

  const element =
    document.querySelector(
      selector
    );


  if (!element) {
    return;
  }


  element.innerHTML = `
    <option value="">
      Selecione
    </option>

    ${items
      .map(
        item => `
          <option value="${item.id}">
            ${item[labelKey]}
          </option>
        `
      )
      .join("")}
  `;

}


/* =========================================================
   PROTEÇÃO DO PAINEL
========================================================= */

if (
  document.body.dataset
    .protected === "true"
) {

  if (
    typeof requireAuth ===
    "function"
  ) {

    requireAuth();

  }


  populateHeader();

}


/* =========================================================
   SIDEBAR MOBILE
========================================================= */

function initializeMobileSidebar() {

  const sidebar =
    document.querySelector(
      ".sidebar"
    );


  const menuButton =
    document.querySelector(
      "[data-sidebar-toggle]"
    );


  if (
    !sidebar ||
    !menuButton
  ) {

    return;

  }


  /* =====================================================
     ÍCONE DOS 3 TRAÇOS
  ===================================================== */

  menuButton.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 7h16"></path>
      <path d="M4 12h16"></path>
      <path d="M4 17h16"></path>
    </svg>
  `;


  menuButton.setAttribute(
    "aria-expanded",
    "false"
  );


  /* =====================================================
     ABRIR
  ===================================================== */

  function openSidebar() {

    sidebar.classList.add(
      "open"
    );


    menuButton.setAttribute(
      "aria-expanded",
      "true"
    );

  }


  /* =====================================================
     FECHAR
  ===================================================== */

  function closeSidebar() {

    sidebar.classList.remove(
      "open"
    );


    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );

  }


  /* =====================================================
     ALTERNAR
  ===================================================== */

  function toggleSidebar() {

    const isOpen =
      sidebar.classList.contains(
        "open"
      );


    if (isOpen) {

      closeSidebar();

    } else {

      openSidebar();

    }

  }


  /* =====================================================
     CLIQUE NOS 3 TRAÇOS
  ===================================================== */

  menuButton.addEventListener(
    "click",
    event => {

      event.preventDefault();

      event.stopPropagation();

      toggleSidebar();

    }
  );


  /* =====================================================
     CLIQUE DENTRO DA SIDEBAR
     NÃO FECHA AUTOMATICAMENTE
  ===================================================== */

  sidebar.addEventListener(
    "click",
    event => {

      event.stopPropagation();

    }
  );


  /* =====================================================
     CLICOU EM UMA OPÇÃO DO MENU
  ===================================================== */

  sidebar
    .querySelectorAll(
      ".menu a"
    )
    .forEach(
      link => {

        link.addEventListener(
          "click",
          () => {

            closeSidebar();

          }
        );

      }
    );


  /* =====================================================
     CLICOU FORA
  ===================================================== */

  document.addEventListener(
    "click",
    () => {

      if (
        sidebar.classList.contains(
          "open"
        )
      ) {

        closeSidebar();

      }

    }
  );


  /* =====================================================
     ESC
  ===================================================== */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {

        closeSidebar();

      }

    }
  );


  /* =====================================================
     VOLTOU PARA DESKTOP
  ===================================================== */

  window.addEventListener(
    "resize",
    () => {

      if (
        window.innerWidth >
        760
      ) {

        closeSidebar();

      }

    }
  );

}


/* =========================================================
   MARCAR PÁGINA ATIVA
========================================================= */

function initializeActiveMenu() {

  const currentPage =
    location.pathname
      .split("/")
      .pop() ||
    "dashboard.html";


  document
    .querySelectorAll(
      ".menu a"
    )
    .forEach(
      link => {

        const linkPage =
          (
            link.getAttribute(
              "href"
            ) || ""
          )
            .split("/")
            .pop();


        link.classList.toggle(
          "active",
          linkPage ===
            currentPage
        );

      }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function initializeLogout() {

  document
    .querySelectorAll(
      "[data-logout]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          async event => {

            event.preventDefault();


            if (
              typeof logout ===
              "function"
            ) {

              await logout();

            }

          }
        );

      }
    );

}


/* =========================================================
   MODAL — CLIQUE NO FUNDO
========================================================= */

function initializeModalBackdrops() {

  document.addEventListener(
    "click",
    event => {

      if (
        event.target.matches(
          ".modal-backdrop"
        )
      ) {

        event.target.classList.remove(
          "open"
        );

      }

    }
  );

}


/* =========================================================
   ESC — MODAIS
========================================================= */

function initializeModalEscape() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ) {

        return;

      }


      document
        .querySelectorAll(
          ".modal-backdrop.open"
        )
        .forEach(
          modal => {

            modal.classList.remove(
              "open"
            );

          }
        );

    }
  );

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeActiveMenu();

    initializeMobileSidebar();

    initializeLogout();

    initializeModalBackdrops();

    initializeModalEscape();

  }
);