/* ==========================================================================
   SAPSAN LOGISTICS INC — Interactions
   Vanilla JS + GSAP/ScrollTrigger + Lenis (all vendored in /assets/js)
   ========================================================================== */
(() => {
  const html = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  // Anchor links scroll smoothly (and respect fixed header)
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -120, duration: 1.4 });
      else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------- Header: hide on scroll down, solid after hero ---------- */
  const header = $(".header");
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 40);
      const menuOpen = html.classList.contains("menu-open");
      header.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY + 2);
      if (y < lastY - 2) header.classList.remove("is-hidden");
    }
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $(".burger");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = html.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", String(open));
      $(".mmenu")?.setAttribute("aria-hidden", String(!open));
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && html.classList.contains("menu-open")) burger.click();
    });
  }

  /* ---------- Live Moncton clock ---------- */
  const clocks = $$("[data-clock]");
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Moncton", hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" });
    const tick = () => {
      const parts = fmt.formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t)?.value || "";
      const tz = get("timeZoneName").replace("GMT-3", "ADT").replace("GMT-4", "AST");
      clocks.forEach((c) => (c.textContent = `${get("hour")}:${get("minute")} ${tz}`));
    };
    tick();
    setInterval(tick, 15000);
  }

  /* ---------- Year ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Copy to clipboard ---------- */
  $$("[data-copy]").forEach((b) => {
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        const t = b.textContent;
        b.textContent = "Copied";
        setTimeout(() => (b.textContent = t), 1600);
      } catch (_) { /* clipboard unavailable */ }
    });
  });

  /* ---------- Page transitions ---------- */
  const curtain = $(".curtain");
  if (curtain && !reduce) {
    if (html.classList.contains("from-transition")) {
      requestAnimationFrame(() => {
        curtain.style.transition = "transform .8s cubic-bezier(.76,0,.24,1)";
        curtain.style.transform = "translateY(-100%)";
        html.classList.remove("from-transition");
      });
    }
    $$("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || a.target === "_blank" || /^https?:/.test(href)) return;
      if (!/\.html(#.*)?$/.test(href) && href !== "./" && href !== "/") return;
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        try { sessionStorage.setItem("sapsan-tx", "1"); } catch (_) {}
        curtain.style.transition = "";
        curtain.style.transform = "";
        curtain.classList.add("is-in");
        setTimeout(() => (window.location.href = a.href), 560);
      });
    });
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) { curtain.classList.remove("is-in"); curtain.style.transform = "translateY(100%)"; }
    });
  }

  /* ---------- Text splitting ---------- */
  const splitLines = (el) => {
    // wrap words, measure, regroup into masked lines
    const nodes = [...el.childNodes];
    const words = [];
    el.innerHTML = "";
    nodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { el.appendChild(document.createTextNode(" ")); return; }
          const s = document.createElement("span");
          s.textContent = t;
          s.style.display = "inline-block";
          el.appendChild(s); words.push(s);
        });
      } else if (n.nodeName === "BR") {
        el.appendChild(n); words.push(n);
      } else {
        n.style.display = "inline-block";
        el.appendChild(n); words.push(n);
      }
    });
    const lines = [];
    let top = null, cur = null;
    words.forEach((w) => {
      if (w.nodeName === "BR") { top = null; return; }
      const t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { cur = []; lines.push(cur); top = t; }
      cur.push(w);
    });
    el.innerHTML = "";
    lines.forEach((ws) => {
      const line = document.createElement("span");
      line.className = "line";
      const inner = document.createElement("span");
      ws.forEach((w, i) => { inner.appendChild(w); if (i < ws.length - 1) inner.appendChild(document.createTextNode(" ")); });
      line.appendChild(inner);
      el.appendChild(line);
    });
    return $$(".line > span", el);
  };

  const ready = () => new Promise((res) => {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(res); else res();
  });

  /* ---------- Loader ---------- */
  const runLoader = () => new Promise((resolve) => {
    const loader = $(".loader");
    if (!loader || html.classList.contains("no-loader") || reduce || !hasGSAP) {
      loader?.remove();
      return resolve();
    }
    try { sessionStorage.setItem("sapsan-loaded", "1"); } catch (_) {}
    const km = $(".loader__km span", loader);
    const bar = $(".loader__bar i", loader);
    const o = { v: 0 };
    gsap.to(o, {
      v: 1460, duration: 1.5, ease: "power3.inOut",
      onUpdate: () => {
        km.textContent = Math.round(o.v).toLocaleString("en-CA");
        bar.style.transform = `scaleX(${o.v / 1460})`;
      },
      onComplete: () => {
        loader.classList.add("is-done");
        setTimeout(resolve, 260);
        setTimeout(() => loader.remove(), 1100);
      },
    });
  });

  /* ---------- Main animation boot ---------- */
  ready().then(runLoader).then(() => {
    if (!hasGSAP || reduce) {
      $$("[data-reveal],[data-clip]").forEach((el) => el.classList.add("is-in"));
      $$(".manifesto__text").forEach((m) => m.querySelectorAll(".w").forEach((w) => w.classList.add("on")));
      initStatic();
      return;
    }

    // Headline line reveals
    $$("[data-split]").forEach((el) => {
      const inner = splitLines(el);
      const isHero = el.closest(".hero, .phero");
      gsap.set(inner, { yPercent: 115 });
      const anim = () => gsap.to(inner, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.09, delay: isHero ? 0.05 : 0 });
      if (isHero) anim();
      else ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: anim });
    });

    // Hero intro bits
    const hero = $(".hero, .phero");
    if (hero) {
      gsap.from($$("[data-hero-fade]", hero), { y: 24, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.08, delay: 0.35 });
      const heroImg = $(".hero__media img");
      if (heroImg) {
        gsap.fromTo(heroImg, { scale: 1.18 }, { scale: 1.04, duration: 2.6, ease: "expo.out" });
        gsap.to(heroImg, { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".hero__title", { yPercent: -18, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      }
    }

    // Generic reveals
    $$("[data-reveal],[data-clip]").forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => el.classList.add("is-in") });
    });

    // Parallax media
    $$("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 12;
      gsap.fromTo(el, { yPercent: -amt }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Manifesto word lighting
    $$(".manifesto__text").forEach((m) => {
      const ws = $$(".w", m);
      ScrollTrigger.create({
        trigger: m, start: "top 78%", end: "bottom 45%", scrub: true,
        onUpdate: (st) => {
          const n = Math.round(st.progress * ws.length);
          ws.forEach((w, i) => w.classList.toggle("on", i < n));
        },
      });
    });

    // Counters
    $$("[data-count]").forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: () => gsap.to(o, { v: end, duration: 2, ease: "power3.out", onUpdate: () => (el.firstChild.nodeValue = Math.round(o.v).toLocaleString("en-CA")) }),
      });
    });

    // Horizontal services
    const hs = $(".hs");
    if (hs) {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 641px)", () => {
        const track = $(".hs__track", hs);
        const bar = $(".hs__progress i", hs);
        const dist = () => track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(track).paddingLeft);
        const tw = gsap.to(track, {
          x: () => -dist(), ease: "none",
          scrollTrigger: {
            trigger: hs, pin: ".hs__pin", start: "top top", end: () => "+=" + dist(), scrub: 0.8, invalidateOnRefresh: true,
            onUpdate: (st) => (bar.style.transform = `scaleX(${st.progress})`),
          },
        });
        return () => tw.kill();
      });
      mm.add("(max-width: 640px)", () => {
        const track = $(".hs__track", hs);
        const wrap = track.parentElement;
        wrap.style.overflowX = "auto";
        wrap.style.scrollSnapType = "x mandatory";
        $$(".scard", track).forEach((c) => (c.style.scrollSnapAlign = "start"));
        track.style.paddingRight = "16px";
        const bar = $(".hs__progress i", hs);
        const upd = () => (bar.style.transform = `scaleX(${wrap.scrollLeft / (wrap.scrollWidth - wrap.clientWidth || 1)})`);
        wrap.addEventListener("scroll", upd, { passive: true });
        return () => { wrap.removeEventListener("scroll", upd); wrap.style.overflowX = ""; };
      });
    }

    // Process rail
    const steps = $(".steps");
    if (steps) {
      gsap.to(".steps__rail i", { scaleY: 1, ease: "none", scrollTrigger: { trigger: steps, start: "top 60%", end: "bottom 60%", scrub: true } });
      $$(".step", steps).forEach((s) => ScrollTrigger.create({ trigger: s, start: "top 62%", onToggle: (st) => s.classList.toggle("is-on", st.isActive || st.progress > 0), end: "max" }));
    }

    // Footer wordmark letters
    const word = $(".footer__word");
    if (word) {
      const letters = word.textContent.split("");
      word.innerHTML = letters.map((l) => `<span>${l}</span>`).join("");
      gsap.from($$("span", word), { yPercent: 60, opacity: 0, stagger: 0.06, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: word, start: "top 98%" } });
    }

    initStatic();
    window.addEventListener("load", () => ScrollTrigger.refresh());
  });

  /* ---------- Things that work with or without GSAP ---------- */
  function initStatic() {
    initMap();
    initIndustries();
    initMagnetic();
    initSubnav();
    initForms();
  }

  /* ---------- Lane map ---------- */
  function initMap() {
    const svg = $("#laneMap");
    if (!svg || !window.SAPSAN_LANES) return;
    const NS = "http://www.w3.org/2000/svg";
    const { hub, cities } = window.SAPSAN_LANES;
    const arcs = $("#arcs", svg), dots = $("#cities", svg);
    const readKm = $("[data-readout-km]"), readCity = $("[data-readout-city]");
    const byName = {};

    cities.forEach((c) => {
      const [x, y] = c.xy;
      const dx = x - hub[0], dy = y - hub[1];
      const dist = Math.hypot(dx, dy);
      // bow arcs northward for a flight-path feel
      const cx = (x + hub[0]) / 2 + dy * 0.18 - (dist > 300 ? 0 : 0);
      const cy = (y + hub[1]) / 2 - Math.abs(dx) * 0.22 - dist * 0.06;
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", `M${hub[0]},${hub[1]} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x},${y}`);
      p.setAttribute("class", "arc");
      arcs.appendChild(p);
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;

      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", c.minor ? "city minor" : "city");
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", x); dot.setAttribute("cy", y); dot.setAttribute("r", 4);
      g.appendChild(dot);
      {
        const t = document.createElementNS(NS, "text");
        const left = c.anchor === "end";
        t.setAttribute("x", x + (left ? -10 : 10)); t.setAttribute("y", y + 4);
        if (left) t.setAttribute("text-anchor", "end");
        t.textContent = c.name.toUpperCase();
        g.appendChild(t);
      }
      dots.appendChild(g);
      byName[c.name] = { path: p, g, len, c };
    });

    // moving "trucks" along a few arcs
    const movers = cities.filter((c) => c.mover);
    movers.forEach((c, i) => {
      const d = byName[c.name].path.getAttribute("d");
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", 2.6); dot.setAttribute("class", "truck-dot");
      const am = document.createElementNS(NS, "animateMotion");
      am.setAttribute("dur", `${4 + i * 0.8}s`); am.setAttribute("repeatCount", "indefinite");
      am.setAttribute("path", d); am.setAttribute("begin", `${i * 0.6}s`);
      if (i % 2) { am.setAttribute("keyPoints", "1;0"); am.setAttribute("keyTimes", "0;1"); am.setAttribute("calcMode", "linear"); }
      dot.appendChild(am);
      $("#movers", svg).appendChild(dot);
    });

    const draw = () => {
      Object.values(byName).forEach(({ path }, i) => {
        path.style.transition = `stroke-dashoffset 1.6s cubic-bezier(.22,1,.36,1) ${i * 0.06}s, stroke .3s, stroke-width .3s`;
        path.style.strokeDashoffset = "0";
      });
    };
    if ("IntersectionObserver" in window && !reduce) {
      const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { draw(); io.disconnect(); } }, { threshold: 0.3 });
      io.observe(svg);
    } else draw();

    const btns = $$(".lane[data-city]");
    const activate = (name) => {
      Object.values(byName).forEach(({ path, g }) => { path.classList.remove("is-active"); g.classList.remove("is-active"); });
      btns.forEach((b) => b.classList.toggle("is-active", b.dataset.city === name));
      const it = byName[name];
      if (!it) return;
      it.path.classList.add("is-active"); it.g.classList.add("is-active");
      arcs.appendChild(it.path);
      if (readCity) readCity.textContent = `Moncton → ${it.c.name}`;
      if (readKm) {
        const end = it.c.km;
        if (hasGSAP && !reduce) {
          const o = { v: parseInt(readKm.dataset.v || "0", 10) };
          gsap.to(o, { v: end, duration: 0.8, ease: "power3.out", onUpdate: () => (readKm.firstChild.nodeValue = "≈ " + Math.round(o.v).toLocaleString("en-CA") + " ") });
        } else readKm.firstChild.nodeValue = "≈ " + end.toLocaleString("en-CA") + " ";
        readKm.dataset.v = end;
      }
    };
    let auto = true, idx = 0;
    const order = btns.map((b) => b.dataset.city);
    btns.forEach((b) => {
      const go = () => { auto = false; activate(b.dataset.city); };
      b.addEventListener("mouseenter", go);
      b.addEventListener("focus", go);
      b.addEventListener("click", go);
    });
    activate(order[0]);
    setInterval(() => {
      if (!auto || document.hidden) return;
      idx = (idx + 1) % order.length;
      activate(order[idx]);
    }, 2600);
  }

  /* ---------- Industries hover image ---------- */
  function initIndustries() {
    const list = $(".ind");
    const fl = $(".ind__float");
    if (!list || !fl || !fine) return;
    const imgs = $$("img", fl);
    let x = 0, y = 0, cx = 0, cy = 0, on = false;
    $$(".ind__row", list).forEach((r, i) => {
      r.addEventListener("mouseenter", () => { imgs.forEach((im, j) => im.classList.toggle("is-on", j === i)); });
    });
    list.addEventListener("mouseenter", () => { on = true; fl.classList.add("is-on"); });
    list.addEventListener("mouseleave", () => { on = false; fl.classList.remove("is-on"); });
    window.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    const loop = () => {
      cx += (x - cx) * 0.14; cy += (y - cy) * 0.14;
      fl.style.left = cx + 120 + "px";
      fl.style.top = cy + "px";
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (!fine || reduce) return;
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * 0.22;
        const dy = (e.clientY - r.top - r.height / 2) * 0.32;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .7s cubic-bezier(.22,1,.36,1), color .5s";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 700);
      });
    });
  }

  /* ---------- Services subnav ---------- */
  function initSubnav() {
    const links = $$(".subnav a");
    if (!links.length) return;
    const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.remove("is-active"));
        const a = map.get(e.target.id);
        if (a) { a.classList.add("is-active"); a.scrollIntoView({ block: "nearest", inline: "center" }); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Forms (static site: compose an email) ---------- */
  function initForms() {
    $$("[data-qform]").forEach((wrap) => {
      const form = $("form", wrap);
      const panes = $$(".qform__pane", wrap);
      const tabs = $$(".qform__steps button", wrap);
      const prev = $("[data-prev]", wrap), next = $("[data-next]", wrap), submit = $("[data-submit]", wrap);
      let i = 0;
      const show = (n) => {
        i = Math.max(0, Math.min(panes.length - 1, n));
        panes.forEach((p, j) => p.classList.toggle("is-on", j === i));
        tabs.forEach((t, j) => { t.classList.toggle("is-on", j <= i); t.setAttribute("aria-current", j === i ? "step" : "false"); });
        if (prev) prev.style.visibility = i === 0 ? "hidden" : "visible";
        if (next) next.style.display = i === panes.length - 1 ? "none" : "";
        if (submit) submit.style.display = i === panes.length - 1 ? "" : "none";
      };
      const valid = (n) => $$("input,select,textarea", panes[n]).every((f) => f.reportValidity());
      if (panes.length > 1) {
        show(0);
        next?.addEventListener("click", () => { if (valid(i)) show(i + 1); });
        prev?.addEventListener("click", () => show(i - 1));
        tabs.forEach((t, j) => t.addEventListener("click", () => { if (j < i || valid(i)) show(j); }));
      }
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const lines = [];
        const seen = {};
        for (const [k, v] of fd.entries()) {
          if (!v) continue;
          const label = form.querySelector(`[name="${k}"]`)?.dataset.label || k;
          seen[label] = seen[label] ? seen[label] + ", " + v : v;
        }
        Object.entries(seen).forEach(([k, v]) => lines.push(`${k}: ${v}`));
        const to = form.dataset.to || "info.sapsanlogistics@gmail.com";
        const cc = form.dataset.cc ? `&cc=${encodeURIComponent(form.dataset.cc)}` : "";
        const subj = encodeURIComponent(form.dataset.subject || "Website enquiry");
        window.location.href = `mailto:${to}?subject=${subj}${cc}&body=${encodeURIComponent(lines.join("\n"))}`;
        wrap.classList.add("is-sent");
      });
    });
  }
})();
