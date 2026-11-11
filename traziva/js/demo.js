(function () {
  var root = document.getElementById("wa-demo");
  if (!root) return;

  var log = document.getElementById("demo-log");
  var quick = document.getElementById("demo-quick");
  var form = document.getElementById("demo-form");
  var input = document.getElementById("demo-input");
  var nameEl = document.getElementById("demo-name");
  var avEl = document.getElementById("demo-av");

  var BUSINESSES = [
    {
      id: "taller",
      label: "Taller mecánico",
      name: "Taller Ejemplo Norte",
      initials: "TE",
      keys: ["taller", "mecanico", "mecanica"],
      hours: "lunes a viernes de 8:00 a 18:00 y sábados de 8:00 a 14:00. Domingo cerrado.",
      prices: "diagnóstico $350, cambio de aceite desde $690 y alineación desde $450.",
      location: "Av. Ejemplo 210, Col. Mitras Centro, Monterrey, N.L.",
      slots: ["Mañana 9:00", "Mañana 12:30", "Viernes 16:00"]
    },
    {
      id: "estetica",
      label: "Estética",
      name: "Estética Ejemplo Luna",
      initials: "EL",
      keys: ["estetica", "salon", "belleza"],
      hours: "martes a sábado de 10:00 a 19:00 y domingo de 10:00 a 15:00. Lunes cerrado.",
      prices: "corte desde $250, manicure $280 y facial $650.",
      location: "Calle Ejemplo 18, Col. Centro, Monterrey, N.L.",
      slots: ["Hoy 17:00", "Mañana 11:00", "Sábado 12:00"]
    },
    {
      id: "dentista",
      label: "Dentista",
      name: "Dental Ejemplo Obispado",
      initials: "DE",
      keys: ["dentista", "dental", "diente", "odont"],
      health: true,
      hours: "lunes a viernes de 9:00 a 19:00 y sábados de 9:00 a 13:00.",
      prices: "valoración $400 y limpieza $800.",
      location: "Calle Ejemplo 88, Col. Obispado, Monterrey, N.L.",
      slots: ["Mañana 10:00", "Jueves 15:30", "Viernes 9:30"]
    },
    {
      id: "vet",
      label: "Veterinaria",
      name: "Veterinaria Ejemplo Patitas",
      initials: "VP",
      keys: ["veterinaria", "veterinario", "vet", "mascota"],
      health: true,
      hours: "lunes a sábado de 9:00 a 20:00 y domingo de 10:00 a 14:00.",
      prices: "consulta $450, vacuna desde $250 y baño desde $300.",
      location: "Av. Ejemplo 1500, Col. Cumbres, Monterrey, N.L.",
      slots: ["Hoy 18:30", "Mañana 10:30", "Sábado 11:00"]
    }
  ];

  var state = { business: null, phase: "pick", handedOff: false };

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9:\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasStem(text, stems) {
    var parts = text.split(" ");
    for (var i = 0; i < parts.length; i++) {
      for (var j = 0; j < stems.length; j++) {
        if (parts[i].indexOf(stems[j]) === 0) return true;
      }
    }
    return false;
  }

  function clock() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function findBusiness(text) {
    for (var i = 0; i < BUSINESSES.length; i++) {
      var biz = BUSINESSES[i];
      if (text === norm(biz.label) || hasStem(text, biz.keys)) return biz;
    }
    return null;
  }

  function matchSlot(text, slots) {
    var i;
    for (i = 0; i < slots.length; i++) {
      var slot = norm(slots[i]);
      if (text === slot || text.indexOf(slot) !== -1) return slots[i];
      var time = slot.match(/\d{1,2}:\d{2}/);
      if (time && text.indexOf(time[0]) !== -1) return slots[i];
    }
    var bare = text.match(/(?:^|\s)(\d{1,2})(?::(\d{2}))?(?:\s|$)/);
    if (bare) {
      var hits = [];
      for (i = 0; i < slots.length; i++) {
        var tm = norm(slots[i]).match(/(\d{1,2}):(\d{2})/);
        if (tm && tm[1] === bare[1] && (!bare[2] || bare[2] === tm[2])) hits.push(slots[i]);
      }
      if (hits.length === 1) return hits[0];
    }
    if (/^(el primero|la primera|primera|1)$/.test(text)) return slots[0];
    if (/^(el segundo|la segunda|segunda|2)$/.test(text)) return slots[1];
    if (slots[2] && /^(el tercero|la tercera|tercera|3)$/.test(text)) return slots[2];
    return null;
  }

  function addBubble(text, who) {
    var bub = document.createElement("div");
    bub.className = "bub " + (who === "me" ? "me" : "bot");
    if (who === "bot") {
      var tag = document.createElement("span");
      tag.className = "auto";
      tag.textContent = "EJEMPLO · RESPUESTA AUTOMÁTICA";
      bub.appendChild(tag);
    }
    bub.appendChild(document.createTextNode(text));
    var time = document.createElement("span");
    time.className = "tm";
    time.textContent = clock();
    bub.appendChild(time);
    log.appendChild(bub);
    log.scrollTop = log.scrollHeight;
  }

  function setQuick(labels) {
    quick.replaceChildren();
    labels.forEach(function (label) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.addEventListener("click", function () {
        replyTo(label);
      });
      quick.appendChild(btn);
    });
  }

  function showBusiness(biz) {
    nameEl.textContent = biz.name;
    avEl.textContent = biz.initials;
  }

  function reset() {
    state.business = null;
    state.phase = "pick";
    state.handedOff = false;
    nameEl.textContent = "Demo Traziva";
    avEl.textContent = "CB";
    log.replaceChildren();
    addBubble("Demo con datos de ejemplo. Elija un tipo de negocio para ver cómo contestaría su WhatsApp. Nada de lo que sigue es un negocio real.", "bot");
    setQuick(BUSINESSES.map(function (biz) { return biz.label; }));
  }

  function menuReplies() {
    return ["Precios", "Horario", "Ubicación", "Agendar cita", "Hablar con una persona"];
  }

  function handoff(message) {
    state.handedOff = true;
    state.phase = "handoff";
    addBubble(message, "bot");
    setQuick(["Probar otro negocio"]);
  }

  function choose(biz) {
    state.business = biz;
    state.phase = "chat";
    state.handedOff = false;
    showBusiness(biz);
    addBubble(
      "Hola. Soy la respuesta automática de ejemplo de " + biz.name +
      ". Puedo decirle precios, horario y dirección de ejemplo, o mostrarle dos o tres horarios de cita. Usted aprobaría estos textos en un negocio real. Aquí todo es inventado.",
      "bot"
    );
    setQuick(menuReplies());
  }

  function answer(text) {
    if (!state.business || state.phase === "pick") {
      var picked = findBusiness(text);
      if (picked) {
        choose(picked);
        return;
      }
      addBubble("Primero elija un tipo de negocio de ejemplo: taller mecánico, estética, dentista o veterinaria.", "bot");
      setQuick(BUSINESSES.map(function (biz) { return biz.label; }));
      return;
    }

    if (text.indexOf("otro negocio") !== -1 || text.indexOf("probar otro") !== -1 || text === "reiniciar" || text.indexOf("empezar de nuevo") !== -1) {
      addBubble("Empezamos otra vez. Elija un negocio de ejemplo.", "bot");
      state.business = null;
      state.phase = "pick";
      state.handedOff = false;
      nameEl.textContent = "Demo Traziva";
      avEl.textContent = "CB";
      setQuick(BUSINESSES.map(function (biz) { return biz.label; }));
      return;
    }

    if (state.handedOff) {
      addBubble("En este demo la conversación ya pasó a una persona. No hay nadie del otro lado, porque es un ejemplo. Puede probar otro negocio o escribirle a César con el botón de abajo.", "bot");
      setQuick(["Probar otro negocio"]);
      return;
    }

    var biz = state.business;

    if (hasStem(text, ["emergenc", "urgenc"]) || text.indexOf("911") !== -1 || hasStem(text, ["accidente"])) {
      handoff("Este demo no atiende emergencias. Si es una emergencia, llame al 911 o al teléfono del negocio. No deje aquí datos de salud.");
      return;
    }

    if (biz.health && hasStem(text, ["dolor", "duele", "sintoma", "sangr", "fiebre", "medicament", "receta", "diagnost", "enferm", "alergi", "vomit", "convuls"])) {
      handoff("No pido ni guardo datos de salud. En un consultorio, la respuesta automática solo agenda y responde dudas generales. Esa conversación se la pasaría a una persona.");
      return;
    }

    if (hasStem(text, ["persona", "humano", "asesor", "operador", "alguien", "cesar"]) || text.indexOf("hablar con") !== -1) {
      handoff("Se lo paso a una persona. En el WhatsApp de un negocio real, alguien del equipo seguiría esta conversación. En el demo no hay nadie del otro lado.");
      return;
    }

    if (state.phase === "slots") {
      var chosen = matchSlot(text, biz.slots);
      if (chosen) {
        state.phase = "chat";
        addBubble("Quedó anotado como ejemplo: " + chosen + " en " + biz.name + ". No es una cita real y no quedó agendada en ningún calendario.", "bot");
        setQuick(menuReplies());
        return;
      }
      if (hasStem(text, ["cita", "agendar", "reserv", "apart", "turno"]) || /^(si|ok|va|dale)$/.test(text)) {
        addBubble("Elija uno de estos horarios de ejemplo. No son lugares reales:", "bot");
        setQuick(biz.slots.concat(["Hablar con una persona"]));
        return;
      }
    }

    if (hasStem(text, ["precio", "cuesta", "cuanto", "costo", "cobr", "tarifa"])) {
      addBubble("Precios de ejemplo en " + biz.name + ", no es una lista real: " + biz.prices + " Los montos son ilustrativos y no incluyen IVA.", "bot");
      setQuick(state.phase === "slots" ? biz.slots.concat(["Hablar con una persona"]) : menuReplies());
      return;
    }

    if (hasStem(text, ["horario", "hora", "abren", "abierto", "cierr", "atiend"])) {
      addBubble("Horario de ejemplo de " + biz.name + ": " + biz.hours + " No es el horario de un negocio real.", "bot");
      setQuick(state.phase === "slots" ? biz.slots.concat(["Hablar con una persona"]) : menuReplies());
      return;
    }

    if (hasStem(text, ["ubic", "direccion", "donde", "mapa", "llegar", "colonia", "domicilio"])) {
      addBubble("Dirección de ejemplo: " + biz.location + " No es un local real.", "bot");
      setQuick(state.phase === "slots" ? biz.slots.concat(["Hablar con una persona"]) : menuReplies());
      return;
    }

    if (hasStem(text, ["cita", "agendar", "reserv", "apart", "turno"])) {
      var chosenNow = matchSlot(text, biz.slots);
      if (chosenNow) {
        state.phase = "chat";
        addBubble("Quedó anotado como ejemplo: " + chosenNow + " en " + biz.name + ". No es una cita real y no quedó agendada en ningún calendario.", "bot");
        setQuick(menuReplies());
        return;
      }
      state.phase = "slots";
      addBubble("Estos horarios son de ejemplo en " + biz.name + ". Elija uno para ver la confirmación. No queda nada apartado de verdad.", "bot");
      setQuick(biz.slots.concat(["Hablar con una persona"]));
      return;
    }

    if (/^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|que tal)$/.test(text)) {
      addBubble("Hola. Puedo decirle precios, horario o dirección de ejemplo de " + biz.name + ", o mostrarle horarios de cita inventados.", "bot");
      setQuick(menuReplies());
      return;
    }

    if (/^(gracias|muchas gracias|ok|okay|va|perfecto|sale|entendido)$/.test(text)) {
      addBubble("Con gusto. Si quiere, siga con precios, horario, ubicación o una cita de ejemplo. Si prefiere una persona, se lo paso.", "bot");
      setQuick(menuReplies());
      return;
    }

    handoff("Eso no lo tengo en las respuestas de ejemplo, así que se lo pasaría a una persona del equipo. En este demo no hay nadie del otro lado.");
  }

  function replyTo(raw) {
    var text = norm(raw);
    if (!text) return;
    addBubble(String(raw).trim(), "me");
    answer(text);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = input.value;
    input.value = "";
    replyTo(value);
    input.focus();
  });

  var fab = document.querySelector(".fab-wa");
  if (fab && "IntersectionObserver" in window) {
    var watcher = new IntersectionObserver(function (entries) {
      var visible = entries.some(function (entry) { return entry.isIntersecting; });
      fab.classList.toggle("fab-wa-hold", visible);
    }, { threshold: 0.2 });
    watcher.observe(form);
  }

  reset();
})();
