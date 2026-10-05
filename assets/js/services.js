(function () {

  /* =========================================================
     ELEMENTOS
  ========================================================= */

  const container =
    document.querySelector(
      "#servicesProfessionals"
    );

  const form =
    document.querySelector(
      "#serviceForm"
    );

  const newServiceButton =
    document.querySelector(
      "#newServiceButton"
    );

  const professionalSelect =
    document.querySelector(
      "#serviceProfessionalId"
    );

  const professionalGroup =
    document.querySelector(
      "#professionalServiceGroup"
    );

  const nameInput =
    document.querySelector(
      "#serviceName"
    );

  const priceInput =
    document.querySelector(
      "#servicePrice"
    );

  const durationInput =
    document.querySelector(
      "#serviceDuration"
    );

  const editIdInput =
    document.querySelector(
      "#serviceEditId"
    );

  const modalTitle =
    document.querySelector(
      "#serviceModalTitle"
    );


  if (
    !container ||
    !form
  ) {

    console.error(
      "Elementos da página de serviços não encontrados."
    );

    return;
  }


  /* =========================================================
     ESTADO
  ========================================================= */

  let authUser = null;

  let business = null;

  let professionals = [];

  let services = [];


  /* =========================================================
     AUXILIARES
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


  function planLabel(plan) {

    const value =
      String(
        plan || ""
      )
        .toLowerCase()
        .trim();


    if (
      value === "platinum"
    ) {
      return "Platinum";
    }


    if (
      value === "business"
    ) {
      return "Business";
    }


    return "Starter";
  }


  function professionalLimit() {

    if (
      typeof planLimit ===
      "function"
    ) {

      return planLimit(
        business?.plan
      );
    }


    if (
      business?.plan ===
      "platinum"
    ) {
      return 8;
    }


    if (
      business?.plan ===
      "business"
    ) {
      return 5;
    }


    return 1;
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


    if (
      business.active === false
    ) {

      notify(
        "Esta conta está desativada."
      );

      return false;
    }


    document
      .querySelectorAll(
        "[data-plan]"
      )
      .forEach(element => {

        element.textContent =
          planLabel(
            business.plan
          );

      });


    document
      .querySelectorAll(
        "[data-shop-name]"
      )
      .forEach(element => {

        element.textContent =
          business.name ||
          "Kato's Agenda";

      });


    return true;
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
          business_id,
          name,
          phone,
          active,
          created_at
        `)
        .eq(
          "business_id",
          business.id
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


    if (error) {

      console.error(
        "Erro ao carregar profissionais:",
        error
      );

      throw error;
    }


    professionals =
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
          business_id,
          professional_id,
          name,
          price,
          duration,
          active,
          created_at
        `)
        .eq(
          "business_id",
          business.id
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


    if (error) {

      console.error(
        "Erro ao carregar serviços:",
        error
      );

      throw error;
    }


    services =
      data || [];
  }


  /* =========================================================
     SELECT DE PROFISSIONAIS
  ========================================================= */

  function loadProfessionalSelect() {

    if (!professionalSelect) {
      return;
    }


    const activeProfessionals =
      professionals.filter(
        professional =>
          professional.active !==
          false
      );


    professionalSelect.innerHTML =
      activeProfessionals.length

        ? activeProfessionals
            .map(
              professional => `
                <option
                  value="${professional.id}"
                >
                  ${escapeHTML(
                    professional.name
                  )}
                </option>
              `
            )
            .join("")

        : `
          <option value="">
            Nenhum profissional cadastrado
          </option>
        `;


    if (professionalGroup) {

      professionalGroup.style.display =
        professionalLimit() === 1
          ? "none"
          : "";

    }
  }


  /* =========================================================
     RENDER
  ========================================================= */

  function render() {

    if (
      !professionals.length
    ) {

      container.innerHTML = `
        <div class="card services-empty">

          <strong>
            Nenhum profissional cadastrado
          </strong>

          <span>
            Cadastre um profissional antes de criar serviços.
          </span>

          <a
            href="professionals.html"
            class="btn btn-primary"
          >
            Cadastrar profissional
          </a>

        </div>
      `;

      return;
    }


    container.innerHTML =
      professionals
        .map(
          professional => {

            const professionalServices =
              services.filter(
                service =>
                  service.professional_id ===
                  professional.id
              );


            return `
              <div
                class="
                  card
                  professional-services-card
                "
              >

                <div
                  class="
                    professional-services-header
                  "
                >

                  <div>

                    <span
                      class="
                        professional-services-label
                      "
                    >
                      Profissional
                    </span>

                    <h3>
                      ${escapeHTML(
                        professional.name
                      )}
                    </h3>

                    <p>
                      ${professionalServices.length}

                      ${
                        professionalServices.length === 1

                          ? "serviço cadastrado"

                          : "serviços cadastrados"
                      }
                    </p>

                  </div>


                  <button
                    type="button"
                    class="
                      btn
                      btn-secondary
                    "
                    data-add-service="${professional.id}"
                  >
                    Adicionar serviço
                  </button>

                </div>


                <div
                  class="services-list"
                >

                  ${
                    professionalServices.length

                      ? professionalServices
                          .map(
                            service => {

                              const active =
                                service.active !==
                                false;


                              return `
                                <div
                                  class="
                                    service-row
                                    ${
                                      active
                                        ? ""
                                        : "inactive"
                                    }
                                  "
                                >

                                  <div
                                    class="service-main"
                                  >

                                    <strong>
                                      ${escapeHTML(
                                        service.name
                                      )}
                                    </strong>

                                    <span>
                                      ${
                                        Number(
                                          service.duration
                                        ) || 30
                                      }
                                      min
                                    </span>

                                  </div>


                                  <div
                                    class="service-price"
                                  >
                                    ${currency(
                                      service.price
                                    )}
                                  </div>


                                  <div
                                    class="service-status"
                                  >

                                    <span
                                      class="
                                        service-status-badge
                                        ${
                                          active
                                            ? "active"
                                            : "inactive"
                                        }
                                      "
                                    >
                                      ${
                                        active
                                          ? "Ativo"
                                          : "Inativo"
                                      }
                                    </span>

                                  </div>


                                  <div
                                    class="service-actions"
                                  >

                                    <button
                                      type="button"
                                      class="
                                        table-action-btn
                                      "
                                      data-edit-service="${service.id}"
                                    >
                                      Editar
                                    </button>


                                    <button
                                      type="button"
                                      class="
                                        table-action-btn
                                      "
                                      data-toggle-service="${service.id}"
                                    >
                                      ${
                                        active
                                          ? "Desativar"
                                          : "Ativar"
                                      }
                                    </button>


                                    <button
                                      type="button"
                                      class="
                                        table-action-btn
                                        danger
                                      "
                                      data-delete-service="${service.id}"
                                    >
                                      Excluir
                                    </button>

                                  </div>

                                </div>
                              `;
                            }
                          )
                          .join("")

                      : `
                        <div
                          class="
                            services-empty-inline
                          "
                        >

                          <span>
                            Nenhum serviço cadastrado para este profissional.
                          </span>

                        </div>
                      `
                  }

                </div>

              </div>
            `;

          }
        )
        .join("");
  }


  /* =========================================================
     NOVO SERVIÇO
  ========================================================= */

  function openCreateModal(
    professionalId = null
  ) {

    const activeProfessionals =
      professionals.filter(
        professional =>
          professional.active !==
          false
      );


    if (
      !activeProfessionals.length
    ) {

      notify(
        "Cadastre ou ative um profissional antes de adicionar serviços."
      );

      return;
    }


    form.reset();


    if (editIdInput) {
      editIdInput.value = "";
    }


    if (modalTitle) {

      modalTitle.textContent =
        "Novo serviço";

    }


    /*
     * Starter:
     * só existe 1 profissional permitido,
     * então o select fica oculto.
     */

    if (
      professionalLimit() === 1
    ) {

      professionalSelect.value =
        activeProfessionals[0].id;

    }

    else if (
      professionalId
    ) {

      professionalSelect.value =
        professionalId;

    }


    /*
     * Valor padrão.
     */

    if (durationInput) {

      durationInput.value =
        "30";

    }


    openModal(
      "#serviceModal"
    );
  }


  /* =========================================================
     EDITAR SERVIÇO
  ========================================================= */

  function openEditModal(
    serviceId
  ) {

    const service =
      services.find(
        item =>
          item.id ===
          serviceId
      );


    if (!service) {
      return;
    }


    if (modalTitle) {

      modalTitle.textContent =
        "Editar serviço";

    }


    if (editIdInput) {

      editIdInput.value =
        service.id;

    }


    if (professionalSelect) {

      professionalSelect.value =
        service.professional_id;

    }


    if (nameInput) {

      nameInput.value =
        service.name ||
        "";

    }


    if (priceInput) {

      priceInput.value =
        Number(
          service.price || 0
        );

    }


    if (durationInput) {

      durationInput.value =
        String(
          service.duration ||
          30
        );

    }


    openModal(
      "#serviceModal"
    );
  }


  /* =========================================================
     SALVAR
  ========================================================= */

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const activeProfessionals =
        professionals.filter(
          professional =>
            professional.active !==
            false
        );


      const professionalId =
        professionalLimit() === 1

          ? activeProfessionals[0]
              ?.id

          : professionalSelect
              ?.value;


      if (!professionalId) {

        notify(
          "Selecione um profissional."
        );

        return;
      }


      const professionalExists =
        professionals.some(
          professional =>
            professional.id ===
              professionalId &&
            professional.active !==
              false
        );


      if (!professionalExists) {

        notify(
          "Profissional inválido ou desativado."
        );

        return;
      }


      const name =
        nameInput?.value
          .trim();


      const price =
        Number(
          priceInput?.value
        );


      const duration =
        Number(
          durationInput?.value
        );


      if (!name) {

        notify(
          "Informe o nome do serviço."
        );

        return;
      }


      if (
        Number.isNaN(price) ||
        price < 0
      ) {

        notify(
          "Informe um valor válido."
        );

        return;
      }


      if (
        Number.isNaN(duration) ||
        duration <= 0
      ) {

        notify(
          "Informe uma duração válida."
        );

        return;
      }


      const editId =
        editIdInput?.value ||
        "";


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

        if (editId) {

          const {
            data,
            error
          } =
            await supabaseClient
              .from(
                "services"
              )
              .update({

                professional_id:
                  professionalId,

                name,

                price,

                duration,

                updated_at:
                  new Date()
                    .toISOString()

              })
              .eq(
                "id",
                editId
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
            services.findIndex(
              service =>
                service.id ===
                editId
            );


          if (
            index !== -1
          ) {

            services[index] =
              data;

          }


          form.reset();


          if (editIdInput) {
            editIdInput.value =
              "";
          }


          closeModal(
            "#serviceModal"
          );


          render();


          notify(
            "Serviço atualizado."
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
              "services"
            )
            .insert({

              business_id:
                business.id,

              professional_id:
                professionalId,

              name,

              price,

              duration,

              active:
                true

            })
            .select()
            .single();


        if (error) {
          throw error;
        }


        services.push(
          data
        );


        form.reset();


        if (editIdInput) {
          editIdInput.value =
            "";
        }


        closeModal(
          "#serviceModal"
        );


        render();


        notify(
          "Serviço cadastrado."
        );


      } catch (error) {

        console.error(
          "Erro ao salvar serviço:",
          error
        );


        notify(
          "Não foi possível salvar o serviço."
        );


      } finally {

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            oldText ||
            "Salvar serviço";

        }

      }

    }
  );


  /* =========================================================
     ATIVAR / DESATIVAR
  ========================================================= */

  async function toggleService(
    serviceId
  ) {

    const service =
      services.find(
        item =>
          item.id ===
          serviceId
      );


    if (!service) {
      return;
    }


    const newStatus =
      !(
        service.active !==
        false
      );


    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "services"
        )
        .update({

          active:
            newStatus,

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          serviceId
        )
        .eq(
          "business_id",
          business.id
        )
        .select()
        .single();


    if (error) {

      console.error(
        "Erro ao alterar serviço:",
        error
      );

      notify(
        "Não foi possível alterar o serviço."
      );

      return;
    }


    const index =
      services.findIndex(
        item =>
          item.id ===
          serviceId
      );


    if (
      index !== -1
    ) {

      services[index] =
        data;

    }


    render();


    notify(
      data.active
        ? "Serviço ativado."
        : "Serviço desativado."
    );
  }


  /* =========================================================
     EXCLUIR SERVIÇO
  ========================================================= */

  async function deleteService(
    serviceId
  ) {

    const service =
      services.find(
        item =>
          item.id ===
          serviceId
      );


    if (!service) {
      return;
    }


    /*
     * Verifica agendamentos primeiro.
     */

    const {
      count,
      error: countError
    } =
      await supabaseClient
        .from(
          "appointments"
        )
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )
        .eq(
          "business_id",
          business.id
        )
        .eq(
          "service_id",
          serviceId
        );


    if (countError) {

      console.error(
        "Erro ao verificar agendamentos:",
        countError
      );

      notify(
        "Não foi possível verificar os agendamentos deste serviço."
      );

      return;
    }


    if (
      Number(
        count || 0
      ) > 0
    ) {

      notify(
        "Este serviço possui agendamentos vinculados. Desative o serviço em vez de excluir."
      );

      return;
    }


    const confirmed =
      window.confirm(
        `Deseja excluir o serviço "${service.name}"?`
      );


    if (!confirmed) {
      return;
    }


    const {
      error
    } =
      await supabaseClient
        .from(
          "services"
        )
        .delete()
        .eq(
          "id",
          serviceId
        )
        .eq(
          "business_id",
          business.id
        );


    if (error) {

      console.error(
        "Erro ao excluir serviço:",
        error
      );


      /*
       * Como service_id usa ON DELETE RESTRICT
       * em appointments, o banco também protege
       * contra exclusões indevidas.
       */

      notify(
        "Não foi possível excluir o serviço."
      );

      return;
    }


    services =
      services.filter(
        item =>
          item.id !==
          serviceId
      );


    render();


    notify(
      "Serviço excluído."
    );
  }


  /* =========================================================
     CLIQUES
  ========================================================= */

  container.addEventListener(
    "click",
    async event => {

      const add =
        event.target.closest(
          "[data-add-service]"
        );


      const edit =
        event.target.closest(
          "[data-edit-service]"
        );


      const toggle =
        event.target.closest(
          "[data-toggle-service]"
        );


      const remove =
        event.target.closest(
          "[data-delete-service]"
        );


      if (add) {

        openCreateModal(
          add.dataset
            .addService
        );

        return;
      }


      if (edit) {

        openEditModal(
          edit.dataset
            .editService
        );

        return;
      }


      if (toggle) {

        await toggleService(
          toggle.dataset
            .toggleService
        );

        return;
      }


      if (remove) {

        await deleteService(
          remove.dataset
            .deleteService
        );

      }

    }
  );


  /* =========================================================
     BOTÃO NOVO SERVIÇO
  ========================================================= */

  newServiceButton
    ?.addEventListener(
      "click",
      () => {

        openCreateModal();

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


      await Promise.all([
        loadProfessionals(),
        loadServices()
      ]);


      loadProfessionalSelect();

      render();


    } catch (error) {

      console.error(
        "Erro ao iniciar Serviços:",
        error
      );


      notify(
        "Não foi possível carregar os serviços."
      );

    }

  }


  init();

})();