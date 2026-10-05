(function () {

  /* =========================================================
     ELEMENTOS
  ========================================================= */

  const table =
    document.querySelector("#appointmentsBody");

  const form =
    document.querySelector("#appointmentForm");

  const clientSelect =
    document.querySelector("#clientId");

  const newClientFields =
    document.querySelector("#newClientFields");

  const clientNameInput =
    document.querySelector("#appointmentClientName");

  const clientPhoneInput =
    document.querySelector("#appointmentClientPhone");

  const clientEmailInput =
    document.querySelector("#appointmentClientEmail");

  const professionalSelect =
    document.querySelector("#professionalId");

  const serviceSelect =
    document.querySelector("#serviceId");

  const dateInput =
    document.querySelector("#date");

  const timeInput =
    document.querySelector("#time");

  const timeSlots =
    document.querySelector("#timeSlots");

  const timeHelp =
    document.querySelector("#timeHelp");

  const selectedTimeText =
    document.querySelector("#selectedTimeText");

  const appointmentModal =
    document.querySelector("#appointmentModal");

  const closeAppointmentModalButton =
    document.querySelector("#closeAppointmentModal");


  if (!table || !form) {
    return;
  }


  /* =========================================================
     ESTADO
  ========================================================= */

  let authUser = null;
  let business = null;
  let settings = null;

  let clients = [];
  let professionals = [];
  let services = [];
  let appointments = [];

   let appointmentView =
    "agenda";

   let historyLimit =
     30;



  /* =========================================================
     DIAS
  ========================================================= */

  const DAY_KEYS = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ];


  /* =========================================================
     AUXILIARES
  ========================================================= */

  function notify(message) {

    if (typeof toast === "function") {
      toast(message);
      return;
    }

    alert(message);
  }


  function escapeHTML(value) {

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function normalize(value) {

    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }


  function onlyNumbers(value) {

    return String(value || "")
      .replace(/\D/g, "");
  }


  function formatCurrency(value) {

    return Number(value || 0)
      .toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      );
  }


  function formatDate(value) {

    if (!value) {
      return "-";
    }

    const [year, month, day] =
      String(value)
        .slice(0, 10)
        .split("-");

    return `${day}/${month}/${year}`;
  }


  function formatTime(value) {

    return String(value || "")
      .slice(0, 5);
  }


  function todayString() {

    const now = new Date();

    return [
      now.getFullYear(),
      String(
        now.getMonth() + 1
      ).padStart(2, "0"),
      String(
        now.getDate()
      ).padStart(2, "0")
    ].join("-");
  }


  function dateToString(date) {

    return [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(2, "0"),
      String(
        date.getDate()
      ).padStart(2, "0")
    ].join("-");
  }


  function timeToMinutes(time) {

    const [hour, minute] =
      String(time)
        .slice(0, 5)
        .split(":")
        .map(Number);

    return (
      hour * 60 +
      minute
    );
  }


  function minutesToTime(minutes) {

    const hour =
      Math.floor(
        minutes / 60
      );

    const minute =
      minutes % 60;

    return (
      String(hour)
        .padStart(2, "0") +
      ":" +
      String(minute)
        .padStart(2, "0")
    );
  }


  function getService(serviceId) {

    return services.find(
      service =>
        service.id === serviceId
    );
  }


  function getProfessional(
    professionalId
  ) {

    return professionals.find(
      professional =>
        professional.id === professionalId
    );
  }


  function getClient(clientId) {

    return clients.find(
      client =>
        client.id === clientId
    );
  }


  function planLabel(plan) {

    const value =
      normalize(plan);

    if (value === "business") {
      return "Business";
    }

    if (value === "platinum") {
      return "Platinum";
    }

    return "Starter";
  }


  function statusLabel(status) {

    const value =
      normalize(status);

    if (value === "confirmado") {
      return "Confirmado";
    }

    if (value === "concluido") {
      return "Concluído";
    }

    if (value === "cancelado") {
      return "Cancelado";
    }

    return "Agendado";
  }


  function getStatusClass(status) {

    const value =
      normalize(status);

    if (value === "confirmado") {
      return "confirmed";
    }

    if (value === "concluido") {
      return "completed";
    }

    if (value === "cancelado") {
      return "cancelled";
    }

    return "pending";
  }


  function isCancelled(status) {

    return (
      normalize(status) ===
      "cancelado"
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
        .from("businesses")
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
        "Erro business:",
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
      .forEach(element => {

        element.textContent =
          business.name ||
          "Kato's Agenda";

      });


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


    return true;
  }


  /* =========================================================
     CONFIGURAÇÕES
  ========================================================= */

  async function loadSettings() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "business_settings"
        )
        .select(`
          id,
          business_id,
          business_hours,
          booking_interval,
          minimum_notice,
          max_days_ahead
        `)
        .eq(
          "business_id",
          business.id
        )
        .single();


    if (error) {
      throw error;
    }


    settings = data;
  }


  /* =========================================================
     CLIENTES
  ========================================================= */

  async function loadClients() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("clients")
        .select(`
          id,
          business_id,
          name,
          phone,
          email,
          created_at
        `)
        .eq(
          "business_id",
          business.id
        )
        .order(
          "name",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    clients =
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
          business_id,
          name,
          active
        `)
        .eq(
          "business_id",
          business.id
        )
        .order(
          "name",
          {
            ascending: true
          }
        );


    if (error) {
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
        .from("services")
        .select(`
          id,
          business_id,
          professional_id,
          name,
          price,
          duration,
          active
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
     AGENDAMENTOS
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

  async function finalizePastAppointments() {

  const today =
    todayString();


  const pastPending =
    appointments.filter(
      appointment => {

        const date =
          String(
            appointment
              .appointment_date ||
            ""
          );


        const status =
          normalize(
            appointment.status
          );


        return (
          date < today &&
          (
            status === "agendado" ||
            status === "confirmado"
          )
        );

      }
    );


  if (
    !pastPending.length
  ) {
    return;
  }


  const ids =
    pastPending.map(
      appointment =>
        appointment.id
    );


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "appointments"
      )
      .update({
        status:
          "concluido",

        updated_at:
          new Date()
            .toISOString()
      })
      .in(
        "id",
        ids
      )
      .eq(
        "business_id",
        business.id
      )
      .select();


  if (error) {

    console.error(
      "Erro ao finalizar agendamentos antigos:",
      error
    );

    return;
  }


  const updatedMap =
    new Map(
      (data || []).map(
        item => [
          item.id,
          item
        ]
      )
    );


  appointments =
    appointments.map(
      appointment =>
        updatedMap.has(
          appointment.id
        )
          ? updatedMap.get(
              appointment.id
            )
          : appointment
    );

}


  /* =========================================================
     SELECTS
  ========================================================= */

  function loadSelects() {

    const activeProfessionals =
      professionals.filter(
        professional =>
          professional.active !==
          false
      );


    professionalSelect.innerHTML = `
      <option value="">
        Selecione
      </option>
    ` +
    activeProfessionals
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
      .join("");


    clientSelect.innerHTML = `
      <option value="">
        Novo cliente
      </option>
    ` +
    clients
      .map(
        client => `
          <option
            value="${client.id}"
          >
            ${escapeHTML(
              client.name
            )}
          </option>
        `
      )
      .join("");


    serviceSelect.innerHTML = `
      <option value="">
        Selecione primeiro um profissional
      </option>
    `;
  }


  /* =========================================================
     CLIENTE EXISTENTE / NOVO
  ========================================================= */

  function toggleClientFields() {

    const existing =
      Boolean(
        clientSelect.value
      );


    newClientFields
      ?.classList
      .toggle(
        "hidden",
        existing
      );
  }


  clientSelect
    ?.addEventListener(
      "change",
      toggleClientFields
    );


  /* =========================================================
     SERVIÇOS DO PROFISSIONAL
  ========================================================= */

  function loadProfessionalServices() {

    const professionalId =
      professionalSelect.value;


    if (!professionalId) {

      serviceSelect.innerHTML = `
        <option value="">
          Selecione primeiro um profissional
        </option>
      `;

      return;
    }


    const availableServices =
      services.filter(
        service =>
          service.professional_id ===
            professionalId &&
          service.active !== false
      );


    if (
      !availableServices.length
    ) {

      serviceSelect.innerHTML = `
        <option value="">
          Nenhum serviço disponível
        </option>
      `;

      return;
    }


    serviceSelect.innerHTML = `
      <option value="">
        Selecione um serviço
      </option>
    ` +
    availableServices
      .map(
        service => `
          <option
            value="${service.id}"
          >
            ${escapeHTML(
              service.name
            )}
            -
            ${formatCurrency(
              service.price
            )}
          </option>
        `
      )
      .join("");
  }


  /* =========================================================
     LIMITES DE DATA
  ========================================================= */

  function configureDateInput() {

    const today =
      new Date();


    dateInput.min =
      dateToString(today);


    const maximum =
      new Date(today);


    maximum.setDate(
      maximum.getDate() +
      Number(
        settings?.max_days_ahead ||
        30
      )
    );


    dateInput.max =
      dateToString(maximum);
  }


  /* =========================================================
     HORÁRIO DO ESTABELECIMENTO
  ========================================================= */

  function getHoursForDate(
    dateString
  ) {

    if (!dateString) {
      return null;
    }


    const date =
      new Date(
        `${dateString}T12:00:00`
      );


    const key =
      DAY_KEYS[
        date.getDay()
      ];


    const hours =
      settings
        ?.business_hours
        ?.[key];


    if (
      !hours ||
      hours.active === false
    ) {
      return null;
    }


    return hours;
  }


  /* =========================================================
     GERAR SLOTS
  ========================================================= */

  function generateTimeSlots(
    selectedDate,
    serviceId
  ) {

    const hours =
      getHoursForDate(
        selectedDate
      );


    if (!hours) {
      return [];
    }


    const service =
      getService(
        serviceId
      );


    const duration =
      Number(
        service?.duration ||
        30
      );


    const interval =
      Number(
        settings
          ?.booking_interval ||
        30
      );


    const start =
      timeToMinutes(
        hours.open
      );


    const end =
      timeToMinutes(
        hours.close
      );


    const slots = [];


    for (
      let current = start;
      current + duration <= end;
      current += interval
    ) {

      slots.push(
        minutesToTime(
          current
        )
      );

    }


    return slots;
  }


  /* =========================================================
     CONFLITO DE HORÁRIO
  ========================================================= */

  function hasTimeConflict(
    professionalId,
    selectedDate,
    selectedTime,
    selectedServiceId
  ) {

    const selectedService =
      getService(
        selectedServiceId
      );


    const selectedDuration =
      Number(
        selectedService
          ?.duration ||
        30
      );


    const selectedStart =
      timeToMinutes(
        selectedTime
      );


    const selectedEnd =
      selectedStart +
      selectedDuration;


    return appointments.some(
      appointment => {

        if (
          appointment.professional_id !==
          professionalId
        ) {
          return false;
        }


        if (
          appointment.appointment_date !==
          selectedDate
        ) {
          return false;
        }


        if (
          isCancelled(
            appointment.status
          )
        ) {
          return false;
        }


        const appointmentService =
          getService(
            appointment.service_id
          );


        const appointmentDuration =
          Number(
            appointmentService
              ?.duration ||
            30
          );


        const appointmentStart =
          timeToMinutes(
            appointment
              .appointment_time
          );


        const appointmentEnd =
          appointmentStart +
          appointmentDuration;


        return (
          selectedStart <
            appointmentEnd &&
          selectedEnd >
            appointmentStart
        );

      }
    );
  }


  /* =========================================================
     ANTECEDÊNCIA
  ========================================================= */

  function violatesMinimumNotice(
    selectedDate,
    selectedTime
  ) {

    const selected =
      new Date(
        `${selectedDate}T${selectedTime}:00`
      );


    const now =
      new Date();


    const minimumNotice =
      Number(
        settings
          ?.minimum_notice ||
        0
      );


    const minimumDate =
      new Date(
        now.getTime() +
        minimumNotice *
        60 *
        1000
      );


    return (
      selected <=
      minimumDate
    );
  }


  /* =========================================================
     RENDER HORÁRIOS
  ========================================================= */

  function renderAvailableTimes() {

    const professionalId =
      professionalSelect.value;

    const serviceId =
      serviceSelect.value;

    const selectedDate =
      dateInput.value;


    timeInput.value = "";

    selectedTimeText.textContent =
      "Nenhum";


    if (!professionalId) {

      timeSlots.innerHTML = `
        <div class="time-empty">
          Selecione um profissional.
        </div>
      `;

      timeHelp.textContent =
        "Selecione um profissional para visualizar os horários.";

      return;
    }


    if (!serviceId) {

      timeSlots.innerHTML = `
        <div class="time-empty">
          Selecione um serviço.
        </div>
      `;

      timeHelp.textContent =
        "Selecione o serviço para calcular os horários disponíveis.";

      return;
    }


    if (!selectedDate) {

      timeSlots.innerHTML = `
        <div class="time-empty">
          Selecione uma data.
        </div>
      `;

      timeHelp.textContent =
        "Agora selecione a data do atendimento.";

      return;
    }


    const hours =
      getHoursForDate(
        selectedDate
      );


    if (!hours) {

      timeSlots.innerHTML = `
        <div class="time-empty">
          Estabelecimento fechado neste dia.
        </div>
      `;

      timeHelp.textContent =
        "Este dia está marcado como fechado nas configurações.";

      return;
    }


    const slots =
      generateTimeSlots(
        selectedDate,
        serviceId
      );


    if (!slots.length) {

      timeSlots.innerHTML = `
        <div class="time-empty">
          Nenhum horário disponível.
        </div>
      `;

      return;
    }


    timeHelp.textContent =
      `${formatTime(hours.open)} às ${formatTime(hours.close)}`;


    timeSlots.innerHTML =
      slots
        .map(
          slot => {

            const conflict =
              hasTimeConflict(
                professionalId,
                selectedDate,
                slot,
                serviceId
              );


            const minimumNotice =
              violatesMinimumNotice(
                selectedDate,
                slot
              );


            const unavailable =
              conflict ||
              minimumNotice;


            let label =
              slot;


            if (conflict) {
              label += " Ocupado";
            }


            return `
              <button
                type="button"
                class="
                  time-slot
                  ${
                    unavailable
                      ? "unavailable"
                      : ""
                  }
                "
                data-time="${slot}"
                ${
                  unavailable
                    ? "disabled"
                    : ""
                }
              >
                ${label}
              </button>
            `;

          }
        )
        .join("");
  }


  /* =========================================================
     ALTERAR PROFISSIONAL
  ========================================================= */

  professionalSelect
    ?.addEventListener(
      "change",
      () => {

        loadProfessionalServices();

        timeInput.value = "";

        selectedTimeText.textContent =
          "Nenhum";

        renderAvailableTimes();

      }
    );


  /* =========================================================
     ALTERAR SERVIÇO
  ========================================================= */

  serviceSelect
    ?.addEventListener(
      "change",
      renderAvailableTimes
    );


  /* =========================================================
     ALTERAR DATA
  ========================================================= */

  dateInput
    ?.addEventListener(
      "change",
      renderAvailableTimes
    );


  /* =========================================================
     SELECIONAR HORÁRIO
  ========================================================= */

  timeSlots
    ?.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "[data-time]"
          );


        if (
          !button ||
          button.disabled
        ) {
          return;
        }


        timeSlots
          .querySelectorAll(
            ".time-slot"
          )
          .forEach(slot => {

            slot.classList.remove(
              "selected"
            );

          });


        button.classList.add(
          "selected"
        );


        timeInput.value =
          button.dataset.time;


        selectedTimeText.textContent =
          button.dataset.time;

      }
    );


  /* =========================================================
     AÇÕES
  ========================================================= */

  function renderActions(
    appointment
  ) {

    const status =
      getStatusClass(
        appointment.status
      );


    if (
      status === "completed" ||
      status === "cancelled"
    ) {

      return `
        <span
          class="appointment-action-finished"
        >
          Finalizado
        </span>
      `;
    }


    if (
      status === "confirmed"
    ) {

      return `
        <div class="appointment-actions">

          <button
            class="appointment-action complete"
            type="button"
            data-complete="${appointment.id}"
          >
            Concluir
          </button>

          <button
            class="appointment-action cancel"
            type="button"
            data-cancel="${appointment.id}"
          >
            Cancelar
          </button>

        </div>
      `;
    }


    return `
      <div class="appointment-actions">

        <button
          class="appointment-action confirm"
          type="button"
          data-confirm="${appointment.id}"
        >
          Confirmar
        </button>

        <button
          class="appointment-action complete"
          type="button"
          data-complete="${appointment.id}"
        >
          Concluir
        </button>

        <button
          class="appointment-action cancel"
          type="button"
          data-cancel="${appointment.id}"
        >
          Cancelar
        </button>

      </div>
    `;
  }

