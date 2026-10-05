(() => {

  "use strict";


  /* =========================================================
     SUPABASE
  ========================================================= */

  const supabase =
    window.supabaseClient ||
    window.katosSupabase;


  if (!supabase) {

    console.warn(
      "Realtime: Supabase não foi inicializado."
    );

    return;

  }


  /* =========================================================
     ESTADO
  ========================================================= */

  let businessId = null;

  let realtimeChannel = null;

  let audioContext = null;

  let audioUnlocked = false;

  const cancelledSeen =
    new Set();


  /* =========================================================
     ÁUDIO
  ========================================================= */

  function getAudioContext() {

    if (!audioContext) {

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


      if (!AudioContext) {
        return null;
      }


      audioContext =
        new AudioContext();

    }


    return audioContext;

  }


  async function unlockAudio() {

    const context =
      getAudioContext();


    if (!context) {
      return;
    }


    try {

      if (
        context.state ===
        "suspended"
      ) {

        await context.resume();

      }


      audioUnlocked =
        context.state ===
        "running";

    }

    catch (error) {

      console.warn(
        "Não foi possível liberar o áudio:",
        error
      );

    }

  }


  document.addEventListener(
    "click",
    unlockAudio,
    {
      once: true
    }
  );


  document.addEventListener(
    "keydown",
    unlockAudio,
    {
      once: true
    }
  );


  /* =========================================================
     SOM GENÉRICO
  ========================================================= */

  function playTone({
    frequency,
    duration,
    delay = 0,
    volume = 0.12,
    type = "sine"
  }) {

    const context =
      getAudioContext();


    if (
      !context ||
      !audioUnlocked
    ) {

      return;

    }


    const oscillator =
      context.createOscillator();


    const gain =
      context.createGain();


    const start =
      context.currentTime +
      delay;


    const end =
      start +
      duration;


    oscillator.type =
      type;


    oscillator.frequency.setValueAtTime(
      frequency,
      start
    );


    gain.gain.setValueAtTime(
      0.0001,
      start
    );


    gain.gain.exponentialRampToValueAtTime(
      volume,
      start + 0.015
    );


    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      end
    );


    oscillator.connect(
      gain
    );


    gain.connect(
      context.destination
    );


    oscillator.start(
      start
    );


    oscillator.stop(
      end + 0.03
    );

  }


  /* =========================================================
     SOM NOVO AGENDAMENTO
     estilo caixa / pagamento
  ========================================================= */

  function playNewBookingSound() {

    playTone({
      frequency: 740,
      duration: 0.12,
      volume: 0.10,
      type: "sine"
    });


    playTone({
      frequency: 1040,
      duration: 0.15,
      delay: 0.11,
      volume: 0.13,
      type: "sine"
    });


    playTone({
      frequency: 1320,
      duration: 0.20,
      delay: 0.24,
      volume: 0.10,
      type: "triangle"
    });

  }


  /* =========================================================
     SOM CANCELAMENTO
  ========================================================= */

  function playCancellationSound() {

    playTone({
      frequency: 520,
      duration: 0.16,
      volume: 0.10,
      type: "sine"
    });


    playTone({
      frequency: 360,
      duration: 0.20,
      delay: 0.14,
      volume: 0.12,
      type: "sine"
    });


    playTone({
      frequency: 240,
      duration: 0.24,
      delay: 0.30,
      volume: 0.09,
      type: "triangle"
    });

  }


  /* =========================================================
     TOAST
  ========================================================= */

  function showRealtimeToast(
    title,
    text,
    type = "success"
  ) {

    const old =
      document.getElementById(
        "realtimeAppointmentToast"
      );


    old?.remove();


    const toast =
      document.createElement(
        "div"
      );


    toast.id =
      "realtimeAppointmentToast";


    toast.innerHTML = `

      <div class="realtime-toast-icon">
        ${
          type === "cancel"
            ? "×"
            : "✓"
        }
      </div>

      <div class="realtime-toast-content">

        <strong>
          ${title}
        </strong>

        <span>
          ${text}
        </span>

      </div>

    `;


    Object.assign(
      toast.style,
      {
        position:
          "fixed",

        right:
          "20px",

        bottom:
          "20px",

        zIndex:
          "999999",

        width:
          "min(360px, calc(100vw - 28px))",

        display:
          "flex",

        alignItems:
          "center",

        gap:
          "12px",

        padding:
          "14px 16px",

        background:
          "#111923",

        color:
          "#f8fafc",

        border:
          type === "cancel"
            ? "1px solid rgba(239,68,68,.30)"
            : "1px solid rgba(79,140,255,.30)",

        borderRadius:
          "14px",

        boxShadow:
          "0 18px 50px rgba(0,0,0,.28)",

        fontFamily:
          "Inter, system-ui, sans-serif",

        transform:
          "translateY(20px)",

        opacity:
          "0",

        transition:
          ".25s ease"
      }
    );


    const icon =
      toast.querySelector(
        ".realtime-toast-icon"
      );


    Object.assign(
      icon.style,
      {
        width:
          "36px",

        height:
          "36px",

        flex:
          "0 0 36px",

        display:
          "grid",

        placeItems:
          "center",

        borderRadius:
          "10px",

        background:
          type === "cancel"
            ? "rgba(239,68,68,.12)"
            : "rgba(79,140,255,.13)",

        color:
          type === "cancel"
            ? "#f87171"
            : "#6ea0ff",

        fontWeight:
          "900",

        fontSize:
          "18px"
      }
    );


    const strong =
      toast.querySelector(
        "strong"
      );


    const span =
      toast.querySelector(
        "span"
      );


    Object.assign(
      strong.style,
      {
        display:
          "block",

        fontSize:
          "12px",

        marginBottom:
          "3px"
      }
    );


    Object.assign(
      span.style,
      {
        display:
          "block",

        color:
          "#94a3b8",

        fontSize:
          "10px",

        lineHeight:
          "1.4"
      }
    );


    document.body.appendChild(
      toast
    );


    requestAnimationFrame(
      () => {

        toast.style.opacity =
          "1";


        toast.style.transform =
          "translateY(0)";

      }
    );


    setTimeout(
      () => {

        toast.style.opacity =
          "0";


        toast.style.transform =
          "translateY(20px)";


        setTimeout(
          () => toast.remove(),
          300
        );

      },
      5000
    );

  }


  /* =========================================================
     CARREGAR ESTABELECIMENTO
  ========================================================= */

  async function loadBusiness() {

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabase.auth
        .getSession();


    if (
      sessionError ||
      !sessionData?.session
    ) {

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
        .select("id")
        .eq(
          "owner_id",
          user.id
        )
        .single();


    if (
      error ||
      !data
    ) {

      console.error(
        "Realtime: estabelecimento não encontrado.",
        error
      );

      return false;

    }


    businessId =
      data.id;


    return true;

  }


  /* =========================================================
     NOVO AGENDAMENTO
  ========================================================= */

  function handleNewAppointment(
    payload
  ) {

    const appointment =
      payload.new;


    if (!appointment) {
      return;
    }


    console.log(
      "Novo agendamento recebido:",
      appointment
    );


    playNewBookingSound();


    showRealtimeToast(
      "Novo agendamento",
      "Um cliente acabou de reservar um horário."
    );


    window.dispatchEvent(
      new CustomEvent(
        "katos:new-appointment",
        {
          detail:
            appointment
        }
      )
    );

  }


  /* =========================================================
     ALTERAÇÃO / CANCELAMENTO
  ========================================================= */

  function handleAppointmentUpdate(
    payload
  ) {

    const current =
      payload.new;


    const previous =
      payload.old;


    if (!current) {
      return;
    }


    if (
      current.status !==
      "cancelado"
    ) {

      return;

    }


    if (
      previous?.status ===
      "cancelado"
    ) {

      return;

    }


    if (
      cancelledSeen.has(
        current.id
      )
    ) {

      return;

    }


    cancelledSeen.add(
      current.id
    );


    console.log(
      "Agendamento cancelado:",
      current
    );


    playCancellationSound();


    showRealtimeToast(
      "Agendamento cancelado",
      "Um cliente cancelou um horário.",
      "cancel"
    );


    window.dispatchEvent(
      new CustomEvent(
        "katos:appointment-cancelled",
        {
          detail:
            current
        }
      )
    );

  }


  /* =========================================================
     REALTIME
  ========================================================= */

  function startRealtime() {

    if (!businessId) {
      return;
    }


    if (realtimeChannel) {

      supabase.removeChannel(
        realtimeChannel
      );

    }


    realtimeChannel =
      supabase.channel(
        `appointments-${businessId}`
      );


    realtimeChannel
      .on(
        "postgres_changes",
        {
          event:
            "INSERT",

          schema:
            "public",

          table:
            "appointments",

          filter:
            `business_id=eq.${businessId}`
        },
        handleNewAppointment
      )
      .on(
        "postgres_changes",
        {
          event:
            "UPDATE",

          schema:
            "public",

          table:
            "appointments",

          filter:
            `business_id=eq.${businessId}`
        },
        handleAppointmentUpdate
      )
      .subscribe(
        status => {

          console.log(
            "Realtime agendamentos:",
            status
          );

        }
      );

  }


  /* =========================================================
     LIMPEZA
  ========================================================= */

  window.addEventListener(
    "beforeunload",
    () => {

      if (
        realtimeChannel
      ) {

        supabase.removeChannel(
          realtimeChannel
        );

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


      startRealtime();

    }

    catch (error) {

      console.error(
        "Erro ao iniciar notificações em tempo real:",
        error
      );

    }

  }


  init();

})();