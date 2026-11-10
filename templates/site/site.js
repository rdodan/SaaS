// Behaviour for the client-site template. Works on markup produced by render.js,
// whether it was rendered here in the browser or exported to static HTML.
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function start(site) {
    if (!document.body.dataset.prerendered) {
      const style = document.createElement("style");
      style.textContent = SiteRender.themeCss(site);
      document.head.append(style);
      const fonts = SiteRender.fontsUrl(site);
      if (fonts) document.head.append(Object.assign(document.createElement("link"), { rel: "stylesheet", href: fonts }));
      document.title = (site.hero && site.hero.title ? site.hero.title + " | " : "") + site.business.name;
      $("#app").innerHTML = SiteRender.render(site);
    }
    document.documentElement.classList.add("js");
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
    film(site);
    reveal();
    beforeAfter();
    areas(site);
    wizard(site);
    chat(site);
    phones(site);
  }

  // ---------- scroll-driven opening ----------

  function film(site) {
    const section = $(".film");
    if (!section) return;
    const slides = $$(".slide", section);
    const images = $$(".film-img", section);
    const canvas = $(".film-canvas", section);
    const ctx = canvas.getContext("2d");
    const bar = $(".bar");
    const count = slides.length;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#f2a900";
    const rgb = hexToRgb(accent);
    let progress = 0;
    let visible = true;

    // Optional image sequence: frames named by pattern, drawn one per scroll position.
    const seqCount = Number(section.dataset.seqCount) || 0;
    const frames = [];
    if (seqCount) {
      const pad = Number(section.dataset.seqPad) || 0;
      for (let i = 0; i < seqCount; i += 1) {
        const img = new Image();
        img.src = section.dataset.seqPath.replace("{n}", String(i + 1).padStart(pad, "0"));
        frames.push(img);
      }
    }

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      draw(performance.now());
    }

    function drawSequence(w, h) {
      // Use the nearest frame that has finished loading.
      let index = Math.round(progress * (seqCount - 1));
      while (index > 0 && !(frames[index].complete && frames[index].naturalWidth)) index -= 1;
      const img = frames[index];
      if (!img.complete || !img.naturalWidth) return false;
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return true;
    }

    // With no footage supplied: slow drifting light in the brand colour.
    function drawLight(w, h, time) {
      const t = calm ? 0 : time / 9000;
      ctx.globalCompositeOperation = "lighter";
      for (let j = 0; j < 3; j += 1) {
        const x = w * (0.15 + 0.7 * ((progress * 1.1 + j * 0.31 + t * 0.2) % 1));
        const y = h * (0.5 + 0.28 * Math.sin(progress * 5 + j * 2.1 + t * 2));
        const r = Math.max(w, h) * (0.32 + 0.08 * j);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
        const tint = j === 1 ? "255,255,255" : rgb;
        glow.addColorStop(0, `rgba(${tint},${j === 1 ? 0.1 : 0.3})`);
        glow.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
      }
      // A highlight that sweeps across, like light moving over a polished surface.
      const sweep = ((progress * 2.5 + t * 0.3) % 1) * (w * 2.2) - w * 0.6;
      ctx.save();
      ctx.translate(sweep, 0);
      ctx.rotate(-0.35);
      const band = ctx.createLinearGradient(0, 0, w * 0.22, 0);
      band.addColorStop(0, "rgba(255,255,255,0)");
      band.addColorStop(0.5, "rgba(255,255,255,0.09)");
      band.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, -h, w * 0.22, h * 3);
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    }

    function draw(time) {
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--film-bg").trim() || "#08080a";
      ctx.fillRect(0, 0, w, h);
      if (!(seqCount && drawSequence(w, h))) drawLight(w, h, time);
    }

    function update() {
      const box = section.getBoundingClientRect();
      progress = clamp(-box.top / Math.max(1, box.height - window.innerHeight));
      const position = progress * count;
      const current = Math.min(count - 1, Math.floor(position));
      const local = position - current;
      slides.forEach((slide, k) => {
        let opacity = 0;
        if (k === current) {
          const fadeIn = k === 0 ? 1 : clamp(local / 0.22);
          const fadeOut = k === count - 1 ? 1 : clamp((1 - local) / 0.22);
          opacity = Math.min(fadeIn, fadeOut);
        }
        if (calm) opacity = k === current ? 1 : 0;
        slide.style.opacity = opacity;
        slide.style.transform = calm ? "" : `translateY(${((0.5 - local) * 46).toFixed(1)}px) scale(${(0.96 + local * 0.06).toFixed(3)})`;
        slide.style.visibility = opacity > 0.01 ? "visible" : "hidden";
      });
      images.forEach((img) => {
        const k = Number(img.dataset.slide);
        img.style.opacity = k === current ? Math.min(clamp(local / 0.3), clamp((1 - local) / 0.3)) : 0;
        if (!calm) img.style.transform = `scale(${(1.04 + (k === current ? local : 0) * 0.08).toFixed(3)})`;
      });
      bar.classList.toggle("solid", window.scrollY > 10);
      section.classList.toggle("done", progress >= 1);
    }

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame((time) => {
        queued = false;
        update();
        if (calm || seqCount) draw(time);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    frames.forEach((img) => img.addEventListener("load", onScroll, { once: true }));

    // The drifting light only animates while the opening is on screen.
    new IntersectionObserver((entries) => (visible = entries[0].isIntersecting)).observe(section);
    if (!calm && !seqCount) {
      const loop = (time) => {
        if (visible) draw(time);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    resize();
    update();
  }

  function hexToRgb(hex) {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h.slice(0, 6), 16);
    return Number.isNaN(n) ? "242,169,0" : [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(",");
  }

  // ---------- reveal on scroll ----------

  function reveal() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window)) return items.forEach((el) => el.classList.add("in"));
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach((el) => observer.observe(el));
  }

  // ---------- before / after ----------

  function beforeAfter() {
    $$(".ba").forEach((box) => {
      const range = $(".ba-range", box);
      const set = () => box.style.setProperty("--pos", range.value + "%");
      range.addEventListener("input", set);
      set();
    });
  }

  // ---------- service area search ----------

  function areas(site) {
    const input = $("#town");
    if (!input || !site.areas) return;
    const result = $("#town-result");
    const towns = [];
    site.areas.groups.forEach((group) => group.towns.forEach((town) => towns.push({ town, group: group.name })));
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      result.className = "";
      if (q.length < 2) return (result.textContent = "");
      const hit = towns.find((t) => t.town.toLowerCase() === q) || towns.find((t) => t.town.toLowerCase().startsWith(q));
      if (hit) {
        result.textContent = `Yes, we cover ${hit.town} (${hit.group}).`;
        result.className = "yes";
      } else {
        result.textContent = "Not on our list yet. Ask in your quote and we will tell you.";
      }
    });
  }

  // ---------- quote wizard ----------

  function wizard(site) {
    const form = $(".wizard");
    if (!form) return;
    const steps = $$(".wstep", form);
    const back = $("[data-back]", form);
    const next = $("[data-next]", form);
    const send = $("[data-send]", form);
    const msg = $(".wizard-msg", form);
    const fill = $(".wizard-bar i", form);
    let at = 0;

    function show(index, focus) {
      at = index;
      steps.forEach((step, i) => (step.hidden = i !== at));
      back.hidden = at === 0;
      next.hidden = at === steps.length - 1;
      send.hidden = at !== steps.length - 1;
      fill.style.transform = `scaleX(${(at + 1) / steps.length})`;
      msg.textContent = "";
      if (focus) (steps[at].querySelector("input:checked, input, textarea") || next).focus({ preventScroll: true });
    }

    function valid() {
      const bad = $$("input, textarea", steps[at]).find((field) => !field.checkValidity());
      if (!bad) return true;
      msg.textContent = bad.type === "radio" ? "Pick one to continue." : "Please fill in your " + bad.name + ".";
      if (bad.type !== "radio") bad.focus();
      return false;
    }

    next.addEventListener("click", () => valid() && show(at + 1, true));
    back.addEventListener("click", () => show(at - 1, true));
    // Choosing an option moves straight on, which keeps the form quick on a phone.
    form.addEventListener("change", (event) => {
      if (event.target.type === "radio" && at < steps.length - 1) setTimeout(() => show(at + 1, false), 220);
    });
    // "Get a quote" on a package pre-selects it when a step offers that choice.
    $$("[data-pick]").forEach((link) =>
      link.addEventListener("click", () => {
        const radio = $$("input[type=radio]", form).find((r) => r.value === link.dataset.pick);
        if (radio) radio.checked = true;
      })
    );

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!valid()) return;
      const data = Object.fromEntries(new FormData(form));
      if (data.botcheck) return;
      delete data.botcheck;
      const endpoint = site.quote && site.quote.endpoint;
      const finish = () => {
        steps.forEach((step) => (step.hidden = true));
        $(".wizard-nav", form).hidden = true;
        $(".wizard-bar", form).hidden = true;
        msg.textContent = "";
        $(".wizard-done", form).hidden = false;
      };

      if (endpoint) {
        send.disabled = true;
        msg.textContent = "Sending...";
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("HTTP " + res.status);
          finish();
        } catch (err) {
          msg.textContent = "That did not send. Please call or text us instead.";
          send.disabled = false;
        }
        return;
      }
      // No endpoint configured: open the visitor's email app with the request filled in.
      const body = Object.entries(data).map(([key, value]) => key + ": " + value).join("\n");
      window.location.href = "mailto:" + (site.business.email || "") + "?subject=" + encodeURIComponent("Quote request from " + data.name) + "&body=" + encodeURIComponent(body);
      finish();
    });

    show(0, false);
  }

  // ---------- scripted chat ----------

  function chat(site) {
    const button = $(".chat-btn");
    if (!button || !site.chat) return;
    const panel = $(".chat");
    const log = $(".chat-log", panel);
    const opts = $(".chat-opts", panel);
    const phone = String(site.business.phone || "").replace(/[^\d+]/g, "");
    let started = false;

    const say = (text, who) => {
      const bubble = Object.assign(document.createElement("p"), { className: "bubble " + who, textContent: text });
      log.append(bubble);
      log.scrollTop = log.scrollHeight;
    };
    const action = (label, href, close) => {
      const link = Object.assign(document.createElement("a"), { className: "btn", href, textContent: label });
      if (close) link.addEventListener("click", () => toggle(false));
      log.append(link);
      log.scrollTop = log.scrollHeight;
    };
    function options() {
      opts.replaceChildren(
        ...site.chat.options.map((opt) => {
          const b = Object.assign(document.createElement("button"), { type: "button", className: "btn ghost", textContent: opt.label });
          b.addEventListener("click", () => {
            say(opt.label, "me");
            setTimeout(() => {
              say(opt.reply, "them");
              if (opt.action === "quote") action("Start my quote", "#quote", true);
              if (opt.action === "call" && phone) action("Call " + site.business.phone, "tel:" + phone);
              if (opt.action === "text" && phone) action("Text " + site.business.phone, "sms:" + phone);
            }, 350);
          });
          return b;
        })
      );
    }
    function toggle(open) {
      panel.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
      if (open && !started) {
        started = true;
        say(site.chat.greeting, "them");
        options();
      }
      if (open) $("[data-chat-close]", panel).focus();
    }
    button.addEventListener("click", () => toggle(panel.hidden));
    $("[data-chat-close]", panel).addEventListener("click", () => toggle(false));
    document.addEventListener("keydown", (event) => event.key === "Escape" && !panel.hidden && toggle(false));
  }

  // ---------- phone numbers ----------

  // On a computer a tel: link usually does nothing useful, so copy the number instead.
  function phones(site) {
    if (!finePointer || !navigator.clipboard) return;
    const toast = $(".toast");
    $$("[data-phone]").forEach((link) =>
      link.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
          await navigator.clipboard.writeText(site.business.phone);
          toast.textContent = "Number copied: " + site.business.phone;
        } catch (err) {
          toast.textContent = "Call or text " + site.business.phone;
        }
        toast.hidden = false;
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => (toast.hidden = true), 2600);
      })
    );
  }

  // ---------- boot ----------

  if (window.SITE) return start(window.SITE);

  // Preview mode: ?site=name loads ../sites/name.js
  const name = (new URLSearchParams(location.search).get("site") || "detailing").replace(/[^a-z0-9-]/gi, "");
  const script = document.createElement("script");
  script.src = "../sites/" + name + ".js";
  script.onload = () => (window.SITE ? start(window.SITE) : fail());
  script.onerror = fail;
  document.head.append(script);
  function fail() {
    $("#app").innerHTML = '<p style="padding:2rem;font-family:sans-serif">No site config found for "' + name + '". <a href="../index.html">Back to the catalog</a></p>';
  }
})();
