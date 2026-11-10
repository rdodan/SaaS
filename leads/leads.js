(function () {
  "use strict";

  const STORE_KEY = "leadfinder.v1";
  const PAGE = 200;
  const OVERPASS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ];
  const STAGES = ["New", "Contacted", "Replied", "Meeting", "Client", "Not interested"];

  // Each group lists the OpenStreetMap tags that belong to it. Order matters:
  // a business is put in the first group it matches, so "Other shops" goes last.
  const GROUPS = [
    { id: "food", label: "Food and drink", on: true, tags: { amenity: "restaurant|cafe|fast_food|bar|pub|ice_cream", shop: "bakery|butcher|confectionery|pastry|deli" } },
    { id: "beauty", label: "Hair and beauty", on: true, tags: { shop: "hairdresser|beauty|massage|tattoo|cosmetics" } },
    { id: "trades", label: "Trades", on: true, tags: { craft: "*" } },
    { id: "health", label: "Health", on: true, tags: { amenity: "dentist|doctors|clinic|veterinary", healthcare: "*" } },
    { id: "auto", label: "Cars", on: true, tags: { shop: "car_repair|car|tyres|car_parts|motorcycle", amenity: "car_wash|driving_school" } },
    { id: "fitness", label: "Fitness", on: false, tags: { leisure: "fitness_centre|sports_centre|dance" } },
    { id: "lodging", label: "Places to stay", on: false, tags: { tourism: "hotel|guest_house|hostel|motel|apartment|chalet" } },
    { id: "pro", label: "Professional services", on: false, tags: { office: "accountant|lawyer|estate_agent|insurance|architect|financial|tax_advisor|notary|company|consulting|travel_agent" } },
    { id: "shops", label: "Other shops", on: false, tags: { shop: "*" } },
  ];

  const $ = (id) => document.getElementById(id);
  let leads = load();
  let shown = PAGE;

  // ---------- storage ----------

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (err) {
      return {};
    }
  }

  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(leads));
      } catch (err) {
        setStatus("This browser's storage is full. Export a backup and clear the list.", true);
      }
    }, 200);
  }

  // ---------- OpenStreetMap ----------

  function matches(tags, group) {
    return Object.entries(group.tags).some(([key, values]) => {
      const value = tags[key];
      if (!value) return false;
      return values === "*" || values.split("|").includes(value);
    });
  }

  function classify(tags) {
    return GROUPS.find((group) => matches(tags, group));
  }

  function buildQuery(lat, lon, radius, groupIds) {
    const around = `(around:${radius},${lat},${lon})`;
    const clauses = [];
    GROUPS.filter((g) => groupIds.includes(g.id)).forEach((group) => {
      Object.entries(group.tags).forEach(([key, values]) => {
        const filter = values === "*" ? `["${key}"]` : `["${key}"~"^(${values})$"]`;
        clauses.push(`nwr["name"]${filter}${around};`);
      });
    });
    return `[out:json][timeout:60];(${clauses.join("")});out center tags;`;
  }

  async function geocode(place) {
    const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" + encodeURIComponent(place);
    const busy = "The place lookup is busy or unreachable. Wait a minute and try again.";
    const res = await fetch(url, { headers: { Accept: "application/json" } }).catch(() => {
      throw new Error(busy);
    });
    if (!res.ok) throw new Error(busy);
    const hits = await res.json();
    if (!hits.length) throw new Error("Could not find that place. Try adding the country, e.g. \"Leeds, UK\".");
    return { lat: Number(hits[0].lat), lon: Number(hits[0].lon), label: hits[0].display_name };
  }

  async function overpass(query) {
    let lastError;
    for (const endpoint of OVERPASS) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(query),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();
        if (json.remark && !json.elements.length) throw new Error(json.remark);
        return json.elements;
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error("The OpenStreetMap server is busy (" + lastError.message + "). Wait a minute, or try a smaller radius.");
  }

  function cleanUrl(raw) {
    if (!raw) return "";
    let value = String(raw).trim().split(";")[0].trim();
    if (!value) return "";
    if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = "https://" + value;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch (err) {
      return "";
    }
  }

  function fromElement(el, group) {
    const t = el.tags;
    const street = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
    const kind = t.shop || t.amenity || t.craft || t.healthcare || t.leisure || t.tourism || t.office || "";
    return {
      id: el.type + "/" + el.id,
      name: t.name,
      group: group.id,
      kind: kind.replace(/_/g, " "),
      address: [street, t["addr:city"] || t["addr:suburb"], t["addr:postcode"]].filter(Boolean).join(", "),
      lat: el.lat ?? el.center?.lat ?? null,
      lon: el.lon ?? el.center?.lon ?? null,
      website: cleanUrl(t.website || t["contact:website"] || t.url),
      phone: t.phone || t["contact:phone"] || t["contact:mobile"] || "",
      email: t.email || t["contact:email"] || "",
      social: cleanUrl(t["contact:facebook"] || t.facebook || t["contact:instagram"] || t.instagram),
      hours: Boolean(t.opening_hours),
      chain: Boolean(t.brand || t["brand:wikidata"]),
    };
  }

  // ---------- scoring ----------

  function isSocial(url) {
    return /(^|\.)(facebook|instagram|fb|linktr|tiktok)\.(com|ee|me)$/i.test(new URL(url).hostname);
  }

  function assess(lead) {
    const gaps = [];
    let score = 0;
    const add = (label, points, strong) => {
      gaps.push({ label, strong });
      score += points;
    };
    if (!lead.website) add("No website listed", 50, true);
    else if (isSocial(lead.website)) add("Social page as website", 35, true);
    else if (lead.website.startsWith("http://")) add("Site not secure (http)", 10);
    if (lead.rating !== "" && lead.rating != null && Number(lead.rating) < 4) add("Low rating", 30, true);
    if (lead.reviews !== "" && lead.reviews != null && Number(lead.reviews) < 15) add("Few reviews", 15);
    if (!lead.hours) add("No opening hours listed", 5);
    if (!lead.phone) add("No phone listed", 5);
    return { gaps, score };
  }

  // ---------- rendering ----------

  function el(tag, props, children) {
    const node = Object.assign(document.createElement(tag), props || {});
    (children || []).forEach((child) => node.append(child));
    return node;
  }

  function link(href, text) {
    return el("a", { href, textContent: text, target: "_blank", rel: "noopener noreferrer" });
  }

  function mapsUrl(lead) {
    const query = [lead.name, lead.address].filter(Boolean).join(", ");
    let url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
    // Without an address, centre the map on the business so the right one comes up.
    if (!lead.address && lead.lat != null) {
      url = "https://www.google.com/maps/search/" + encodeURIComponent(lead.name) + "/@" + lead.lat + "," + lead.lon + ",17z";
    }
    return url;
  }

  function gapsCell(lead) {
    const { gaps, score } = assess(lead);
    const wrap = el("div", { className: "gaps" });
    if (!gaps.length) wrap.append(el("span", { className: "gap none", textContent: "Nothing obvious" }));
    gaps.forEach((gap) => wrap.append(el("span", { className: "gap" + (gap.strong ? " strong" : ""), textContent: gap.label })));
    return [wrap, el("div", { className: "score", textContent: "Opportunity score " + score })];
  }

  function row(lead) {
    const groupLabel = GROUPS.find((g) => g.id === lead.group)?.label || "Added by hand";
    const sub = [lead.kind || groupLabel, lead.address].filter(Boolean).join(" · ");

    const contact = el("td", { className: "reach" });
    if (lead.phone) contact.append(el("div", {}, [el("a", { href: "tel:" + lead.phone.replace(/[^\d+]/g, ""), textContent: lead.phone })]));
    if (lead.email) contact.append(el("div", {}, [el("a", { href: "mailto:" + lead.email, textContent: lead.email })]));
    if (lead.website) contact.append(el("div", {}, [link(lead.website, new URL(lead.website).hostname.replace(/^www\./, ""))]));
    if (lead.social) contact.append(el("div", {}, [link(lead.social, "Social page")]));
    contact.append(el("div", {}, [link(mapsUrl(lead), "Open in Google Maps")]));

    const rating = el("input", { type: "number", min: 1, max: 5, step: 0.1, placeholder: "Stars", value: lead.rating ?? "", ariaLabel: "Star rating" });
    rating.dataset.field = "rating";
    const reviews = el("input", { type: "number", min: 0, step: 1, placeholder: "Reviews", value: lead.reviews ?? "", ariaLabel: "Number of reviews" });
    reviews.dataset.field = "reviews";

    const stage = el("select", { ariaLabel: "Stage" });
    STAGES.forEach((name) => stage.append(el("option", { textContent: name, selected: (lead.status || "New") === name })));
    stage.dataset.field = "status";

    const notes = el("textarea", { rows: 2, value: lead.notes || "", placeholder: "Who you spoke to, next step...", ariaLabel: "Notes" });
    notes.dataset.field = "notes";

    const tr = el("tr", {}, [
      el("td", {}, [el("div", { className: "name", textContent: lead.name }), el("div", { className: "sub", textContent: sub })]),
      el("td", { className: "gaps-cell" }, gapsCell(lead)),
      contact,
      el("td", {}, [el("div", { className: "rating" }, [rating, reviews])]),
      el("td", {}, [stage]),
      el("td", {}, [notes]),
    ]);
    tr.dataset.id = lead.id;
    return tr;
  }

  function visible() {
    const q = $("q").value.trim().toLowerCase();
    const group = $("f-group").value;
    const status = $("f-status").value;
    const noWeb = $("f-noweb").checked;
    const hideChains = $("f-chains").checked;
    return Object.values(leads)
      .filter((lead) => {
        if (hideChains && lead.chain) return false;
        if (noWeb && lead.website) return false;
        if (group && lead.group !== group) return false;
        if (status && (lead.status || "New") !== status) return false;
        if (q && !(lead.name + " " + lead.address + " " + lead.kind).toLowerCase().includes(q)) return false;
        return true;
      })
      .map((lead) => ({ lead, score: assess(lead).score }))
      .sort((a, b) => b.score - a.score || a.lead.name.localeCompare(b.lead.name))
      .map((entry) => entry.lead);
  }

  function render() {
    const list = visible();
    const total = Object.keys(leads).length;
    $("rows").replaceChildren(...list.slice(0, shown).map(row));
    $("empty").hidden = total > 0;
    $("more").hidden = list.length <= shown;
    $("count").textContent = total ? `Showing ${Math.min(shown, list.length)} of ${list.length} matching (${total} saved), best opportunities first.` : "";
  }

  function setStatus(text, isError) {
    $("status").textContent = text;
    $("status").classList.toggle("error", Boolean(isError));
  }

  // ---------- actions ----------

  async function search(event) {
    event.preventDefault();
    const place = $("place").value.trim();
    const groupIds = [...document.querySelectorAll("#groups input:checked")].map((box) => box.value);
    if (!place) return;
    if (!groupIds.length) return setStatus("Pick at least one business type.", true);

    $("go").disabled = true;
    try {
      localStorage.setItem(STORE_KEY + ".place", place);
      setStatus("Looking up " + place + "...");
      const spot = await geocode(place);
      setStatus("Finding businesses near " + spot.label + "...");
      const elements = await overpass(buildQuery(spot.lat, spot.lon, $("radius").value, groupIds));

      let added = 0;
      let kept = 0;
      elements.forEach((element) => {
        if (!element.tags || !element.tags.name) return;
        const group = classify(element.tags);
        if (!group || !groupIds.includes(group.id)) return;
        const fresh = fromElement(element, group);
        kept += 1;
        if (!leads[fresh.id]) added += 1;
        // Keep the stage, rating and notes you already entered.
        leads[fresh.id] = Object.assign({ status: "New", notes: "", rating: "", reviews: "", added: Date.now() }, leads[fresh.id], fresh);
      });
      save();
      shown = PAGE;
      render();
      setStatus(`Found ${kept} businesses near ${spot.label}. ${added} of them are new to your list.`);
    } catch (err) {
      setStatus(err.message, true);
    } finally {
      $("go").disabled = false;
    }
  }

  function download(name, type, text) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    el("a", { href: url, download: name }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvCell(value) {
    let text = value == null ? "" : String(value);
    if (/^[=+\-@]/.test(text)) text = "'" + text; // stop spreadsheets running it as a formula
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function exportCsv() {
    const head = ["Name", "Type", "Address", "Phone", "Email", "Website", "Social", "Rating", "Reviews", "Gaps", "Score", "Stage", "Notes", "Google Maps"];
    const lines = visible().map((lead) => {
      const { gaps, score } = assess(lead);
      return [lead.name, lead.kind, lead.address, lead.phone, lead.email, lead.website, lead.social, lead.rating, lead.reviews,
        gaps.map((g) => g.label).join("; "), score, lead.status || "New", lead.notes, mapsUrl(lead)].map(csvCell).join(",");
    });
    download("leads.csv", "text/csv", "﻿" + [head.map(csvCell).join(","), ...lines].join("\r\n"));
  }

  async function restore(file) {
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
      let count = 0;
      Object.entries(data).forEach(([id, lead]) => {
        if (!lead || typeof lead.name !== "string") return;
        leads[id] = Object.assign({}, lead, {
          id,
          website: cleanUrl(lead.website),
          social: cleanUrl(lead.social),
        });
        count += 1;
      });
      save();
      render();
      setStatus(`Restored ${count} businesses from the backup.`);
    } catch (err) {
      setStatus("That file is not a lead finder backup.", true);
    }
  }

  // ---------- wiring ----------

  GROUPS.forEach((group) => {
    const box = el("input", { type: "checkbox", value: group.id, checked: group.on });
    $("groups").append(el("label", { className: "chip" }, [box, group.label]));
    $("f-group").append(el("option", { value: group.id, textContent: group.label }));
  });
  STAGES.forEach((name) => $("f-status").append(el("option", { value: name, textContent: name })));
  $("place").value = localStorage.getItem(STORE_KEY + ".place") || (window.SITE_CONFIG || {}).leadFinderDefaultPlace || "";

  $("search").addEventListener("submit", search);
  ["q", "f-group", "f-status", "f-noweb", "f-chains"].forEach((id) =>
    $(id).addEventListener("input", () => {
      shown = PAGE;
      render();
    })
  );
  $("more").addEventListener("click", () => {
    shown += PAGE;
    render();
  });

  // Edits inside the table: save as you type, refresh the gaps when a rating changes.
  $("rows").addEventListener("input", (event) => {
    const field = event.target.dataset.field;
    const tr = event.target.closest("tr");
    if (!field || !tr || !leads[tr.dataset.id]) return;
    const lead = leads[tr.dataset.id];
    lead[field] = event.target.value;
    save();
    if (field === "rating" || field === "reviews") tr.querySelector(".gaps-cell").replaceChildren(...gapsCell(lead));
  });

  $("export-csv").addEventListener("click", exportCsv);
  $("export-json").addEventListener("click", () => download("leads-backup.json", "application/json", JSON.stringify(leads, null, 2)));
  $("import-json").addEventListener("change", (event) => {
    if (event.target.files[0]) restore(event.target.files[0]);
    event.target.value = "";
  });
  $("clear").addEventListener("click", () => {
    const total = Object.keys(leads).length;
    if (!total || !confirm(`Delete all ${total} saved businesses, including your notes and stages? Export a backup first if unsure.`)) return;
    leads = {};
    save();
    render();
    setStatus("List cleared.");
  });

  $("add-manual").addEventListener("click", () => $("manual").showModal());
  $("manual-cancel").addEventListener("click", () => $("manual").close());
  $("manual-form").addEventListener("submit", (event) => {
    const data = Object.fromEntries(new FormData(event.target));
    const id = "manual/" + Date.now();
    leads[id] = {
      id, name: data.name.trim(), group: "", kind: "", address: data.address.trim(), lat: null, lon: null,
      website: cleanUrl(data.website), phone: data.phone.trim(), email: "", social: "", hours: true, chain: false,
      status: "New", notes: "", rating: "", reviews: "", added: Date.now(),
    };
    event.target.reset();
    save();
    render();
  });

  render();
})();
