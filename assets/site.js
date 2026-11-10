(function () {
  const cfg = window.SITE_CONFIG || {};

  // Fill in business details from config.js.
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const value = cfg[el.dataset.cfg];
    if (value) el.textContent = value;
  });
  document.querySelectorAll("[data-cfg-href]").forEach((el) => {
    const key = el.dataset.cfgHref;
    const value = cfg[key];
    if (!value) return;
    el.href = key === "email" ? "mailto:" + value : "tel:" + value.replace(/[^\d+]/g, "");
  });
  document.querySelectorAll("[data-cfg-hide-empty]").forEach((el) => {
    if (!cfg[el.dataset.cfgHideEmpty]) el.hidden = true;
  });
  document.getElementById("year").textContent = new Date().getFullYear();
  if (cfg.name) document.title = cfg.name + " | " + document.title;

  // Scroll animations. Skipped entirely on browsers without IntersectionObserver.
  if ("IntersectionObserver" in window) {
    document.documentElement.classList.add("js");
    const groups = [".hero-copy > *:not(h1)", ".scorecard", ".band > h2", ".how-head", ".card", ".faq details", ".contact > *"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          // Once it has arrived, hand the element back to its normal styles (hover etc).
          setTimeout(() => entry.target.classList.remove("reveal"), 1500);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    groups.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        // Stagger siblings so a row of cards arrives one after another.
        const index = [...el.parentElement.children].indexOf(el);
        el.style.setProperty("--delay", Math.min(index, 5) * 90 + "ms");
        el.classList.add("reveal");
        observer.observe(el);
      });
    });
    document.querySelectorAll(".scorecard li").forEach((li, i) => li.style.setProperty("--i", i));

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // Headline: wrap each word so it can rise into place. Screen readers get the plain text.
    const h1 = document.querySelector("h1");
    const words = h1.textContent.trim().split(/\s+/);
    h1.setAttribute("aria-label", words.join(" "));
    h1.replaceChildren();
    words.forEach((word, i) => {
      const inner = document.createElement("span");
      inner.textContent = word;
      inner.style.setProperty("--i", i);
      const outer = document.createElement("span");
      outer.className = "w";
      outer.setAttribute("aria-hidden", "true");
      outer.append(inner);
      h1.append(outer, " ");
    });
    requestAnimationFrame(() => requestAnimationFrame(() => h1.classList.add("in")));

    // Marquee: repeat the items so the loop is seamless at any screen width.
    const track = document.querySelector(".marquee-track");
    const items = [...track.children];
    for (let n = 0; n < 3; n += 1) items.forEach((item) => track.append(item.cloneNode(true)));

    if (finePointer && !calm) {
      // Example audit card leans towards the pointer.
      const hero = document.querySelector(".hero");
      const scorecard = document.querySelector(".scorecard");
      hero.addEventListener("pointermove", (event) => {
        const box = scorecard.getBoundingClientRect();
        const x = (event.clientX - (box.left + box.width / 2)) / window.innerWidth;
        const y = (event.clientY - (box.top + box.height / 2)) / window.innerHeight;
        scorecard.style.setProperty("--ry", (x * 14).toFixed(2) + "deg");
        scorecard.style.setProperty("--rx", (-y * 14).toFixed(2) + "deg");
      });
      hero.addEventListener("pointerleave", () => {
        scorecard.style.setProperty("--ry", "0deg");
        scorecard.style.setProperty("--rx", "0deg");
      });
      // Service cards: light follows the pointer.
      document.querySelectorAll(".card").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
          const box = card.getBoundingClientRect();
          card.style.setProperty("--mx", event.clientX - box.left + "px");
          card.style.setProperty("--my", event.clientY - box.top + "px");
        });
      });
    }

    const steps = document.querySelector(".steps");
    const stepItems = [...steps.children];
    const cta = document.querySelector(".cta");
    const top = document.querySelector(".top");
    const bar = document.querySelector(".progress");
    let ticking = false;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      top.classList.toggle("scrolled", window.scrollY > 8);
      document.documentElement.style.setProperty("--scroll", Math.min(window.scrollY, 800));

      // Timeline: the rail fills, and each step lights up, as it passes mid-screen.
      const line = window.innerHeight * 0.6;
      const rail = steps.getBoundingClientRect();
      const fill = calm ? 1 : Math.max(0, Math.min(1, (line - rail.top) / rail.height));
      steps.style.setProperty("--fill", fill);
      stepItems.forEach((li) => li.classList.toggle("active", calm || li.getBoundingClientRect().top < line));

      // Call to action: starts as an inset rounded panel and opens to full width.
      const enter = calm ? 1 : Math.max(0, Math.min(1, (window.innerHeight - cta.getBoundingClientRect().top) / (window.innerHeight * 0.6)));
      cta.style.setProperty("--inset", ((1 - enter) * 6).toFixed(2) + "%");
      cta.style.setProperty("--round", ((1 - enter) * 28).toFixed(1) + "px");
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) requestAnimationFrame(onScroll);
      ticking = true;
    }, { passive: true });
    onScroll();
  }

  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  function setStatus(text, isError) {
    status.textContent = text;
    status.classList.toggle("error", Boolean(isError));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data.company_url) return; // honeypot: bots fill this, people never see it
    delete data.company_url;

    if (!form.checkValidity()) {
      setStatus("Please fill in your name, business name and a way to reach you.", true);
      form.querySelector(":invalid").focus();
      return;
    }

    if (cfg.formEndpoint) {
      setStatus("Sending...");
      try {
        const res = await fetch(cfg.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        setStatus("Thanks. Your request is in and I will reply within one working day.");
      } catch (err) {
        setStatus("That did not send. Please email " + (cfg.email || "me") + " directly.", true);
      }
      return;
    }

    // No endpoint configured: open the visitor's email app with the message ready.
    const body = [
      "Name: " + data.name,
      "Business: " + data.business,
      "Contact: " + data.contact,
      "Help with: " + data.topic,
      "",
      data.message || "",
    ].join("\n");
    window.location.href =
      "mailto:" + (cfg.email || "") +
      "?subject=" + encodeURIComponent("Free audit request: " + data.business) +
      "&body=" + encodeURIComponent(body);
    setStatus("Your email app should open with the message ready to send.");
  });
})();
