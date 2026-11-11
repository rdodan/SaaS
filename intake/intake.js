// Site builder: collects a business's details and turns them into a site config
// (the same shape as templates/sites/*.js), with a live preview.
(function () {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const KEY = "siteBuilder.answers";
  const PREVIEW_KEY = "sitePreview";
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const $ = (id) => document.getElementById(id);
  const names = (window.SITE_LIST || []).map((n) => n.replace(/[^a-z0-9-]/gi, ""));
  const bases = {}; // example configs, by name

  document.querySelectorAll("[data-cfg]").forEach((node) => {
    if (cfg[node.dataset.cfg]) node.textContent = cfg[node.dataset.cfg];
  });

  function el(tag, props, children) {
    const node = Object.assign(document.createElement(tag), props || {});
    (children || []).forEach((child) => node.append(child));
    return node;
  }

  // ---------- answers ----------

  function blank() {
    return {
      type: names[0] || "trades",
      accent: "",
      name: "", tagline: "", town: "", headline: "",
      phone: "", email: "", address: "", towns: "", reviewsUrl: "", instagramUrl: "",
      showHours: true,
      hours: DAYS.map((day, i) => ({ closed: i === 6, open: "09:00", close: "17:00" })),
      items: [{ section: "", name: "", text: "", price: "" }],
      faqs: [{ q: "", a: "" }],
      notes: "",
    };
  }

  function clean(raw) {
    const a = Object.assign(blank(), raw && typeof raw === "object" ? raw : {});
    if (!names.includes(a.type)) a.type = names[0];
    if (!Array.isArray(a.hours) || a.hours.length !== 7) a.hours = blank().hours;
    if (!Array.isArray(a.items) || !a.items.length) a.items = blank().items;
    if (!Array.isArray(a.faqs) || !a.faqs.length) a.faqs = blank().faqs;
    return a;
  }

  function load() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(KEY));
    } catch (err) { /* start fresh */ }
    const a = clean(saved);
    // A link can carry what is already known, e.g. ?type=barber&name=Oak%20Lane&phone=...
    const params = new URLSearchParams(location.search);
    ["type", "name", "tagline", "town", "phone", "email", "address"].forEach((key) => {
      if (params.get(key)) a[key] = params.get(key).slice(0, 200);
    });
    return clean(a);
  }

  let answers = load();

  // ---------- answers -> site config ----------

  const split = (text) => String(text || "").split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
  const http = (value) => (/^https?:\/\//i.test(String(value || "").trim()) ? String(value).trim() : "");

  // Dark text on light colours, white text on dark ones.
  function inkFor(hex) {
    const n = parseInt(hex.slice(1), 16);
    const light = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return light > 0.6 ? "#111111" : "#ffffff";
  }

  function build(a) {
    const base = bases[a.type];
    if (!base) return null;
    const site = JSON.parse(JSON.stringify(base));
    delete site.catalog;
    const name = a.name.trim() || base.business.name;
    const words = name.split(/\s+/);
    const tagline = a.tagline.trim() || base.business.tagline;
    const town = a.town.trim() || "Your Town";

    Object.assign(site.business, {
      name,
      logo: words.length > 1 ? [words.slice(0, -1).join(" "), " " + words[words.length - 1]] : [name],
      tagline,
      phone: a.phone.trim() || base.business.phone,
      email: a.email.trim() || base.business.email,
      address: a.address.trim() || base.business.address,
      reviewsUrl: http(a.reviewsUrl) || (a.name.trim() ? "" : base.business.reviewsUrl),
      instagramUrl: http(a.instagramUrl) || (a.name.trim() ? "" : base.business.instagramUrl),
      mapsUrl: a.address.trim() ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(name + ", " + a.address.trim()) : base.business.mapsUrl,
    });

    site.hero = site.hero || {};
    site.hero.title = tagline + " in " + town;
    const headline = String(a.headline || "").split(/\n/).map((t) => t.trim()).filter(Boolean);
    if (headline.length) site.hero.lines = headline.slice(0, 3);

    if (/^#[0-9a-f]{6}$/i.test(a.accent)) {
      site.theme.accent = a.accent;
      site.theme.accentInk = inkFor(a.accent);
    }

    // What they offer goes into whichever section the chosen style uses for it.
    const items = a.items.filter((item) => item.name.trim());
    if (items.length) {
      if (site.menu) {
        const sections = [];
        items.forEach((item) => {
          const label = item.section.trim() || "Menu";
          let group = sections.find((s) => s.name === label);
          if (!group) sections.push((group = { name: label, items: [] }));
          group.items.push({ name: item.name.trim(), text: item.text.trim(), price: item.price.trim() });
        });
        site.menu.categories = sections;
      } else if (site.plans) {
        site.plans.items = items.map((item, i) => ({ name: item.name.trim(), price: item.price.trim(), per: "", text: item.text.trim(), features: [], featured: items.length > 2 && i === 1 }));
        delete site.plans.note;
      } else if (site.services) {
        site.services.items = items.map((item) => ({ name: item.name.trim(), text: item.text.trim(), price: item.price.trim(), groups: [], steps: [] }));
      }
      // Offer the same choices in the quote form where it asked about the example's services.
      const step = site.quote && site.quote.steps && site.quote.steps.find((s) => ["package", "service", "plan", "job"].includes(s.name));
      if (step) step.options = items.slice(0, 5).map((item) => item.name.trim()).concat("Not sure yet");
    }

    site.order = (site.order || ["beforeAfter", "services", "menu", "plans", "timetable", "process", "work", "team", "areas", "hours", "faq", "quote"]).filter((key) => site[key] || key === "hours" || key === "areas");
    if (a.showHours) {
      site.hours = Object.assign({ kicker: "Visit", title: ["Opening", "hours."] }, site.hours, {
        days: DAYS.map((day, i) => (a.hours[i].closed ? { day, closed: true } : { day, open: a.hours[i].open, close: a.hours[i].close })),
      });
      if (a.name.trim()) delete site.hours.note;
      if (!site.order.includes("hours")) site.order.splice(Math.max(0, site.order.indexOf("faq")), 0, "hours");
    } else {
      delete site.hours;
    }

    const towns = split(a.towns);
    if (towns.length) {
      site.areas = Object.assign({ kicker: "Areas we cover", title: ["Local,", "and nearby."] }, site.areas, { groups: [{ name: "Where we work", towns }] });
      if (!site.order.includes("areas")) site.order.splice(Math.max(0, site.order.indexOf("faq")), 0, "areas");
    }
    site.order = site.order.filter((key) => site[key]);

    const faqs = a.faqs.filter((f) => f.q.trim() && f.a.trim());
    if (faqs.length && site.faq) site.faq.items = faqs.map((f) => ({ q: f.q.trim(), a: f.a.trim() }));
    return site;
  }

  // ---------- preview and saving ----------

  let timer;
  function changed() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(answers));
        const site = build(answers);
        if (site) localStorage.setItem(PREVIEW_KEY, JSON.stringify(site));
        $("saved").textContent = "Saved";
        setTimeout(() => ($("saved").textContent = ""), 1500);
      } catch (err) {
        $("saved").textContent = "Could not save on this device";
      }
      const frame = $("frame");
      if (frame.offsetParent) {
        if (frame.getAttribute("src")) frame.contentWindow.location.reload();
        else frame.src = "../templates/site/index.html?preview=1";
      }
    }, 500);
  }

  // ---------- form ----------

  function drawTypes() {
    $("types").replaceChildren(
      ...names.filter((n) => bases[n]).map((n) => {
        const t = bases[n].theme || {};
        const input = el("input", { type: "radio", name: "type", value: n, checked: answers.type === n });
        input.addEventListener("change", () => {
          answers.type = n;
          drawItems();
          syncColour();
          changed();
        });
        const swatch = el("i");
        swatch.style.background = `linear-gradient(135deg, ${t.bg || "#111"} 0 55%, ${t.accent || "#888"} 55%)`;
        return el("label", { className: "type" }, [input, el("span", {}, [swatch, (bases[n].catalog && bases[n].catalog.label) || n])]);
      })
    );
  }

  function syncColour() {
    const base = bases[answers.type];
    $("accent").value = /^#[0-9a-f]{6}$/i.test(answers.accent) ? answers.accent : (base && base.theme.accent) || "#888888";
  }

  function drawHours() {
    $("hours").hidden = !answers.showHours;
    $("hours").replaceChildren(
      ...DAYS.map((day, i) => {
        const h = answers.hours[i];
        const open = el("input", { type: "time", value: h.open, disabled: h.closed, ariaLabel: day + " opens" });
        const close = el("input", { type: "time", value: h.close, disabled: h.closed, ariaLabel: day + " closes" });
        const closed = el("input", { type: "checkbox", checked: h.closed });
        open.addEventListener("input", () => { h.open = open.value; changed(); });
        close.addEventListener("input", () => { h.close = close.value; changed(); });
        closed.addEventListener("change", () => {
          h.closed = closed.checked;
          open.disabled = close.disabled = h.closed;
          changed();
        });
        return el("div", { className: "hrow" }, [el("span", { textContent: day }), open, close, el("label", { className: "check" }, [closed, "Closed"])]);
      })
    );
  }

  function field(obj, key, props) {
    const input = el(props.rows ? "textarea" : "input", Object.assign({ value: obj[key] || "" }, props));
    input.addEventListener("input", () => {
      obj[key] = input.value;
      changed();
    });
    return input;
  }

  function remover(list, index, redraw, fresh) {
    const x = el("button", { type: "button", className: "x", textContent: "×", ariaLabel: "Remove" });
    x.addEventListener("click", () => {
      list.splice(index, 1);
      if (!list.length) list.push(fresh());
      redraw();
      changed();
    });
    return x;
  }

  function drawItems() {
    const base = bases[answers.type] || {};
    const isMenu = Boolean(base.menu);
    $("items-title").textContent = isMenu ? "Your menu" : base.plans ? "Your memberships or prices" : "Your services";
    $("items-hint").textContent = isMenu
      ? "Add your dishes. Give each one a section, such as Starters or Drinks. Leave empty to keep the example menu for now."
      : "Add each one with a short description. Prices are optional. Leave empty to keep the examples for now.";
    $("items").replaceChildren(
      ...answers.items.map((item, i) => {
        const row = el("div", { className: "row" }, [
          field(item, "name", { placeholder: isMenu ? "Dish" : "Name", ariaLabel: "Name" }),
          field(item, "price", { placeholder: "Price", ariaLabel: "Price" }),
          remover(answers.items, i, drawItems, () => ({ section: "", name: "", text: "", price: "" })),
          field(item, "text", { placeholder: "Short description", className: "wide", ariaLabel: "Description" }),
        ]);
        if (isMenu) row.append(field(item, "section", { placeholder: "Section, e.g. Mains", className: "wide", ariaLabel: "Menu section" }));
        return row;
      })
    );
  }

  function drawFaqs() {
    $("faqs").replaceChildren(
      ...answers.faqs.map((faq, i) =>
        el("div", { className: "row faq" }, [
          field(faq, "q", { placeholder: "Question", ariaLabel: "Question" }),
          remover(answers.faqs, i, drawFaqs, () => ({ q: "", a: "" })),
          field(faq, "a", { placeholder: "Answer", rows: 2, className: "wide", ariaLabel: "Answer" }),
        ])
      )
    );
  }

  function drawAll() {
    document.querySelectorAll("[data-field]").forEach((input) => {
      if (input.type === "checkbox") input.checked = Boolean(answers[input.dataset.field]);
      else if (input.type !== "color") input.value = answers[input.dataset.field] || "";
    });
    drawTypes();
    syncColour();
    drawHours();
    drawItems();
    drawFaqs();
  }

  // ---------- sending and files ----------

  const slug = () => (answers.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "new-client").slice(0, 40);

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    el("a", { href: url, download: name }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function setStatus(text, isError) {
    $("status").textContent = text;
    $("status").classList.toggle("error", Boolean(isError));
  }

  async function send(event) {
    event.preventDefault();
    if (!answers.name.trim()) {
      setStatus("Please add your business name first.", true);
      return document.querySelector('[data-field="name"]').focus();
    }
    if (cfg.formEndpoint) {
      $("send").disabled = true;
      setStatus("Sending...");
      try {
        const res = await fetch(cfg.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ subject: "Website answers: " + answers.name, business: answers.name, phone: answers.phone, email: answers.email, notes: answers.notes, answers: JSON.stringify(answers) }),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        setStatus("Thank you. We have your answers and will be in touch with a preview.");
      } catch (err) {
        setStatus("That did not send. Use the email option below instead.", true);
        cfg.formEndpoint = "";
      }
      $("send").disabled = false;
      return;
    }
    // No form service set up: save the answers as a file for the client to attach to an email.
    download(slug() + "-answers.json", JSON.stringify(answers, null, 2));
    window.location.href = "mailto:" + encodeURIComponent(cfg.email || "") + "?subject=" + encodeURIComponent("Website answers: " + answers.name) +
      "&body=" + encodeURIComponent("Hi,\n\nMy answers are in the attached file (" + slug() + "-answers.json, just downloaded).\n\n" + (answers.notes ? "Notes: " + answers.notes + "\n\n" : "") + answers.name + (answers.phone ? "\n" + answers.phone : ""));
    setStatus("A file called " + slug() + "-answers.json was downloaded. Attach it to the email that just opened and press send.");
  }

  // ---------- wiring ----------

  document.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", () => {
      answers[input.dataset.field] = input.type === "checkbox" ? input.checked : input.value;
      if (input.dataset.field === "showHours") $("hours").hidden = !input.checked;
      changed();
    });
  });
  $("accent-reset").addEventListener("click", () => {
    answers.accent = "";
    syncColour();
    changed();
  });
  $("add-item").addEventListener("click", () => {
    const last = answers.items[answers.items.length - 1];
    answers.items.push({ section: last ? last.section : "", name: "", text: "", price: "" });
    drawItems();
    $("items").lastElementChild.querySelector("input").focus();
  });
  $("add-faq").addEventListener("click", () => {
    answers.faqs.push({ q: "", a: "" });
    drawFaqs();
    $("faqs").lastElementChild.querySelector("input").focus();
  });
  $("form").addEventListener("submit", send);
  $("reset").addEventListener("click", () => {
    if (!confirm("Clear everything you have typed and start again?")) return;
    answers = blank();
    drawAll();
    changed();
    setStatus("");
  });
  $("download-answers").addEventListener("click", () => download(slug() + "-answers.json", JSON.stringify(answers, null, 2)));
  $("download-site").addEventListener("click", () => {
    const site = build(answers);
    if (!site) return;
    const head = "// Client: " + site.business.name.replace(/[\r\n]/g, " ") + ". Made with the site builder (intake/index.html).\n";
    download(slug() + ".js", head + "window.SITE = " + JSON.stringify(site, null, 2).replace(/</g, "\\u003c") + ";\n");
    setStatus("Downloaded " + slug() + ".js. Put it in templates/sites/ and open templates/site/index.html?site=" + slug());
  });
  $("load-answers").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== "object" || typeof data.name !== "string") throw new Error();
      answers = clean(data);
      drawAll();
      changed();
      setStatus("Loaded the answers for " + (answers.name || "this business") + ".");
    } catch (err) {
      setStatus("That file is not a set of site builder answers.", true);
    }
  });
  document.querySelectorAll("[data-size]").forEach((button) =>
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-size]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      $("frame-wrap").classList.toggle("phone", button.dataset.size === "phone");
    })
  );

  // Load the example configs (each sets window.SITE), then draw the form.
  (async () => {
    for (const name of names) {
      await new Promise((resolve) => {
        const script = el("script", { src: "../templates/sites/" + name + ".js" });
        script.onload = script.onerror = resolve;
        document.head.append(script);
      });
      if (window.SITE) bases[name] = window.SITE;
      window.SITE = undefined;
    }
    drawAll();
    changed();
  })();
})();
