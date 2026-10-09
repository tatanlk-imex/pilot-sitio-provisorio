/* Asistente de cotización PILOT: preguntas básicas guiadas (sin inteligencia artificial, 100 % editable).
   Orienta al cliente, arma el resumen y lo envía por WhatsApp, formulario o correo. */
(function () {
  "use strict";
  var C = window.PILOT_CONFIG || {};
  var RAIZ = document.documentElement.getAttribute("data-raiz") || "./";
  var TEL = C.TELEFONO || "(02) 2396 4622";

  // ---------- Flujo de preguntas ----------
  // Cada opción: [texto visible, siguiente nodo, clave opcional para recomendar]
  var CANT = { q: "¿Qué cantidad aproximada necesitas?", key: "Cantidad", opts: [["Menos de 50 unidades", "tipo"], ["De 50 a 500 unidades", "tipo"], ["De 501 a 5.000 unidades", "tipo"], ["Más de 5.000 unidades", "tipo"], ["Aún no lo sé", "tipo"]] };
  var TIPO = { q: "¿Cómo compras?", key: "Tipo de cliente", opts: [["Empresa o institución (compro para mi equipo)", "plazo"], ["Colegio o jardín", "plazo"], ["Librería, tienda o distribuidor", "plazo"], ["Licitación o convenio", "plazo"], ["Persona natural", "plazo"]] };
  var PLAZO = { q: "¿Para cuándo lo necesitas?", key: "Plazo", opts: [["Lo antes posible", "nombre"], ["Este mes", "nombre"], ["En los próximos meses", "nombre"], ["Solo estoy averiguando", "nombre"]] };
  var USO = { q: "¿Para qué lo vas a usar principalmente?", key: "Uso", opts: [["Escribir a diario (oficina o estudio)", "cant", "u1"], ["Colegio y regreso a clases", "cant", "u2"], ["Escribir y poder borrar", "cant", "u3"], ["Pizarra de salas o reuniones", "cant", "u4"], ["Dibujo, arte y manualidades", "cant", "u5"], ["Marcar o rotular", "cant", "u6"], ["Todavía no lo tengo claro", "cant", "u7"]] };
  var F = {
    inicio: { q: "¡Hola! Soy el asistente de PILOT en Chile. Te hago unas preguntas rápidas para orientarte y que tu cotización llegue completa. ¿Qué necesitas?", key: "Necesidad", opts: [
      ["Lápices y bolígrafos (gel, tinta, pasta)", "uso", "esc"], ["Lápices borrables FriXion", "uso", "fri"], ["Marcadores de pizarra y recargas", "uso", "piz"],
      ["Marcadores de arte (Pintor, óleo) y permanentes", "uso", "art"], ["Quiero revender PILOT (librería, tienda, distribuidor)", "cant", "dist"], ["Otra consulta", "uso", "otro"]] },
    uso: USO, cant: CANT, tipo: TIPO, plazo: PLAZO,
    nombre: { q: "Para enviarte la cotización, ¿cuál es tu nombre?", key: "Nombre", input: "text", next: "empresa", ph: "Nombre y apellido" },
    empresa: { q: "¿De qué empresa o institución eres?", key: "Empresa", input: "text", next: "correo", ph: "Empresa (opcional)", opcional: true },
    correo: { q: "¿A qué correo te enviamos la cotización?", key: "Correo", input: "email", next: "fono", ph: "tucorreo@empresa.cl" },
    fono: { q: "¿Y un teléfono para coordinar? (opcional)", key: "Teléfono", input: "tel", next: "fin", ph: "+56 9 …", opcional: true }
  };

  // ---------- Orientación referencial ----------
  function recomendar(t, c) {
    if (t === "fri") { return { txt: "Te orientaría hacia la línea FriXion (tinta borrable). Recuerda: no es para firmas, documentos legales ni exámenes, y el calor puede borrar la escritura.", ruta: "lineas/frixion/", etiqueta: "Ver FriXion" }; }
    if (t === "piz") { return { txt: "Para pizarra te orientaría hacia V Board Master: marcadores recargables con cartuchos de repuesto.", ruta: "lineas/pizarra/", etiqueta: "Ver marcadores de pizarra" }; }
    if (t === "art") { return { txt: "Para arte y manualidades: marcadores Pintor y de óleo para varias superficies; para rotular, los permanentes.", ruta: "lineas/pintor/", etiqueta: "Ver Pintor" }; }
    if (t === "dist") { return { txt: "Imex es el representante de PILOT en Chile. Cuéntanos tu negocio y vemos cómo trabajar juntos.", ruta: "empresas/", etiqueta: "Ver empresas y distribuidores" }; }
    if (t === "esc") {
      var s = { u1: ["Super Gel, G-1 y G-2 (gel) o Hi-Tecpoint (punta fina)", "lineas/super-gel/"], u2: ["Pop'Lol, Super Gel y los bolígrafos de pasta BP-1", "lineas/pop-lol/"], u3: ["la línea FriXion", "lineas/frixion/"], u4: ["V Board Master", "lineas/pizarra/"], u5: ["Pintor y marcadores de óleo", "lineas/pintor/"], u6: ["los marcadores permanentes", "lineas/permanentes/"], u7: ["la guía \"Elige tu PILOT\"", "elige-tu-pilot/"] }[c.u] || ["la guía \"Elige tu PILOT\"", "elige-tu-pilot/"];
      return { txt: "Por lo que cuentas, te orientaría hacia " + s[0] + ".", ruta: s[1], etiqueta: "Ver la línea sugerida" };
    }
    return { txt: "Un ejecutivo te ayudará a elegir la línea según tu uso.", ruta: "elige-tu-pilot/", etiqueta: "Ver guía Elige tu PILOT" };
  }
  var INTERES = { esc: "escritura", fri: "frixion", piz: "pizarra", art: "arte", dist: "distribuidor", otro: "otro" };

  // ---------- Interfaz ----------
  var raiz = document.createElement("div");
  raiz.innerHTML =
    '<button type="button" class="asesor-btn" aria-expanded="false" aria-controls="asesor-panel"><span aria-hidden="true">💬</span> ¿Te ayudo a cotizar?</button>' +
    '<section class="asesor-panel" id="asesor-panel" role="dialog" aria-label="Asistente de cotización PILOT" hidden>' +
    '<header><strong>Asistente PILOT</strong><button type="button" class="asesor-cerrar" aria-label="Cerrar asistente">×</button></header>' +
    '<div class="asesor-msgs" aria-live="polite"></div><div class="asesor-ctl"></div></section>';
  document.body.appendChild(raiz);
  var btn = raiz.querySelector(".asesor-btn"), panel = raiz.querySelector(".asesor-panel");
  var msgs = raiz.querySelector(".asesor-msgs"), ctl = raiz.querySelector(".asesor-ctl");
  var estado = null, iniciado = false;

  function nuevo() { estado = { tema: "", c: {}, resp: [], datos: {} }; }
  function burbuja(texto, tipo) {
    var d = document.createElement("div"); d.className = "asesor-b " + (tipo || "bot"); d.textContent = texto; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }
  function evento(n, d) { if (window.gtag) { window.gtag("event", n, d || {}); } }

  function preguntar(id) {
    var n = F[id]; if (!n) { return resumen(); }
    burbuja(n.q, "bot"); ctl.innerHTML = "";
    if (n.opts) {
      n.opts.forEach(function (o) {
        var b = document.createElement("button"); b.type = "button"; b.className = "asesor-op"; b.textContent = o[0];
        b.addEventListener("click", function () { responder(n, id, o[0], o[1], o[2]); }); ctl.appendChild(b);
      });
    } else {
      var f = document.createElement("form"); f.className = "asesor-in";
      var i = document.createElement("input"); i.type = n.input; i.placeholder = n.ph || ""; i.setAttribute("aria-label", n.q); i.autocomplete = n.input === "email" ? "email" : (id === "nombre" ? "name" : "off");
      var s = document.createElement("button"); s.type = "submit"; s.className = "asesor-env"; s.textContent = "Enviar";
      f.appendChild(i); f.appendChild(s);
      if (n.opcional) { var sk = document.createElement("button"); sk.type = "button"; sk.className = "asesor-saltar"; sk.textContent = "Saltar"; sk.addEventListener("click", function () { responder(n, id, "", n.next); }); f.appendChild(sk); }
      f.addEventListener("submit", function (e) {
        e.preventDefault(); var v = i.value.trim();
        if (!v && !n.opcional) { i.focus(); return; }
        if (n.input === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { burbuja("Revisa el correo, parece incompleto.", "bot"); i.focus(); return; }
        responder(n, id, v, n.next);
      });
      ctl.appendChild(f); i.focus();
    }
  }
  function responder(n, id, texto, sig, clave) {
    if (id === "inicio") { estado.tema = clave; }
    if (clave && id !== "inicio") { estado.c[clave.charAt(0)] = clave; }
    if (texto) { burbuja(texto, "yo"); estado.resp.push([n.key, texto]); }
    ctl.innerHTML = "";
    if (n.key === "Nombre" || n.key === "Empresa" || n.key === "Correo" || n.key === "Teléfono") { estado.datos[n.key] = texto; }
    if (estado.tema === "dist" && sig === "tipo") { sig = "plazo"; } // el revendedor ya indicó su tipo de cliente
    setTimeout(function () { sig === "fin" ? resumen() : preguntar(sig); }, 250);
  }
  function textoResumen() {
    var l = ["Hola, soy " + (estado.datos["Nombre"] || "") + (estado.datos["Empresa"] ? " (" + estado.datos["Empresa"] + ")" : "") + ". Quiero cotizar PILOT:"];
    estado.resp.forEach(function (r) { if (["Nombre", "Empresa", "Correo", "Teléfono"].indexOf(r[0]) < 0) { l.push("• " + r[0] + ": " + r[1]); } });
    var rc = recomendar(estado.tema, estado.c); if (rc) { l.push("• Orientación del asistente: " + rc.txt); }
    l.push("Correo: " + (estado.datos["Correo"] || "-")); l.push("Teléfono: " + (estado.datos["Teléfono"] || "-"));
    return l.join("\n");
  }
  function resumen() {
    var rc = recomendar(estado.tema, estado.c);
    burbuja("¡Gracias, " + (estado.datos["Nombre"] || "") + "! Esto es lo que entendí:", "bot");
    burbuja(textoResumen().split("\n").slice(1).join("\n"), "bot");
    if (rc) {
      var d = burbuja(rc.txt + " ", "bot"); var a = document.createElement("a"); a.href = RAIZ + rc.ruta; a.textContent = rc.etiqueta; d.appendChild(a);
    }
    ctl.innerHTML = "";
    var lab = document.createElement("label"); lab.className = "asesor-acepto";
    lab.innerHTML = '<input type="checkbox"> <span>Acepto que Imex use estos datos para responder mi solicitud (<a href="' + RAIZ + 'politica-de-privacidad/">política de privacidad</a>).</span>';
    ctl.appendChild(lab); var chk = lab.querySelector("input");
    function exigir() { if (!chk.checked) { burbuja("Para enviar necesito que aceptes el uso de tus datos.", "bot"); chk.focus(); return false; } return true; }
    if (C.WHATSAPP) {
      var w = document.createElement("a"); w.className = "btn btn-wsp asesor-enviar"; w.href = "#"; w.innerHTML = '<span>Enviar por WhatsApp</span>';
      w.addEventListener("click", function (e) { e.preventDefault(); if (!exigir()) { return; } evento("asistente_whatsapp", { tema: estado.tema }); window.open("https://wa.me/" + C.WHATSAPP + "?text=" + encodeURIComponent(textoResumen()), "_blank", "noopener"); fin(); });
      ctl.appendChild(w);
    }
    var m = document.createElement("button"); m.type = "button"; m.className = "btn btn-sec asesor-enviar"; m.textContent = C.FORM_ENDPOINT ? "Enviar solicitud" : "Enviar por correo";
    m.addEventListener("click", function () { if (!exigir()) { return; } evento("asistente_correo", { tema: estado.tema }); enviarCorreo(); });
    ctl.appendChild(m);
  }
  function fin() { burbuja("¡Listo! Un ejecutivo te contactará para confirmar el modelo y enviarte la cotización. Si es urgente, llámanos al " + TEL + ".", "bot"); }
  function enviarCorreo() {
    var d = { nombre: estado.datos["Nombre"], empresa: estado.datos["Empresa"] || "", correo: estado.datos["Correo"], telefono: estado.datos["Teléfono"] || "", interes: INTERES[estado.tema] || "otro", producto: "", mensaje: textoResumen(), pagina: location.href, origen: "asistente" };
    if (C.FORM_ENDPOINT) {
      fetch(C.FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(d) })
        .then(function (r) { if (!r.ok) { throw new Error(); } ctl.innerHTML = ""; fin(); })
        .catch(function () { burbuja("No pudimos enviar la solicitud. Escríbenos a " + C.CORREO_COTIZACIONES + " o llama al " + TEL + ".", "bot"); });
    } else {
      window.location.href = "mailto:" + C.CORREO_COTIZACIONES + "?subject=" + encodeURIComponent("Cotización web PILOT (asistente): " + (INTERES[estado.tema] || "consulta")) + "&body=" + encodeURIComponent(textoResumen());
      ctl.innerHTML = ""; fin();
    }
  }
  function abrir() {
    panel.hidden = false; btn.setAttribute("aria-expanded", "true"); btn.hidden = true;
    if (!iniciado) { iniciado = true; nuevo(); preguntar("inicio"); evento("asistente_abierto"); }
  }
  function cerrar() { panel.hidden = true; btn.hidden = false; btn.setAttribute("aria-expanded", "false"); btn.focus(); }
  btn.addEventListener("click", abrir);
  raiz.querySelector(".asesor-cerrar").addEventListener("click", cerrar);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { cerrar(); } });
})();
