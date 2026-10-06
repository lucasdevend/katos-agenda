document.addEventListener("DOMContentLoaded", async () => {
  const supabase =
    window.katosSupabase ||
    window.supabaseClient;

  if (!supabase) {
    console.error("Supabase não inicializado.");
    return;
  }


  /* =========================================================
     ESTADO
  ========================================================= */

  let selectedPlan = null;
  let selectedPaymentMethod = "card";

  let cardForm = null;

  let cardProcessing = false;
  let pixProcessing = false;

  let pixStatusInterval = null;


  const VALID_PLANS = [
    "starter",
    "business",
    "platinum",
  ];


  const PLAN_DATA = {
    starter: {
      name: "Starter",
      price: "21,90",
    },

    business: {
      name: "Business",
      price: "69,90",
    },

    platinum: {
      name: "Platinum",
      price: "149,90",
    },
  };


  /* =========================================================
     ELEMENTOS
  ========================================================= */

  const paymentSection =
    document.getElementById(
      "paymentSection"
    );


  const selectedPlanText =
    document.getElementById(
      "selectedPlanText"
    );


  const submitButton =
    document.getElementById(
      "form-checkout__submit"
    );


  const planButtons =
    document.querySelectorAll(
      "[data-select-plan]"
    );


  /* =========================================================
     CARTÃO / PIX
  ========================================================= */

  const paymentMethodCard =
    document.getElementById(
      "paymentMethodCard"
    );


  const paymentMethodPix =
    document.getElementById(
      "paymentMethodPix"
    );


  const cardPaymentPanel =
    document.getElementById(
      "cardPaymentPanel"
    );


  const pixPaymentPanel =
    document.getElementById(
      "pixPaymentPanel"
    );


  /* =========================================================
     PIX
  ========================================================= */

  const generatePixButton =
    document.getElementById(
      "generatePixButton"
    );


  const pixLoading =
    document.getElementById(
      "pixLoading"
    );


  const pixResult =
    document.getElementById(
      "pixResult"
    );


  const pixError =
    document.getElementById(
      "pixError"
    );


  const pixQrCodeImage =
    document.getElementById(
      "pixQrCodeImage"
    );


  const pixCopyPaste =
    document.getElementById(
      "pixCopyPaste"
    );


  const copyPixButton =
    document.getElementById(
      "copyPixButton"
    );

  const pixCpf =
     document.getElementById(
      "pixCpf"
  );


  /* =========================================================
     CONTA / ASSINATURA
  ========================================================= */

  async function getCurrentAccount() {
    const {
      data: {
        session,
      },

      error: sessionError,
    } =
      await supabase.auth.getSession();


    if (
      sessionError ||
      !session
    ) {
      return null;
    }


    const {
      data: business,
      error: businessError,
    } =
      await supabase
        .from("businesses")
        .select("id")
        .eq(
          "owner_id",
          session.user.id
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

      return {
        session,
        business: null,
      };
    }


    return {
      session,
      business,
    };
  }


  async function checkAccount() {
    const account =
      await getCurrentAccount();


    if (!account?.session) {
      window.location.href =
        "login.html";

      return false;
    }


    if (!account.business) {
      return true;
    }


    const {
      data: subscription,
      error: subscriptionError,
    } =
      await supabase
        .from("subscriptions")
        .select(
          `
            status,
            trial_ends_at,
            current_period_end
          `
        )
        .eq(
          "business_id",
          account.business.id
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

      return true;
    }


    const now =
      new Date();


    /* ---------------------------------------------------------
       TESTE AINDA VÁLIDO
    --------------------------------------------------------- */

    if (
      subscription.status ===
        "trialing" &&
      subscription.trial_ends_at &&
      new Date(
        subscription.trial_ends_at
      ) > now
    ) {
      window.location.href =
        "dashboard.html";

      return false;
    }


    /* ---------------------------------------------------------
       ASSINATURA ATIVA
    --------------------------------------------------------- */

    if (
      subscription.status ===
      "active"
    ) {
      window.location.href =
        "dashboard.html";

      return false;
    }


    /* ---------------------------------------------------------
       CANCELADA MAS AINDA PAGA
    --------------------------------------------------------- */

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
  }


  const allowed =
    await checkAccount();


  if (!allowed) {
    return;
  }


  /* =========================================================
     MERCADO PAGO
  ========================================================= */

  let mp = null;


  if (window.MP_PUBLIC_KEY) {
    mp =
      new MercadoPago(
        window.MP_PUBLIC_KEY
      );
  } else {
    console.error(
      "Public Key do Mercado Pago não configurada."
    );
  }


  /* =========================================================
     ERRO DA EDGE FUNCTION
  ========================================================= */

  async function getFunctionError(
    error,
    fallbackMessage
  ) {
    console.error(
      "Erro Edge Function:",
      error
    );


    try {
      if (
        error?.context &&
        typeof error.context.json ===
          "function"
      ) {
        const body =
          await error.context.json();


        if (body?.error) {
          return body.error;
        }


        if (body?.message) {
          return body.message;
        }
      }
    } catch (contextError) {
      console.error(
        "Não foi possível ler erro da função:",
        contextError
      );
    }


    return (
      error?.message ||
      fallbackMessage
    );
  }


  /* =========================================================
     CARD FORM
  ========================================================= */

  function initCardForm() {
    if (cardForm) {
      return;
    }


    if (!mp) {
      alert(
        "Mercado Pago não foi inicializado."
      );

      return;
    }


    cardForm =
      mp.cardForm({
        amount: "1",

        iframe: true,


        form: {
          id:
            "form-checkout",


          cardNumber: {
            id:
              "form-checkout__cardNumber",

            placeholder:
              "Número do cartão",
          },


          expirationDate: {
            id:
              "form-checkout__expirationDate",

            placeholder:
              "MM/AA",
          },


          securityCode: {
            id:
              "form-checkout__securityCode",

            placeholder:
              "CVV",
          },


          cardholderName: {
            id:
              "form-checkout__cardholderName",

            placeholder:
              "Nome como está no cartão",
          },


          issuer: {
            id:
              "form-checkout__issuer",

            placeholder:
              "Banco emissor",
          },


          installments: {
            id:
              "form-checkout__installments",

            placeholder:
              "Parcelas",
          },


          identificationType: {
            id:
              "form-checkout__identificationType",

            placeholder:
              "Tipo de documento",
          },


          identificationNumber: {
            id:
              "form-checkout__identificationNumber",

            placeholder:
              "CPF",
          },


          cardholderEmail: {
            id:
              "form-checkout__cardholderEmail",

            placeholder:
              "E-mail",
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


          onSubmit:
            async (event) => {
              event.preventDefault();


              if (
                selectedPaymentMethod !==
                "card"
              ) {
                return;
              }


              if (
                cardProcessing
              ) {
                return;
              }


              if (
                !VALID_PLANS.includes(
                  selectedPlan
                )
              ) {
                alert(
                  "Selecione um plano."
                );

                return;
              }


              cardProcessing =
                true;


              if (submitButton) {
                submitButton.disabled =
                  true;

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
                  await supabase
                    .functions
                    .invoke(
                      "create-mp-subscription",
                      {
                        body: {
                          plan:
                            selectedPlan,

                          card_token_id:
                            cardTokenId,
                        },
                      }
                    );


                if (error) {
                  const message =
                    await getFunctionError(
                      error,

                      "Erro ao criar assinatura."
                    );


                  throw new Error(
                    message
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
                cardProcessing =
                  false;


                if (submitButton) {
                  submitButton.disabled =
                    false;

                  submitButton.textContent =
                    "Assinar com cartão";
                }
              }
            },
        },
      });
  }


  /* =========================================================
     SELEÇÃO DE FORMA DE PAGAMENTO
  ========================================================= */

  function setPaymentMethod(
    method
  ) {
    selectedPaymentMethod =
      method;


    if (
      method === "card"
    ) {
      paymentMethodCard
        ?.classList
        .add("active");


      paymentMethodPix
        ?.classList
        .remove("active");


      paymentMethodCard
        ?.setAttribute(
          "aria-selected",
          "true"
        );


      paymentMethodPix
        ?.setAttribute(
          "aria-selected",
          "false"
        );


      if (cardPaymentPanel) {
        cardPaymentPanel.hidden =
          false;

        cardPaymentPanel
          .classList
          .add("active");
      }


      if (pixPaymentPanel) {
        pixPaymentPanel.hidden =
          true;

        pixPaymentPanel
          .classList
          .remove("active");
      }


      initCardForm();


      return;
    }


    /* ---------------------------------------------------------
       PIX
    --------------------------------------------------------- */

    paymentMethodCard
      ?.classList
      .remove("active");


    paymentMethodPix
      ?.classList
      .add("active");


    paymentMethodCard
      ?.setAttribute(
        "aria-selected",
        "false"
      );


    paymentMethodPix
      ?.setAttribute(
        "aria-selected",
        "true"
      );


    if (cardPaymentPanel) {
      cardPaymentPanel.hidden =
        true;

      cardPaymentPanel
        .classList
        .remove("active");
    }


    if (pixPaymentPanel) {
      pixPaymentPanel.hidden =
        false;

      pixPaymentPanel
        .classList
        .add("active");
    }
  }


  paymentMethodCard
    ?.addEventListener(
      "click",
      () => {
        setPaymentMethod(
          "card"
        );
      }
    );


  paymentMethodPix
    ?.addEventListener(
      "click",
      () => {
        setPaymentMethod(
          "pix"
        );
      }
    );


  /* =========================================================
     SELEÇÃO DO PLANO
  ========================================================= */

  planButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          selectedPlan =
            button.dataset
              .selectPlan;


          if (
            !VALID_PLANS.includes(
              selectedPlan
            )
          ) {
            alert(
              "Plano inválido."
            );

            return;
          }


          const plan =
            PLAN_DATA[
              selectedPlan
            ];


          if (
            selectedPlanText
          ) {
            selectedPlanText
              .textContent =
                `${plan.name} — R$ ${plan.price}/mês`;
          }


          if (
            paymentSection
          ) {
            paymentSection
              .style
              .display =
                "block";
          }


          /*
           * Começa no cartão.
           * O cliente pode trocar para Pix.
           */

          setPaymentMethod(
            "card"
          );


          paymentSection
            ?.scrollIntoView({
              behavior:
                "smooth",

              block:
                "start",
            });
        }
      );
    }
  );


  /* =========================================================
     LIMPAR PIX
  ========================================================= */

  function clearPixResult() {
    if (pixResult) {
      pixResult.hidden =
        true;
    }


    if (pixError) {
      pixError.hidden =
        true;

      pixError.textContent =
        "";
    }


    if (pixQrCodeImage) {
      pixQrCodeImage.src =
        "";
    }


    if (pixCopyPaste) {
      pixCopyPaste.value =
        "";
    }


    if (
      pixStatusInterval
    ) {
      clearInterval(
        pixStatusInterval
      );

      pixStatusInterval =
        null;
    }
  }


  /* =========================================================
     MOSTRAR ERRO DO PIX
  ========================================================= */

  function showPixError(
    message
  ) {
    if (!pixError) {
      alert(message);
      return;
    }


    pixError.textContent =
      message;


    pixError.hidden =
      false;
  }


  /* =========================================================
     VERIFICAR SE WEBHOOK ATIVOU O PLANO
  ========================================================= */

  async function checkPixPaymentStatus() {
    try {
      const account =
        await getCurrentAccount();


      if (
        !account?.business
      ) {
        return;
      }


      const {
        data,
        error,
      } =
        await supabase
          .from(
            "subscriptions"
          )
          .select(
            `
              status,
              current_period_end
            `
          )
          .eq(
            "business_id",
            account.business.id
          )
          .single();


      if (error || !data) {
        return;
      }


      if (
        data.status ===
        "active"
      ) {
        if (
          pixStatusInterval
        ) {
          clearInterval(
            pixStatusInterval
          );

          pixStatusInterval =
            null;
        }


        window.location.href =
          "dashboard.html";
      }
    } catch (error) {
      console.error(
        "Erro ao verificar Pix:",
        error
      );
    }
  }


  /* =========================================================
     GERAR PIX
  ========================================================= */

  generatePixButton
    ?.addEventListener(
      "click",
      async () => {
        if (
          pixProcessing
        ) {
          return;
        }


        if (
          !VALID_PLANS.includes(
            selectedPlan
          )
        ) {
          alert(
            "Selecione um plano."
          );

          return;
        }

        const cpf =
  pixCpf?.value
    ?.replace(/\D/g, "");


if (
  !cpf ||
  cpf.length !== 11
) {
  showPixError(
    "Digite um CPF válido para gerar o Pix."
  );

  pixCpf?.focus();

  return;
}


        clearPixResult();


        pixProcessing =
          true;


        generatePixButton.disabled =
          true;


        generatePixButton.textContent =
          "Gerando Pix...";


        if (pixLoading) {
          pixLoading.hidden =
            false;
        }


        try {
          const {
            data,
            error,
          } =
            await supabase
              .functions
              .invoke(
                "create-pix-payment",
                {
                  body: {
                      plan:
                      selectedPlan,

                       cpf:
                       cpf,
                    },
                }
              );


          if (error) {
            const message =
              await getFunctionError(
                error,

                "Não foi possível gerar o Pix."
              );


            throw new Error(
              message
            );
          }


          if (!data?.ok) {
            console.error(
              "Resposta Pix:",
              data
            );


            throw new Error(
              data?.error ||
                "Não foi possível gerar o Pix."
            );
          }


          /*
           * A Edge Function que vamos criar deverá
           * retornar estes campos:
           *
           * qr_code
           * qr_code_base64
           * payment_id
           */


          const qrCode =
            data.qr_code;


          const qrCodeBase64 =
            data.qr_code_base64;


          if (
            !qrCode ||
            !qrCodeBase64
          ) {
            console.error(
              "Dados do Pix incompletos:",
              data
            );


            throw new Error(
              "O Mercado Pago não retornou os dados do Pix."
            );
          }


          if (
            pixCopyPaste
          ) {
            pixCopyPaste.value =
              qrCode;
          }


          if (
            pixQrCodeImage
          ) {
            pixQrCodeImage.src =
              qrCodeBase64.startsWith(
                "data:image"
              )
                ? qrCodeBase64
                : `data:image/png;base64,${qrCodeBase64}`;
          }


          if (pixResult) {
            pixResult.hidden =
              false;
          }


          /*
           * Consulta a assinatura periodicamente.
           *
           * Assim que o webhook receber o pagamento
           * e mudar a assinatura para active,
           * o cliente será enviado ao dashboard.
           */

          pixStatusInterval =
            setInterval(
              checkPixPaymentStatus,
              5000
            );
        } catch (error) {
          console.error(
            "Erro ao gerar Pix:",
            error
          );


          showPixError(
            error?.message ||
              "Erro ao gerar o Pix."
          );
        } finally {
          pixProcessing =
            false;


          if (
            pixLoading
          ) {
            pixLoading.hidden =
              true;
          }


          generatePixButton.disabled =
            false;


          generatePixButton.textContent =
            "Gerar novo Pix";
        }
      }
    );


  /* =========================================================
     COPIAR PIX
  ========================================================= */

  copyPixButton
    ?.addEventListener(
      "click",
      async () => {
        const code =
          pixCopyPaste
            ?.value
            ?.trim();


        if (!code) {
          return;
        }


        try {
          await navigator
            .clipboard
            .writeText(
              code
            );


          copyPixButton.textContent =
            "Código copiado";


          setTimeout(
            () => {
              copyPixButton.textContent =
                "Copiar código Pix";
            },

            2000
          );
        } catch (error) {
          console.error(
            "Erro ao copiar Pix:",
            error
          );


          /*
           * Fallback para navegadores
           * que bloqueiam Clipboard API.
           */

          pixCopyPaste.focus();

          pixCopyPaste.select();


          document.execCommand(
            "copy"
          );


          copyPixButton.textContent =
            "Código copiado";


          setTimeout(
            () => {
              copyPixButton.textContent =
                "Copiar código Pix";
            },

            2000
          );
        }
      }
    );


  /* =========================================================
     LIMPEZA
  ========================================================= */

  window.addEventListener(
    "beforeunload",
    () => {
      if (
        pixStatusInterval
      ) {
        clearInterval(
          pixStatusInterval
        );
      }
    }
  );
});