/* =========================================================
   ABAS AGENDA / HISTÓRICO
========================================================= */

function createAppointmentTabs() {

  let tabs =
    document.querySelector(
      "#appointmentViewTabs"
    );


  if (tabs) {
    return;
  }


  const card =
    document.querySelector(
      ".agenda-management-card"
    );


  const tableWrap =
    card?.querySelector(
      ".table-wrap"
    );


  if (
    !card ||
    !tableWrap
  ) {
    return;
  }


  tabs =
    document.createElement(
      "div"
    );


  tabs.id =
    "appointmentViewTabs";


  tabs.className =
    "appointment-view-tabs";


  tabs.innerHTML = `
    <button
      type="button"
      class="appointment-view-tab active"
      data-appointment-view="agenda"
    >
      Agenda
      <span
        data-agenda-count
      >
        0
      </span>
    </button>

    <button
      type="button"
      class="appointment-view-tab"
      data-appointment-view="history"
    >
      Histórico
      <span
        data-history-count
      >
        0
      </span>
    </button>
  `;


  card.insertBefore(
    tabs,
    tableWrap
  );


  tabs.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-appointment-view]"
        );


      if (!button) {
        return;
      }


      appointmentView =
        button.dataset
          .appointmentView;


      historyLimit =
        30;


      tabs
        .querySelectorAll(
          "[data-appointment-view]"
        )
        .forEach(
          item => {

            item.classList.toggle(
              "active",
              item === button
            );

          }
        );


      render();

    }
  );

}


