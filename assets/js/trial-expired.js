document.addEventListener("DOMContentLoaded", async () => {
  const supabase =
    window.katosSupabase ||
    window.supabaseClient;

  if (!supabase) {
    console.error("Supabase não inicializado.");
    return;
  }

  if (!window.MP_PUBLIC_KEY) {
    console.error("Public Key do Mercado Pago não configurada.");
    return;
  }

  let selectedPlan = null;
  let cardForm = null;
  let processing = false;

  const paymentSection =
    document.getElementById("paymentSection");

  const submitButton =
    document.getElementById("form-checkout__submit");

  const buttons =
    document.querySelectorAll("[data-select-plan]");

  async function checkAccount() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      window.location.href = "login.html";
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

      return true;
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

    if (subscriptionError || !subscription) {
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
      new Date(subscription.trial_ends_at) > now
    ) {
      window.location.href = "dashboard.html";
      return false;
    }

    if (subscription.status === "active") {
      window.location.href = "dashboard.html";
      return false;
    }

    if (
      subscription.status === "cancelled" &&
      subscription.current_period_end &&
      new Date(subscription.current_period_end) > now
    ) {
      window.location.href = "dashboard.html";
      return false;
    }

    return true;
  }

  const allowed = await checkAccount();

  if (!allowed) {
    return;
  }

  const mp = new MercadoPago(
    window.MP_PUBLIC_KEY
  );

  function initCardForm() {
    if (cardForm) {
      return;
    }

    cardForm = mp.cardForm({
      amount: "1",

      iframe: true,

      form: {
        id: "form-checkout",

        cardNumber: {
          id: "form-checkout__cardNumber",
          placeholder: "Número do cartão",
        },

        expirationDate: {
          id: "form-checkout__expirationDate",
          placeholder: "MM/AA",
        },

        securityCode: {
          id: "form-checkout__securityCode",
          placeholder: "CVV",
        },

        cardholderName: {
          id: "form-checkout__cardholderName",
          placeholder: "Nome como está no cartão",
        },

        issuer: {
          id: "form-checkout__issuer",
          placeholder: "Banco emissor",
        },

        installments: {
          id: "form-checkout__installments",
          placeholder: "Parcelas",
        },

        identificationType: {
          id: "form-checkout__identificationType",
          placeholder: "Tipo de documento",
        },

        identificationNumber: {
          id: "form-checkout__identificationNumber",
          placeholder: "CPF",
        },

        cardholderEmail: {
          id: "form-checkout__cardholderEmail",
          placeholder: "E-mail",
        },
      },

      callbacks: {
        onFormMounted(error) {
          if (error) {
            console.error(
              "Erro ao montar CardForm:",
              error
            );
          }
        },

        onSubmit: async (event) => {
          event.preventDefault();

          if (processing) {
            return;
          }

          if (
            ![
              "starter",
              "business",
              "platinum",
            ].includes(selectedPlan)
          ) {
            alert("Selecione um plano.");
            return;
          }

          processing = true;

          if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent =
              "Processando...";
          }

          try {
            const formData =
              cardForm.getCardFormData();

            const cardTokenId =
              formData.token;

            if (!cardTokenId) {
              throw new Error(
                "Não foi possível gerar o token do cartão."
              );
            }

            const {
              data,
              error,
            } =
              await supabase.functions.invoke(
                "create-mp-subscription",
                {
                  body: {
                    plan: selectedPlan,
                    card_token_id:
                      cardTokenId,
                  },
                }
              );

            if (error) {
              console.error(
                "Erro Edge Function:",
                error
              );

              throw new Error(
                "Erro ao criar assinatura."
              );
            }

            if (!data?.ok) {
              console.error(
                "Resposta da função:",
                data
              );

              throw new Error(
                data?.error ||
                  "Não foi possível concluir a assinatura."
              );
            }

            alert(
              "Assinatura criada com sucesso."
            );

            window.location.href =
              "dashboard.html";
          } catch (error) {
            console.error(
              "Erro no pagamento:",
              error
            );

            alert(
              error?.message ||
                "Erro ao processar pagamento."
            );
          } finally {
            processing = false;

            if (submitButton) {
              submitButton.disabled = false;
              submitButton.textContent =
                "Assinar plano";
            }
          }
        },
      },
    });
  }

  buttons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        selectedPlan =
          button.dataset.selectPlan;

        if (
          ![
            "starter",
            "business",
            "platinum",
          ].includes(selectedPlan)
        ) {
          alert("Plano inválido.");
          return;
        }

        paymentSection.style.display =
          "block";

        initCardForm();

        paymentSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    );
  });
});