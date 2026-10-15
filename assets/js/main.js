/* Ons Bahri — Portfolio interactions */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Background: drifting "IoT network" of nodes ---------- */
  var canvas = document.getElementById("net");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var colors = ["68,88,220", "133,79,238", "236,127,176"];
    var nodes = [], w = 0, h = 0, dpr, linkDist, margin, last = 0, mouse = { x: -9999, y: -9999 };

    function makeNode(i) {
      var ang = Math.random() * Math.PI * 2, speed = .012 + Math.random() * .014; // px per ms
      return {
        x: Math.random() * (w + 2 * margin) - margin, y: Math.random() * (h + 2 * margin) - margin,
        vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
        r: Math.random() * 1.8 + 1.2,
        c: colors[i % colors.length],
        p: Math.random() * Math.PI * 2
      };
    }

    // Resizing keeps the existing network (scaled to the new size) instead of rebuilding it,
    // so the mobile address bar showing/hiding never restarts the animation.
    function resize() {
      var ow = w, oh = h;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      linkDist = Math.min(170, Math.max(110, w / 9));
      margin = linkDist;
      if (ow && oh) nodes.forEach(function (n) { n.x *= w / ow; n.y *= h / oh; });
      var count = Math.round(Math.min(95, Math.max(34, ((w + 2 * margin) * (h + 2 * margin)) / 22000)));
      while (nodes.length < count) nodes.push(makeNode(nodes.length));
      if (nodes.length > count) nodes.length = count;
      if (reduceMotion) draw(0);
    }

    // 0 near/outside the viewport edge, 1 inside: nodes fade out before wrapping around,
    // so they never pop in or out.
    function edgeFade(n) {
      var d = Math.min(n.x, w - n.x, n.y, h - n.y);
      return Math.max(0, Math.min(1, (d + margin * .2) / (margin * .8)));
    }

    function draw(t) {
      var dt = last ? Math.min(t - last, 50) : 16;
      last = t;
      ctx.clearRect(0, 0, w, h);
      var i, a;
      if (!reduceMotion) {
        for (i = 0; i < nodes.length; i++) {
          a = nodes[i];
          a.x += a.vx * dt; a.y += a.vy * dt;
          if (a.x < -margin) a.x += w + 2 * margin; else if (a.x > w + margin) a.x -= w + 2 * margin;
          if (a.y < -margin) a.y += h + 2 * margin; else if (a.y > h + margin) a.y -= h + 2 * margin;
        }
      }
      for (i = 0; i < nodes.length; i++) a = nodes[i], a.f = edgeFade(a);
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (a.f <= 0) continue;
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          if (b.f <= 0) continue;
          var dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            ctx.strokeStyle = "rgba(" + a.c + "," + (0.16 * (1 - d / linkDist) * Math.min(a.f, b.f)).toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        // gentle pull-in of links toward the cursor
        var mx = a.x - mouse.x, my = a.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
        if (md < 180) {
          ctx.strokeStyle = "rgba(" + a.c + "," + (0.22 * (1 - md / 180) * a.f).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        var pulse = reduceMotion ? 1 : 1 + Math.sin(t / 900 + a.p) * .25;
        ctx.fillStyle = "rgba(" + a.c + "," + (.55 * a.f).toFixed(3) + ")";
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
