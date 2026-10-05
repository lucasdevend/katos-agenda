(function () {

  /* =========================================================
     ELEMENTOS
  ========================================================= */

  const body =
    document.querySelector(
      "#clientsBody"
    );

  const form =
    document.querySelector(
      "#clientForm"
    );

  const searchInput =
    document.querySelector(
      "#clientsSearch"
    );

  const newClientButton =
    document.querySelector(
      "#newClientButton"
    );


  const modalTitle =
    document.querySelector(
      "#clientModalTitle"
    );

  const editIdInput =
    document.querySelector(
      "#clientEditId"
    );

  const nameInput =
    document.querySelector(
      "#clientName"
    );

  const phoneInput =
    document.querySelector(
      "#clientPhone"
    );

  const emailInput =
    document.querySelector(
      "#clientEmail"
    );


  const totalStat =
    document.querySelector(
      "#clientsTotalStat"
    );

  const returnStat =
    document.querySelector(
      "#clientsReturnStat"
    );

  const appointmentsStat =
    document.querySelector(
      "#clientsAppointmentsStat"
    );

  const newMonthStat =
    document.querySelector(
      "#clientsNewMonthStat"
    );


  if (
    !body ||
    !form
  ) {
    return;
  }


  /* =========================================================
     ESTADO
  ========================================================= */

  let authUser = null;

  let business = null;

  let clients = [];

  let appointments = [];

  let services = [];

  let professionals = [];


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
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function formatDateSafe(
    dateString
  ) {

    if (!dateString) {
      return "-";
    }


    const date =
      String(dateString)
        .slice(0, 10);


    const parts =
      date.split("-");


    if (
      parts.length !== 3
    ) {
      return dateString;
    }


    const [
      year,
      month,
      day
    ] = parts;


    return `${day}/${month}/${year}`;
  }


  function formatTimeSafe(
    time
  ) {

    if (!time) {
      return "";
    }

    return String(time)
      .slice(0, 5);
  }


  function currency(value) {

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


  function normalize(text) {

    return String(
      text || ""
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim();
  }


  function currentMonthPrefix() {

    const now =
      new Date();


    return (
      now.getFullYear() +
      "-" +
      String(
        now.getMonth() + 1
      ).padStart(2, "0")
    );
  }


  function getClientAppointments(
    clientId
  ) {

    return appointments
      .filter(
        appointment =>
          appointment.client_id ===
          clientId
      )
      .sort(
        (a, b) => {

          const valueA =
            `${a.appointment_date || ""}${a.appointment_time || ""}`;

          const valueB =
            `${b.appointment_date || ""}${b.appointment_time || ""}`;


          return valueB.localeCompare(
            valueA
          );

        }
      );
  }


  function getServiceById(
    serviceId
  ) {

    return services.find(
      service =>
        service.id ===
        serviceId
    );
  }


  function getProfessionalById(
    professionalId
  ) {

    return professionals.find(
      professional =>
        professional.id ===
        professionalId
    );
  }


  function getStatusClass(
    status
  ) {

    const value =
      normalize(status);


    if (
      value === "confirmado"
    ) {
      return "confirmed";
    }


    if (
      value === "concluido"
    ) {
      return "completed";
    }


    if (
      value === "cancelado"
    ) {
      return "cancelled";
    }


    return "pending";
  }


  function statusLabel(
    status
  ) {

    const value =
      normalize(status);


    if (
      value === "confirmado"
    ) {
      return "Confirmado";
    }


    if (
      value === "concluido"
    ) {
      return "Concluído";
    }


    if (
      value === "cancelado"
    ) {
      return "Cancelado";
    }


    return "Agendado";
  }


  function isCancelled(
    status
  ) {

    return (
      normalize(status) ===
      "cancelado"
    );
  }


  function isCompleted(
    status
  ) {

    return (
      normalize(status) ===
      "concluido"
    );
  }


  function getInitials(name) {

    return String(
      name || "C"
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(
        item =>
          item.charAt(0)
      )
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }


  /* =========================================================
     CARREGAR CONTA
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

          const value =
            String(
              business.plan ||
              "starter"
            );


          element.textContent =
            value.charAt(0)
              .toUpperCase() +
            value.slice(1);

        }
      );


    return true;
  }


  /* =========================================================
     CARREGAR CLIENTES
  ========================================================= */

  async function loadClients() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "clients"
        )
        .select(`
          id,
          business_id,
          name,
          phone,
          email,
          notes,
          created_at
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


    clients =
      data || [];
  }


  /* =========================================================
     CARREGAR AGENDA
  ========================================================= */

  async function loadAppointments() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "appointments"
        )
        .select(`
          id,
          business_id,
          client_id,
          professional_id,
          service_id,
          appointment_date,
          appointment_time,
          status,
          notes,
          created_at
        `)
        .eq(
          "business_id",
          business.id
        );


    if (error) {
      throw error;
    }


    appointments =
      data || [];
  }


  /* =========================================================
     SERVIÇOS
  ========================================================= */

  async function loadServices() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "services"
        )
        .select(`
          id,
          name,
          price,
          duration
        `)
        .eq(
          "business_id",
          business.id
        );


    if (error) {
      throw error;
    }


    services =
      data || [];
  }


  /* =========================================================
     PROFISSIONAIS
  ========================================================= */

  async function loadProfessionals() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "professionals"
        )
        .select(`
          id,
          name
        `)
        .eq(
          "business_id",
          business.id
        );


    if (error) {
      throw error;
    }


    professionals =
      data || [];
  }


  /* =========================================================
     ESTATÍSTICAS
  ========================================================= */

  function updateStats() {

    const monthPrefix =
      currentMonthPrefix();


    const clientsWithReturn =
      clients.filter(
        client => {

          const valid =
            getClientAppointments(
              client.id
            )
              .filter(
                appointment =>
                  !isCancelled(
                    appointment.status
                  )
              );


          return (
            valid.length > 1
          );

        }
      ).length;


    /*
     * Aqui usamos concluídos para
     * "Atendimentos realizados".
     */

    const completedAppointments =
      appointments.filter(
        appointment =>
          isCompleted(
            appointment.status
          )
      ).length;


    const newThisMonth =
      clients.filter(
        client =>
          String(
            client.created_at ||
            ""
          ).startsWith(
            monthPrefix
          )
      ).length;


    if (totalStat) {

      totalStat.textContent =
        clients.length;

    }


    if (returnStat) {

      returnStat.textContent =
        clientsWithReturn;

    }


    if (appointmentsStat) {

      appointmentsStat.textContent =
        completedAppointments;

    }


    if (newMonthStat) {

      newMonthStat.textContent =
        newThisMonth;

    }
  }


  /* =========================================================
     NOVO CLIENTE
  ========================================================= */

  function openCreateModal() {

    if (modalTitle) {

      modalTitle.textContent =
        "Novo cliente";

    }


    if (editIdInput) {

      editIdInput.value =
        "";

    }


    form.reset();


    openModal(
      "#clientModal"
    );
  }


  /* =========================================================
     EDITAR
  ========================================================= */

  function openEditModal(
    clientId
  ) {

    const client =
      clients.find(
        item =>
          item.id ===
          clientId
      );


    if (!client) {
      return;
    }


    if (modalTitle) {

      modalTitle.textContent =
        "Editar cliente";

    }


    if (editIdInput) {

      editIdInput.value =
        client.id;

    }


    if (nameInput) {

      nameInput.value =
        client.name ||
        "";

    }


    if (phoneInput) {

      phoneInput.value =
        client.phone ||
        "";

    }


    if (emailInput) {

      emailInput.value =
        client.email ||
        "";

    }


    openModal(
      "#clientModal"
    );
  }


  /* =========================================================
     HISTÓRICO
  ========================================================= */

  function openHistoryModal(
    clientId
  ) {

    const client =
      clients.find(
        item =>
          item.id ===
          clientId
      );


    if (!client) {
      return;
    }


    const historyName =
      document.querySelector(
        "#historyClientName"
      );

    const historyVisits =
      document.querySelector(
        "#historyVisits"
      );

    const historyLastVisit =
      document.querySelector(
        "#historyLastVisit"
      );

    const historyTotalSpent =
      document.querySelector(
        "#historyTotalSpent"
      );

    const historyList =
      document.querySelector(
        "#clientHistoryList"
      );


    const clientAppointments =
      getClientAppointments(
        clientId
      );


    const validAppointments =
      clientAppointments.filter(
        appointment =>
          !isCancelled(
            appointment.status
          )
      );


    const completedAppointments =
      clientAppointments.filter(
        appointment =>
          isCompleted(
            appointment.status
          )
      );


    const totalSpent =
      completedAppointments.reduce(
        (
          total,
          appointment
        ) => {

          const service =
            getServiceById(
              appointment.service_id
            );


          return (
            total +
            Number(
              service?.price ||
              0
            )
          );

        },
        0
      );


    if (historyName) {

      historyName.textContent =
        client.name ||
        "Histórico do cliente";

    }


    if (historyVisits) {

      historyVisits.textContent =
        completedAppointments.length;

    }


    if (historyLastVisit) {

      const lastCompleted =
        completedAppointments[0];


      historyLastVisit.textContent =
        lastCompleted
          ? formatDateSafe(
              lastCompleted
                .appointment_date
            )
          : "-";

    }


    if (historyTotalSpent) {

      historyTotalSpent.textContent =
        currency(
          totalSpent
        );

    }


    if (!historyList) {
      return;
    }


    if (
      !clientAppointments.length
    ) {

      historyList.innerHTML = `
        <div class="history-empty">

          <strong>
            Nenhum histórico encontrado
          </strong>

          <span>
            Os atendimentos deste cliente aparecerão aqui.
          </span>

        </div>
      `;


      openModal(
        "#clientHistoryModal"
      );


      return;
    }


    historyList.innerHTML =
      clientAppointments
        .map(
          appointment => {

            const service =
              getServiceById(
                appointment.service_id
              );


            const professional =
              getProfessionalById(
                appointment
                  .professional_id
              );


            const statusClass =
              getStatusClass(
                appointment.status
              );


            return `
              <div
                class="history-item"
              >

                <div
                  class="history-item-main"
                >

                  <strong>
                    ${escapeHTML(
                      service?.name ||
                      "Serviço"
                    )}
                  </strong>

                  <span>
                    ${
                      professional?.name

                        ? `com ${escapeHTML(
                            professional.name
                          )}`

                        : "Profissional não informado"
                    }
                  </span>

                </div>


                <div
                  class="history-item-meta"
                >

                  <span>
                    ${formatDateSafe(
                      appointment
                        .appointment_date
                    )}

                    ${
                      appointment
                        .appointment_time

                        ? ` às ${formatTimeSafe(
                            appointment
                              .appointment_time
                          )}`

                        : ""
                    }
                  </span>


                  <span>
                    ${currency(
                      service?.price ||
                      0
                    )}
                  </span>


                  <span
                    class="
                      history-status
                      ${statusClass}
                    "
                  >
                    ${statusLabel(
                      appointment.status
                    )}
                  </span>

                </div>

              </div>
            `;

          }
        )
        .join("");


    openModal(
      "#clientHistoryModal"
    );
  }


  /* =========================================================
     EXCLUIR CLIENTE
  ========================================================= */

  async function deleteClient(
    clientId
  ) {

    const client =
      clients.find(
        item =>
          item.id ===
          clientId
      );


    if (!client) {
      return;
    }


    const linkedAppointments =
      getClientAppointments(
        clientId
      );


    /*
     * No nosso banco client_id usa
     * ON DELETE SET NULL.
     *
     * Então não apagamos o histórico
     * dos agendamentos ao excluir cliente.
     */

    let message =
      "Deseja realmente excluir este cliente?";


    if (
      linkedAppointments.length
    ) {

      message =
        `Este cliente possui ${linkedAppointments.length} agendamento(s) vinculado(s). O histórico dos agendamentos será mantido, mas ficará sem vínculo com o cliente. Deseja continuar?`;

    }


    const confirmed =
      window.confirm(
        message
      );


    if (!confirmed) {
      return;
    }


    const {
      error
    } =
      await supabaseClient
        .from(
          "clients"
        )
        .delete()
        .eq(
          "id",
          clientId
        )
        .eq(
          "business_id",
          business.id
        );


    if (error) {

      console.error(
        "Erro ao excluir cliente:",
        error
      );


      notify(
        "Não foi possível excluir o cliente."
      );

      return;
    }


    clients =
      clients.filter(
        item =>
          item.id !==
          clientId
      );


    /*
     * Atualiza o estado local para
     * refletir o ON DELETE SET NULL.
     */

    appointments =
      appointments.map(
        appointment => {

          if (
            appointment.client_id ===
            clientId
          ) {

            return {
              ...appointment,
              client_id: null
            };

          }


          return appointment;

        }
      );


    render();


    notify(
      "Cliente excluído."
    );
  }


  /* =========================================================
     RENDER
  ========================================================= */

  function render() {

    const search =
      normalize(
        searchInput?.value ||
        ""
      );


    const filteredClients =
      clients.filter(
        client => {

          if (!search) {
            return true;
          }


          return [
            client.name,
            client.phone,
            client.email
          ].some(
            field =>
              normalize(field)
                .includes(search)
          );

        }
      );


    updateStats();


    if (
      !filteredClients.length
    ) {

      body.innerHTML = `
        <tr>

          <td
            colspan="5"
            class="empty"
          >
            Nenhum cliente encontrado.
          </td>

        </tr>
      `;

      return;
    }


    body.innerHTML =
      filteredClients
        .map(
          client => {

            const clientAppointments =
              getClientAppointments(
                client.id
              );


            const completedAppointments =
              clientAppointments.filter(
                appointment =>
                  isCompleted(
                    appointment.status
                  )
              );


            const lastCompleted =
              completedAppointments[0];


            return `
              <tr>

                <td>

                  <div
                    class="
                      client-table-user
                    "
                  >

                    <div
                      class="client-avatar"
                    >
                      ${escapeHTML(
                        getInitials(
                          client.name
                        )
                      )}
                    </div>


                    <div
                      class="
                        client-table-user-info
                      "
                    >

                      <strong>
                        ${escapeHTML(
                          client.name ||
                          "-"
                        )}
                      </strong>

                      <span>
                        ${escapeHTML(
                          client.email ||
                          "Sem e-mail cadastrado"
                        )}
                      </span>

                    </div>

                  </div>

                </td>


                <td>

                  <div
                    class="
                      client-contact-col
                    "
                  >

                    <strong>
                      ${escapeHTML(
                        client.phone ||
                        "-"
                      )}
                    </strong>

                    <span>
                      ${escapeHTML(
                        client.email ||
                        "-"
                      )}
                    </span>

                  </div>

                </td>


                <td>

                  <span
                    class="
                      client-visits-badge
                    "
                  >
                    ${completedAppointments.length}

                    ${
                      completedAppointments.length === 1
                        ? "visita"
                        : "visitas"
                    }
                  </span>

                </td>


                <td>
                  ${
                    lastCompleted
                      ? formatDateSafe(
                          lastCompleted
                            .appointment_date
                        )
                      : "-"
                  }
                </td>


                <td>

                  <div
                    class="client-actions"
                  >

                    <button
                      type="button"
                      class="
                        table-action-btn
                      "
                      data-edit="${client.id}"
                    >
                      Editar
                    </button>


                    <button
                      type="button"
                      class="
                        table-action-btn
                      "
                      data-history="${client.id}"
                    >
                      Histórico
                    </button>


                    <button
                      type="button"
                      class="
                        table-action-btn
                        danger
                      "
                      data-delete="${client.id}"
                    >
                      Excluir
                    </button>

                  </div>

                </td>

              </tr>
            `;

          }
        )
        .join("");
  }


  /* =========================================================
     SALVAR CLIENTE
  ========================================================= */

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const id =
        editIdInput?.value
          .trim() ||
        "";


      const name =
        nameInput?.value
          .trim();


      const phone =
        phoneInput?.value
          .trim();


      const email =
        emailInput?.value
          .trim()
          .toLowerCase() ||
        null;


      if (
        !name ||
        !phone
      ) {

        notify(
          "Preencha nome e telefone."
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
          "Salvando...";

      }


      try {

        /* =================================================
           EDITAR
        ================================================= */

        if (id) {

          const {
            data,
            error
          } =
            await supabaseClient
              .from(
                "clients"
              )
              .update({

                name,

                phone,

                email,

                updated_at:
                  new Date()
                    .toISOString()

              })
              .eq(
                "id",
                id
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
            clients.findIndex(
              item =>
                item.id === id
            );


          if (
            index !== -1
          ) {

            clients[index] =
              data;

          }


          closeModal(
            "#clientModal"
          );


          form.reset();


          if (editIdInput) {
            editIdInput.value =
              "";
          }


          render();


          notify(
            "Cliente atualizado."
          );


          return;
        }


        /* =================================================
           CADASTRAR
        ================================================= */

        const {
          data,
          error
        } =
          await supabaseClient
            .from(
              "clients"
            )
            .insert({

              business_id:
                business.id,

              name,

              phone,

              email

            })
            .select()
            .single();


        if (error) {
          throw error;
        }


        clients.unshift(
          data
        );


        form.reset();


        closeModal(
          "#clientModal"
        );


        render();


        notify(
          "Cliente cadastrado."
        );


      } catch (error) {

        console.error(
          "Erro ao salvar cliente:",
          error
        );


        notify(
          "Não foi possível salvar o cliente."
        );


      } finally {

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            oldText ||
            "Salvar cliente";

        }

      }

    }
  );


  /* =========================================================
     AÇÕES
  ========================================================= */

  body.addEventListener(
    "click",
    async event => {

      const editButton =
        event.target.closest(
          "[data-edit]"
        );


      const historyButton =
        event.target.closest(
          "[data-history]"
        );


      const deleteButton =
        event.target.closest(
          "[data-delete]"
        );


      if (editButton) {

        openEditModal(
          editButton.dataset.edit
        );

        return;
      }


      if (historyButton) {

        openHistoryModal(
          historyButton
            .dataset
            .history
        );

        return;
      }


      if (deleteButton) {

        await deleteClient(
          deleteButton.dataset.delete
        );

      }

    }
  );


  /* =========================================================
     BUSCA
  ========================================================= */

  searchInput?.addEventListener(
    "input",
    render
  );


  /* =========================================================
     NOVO
  ========================================================= */

  newClientButton
    ?.addEventListener(
      "click",
      openCreateModal
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


      await Promise.all([
        loadClients(),
        loadAppointments(),
        loadServices(),
        loadProfessionals()
      ]);


      render();


    } catch (error) {

      console.error(
        "Erro ao carregar Clientes:",
        error
      );


      notify(
        "Não foi possível carregar os clientes."
      );

    }

  }


  init();

})();