(function () {

  "use strict";

  const supabase = window.katosSupabase;

  if (!supabase) {

    console.error("Supabase não foi inicializado.");

    return;

  }

  /* =========================================================

     ELEMENTOS

  ========================================================= */

  const container =

    document.getElementById("professionalsBody");

  const counter =

    document.getElementById("professionalCounter");

  const newButton =

    document.getElementById("newProfessionalButton");

  const modal =

    document.getElementById("professionalModal");

  const closeButton =

    document.getElementById("closeProfessionalModal");

  const form =

    document.getElementById("professionalForm");

  const editInput =

    document.getElementById("professionalEditId");

  const modalTitle =

    document.getElementById("professionalModalTitle");

  const nameInput =

    document.getElementById("professionalName");

  const phoneInput =

    document.getElementById("professionalPhone");

  const roleInput =

    document.getElementById("professionalRole");

  /* FOTO */

  const photoInput =

    document.getElementById("professionalPhoto");

  const photoPreview =

    document.getElementById("professionalPhotoPreview");

  const photoImage =

    document.getElementById("professionalPhotoImage");

  const photoInitials =

    document.getElementById("professionalPhotoInitials");

  const removePhotoButton =

    document.getElementById("removeProfessionalPhoto");

  if (!container || !form) {

    console.error(

      "Elementos da página de profissionais não encontrados."

    );

    return;

  }

  /* =========================================================

     ESTADO

  ========================================================= */

  let business = null;

  let professionals = [];

  let services = [];

  let selectedPhoto = null;

  let currentPhotoUrl = null;

  let removeCurrentPhoto = false;

  /* =========================================================

   LIMITES DOS PLANOS

========================================================= */

const PLAN_LIMITS = {

  starter: 1,

  business: 5,

  platinum: 8

};

function getPlanLimit() {

  const plan =

    String(

      business?.plan ||

      "starter"

    )

      .toLowerCase()

      .trim();

  return (

    PLAN_LIMITS[plan] ||

    1

  );

}

  /* =========================================================

     UTILIDADES

  ========================================================= */

  function escapeHTML(value) {

    return String(value ?? "")

      .replaceAll("&", "&amp;")

      .replaceAll("<", "&lt;")

      .replaceAll(">", "&gt;")

      .replaceAll('"', "&quot;")

      .replaceAll("'", "&#039;");

  }

  function getInitials(name) {

    const text =

      String(name || "P")

        .trim();

    if (!text) {

      return "P";

    }

    return text

      .split(/\s+/)

      .slice(0, 2)

      .map(part =>

        part.charAt(0).toUpperCase()

      )

      .join("");

  }

  function notify(message) {

    if (

      typeof window.toast ===

      "function"

    ) {

      window.toast(message);

      return;

    }

    alert(message);

  }

  /* =========================================================

     MODAL

  ========================================================= */

  function openProfessionalModal() {

    if (

      typeof window.openModal ===

      "function"

    ) {

      window.openModal(

        "#professionalModal"

      );

      return;

    }

    modal?.classList.add(

      "active",

      "show",

      "open",

      "visible"

    );

  }

 function closeProfessionalModal() {

  if (

    typeof window.closeModal ===

    "function"

  ) {

    window.closeModal(

      "#professionalModal"

    );

  }

  else {

    modal?.classList.remove(

      "active",

      "show",

      "open",

      "visible"

    );

  }

}

  /* =========================================================

     CONTA / EMPRESA

  ========================================================= */

  async function loadBusiness() {

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

      window.location.href =

        "login.html";

      return false;

    }

    const user =

      sessionData.session.user;

    const {

      data,

      error

    } =

      await supabase

        .from("businesses")

        .select(`

          id,

          name,

          plan

        `)

        .eq(

          "owner_id",

          user.id

        )

        .single();

    if (error) {

      console.error(

        "Erro ao carregar empresa:",

        error

      );

      notify(

        "Não foi possível carregar o estabelecimento."

      );

      return false;

    }

    business = data;

    return true;

  }

  /* =========================================================

     PROFISSIONAIS

  ========================================================= */

  async function loadProfessionals() {

    const {

      data,

      error

    } =

      await supabase

        .from("professionals")

        .select(`

          id,

          business_id,

          name,

          phone,

          photo_url,

          active,

          created_at

        `)

        .eq(

          "business_id",

          business.id

        )

        .order(

          "created_at",

          {

            ascending: true

          }

        );

    if (error) {

      console.error(

        "Erro ao carregar profissionais:",

        error

      );

      notify(

        "Não foi possível carregar os profissionais."

      );

      return;

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

      await supabase

        .from("services")

        .select(`

          id,

          professional_id

        `)

        .eq(

          "business_id",

          business.id

        );

    if (error) {

      console.error(

        "Erro ao carregar serviços:",

        error

      );

      services = [];

      return;

    }

    services =

      data || [];

  }

  function getProfessionalServiceCount(

    professionalId

  ) {

    return services.filter(

      service =>

        service.professional_id ===

        professionalId

    ).length;

  }

  /* =========================================================

     CONTADOR

  ========================================================= */

   function updateCounter() {

  const limit =

    getPlanLimit();

  const total =

    professionals.length;

  if (counter) {

    counter.textContent =

      total === 1

        ? "1 profissional cadastrado"

        : `${total} profissionais cadastrados`;

  }

  if (newButton) {

    const limitReached =

      total >= limit;

    newButton.disabled =

      limitReached;

    newButton.textContent =

      "Novo profissional";

    newButton.classList.toggle(

      "limit-reached",

      limitReached

    );

    newButton.title =

      limitReached

        ? "Você atingiu o limite de profissionais do seu plano."

        : "";

  }

}

  /* =========================================================

     RENDER DOS CARDS

  ========================================================= */

  function renderProfessionals() {

    container.innerHTML = "";

    if (!professionals.length) {

      container.innerHTML = `

        <div class="professionals-empty">

          <strong>

            Nenhum profissional cadastrado

          </strong>

          <span>

            Cadastre o primeiro profissional da equipe.

          </span>

        </div>

      `;

      updateCounter();

      return;

    }

    professionals.forEach(

      professional => {

        const card =

          document.createElement(

            "article"

          );

        card.className =

          "professional-card";

        if (

          professional.active === false

        ) {

          card.classList.add(

            "inactive"

          );

        }

        const photoHTML =

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

                getInitials(

                  professional.name

                )

              );

        const serviceCount =

          getProfessionalServiceCount(

            professional.id

          );

        card.innerHTML = `

          <div class="professional-card-top">

            <div class="professional-card-user">

              <div class="professional-card-avatar">

                ${photoHTML}

              </div>

              <div class="professional-card-info">

                <strong>

                  ${escapeHTML(

                    professional.name

                  )}

                </strong>

                <span>

                  ${escapeHTML(

                    "Profissional"

                  )}

                </span>

              </div>

            </div>

            <span

              class="

                professional-status

                ${

                  professional.active === false

                    ? "inactive"

                    : "active"

                }

              "

            >

              ${

                professional.active === false

                  ? "Inativo"

                  : "Ativo"

              }

            </span>

          </div>

          <div class="professional-card-meta">

            <div>

              <span>

                Telefone

              </span>

              <strong>

                ${escapeHTML(

                  professional.phone ||

                  "Não informado"

                )}

              </strong>

            </div>

            <div>

              <span>

                Serviços

              </span>

              <strong>

                ${serviceCount}

              </strong>

            </div>

          </div>

         <div class="professional-actions">

  <button

    type="button"

    class="professional-action-btn edit-professional"

    data-id="${professional.id}"

  >

    Editar

  </button>

  <button

    type="button"

    class="professional-action-btn danger delete-professional"

    data-id="${professional.id}"

  >

    Excluir

  </button>

</div>

        `;

        container.appendChild(

          card

        );

      }

    );

    updateCounter();

  }

  /* =========================================================

     FOTO — RESET

  ========================================================= */

  function resetPhoto() {

    selectedPhoto = null;

    currentPhotoUrl = null;

    removeCurrentPhoto = false;

    if (photoInput) {

      photoInput.value = "";

    }

    if (photoImage) {

      photoImage.src = "";

    }

    photoPreview

      ?.classList

      .remove(

        "has-image"

      );

    if (photoInitials) {

      photoInitials.textContent =

        getInitials(

          nameInput?.value

        );

    }

  }

  /* =========================================================

     FOTO EXISTENTE

  ========================================================= */

  function showPhoto(

    photoUrl,

    professionalName

  ) {

    selectedPhoto = null;

    currentPhotoUrl =

      photoUrl || null;

    removeCurrentPhoto =

      false;

    if (photoInput) {

      photoInput.value = "";

    }

    if (

      photoUrl &&

      photoImage

    ) {

      photoImage.src =

        photoUrl;

      photoPreview

        ?.classList

        .add(

          "has-image"

        );

    }

    else {

      if (photoImage) {

        photoImage.src = "";

      }

      photoPreview

        ?.classList

        .remove(

          "has-image"

        );

      if (photoInitials) {

        photoInitials.textContent =

          getInitials(

            professionalName

          );

      }

    }

  }

  /* =========================================================

     ESCOLHER FOTO

  ========================================================= */

  photoInput

    ?.addEventListener(

      "change",

      event => {

        const file =

          event.target

            .files?.[0];

        if (!file) {

          return;

        }

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

          notify(

            "Escolha uma imagem JPG, PNG ou WEBP."

          );

          photoInput.value = "";

          return;

        }

        if (

          file.size >

          2 * 1024 * 1024

        ) {

          notify(

            "A imagem deve ter no máximo 2 MB."

          );

          photoInput.value = "";

          return;

        }

        selectedPhoto =

          file;

        removeCurrentPhoto =

          false;

        const reader =

          new FileReader();

        reader.onload =

          event => {

            if (

              !photoImage

            ) {

              return;

            }

            photoImage.src =

              event.target.result;

            photoPreview

              ?.classList

              .add(

                "has-image"

              );

          };

        reader.readAsDataURL(

          file

        );

      }

    );

  /* =========================================================

     REMOVER FOTO

  ========================================================= */

  removePhotoButton

    ?.addEventListener(

      "click",

      () => {

        selectedPhoto =

          null;

        removeCurrentPhoto =

          true;

        if (photoInput) {

          photoInput.value =

            "";

        }

        if (photoImage) {

          photoImage.src =

            "";

        }

        photoPreview

          ?.classList

          .remove(

            "has-image"

          );

        if (photoInitials) {

          photoInitials.textContent =

            getInitials(

              nameInput?.value

            );

        }

      }

    );

  /* =========================================================

     UPLOAD DA FOTO

  ========================================================= */

  async function uploadPhoto(

    professionalId

  ) {

    if (

      !selectedPhoto

    ) {

      return currentPhotoUrl;

    }

    const extensions = {

      "image/jpeg": "jpg",

      "image/png": "png",

      "image/webp": "webp"

    };

    const extension =

      extensions[

        selectedPhoto.type

      ];

    const path =

      `${business.id}/professionals/${professionalId}-${Date.now()}.${extension}`;

    const {

      error: uploadError

    } =

      await supabase

        .storage

        .from(

          "business-media"

        )

        .upload(

          path,

          selectedPhoto,

          {

            cacheControl:

              "3600",

            upsert:

              false,

            contentType:

              selectedPhoto.type

          }

        );

    if (uploadError) {

      throw uploadError;

    }

    const {

      data

    } =

      supabase

        .storage

        .from(

          "business-media"

        )

        .getPublicUrl(

          path

        );

    return (

      data?.publicUrl ||

      null

    );

  }

  /* =========================================================

     NOVO PROFISSIONAL

  ========================================================= */

  function prepareNewProfessional() {

  const limit =

    getPlanLimit();

  if (

    professionals.length >=

    limit

  ) {

    notify(

      `Seu plano ${

        String(

          business?.plan ||

          "starter"

        )

      } permite até ${limit} ${

        limit === 1

          ? "profissional"

          : "profissionais"

      }.`

    );

    return;

  }

  form.reset();

  if (editInput) {

    editInput.value =

      "";

  }

  if (modalTitle) {

    modalTitle.textContent =

      "Novo profissional";

  }

  resetPhoto();

  openProfessionalModal();

  setTimeout(

    () =>

      nameInput?.focus(),

    100

  );

}

  /* =========================================================

     EDITAR

  ========================================================= */

  function editProfessional(

    id

    ) {

       const professional =

         professionals.find(

        item =>

          item.id === id

      );

       if (!professional) {

         return;

       }

       if (editInput) {

         editInput.value =

           professional.id;

      }

       if (nameInput) {

         nameInput.value =

           professional.name ||

           "";

      }

    if (phoneInput) {

      phoneInput.value =

        professional.phone ||

        "";

    }

    if (modalTitle) {

      modalTitle.textContent =

        "Editar profissional";

    }

    showPhoto(

      professional.photo_url,

      professional.name

    );

    openProfessionalModal();

  }

  async function deleteProfessional(id) {

    const professional =
      professionals.find(
        item => item.id === id
      );

    if (!professional) {
      notify("Profissional não encontrado.");
      return;
    }

    const confirmed =
      window.confirm(
        `Deseja realmente excluir "${professional.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {

      const {
        data,
        error
      } =
        await supabase
          .from("professionals")
          .delete()
          .eq("id", id)
          .eq("business_id", business.id)
          .select("id, name");

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(
          "DELETE_NOT_ALLOWED_OR_NOT_FOUND"
        );
      }

      await Promise.all([
        loadProfessionals(),
        loadServices()
      ]);

      renderProfessionals();

      notify(
        `Profissional "${professional.name}" excluído.`
      );

    } catch (error) {

      console.error(
        "Erro ao excluir profissional:",
        error
      );

      const message =
        String(
          error?.message ||
          error?.details ||
          ""
        ).toLowerCase();

      if (
        message.includes("foreign key") ||
        message.includes("violates foreign key") ||
        message.includes("appointments")
      ) {
        notify(
          "Este profissional possui agendamentos vinculados e não pode ser excluído sem preservar o histórico."
        );
        return;
      }

      if (
        message.includes("delete_not_allowed") ||
        message.includes("row-level security") ||
        message.includes("permission denied")
      ) {
        notify(
          "O Supabase bloqueou a exclusão. Execute o arquivo supabase_professionals_security.sql incluído no ZIP."
        );
        return;
      }

      notify(
        error?.message ||
        "Não foi possível excluir o profissional."
      );

    }

  }

  /* =========================================================

     SALVAR

  ========================================================= */

  form.addEventListener(

    "submit",

    async event => {

      event.preventDefault();

      const id =

        editInput?.value ||

        null;

      const name =

        String(

          nameInput?.value ||

          ""

        )

          .trim();

      const phone =

        String(

          phoneInput?.value ||

          ""

        )

          .trim();

      if (!name) {

        notify(

          "Informe o nome do profissional."

        );

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

      try {

        let professionalId =

          id;

        /* ATUALIZAR */

        if (professionalId) {

          const {

            error

          } =

            await supabase

              .from(

                "professionals"

              )

              .update({

                name,

                phone:

                  phone || null,

              })

              .eq(

                "id",

                professionalId

              )

              .eq(

                "business_id",

                business.id

              );

          if (error) {

            throw error;

          }

        }

        /* CRIAR */

        else {

        const limit =

  getPlanLimit();

const {

  count,

  error: countError

} =

  await supabase

    .from("professionals")

    .select(

      "id",

      {

        count: "exact",

        head: true

      }

    )

    .eq(

      "business_id",

      business.id

    );

if (countError) {

  throw countError;

}

if (

  Number(count || 0) >=

  limit

) {

  notify(

    `Você atingiu o limite de ${limit} ${

      limit === 1

        ? "profissional"

        : "profissionais"

    } do seu plano.`

  );

  return;

}

          const {

            data,

            error

          } =

            await supabase

              .from(

                "professionals"

              )

              .insert({

                business_id:

                  business.id,

                name,

                phone:

                  phone || null,

                active:

                  true

              })

              .select("id")

              .single();

          if (error) {

            throw error;

          }

          professionalId =

            data.id;

        }

        /* FOTO NOVA */

        if (selectedPhoto) {

          const newPhotoUrl =

            await uploadPhoto(

              professionalId

            );

          const {

            error

          } =

            await supabase

              .from(

                "professionals"

              )

              .update({

                photo_url:

                  newPhotoUrl

              })

              .eq(

                "id",

                professionalId

              )

              .eq(

                "business_id",

                business.id

              );

          if (error) {

            throw error;

          }

        }

        /* REMOVER FOTO */

        else if (

          removeCurrentPhoto

        ) {

          const {

            error

          } =

            await supabase

              .from(

                "professionals"

              )

              .update({

                photo_url:

                  null

              })

              .eq(

                "id",

                professionalId

              )

              .eq(

                "business_id",

                business.id

              );

          if (error) {

            throw error;

          }

        }

        await Promise.all([

          loadProfessionals(),

          loadServices()

        ]);

        renderProfessionals();

        closeProfessionalModal();

        notify(

          id

            ? "Profissional atualizado."

            : "Profissional cadastrado."

        );

      }

      catch (error) {

        console.error(

          "Erro ao salvar profissional:",

          error

        );

        const message =
          String(
            error?.message ||
            error?.details ||
            ""
          );

        if (
          message.includes(
            "PROFESSIONAL_LIMIT_REACHED"
          )
        ) {
          notify(
            "Você atingiu o limite de profissionais do seu plano."
          );
        }
        else {
          notify(
            error?.message ||
            "Não foi possível salvar o profissional."
          );
        }

      }

      finally {

        if (submitButton) {

          submitButton.disabled =

            false;

          submitButton.textContent =

            oldText ||

            "Salvar profissional";

        }

      }

    }

  );

  /* =========================================================

     EVENTOS

  ========================================================= */

  newButton?.addEventListener(
    "click",
    prepareNewProfessional
  );

  closeButton?.addEventListener(
    "click",
    event => {
      event.preventDefault();
      closeProfessionalModal();
    }
  );

  modal?.addEventListener(
    "click",
    event => {
      if (event.target === modal) {
        closeProfessionalModal();
      }
    }
  );

  container.addEventListener(
    "click",
    event => {

      const editButton =
        event.target.closest(
          ".edit-professional"
        );

      const deleteButton =
        event.target.closest(
          ".delete-professional"
        );

      if (editButton) {
        editProfessional(
          editButton.dataset.id
        );
        return;
      }

      if (deleteButton) {
        deleteProfessional(
          deleteButton.dataset.id
        );
      }

    }
  );

  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        closeProfessionalModal();
      }
    }
  );

  /* =========================================================

     INICIALIZAÇÃO

  ========================================================= */

  async function init() {

    try {

      const loaded =

        await loadBusiness();

      if (!loaded) {

        return;

      }

      await Promise.all([

        loadProfessionals(),

        loadServices()

      ]);

      renderProfessionals();

    }

    catch (error) {

      console.error(

        "Erro ao iniciar Profissionais:",

        error

      );

      notify(

        "Não foi possível carregar os profissionais."

      );

    }

  }

  init();

})();