document.addEventListener("DOMContentLoaded", async () => {
  const supabase =
    window.katosSupabase ||
    window.supabaseClient;

  if (!supabase) {
    console.error("Supabase não inicializado.");
    return;
  }

  const buttons = document.querySelectorAll(
    "[data-select-plan]"
  );

  let loading = false;

  function setLoading(active, selectedButton = null) {
    buttons.forEach((button) => {
      button.disabled = active;

      if (active && button === selectedButton) {
        button.dataset.originalText =
          button.dataset.originalText ||
          button.textContent;

        button.textContent =
          "Abrindo pagamento...";
      } else if (
        !active &&
        button.dataset.originalText
      ) {
        button.textContent =
          button.dataset.originalText;
      }
    });
  }

  async function checkAccount() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        window.location.href =
          "login.html";
        return false;
      }

      const {
        data: business,
        error: businessError,
      } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      if (businessError || !business) {
        console.error(
          "Empresa não encontrada:",
          businessError
        );
        return false;
      }

      const {
        data: subscription,
        error: subscriptionError,
      } = await supabase
        .from("subscriptions")
        .select(
          "status, trial_ends_at, current_period_end"
        )
        .eq("business_id", business.id)
        .single();

      if (
        subscriptionError ||
        !subscription
      ) {
        console.error(
          "Assinatura não encontrada:",
          subscriptionError
        );
        return true;
      }

      const now = new Date();

      if (
        subscription.status === "trialing" &&
        subscription.trial_ends_at &&
        new Date(subscription.trial_ends_at) >
          now
      ) {
        window.location.href =
          "dashboard.html";
        return false;
      }

      if (
        subscription.status === "active"
      ) {
        window.location.href =
          "dashboard.html";
        return false;
      }

      if (
        subscription.status ===
          "cancelled" &&
        subscription.current_period_end &&
        new Date(
          subscription.current_period_end
        ) > now
      ) {
        window.location.href =
          "dashboard.html";
        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "Erro ao verificar assinatura:",
        error
      );

      return true;
    }
  }

  const canStay =
    await checkAccount();

  if (!canStay) {
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener(
      "click",
      async () => {
        if (loading) return;

        const plan =
          button.dataset.selectPlan;

        if (
          ![
            "starter",
            "business",
            "platinum",
          ].includes(plan)
        ) {
          alert("Plano inválido.");
          return;
        }

        loading = true;
        setLoading(true, button);

        try {
          const {
            data: { session },
            error: sessionError,
          } =
            await supabase.auth.getSession();

          if (
            sessionError ||
            !session
          ) {
            window.location.href =
              "login.html";
            return;
          }

          const {
            data,
            error,
          } =
            await supabase.functions.invoke(
              "create-mp-subscription",
              {
                body: {
                  plan,
                },
              }
            );

          if (error) {
            console.error(
              "Erro Edge Function:",
              error
            );

            throw new Error(
              "Não foi possível iniciar o pagamento."
            );
          }

          if (
            !data?.ok ||
            !data?.checkout_url
          ) {
            console.error(
              "Resposta inválida:",
              data
            );

            throw new Error(
              data?.error ||
                "Link de pagamento não recebido."
            );
          }

          window.location.href =
            data.checkout_url;
        } catch (error) {
          console.error(
            "Erro ao criar pagamento:",
            error
          );

          alert(
            error?.message ||
              "Erro ao abrir o Mercado Pago."
          );

          loading = false;
          setLoading(false);
        }
      }
    );
  });
});