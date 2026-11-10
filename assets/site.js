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
