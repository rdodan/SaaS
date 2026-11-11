(function () {
  "use strict";

  const STORE_KEY = "leadfinder.v1";
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

  const cfg = window.SITE_CONFIG || {};
  const FOLLOW_UP_DAYS = 7;
  // Which example site to link for each kind of business.
  const EXAMPLE = { food: "restaurant", beauty: "barber", fitness: "gym", auto: "detailing" };

  const $ = (id) => document.getElementById(id);
  let leads = load();
  let page = 1;
  let pageSize = Number(localStorage.getItem(STORE_KEY + ".pageSize")) || 25;

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

  // Above this range only businesses with no website are fetched, to keep the amount of data manageable.
  const WIDE_MILES = 25;
  const MAX_RESULTS = 3000;

  function buildQuery(lat, lon, miles, groupIds) {
    const around = `(around:${Math.round(miles * 1609.344)},${lat},${lon})`;
    const noSite = miles >= WIDE_MILES ? '[!"website"][!"contact:website"]' : "";
    const clauses = [];
    GROUPS.filter((g) => groupIds.includes(g.id)).forEach((group) => {
      Object.entries(group.tags).forEach(([key, values]) => {
        const filter = values === "*" ? `["${key}"]` : `["${key}"~"^(${values})$"]`;
        clauses.push(`nwr["name"]${filter}${noSite}${around};`);
      });
    });
    return `[out:json][timeout:180][maxsize:536870912];(${clauses.join("")});out center tags ${MAX_RESULTS};`;
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
    throw new Error("The OpenStreetMap server is busy or the search was too large (" + lastError.message + "). Wait a minute, or try a smaller range or fewer business types.");
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
    if (!lead.website && !lead.siteFound) add("No website listed", 50, true);
    else if (lead.website && isSocial(lead.website)) add("Social page as website", 35, true);
    else if (lead.website && lead.website.startsWith("http://")) add("Site not secure (http)", 10);
    if (lead.rating !== "" && lead.rating != null && Number(lead.rating) < 4) add("Low rating", 30, true);
    if (lead.reviews !== "" && lead.reviews != null && Number(lead.reviews) < 15) add("Few reviews", 15);
    if (!lead.hours) add("No opening hours listed", 5);
    if (!lead.phone) add("No phone listed", 5);
    return { gaps, score };
  }

  // ---------- outreach emails ----------

  function followUpDue(lead) {
    return lead.status === "Contacted" && lead.contactedAt && Date.now() - lead.contactedAt > FOLLOW_UP_DAYS * 86400000;
  }

  function exampleLink(lead) {
    if (!cfg.siteUrl) return "[add your site address to config.js]";
    return cfg.siteUrl.replace(/\/+$/, "") + "/templates/site/index.html?site=" + (EXAMPLE[lead.group] || "trades");
  }

  // Writes a first email built around the most obvious gap, or a short follow-up
  // if the business was already contacted more than a week ago.
  function compose(lead) {
    const me = cfg.yourName || "[your name]";
    const sign = [me, cfg.name, cfg.phone].filter(Boolean).join("\n");
    const optOut = "If you would rather not hear from me again, just reply and say so.";
    if (followUpDue(lead)) {
      return {
        subject: "Re: " + lead.name + " online",
        body: `Hi,\n\nI sent a note last week about ${lead.name} and wanted to check it reached you.\n\nThe offer stands: I can put together a free preview of a site with your name, colours and services on it, so you can see it before deciding anything. Here is an example: ${exampleLink(lead)}\n\nNo worries at all if now is not the time.\n\n${sign}\n\n${optOut}`,
      };
    }
    const rated = lead.rating !== "" && lead.rating != null;
    let noticed;
    let why;
    if (!lead.website && !lead.siteFound) {
      noticed = "I could not find a website for you";
      why = "Most people look a business up online before they call. A simple, fast site with your services, opening hours and phone number usually pays for itself quickly.";
    } else if (lead.website && isSocial(lead.website)) {
      noticed = "your social media page is doing the job of a website";
      why = "That works for people who already follow you, but it is hard to find on Google, and new customers often cannot see your prices or opening hours at a glance.";
    } else if (rated && Number(lead.rating) < 4) {
      noticed = `your Google rating is ${lead.rating}${lead.reviews ? " from " + lead.reviews + " reviews" : ""}, which I suspect does not reflect the work you do`;
      why = "A handful of recent reviews from happy customers moves that number quickly. I set up a simple way to ask for them, and help with replies to the difficult ones.";
    } else if (lead.reviews !== "" && lead.reviews != null && Number(lead.reviews) < 15) {
      noticed = `you only have ${lead.reviews} Google reviews`;
      why = "Businesses with more recent reviews show up higher and get more calls. I set up a simple way to ask happy customers for one.";
    } else if (lead.website && lead.website.startsWith("http://")) {
      noticed = "your website shows a \"not secure\" warning in some browsers";
      why = "That puts some visitors off before they read a word. It is usually a quick fix, and a good moment to freshen the site up.";
    } else {
      noticed = "a few things that could bring you more customers from Google";
      why = "I would be glad to send you a short free report with the three fixes I would make first.";
    }
    return {
      subject: "Quick note about " + lead.name + " online",
      body: `Hi,\n\nI'm ${me}, a web developer based in ${cfg.area || "[your area]"}. I was looking at ${lead.name} online and noticed ${noticed}.\n\n${why}\n\nHere is an example of the kind of site I build for businesses like yours: ${exampleLink(lead)}\n\nWould it be useful if I put together a quick preview with your name, colours and services on it? It is free and there is no obligation.\n\n${sign}\n\n${optOut}`,
    };
  }

  let drafting = null;
  function openDraft(id) {
    const lead = leads[id];
    if (!lead) return;
    drafting = lead;
    const mail = compose(lead);
    $("draft-name").textContent = lead.name;
    $("draft-to").value = lead.email || "";
    $("draft-subject").value = mail.subject;
    $("draft-body").value = mail.body;
    const missing = [!cfg.yourName && "your name", !cfg.siteUrl && "your site address"].filter(Boolean);
    $("draft-warn").hidden = !missing.length;
    $("draft-warn").textContent = missing.length ? "Add " + missing.join(" and ") + " to config.js so the email is complete." : "";
    $("draft").showModal();
  }

  function markContacted() {
    if (!drafting) return;
    drafting.email = $("draft-to").value.trim();
    drafting.status = "Contacted";
    drafting.contactedAt = Date.now();
    save();
    render();
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
    if (followUpDue(lead)) wrap.append(el("span", { className: "gap due", textContent: "Follow-up due" }));
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
    contact.append(el("div", {}, [link("https://www.google.com/search?q=" + encodeURIComponent(lead.name + " " + (lead.address || "")), "Google this business")]));
    // OpenStreetMap often has no website recorded for a business that does have one.
    if (!lead.website) {
      const siteBtn = el("button", { type: "button", className: "linklike plain", textContent: lead.siteFound ? "Undo: no website after all" : "Has a website" });
      siteBtn.dataset.site = lead.id;
      contact.append(el("div", {}, [siteBtn]));
    }
    if (!lead.email) contact.append(el("div", {}, [link("https://www.google.com/search?q=" + encodeURIComponent('"' + lead.name + '" ' + (lead.address || "") + " email contact"), "Search for an email")]));
    // Start a preview site for this business in the site builder, with what we know filled in.
    const builder = new URLSearchParams({ type: EXAMPLE[lead.group] || "trades", name: lead.name });
    if (lead.phone) builder.set("phone", lead.phone);
    if (lead.address) builder.set("address", lead.address);
    contact.append(el("div", {}, [link("../intake/index.html?" + builder, "Build a preview site")]));
    const draftBtn = el("button", { type: "button", className: "draft-btn", textContent: followUpDue(lead) ? "Draft follow-up" : "Draft email" });
    draftBtn.dataset.draft = lead.id;
    contact.append(draftBtn);

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
    const hasEmail = $("f-email").checked;
    return Object.values(leads)
      .filter((lead) => {
        if (hideChains && lead.chain) return false;
        if (hasEmail && !lead.email) return false;
        if (status === "due") return followUpDue(lead);
        if (noWeb && (lead.website || lead.siteFound)) return false;
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
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    page = Math.min(Math.max(1, page), pages);
    const first = (page - 1) * pageSize;
    $("rows").replaceChildren(...list.slice(first, first + pageSize).map(row));
    drawPager(pages, list.length);
    $("empty").hidden = total > 0;
    $("count").textContent = total ? (list.length ? `Showing ${first + 1} to ${Math.min(first + pageSize, list.length)} of ${list.length} matching` : "Nothing matches these filters") + ` (${total} saved), best opportunities first.` : "";
    if (!$("map-wrap").hidden) drawMap(list);
  }

  // ---------- map ----------

  let map = null;
  let markers = null;
  function drawMap(list) {
    if (!window.L) return;
    if (!map) {
      map = L.map("map");
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
      markers = L.layerGroup().addTo(map);
    }
    markers.clearLayers();
    const points = [];
    list.forEach((lead) => {
      if (lead.lat == null || lead.lon == null) return;
      const score = assess(lead).score;
      const contacted = lead.status && lead.status !== "New";
      const colour = contacted ? "#8a8f98" : score >= 50 ? "#d1432b" : score >= 15 ? "#e0a100" : "#5d8a6f";
      const marker = L.circleMarker([lead.lat, lead.lon], { radius: 8, color: "#fff", weight: 2, fillColor: colour, fillOpacity: 0.95 });
      marker.bindPopup(() => popup(lead));
      marker.addTo(markers);
      points.push([lead.lat, lead.lon]);
    });
    map.invalidateSize();
    if (points.length) map.fitBounds(points, { padding: [30, 30], maxZoom: 16 });
    else map.setView([20, 0], 2);
  }

  function popup(lead) {
    const actions = el("div", { className: "pop-actions" });
    if (lead.phone) actions.append(el("a", { href: "tel:" + lead.phone.replace(/[^\d+]/g, ""), textContent: lead.phone }));
    actions.append(link(mapsUrl(lead), "Google Maps"));
    const draftBtn = el("button", { type: "button", className: "draft-btn", textContent: followUpDue(lead) ? "Draft follow-up" : "Draft email" });
    draftBtn.addEventListener("click", () => openDraft(lead.id));
    actions.append(draftBtn);
    return el("div", {}, [
      el("div", { className: "name", textContent: lead.name }),
      el("div", { className: "sub", textContent: [lead.kind, lead.address, lead.status && lead.status !== "New" ? lead.status : ""].filter(Boolean).join(" · ") }),
      ...gapsCell(lead),
      actions,
    ]);
  }

  function setView(showMap) {
    $("map-wrap").hidden = !showMap;
    $("list-wrap").hidden = showMap;
    $("view-map").setAttribute("aria-pressed", String(showMap));
    $("view-list").setAttribute("aria-pressed", String(!showMap));
    render();
  }

  // Page buttons: first, last, and the pages around the current one.
  function drawPager(pages, count) {
    $("pager").hidden = count <= 10 || !$("map-wrap").hidden;
    const box = $("pages");
    const button = (label, target, opts) => {
      const b = el("button", { type: "button", className: "ghost", textContent: label, disabled: Boolean(opts && opts.disabled) });
      if (opts && opts.current) b.setAttribute("aria-current", "page");
      if (opts && opts.name) b.setAttribute("aria-label", opts.name);
      b.dataset.page = target;
      return b;
    };
    const items = [button("\u2039 Prev", page - 1, { disabled: page === 1, name: "Previous page" })];
    let last = 0;
    for (let n = 1; n <= pages; n += 1) {
      if (n !== 1 && n !== pages && Math.abs(n - page) > 1) continue;
      if (n - last > 1) items.push(el("span", { textContent: "\u2026" }));
      items.push(button(String(n), n, { current: n === page, name: "Page " + n }));
      last = n;
    }
    items.push(button("Next \u203a", page + 1, { disabled: page === pages, name: "Next page" }));
    box.replaceChildren(...items);
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
      const miles = Number($("radius").value);
      setStatus(`Finding businesses within ${miles} miles of ${spot.label}...` + (miles >= WIDE_MILES ? " A wide range can take a minute or two." : ""));
      const elements = await overpass(buildQuery(spot.lat, spot.lon, miles, groupIds));

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
      page = 1;
      render();
      setStatus(`Found ${kept} businesses within ${miles} miles of ${spot.label}. ${added} of them are new to your list.` +
          (miles >= WIDE_MILES ? " At this range only businesses with no website listed are fetched." : "") +
          (elements.length >= MAX_RESULTS ? ` That is the limit of ${MAX_RESULTS} per search, so there are more: choose fewer business types or a smaller range to see the rest.` : ""));
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
      return [lead.name, lead.kind, lead.address, lead.phone, lead.email, lead.website || (lead.siteFound ? "yes (checked by hand)" : ""), lead.social, lead.rating, lead.reviews,
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

  let toastTimer;
  function undoToast(text, undo) {
    const toast = $("toast");
    const button = el("button", { type: "button", className: "ghost", textContent: "Undo" });
    button.addEventListener("click", () => {
      undo();
      toast.hidden = true;
    });
    toast.replaceChildren(el("span", { textContent: text }), button);
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 10000);
  }

  // ---------- wiring ----------

  GROUPS.forEach((group) => {
    const box = el("input", { type: "checkbox", value: group.id, checked: group.on });
    $("groups").append(el("label", { className: "chip" }, [box, group.label]));
    $("f-group").append(el("option", { value: group.id, textContent: group.label }));
  });
  STAGES.forEach((name) => $("f-status").append(el("option", { value: name, textContent: name })));
  $("f-status").append(el("option", { value: "due", textContent: "Follow-up due" }));
  $("place").value = localStorage.getItem(STORE_KEY + ".place") || (window.SITE_CONFIG || {}).leadFinderDefaultPlace || "";

  $("search").addEventListener("submit", search);
  ["q", "f-group", "f-status", "f-noweb", "f-chains", "f-email"].forEach((id) =>
    $(id).addEventListener("input", () => {
      page = 1;
      render();
    })
  );
  $("page-size").value = String(pageSize);
  $("page-size").addEventListener("change", () => {
    pageSize = Number($("page-size").value);
    localStorage.setItem(STORE_KEY + ".pageSize", pageSize);
    page = 1;
    render();
  });
  $("pages").addEventListener("click", (event) => {
    const target = Number(event.target.dataset.page);
    if (!target || event.target.disabled) return;
    page = target;
    render();
    $("list-wrap").scrollIntoView({ block: "start" });
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

  $("view-list").addEventListener("click", () => setView(false));
  $("view-map").addEventListener("click", () => setView(true));
  $("rows").addEventListener("click", (event) => {
    if (event.target.dataset.draft) openDraft(event.target.dataset.draft);
    const lead = leads[event.target.dataset.site];
    if (lead) {
      lead.siteFound = !lead.siteFound;
      save();
      render();
      // The row may drop down the list or out of the current filter, so offer a way back.
      undoToast(lead.siteFound ? `Marked "${lead.name}" as having a website.` : `"${lead.name}" is back to no website.`, () => {
        lead.siteFound = !lead.siteFound;
        save();
        render();
      });
    }
  });
  $("draft-cancel").addEventListener("click", () => $("draft").close());
  $("draft-copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("draft-body").value);
    $("draft-copy").textContent = "Copied";
    setTimeout(() => ($("draft-copy").textContent = "Copy message"), 1500);
  });
  $("draft-send").addEventListener("click", () => {
    const to = $("draft-to").value.trim();
    if (!to || !$("draft-to").checkValidity()) {
      $("draft-warn").hidden = false;
      $("draft-warn").textContent = "Add the business's email address first, or use Copy message and send it another way.";
      return $("draft-to").focus();
    }
    window.location.href = "mailto:" + encodeURIComponent(to) + "?subject=" + encodeURIComponent($("draft-subject").value) + "&body=" + encodeURIComponent($("draft-body").value);
    markContacted();
    $("draft").close();
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
      website: cleanUrl(data.website), phone: data.phone.trim(), email: data.email.trim(), social: "", hours: true, chain: false,
      status: "New", notes: "", rating: "", reviews: "", added: Date.now(),
    };
    event.target.reset();
    save();
    render();
  });

  render();
})();
