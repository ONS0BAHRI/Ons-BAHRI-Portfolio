/* Ons Bahri — Portfolio interactions */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Background: drifting "IoT network" of nodes ---------- */
  var canvas = document.getElementById("net");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var colors = ["68,88,220", "133,79,238", "236,127,176"];
    var nodes = [], w, h, dpr, linkDist, mouse = { x: -9999, y: -9999 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      linkDist = Math.min(170, Math.max(110, w / 9));
      var count = Math.round(Math.min(70, Math.max(26, (w * h) / 22000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
          r: Math.random() * 1.8 + 1.2,
          c: colors[i % colors.length],
          p: Math.random() * Math.PI * 2
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        if (!reduceMotion) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
          if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;
        }
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            ctx.strokeStyle = "rgba(" + a.c + "," + (0.16 * (1 - d / linkDist)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        // gentle pull-in of links toward the cursor
        var mx = a.x - mouse.x, my = a.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
        if (md < 180) {
          ctx.strokeStyle = "rgba(" + a.c + "," + (0.22 * (1 - md / 180)).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        var pulse = reduceMotion ? 1 : 1 + Math.sin(t / 900 + a.p) * .25;
        ctx.fillStyle = "rgba(" + a.c + ",.55)";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r * pulse, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener("mouseout", function () { mouse.x = mouse.y = -9999; });
    requestAnimationFrame(draw);
  }

  /* ---------- Nav: scrolled state, progress bar, active link, back-to-top ---------- */
  var nav = document.querySelector(".nav");
  var progress = document.querySelector(".progress");
  var toTop = document.querySelector(".to-top");
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav-links a[href^='#']"));
  var sections = links.map(function (l) { return document.querySelector(l.getAttribute("href")); });

  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle("scrolled", y > 20);
    toTop.classList.toggle("show", y > 600);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    var current = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < 140) current = i; });
    links.forEach(function (l, i) { l.classList.toggle("active", i === current); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });

  var menuBtn = document.querySelector(".menu-btn");
  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  links.forEach(function (l) { l.addEventListener("click", function () { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }); });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Project filters ---------- */
  var filters = document.querySelectorAll(".filter");
  var projects = document.querySelectorAll(".project");
  filters.forEach(function (f) {
    f.addEventListener("click", function () {
      filters.forEach(function (x) { x.classList.remove("on"); x.setAttribute("aria-pressed", "false"); });
      f.classList.add("on"); f.setAttribute("aria-pressed", "true");
      var cat = f.getAttribute("data-filter");
      projects.forEach(function (p) {
        var show = cat === "all" || (" " + p.getAttribute("data-cat") + " ").indexOf(" " + cat + " ") > -1;
        p.classList.toggle("hide", !show);
      });
    });
  });

  /* ---------- Year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
