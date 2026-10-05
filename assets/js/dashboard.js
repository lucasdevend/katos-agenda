(function () {
  "use strict";

  /* =========================================================
     ELEMENTOS
  ========================================================= */

  const todayContainer =
    document.querySelector(
      "#todayAppointments"
    );

  const revenueTodayElement =
    document.querySelector(
      "#revenueToday"
    );

  const revenueMonthElement =
    document.querySelector(
      "#revenueMonth"
    );

  const revenueTodayDetail =
    document.querySelector(
      "#revenueTodayDetail"
    );

  const statToday =
    document.querySelector(
      "#statToday"
    );

  const statClients =
    document.querySelector(
      "#statClients"
    );

  const statProfessionals =
    document.querySelector(
      "#statProfessionals"
    );

  const statTickets =
    document.querySelector(
      "#statTickets"
    );

  const summaryConfirmed =
    document.querySelector(
      "#summaryConfirmed"
    );

  const summaryPending =
    document.querySelector(
      "#summaryPending"
    );

  const summaryCompleted =
    document.querySelector(
      "#summaryCompleted"
    );

  const summaryCancelled =
    document.querySelector(
      "#summaryCancelled"
    );

  const nextAppointmentElement =
    document.querySelector(
      "#nextAppointment"
    );

  const planPrice =
    document.querySelector(
      "#planPrice"
    );

  const planUsageText =
    document.querySelector(
      "#planUsageText"
    );

  const planProgressBar =
    document.querySelector(
      "#planProgressBar"
    );


  if (!todayContainer) {
    return;
  }


  /* =========================================================
     ESTADO
  ========================================================= */

  let authUser = null;

  let business = null;

  let appointments = [];

  let clients = [];

  let professionals = [];

  let services = [];

  let tickets = [];


  /* =========================================================
     PLANOS
  ========================================================= */

  const PLANS = {
    starter: {
      name: "Starter",
      price: "R$ 21,90",
      limit: 1
    },

    business: {
      name: "Business",
      price: "R$ 69,90",
      limit: 5
    },

    platinum: {
      name: "Platinum",
      price: "R$ 149,90",
      limit: 8
    }
  };


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

    console.log(message);
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


  function todayString() {
    const now =
      new Date();

    return [
      now.getFullYear(),

      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      ),

      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      )
    ].join("-");
  }


  function currentMonthString() {
    const now =
      new Date();

    return [
      now.getFullYear(),

      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      )
    ].join("-");
  }


  function formatTime(value) {
    return String(
      value || ""
    ).slice(
      0,
      5
    );
  }


  function isCancelled(status) {
    return (
      normalize(status) ===
      "cancelado"
    );
  }


  function isCompleted(status) {
    return (
      normalize(status) ===
      "concluido"
    );
  }


  function getStatusClass(status) {
    const value =
      normalize(status);

    if (
      value ===
      "confirmado"
    ) {
      return "confirmed";
    }

    if (
      value ===
      "concluido"
    ) {
      return "completed";
    }

    if (
      value ===
      "cancelado"
    ) {
      return "cancelled";
    }

    return "pending";
  }


  function statusLabel(status) {
    const value =
      normalize(status);

    if (
      value ===
      "confirmado"
    ) {
      return "Confirmado";
    }

    if (
      value ===
      "concluido"
    ) {
      return "Concluído";
    }

    if (
      value ===
      "cancelado"
    ) {
      return "Cancelado";
    }

    return "Agendado";
  }


  function getClient(
    clientId
  ) {
    return clients.find(
      client =>
        client.id ===
        clientId
    );
  }


  function getProfessional(
    professionalId
  ) {
    return professionals.find(
      professional =>
        professional.id ===
        professionalId
    );
  }


  function getService(
    serviceId
  ) {
    return services.find(
      service =>
        service.id ===
        serviceId
    );
  }


  /* =========================================================
     CONTA / ESTABELECIMENTO
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
      sessionData
        .session
        .user;


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


    business =
      data;


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


    return true;
  }


  /* =========================================================
     CARREGAR DADOS
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
          name
        `)
        .eq(
          "business_id",
          business.id
        );


    if (error) {
      throw error;
    }


    clients =
      data || [];
  }


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
          name,
          active
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


  async function loadTickets() {
    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "tickets"
        )
        .select(`
          id,
          status
        `)
        .eq(
          "business_id",
          business.id
        );


    if (error) {
      throw error;
    }


    tickets =
      data || [];
  }


  /* =========================================================
     FATURAMENTO
  ========================================================= */

  function calculateRevenue(
    appointmentList
  ) {
    return appointmentList
      .filter(
        appointment =>
          !isCancelled(
            appointment.status
          )
      )
      .reduce(
        (
          total,
          appointment
        ) => {
          const service =
            getService(
              appointment
                .service_id
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
  }


  function updateRevenue() {
    const today =
      todayString();

    const currentMonth =
      currentMonthString();


    const todayAppointments =
      appointments.filter(
        appointment =>
          appointment
            .appointment_date ===
          today
      );


    const monthAppointments =
      appointments.filter(
        appointment =>
          String(
            appointment
              .appointment_date ||
            ""
          ).startsWith(
            currentMonth
          )
      );


    const todayRevenue =
      calculateRevenue(
        todayAppointments
      );


    const monthRevenue =
      calculateRevenue(
        monthAppointments
      );


    if (
      revenueTodayElement
    ) {
      revenueTodayElement
        .textContent =
        currency(
          todayRevenue
        );
    }


    if (
      revenueMonthElement
    ) {
      revenueMonthElement
        .textContent =
        currency(
          monthRevenue
        );
    }


    if (
      revenueTodayDetail
    ) {
      const validToday =
        todayAppointments
          .filter(
            appointment =>
              !isCancelled(
                appointment.status
              )
          )
          .length;


      if (
        validToday === 0
      ) {
        revenueTodayDetail
          .textContent =
          "Nenhum atendimento programado";
      }

      else if (
        validToday === 1
      ) {
        revenueTodayDetail
          .textContent =
          "1 atendimento programado para hoje";
      }

      else {
        revenueTodayDetail
          .textContent =
          `${validToday} atendimentos programados para hoje`;
      }
    }
  }


  /* =========================================================
     INDICADORES
  ========================================================= */

  function updateStats() {
    const today =
      todayString();


    const todayAppointments =
      appointments.filter(
        appointment =>
          appointment
            .appointment_date ===
          today
      );


    const activeProfessionals =
      professionals.filter(
        professional =>
          professional.active !==
          false
      );


    const openTickets =
      tickets.filter(
        ticket => {
          const status =
            normalize(
              ticket.status
            );

          return (
            status ===
              "aberto" ||
            status ===
              "em_andamento"
          );
        }
      );


    if (statToday) {
      statToday.textContent =
        todayAppointments
          .length;
    }


    if (statClients) {
      statClients.textContent =
        clients.length;
    }


    if (
      statProfessionals
    ) {
      statProfessionals
        .textContent =
        activeProfessionals
          .length;
    }


    if (statTickets) {
      statTickets.textContent =
        openTickets.length;
    }
  }


  /* =========================================================
     AGENDA DE HOJE
  ========================================================= */

  function renderTodayAppointments() {
    const today =
      todayString();


    const todayAppointments =
      appointments
        .filter(
          appointment =>
            appointment
              .appointment_date ===
            today
        )
        .sort(
          (a, b) =>
            String(
              a.appointment_time
            ).localeCompare(
              String(
                b.appointment_time
              )
            )
        );


    if (
      !todayAppointments
        .length
    ) {
      todayContainer
        .innerHTML = `
          <div class="today-agenda-empty">
            <div>
              <strong>
                Nenhum atendimento hoje
              </strong>

              <span>
                Sua agenda está livre no momento.
              </span>
            </div>
          </div>
        `;

      return;
    }


    todayContainer
      .innerHTML =
      todayAppointments
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
              <div class="today-appointment">

                <div class="today-appointment-time">
                  ${formatTime(
                    appointment
                      .appointment_time
                  )}
                </div>

                <div class="today-appointment-info">

                  <strong>
                    ${escapeHTML(
                      client?.name ||
                      "Cliente"
                    )}
                  </strong>

                  <span>
                    ${escapeHTML(
                      service?.name ||
                      "Serviço"
                    )}

                    ${
                      professional?.name
                        ? ` · ${escapeHTML(
                            professional
                              .name
                          )}`
                        : ""
                    }
                  </span>

                </div>

                <span
                  class="
                    today-appointment-status
                    ${getStatusClass(
                      appointment.status
                    )}
                  "
                >
                  ${statusLabel(
                    appointment.status
                  )}
                </span>

              </div>
            `;
          }
        )
        .join("");
  }


  /* =========================================================
     RESUMO DO DIA
  ========================================================= */

  function updateDailySummary() {
    const today =
      todayString();


    const todayAppointments =
      appointments.filter(
        appointment =>
          appointment
            .appointment_date ===
          today
      );


    let confirmed = 0;

    let pending = 0;

    let completed = 0;

    let cancelled = 0;


    todayAppointments
      .forEach(
        appointment => {
          const status =
            getStatusClass(
              appointment.status
            );


          if (
            status ===
            "confirmed"
          ) {
            confirmed++;
          }

          else if (
            status ===
            "completed"
          ) {
            completed++;
          }

          else if (
            status ===
            "cancelled"
          ) {
            cancelled++;
          }

          else {
            pending++;
          }
        }
      );


    if (
      summaryConfirmed
    ) {
      summaryConfirmed
        .textContent =
        confirmed;
    }


    if (
      summaryPending
    ) {
      summaryPending
        .textContent =
        pending;
    }


    if (
      summaryCompleted
    ) {
      summaryCompleted
        .textContent =
        completed;
    }


    if (
      summaryCancelled
    ) {
      summaryCancelled
        .textContent =
        cancelled;
    }
  }


  /* =========================================================
     PRÓXIMO ATENDIMENTO
  ========================================================= */

  function updateNextAppointment() {
    if (
      !nextAppointmentElement
    ) {
      return;
    }


    const now =
      new Date();


    const upcoming =
      appointments
        .filter(
          appointment => {
            if (
              isCancelled(
                appointment.status
              ) ||
              isCompleted(
                appointment.status
              )
            ) {
              return false;
            }


            const dateTime =
              new Date(
                `${
                  appointment
                    .appointment_date
                }T${
                  formatTime(
                    appointment
                      .appointment_time
                  )
                }:00`
              );


            return (
              dateTime >= now
            );
          }
        )
        .sort(
          (a, b) => {
            const dateA =
              new Date(
                `${
                  a.appointment_date
                }T${
                  formatTime(
                    a.appointment_time
                  )
                }:00`
              );


            const dateB =
              new Date(
                `${
                  b.appointment_date
                }T${
                  formatTime(
                    b.appointment_time
                  )
                }:00`
              );


            return (
              dateA -
              dateB
            );
          }
        );


    if (
      !upcoming.length
    ) {
      nextAppointmentElement
        .innerHTML = `
          <strong>
            Nenhum atendimento próximo
          </strong>

          <span>
            Sua agenda está livre no momento.
          </span>
        `;

      return;
    }


    const appointment =
      upcoming[0];


    const client =
      getClient(
        appointment.client_id
      );


    const service =
      getService(
        appointment.service_id
      );


    const professional =
      getProfessional(
        appointment
          .professional_id
      );


    const appointmentDate =
      appointment
        .appointment_date;


    const isToday =
      appointmentDate ===
      todayString();


    const [
      year,
      month,
      day
    ] =
      appointmentDate
        .split("-");


    const dateLabel =
      isToday
        ? "Hoje"
        : `${day}/${month}/${year}`;


    nextAppointmentElement
      .innerHTML = `
        <strong>
          ${escapeHTML(
            client?.name ||
            "Cliente"
          )}
        </strong>

        <span>
          ${dateLabel}
          ·
          ${formatTime(
            appointment
              .appointment_time
          )}

          ${
            service?.name
              ? ` · ${escapeHTML(
                  service.name
                )}`
              : ""
          }

          ${
            professional?.name
              ? ` · ${escapeHTML(
                  professional
                    .name
                )}`
              : ""
          }
        </span>
      `;
  }


  /* =========================================================
     PLANO
  ========================================================= */

  function updatePlanCard() {
    const planName =
      normalize(
        business?.plan ||
        "starter"
      );


    const plan =
      PLANS[planName] ||
      PLANS.starter;


    const totalProfessionals =
      professionals.length;


    const percentage =
      Math.min(
        (
          totalProfessionals /
          plan.limit
        ) * 100,
        100
      );


    document
      .querySelectorAll(
        "[data-plan]"
      )
      .forEach(
        element => {
          element.textContent =
            plan.name;
        }
      );


    if (
      planPrice
    ) {
      planPrice.textContent =
        plan.price;
    }


    if (
      planUsageText
    ) {
      planUsageText
        .textContent =
        `${totalProfessionals} de ${plan.limit}`;
    }


    if (
      planProgressBar
    ) {
      planProgressBar
        .style
        .width =
        `${percentage}%`;
    }
  }


  /* =========================================================
     TESTE GRÁTIS / ASSINATURA
  ========================================================= */

  async function loadTrialInfo() {
    const trialInfo =
      document.querySelector(
        "#trialInfo"
      );

    const trialInfoTitle =
      document.querySelector(
        "#trialInfoTitle"
      );

    const trialInfoText =
      document.querySelector(
        "#trialInfoText"
      );

      const subscriptionStatusBadge =
       document.querySelector(
        "#subscriptionStatusBadge"
  );


    if (
      !trialInfo ||
      !business?.id ||
      typeof supabaseClient ===
        "undefined"
    ) {
      return;
    }


    try {
      const {
        data,
        error
      } =
        await supabaseClient
          .from(
            "subscriptions"
          )
          .select(`
            plan,
            status,
            trial_started_at,
            trial_ends_at
          `)
          .eq(
            "business_id",
            business.id
          )
          .maybeSingle();


      if (error) {
        throw error;
      }


      if (
        !data ||
        data.status !==
          "trialing" ||
        !data.trial_ends_at
      ) {
      
      if (subscriptionStatusBadge) {

        subscriptionStatusBadge.textContent =
          "Ativo";

        }
        
        trialInfo.hidden =
          true;

        return;
      }


      const trialEnd =
        new Date(
          data.trial_ends_at
        );


      const now =
        new Date();


      const millisecondsPerDay =
        1000 *
        60 *
        60 *
        24;


      const daysRemaining =
        Math.max(
          0,
          Math.ceil(
            (
              trialEnd
                .getTime() -
              now
                .getTime()
            ) /
            millisecondsPerDay
          )
        );

      if (subscriptionStatusBadge) {

        subscriptionStatusBadge.textContent =
         "Teste grátis";

        }


      const planName =
        normalize(
          data.plan ||
          business.plan ||
          "starter"
        );


      const plan =
        PLANS[planName] ||
        PLANS.starter;


      if (
        trialInfoTitle
      ) {
        trialInfoTitle
          .textContent =
          "Teste grátis";
      }


      if (
        trialInfoText
      ) {
        if (
          daysRemaining <= 0
        ) {
          trialInfoText
            .textContent =
            `Seu período de teste termina hoje. Depois, ${plan.name} por ${plan.price}/mês.`;
        }

        else if (
          daysRemaining === 1
        ) {
          trialInfoText
            .textContent =
            `Falta 1 dia de teste. Depois, ${plan.name} por ${plan.price}/mês.`;
        }

        else {
          trialInfoText
            .textContent =
            `Faltam ${daysRemaining} dias de teste. Depois, ${plan.name} por ${plan.price}/mês.`;
        }
      }


      trialInfo.hidden =
        false;
    }

    catch (error) {
      console.error(
        "Erro ao carregar período de teste:",
        error
      );

      trialInfo.hidden =
        true;
    }
  }


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
        loadAppointments(),
        loadClients(),
        loadProfessionals(),
        loadServices(),
        loadTickets()
      ]);


      updateRevenue();

      updateStats();

      renderTodayAppointments();

      updateDailySummary();

      updateNextAppointment();

      updatePlanCard();

      await loadTrialInfo();
    }

    catch (error) {
      console.error(
        "Erro ao carregar Dashboard:",
        error
      );


      notify(
        "Não foi possível carregar o Dashboard."
      );
    }
  }


  init();

})();