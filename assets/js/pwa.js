(() => {

  "use strict";


  if (
    !(
      "serviceWorker"
      in navigator
    )
  ) {

    return;

  }


  window.addEventListener(
    "load",
    async () => {

      try {

        const registration =
          await navigator
            .serviceWorker
            .register(
              "/service-worker.js"
            );


        console.log(
          "PWA registrada:",
          registration.scope
        );

      }

      catch (error) {

        console.error(
          "Erro ao registrar PWA:",
          error
        );

      }

    }
  );

})();