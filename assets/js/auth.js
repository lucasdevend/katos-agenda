(function () {



  const CACHE_KEY = "katos_supabase_user";





  /* =======================================================

     PLANO

  ======================================================= */



  window.planLimit = function (plan) {



    const value =

      String(plan || "")

        .toLowerCase();



    if (value === "platinum") {

      return 8;

    }



    if (value === "business") {

      return 5;

    }



    return 1;

  };





  /* =======================================================

     CACHE COMPATÍVEL COM O PAINEL ANTIGO

  ======================================================= */



  function setCachedUser(user) {



    if (!user) {

      localStorage.removeItem(CACHE_KEY);

      return;

    }



    localStorage.setItem(

      CACHE_KEY,

      JSON.stringify(user)

    );

  }





  window.currentUser = function () {



    const raw =

      localStorage.getItem(CACHE_KEY);



    if (!raw) {

      return null;

    }



    try {

      return JSON.parse(raw);

    } catch {

      localStorage.removeItem(CACHE_KEY);

      return null;

    }

  };





  /* =======================================================

     MENSAGEM LOGIN/CADASTRO

  ======================================================= */



  function showAuthMessage(

    message,

    type = "error"

  ) {



    const element =

      document.querySelector(

        "#authMessage"

      );



    if (!element) {



      if (typeof toast === "function") {

        toast(message);

      }



      return;

    }



    element.hidden = false;

    element.textContent = message;

    element.dataset.type = type;

  }





  function hideAuthMessage() {



    const element =

      document.querySelector(

        "#authMessage"

      );



    if (!element) return;



    element.hidden = true;

    element.textContent = "";



    delete element.dataset.type;

  }





  /* =======================================================

     CARREGAR PERFIL + EMPRESA

  ======================================================= */



  async function loadCurrentAccount(authUser) {



    if (

      !authUser ||

      typeof supabaseClient === "undefined"

    ) {

      return null;

    }



    const {

      data: profile,

      error: profileError

    } =

      await supabaseClient

        .from("profiles")

        .select(

          "id, full_name, email, role"

        )

        .eq(

          "id",

          authUser.id

        )

        .single();



    if (profileError) {



      console.error(

        "Erro ao carregar perfil:",

        profileError

      );



      return null;

    }



    const {

      data: business,

      error: businessError

    } =

      await supabaseClient

        .from("businesses")

        .select(`

          id,

          owner_id,

          name,

          phone,

          whatsapp,

          email,

          address,

          image_url,

          plan,

          active

        `)

        .eq(

          "owner_id",

          authUser.id

        )

        .single();



    if (businessError) {



      console.error(

        "Erro ao carregar estabelecimento:",

        businessError

      );



      return null;

    }



    const cachedUser = {



      id: authUser.id,



      email:

        profile.email ||

        authUser.email ||

        "",



      name:

        profile.full_name ||

        "",



      fullName:

        profile.full_name ||

        "",



      role:

        profile.role ||

        "customer",



      businessId:

        business.id,



      shopName:

        business.name,



      shopPhone:

        business.phone ||

        "",



      shopWhatsapp:

        business.whatsapp ||

        "",



      shopEmail:

        business.email ||

        "",



      shopAddress:

        business.address ||

        "",



      shopImage:

        business.image_url ||

        "",



      plan:

        business.plan ||

        "starter",



      active:

        business.active !== false

    };



    setCachedUser(cachedUser);



    return cachedUser;

  }





  window.refreshCurrentUser =

    async function () {



      if (

        typeof supabaseClient ===

        "undefined"

      ) {

        return null;

      }



      const {

        data,

        error

      } =

        await supabaseClient

          .auth

          .getUser();



      if (

        error ||

        !data?.user

      ) {



        setCachedUser(null);



        return null;

      }



      return loadCurrentAccount(

        data.user

      );

    };





  /* =======================================================

     CADASTRO

  ======================================================= */



  const registerForm =

    document.querySelector(

      "#registerForm"

    );



  registerForm?.addEventListener(

    "submit",

    async event => {



      event.preventDefault();



      hideAuthMessage();



      const shopName =

        document

          .querySelector(

            "#barbershop"

          )

          ?.value

          .trim();



      const fullName =

        document

          .querySelector(

            "#name"

          )

          ?.value

          .trim();



      const email =

        document

          .querySelector(

            "#email"

          )

          ?.value

          .trim()

          .toLowerCase();



      const password =

        document

          .querySelector(

            "#password"

          )

          ?.value;



      const plan =

        document

          .querySelector(

            "#plan"

          )

          ?.value ||

        "starter";



      if (

        !shopName ||

        !fullName ||

        !email ||

        !password

      ) {



        showAuthMessage(

          "Preencha todos os campos."

        );



        return;

      }



      if (password.length < 6) {



        showAuthMessage(

          "A senha precisa ter pelo menos 6 caracteres."

        );



        return;

      }



      const button =

        document.querySelector(

          "#registerSubmit"

        );



      const oldText =

        button?.textContent;



      if (button) {



        button.disabled = true;



        button.textContent =

          "Criando conta...";

      }



      try {



        const {

          data,

          error

        } =

          await supabaseClient

            .auth

            .signUp({



              email,



              password,



              options: {



                data: {



                  full_name:

                    fullName,



                  shop_name:

                    shopName,



                  plan:

                    plan

                }

              }

            });



        if (error) {

          throw error;

        }



        if (!data.session) {



          showAuthMessage(

            "Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.",

            "success"

          );



          registerForm.reset();



          return;

        }



        const account =

          await loadCurrentAccount(

            data.user

          );



        if (!account) {



          showAuthMessage(

            "Sua conta foi criada, mas não foi possível carregar o estabelecimento."

          );



          return;

        }



        window.location.href =

          "dashboard.html";



      } catch (error) {



        console.error(error);



        let message =

          error?.message ||

          "Não foi possível criar sua conta.";



        if (

          message

            .toLowerCase()

            .includes(

              "already registered"

            )

        ) {



          message =

            "Este e-mail já possui uma conta.";

        }



        showAuthMessage(message);



      } finally {



        if (button) {



          button.disabled = false;



          button.textContent =

            oldText ||

            "Criar conta e continuar";

        }

      }

    }

  );





  /* =======================================================

     LOGIN

  ======================================================= */



  const loginForm =

    document.querySelector(

      "#loginForm"

    );



  loginForm?.addEventListener(

    "submit",

    async event => {



      event.preventDefault();



      hideAuthMessage();



      const email =

        document

          .querySelector(

            "#email"

          )

          ?.value

          .trim()

          .toLowerCase();



      const password =

        document

          .querySelector(

            "#password"

          )

          ?.value;



      if (

        !email ||

        !password

      ) {



        showAuthMessage(

          "Informe seu e-mail e senha."

        );



        return;

      }



      const button =

        document.querySelector(

          "#loginSubmit"

        );



      const oldText =

        button?.textContent;



      if (button) {



        button.disabled = true;



        button.textContent =

          "Entrando...";

      }



      try {



        const {

          data,

          error

        } =

          await supabaseClient

            .auth

            .signInWithPassword({

              email,

              password

            });



        if (error) {

          throw error;

        }



        if (!data?.user) {



          throw new Error(

            "Não foi possível identificar o usuário."

          );

        }



        const account =

          await loadCurrentAccount(

            data.user

          );



        if (!account) {



          throw new Error(

            "Não foi possível carregar os dados do estabelecimento."

          );

        }



        if (!account.active) {



          await supabaseClient

            .auth

            .signOut();



          setCachedUser(null);



          showAuthMessage(

            "Esta conta está desativada."

          );



          return;

        }



        window.location.href =

          "dashboard.html";



      } catch (error) {



        console.error(error);



        let message =

          error?.message ||

          "Não foi possível entrar.";



        if (

          message

            .toLowerCase()

            .includes(

              "invalid login credentials"

            )

        ) {



          message =

            "E-mail ou senha incorretos.";

        }



        if (

          message

            .toLowerCase()

            .includes(

              "email not confirmed"

            )

        ) {



          message =

            "Confirme seu e-mail antes de entrar.";

        }



        showAuthMessage(message);



      } finally {



        if (button) {



          button.disabled = false;



          button.textContent =

            oldText ||

            "Entrar na plataforma";

        }

      }

    }

  );





  /* =======================================================

     MOSTRAR / ESCONDER SENHA

  ======================================================= */



  document

    .querySelectorAll(

      "[data-password-toggle]"

    )

    .forEach(button => {



      button.addEventListener(

        "click",

        () => {



          const wrapper =

            button.closest(

              ".password-wrap"

            );



          const input =

            wrapper?.querySelector(

              "input"

            );



          if (!input) return;



          const hidden =

            input.type === "password";



          input.type =

            hidden

              ? "text"

              : "password";



          button.textContent =

            hidden

              ? "Ocultar"

              : "Ver";

        }

      );

    });





  /* =======================================================

     LOGOUT

  ======================================================= */



  document

    .querySelectorAll(

      "[data-logout]"

    )

    .forEach(button => {



      button.addEventListener(

        "click",

        async () => {



          try {



            if (

              typeof supabaseClient !==

              "undefined"

            ) {



              await supabaseClient

                .auth

                .signOut();

            }



          } catch (error) {



            console.error(

              "Erro ao sair:",

              error

            );

          }



          setCachedUser(null);



          window.location.href =

            "login.html";

        }

      );

    });





  /* =======================================================

     PROTEÇÃO DAS PÁGINAS

  ======================================================= */



  async function protectPage() {



  if (

    document.body.dataset

      .protected !== "true"

  ) {

    return;

  }





  if (

    typeof supabaseClient ===

    "undefined"

  ) {



    window.location.href =

      "login.html";



    return;

  }





  /* =====================================================

     SESSÃO

  ===================================================== */



  const {

    data,

    error

  } =

    await supabaseClient

      .auth

      .getSession();





  if (

    error ||

    !data?.session

  ) {



    setCachedUser(null);



    window.location.href =

      "login.html";



    return;

  }





  /* =====================================================

     CONTA

  ===================================================== */



  let account =

    currentUser();





  if (!account) {



    account =

      await loadCurrentAccount(

        data.session.user

      );





    if (!account) {



      await supabaseClient

        .auth

        .signOut();



      setCachedUser(null);



      window.location.href =

        "login.html";



      return;

    }



  }





  /* =====================================================

     PÁGINA ATUAL

  ===================================================== */



  const currentPage =

    window.location.pathname

      .split("/")

      .pop();





  /*

   * Gerenciar plano precisa continuar

   * acessível mesmo se o trial acabar.

   */

  if (
  currentPage === "manage-plan.html" ||
  currentPage === "trial-expired.html"
) {
  return;
}





  /* =====================================================

     ASSINATURA

  ===================================================== */



  const {

    data: subscription,

    error: subscriptionError

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

        current_period_start,

        current_period_end,

        cancel_at_period_end

      `)

      .eq(

        "business_id",

        account.businessId

      )

      .maybeSingle();





  if (subscriptionError) {

  console.error(
    "Erro ao validar assinatura:",
    subscriptionError
  );

  window.location.replace(
    "manage-plan.html?reason=subscription_error"
  );

  return;
}





  /* =====================================================

     SEM ASSINATURA

  ===================================================== */



  if (!subscription) {



    window.location.replace(

      "manage-plan.html?reason=subscription_not_found"

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





  /* =====================================================

     TESTE GRÁTIS

  ===================================================== */



  if (

    status === "trialing"

  ) {



    if (

      !subscription.trial_ends_at

    ) {



      window.location.replace(

        "manage-plan.html?reason=invalid_trial"

      );



      return;

    }





    const trialEnd =

      new Date(

        subscription

          .trial_ends_at

      );





    const now =

      new Date();





    /*

     * Trial ainda válido.

     */

    if (

      trialEnd.getTime() >

      now.getTime()

    ) {



      return;

    }





    /* ===================================================

       TRIAL EXPIROU

    =================================================== */



    const {

      error: expireError

    } =

      await supabaseClient

        .from("subscriptions")

        .update({



          status:

            "expired",



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

          account.businessId

        );





    if (expireError) {



      console.error(

        "Erro ao marcar trial como expirado:",

        expireError

      );



    }





    window.location.replace(
    "trial-expired.html?reason=trial_expired"
  );



    return;

  }





  /* =====================================================

     ATIVA

  ===================================================== */
  /* =====================================================
   ATIVA
===================================================== */

if (
  status === "active"
) {

  if (
    subscription.current_period_end
  ) {

    const periodEnd =
      new Date(
        subscription
          .current_period_end
      );


    if (
      Number.isNaN(
        periodEnd.getTime()
      )
    ) {

      window.location.replace(
        "manage-plan.html?reason=invalid_period"
      );

      return;

    }


    if (
      periodEnd.getTime() <=
      Date.now()
    ) {

      const {
        error: expireError
      } =
        await supabaseClient
          .from("subscriptions")
          .update({

            status:
              "expired",

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
            account.businessId
          );


      if (expireError) {

        console.error(
          "Erro ao marcar assinatura como expirada:",
          expireError
        );

      }


      window.location.replace(
        "trial-expired.html?reason=period_expired"
      );

      return;

    }

  }


  return;

}

  /* =====================================================

     PAGAMENTO PENDENTE

  ===================================================== */



  if (

    status === "past_due"

  ) {



    window.location.replace(

      "manage-plan.html?reason=past_due"

    );



    return;

  }





  /* =====================================================

     CANCELADA

  ===================================================== */

if (
  status === "cancelled"
) {

  /*
   * Se ainda estiver dentro do período
   * contratado, continua usando.
   */

  if (
    subscription.current_period_end
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

      return;

    }

  }

  window.location.replace(
    "trial-expired.html?reason=cancelled"
  );

  return;
}

  /* =====================================================

     EXPIRADA

  ===================================================== */



  if (

    status === "expired"

  ) {



    window.location.replace(
    "trial-expired.html?reason=expired"
  );



    return;

  }





  /* =====================================================

     STATUS DESCONHECIDO

  ===================================================== */



  window.location.replace(

    "manage-plan.html?reason=invalid_status"

  );



}



  /* =======================================================

     ESQUECI MINHA SENHA

  ======================================================= */



  const forgotPasswordForm =

    document.querySelector(

      "#forgotPasswordForm"

    );



  forgotPasswordForm?.addEventListener(

    "submit",

    async event => {



      event.preventDefault();



      hideAuthMessage();



      const email =

        document

          .querySelector(

            "#recoveryEmail"

          )

          ?.value

          .trim()

          .toLowerCase();



      if (!email) {



        showAuthMessage(

          "Informe seu e-mail."

        );



        return;

      }



      const button =

        document.querySelector(

          "#recoverySubmit"

        );



      const oldText =

        button?.textContent;



      if (button) {



        button.disabled = true;



        button.textContent =

          "Enviando...";

      }



      try {



        const redirectTo =

          new URL(

            "reset-password.html",

            window.location.href

          ).href;



        const {

          error

        } =

          await supabaseClient

            .auth

            .resetPasswordForEmail(

              email,

              {

                redirectTo

              }

            );



        if (error) {

          throw error;

        }



        showAuthMessage(

          "Se existir uma conta com esse e-mail, você receberá um link para redefinir sua senha.",

          "success"

        );



      } catch (error) {



        console.error(

          "Erro recuperação:",

          error

        );



        showAuthMessage(

          error?.message ||

          "Não foi possível enviar o e-mail."

        );



      } finally {



        if (button) {



          button.disabled = false;



          button.textContent =

            oldText ||

            "Enviar link de recuperação";

        }

      }

    }

  );





  /* =======================================================

     DEFINIR NOVA SENHA

  ======================================================= */



  const resetPasswordForm =

    document.querySelector(

      "#resetPasswordForm"

    );



  resetPasswordForm?.addEventListener(

    "submit",

    async event => {



      event.preventDefault();



      hideAuthMessage();



      const password =

        document

          .querySelector(

            "#newPassword"

          )

          ?.value;



      const confirmPassword =

        document

          .querySelector(

            "#confirmPassword"

          )

          ?.value;



      if (

        !password ||

        !confirmPassword

      ) {



        showAuthMessage(

          "Preencha os dois campos."

        );



        return;

      }



      if (

        password.length < 6

      ) {



        showAuthMessage(

          "A senha precisa ter pelo menos 6 caracteres."

        );



        return;

      }



      if (

        password !==

        confirmPassword

      ) {



        showAuthMessage(

          "As senhas não são iguais."

        );



        return;

      }



      const button =

        document.querySelector(

          "#resetPasswordSubmit"

        );



      const oldText =

        button?.textContent;



      if (button) {



        button.disabled = true;



        button.textContent =

          "Salvando...";

      }



      try {



        const {

          error

        } =

          await supabaseClient

            .auth

            .updateUser({

              password

            });



        if (error) {

          throw error;

        }



        showAuthMessage(

          "Senha alterada com sucesso. Redirecionando para o login...",

          "success"

        );



        await supabaseClient

          .auth

          .signOut();



        setTimeout(

          () => {



            window.location.href =

              "login.html";



          },

          1500

        );



      } catch (error) {



        console.error(

          "Erro nova senha:",

          error

        );



        showAuthMessage(

          error?.message ||

          "Não foi possível alterar a senha."

        );



        if (button) {



          button.disabled = false;



          button.textContent =

            oldText ||

            "Salvar nova senha";

        }

      }

    }

  );





  /* =======================================================

     INICIALIZAÇÃO

  ======================================================= */



   protectPage();



})();