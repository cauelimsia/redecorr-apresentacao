/* RedeCORR · Apresentação institucional CORE5®
   Navegação de deck, índice navegável e animações GSAP.
   Sem GSAP (CDN fora do ar) ou com prefers-reduced-motion, o deck
   continua navegável: os slides aparecem no estado final. */

(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  const dotsWrap = document.querySelector("[data-dots]");
  const currentEl = document.querySelector("[data-current]");
  const totalEl = document.querySelector("[data-total]");
  const progressEl = document.querySelector("[data-progress]");
  const chapterNameEl = document.querySelector("[data-chapter-name]");
  const trackerSegs = Array.from(document.querySelectorAll(".core-tracker__seg"));
  const indexOverlay = document.querySelector("[data-index]");
  const indexList = document.querySelector("[data-index-list]");
  const bgEl = document.getElementById("bg");

  const hasGsap = typeof window.gsap !== "undefined";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = hasGsap && !reduced;

  // Slide de cada pilar, para acender o tracker CORE5 no HUD
  const pilarIndex = {};
  slides.forEach((s, i) => {
    if (s.dataset.pilar) pilarIndex[s.dataset.pilar] = i;
  });

  let index = 0;
  let busy = false;

  totalEl.textContent = String(total).padStart(2, "0");

  /* ---------- Índice ---------- */

  const indexButtons = [];
  let lastChapter = null;

  slides.forEach((s, i) => {
    const chapter = s.dataset.chapter || "Apresentação";
    if (chapter !== lastChapter) {
      const h = document.createElement("p");
      h.className = "index-chapter";
      h.textContent = chapter;
      indexList.appendChild(h);
      lastChapter = chapter;
    }
    const b = document.createElement("button");
    b.className = "index-item";
    b.type = "button";
    const num = document.createElement("span");
    num.className = "index-item__num";
    num.textContent = String(i + 1).padStart(2, "0");
    b.appendChild(num);
    b.appendChild(document.createTextNode(s.dataset.title || `Slide ${i + 1}`));
    b.addEventListener("click", () => {
      closeIndex();
      go(i);
    });
    indexList.appendChild(b);
    indexButtons.push(b);
  });

  function openIndex() {
    indexOverlay.hidden = false;
    indexButtons.forEach((b, k) => b.classList.toggle("is-current", k === index));
    const cur = indexButtons[index];
    if (cur) cur.scrollIntoView({ block: "center" });
    if (animate) {
      gsap.fromTo(
        indexOverlay.querySelector(".index-panel"),
        { autoAlpha: 0, y: 24, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out" }
      );
    }
  }

  function closeIndex() {
    indexOverlay.hidden = true;
  }

  function toggleIndex() {
    indexOverlay.hidden ? openIndex() : closeIndex();
  }

  document.querySelector("[data-menu]").addEventListener("click", toggleIndex);
  document.querySelector("[data-index-close]").addEventListener("click", closeIndex);
  indexOverlay.addEventListener("click", (e) => {
    if (e.target === indexOverlay) closeIndex();
  });

  /* ---------- Dots ---------- */

  slides.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "dot";
    b.type = "button";
    b.setAttribute("aria-label", `Ir para: ${s.dataset.title || "slide " + (i + 1)}`);
    b.addEventListener("click", () => go(i));
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.children);

  /* ---------- Atalhos da agenda ---------- */

  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", () => go(parseInt(el.dataset.goto, 10) - 1));
  });

  /* ---------- HUD ---------- */

  function pad(n) {
    return String(n + 1).padStart(2, "0");
  }

  function updateHud(i) {
    currentEl.textContent = pad(i);
    dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
    indexButtons.forEach((b, k) => b.classList.toggle("is-current", k === i));
    const light = slides[i].classList.contains("slide--light");
    document.body.classList.toggle("theme-light", light);
    // a cor do slide mora na camada de fundo, atrás da cena 3D
    if (bgEl) bgEl.style.backgroundColor = light ? "#f7f7f8" : "#0b1f33";
    chapterNameEl.textContent = slides[i].dataset.chapter || "";
    trackerSegs.forEach((seg) => {
      const at = pilarIndex[seg.dataset.seg];
      seg.classList.toggle("is-on", at !== undefined && at <= i);
    });
    if (animate) {
      gsap.to(progressEl, { scaleX: (i + 1) / total, duration: 0.5, ease: "power2.out" });
    } else {
      progressEl.style.transform = `scaleX(${(i + 1) / total})`;
    }
    // avisa a cena WebGL qual formação este slide pede (fx.js pode não existir)
    if (window.RCFX) window.RCFX.setSlide(slides[i]);
    renderPresenter();
    history.replaceState(null, "", "#" + (i + 1));
  }

  /* ---------- Animações de entrada ---------- */

  function formatNumber(v, decimals) {
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function enterAnimations(slide, tl) {
    // Títulos entram por cortina (o texto é descoberto de cima para baixo),
    // o resto sobe. Separar os dois evita que tudo pareça o mesmo movimento.
    const heads = Array.from(slide.querySelectorAll(".display[data-r]"));
    const reveals = Array.from(slide.querySelectorAll("[data-r]")).filter(
      (el) => !heads.includes(el)
    );

    if (heads.length) {
      tl.fromTo(
        heads,
        { clipPath: "inset(0 0 106% 0)", y: 14 },
        {
          clipPath: "inset(0 0 -6% 0)",
          y: 0,
          autoAlpha: 1,
          duration: 1.05,
          stagger: 0.1,
          ease: "power3.out",
        },
        0.12
      );
    }

    if (reveals.length) {
      tl.fromTo(
        reveals,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.62, stagger: 0.065, ease: "power2.out" },
        0.2
      );
    }

    playPipeline(slide, tl);
    playChat(slide, tl);

    // Numeral gigante dos divisores de capítulo
    const chapterNum = slide.querySelector(".chapter__num");
    if (chapterNum) {
      tl.fromTo(
        chapterNum,
        { scale: 1.25, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 1, ease: "power3.out" },
        0.1
      );
    }

    // Riscado do slide de posicionamento
    const strike = slide.querySelector(".strike");
    if (strike) {
      tl.call(() => strike.classList.add("is-struck"), null, 0.9);
    }

    // Pentágono grande e rede da capa: só os cinco nós acendem, em sequência
    slide.querySelectorAll(".core-pent, .cover-net").forEach((svg) => {
      const nodes = svg.querySelectorAll(".net-nodes circle, .pent-node");
      if (nodes.length) {
        tl.fromTo(
          nodes,
          { scale: 0, transformOrigin: "center" },
          { scale: 1, duration: 0.45, stagger: 0.07, ease: "power2.out" },
          0.55
        );
      }
      const labels = svg.querySelectorAll(".pent-label");
      if (labels.length) {
        tl.fromTo(labels, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.07 }, 1);
      }
    });

    // Mini pentágono dos pilares: acende o nó do pilar atual
    const mini = slide.querySelector(".mini-pent");
    if (mini) {
      const n = parseInt(mini.dataset.node, 10);
      const dot = mini.querySelectorAll(".mp-dot")[n - 1];
      if (dot) {
        tl.call(() => dot.classList.add("is-on"), null, 0.5);
        tl.fromTo(
          dot,
          { scale: 0.4, transformOrigin: "center" },
          { scale: 1, duration: 0.45, ease: "power2.out" },
          0.5
        );
      }
    }

    // Contadores (inteiros e decimais)
    slide.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const obj = { v: 0 };
      tl.to(
        obj,
        {
          v: target,
          duration: 1.3,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = formatNumber(obj.v, decimals);
          },
        },
        0.55
      );
    });

    // Barras do dashboard
    const bars = slide.querySelectorAll("[data-bar]");
    if (bars.length) {
      tl.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.7, stagger: 0.09, ease: "power3.out" }, 0.6);
    }

    // Chat: mensagens em sequência, como numa conversa real
    slide.querySelectorAll("[data-chat]").forEach((chat) => {
      tl.fromTo(
        chat.querySelectorAll(".msg"),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.55, ease: "power2.out" },
        0.6
      );
    });
  }

  /* ---------- mockups que se movem ---------- */

  // O CRM é o argumento central: em vez de uma captura parada, um lead
  // atravessa o funil de verdade enquanto o slide é apresentado.
  function playPipeline(slide, tl) {
    const pipe = slide.querySelector(".pipe");
    if (!pipe) return;
    const card = pipe.querySelector(".lcard--hot");
    const target = pipe.querySelector(".lcard--won");
    if (!card || !target) return;

    gsap.set([card, target], { clearProps: "transform,opacity" });

    // cards que ficam abaixo do que sai, para fechar o buraco na coluna
    const below = [];
    let sib = card.nextElementSibling;
    while (sib) {
      if (sib.classList.contains("lcard")) below.push(sib);
      sib = sib.nextElementSibling;
    }
    gsap.set(below, { clearProps: "transform" });

    tl.call(
      () => {
        const a = card.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        const gap = a.height + 6.4; // altura do card + margem
        gsap
          .timeline()
          .to(card, { scale: 1.04, duration: 0.25, ease: "power2.out" })
          .to(card, {
            x: b.left - a.left,
            y: b.top - a.top,
            duration: 0.85,
            ease: "power3.inOut",
          })
          .to(card, { autoAlpha: 0, scale: 0.96, duration: 0.3 }, "-=0.15")
          .to(below, { y: -gap, duration: 0.45, ease: "power2.inOut" }, "-=0.5")
          .fromTo(
            target,
            { autoAlpha: 0.3, scale: 0.97 },
            { autoAlpha: 1, scale: 1, duration: 0.45, ease: "power2.out" },
            "-=0.4"
          );
      },
      null,
      1.9
    );
  }

  // A Academia vende simulação de conversa: mostrar o "digitando" antes
  // da resposta faz a tela parecer o produto, não um print.
  function playChat(slide, tl) {
    slide.querySelectorAll("[data-chat]").forEach((chat) => {
      const typing = chat.querySelector(".typing");
      if (!typing) return;
      tl.set(typing, { autoAlpha: 0 }, 0)
        .to(typing, { autoAlpha: 1, duration: 0.25 }, 1.0)
        .to(typing, { autoAlpha: 0, duration: 0.2 }, 1.85);
    });
  }

  function setFinalState(slide) {
    slide.querySelectorAll("[data-r], .msg, .pent-label").forEach((el) => {
      el.style.opacity = "";
      el.style.visibility = "";
      el.style.transform = "";
      el.style.clipPath = "";
    });
    slide.querySelectorAll("[data-count]").forEach((el) => {
      el.textContent = formatNumber(
        parseFloat(el.dataset.count),
        parseInt(el.dataset.decimals || "0", 10)
      );
    });
    const strike = slide.querySelector(".strike");
    if (strike) strike.classList.add("is-struck");
    const mini = slide.querySelector(".mini-pent");
    if (mini) {
      const dot = mini.querySelectorAll(".mp-dot")[parseInt(mini.dataset.node, 10) - 1];
      if (dot) dot.classList.add("is-on");
    }
  }

  /* ---------- Modo apresentador ---------- */

  // Quem apresenta precisa de roteiro, tempo e o que vem a seguir.
  // Fica só na tela de quem conduz: a plateia nunca vê.
  const presenter = {
    el: document.querySelector("[data-presenter]"),
    open: false,
    startedAt: null,
    timerId: null,
  };

  function fmtClock(ms) {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  function renderPresenter() {
    if (!presenter.el || !presenter.open) return;
    const cur = slides[index];
    const nxt = slides[index + 1];
    presenter.el.querySelector("[data-p-now]").textContent = `${pad(index)} · ${
      cur.dataset.title || ""
    }`;
    presenter.el.querySelector("[data-p-next]").textContent = nxt
      ? `${pad(index + 1)} · ${nxt.dataset.title || ""}`
      : "— fim da apresentação —";
    presenter.el.querySelector("[data-p-notes]").textContent =
      cur.dataset.notes || "Sem roteiro para este slide.";
    presenter.el.querySelector("[data-p-chapter]").textContent = cur.dataset.chapter || "";
  }

  function togglePresenter() {
    if (!presenter.el) return;
    presenter.open = !presenter.open;
    presenter.el.hidden = !presenter.open;
    document.body.classList.toggle("presenting", presenter.open);

    if (presenter.open) {
      if (!presenter.startedAt) presenter.startedAt = Date.now();
      const clock = presenter.el.querySelector("[data-p-time]");
      presenter.timerId = setInterval(() => {
        clock.textContent = fmtClock(Date.now() - presenter.startedAt);
      }, 1000);
      clock.textContent = fmtClock(Date.now() - presenter.startedAt);
      renderPresenter();
    } else {
      clearInterval(presenter.timerId);
    }
  }

  if (presenter.el) {
    presenter.el.querySelector("[data-p-close]").addEventListener("click", togglePresenter);
    presenter.el.querySelector("[data-p-reset]").addEventListener("click", () => {
      presenter.startedAt = Date.now();
      presenter.el.querySelector("[data-p-time]").textContent = "00:00";
    });
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

    tl.to(from, { autoAlpha: 0, y: -14 * dir, duration: 0.34, ease: "power2.in" }, 0);
    to.classList.add("is-active");
    tl.fromTo(
      to,
      { autoAlpha: 0, y: 32 * dir },
      { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
      0.24
    );
    enterAnimations(to, tl);
  }

  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  /* ---------- Inputs ---------- */

  document.querySelector("[data-next]").addEventListener("click", next);
  document.querySelector("[data-prev]").addEventListener("click", prev);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      toggleIndex();
      return;
    }
    if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      togglePresenter();
      return;
    }
    if (!indexOverlay.hidden) return;

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
      if (!indexOverlay.hidden) return;
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
      if (touchX === null || !indexOverlay.hidden) return;
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
