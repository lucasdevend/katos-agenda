(function () {

  const DAYS = [
    {
      key: "monday",
      label: "Segunda-feira"
    },
    {
      key: "tuesday",
      label: "Terça-feira"
    },
    {
      key: "wednesday",
      label: "Quarta-feira"
    },
    {
      key: "thursday",
      label: "Quinta-feira"
    },
    {
      key: "friday",
      label: "Sexta-feira"
    },
    {
      key: "saturday",
      label: "Sábado"
    },
    {
      key: "sunday",
      label: "Domingo"
    }
  ];


let authUser = null;
let profile = null;
let business = null;
let businessSettings = null;
let subscription = null;


  /* =======================================================
     AUXILIARES
  ======================================================= */

  function showToast(message) {

    if (typeof toast === "function") {
      toast(message);
      return;
    }

    console.log(message);
  }


  function planLabel(plan) {

    const value =
      String(plan || "")
        .toLowerCase();

    if (value === "platinum") {
      return "Platinum";
    }

    if (value === "business") {
      return "Business";
    }

    return "Starter";
  }


  function getPlanLimit(plan) {

    if (typeof planLimit === "function") {
      return planLimit(plan);
    }

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
  }


  function defaultBusinessHours() {

    return {

      monday: {
        active: true,
        open: "09:00",
        close: "18:00"
      },

      tuesday: {
        active: true,
        open: "09:00",
        close: "18:00"
      },

      wednesday: {
        active: true,
        open: "09:00",
        close: "18:00"
      },

      thursday: {
        active: true,
        open: "09:00",
        close: "18:00"
      },

      friday: {
        active: true,
        open: "09:00",
        close: "18:00"
      },

      saturday: {
        active: true,
        open: "09:00",
        close: "17:00"
      },

      sunday: {
        active: false,
        open: "09:00",
        close: "17:00"
      }

    };
  }


  /* =======================================================
     CARREGAR USUÁRIO
  ======================================================= */

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


    /* PROFILE */

    const {
      data: profileData,
      error: profileError
    } =
      await supabaseClient
        .from("profiles")
        .select(
          `
          id,
          full_name,
          email,
          role
          `
        )
        .eq(
          "id",
          authUser.id
        )
        .single();


    if (profileError) {

      console.error(
        "Erro profile:",
        profileError
      );

      showToast(
        "Não foi possível carregar os dados da conta."
      );

      return false;
    }


    profile =
      profileData;


    /* BUSINESS */

    const {
      data: businessData,
      error: businessError
    } =
      await supabaseClient
        .from("businesses")
        .select(
          `
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
          `
        )
        .eq(
          "owner_id",
          authUser.id
        )
        .single();


    if (businessError) {

      console.error(
        "Erro business:",
        businessError
      );

      showToast(
        "Não foi possível carregar o estabelecimento."
      );

      return false;
    }


    business =
      businessData;


    /* SETTINGS */

    const {
      data: settingsData,
      error: settingsError
    } =
      await supabaseClient
        .from("business_settings")
        .select(
          `
          id,
          business_id,
          business_hours,
          booking_interval,
          minimum_notice,
          max_days_ahead
          `
        )
        .eq(
          "business_id",
          business.id
        )
        .single();


    if (settingsError) {

      console.error(
        "Erro business_settings:",
        settingsError
      );

      showToast(
        "Não foi possível carregar as configurações."
      );

      return false;
    }


    businessSettings =
      settingsData;


    return true;
  }


  /* =======================================================
     CONTA
  ======================================================= */

  function renderAccount() {

    const nameElement =
      document.querySelector(
        "#accountName"
      );

    const emailElement =
      document.querySelector(
        "#accountEmail"
      );


    if (nameElement) {

      nameElement.textContent =
        profile?.full_name ||
        "-";
    }


    if (emailElement) {

      emailElement.textContent =
        profile?.email ||
        authUser?.email ||
        "-";
    }

  }

  /* =======================================================
   ASSINATURA
======================================================= */

async function loadSubscription() {

  if (!business?.id) {
    return;
  }

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
        current_period_start,
        current_period_end,
        cancel_at_period_end
      `)
      .eq(
        "business_id",
        business.id
      )
      .maybeSingle();

  if (error) {

    console.error(
      "Erro subscription:",
      error
    );

    return;
  }

  subscription = data;
}


  /* =======================================================
     PLANO
  ======================================================= */

   function renderPlan() {

  const selectedPlan =
    subscription?.plan ||
    business?.plan ||
    "starter";

  const label =
    planLabel(
      selectedPlan
    );

  document
    .querySelectorAll(
      "[data-plan]"
    )
    .forEach(element => {

      element.textContent =
        label;

    });

  const limitElement =
    document.querySelector(
      "#settingsPlanLimit"
    );

  if (limitElement) {

    const limit =
      getPlanLimit(
        selectedPlan
      );

    limitElement.textContent =
      limit === 1
        ? "Até 1 profissional"
        : `Até ${limit} profissionais`;

  }

  const statusElement =
    document.querySelector(
      "#settingsPlanStatus"
    );

  if (statusElement) {

    const status =
      String(
        subscription?.status ||
        ""
      )
        .toLowerCase()
        .trim();

    if (status === "trialing") {

      statusElement.textContent =
        "Teste grátis";

    }

    else if (status === "active") {

      statusElement.textContent =
        "Ativo";

    }

    else if (status === "past_due") {

      statusElement.textContent =
        "Pagamento pendente";

    }

    else if (status === "cancelled") {

      statusElement.textContent =
        "Cancelado";

    }

    else if (status === "expired") {

      statusElement.textContent =
        "Expirado";

    }

    else {

      statusElement.textContent =
        "";

    }

  }

  const trialElement =
    document.querySelector(
      "#settingsTrialInfo"
    );

  if (trialElement) {

    const status =
      String(
        subscription?.status ||
        ""
      )
        .toLowerCase()
        .trim();

    if (
      status === "trialing" &&
      subscription?.trial_ends_at
    ) {

      const trialEnd =
        new Date(
          subscription
            .trial_ends_at
        );

      const now =
        new Date();

      const daysRemaining =
        Math.max(
          0,
          Math.ceil(
            (
              trialEnd.getTime() -
              now.getTime()
            ) /
            (
              1000 *
              60 *
              60 *
              24
            )
          )
        );

      const endDate =
        trialEnd.toLocaleDateString(
          "pt-BR"
        );

      if (daysRemaining === 0) {

        trialElement.textContent =
          `Seu teste termina hoje (${endDate}).`;

      }

      else if (daysRemaining === 1) {

        trialElement.textContent =
          `Falta 1 dia de teste. Termina em ${endDate}.`;

      }

      else {

        trialElement.textContent =
          `Faltam ${daysRemaining} dias de teste. Termina em ${endDate}.`;

      }

    }

    else {

      trialElement.textContent =
        "";

    }

  }

}
  /* =======================================================
     ESTABELECIMENTO
  ======================================================= */

  function renderBusiness() {

    const shopName =
      document.querySelector(
        "#shopName"
      );

    const shopPhone =
      document.querySelector(
        "#shopPhone"
      );

    const shopWhatsapp =
      document.querySelector(
        "#shopWhatsapp"
      );

    const shopEmail =
      document.querySelector(
        "#shopEmail"
      );

    const shopAddress =
      document.querySelector(
        "#shopAddress"
      );


    if (shopName) {
      shopName.value =
        business?.name || "";
    }


    if (shopPhone) {
      shopPhone.value =
        business?.phone || "";
    }


    if (shopWhatsapp) {
      shopWhatsapp.value =
        business?.whatsapp || "";
    }


    if (shopEmail) {
      shopEmail.value =
        business?.email || "";
    }


    if (shopAddress) {
      shopAddress.value =
        business?.address || "";
    }


    renderBusinessImage();


    document
      .querySelectorAll(
        "[data-shop-name]"
      )
      .forEach(element => {

        element.textContent =
          business?.name ||
          "Kato's Agenda";

      });

  }


  function renderBusinessImage() {

    const preview =
      document.querySelector(
        "#shopPhotoPreview"
      );

    const image =
      document.querySelector(
        "#shopPhotoImage"
      );

    const initial =
      document.querySelector(
        "#shopPhotoInitial"
      );


    if (!preview) return;


    if (
      business?.image_url &&
      image
    ) {

      preview.classList.add(
        "has-image"
      );

      image.src =
        business.image_url;

    } else {

      preview.classList.remove(
        "has-image"
      );

      if (image) {
        image.removeAttribute(
          "src"
        );
      }

    }


    if (initial) {

      initial.textContent =
        String(
          business?.name ||
          "K"
        )
          .trim()
          .charAt(0)
          .toUpperCase();

    }

  }


  /* =======================================================
     HORÁRIOS
  ======================================================= */

  function renderBusinessHours() {

    const container =
      document.querySelector(
        "#businessHoursList"
      );


    if (!container) return;


    const hours =
      businessSettings
        ?.business_hours ||
      defaultBusinessHours();


    container.innerHTML =
      DAYS
        .map(day => {

          const data =
            hours[day.key] || {
              active: false,
              open: "09:00",
              close: "18:00"
            };


          return `
            <div
              class="
                business-hour-row
                ${data.active ? "" : "closed"}
              "
              data-day="${day.key}"
            >

              <strong
                class="business-hour-day"
              >
                ${day.label}
              </strong>


              <label
                class="business-hour-toggle"
              >

                <input
                  type="checkbox"
                  class="business-hour-active"
                  ${data.active ? "checked" : ""}
                >

                <span>
                  ${data.active ? "Aberto" : "Fechado"}
                </span>

              </label>


              <input
                type="time"
                class="input business-hour-open"
                value="${data.open}"
                ${data.active ? "" : "disabled"}
              >


              <span
                class="business-hour-separator"
              >
                até
              </span>


              <input
                type="time"
                class="input business-hour-close"
                value="${data.close}"
                ${data.active ? "" : "disabled"}
              >

            </div>
          `;

        })
        .join("");

  }


  /* =======================================================
     AGENDAMENTO
  ======================================================= */

  function renderBookingSettings() {

    const interval =
      document.querySelector(
        "#bookingInterval"
      );

    const notice =
      document.querySelector(
        "#minimumNotice"
      );

    const maxDays =
      document.querySelector(
        "#maxDaysAhead"
      );


    if (interval) {

      interval.value =
        String(
          businessSettings
            ?.booking_interval ??
          30
        );

    }


    if (notice) {

      notice.value =
        String(
          businessSettings
            ?.minimum_notice ??
          60
        );

    }


    if (maxDays) {

      maxDays.value =
        String(
          businessSettings
            ?.max_days_ahead ??
          30
        );

    }

  }


  /* =======================================================
     SALVAR ESTABELECIMENTO
  ======================================================= */

  const shopForm =
    document.querySelector(
      "#shopForm"
    );


  shopForm?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!business?.id) return;


      const name =
        document
          .querySelector(
            "#shopName"
          )
          ?.value
          .trim();


      const phone =
        document
          .querySelector(
            "#shopPhone"
          )
          ?.value
          .trim();


      const whatsapp =
        document
          .querySelector(
            "#shopWhatsapp"
          )
          ?.value
          .trim();


      const email =
        document
          .querySelector(
            "#shopEmail"
          )
          ?.value
          .trim();


      const address =
        document
          .querySelector(
            "#shopAddress"
          )
          ?.value
          .trim();


      if (!name) {

        showToast(
          "Informe o nome do estabelecimento."
        );

        return;
      }


      const {
        data,
        error
      } =
        await supabaseClient
          .from("businesses")
          .update({

            name,
            phone,
            whatsapp,
            email,
            address,

            updated_at:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            business.id
          )
          .select()
          .single();


      if (error) {

        console.error(
          error
        );

        showToast(
          "Não foi possível salvar o estabelecimento."
        );

        return;
      }


      business =
        data;


      renderBusiness();


      if (
        typeof refreshCurrentUser ===
        "function"
      ) {

        await refreshCurrentUser();

      }


      showToast(
        "Dados do estabelecimento salvos."
      );

    }
  );


  /* =======================================================
     ATIVAR / DESATIVAR DIA
  ======================================================= */

  const businessHoursList =
    document.querySelector(
      "#businessHoursList"
    );


  businessHoursList
    ?.addEventListener(
      "change",
      event => {

        if (
          !event.target
            .classList
            .contains(
              "business-hour-active"
            )
        ) {
          return;
        }


        const row =
          event.target.closest(
            ".business-hour-row"
          );


        if (!row) return;


        const active =
          event.target.checked;


        const open =
          row.querySelector(
            ".business-hour-open"
          );


        const close =
          row.querySelector(
            ".business-hour-close"
          );


        const label =
          row.querySelector(
            ".business-hour-toggle span"
          );


        if (open) {
          open.disabled =
            !active;
        }


        if (close) {
          close.disabled =
            !active;
        }


        if (label) {

          label.textContent =
            active
              ? "Aberto"
              : "Fechado";

        }


        row.classList.toggle(
          "closed",
          !active
        );

      }
    );


  /* =======================================================
     SALVAR HORÁRIOS
  ======================================================= */

  const businessHoursForm =
    document.querySelector(
      "#businessHoursForm"
    );


  businessHoursForm
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        if (
          !businessSettings?.id
        ) {
          return;
        }


        const businessHours = {};


        document
          .querySelectorAll(
            ".business-hour-row"
          )
          .forEach(row => {

            const day =
              row.dataset.day;


            businessHours[day] = {

              active:
                row
                  .querySelector(
                    ".business-hour-active"
                  )
                  .checked,

              open:
                row
                  .querySelector(
                    ".business-hour-open"
                  )
                  .value,

              close:
                row
                  .querySelector(
                    ".business-hour-close"
                  )
                  .value

            };

          });


        const {
          data,
          error
        } =
          await supabaseClient
            .from(
              "business_settings"
            )
            .update({

              business_hours:
                businessHours,

              updated_at:
                new Date()
                  .toISOString()

            })
            .eq(
              "id",
              businessSettings.id
            )
            .select()
            .single();


        if (error) {

          console.error(
            error
          );

          showToast(
            "Não foi possível salvar os horários."
          );

          return;
        }


        businessSettings =
          data;


        showToast(
          "Horários atualizados."
        );

      }
    );


  /* =======================================================
     SALVAR PREFERÊNCIAS DE AGENDA
  ======================================================= */

  const bookingForm =
    document.querySelector(
      "#bookingSettingsForm"
    );


  bookingForm?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (
        !businessSettings?.id
      ) {
        return;
      }


      const bookingInterval =
        Number(
          document
            .querySelector(
              "#bookingInterval"
            )
            ?.value ||
          30
        );


      const minimumNotice =
        Number(
          document
            .querySelector(
              "#minimumNotice"
            )
            ?.value ||
          60
        );


      const maxDaysAhead =
        Number(
          document
            .querySelector(
              "#maxDaysAhead"
            )
            ?.value ||
          30
        );


      const {
        data,
        error
      } =
        await supabaseClient
          .from(
            "business_settings"
          )
          .update({

            booking_interval:
              bookingInterval,

            minimum_notice:
              minimumNotice,

            max_days_ahead:
              maxDaysAhead,

            updated_at:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            businessSettings.id
          )
          .select()
          .single();


      if (error) {

        console.error(
          error
        );

        showToast(
          "Não foi possível salvar as preferências."
        );

        return;
      }


      businessSettings =
        data;


      showToast(
        "Preferências de agendamento salvas."
      );

    }
  );


  /* =======================================================
   FOTO DO ESTABELECIMENTO
   SUPABASE STORAGE
======================================================= */

const photoInput =
  document.querySelector(
    "#shopPhoto"
  );

const removePhotoButton =
  document.querySelector(
    "#removeShopPhoto"
  );


const BUSINESS_IMAGE_BUCKET =
  "business-images";


/* =======================================================
   CAMINHO DA FOTO

   Cada usuário possui sua própria pasta.
======================================================= */

function getBusinessImagePath() {

  if (!authUser?.id) {
    return null;
  }


  return (
    `${authUser.id}/business-photo`
  );
}


/* =======================================================
   ATUALIZAR URL NO BANCO
======================================================= */

async function updateBusinessImageUrl(
  imageUrl
) {

  if (!business?.id) {
    throw new Error(
      "Estabelecimento não carregado."
    );
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("businesses")
      .update({

        image_url:
          imageUrl,

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


  if (error) {
    throw error;
  }


  business =
    data;


  /*
   * Atualiza também o cache usado
   * pelas outras páginas.
   */

  if (
    typeof refreshCurrentUser ===
    "function"
  ) {

    await refreshCurrentUser();

  }


  return data;
}


/* =======================================================
   UPLOAD
======================================================= */

photoInput
  ?.addEventListener(
    "change",
    async event => {

      const file =
        event.target
          .files?.[0];


      if (!file) {
        return;
      }


      /* ===============================================
         VALIDAR TIPO
      =============================================== */

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];


      if (
        !allowedTypes.includes(
          file.type
        )
      ) {

        showToast(
          "Use uma imagem JPG, PNG ou WEBP."
        );


        photoInput.value =
          "";

        return;
      }


      /* ===============================================
         VALIDAR TAMANHO
         máximo 5 MB
      =============================================== */

      const maxSize =
        5 * 1024 * 1024;


      if (
        file.size >
        maxSize
      ) {

        showToast(
          "A imagem deve ter no máximo 5 MB."
        );


        photoInput.value =
          "";

        return;
      }


      const path =
        getBusinessImagePath();


      if (!path) {

        showToast(
          "Não foi possível identificar sua conta."
        );

        return;
      }


      /*
       * Mostra preview imediatamente
       * enquanto o upload acontece.
       */

      const preview =
        document.querySelector(
          "#shopPhotoPreview"
        );

      const image =
        document.querySelector(
          "#shopPhotoImage"
        );


      const temporaryUrl =
        URL.createObjectURL(
          file
        );


      if (
        preview &&
        image
      ) {

        preview.classList.add(
          "has-image"
        );

        image.src =
          temporaryUrl;

      }


      photoInput.disabled =
        true;


      try {

        /* =============================================
           ENVIAR AO STORAGE
        ============================================= */

        const {
          error: uploadError
        } =
          await supabaseClient
            .storage
            .from(
              BUSINESS_IMAGE_BUCKET
            )
            .upload(
              path,
              file,
              {

                upsert:
                  true,

                contentType:
                  file.type,

                cacheControl:
                  "3600"

              }
            );


        if (uploadError) {
          throw uploadError;
        }


        /* =============================================
           PEGAR URL PÚBLICA
        ============================================= */

        const {
          data: publicData
        } =
          supabaseClient
            .storage
            .from(
              BUSINESS_IMAGE_BUCKET
            )
            .getPublicUrl(
              path
            );


        const publicUrl =
          publicData
            ?.publicUrl;


        if (!publicUrl) {

          throw new Error(
            "Não foi possível gerar a URL da imagem."
          );

        }


        /*
         * ?v evita que o navegador mostre
         * a foto antiga por causa de cache.
         */

        const finalUrl =
          `${publicUrl}?v=${Date.now()}`;


        /* =============================================
           SALVAR EM businesses.image_url
        ============================================= */

        await updateBusinessImageUrl(
          finalUrl
        );


        renderBusinessImage();


        showToast(
          "Foto do estabelecimento atualizada."
        );


      } catch (error) {

        console.error(
          "Erro ao enviar foto:",
          error
        );


        /*
         * Se falhar, volta para a imagem
         * que já estava salva.
         */

        renderBusinessImage();


        showToast(
          "Não foi possível atualizar a foto."
        );


      } finally {

        URL.revokeObjectURL(
          temporaryUrl
        );


        photoInput.disabled =
          false;


        photoInput.value =
          "";

      }

    }
  );


/* =======================================================
   REMOVER FOTO
======================================================= */

removePhotoButton
  ?.addEventListener(
    "click",
    async () => {

      if (!business?.image_url) {

        showToast(
          "Nenhuma foto cadastrada."
        );

        return;
      }


      const confirmed =
        window.confirm(
          "Deseja remover a foto do estabelecimento?"
        );


      if (!confirmed) {
        return;
      }


      const path =
        getBusinessImagePath();


      if (!path) {
        return;
      }


      removePhotoButton.disabled =
        true;


      try {

        /* =============================================
           REMOVER DO STORAGE
        ============================================= */

        const {
          error: storageError
        } =
          await supabaseClient
            .storage
            .from(
              BUSINESS_IMAGE_BUCKET
            )
            .remove([
              path
            ]);


        if (storageError) {
          throw storageError;
        }


        /* =============================================
           REMOVER URL DO BANCO
        ============================================= */

        await updateBusinessImageUrl(
          null
        );


        renderBusinessImage();


        if (photoInput) {

          photoInput.value =
            "";

        }


        showToast(
          "Foto removida."
        );


      } catch (error) {

        console.error(
          "Erro ao remover foto:",
          error
        );


        showToast(
          "Não foi possível remover a foto."
        );


      } finally {

        removePhotoButton.disabled =
          false;

      }

    }
  );


  /* =======================================================
     GERENCIAR PLANO
  ======================================================= */

 document
  .querySelector(
    "#managePlanSettings"
  )
  ?.addEventListener(
    "click",
    () => {

      window.location.href =
        "manage-plan.html";

    }
  );


  /* =======================================================
     INICIALIZAÇÃO
  ======================================================= */
  
  async function init() {

  const loaded =
    await loadAccount();

  if (!loaded) {
    return;
  }

  await loadSubscription();

  renderAccount();

  renderPlan();

  renderBusiness();

  renderBusinessHours();

  renderBookingSettings();

}

  init();

})();