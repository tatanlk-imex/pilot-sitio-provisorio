/* PILOT Chile - comportamiento mínimo. El sitio funciona completo sin JavaScript (salvo filtros, pestañas y envío del formulario). */
(function () {
  "use strict";
  var C = window.PILOT_CONFIG || {};
  var RAIZ = document.documentElement.getAttribute("data-raiz") || "./";
  function norm(t) { return (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  // Animaciones al desplazarse (solo con JavaScript; sin él todo se ve igual)
  document.documentElement.classList.add("js");
  var pend = [];
  document.querySelectorAll(".titulo-sec,.fam-tile,.personas li,.tarjeta,.cinta .dato,.pasos li,.demo-frixion,.aviso-banda,.linea-tiempo li").forEach(function (el) {
    if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add("rv"); pend.push(el); }
  });
  var esperando = false;
  function revisar() {
    esperando = false;
    pend = pend.filter(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) { el.classList.add("vis"); return false; }
      return true;
    });
    if (!pend.length) { window.removeEventListener("scroll", pedir); window.removeEventListener("resize", pedir); }
  }
  function pedir() { if (!esperando) { esperando = true; window.setTimeout(revisar, 30); } }
  window.addEventListener("scroll", pedir, { passive: true }); window.addEventListener("resize", pedir);
  window.addEventListener("load", pedir);
  var iv = window.setInterval(function () { if (!pend.length) { window.clearInterval(iv); return; } revisar(); }, 400);
  // Demostración FriXion
  var bb = document.getElementById("demo-borrar"), dt = document.getElementById("demo-texto");
  if (bb && dt) {
    bb.addEventListener("click", function () {
      dt.classList.add("borrado"); bb.disabled = true; evento("demo_frixion");
      setTimeout(function () { dt.textContent = "¡Corregido! Ahora sí."; dt.classList.remove("borrado"); bb.disabled = false; bb.textContent = "Probar otra vez"; }, 1500);
    });
  }

  // Menú móvil
  var btn = document.querySelector(".btn-menu"), nav = document.getElementById("menu-principal");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var abierto = nav.classList.toggle("abierto");
      btn.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
  }

  // WhatsApp (solo si está configurado)
  if (C.WHATSAPP) {
    document.querySelectorAll("[data-whatsapp]").forEach(function (a) {
      var texto = a.getAttribute("data-whatsapp") || "Hola, quiero cotizar productos PILOT.";
      a.href = "https://wa.me/" + C.WHATSAPP + "?text=" + encodeURIComponent(texto);
      a.hidden = false;
    });
  }

  // Medición (GA4) solo con ID configurado y con aceptación del visitante
  var consentimiento = null;
  try { consentimiento = window.localStorage.getItem("pilot_cookies"); } catch (e) { consentimiento = null; }
  function cargarGA() {
    if (!C.GA4_ID || window.gtag) { return; }
    var s = document.createElement("script"); s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(C.GA4_ID); document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date()); window.gtag("config", C.GA4_ID, { anonymize_ip: true });
  }
  function guardar(v) { try { window.localStorage.setItem("pilot_cookies", v); } catch (e) { /* sin almacenamiento */ } }
  if (C.GA4_ID) {
    if (consentimiento === "si") { cargarGA(); }
    else if (consentimiento !== "no") {
      var av = document.createElement("div"); av.className = "aviso-cookies"; av.setAttribute("role", "region"); av.setAttribute("aria-label", "Aviso de medición");
      av.innerHTML = '<p>Usamos Google Analytics para saber qué páginas se visitan y mejorar el sitio. Solo se activa si aceptas. <a href="' + RAIZ + 'politica-de-privacidad/">Más información</a>.</p><button type="button" class="btn btn-peq" data-c="si">Aceptar</button><button type="button" class="btn btn-sec btn-peq" data-c="no">Rechazar</button>';
      document.body.appendChild(av);
      av.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-c]"); if (!b) { return; }
        guardar(b.getAttribute("data-c")); if (b.getAttribute("data-c") === "si") { cargarGA(); } av.remove();
      });
    }
  }
  function evento(nombre, datos) { if (window.gtag) { window.gtag("event", nombre, datos || {}); } }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a"); if (!a) { return; }
    var h = a.getAttribute("href") || "";
    if (h.indexOf("tel:") === 0) { evento("llamar", { numero: h }); }
    if (h.indexOf("wa.me") > -1) { evento("whatsapp"); }
    if (h.indexOf("cotizar") > -1) { evento("clic_cotizar", { destino: h }); }
    if (/\.pdf($|\?)/i.test(h)) { evento("ficha_descargada", { archivo: h }); }
    if (a.hasAttribute("data-video")) { evento("video_visto", { destino: h }); }
  });

  // Galería de producto
  var principal = document.querySelector(".galeria .principal img");
  document.querySelectorAll(".galeria .miniaturas button").forEach(function (b) {
    b.addEventListener("click", function () {
      if (principal) { principal.src = b.getAttribute("data-src"); }
      document.querySelectorAll(".galeria .miniaturas button").forEach(function (x) { x.removeAttribute("aria-current"); });
      b.setAttribute("aria-current", "true");
    });
  });

  // Pestañas (sin JavaScript se ven todos los paneles uno bajo otro)
  document.querySelectorAll(".pestanas").forEach(function (cont) {
    var tabs = Array.prototype.slice.call(cont.querySelectorAll("[role=tab]"));
    var paneles = Array.prototype.slice.call(cont.querySelectorAll("[role=tabpanel]"));
    if (!tabs.length) { return; }
    cont.querySelector("[role=tablist]").hidden = false;
    function activar(t) {
      tabs.forEach(function (x) { x.setAttribute("aria-selected", x === t ? "true" : "false"); x.tabIndex = x === t ? 0 : -1; });
      paneles.forEach(function (p) { p.hidden = p.id !== t.getAttribute("aria-controls"); });
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { activar(t); });
      t.addEventListener("keydown", function (e) {
        var i = tabs.indexOf(t);
        if (e.key === "ArrowRight") { tabs[(i + 1) % tabs.length].focus(); activar(tabs[(i + 1) % tabs.length]); }
        if (e.key === "ArrowLeft") { tabs[(i + tabs.length - 1) % tabs.length].focus(); activar(tabs[(i + tabs.length - 1) % tabs.length]); }
      });
    });
    activar(tabs[0]);
  });

  // Catálogo de sets con filtros
  var cont = document.getElementById("catalogo");
  if (cont) {
    var tarjetas = Array.prototype.slice.call(cont.querySelectorAll("[data-linea]"));
    var cuenta = document.getElementById("contador"), texto = document.getElementById("filtro-texto"), vacio = document.getElementById("sin-resultados");
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-linea-filtro]"));
    var estado = { linea: "todos", q: "" };
    var aplicar = function () {
      var n = 0;
      tarjetas.forEach(function (t) {
        var ok = (estado.linea === "todos" || t.getAttribute("data-linea") === estado.linea) && (!estado.q || norm(t.getAttribute("data-busqueda")).indexOf(norm(estado.q)) > -1);
        t.hidden = !ok; if (ok) { n++; }
      });
      if (cuenta) { cuenta.textContent = n + (n === 1 ? " producto" : " productos"); }
      if (vacio) { vacio.hidden = n !== 0; }
    };
    chips.forEach(function (c) { c.addEventListener("click", function () { chips.forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); c.setAttribute("aria-pressed", "true"); estado.linea = c.getAttribute("data-linea-filtro"); aplicar(); }); });
    if (texto) { texto.addEventListener("input", function () { estado.q = texto.value; aplicar(); }); }
    var qs = new URLSearchParams(window.location.search);
    if (qs.get("q") && texto) { texto.value = qs.get("q"); estado.q = qs.get("q"); }
    aplicar();
  }

  // Guía "Elige tu PILOT"
  var guia = document.getElementById("form-guia");
  if (guia) {
    var res = Array.prototype.slice.call(document.querySelectorAll("[data-resultado-guia]"));
    var mostrar = function (uso) {
      res.forEach(function (r) { r.hidden = !!uso && r.getAttribute("data-resultado-guia") !== uso; });
      if (uso) { var r0 = res.filter(function (r) { return !r.hidden; })[0]; if (r0) { r0.scrollIntoView({ behavior: "smooth", block: "nearest" }); } evento("guia_elige", { uso: uso }); }
    };
    res.forEach(function (r) { r.hidden = true; });
    var vacioGuia = document.getElementById("guia-vacio"); if (vacioGuia) { vacioGuia.hidden = false; }
    guia.addEventListener("change", function () {
      var s = guia.querySelector("input[name=uso]:checked"); if (!s) { return; }
      if (vacioGuia) { vacioGuia.hidden = true; } mostrar(s.value);
    });
  }

  // Formulario de cotización
  var form = document.getElementById("form-cotizacion");
  if (form) {
    var qs2 = new URLSearchParams(window.location.search);
    ["producto", "interes", "mensaje"].forEach(function (k) { var v = qs2.get(k === "mensaje" ? "msg" : k); if (v && form.elements[k]) { form.elements[k].value = v; } });
    var msg = document.getElementById("form-mensaje");
    var aviso = function (clase, t) { msg.className = "aviso " + clase; msg.textContent = t; msg.hidden = false; msg.focus(); };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements.sitio_web && form.elements.sitio_web.value) { return; }
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var d = {};
      Array.prototype.forEach.call(form.elements, function (el) { if (el.name && el.type !== "checkbox") { d[el.name] = el.value; } });
      d.pagina = window.location.href;
      evento("enviar_cotizacion", { interes: d.interes });
      var asunto = "Cotización web PILOT: " + (d.producto || d.interes || "consulta");
      var cuerpo = "Nombre: " + d.nombre + "\nEmpresa: " + (d.empresa || "-") + "\nCorreo: " + d.correo + "\nTeléfono: " + (d.telefono || "-") + "\nInterés: " + d.interes +
        "\nProducto o línea: " + (d.producto || "-") + "\nTipo de cliente: " + (d.tipo || "-") + "\nCantidad: " + (d.cantidad || "-") + "\n\nMensaje:\n" + (d.mensaje || "-") + "\n\nEnviado desde: " + d.pagina;
      if (C.FORM_ENDPOINT) {
        fetch(C.FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(d) })
          .then(function (r) { if (!r.ok) { throw new Error("fallo"); } form.reset(); aviso("aviso-ok", "¡Gracias! Recibimos tu solicitud. Te responderemos en horario de atención (lunes a viernes)."); })
          .catch(function () { aviso("aviso-rojo", "No pudimos enviar el formulario. Escríbenos a " + C.CORREO_COTIZACIONES + " o llama al " + C.TELEFONO + "."); });
      } else {
        window.location.href = "mailto:" + C.CORREO_COTIZACIONES + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo);
        aviso("aviso-ok", "Se abrió tu programa de correo con la solicitud lista. Solo debes presionar Enviar. Si no se abrió, escríbenos a " + C.CORREO_COTIZACIONES + ".");
      }
    });
  }
})();
