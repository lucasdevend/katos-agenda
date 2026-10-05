(() => {

  "use strict";


  /* =========================================================
     SUPABASE
  ========================================================= */

  const supabase =
    window.supabaseClient ||
    window.katosSupabase;


  if (!supabase) {

    console.error(
      "Supabase não foi inicializado."
    );

    return;

  }


  /* =========================================================
     ELEMENTOS
  ========================================================= */

  const loading =
    document.getElementById(
      "bookingLoading"
    );

  const errorBox =
    document.getElementById(
      "bookingError"
    );

  const errorText =
    document.getElementById(
      "bookingErrorText"
    );

  const content =
    document.getElementById(
      "bookingContent"
    );


  const businessLogo =
    document.getElementById(
      "businessLogo"
    );

  const businessName =
    document.getElementById(
      "businessName"
    );

  const businessAddress =
    document.getElementById(
      "businessAddress"
    );

  const businessPhone =
    document.getElementById(
      "businessPhone"
    );


  const serviceGrid =
    document.getElementById(
      "serviceGrid"
    );

  const professionalGrid =
    document.getElementById(
      "professionalGrid"
    );

  const dateInput =
    document.getElementById(
      "bookingDate"
    );

  const timeGrid =
    document.getElementById(
      "timeGrid"
    );


  const customerName =
    document.getElementById(
      "customerName"
    );

  const customerPhone =
    document.getElementById(
      "customerPhone"
    );


  const form =
    document.getElementById(
      "bookingForm"
    );

  const confirmButton =
    document.getElementById(
      "confirmBookingButton"
    );

  const message =
    document.getElementById(
      "bookingMessage"
    );


  const summaryService =
    document.getElementById(
      "summaryService"
    );

  const summaryProfessional =
    document.getElementById(
      "summaryProfessional"
    );

  const summaryDate =
    document.getElementById(
      "summaryDate"
    );

  const summaryTime =
    document.getElementById(
      "summaryTime"
    );


  const successBox =
    document.getElementById(
      "bookingSuccess"
    );

  const successService =
    document.getElementById(
      "successService"
    );

  const successProfessional =
    document.getElementById(
      "successProfessional"
    );

  const successDate =
    document.getElementById(
      "successDate"
    );

  const successTime =
    document.getElementById(
      "successTime"
    );

  const newBookingButton =
    document.getElementById(
      "newBookingButton"
    );


  /* =========================================================
     ESTADO
  ========================================================= */

  let business = null;

  let professionals = [];

  let services = [];

  let settings = {};


  let selectedServiceId = null;

  let selectedProfessionalId = null;

  let selectedTime = null;


  /* =========================================================
     SLUG
  ========================================================= */

  function getBusinessSlug() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    const querySlug =
      params.get("slug");


    if (querySlug) {

      return querySlug
        .trim()
        .toLowerCase();

    }


    const parts =
      window.location.pathname
        .split("/")
        .filter(Boolean);


    const last =
      parts[
        parts.length - 1
      ] || "";


    if (
      last &&
      !last.includes(".html") &&
      last !== "agendamento"
    ) {

      return decodeURIComponent(
        last
      );

    }


    return "";

  }


  const businessSlug =
    getBusinessSlug();


  /* =========================================================
     UTILIDADES
  ========================================================= */

  function escapeHTML(
    value = ""
  ) {

    const div =
      document.createElement(
        "div"
      );


    div.textContent =
      String(
        value
      );


    return div.innerHTML;

  }


  function initials(
    name
  ) {

    return String(
      name || "P"
    )
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        part =>
          part.charAt(0)
            .toUpperCase()
      )
      .join("");

  }


  function formatMoney(
    value
  ) {

    return new Intl
      .NumberFormat(
        "pt-BR",
        {
          style:
            "currency",

          currency:
            "BRL"
        }
      )
      .format(
        Number(
          value || 0
        )
      );

  }


  function formatDate(
    value
  ) {

    if (!value) {
      return "—";
    }


    const [
      year,
      month,
      day
    ] =
      value.split("-");


    return `${day}/${month}/${year}`;

  }


  function onlyNumbers(
    value
  ) {

    return String(
      value || ""
    )
      .replace(
        /\D/g,
        ""
      );

  }


  function showError(
    text
  ) {

    if (!message) {
      return;
    }


    message.textContent =
      text;


    message.classList.add(
      "error"
    );

  }


  function clearError() {

    if (!message) {
      return;
    }


    message.textContent =
      "";


    message.classList.remove(
      "error"
    );

  }


  function selectedService() {

    return services.find(
      service =>
        service.id ===
        selectedServiceId
    );

  }


  function selectedProfessional() {

    return professionals.find(
      professional =>
        professional.id ===
        selectedProfessionalId
    );

  }


  /* =========================================================
     MÁSCARA WHATSAPP
  ========================================================= */

  customerPhone
    ?.addEventListener(
      "input",
      () => {

        let digits =
          onlyNumbers(
            customerPhone.value
          )
            .slice(
              0,
              11
            );


        if (
          digits.length > 10
        ) {

          digits =
            digits.replace(
              /^(\d{2})(\d{5})(\d{0,4}).*/,
              "($1) $2-$3"
            );

        }

        else if (
          digits.length > 6
        ) {

          digits =
            digits.replace(
              /^(\d{2})(\d{4})(\d{0,4}).*/,
              "($1) $2-$3"
            );

        }

        else if (
          digits.length > 2
        ) {

          digits =
            digits.replace(
              /^(\d{2})(\d+)/,
              "($1) $2"
            );

        }


        customerPhone.value =
          digits;


        updateConfirmButton();

      }
    );


  customerName
    ?.addEventListener(
      "input",
      updateConfirmButton
    );


  /* =========================================================
     DADOS PÚBLICOS
  ========================================================= */

  async function loadPublicData() {

    if (!businessSlug) {

      throw new Error(
        "SLUG_NOT_FOUND"
      );

    }


    const {
      data,
      error
    } =
      await supabase.rpc(
        "get_public_booking_data",
        {
          p_business_slug:
            businessSlug
        }
      );


    if (error) {
      throw error;
    }


    business =
      data?.business ||
      null;


    professionals =
      Array.isArray(
        data?.professionals
      )
        ? data.professionals
        : [];


    services =
      Array.isArray(
        data?.services
      )
        ? data.services
        : [];


    settings =
      data?.settings ||
      {};


    if (!business) {

      throw new Error(
        "BUSINESS_NOT_FOUND"
      );

    }

  }


  /* =========================================================
     EMPRESA
  ========================================================= */

  function renderBusiness() {

    document.title =
      `${business.name} | Agendamento`;


    if (businessName) {

      businessName.textContent =
        business.name ||
        "Agendamento";

    }


    if (businessLogo) {

      if (
        business.image_url
      ) {

        businessLogo.innerHTML = `

          <img
            src="${escapeHTML(
              business.image_url
            )}"
            alt="${escapeHTML(
              business.name
            )}"
          >

        `;

      }

      else {

        businessLogo.textContent =
          initials(
            business.name
          );

      }

    }


    if (
      business.address &&
      businessAddress
    ) {

      businessAddress.textContent =
        business.address;


      businessAddress.hidden =
        false;

    }


    const phone =
      business.whatsapp ||
      business.phone;


    if (
      phone &&
      businessPhone
    ) {

      businessPhone.textContent =
        phone;


      businessPhone.hidden =
        false;

    }

  }


  /* =========================================================
     SERVIÇOS
  ========================================================= */

  function renderServices() {

    if (!serviceGrid) {
      return;
    }


    serviceGrid.innerHTML =
      "";


    if (
      !services.length
    ) {

      serviceGrid.innerHTML = `

        <div class="empty-selection">

          Nenhum serviço disponível no momento.

        </div>
      `;

      return;

    }


    services.forEach(
      service => {

        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";


        button.className =
          "service-card";


        button.dataset.id =
          service.id;


        button.innerHTML = `

          <strong>

            ${escapeHTML(
              service.name
            )}

          </strong>


          <div class="service-details">

            <span>

              ${Number(
                service.duration_minutes ||
                0
              )} min

            </span>


            <span class="service-price">

              ${formatMoney(
                service.price
              )}

            </span>

          </div>
        `;


        button.addEventListener(
          "click",
          async () => {

            selectedServiceId =
              service.id;


            selectedProfessionalId =
              null;


            selectedTime =
              null;


            serviceGrid
              .querySelectorAll(
                ".service-card"
              )
              .forEach(
                item => {

                  item.classList.remove(
                    "selected"
                  );

                }
              );


            button.classList.add(
              "selected"
            );


            renderProfessionals();


            resetTimes(
              "Escolha um profissional e uma data."
            );


            updateSummary();

            updateConfirmButton();

          }
        );


        serviceGrid.appendChild(
          button
        );

      }
    );

  }


  /* =========================================================
     PROFISSIONAIS
  ========================================================= */

  function renderProfessionals() {

    if (!professionalGrid) {
      return;
    }


    professionalGrid.innerHTML =
      "";


    if (
      !selectedServiceId
    ) {

      professionalGrid.innerHTML = `

        <div class="empty-selection">

          Escolha um serviço primeiro.

        </div>
      `;

      return;

    }


    const service =
      services.find(
        item =>
          item.id ===
          selectedServiceId
      );


    if (!service) {

      professionalGrid.innerHTML = `

        <div class="empty-selection">

          Serviço não encontrado.

        </div>
      `;

      return;

    }


    const available =
      professionals.filter(
        professional =>
          professional.id ===
          service.professional_id
      );


    if (
      !available.length
    ) {

      professionalGrid.innerHTML = `

        <div class="empty-selection">

          Nenhum profissional disponível para este serviço.

        </div>
      `;

      return;

    }


    available.forEach(
      professional => {

        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";


        button.className =
          "professional-option";


        const photo =
          professional.photo_url
            ? `

              <img
                src="${escapeHTML(
                  professional.photo_url
                )}"
                alt="${escapeHTML(
                  professional.name
                )}"
              >

            `
            : escapeHTML(
                initials(
                  professional.name
                )
              );


        button.innerHTML = `

          <div class="professional-photo">

            ${photo}

          </div>


          <strong>

            ${escapeHTML(
              professional.name
            )}

          </strong>

        `;


        button.addEventListener(
          "click",
          async () => {

            selectedProfessionalId =
              professional.id;


            selectedTime =
              null;


            professionalGrid
              .querySelectorAll(
                ".professional-option"
              )
              .forEach(
                item => {

                  item.classList.remove(
                    "selected"
                  );

                }
              );


            button.classList.add(
              "selected"
            );


            updateSummary();

            updateConfirmButton();


            if (
              dateInput?.value
            ) {

              await loadAvailableTimes();

            }

            else {

              resetTimes(
                "Escolha uma data para ver os horários."
              );

            }

          }
        );


        professionalGrid.appendChild(
          button
        );

      }
    );

  }


  /* =========================================================
     DATA
  ========================================================= */

  function formatDateInput(
    date
  ) {

    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() + 1
      )
        .padStart(
          2,
          "0"
        );


    const day =
      String(
        date.getDate()
      )
        .padStart(
          2,
          "0"
        );


    return `${year}-${month}-${day}`;

  }


  function setupDateInput() {

    if (!dateInput) {
      return;
    }


    const today =
      new Date();


    dateInput.min =
      formatDateInput(
        today
      );


    const maxDays =
      Number(
        settings.max_days_ahead ??
        30
      );


    const maxDate =
      new Date(
        today
      );


    maxDate.setDate(
      maxDate.getDate() +
      maxDays
    );


    dateInput.max =
      formatDateInput(
        maxDate
      );

  }


  dateInput
    ?.addEventListener(
      "change",
      async () => {

        selectedTime =
          null;


        updateSummary();

        updateConfirmButton();


        await loadAvailableTimes();

      }
    );


  /* =========================================================
     HORÁRIOS
  ========================================================= */

  function resetTimes(
    text
  ) {

    selectedTime =
      null;


    if (timeGrid) {

      timeGrid.innerHTML = `

        <div class="empty-selection">

          ${escapeHTML(
            text
          )}

        </div>
      `;

    }


    updateSummary();

    updateConfirmButton();

  }


  async function loadAvailableTimes() {

    clearError();


    if (
      !selectedServiceId
    ) {

      resetTimes(
        "Escolha um serviço primeiro."
      );

      return;

    }


    if (
      !selectedProfessionalId
    ) {

      resetTimes(
        "Escolha um profissional primeiro."
      );

      return;

    }


    if (
      !dateInput?.value
    ) {

      resetTimes(
        "Escolha uma data."
      );

      return;

    }


    if (timeGrid) {

      timeGrid.innerHTML = `

        <div class="empty-selection">

          Consultando horários...

        </div>
      `;

    }


    try {


      const {
        data,
        error
      } =
        await supabase.rpc(
          "get_public_available_slots",
          {

            p_business_slug:
              businessSlug,

            p_professional_id:
              selectedProfessionalId,

            p_service_id:
              selectedServiceId,

            p_date:
              dateInput.value

          }
        );


      if (error) {
        throw error;
      }


      const slots =
        Array.isArray(
          data
        )
          ? data
          : [];


      if (
        !slots.length
      ) {

        resetTimes(
          "Não há horários disponíveis nesta data."
        );

        return;

      }


      if (!timeGrid) {
        return;
      }


      timeGrid.innerHTML =
        "";


      slots.forEach(
        time => {

          const button =
            document.createElement(
              "button"
            );


          button.type =
            "button";


          button.className =
            "time-button";


          button.textContent =
            time;


          button.addEventListener(
            "click",
            () => {

              selectedTime =
                time;


              timeGrid
                .querySelectorAll(
                  ".time-button"
                )
                .forEach(
                  item => {

                    item.classList.remove(
                      "selected"
                    );

                  }
                );


              button.classList.add(
                "selected"
              );


              updateSummary();

              updateConfirmButton();

            }
          );


          timeGrid.appendChild(
            button
          );

        }
      );


    }

    catch (error) {


      console.error(
        "Erro ao consultar horários:",
        error
      );


      resetTimes(
        "Não foi possível consultar os horários."
      );

    }

  }


  /* =========================================================
     RESUMO
  ========================================================= */

  function updateSummary() {

    const service =
      selectedService();


    const professional =
      selectedProfessional();


    if (summaryService) {

      summaryService.textContent =
        service?.name ||
        "—";

    }


    if (summaryProfessional) {

      summaryProfessional.textContent =
        professional?.name ||
        "—";

    }


    if (summaryDate) {

      summaryDate.textContent =
        formatDate(
          dateInput?.value
        );

    }


    if (summaryTime) {

      summaryTime.textContent =
        selectedTime ||
        "—";

    }

  }


  /* =========================================================
     BOTÃO CONFIRMAR
  ========================================================= */

  function updateConfirmButton() {

    if (!confirmButton) {
      return;
    }


    const name =
      customerName?.value
        .trim() ||
      "";


    const phone =
      onlyNumbers(
        customerPhone?.value
      );


    confirmButton.disabled =
      !(
        selectedServiceId &&
        selectedProfessionalId &&
        dateInput?.value &&
        selectedTime &&
        name.length >= 2 &&
        phone.length >= 10
      );

  }


  /* =========================================================
     CRIAR AGENDAMENTO
  ========================================================= */

  form
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        clearError();


        if (
          confirmButton.disabled
        ) {

          return;

        }


        const service =
          selectedService();


        const professional =
          selectedProfessional();


        const name =
          customerName.value
            .trim();


        const phone =
          onlyNumbers(
            customerPhone.value
          );


        confirmButton.disabled =
          true;


        const originalText =
          confirmButton.textContent;


        confirmButton.textContent =
          "Confirmando...";


        try {


          const {
            data,
            error
          } =
            await supabase.rpc(
              "create_public_booking",
              {

                p_business_slug:
                  businessSlug,

                p_client_name:
                  name,

                p_client_phone:
                  phone,

                p_professional_id:
                  selectedProfessionalId,

                p_service_id:
                  selectedServiceId,

                p_date:
                  dateInput.value,

                p_time:
                  selectedTime,

                p_notes:
                  null

              }
            );


          if (error) {
            throw error;
          }


          if (
            !data?.success
          ) {

            throw new Error(
              "BOOKING_NOT_CREATED"
            );

          }


          if (
            successService
          ) {

            successService.textContent =
              service?.name ||
              "—";

          }


          if (
            successProfessional
          ) {

            successProfessional.textContent =
              professional?.name ||
              "—";

          }


          if (
            successDate
          ) {

            successDate.textContent =
              formatDate(
                dateInput.value
              );

          }


          if (
            successTime
          ) {

            successTime.textContent =
              selectedTime ||
              "—";

          }


          form.hidden =
            true;


          if (
            successBox
          ) {

            successBox.hidden =
              false;

          }


          window.scrollTo({
            top: 0,
            behavior:
              "smooth"
          });


        }

        catch (error) {


          console.error(
            "Erro ao criar agendamento:",
            error
          );


          const errorString =
            `${
              error?.message ||
              ""
            } ${
              error?.details ||
              ""
            }`;


          if (
            errorString.includes(
              "TIME_ALREADY_BOOKED"
            )
          ) {

            showError(
              "Esse horário acabou de ser reservado. Escolha outro horário."
            );


            await loadAvailableTimes();

          }

          else if (
            errorString.includes(
              "MINIMUM_NOTICE"
            )
          ) {

            showError(
              "Esse horário não respeita a antecedência mínima configurada."
            );


            await loadAvailableTimes();

          }

          else if (
            errorString.includes(
              "BUSINESS_CLOSED"
            )
          ) {

            showError(
              "O estabelecimento está fechado nesta data."
            );

          }

          else if (
            errorString.includes(
              "OUTSIDE_BUSINESS_HOURS"
            )
          ) {

            showError(
              "Esse horário está fora do funcionamento do estabelecimento."
            );

          }

          else {

            showError(
              "Não foi possível concluir o agendamento. Tente novamente."
            );

          }


        }

        finally {


          confirmButton.textContent =
            originalText;


          updateConfirmButton();

        }

      }
    );


  /* =========================================================
     NOVO AGENDAMENTO
  ========================================================= */

  newBookingButton
    ?.addEventListener(
      "click",
      () => {

        selectedServiceId =
          null;


        selectedProfessionalId =
          null;


        selectedTime =
          null;


        form.reset();


        if (
          successBox
        ) {

          successBox.hidden =
            true;

        }


        form.hidden =
          false;


        renderServices();

        renderProfessionals();


        resetTimes(
          "Escolha serviço, profissional e data."
        );


        updateSummary();

        updateConfirmButton();


        window.scrollTo({
          top: 0,
          behavior:
            "smooth"
        });

      }
    );


  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  async function init() {

    try {


      await loadPublicData();


      renderBusiness();

      renderServices();

      renderProfessionals();

      setupDateInput();

      updateSummary();

      updateConfirmButton();


      if (
        loading
      ) {

        loading.hidden =
          true;

      }


      if (
        content
      ) {

        content.hidden =
          false;

      }


    }

    catch (error) {


      console.error(
        "Erro ao iniciar página pública:",
        error
      );


      if (
        loading
      ) {

        loading.hidden =
          true;

      }


      if (
        errorBox
      ) {

        errorBox.hidden =
          false;

      }


      const errorString =
        `${
          error?.message ||
          ""
        }`;


      if (
        !businessSlug
      ) {

        if (
          errorText
        ) {

          errorText.textContent =
            "O link desta agenda está incompleto.";

        }

      }

      else if (
        errorString.includes(
          "BUSINESS_NOT_FOUND"
        )
      ) {

        if (
          errorText
        ) {

          errorText.textContent =
            "Este estabelecimento não foi encontrado.";

        }

      }

      else {

        if (
          errorText
        ) {

          errorText.textContent =
            "Não foi possível carregar esta agenda.";

        }

      }

    }

  }


  init();

})();