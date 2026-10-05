(function () {

  "use strict";

  console.log("trial-expired.js carregou");


  const supabase =
    window.katosSupabase ||
    window.supabaseClient;


  if (!supabase) {

    console.error(
      "Supabase não inicializado."
    );

    return;
  }


  async function loadExpiredPage() {

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabase
        .auth
        .getSession();


    if (
      sessionError ||
      !sessionData?.session
    ) {

      window.location.replace(
        "login.html"
      );

      return;
    }


    const user =
      sessionData.session.user;


    const {
      data: business,
      error: businessError
    } =
      await supabase
        .from("businesses")
        .select("id")
        .eq(
          "owner_id",
          user.id
        )
        .single();


    if (
      businessError ||
      !business
    ) {

      console.error(
        "Empresa não encontrada:",
        businessError
      );

      return;
    }


    const {
      data: subscription,
      error: subscriptionError
    } =
      await supabase
        .from("subscriptions")
        .select(`
          id,
          plan,
          status,
          trial_ends_at,
          current_period_end
        `)
        .eq(
          "business_id",
          business.id
        )
        .single();


    if (
      subscriptionError ||
      !subscription
    ) {

      console.error(
        "Assinatura não encontrada:",
        subscriptionError
      );

      return;
    }


    const status =
      String(
        subscription.status ||
        ""
      )
        .toLowerCase()
        .trim();


    /* =============================================
       TESTE AINDA VÁLIDO
    ============================================= */

    if (
      status ===
      "trialing"
    ) {

      const end =
        subscription.trial_ends_at
          ? new Date(
              subscription.trial_ends_at
            )
          : null;


      if (
        end &&
        end.getTime() >
        Date.now()
      ) {

        window.location.replace(
          "dashboard.html"
        );

        return;
      }

    }


    /* =============================================
       ASSINATURA ATIVA
    ============================================= */

    if (
      status ===
      "active"
    ) {

      window.location.replace(
        "dashboard.html"
      );

      return;
    }


    /* =============================================
       CANCELADA MAS AINDA COM ACESSO
    ============================================= */

    if (
      status ===
      "cancelled" &&
      subscription
        .current_period_end
    ) {

      const periodEnd =
        new Date(
          subscription
            .current_period_end
        );


      if (
        periodEnd.getTime() >
        Date.now()
      ) {

        window.location.replace(
          "dashboard.html"
        );

        return;
      }

    }

  }


  /* =============================================
     ESCOLHER PLANO
  ============================================= */

 document
  .querySelectorAll("[data-select-plan]")
  .forEach(button => {

    button.addEventListener("click", event => {

      console.log("CLICOU NO PLANO");

      event.preventDefault();

      const plan =
        button.dataset.selectPlan;

      if (!plan) {
        return;
      }

      localStorage.setItem(
        "katos_selected_plan",
        plan
      );

      window.location.href =
        `manage-plan.html?plan=${encodeURIComponent(plan)}&from=trial_expired`;

    });

  });


  loadExpiredPage();

})();

document
  .querySelectorAll(".expired-plan-card")
  .forEach(card => {

    card.addEventListener("click", event => {

      if (
        event.target.closest(
          "[data-select-plan]"
        )
      ) {
        return;
      }

      const button =
        card.querySelector(
          "[data-select-plan]"
        );

      button?.click();

    });

  });