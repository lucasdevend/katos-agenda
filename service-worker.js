const CACHE_NAME =
  "katos-agenda-v1";

const STATIC_FILES = [
  "/",
  "/pages/dashboard.html",
  "/pages/appointments.html",
  "/pages/clients.html",
  "/pages/professionals.html",
  "/pages/services.html",
  "/pages/settings.html",
  "/pages/tickets.html",
  "/pages/login.html",

  "/assets/css/global.css",
  "/assets/css/dashboard.css",

  "/assets/js/theme.js",
  "/assets/js/supabase.js",
  "/assets/js/app.js"
];


/* =========================================================
   INSTALAÇÃO
========================================================= */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(
          CACHE_NAME
        )
        .then(
          cache =>
            cache.addAll(
              STATIC_FILES
            )
        )

    );

    self.skipWaiting();

  }
);


/* =========================================================
   ATIVAÇÃO
========================================================= */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(
          keys =>
            Promise.all(

              keys.map(
                key => {

                  if (
                    key !==
                    CACHE_NAME
                  ) {

                    return caches.delete(
                      key
                    );

                  }

                }
              )

            )
        )

    );

    self.clients.claim();

  }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    if (
      request.method !==
      "GET"
    ) {

      return;

    }


    event.respondWith(

      fetch(
        request
      )
        .then(
          response => {

            const clone =
              response.clone();


            caches
              .open(
                CACHE_NAME
              )
              .then(
                cache =>
                  cache.put(
                    request,
                    clone
                  )
              );


            return response;

          }
        )

        .catch(
          () =>
            caches.match(
              request
            )
        )

    );

  }
);