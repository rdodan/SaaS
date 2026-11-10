// Everything you are likely to change lives here. Edit, save, refresh.
window.SITE_CONFIG = {
  // Your business details, shown across the public site.
  name: "Your Studio",
  area: "your area", // e.g. "Leeds" -> "Helping Leeds businesses..."
  email: "hello@example.com",
  phone: "", // optional, e.g. "+44 7700 900000". Leave empty to hide it.

  // Contact form delivery.
  // Empty  -> the form opens the visitor's email app with the message filled in.
  // A URL  -> the form posts there instead (e.g. a free Formspree or Web3Forms
  //           endpoint). No account is needed until you want this.
  formEndpoint: "",

  // Used by the lead finder when it drafts outreach emails.
  yourName: "", // e.g. "Alex" -> "I'm Alex, a web developer based in..."
  siteUrl: "", // your published address, e.g. "https://yourstudio.com". Example links in emails need it.

  // Default search location for the lead finder (leads/index.html).
  leadFinderDefaultPlace: "",
};
