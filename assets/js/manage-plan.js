(function () {



  /* =========================================================

     ESTADO

  ========================================================= */



  let authUser = null;

  let business = null;

  let subscription = null;

  let professionals = [];





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

     ELEMENTOS

  ========================================================= */



  const currentPlanName =

    document.querySelector(

      "#currentPlanName"

    );



  const currentPlanPrice =

    document.querySelector(

      "#currentPlanPrice"

    );



  const currentPlanUsage =

    document.querySelector(

      "#currentPlanUsage"

    );



  const currentPlanProgress =

    document.querySelector(

      "#currentPlanProgress"

    );



  const subscriptionStatus =

    document.querySelector(

      "#subscriptionStatus"

    );



  const subscriptionDescription =

    document.querySelector(

      "#subscriptionDescription"

    );



  const periodInfo =

    document.querySelector(

      "#periodInfo"

    );



  const cancelButton =

    document.querySelector(

      "#cancelSubscription"

    );



  const reactivateButton =

    document.querySelector(

      "#reactivateSubscription"

    );



    const managePlanTitle =

  document.querySelector(

    "#managePlanTitle"

  );



const managePlanSubtitle =

  document.querySelector(

    "#managePlanSubtitle"

  );





const params =

  new URLSearchParams(

    window.location.search

  );



const reason =

  params.get("reason");





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





  function normalize(value) {



    return String(

      value || ""

    )

      .toLowerCase()

      .trim();

  }





  function formatDate(value) {



    if (!value) {

      return null;

    }





    return new Date(

      value

    ).toLocaleDateString(

      "pt-BR"

    );

  }





  function getActiveProfessionals() {



    return professionals.filter(

      professional =>

        professional.active !==

        false

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

      throw error;

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

     ASSINATURA

  ========================================================= */



  async function loadSubscription() {



  const {

    data,

    error

  } =

    await supabaseClient

      .from("subscriptions")

      .select(`

        id,

        business_id,

        plan,

        status,

        trial_started_at,

        trial_ends_at,

        cancel_at_period_end,

        current_period_start,

        current_period_end,

        provider,

        provider_customer_id,

        provider_subscription_id,

        created_at,

        updated_at

      `)

      .eq(

        "business_id",

        business.id

      )

      .single();





  if (error) {

    throw error;

  }





  subscription =

    data;



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

        .from("professionals")

        .select(`

          id,

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







  /* =========================================================

     RENDER

  ========================================================= */



  function renderPageReason() {



  if (

    !managePlanTitle ||

    !managePlanSubtitle

  ) {

    return;

  }





  if (

    reason === "trial_expired"

  ) {



    managePlanTitle.textContent =

      "Seu teste grátis expirou";



    managePlanSubtitle.textContent =

      "Seu período gratuito de 15 dias terminou. Escolha um plano para continuar usando a Kato's Agenda.";



    return;

  }





  if (

    reason === "expired"

  ) {



    managePlanTitle.textContent =

      "Sua assinatura expirou";



    managePlanSubtitle.textContent =

      "Escolha um plano para recuperar o acesso à Kato's Agenda.";



    return;

  }





  if (

    reason === "past_due"

  ) {



    managePlanTitle.textContent =

      "Pagamento pendente";



    managePlanSubtitle.textContent =

      "Regularize sua assinatura para recuperar o acesso ao sistema.";



    return;

  }





  if (

    reason === "cancelled"

  ) {



    managePlanTitle.textContent =

      "Sua assinatura foi encerrada";



    managePlanSubtitle.textContent =

      "Escolha um plano para voltar a utilizar a Kato's Agenda.";



    return;

  }





  managePlanTitle.textContent =

    "Gerenciar plano";



  managePlanSubtitle.textContent =

    "Altere sua assinatura, consulte limites ou solicite cancelamento.";



}



  function renderPlan() {



    const planKey =

      normalize(

        subscription?.plan ||

        business?.plan ||

        "starter"

      );





    const plan =

      PLANS[planKey] ||

      PLANS.starter;





    const activeProfessionals =

      getActiveProfessionals();





    const usage =

      activeProfessionals.length;





    const percentage =

      Math.min(

        (

          usage /

          plan.limit

        ) * 100,

        100

      );





    if (currentPlanName) {



      currentPlanName.textContent =

        plan.name;



    }





    if (currentPlanPrice) {



      currentPlanPrice.textContent =

        `${plan.price}/mês`;



    }





    if (currentPlanUsage) {



      currentPlanUsage.textContent =

        `${usage} de ${plan.limit}`;



    }





    if (currentPlanProgress) {



      currentPlanProgress.style.width =

        `${percentage}%`;



    }





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





    document

      .querySelectorAll(

        "[data-plan-card]"

      )

      .forEach(

        card => {



          const cardPlan =

            card.dataset.planCard;





          card.classList.toggle(

            "current",

            cardPlan === planKey

          );



        }

      );





    document

      .querySelectorAll(

        "[data-change-plan]"

      )

      .forEach(

        button => {



          const buttonPlan =

            button.dataset

              .changePlan;





          const isCurrent =

            buttonPlan ===

            planKey;





          button.disabled =

            isCurrent;





          if (isCurrent) {



            button.textContent =

              "Plano atual";



          } else {



            button.textContent =

              `Alterar para ${

                PLANS[buttonPlan].name

              }`;



          }



        }

      );

  }





  function renderSubscription() {



  const status =

    normalize(

      subscription?.status

    );





  const scheduledCancel =

    Boolean(

      subscription

        ?.cancel_at_period_end

    );



    if (

  status === "expired"

) {



  if (subscriptionStatus) {



    subscriptionStatus

      .classList

      .remove(

        "active",

        "pending",

        "cancelled"

      );



    subscriptionStatus

      .classList

      .add(

        "cancelled"

      );



    subscriptionStatus.textContent =

      "Expirada";



  }





  if (

    subscriptionDescription

  ) {



    subscriptionDescription.textContent =

      reason === "trial_expired"

        ? "Seu período gratuito terminou."

        : "Sua assinatura está expirada.";



  }





  if (periodInfo) {



    periodInfo.textContent =

      "Escolha um plano abaixo para continuar.";



  }





  if (cancelButton) {



    cancelButton.hidden =

      true;



  }





  if (reactivateButton) {



    reactivateButton.hidden =

      true;



  }





  return;

}





  /* =====================================================

     TESTE GRÁTIS

  ===================================================== */



  if (
    status === "trialing"
  ) {

    if (subscriptionStatus) {

      subscriptionStatus
        .classList
        .remove(
          "active",
          "cancelled",
          "pending"
        );

      subscriptionStatus
        .classList
        .add(
          scheduledCancel
            ? "cancelled"
            : "pending"
        );

      subscriptionStatus.textContent =
        scheduledCancel
          ? "Cancelamento agendado"
          : "Teste grátis";
    }


    if (subscriptionDescription) {

      subscriptionDescription.textContent =
        scheduledCancel
          ? "Seu teste continua disponível até o fim do período gratuito. A assinatura não será iniciada automaticamente."
          : "Você está usando seu período gratuito de 15 dias.";
    }


    if (periodInfo) {

      const trialEnd =
        formatDate(
          subscription?.trial_ends_at
        );

      if (trialEnd) {

        const endDate =
          new Date(
            subscription.trial_ends_at
          );

        const daysRemaining =
          Math.max(
            0,
            Math.ceil(
              (
                endDate.getTime() -
                Date.now()
              ) /
              (
                1000 *
                60 *
                60 *
                24
              )
            )
          );

        let message = "";

        if (daysRemaining === 0) {
          message =
            `Seu teste termina hoje (${trialEnd}).`;
        }
        else if (daysRemaining === 1) {
          message =
            `Falta 1 dia de teste. Término em ${trialEnd}.`;
        }
        else {
          message =
            `Faltam ${daysRemaining} dias de teste. Término em ${trialEnd}.`;
        }

        if (scheduledCancel) {
          message +=
            " Cancelamento agendado para o fim do teste.";
        }

        periodInfo.textContent =
          message;
      }
      else {
        periodInfo.textContent =
          scheduledCancel
            ? "Cancelamento agendado para o fim do teste."
            : "Período de teste ativo.";
      }
    }


    if (cancelButton) {
      cancelButton.hidden =
        scheduledCancel;
    }


    if (reactivateButton) {
      reactivateButton.hidden =
        !scheduledCancel;
    }


    return;
  }



  /* =====================================================

     CANCELADA

  ===================================================== */



  if (

    subscriptionStatus

  ) {



    subscriptionStatus

      .classList

      .remove(

        "active",

        "cancelled",

        "pending"

      );





    if (

      status === "cancelled"

    ) {



      subscriptionStatus

        .classList

        .add(

          "cancelled"

        );





      subscriptionStatus

        .textContent =

        "Cancelada";



    }





    else if (

      scheduledCancel

    ) {



      subscriptionStatus

        .classList

        .add(

          "pending"

        );





      subscriptionStatus

        .textContent =

        "Cancelamento agendado";



    }





    else {



      subscriptionStatus

        .classList

        .add(

          "active"

        );





      subscriptionStatus

        .textContent =

        "Ativa";



    }



  }





  /* =====================================================

     DESCRIÇÃO

  ===================================================== */



  if (

    subscriptionDescription

  ) {



    if (

      status === "cancelled"

    ) {



      subscriptionDescription

        .textContent =

        "Sua assinatura está cancelada.";



    }





    else if (

      scheduledCancel

    ) {



      subscriptionDescription

        .textContent =

        "Sua assinatura será cancelada ao final do período atual.";



    }





    else {



      subscriptionDescription

        .textContent =

        "Sua assinatura está ativa.";



    }



  }





  /* =====================================================

     PERÍODO

  ===================================================== */



  if (

    periodInfo

  ) {



    const periodEnd =

      formatDate(

        subscription

          ?.current_period_end

      );





    if (periodEnd) {



      periodInfo.textContent =

        scheduledCancel

          ? `Acesso disponível até ${periodEnd}.`

          : `Próxima renovação prevista para ${periodEnd}.`;



    }



    else {



      periodInfo.textContent =

        "";



    }



  }





  /* =====================================================

     BOTÕES

  ===================================================== */



if (cancelButton) {

  cancelButton.hidden =

    scheduledCancel;

}



if (reactivateButton) {

  reactivateButton.hidden =

    !scheduledCancel;

}



}





  function render() {



    renderPlan();

    renderSubscription();



  }





  /* =========================================================

     ALTERAR PLANO

  ========================================================= */



  async function changePlan(
    newPlan
  ) {

    const plan =
      PLANS[newPlan];

    if (!plan) {
      return;
    }


    const currentPlan =
      normalize(
        subscription?.plan
      );

    const status =
      normalize(
        subscription?.status
      );


    if (
      currentPlan ===
      newPlan
    ) {
      return;
    }


    const activeProfessionals =
      getActiveProfessionals();


    if (
      activeProfessionals.length >
      plan.limit
    ) {

      notify(
        `Para usar o plano ${plan.name}, você precisa manter no máximo ${plan.limit} ${
          plan.limit === 1
            ? "profissional ativo"
            : "profissionais ativos"
        }.`
      );

      return;
    }


    /*
     * Durante o teste grátis o cliente pode trocar
     * o plano sem perder o trial e sem virar "active".
     */
    if (
      status !== "trialing"
    ) {

      notify(
        "A troca de plano para uma assinatura paga será concluída pelo checkout. O gateway de pagamento ainda não está configurado."
      );

      return;
    }


    const confirmed =
      window.confirm(
        `Deseja alterar o plano do seu teste para ${plan.name}? Seus dias restantes de teste serão mantidos.`
      );


    if (!confirmed) {
      return;
    }


    try {

      /*
       * IMPORTANTE:
       * não altera status, trial_ends_at,
       * trial_started_at nem cancel_at_period_end.
       */
      const {
        data: updatedSubscription,
        error: subscriptionError
      } =
        await supabaseClient
          .from("subscriptions")
          .update({

            plan:
              newPlan,

            updated_at:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            subscription.id
          )
          .eq(
            "business_id",
            business.id
          )
          .select()
          .single();


      if (subscriptionError) {
        throw subscriptionError;
      }


      /*
       * Mantém businesses.plan sincronizado.
       */
      const {
        data: updatedBusiness,
        error: businessError
      } =
        await supabaseClient
          .from("businesses")
          .update({

            plan:
              newPlan,

            updated_at:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            business.id
          )
          .eq(
            "owner_id",
            authUser.id
          )
          .select()
          .single();


      if (businessError) {
        throw businessError;
      }


      subscription =
        updatedSubscription;

      business =
        updatedBusiness;


      if (
        typeof refreshCurrentUser ===
        "function"
      ) {

        await refreshCurrentUser();

      }


      render();


      notify(
        `Plano do teste alterado para ${plan.name}. Seus dias restantes foram mantidos.`
      );


    } catch (error) {

      console.error(
        "Erro ao alterar plano:",
        error
      );


      notify(
        error?.message ||
        "Não foi possível alterar o plano."
      );

    }

  }



  /* =========================================================

     CANCELAR ASSINATURA

  ========================================================= */



   async function cancelSubscription() {



  if (

    !subscription?.id ||

    !business?.id

  ) {

    return;

  }





  const status =

    normalize(

      subscription.status

    );





  const isTrial =

    status === "trialing";





  const confirmed =

    window.confirm(

      isTrial



        ? "Deseja cancelar sua assinatura? Você continuará usando normalmente até o fim dos 15 dias de teste e não deverá ser cobrado ao final do período."



        : "Deseja cancelar sua assinatura? O acesso permanecerá disponível até o fim do período atual."

    );





  if (!confirmed) {

    return;

  }





  try {



    const {

      data,

      error

    } =

      await supabaseClient

        .from("subscriptions")

        .update({



          cancel_at_period_end:

            true,



          updated_at:

            new Date()

              .toISOString()



        })

        .eq(

          "id",

          subscription.id

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





    subscription =

      data;





    render();





    notify(

      isTrial

        ? "Cancelamento agendado. Seu teste continuará disponível até o fim dos 15 dias."

        : "Cancelamento agendado."

    );





  } catch (error) {



    console.error(

      "Erro ao cancelar assinatura:",

      error

    );





    notify(

      "Não foi possível solicitar o cancelamento."

    );



  }



}





  /* =========================================================

     REATIVAR

  ========================================================= */



  async function reactivateSubscription() {

    if (
      !subscription?.id ||
      !subscription?.cancel_at_period_end
    ) {
      return;
    }


    const status =
      normalize(
        subscription.status
      );


    /*
     * Uma assinatura já encerrada/expirada
     * não pode ser ativada pelo frontend.
     */
    if (
      status !== "trialing" &&
      status !== "active"
    ) {

      notify(
        "Esta assinatura precisa ser regularizada pelo checkout."
      );

      return;
    }


    try {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("subscriptions")
          .update({

            /*
             * Preserva o status atual.
             * Trial continua trialing.
             * Ativa continua active.
             */
            cancel_at_period_end:
              false,

            updated_at:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            subscription.id
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


      subscription =
        data;


      render();


      notify(
        status === "trialing"
          ? "Cancelamento removido. Seu teste continuará normalmente."
          : "Cancelamento removido. Sua assinatura continuará ativa."
      );


    } catch (error) {

      console.error(
        "Erro ao reativar assinatura:",
        error
      );


      notify(
        error?.message ||
        "Não foi possível reativar a assinatura."
      );

    }

  }



  /* =========================================================

     EVENTOS

  ========================================================= */



  document

    .querySelectorAll(

      "[data-change-plan]"

    )

    .forEach(

      button => {



        button.addEventListener(

          "click",

          async () => {



            await changePlan(

              button.dataset

                .changePlan

            );



          }

        );



      }

    );





  cancelButton

    ?.addEventListener(

      "click",

      cancelSubscription

    );





  reactivateButton

    ?.addEventListener(

      "click",

      reactivateSubscription

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

        loadSubscription(),

        loadProfessionals()

      ]);





      render();





    } catch (error) {



      console.error(

        "Erro ao carregar assinatura:",

        error

      );





      notify(

        "Não foi possível carregar os dados do plano."

      );



    }



  }





  init();



})();