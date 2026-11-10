(function () {
  const cfg = window.SITE_CONFIG || {};
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    if (cfg[el.dataset.cfg]) el.textContent = cfg[el.dataset.cfg];
  });

  const cards = document.getElementById("cards");
  const names = (window.SITE_LIST || []).map((n) => n.replace(/[^a-z0-9-]/gi, ""));

  // Each config sets window.SITE, so load them one at a time and read it.
  function load(name) {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "sites/" + name + ".js";
      script.onload = () => resolve(window.SITE);
      script.onerror = () => resolve(null);
      document.head.append(script);
    });
  }

  function el(tag, props, children) {
    const node = Object.assign(document.createElement(tag), props || {});
    (children || []).forEach((child) => node.append(child));
    return node;
  }

  function card(name, site) {
    const href = "site/?site=" + name;
    const meta = site.catalog || {};
    const theme = site.theme || {};
    const frame = el("iframe", { src: href, title: site.business.name + " preview", loading: "lazy", tabIndex: -1 });
    frame.setAttribute("aria-hidden", "true");
    const preview = el("div", { className: "preview" }, [frame, el("a", { href, ariaLabel: "Open the " + (meta.label || name) + " example" })]);
    const swatches = el("div", { className: "swatches" });
    [theme.bg, theme.accent, theme.ink].forEach((colour) => {
      if (/^#[0-9a-f]{3,8}$/i.test(colour || "")) swatches.append(el("i", { style: "background:" + colour }));
    });
    const info = el("div", { className: "info" }, [
      el("h2", { textContent: meta.label || site.business.name }),
      el("p", { textContent: meta.blurb || "" }),
      swatches,
      el("a", { className: "btn", href, textContent: "Open live example" }),
    ]);
    const scale = () => (frame.style.transform = "scale(" + preview.clientWidth / 1280 + ")");
    new ResizeObserver(scale).observe(preview);
    return el("article", { className: "card-site" }, [preview, info]);
  }

  (async () => {
    for (const name of names) {
      const site = await load(name);
      if (site) cards.append(card(name, site));
    }
    window.SITE = undefined;
  })();
})();