/* =========================================================
   FORMATAR TÍTULO DO DIA
========================================================= */

function formatDayTitle(
  dateValue
) {

  if (
    !dateValue ||
    dateValue ===
      "sem-data"
  ) {

    return "Data não informada";

  }


  const date =
    new Date(
      `${dateValue}T12:00:00`
    );


  let text =
    date.toLocaleDateString(
      "pt-BR",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    );


  text =
    text.charAt(0)
      .toUpperCase() +
    text.slice(1);


  return text;

}


/* =========================================================
   CONTADORES DAS ABAS
========================================================= */

function updateAppointmentTabCounts(
  agendaCount,
  historyCount
) {

  const agendaCounter =
    document.querySelector(
      "[data-agenda-count]"
    );


  const historyCounter =
    document.querySelector(
      "[data-history-count]"
    );


  if (agendaCounter) {

    agendaCounter.textContent =
      agendaCount;

  }


  if (historyCounter) {

    historyCounter.textContent =
      historyCount;

  }

}


/* =========================================================
   LISTAGEM
========================================================= */

function render() {

  createAppointmentTabs();


  const today =
    todayString();


  /* =====================================================
     SEPARAR AGENDA E HISTÓRICO
  ===================================================== */

  const agendaAppointments =
    appointments
      .filter(
        appointment =>
          String(
            appointment
              .appointment_date ||
            ""
          ) >= today
      )
      .sort(
        (a, b) => {

          const dateA =
            `${
              a.appointment_date ||
              ""
            } ${
              a.appointment_time ||
              ""
            }`;


          const dateB =
            `${
              b.appointment_date ||
              ""
            } ${
              b.appointment_time ||
              ""
            }`;


          return dateA.localeCompare(
            dateB
          );

        }
      );


  const historyAppointments =
    appointments
      .filter(
        appointment =>
          String(
            appointment
              .appointment_date ||
            ""
          ) < today
      )
      .sort(
        (a, b) => {

          const dateA =
            `${
              a.appointment_date ||
              ""
            } ${
              a.appointment_time ||
              ""
            }`;


          const dateB =
            `${
              b.appointment_date ||
              ""
            } ${
              b.appointment_time ||
              ""
            }`;


          return dateB.localeCompare(
            dateA
          );

        }
      );


  updateAppointmentTabCounts(
    agendaAppointments.length,
    historyAppointments.length
  );


  /* =====================================================
     QUAL ABA ESTÁ ABERTA
  ===================================================== */

  let visibleAppointments;


  if (
    appointmentView ===
    "history"
  ) {

    visibleAppointments =
      historyAppointments.slice(
        0,
        historyLimit
      );

  }

  else {

    visibleAppointments =
      agendaAppointments;

  }


  /* =====================================================
     VAZIO
  ===================================================== */

  if (
    !visibleAppointments.length
  ) {

    table.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty"
        >
          ${
            appointmentView ===
            "history"

              ? "Nenhum agendamento no histórico."

              : "Nenhum agendamento futuro cadastrado."
          }
        </td>
      </tr>
    `;


    return;

  }


  /* =====================================================
     AGRUPAR POR DATA
  ===================================================== */

  const groupedAppointments =
    {};


  visibleAppointments
    .forEach(
      appointment => {

        const date =
          appointment
            .appointment_date ||
          "sem-data";


        if (
          !groupedAppointments[
            date
          ]
        ) {

          groupedAppointments[
            date
          ] = [];

        }


        groupedAppointments[
          date
        ].push(
          appointment
        );

      }
    );


  /* =====================================================
     CRIAR HTML
  ===================================================== */

  let html =

    Object.entries(
      groupedAppointments
    )
      .map(
        ([
          date,
          dayAppointments
        ]) => {


          const dayHeader = `
            <tr
              class="appointment-day-row"
            >
              <td colspan="7">

                <div
                  class="appointment-day-heading"
                >

                  <div>

                    <span>
                      ${
                        appointmentView ===
                        "history"

                          ? "HISTÓRICO"

                          : "AGENDA DO DIA"
                      }
                    </span>

                    <strong>
                      ${escapeHTML(
                        formatDayTitle(
                          date
                        )
                      )}
                    </strong>

                  </div>


                  <small>

                    ${dayAppointments.length}

                    ${
                      dayAppointments
                        .length === 1

                        ? "agendamento"

                        : "agendamentos"
                    }

                  </small>

                </div>

              </td>
            </tr>
          `;


          const rows =
            dayAppointments
              .map(
                appointment => {


                  const client =
                    getClient(
                      appointment
                        .client_id
                    );


                  const professional =
                    getProfessional(
                      appointment
                        .professional_id
                    );


                  const service =
                    getService(
                      appointment
                        .service_id
                    );


                  return `
                    <tr
                      class="appointment-row"
                    >

                      <td>
                        ${formatDate(
                          appointment
                            .appointment_date
                        )}
                      </td>


                      <td>

                        <strong
                          class="appointment-time-value"
                        >
                          ${escapeHTML(
                            formatTime(
                              appointment
                                .appointment_time
                            ) ||
                            "-"
                          )}
                        </strong>

                      </td>


                      <td>

                        <div
                          class="appointment-client"
                        >

                          <strong>
                            ${escapeHTML(
                              client?.name ||
                              "Cliente não identificado"
                            )}
                          </strong>

                        </div>

                      </td>


                      <td>
                        ${escapeHTML(
                          service?.name ||
                          "-"
                        )}
                      </td>


                      <td>
                        ${escapeHTML(
                          professional?.name ||
                          "-"
                        )}
                      </td>


                      <td>

                        <span
                          class="
                            appointment-status
                            ${getStatusClass(
                              appointment.status
                            )}
                          "
                        >
                          ${escapeHTML(
                            statusLabel(
                              appointment.status
                            )
                          )}
                        </span>

                      </td>


                      <td>

                        ${renderActions(
                          appointment
                        )}

                      </td>

                    </tr>
                  `;

                }
              )
              .join("");


          return (
            dayHeader +
            rows
          );

        }
      )
      .join("");


  /* =====================================================
     CARREGAR MAIS NO HISTÓRICO
  ===================================================== */

  if (
    appointmentView ===
      "history" &&
    historyAppointments.length >
      historyLimit
  ) {

    const remaining =
      historyAppointments.length -
      historyLimit;


    html += `
      <tr
        class="history-load-more-row"
      >
        <td colspan="7">

          <button
            type="button"
            class="history-load-more"
            data-load-more-history
          >
            Carregar mais

            <span>
              ${remaining}
              ${
                remaining === 1
                  ? "registro restante"
                  : "registros restantes"
              }
            </span>

          </button>

        </td>
      </tr>
    `;

  }


  table.innerHTML =
    html;

}



  /* =========================================================
     LOCALIZAR OU CRIAR CLIENTE
  ========================================================= */

  async function resolveClient() {

    if (
      clientSelect.value
    ) {

      return clientSelect.value;
    }


    const name =
      String(
        clientNameInput
          ?.value ||
        ""
      )
        .trim();


    const phone =
      onlyNumbers(
        clientPhoneInput
          ?.value
      );


    const email =
      String(
        clientEmailInput
          ?.value ||
        ""
      )
        .trim()
        .toLowerCase();


    if (!name) {

      notify(
        "Informe o nome do cliente."
      );

      return null;
    }


    if (!phone) {

      notify(
        "Informe o telefone do cliente."
      );

      return null;
    }


    /*
     * Procura na base já carregada.
     */

    let existing =
      clients.find(
        client =>
          onlyNumbers(
            client.phone
          ) === phone
      );


    if (
      !existing &&
      email
    ) {

      existing =
        clients.find(
          client =>
            String(
              client.email ||
              ""
            )
              .trim()
              .toLowerCase() ===
            email
        );
    }


    /*
     * Se já existir, aproveita
     * o mesmo cliente.
     */

    if (existing) {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("clients")
          .update({
            name,
            phone,
            email:
              email || null,
            updated_at:
              new Date()
                .toISOString()
          })
          .eq(
            "id",
            existing.id
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
          client =>
            client.id ===
            existing.id
        );


      if (index !== -1) {
        clients[index] = data;
      }


      return data.id;
    }


    /*
     * Novo cliente.
     */

    const {
      data,
      error
    } =
      await supabaseClient
        .from("clients")
        .insert({
          business_id:
            business.id,
          name,
          phone,
          email:
            email || null
        })
        .select()
        .single();


    if (error) {
      throw error;
    }


    clients.push(data);


    return data.id;
  }


  /* =========================================================
     SALVAR AGENDAMENTO
  ========================================================= */

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const professionalId =
        professionalSelect.value;

      const serviceId =
        serviceSelect.value;

      const appointmentDate =
        dateInput.value;

      const appointmentTime =
        timeInput.value;


      if (!professionalId) {

        notify(
          "Selecione um profissional."
        );

        return;
      }


      if (!serviceId) {

        notify(
          "Selecione um serviço."
        );

        return;
      }


      if (!appointmentDate) {

        notify(
          "Selecione uma data."
        );

        return;
      }


      if (!appointmentTime) {

        notify(
          "Selecione um horário."
        );

        return;
      }


      const service =
        getService(
          serviceId
        );


      if (
        !service ||
        service.professional_id !==
          professionalId ||
        service.active === false
      ) {

        notify(
          "Serviço inválido para este profissional."
        );

        return;
      }


      const hours =
        getHoursForDate(
          appointmentDate
        );


      if (!hours) {

        notify(
          "O estabelecimento está fechado nesta data."
        );

        return;
      }


      if (
        violatesMinimumNotice(
          appointmentDate,
          appointmentTime
        )
      ) {

        notify(
          "Este horário não respeita a antecedência mínima configurada."
        );

        renderAvailableTimes();

        return;
      }


      /*
       * Atualiza os agendamentos antes
       * da validação final para reduzir
       * chance de horário duplicado.
       */

      try {

        await loadAppointments();


        if (
          hasTimeConflict(
            professionalId,
            appointmentDate,
            appointmentTime,
            serviceId
          )
        ) {

          notify(
            "Este horário acabou de ser ocupado."
          );

          renderAvailableTimes();

          return;
        }


        const clientId =
          await resolveClient();


        if (!clientId) {
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


        const {
          data,
          error
        } =
          await supabaseClient
            .from(
              "appointments"
            )
            .insert({

              business_id:
                business.id,

              client_id:
                clientId,

              professional_id:
                professionalId,

              service_id:
                serviceId,

              appointment_date:
                appointmentDate,

              appointment_time:
                appointmentTime,

              status:
                "agendado"

            })
            .select()
            .single();


        if (error) {
          throw error;
        }


        appointments.push(
          data
        );


        form.reset();


        loadSelects();

        toggleClientFields();

        configureDateInput();


        timeInput.value =
          "";


        selectedTimeText.textContent =
          "Nenhum";


        timeSlots.innerHTML = `
          <div class="time-empty">
            Selecione um profissional.
          </div>
        `;


        timeHelp.textContent =
          "Selecione um profissional para visualizar os horários.";


        closeAppointmentModal();


        render();


        notify(
          "Agendamento criado."
        );


        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            oldText ||
            "Salvar agendamento";

        }


      } catch (error) {

        console.error(
          "Erro ao criar agendamento:",
          error
        );


        notify(
          "Não foi possível criar o agendamento."
        );

      }

    }
  );


  /* =========================================================
     STATUS
  ========================================================= */

  async function updateStatus(
    appointmentId,
    newStatus
  ) {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("appointments")
        .update({

          status:
            newStatus,

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          appointmentId
        )
        .eq(
          "business_id",
          business.id
        )
        .select()
        .single();


    if (error) {

      console.error(
        "Erro ao atualizar status:",
        error
      );

      notify(
        "Não foi possível alterar o status."
      );

      return;
    }


    const index =
      appointments.findIndex(
        appointment =>
          appointment.id ===
          appointmentId
      );


    if (index !== -1) {

      appointments[index] =
        data;

    }


    render();


    notify(
      `Status alterado para ${statusLabel(newStatus)}.`
    );
  }


  /* =========================================================
     CLIQUES DA TABELA
  ========================================================= */

  table.addEventListener(
    "click",
    async event => {

      const loadMoreHistory =
        event.target.closest(
        "[data-load-more-history]"
      );


    if (loadMoreHistory) {

      historyLimit +=
      30;

     render();

     return;

    }

      const confirmButton =
        event.target.closest(
          "[data-confirm]"
        );

      const completeButton =
        event.target.closest(
          "[data-complete]"
        );

      const cancelButton =
        event.target.closest(
          "[data-cancel]"
        );


      if (confirmButton) {

        await updateStatus(
          confirmButton
            .dataset
            .confirm,
          "confirmado"
        );

        return;
      }


      if (completeButton) {

        await updateStatus(
          completeButton
            .dataset
            .complete,
          "concluido"
        );

        return;
      }


      if (cancelButton) {

        const confirmed =
          window.confirm(
            "Deseja realmente cancelar este agendamento?"
          );


        if (!confirmed) {
          return;
        }


        await updateStatus(
          cancelButton
            .dataset
            .cancel,
          "cancelado"
        );

      }

    }
  );


  /* =========================================================
     MODAL
  ========================================================= */

  function closeAppointmentModal() {

    if (
      typeof window.closeModal ===
      "function"
    ) {

      window.closeModal(
        "#appointmentModal"
      );

      return;
    }


    appointmentModal
      ?.classList
      .remove(
        "active",
        "show",
        "open",
        "visible"
      );
  }


  closeAppointmentModalButton
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        closeAppointmentModal();

      }
    );


  appointmentModal
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          appointmentModal
        ) {

          closeAppointmentModal();

        }

      }
    );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {

        closeAppointmentModal();

      }

    }
  );


  /* =========================================================
     PREPARAR NOVO AGENDAMENTO
  ========================================================= */

  function prepareNewAppointment() {

    form.reset();

    loadSelects();

    toggleClientFields();

    configureDateInput();


    timeInput.value =
      "";


    selectedTimeText.textContent =
      "Nenhum";


    timeSlots.innerHTML = `
      <div class="time-empty">
        Selecione um profissional.
      </div>
    `;


    timeHelp.textContent =
      "Selecione um profissional para visualizar os horários.";
  }


  /*
   * O botão do seu HTML usa
   * onclick="openModal(...)",
   * então observamos quando ele é clicado
   * para limpar o formulário.
   */

  const newAppointmentButton =
    document.querySelector(
      '.page-head button.btn-primary'
    );


  newAppointmentButton
    ?.addEventListener(
      "click",
      prepareNewAppointment
    );


  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  async function init() {

    try {

      const accountLoaded =
        await loadAccount();


      if (!accountLoaded) {
        return;
      }


      await loadSettings();


      await Promise.all([
         loadClients(),
         loadProfessionals(),
         loadServices(),
         loadAppointments()
       ]);

         await finalizePastAppointments();

          loadSelects();

          toggleClientFields();

        configureDateInput();

      render();

    } catch (error) {

      console.error(
        "Erro ao carregar Agenda:",
        error
      );


      notify(
        "Não foi possível carregar a Agenda."
      );

    }

  }

  


  init();

})();