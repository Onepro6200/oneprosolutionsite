(function () {
  "use strict";
  var doc = document.documentElement;
  var header = document.querySelector(".site-header");

  /* Header: solid on scroll, hide on scroll down */
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 40);
      header.classList.toggle("is-hidden", y > 500 && y > lastY && !doc.classList.contains("nav-open"));
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile nav */
  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = doc.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".mobile-nav a").forEach(function (a) {
      a.addEventListener("click", function () { doc.classList.remove("nav-open"); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") doc.classList.remove("nav-open");
    });
  }

  /* Route lengths for draw animation */
  document.querySelectorAll(".route-draw").forEach(function (p) {
    try { p.style.setProperty("--len", Math.ceil(p.getTotalLength())); } catch (e) {}
  });

  /* Count-up */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    var start = null, dur = 1600;
    function tick(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.firstChild.nodeValue = (target * eased).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* Reveal on scroll */
  var targets = document.querySelectorAll(".reveal, .mask-img, .step, .map-wrap, [data-count]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("in");
        if (el.hasAttribute("data-count")) countUp(el);
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add("in"); });
  }

  /* Pointer glow */
  document.querySelectorAll(".glow").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* Local time at HQ */
  var clocks = document.querySelectorAll("[data-clock]");
  if (clocks.length) {
    var fmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/Los_Angeles", hour12: false });
    var setClock = function () { clocks.forEach(function (c) { c.textContent = fmt.format(new Date()) + " PT"; }); };
    setClock();
    setInterval(setClock, 30000);
  }

  /* Back to top */
  document.querySelectorAll(".to-top").forEach(function (b) {
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  });

  /* Year */

  /* Preselect division via ?division= */
  var form = document.querySelector("form[name='contact']");
  if (form) {
    var params = new URLSearchParams(location.search);
    var div = params.get("division");
    if (div) {
      var sel = form.querySelector("select[name='division']");
      if (sel) Array.prototype.forEach.call(sel.options, function (o) { if (o.getAttribute("data-key") === div) sel.value = o.value; });
    }

    var validate = function (field) {
      var wrap = field.closest(".field");
      if (!wrap) return true;
      var ok = field.checkValidity();
      wrap.classList.toggle("invalid", !ok);
      return ok;
    };
    form.querySelectorAll("input, textarea, select").forEach(function (f) {
      f.addEventListener("blur", function () { if (f.value) validate(f); });
      f.addEventListener("input", function () { if (f.closest(".field.invalid")) validate(f); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      status.className = "form-status";
      var valid = true, first = null;
      form.querySelectorAll("[required]").forEach(function (f) {
        if (!validate(f)) { valid = false; if (!first) first = f; }
      });
      if (!valid) { first.focus(); return; }

      var btn = form.querySelector("button[type='submit']");
      btn.disabled = true; btn.classList.add("loading");
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.style.display = "none";
        var ok = document.querySelector(".success");
        if (ok) { ok.classList.add("show"); ok.scrollIntoView({ behavior: "smooth", block: "center" }); }
      }).catch(function () {
        status.className = "form-status error";
        status.textContent = "We couldn't send your inquiry just now. Please try again, or email Services@oneprosolution.com directly.";
      }).finally(function () {
        btn.disabled = false; btn.classList.remove("loading");
      });
    });
  }
})();
