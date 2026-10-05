(function () {

  /* =========================================================
     ELEMENTOS
  ========================================================= */

  const list =
    document.querySelector(
      "#ticketsList"
    );

  const form =
    document.querySelector(
      "#ticketForm"
    );

  const subjectInput =
    document.querySelector(
      "#ticketSubject"
    );

  const categoryInput =
    document.querySelector(
      "#ticketCategory"
    );

  const messageInput =
    document.querySelector(
      "#ticketMessage"
    );


  const conversationModal =
    document.querySelector(
      "#ticketConversationModal"
    );

  const conversationTitle =
    document.querySelector(
      "#conversationTitle"
    );

  const conversationProtocol =
    document.querySelector(
      "#conversationProtocol"
    );

  const conversationMessages =
    document.querySelector(
      "#conversationMessages"
    );

  const conversationForm =
    document.querySelector(
      "#conversationForm"
    );

  const conversationInput =
    document.querySelector(
      "#conversationInput"
    );

  const resolvedButton =
    document.querySelector(
      "#ticketResolvedButton"
    );

  const unresolvedButton =
    document.querySelector(
      "#ticketUnresolvedButton"
    );


  const openCount =
    document.querySelector(
      "#ticketsOpenCount"
    );

  const progressCount =
    document.querySelector(
      "#ticketsProgressCount"
    );

  const resolvedCount =
    document.querySelector(
      "#ticketsResolvedCount"
    );


  if (!list || !form) {
    return;
  }


  /* =========================================================
     ESTADO
  ========================================================= */

  let authUser = null;

  let business = null;

  let tickets = [];

  let messages = [];

  let activeTicketId = null;


  /* =========================================================
     UTILIDADES
  ========================================================= */

  function notify(message) {

    if (
      typeof toast ===
      "function"
    ) {

      toast(message);

      return;
    }

    alert(message);
  }


  function escapeHTML(value) {

    return String(
      value ?? ""
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }


  function normalize(value) {

    return String(
      value || ""
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim();
  }


  function formatDate(value) {

    if (!value) {
      return "-";
    }


    const date =
      new Date(value);


    return date.toLocaleString(
      "pt-BR",
      {
        dateStyle: "short",
        timeStyle: "short"
      }
    );
  }


  function normalizeStatus(status) {

    const value =
      normalize(status);


    if (
      value === "resolvido"
    ) {
      return "resolved";
    }


    if (
      value === "em_andamento"
    ) {
      return "progress";
    }


    return "open";
  }


  function statusLabel(status) {

    const type =
      normalizeStatus(
        status
      );


    if (
      type === "resolved"
    ) {
      return "Resolvido";
    }


    if (
      type === "progress"
    ) {
      return "Em andamento";
    }


    return "Aberto";
  }


  function planLabel(plan) {

    const value =
      normalize(plan);


    if (
      value === "business"
    ) {
      return "Business";
    }


    if (
      value === "platinum"
    ) {
      return "Platinum";
    }


    return "Starter";
  }


  function getTicket(
    ticketId
  ) {

    return tickets.find(
      ticket =>
        ticket.id ===
        ticketId
    );
  }


  function getTicketMessages(
    ticketId
  ) {

    return messages
      .filter(
        message =>
          message.ticket_id ===
          ticketId
      )
      .sort(
        (a, b) =>
          String(
            a.created_at
          ).localeCompare(
            String(
              b.created_at
            )
          )
      );
  }


  function generateProtocol() {

    const now =
      new Date();


    const date =
      [
        now.getFullYear(),
        String(
          now.getMonth() + 1
        ).padStart(2, "0"),
        String(
          now.getDate()
        ).padStart(2, "0")
      ].join("");


    const time =
      [
        String(
          now.getHours()
        ).padStart(2, "0"),
        String(
          now.getMinutes()
        ).padStart(2, "0"),
        String(
          now.getSeconds()
        ).padStart(2, "0")
      ].join("");


    const random =
      Math.floor(
        1000 +
        Math.random() *
        9000
      );


    return (
      `KA-${date}-${time}-${random}`
    );
  }


  /* =========================================================
     CONTA
  ========================================================= */

  async function loadAccount() {

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient
        .auth
        .getSession();


    if (
      sessionError ||
      !sessionData?.session
    ) {

      window.location.href =
        "login.html";

      return false;
    }


    authUser =
      sessionData.session.user;


    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "businesses"
        )
        .select(`
          id,
          owner_id,
          name,
          plan,
          active
        `)
        .eq(
          "owner_id",
          authUser.id
        )
        .single();


    if (error) {

      console.error(
        "Erro ao carregar estabelecimento:",
        error
      );

      notify(
        "Não foi possível carregar o estabelecimento."
      );

      return false;
    }


    business = data;


    document
      .querySelectorAll(
        "[data-shop-name]"
      )
      .forEach(
        element => {

          element.textContent =
            business.name ||
            "Kato's Agenda";

        }
      );


    document
      .querySelectorAll(
        "[data-plan]"
      )
      .forEach(
        element => {

          element.textContent =
            planLabel(
              business.plan
            );

        }
      );


    return true;
  }


  /* =========================================================
     CARREGAR TICKETS
  ========================================================= */

  async function loadTickets() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("tickets")
        .select(`
          id,
          business_id,
          protocol,
          subject,
          category,
          status,
          created_at,
          updated_at
        `)
        .eq(
          "business_id",
          business.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    tickets =
      data || [];
  }


  /* =========================================================
     CARREGAR TODAS AS MENSAGENS
  ========================================================= */

  async function loadMessages() {

    if (
      !tickets.length
    ) {

      messages = [];

      return;
    }


    const ticketIds =
      tickets.map(
        ticket =>
          ticket.id
      );


    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "ticket_messages"
        )
        .select(`
          id,
          ticket_id,
          sender_type,
          sender_id,
          message,
          created_at
        `)
        .in(
          "ticket_id",
          ticketIds
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    messages =
      data || [];
  }


  /* =========================================================
     ATUALIZAR MENSAGENS DE UM TICKET
  ========================================================= */

  async function refreshTicketMessages(
    ticketId
  ) {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "ticket_messages"
        )
        .select(`
          id,
          ticket_id,
          sender_type,
          sender_id,
          message,
          created_at
        `)
        .eq(
          "ticket_id",
          ticketId
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    messages =
      messages.filter(
        message =>
          message.ticket_id !==
          ticketId
      );


    messages.push(
      ...(data || [])
    );
  }


  /* =========================================================
     CONTADORES
  ========================================================= */

  function updateCounters() {

    const open =
      tickets.filter(
        ticket =>
          normalizeStatus(
            ticket.status
          ) === "open"
      ).length;


    const progress =
      tickets.filter(
        ticket =>
          normalizeStatus(
            ticket.status
          ) === "progress"
      ).length;


    const resolved =
      tickets.filter(
        ticket =>
          normalizeStatus(
            ticket.status
          ) === "resolved"
      ).length;


    if (openCount) {

      openCount.textContent =
        open;

    }


    if (progressCount) {

      progressCount.textContent =
        progress;

    }


    if (resolvedCount) {

      resolvedCount.textContent =
        resolved;

    }
  }


  /* =========================================================
     RENDER LISTA
  ========================================================= */

  function render() {

    updateCounters();


    if (!tickets.length) {

      list.innerHTML = `
        <div class="tickets-empty">

          <div
            class="tickets-empty-icon"
          >
            ?
          </div>

          <strong>
            Nenhum chamado encontrado
          </strong>

          <span>
            Quando precisar de ajuda,
            abra um chamado para nossa equipe.
          </span>

        </div>
      `;

      return;
    }


    list.innerHTML =
      tickets
        .map(
          ticket => {

            const type =
              normalizeStatus(
                ticket.status
              );


            const ticketMessages =
              getTicketMessages(
                ticket.id
              );


            const lastMessage =
              ticketMessages[
                ticketMessages.length -
                1
              ];


            return `
              <article
                class="ticket-card"
                data-ticket="${ticket.id}"
              >

                <div
                  class="ticket-card-top"
                >

                  <div
                    class="ticket-card-main"
                  >

                    <div
                      class="ticket-protocol"
                    >
                      ${escapeHTML(
                        ticket.protocol ||
                        "KA-0000"
                      )}
                    </div>


                    <h3>
                      ${escapeHTML(
                        ticket.subject ||
                        "Chamado"
                      )}
                    </h3>

                  </div>


                  <span
                    class="
                      ticket-status
                      ${type}
                    "
                  >
                    ${statusLabel(
                      ticket.status
                    )}
                  </span>

                </div>


                <div
                  class="ticket-meta"
                >

                  <span>
                    ${escapeHTML(
                      ticket.category ||
                      "Geral"
                    )}
                  </span>

                  <span
                    class="ticket-meta-dot"
                  ></span>

                  <span>
                    ${formatDate(
                      ticket.created_at
                    )}
                  </span>

                  <span
                    class="ticket-meta-dot"
                  ></span>

                  <span>
                    ${ticketMessages.length}

                    ${
                      ticketMessages.length === 1
                        ? "mensagem"
                        : "mensagens"
                    }
                  </span>

                </div>


                <div
                  class="ticket-message"
                >

                  <p>
                    ${escapeHTML(
                      lastMessage?.message ||
                      "Sem mensagens."
                    )}
                  </p>

                </div>


                <div
                  class="ticket-card-footer"
                >

                  <button
                    type="button"
                    class="ticket-open-button"
                    data-open-ticket="${ticket.id}"
                  >
                    Abrir conversa
                  </button>

                </div>

              </article>
            `;

          }
        )
        .join("");
  }


  /* =========================================================
     RENDER CONVERSA
  ========================================================= */

  function renderConversation() {

    const ticket =
      getTicket(
        activeTicketId
      );


    if (!ticket) {
      return;
    }


    const ticketMessages =
      getTicketMessages(
        ticket.id
      );


    if (conversationTitle) {

      conversationTitle.textContent =
        ticket.subject ||
        "Chamado";

    }


    if (
      conversationProtocol
    ) {

      conversationProtocol.textContent =
        `${ticket.protocol} · ${ticket.category || "Geral"}`;

    }


    if (
      conversationMessages
    ) {

      conversationMessages.innerHTML =
        ticketMessages.length

          ? ticketMessages
              .map(
                message => {

                  const sender =
                    normalize(
                      message.sender_type
                    );


                  const isSupport =
                    sender ===
                    "support";


                  const isSystem =
                    sender ===
                    "system";


                  const messageClass =
                    isSystem
                      ? "system"
                      : isSupport
                        ? "support"
                        : "client";


                  const authorLabel =
                    isSystem
                      ? "Sistema"
                      : isSupport
                        ? "Suporte Kato's Agenda"
                        : "Você";


                  return `
                    <div
                      class="
                        conversation-message
                        ${messageClass}
                      "
                    >

                      <div
                        class="
                          conversation-bubble
                        "
                      >

                        <span
                          class="
                            conversation-author
                          "
                        >
                          ${authorLabel}
                        </span>


                        <p>
                          ${escapeHTML(
                            message.message
                          )}
                        </p>


                        <span
                          class="
                            conversation-date
                          "
                        >
                          ${formatDate(
                            message.created_at
                          )}
                        </span>

                      </div>

                    </div>
                  `;

                }
              )
              .join("")

          : `
            <div
              class="conversation-empty"
            >
              Nenhuma mensagem.
            </div>
          `;


      conversationMessages.scrollTop =
        conversationMessages.scrollHeight;

    }


    const resolved =
      normalizeStatus(
        ticket.status
      ) === "resolved";


    /*
     * Ticket resolvido:
     * mensagem fica bloqueada.
     *
     * O botão "Não resolveu"
     * permanece disponível para
     * reabrir o chamado.
     */

    if (
      conversationInput
    ) {

      conversationInput.disabled =
        resolved;

    }


    if (
      conversationForm
    ) {

      conversationForm
        .classList
        .toggle(
          "disabled",
          resolved
        );


      const sendButton =
        conversationForm
          .querySelector(
            'button[type="submit"]'
          );


      if (sendButton) {

        sendButton.disabled =
          resolved;

      }

    }


    if (resolvedButton) {

      resolvedButton.disabled =
        resolved;

    }


    if (unresolvedButton) {

      unresolvedButton.disabled =
        !resolved &&
        normalizeStatus(
          ticket.status
        ) === "open";

    }
  }


  /* =========================================================
     ABRIR CONVERSA
  ========================================================= */

  async function openConversation(
    ticketId
  ) {

    activeTicketId =
      ticketId;


    try {

      /*
       * Busca novamente as mensagens
       * para pegar possíveis respostas
       * novas do suporte.
       */

      await refreshTicketMessages(
        ticketId
      );


      renderConversation();


      openModal(
        "#ticketConversationModal"
      );


    } catch (error) {

      console.error(
        "Erro ao abrir conversa:",
        error
      );


      notify(
        "Não foi possível abrir a conversa."
      );

    }
  }


  /* =========================================================
     CLIQUE NA LISTA
  ========================================================= */

  list.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          "[data-open-ticket]"
        );


      if (!button) {
        return;
      }


      await openConversation(
        button.dataset
          .openTicket
      );

    }
  );


  /* =========================================================
     ENVIAR MENSAGEM
  ========================================================= */

  conversationForm
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const text =
          conversationInput
            ?.value
            .trim();


        if (!text) {
          return;
        }


        const ticket =
          getTicket(
            activeTicketId
          );


        if (!ticket) {
          return;
        }


        if (
          normalizeStatus(
            ticket.status
          ) === "resolved"
        ) {

          notify(
            "Reabra o chamado antes de enviar uma nova mensagem."
          );

          return;
        }


        const button =
          conversationForm
            .querySelector(
              'button[type="submit"]'
            );


        const oldText =
          button?.textContent;


        if (button) {

          button.disabled =
            true;

          button.textContent =
            "Enviando...";

        }


        try {

          const {
            data,
            error
          } =
            await supabaseClient
              .from(
                "ticket_messages"
              )
              .insert({

                ticket_id:
                  ticket.id,

                sender_type:
                  "customer",

                sender_id:
                  authUser.id,

                message:
                  text

              })
              .select()
              .single();


          if (error) {
            throw error;
          }


          messages.push(
            data
          );


          /*
           * Se estiver apenas aberto,
           * continua aberto.
           *
           * Se o suporte já colocou
           * em andamento, permanece.
           */

          const {
            data: updatedTicket,
            error: ticketError
          } =
            await supabaseClient
              .from("tickets")
              .update({

                updated_at:
                  new Date()
                    .toISOString()

              })
              .eq(
                "id",
                ticket.id
              )
              .eq(
                "business_id",
                business.id
              )
              .select()
              .single();


          if (ticketError) {
            throw ticketError;
          }


          const index =
            tickets.findIndex(
              item =>
                item.id ===
                ticket.id
            );


          if (index !== -1) {

            tickets[index] =
              updatedTicket;

          }


          conversationInput.value =
            "";


          renderConversation();

          render();


          notify(
            "Mensagem enviada."
          );


        } catch (error) {

          console.error(
            "Erro ao enviar mensagem:",
            error
          );


          notify(
            "Não foi possível enviar a mensagem."
          );


        } finally {

          if (button) {

            button.disabled =
              false;

            button.textContent =
              oldText ||
              "Enviar mensagem";

          }

        }

      }
    );


  /* =========================================================
     RESOLVIDO
  ========================================================= */

  resolvedButton
    ?.addEventListener(
      "click",
      async () => {

        const ticket =
          getTicket(
            activeTicketId
          );


        if (!ticket) {
          return;
        }


        try {

          const {
            data,
            error
          } =
            await supabaseClient
              .from("tickets")
              .update({

                status:
                  "resolvido",

                updated_at:
                  new Date()
                    .toISOString()

              })
              .eq(
                "id",
                ticket.id
              )
              .eq(
                "business_id",
                business.id
              )
              .select()
              .single();


          if (error) {
            throw error;
          }


          const index =
            tickets.findIndex(
              item =>
                item.id ===
                ticket.id
            );


          if (index !== -1) {

            tickets[index] =
              data;

          }


          renderConversation();

          render();


          notify(
            "Chamado marcado como resolvido."
          );


        } catch (error) {

          console.error(
            "Erro ao resolver chamado:",
            error
          );


          notify(
            "Não foi possível finalizar o chamado."
          );

        }

      }
    );


  /* =========================================================
     NÃO RESOLVEU / REABRIR
  ========================================================= */

  unresolvedButton
    ?.addEventListener(
      "click",
      async () => {

        const ticket =
          getTicket(
            activeTicketId
          );


        if (!ticket) {
          return;
        }


        try {

          /*
           * Atualiza status.
           */

          const {
            data: updatedTicket,
            error: ticketError
          } =
            await supabaseClient
              .from("tickets")
              .update({

                status:
                  "em_andamento",

                updated_at:
                  new Date()
                    .toISOString()

              })
              .eq(
                "id",
                ticket.id
              )
              .eq(
                "business_id",
                business.id
              )
              .select()
              .single();


          if (ticketError) {
            throw ticketError;
          }


          /*
           * Mensagem do sistema.
           */

          const {
            data: systemMessage,
            error: messageError
          } =
            await supabaseClient
              .from(
                "ticket_messages"
              )
              .insert({

                ticket_id:
                  ticket.id,

                sender_type:
                  "system",

                sender_id:
                  null,

                message:
                  "O cliente informou que o problema ainda não foi resolvido."

              })
              .select()
              .single();


          if (messageError) {
            throw messageError;
          }


          const index =
            tickets.findIndex(
              item =>
                item.id ===
                ticket.id
            );


          if (index !== -1) {

            tickets[index] =
              updatedTicket;

          }


          messages.push(
            systemMessage
          );


          renderConversation();

          render();


          notify(
            "Chamado reaberto."
          );


        } catch (error) {

          console.error(
            "Erro ao reabrir chamado:",
            error
          );


          notify(
            "Não foi possível reabrir o chamado."
          );

        }

      }
    );


  /* =========================================================
     CRIAR CHAMADO
  ========================================================= */

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const subject =
        subjectInput
          ?.value
          .trim();


      const category =
        categoryInput
          ?.value;


      const message =
        messageInput
          ?.value
          .trim();


      if (!subject) {

        notify(
          "Informe o assunto."
        );

        return;
      }


      if (!category) {

        notify(
          "Selecione uma categoria."
        );

        return;
      }


      if (!message) {

        notify(
          "Descreva o problema."
        );

        return;
      }


      const submitButton =
        form.querySelector(
          'button[type="submit"]'
        );


      const oldText =
        submitButton?.textContent;


      if (submitButton) {

        submitButton.disabled =
          true;

        submitButton.textContent =
          "Enviando...";

      }


      try {

        const protocol =
          generateProtocol();


        /*
         * 1. Cria o ticket.
         */

        const {
          data: ticket,
          error: ticketError
        } =
          await supabaseClient
            .from("tickets")
            .insert({

              business_id:
                business.id,

              protocol,

              subject,

              category,

              status:
                "aberto"

            })
            .select()
            .single();


        if (ticketError) {
          throw ticketError;
        }


        /*
         * 2. Cria primeira mensagem.
         */

        const {
          data: firstMessage,
          error: messageError
        } =
          await supabaseClient
            .from(
              "ticket_messages"
            )
            .insert({

              ticket_id:
                ticket.id,

              sender_type:
                "customer",

              sender_id:
                authUser.id,

              message

            })
            .select()
            .single();


        if (messageError) {

          /*
           * Se a mensagem falhar,
           * tentamos remover o ticket
           * vazio.
           */

          await supabaseClient
            .from("tickets")
            .delete()
            .eq(
              "id",
              ticket.id
            );

          throw messageError;
        }


        tickets.unshift(
          ticket
        );


        messages.push(
          firstMessage
        );


        form.reset();


        closeModal(
          "#ticketModal"
        );


        render();


        notify(
          "Chamado aberto com sucesso."
        );


      } catch (error) {

        console.error(
          "Erro ao abrir chamado:",
          error
        );


        notify(
          "Não foi possível abrir o chamado."
        );


      } finally {

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            oldText ||
            "Enviar chamado";

        }

      }

    }
  );


  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  async function init() {

    try {

      const loaded =
        await loadAccount();


      if (!loaded) {
        return;
      }


      await loadTickets();

      await loadMessages();


      render();


    } catch (error) {

      console.error(
        "Erro ao carregar Suporte:",
        error
      );


      notify(
        "Não foi possível carregar os chamados."
      );

    }

  }


  init();

})();