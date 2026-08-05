/* RedeCORR · Apresentação CORE5®
   Navegação de deck + animações GSAP (fallback sem animação se o CDN falhar). */

(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  const dotsWrap = document.querySelector("[data-dots]");
  const currentEl = document.querySelector("[data-current]");
  const totalEl = document.querySelector("[data-total]");
  const progressEl = document.querySelector("[data-progress]");
  const trackerSegs = Array.from(document.querySelectorAll(".core-tracker__seg"));

  const hasGsap = typeof window.gsap !== "undefined";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = hasGsap && !reduced;

  // Índice do slide de cada pilar (para o tracker CORE5)
  const pilarIndex = {};
  slides.forEach((s, i) => {
    if (s.dataset.pilar) pilarIndex[s.dataset.pilar] = i;
  });

  let index = 0;
  let busy = false;

  totalEl.textContent = String(total).padStart(2, "0");

  // Dots
  slides.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "dot";
    b.type = "button";
    b.setAttribute("aria-label", `Ir para: ${s.dataset.title || "slide " + (i + 1)}`);
    b.addEventListener("click", () => go(i));
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.children);

  function pad(n) {
    return String(n + 1).padStart(2, "0");
  }

  function updateHud(i) {
    currentEl.textContent = pad(i);
    dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
    document.body.classList.toggle("theme-light", slides[i].classList.contains("slide--light"));
    trackerSegs.forEach((seg) => {
      const at = pilarIndex[seg.dataset.seg];
      seg.classList.toggle("is-on", at !== undefined && at <= i);
    });
    if (animate) {
      gsap.to(progressEl, { scaleX: (i + 1) / total, duration: 0.5, ease: "power2.out" });
    } else {
      progressEl.style.transform = `scaleX(${(i + 1) / total})`;
    }
    history.replaceState(null, "", "#" + (i + 1));
  }

  /* ---------- Animações de entrada por slide ---------- */

  function prepLines(svg) {
    svg.querySelectorAll(".net-lines line").forEach((ln) => {
      const len = Math.hypot(
        ln.x2.baseVal.value - ln.x1.baseVal.value,
        ln.y2.baseVal.value - ln.y1.baseVal.value
      );
      ln.style.strokeDasharray = len;
      ln.style.strokeDashoffset = len;
    });
  }

  function enterAnimations(slide, tl) {
    const reveals = slide.querySelectorAll("[data-r]");
    if (reveals.length) {
      tl.fromTo(
        reveals,
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.09, ease: "power3.out" },
        0.15
      );
    }

    // Riscado "Isso não é uma assessoria."
    const strike = slide.querySelector(".strike");
    if (strike) {
      tl.call(() => strike.classList.add("is-struck"), null, 0.9);
    }

    // Pentágono / rede: desenha linhas e pulsa nós
    slide.querySelectorAll(".core-pent, .cover-net").forEach((svg) => {
      prepLines(svg);
      tl.to(
        svg.querySelectorAll(".net-lines line"),
        { strokeDashoffset: 0, duration: 1.1, stagger: 0.06, ease: "power2.inOut" },
        0.3
      );
      const nodes = svg.querySelectorAll(".net-nodes circle, .pent-node");
      if (nodes.length) {
        tl.fromTo(
          nodes,
          { scale: 0, transformOrigin: "center" },
          { scale: 1, duration: 0.5, stagger: 0.08, ease: "back.out(2)" },
          0.55
        );
      }
      const labels = svg.querySelectorAll(".pent-label");
      if (labels.length) {
        tl.fromTo(labels, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.07 }, 1);
      }
    });

    // Contadores
    slide.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const obj = { v: 0 };
      tl.to(
        obj,
        {
          v: target,
          duration: 1.3,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString("pt-BR");
          },
        },
        0.55
      );
    });

    // Barras do dashboard
    const bars = slide.querySelectorAll("[data-bar]");
    if (bars.length) {
      tl.fromTo(
        bars,
        { scaleY: 0 },
        { scaleY: 1, duration: 0.7, stagger: 0.09, ease: "power3.out" },
        0.6
      );
    }

    // Chat: mensagens em sequência
    slide.querySelectorAll("[data-chat]").forEach((chat) => {
      const msgs = chat.querySelectorAll(".msg");
      tl.fromTo(
        msgs,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.55, ease: "power2.out" },
        0.6
      );
    });
  }

  function setFinalState(slide) {
    // Sem animação: garante tudo visível e valores finais
    slide.querySelectorAll("[data-r], .msg, .pent-label").forEach((el) => {
      el.style.opacity = "";
      el.style.visibility = "";
      el.style.transform = "";
    });
    slide.querySelectorAll("[data-count]").forEach((el) => {
      el.textContent = parseInt(el.dataset.count, 10).toLocaleString("pt-BR");
    });
    const strike = slide.querySelector(".strike");
    if (strike) strike.classList.add("is-struck");
  }

  /* ---------- Troca de slide ---------- */

  function go(next) {
    if (next === index || next < 0 || next >= total || busy) return;
    const from = slides[index];
    const to = slides[next];
    const dir = next > index ? 1 : -1;
    index = next;
    updateHud(next);

    if (!animate) {
      from.classList.remove("is-active");
      to.classList.add("is-active");
      setFinalState(to);
      return;
    }

    busy = true;
    const tl = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        busy = false;
        from.classList.remove("is-active");
        gsap.set(from, { clearProps: "all" });
      },
    });

    tl.to(from, { autoAlpha: 0, scale: 0.97, y: -18 * dir, duration: 0.4, ease: "power2.in" }, 0);
    to.classList.add("is-active");
    tl.fromTo(
      to,
      { autoAlpha: 0, y: 46 * dir, scale: 1.01 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" },
      0.28
    );
    enterAnimations(to, tl);
  }

  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  /* ---------- Inputs ---------- */

  document.querySelector("[data-next]").addEventListener("click", next);
  document.querySelector("[data-prev]").addEventListener("click", prev);

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      go(0);
    } else if (e.key === "End") {
      go(total - 1);
    }
  });

  let wheelLock = 0;
  window.addEventListener(
    "wheel",
    (e) => {
      const now = Date.now();
      if (now - wheelLock < 1100 || Math.abs(e.deltaY) < 24) return;
      wheelLock = now;
      e.deltaY > 0 ? next() : prev();
    },
    { passive: true }
  );

  let touchX = null;
  window.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  window.addEventListener(
    "touchend",
    (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 48) return;
      dx < 0 ? next() : prev();
    },
    { passive: true }
  );

  window.addEventListener("hashchange", () => {
    const n = parseInt((location.hash || "").replace("#", ""), 10);
    if (!isNaN(n) && n >= 1 && n <= total && n - 1 !== index) go(n - 1);
  });

  /* ---------- Início ---------- */

  const fromHash = parseInt((location.hash || "").replace("#", ""), 10);
  if (!isNaN(fromHash) && fromHash >= 1 && fromHash <= total) index = fromHash - 1;

  const first = slides[index];
  first.classList.add("is-active");
  updateHud(index);

  if (animate) {
    const tl = gsap.timeline();
    tl.fromTo(first, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0);
    enterAnimations(first, tl);
  } else {
    setFinalState(first);
  }
})();
