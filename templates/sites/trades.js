// Example client: plumbing and heating. Made-up business, placeholder contact details.
window.SITE = {
  catalog: { label: "Trades and home services", blurb: "Clean and trustworthy. Suits plumbers, electricians, roofers, cleaners, landscapers." },
  business: {
    name: "Brightline Plumbing",
    logo: ["Brightline", " Plumbing"],
    tagline: "Plumbing and heating",
    phone: "555-0116",
    email: "hello@example.com",
    address: "Unit 3, Example Trade Park, Your Town",
    mapsUrl: "https://www.google.com/maps",
    reviewsUrl: "https://www.google.com/maps",
  },
  theme: { mode: "dark", bg: "#0a1622", bg2: "#0f1f30", ink: "#eef4fa", muted: "#93a6ba", line: "#1f3348", accent: "#ffb020", accentInk: "#10161d", filmBg: "#06101a", display: "Archivo", body: "Inter", radius: "10px" },
  film: {
    chapters: [
      { title: "It always leaks on a Sunday." },
      { title: "So we answer on a Sunday.", text: "A real person picks up, tells you when we will arrive, and turns up then." },
      { title: "Fixed price. Tidy work.", text: "You get the price before we start, and a clean floor when we leave." },
    ],
  },
  hero: { title: "Plumbing and heating in Your Town", cta: "Get a quote" },
  services: {
    kicker: "What we do",
    title: ["Repairs.", "Installs. Emergencies."],
    items: [
      { name: "Repairs and Emergencies", text: "Leaks, bursts, blockages and no hot water. Same-day where we can.", groups: [{ label: "Common jobs", items: ["Leaking taps and pipes", "Blocked drains and toilets", "Burst pipes", "No heating or hot water"] }], steps: ["Call or text us with a photo", "We give a time and a price range", "Fault found and price confirmed before work", "Fixed, tested and cleaned up"] },
      { name: "Bathrooms and Heating", text: "New bathrooms, boilers and radiators, planned around your household.", groups: [{ label: "Bathrooms", items: ["Design help", "Full fit-out", "Tiling and finishing"] }, { label: "Heating", items: ["Boiler replacement", "Radiators and valves", "Annual service"] }] },
    ],
  },
  process: { kicker: "How it works", title: ["No surprises.", "Three steps."], steps: [{ title: "Tell us the problem", text: "A photo or short video is often enough for a price." }, { title: "Fixed quote", text: "Written down, before any work starts." }, { title: "Done properly", text: "Tested, tidied and guaranteed." }] },
  work: { kicker: "Recent jobs", title: ["Real homes.", "Real work."], text: "Replace these tiles with your own photos.", items: [{ tag: "Bathroom", title: "Full refit" }, { tag: "Heating", title: "Boiler swap" }, { tag: "Repair", title: "Burst pipe" }] },
  areas: { kicker: "Areas we cover", title: ["Local,", "and nearby."], text: "If you are close to one of these, ask.", groups: [{ name: "Your Town", towns: ["Town Centre", "Northfield", "Southgate", "Riverside"] }, { name: "Nearby", towns: ["Ashby", "Millbrook", "Oakley", "Kingsley", "Lakeside"] }] },
  faq: { kicker: "Questions", title: ["Straight", "answers."], items: [{ q: "Do you charge a call-out fee?", a: "We tell you any charge before we set off, so there is never a surprise." }, { q: "Are you insured?", a: "Yes, fully. Certificates on request." }, { q: "How fast can you come?", a: "Emergencies are usually same day. Planned work is booked to suit you." }] },
  quote: {
    kicker: "Free quote",
    title: ["Tell us the job.", "Get a price."],
    text: "Three quick questions.",
    endpoint: "",
    steps: [
      { title: "What do you need?", name: "job", options: ["Emergency repair", "Repair, not urgent", "New bathroom", "Boiler or heating", "Something else"] },
      { title: "How soon?", name: "urgency", options: ["Today", "This week", "Just planning"] },
    ],
  },
  chat: { greeting: "Hi! Is it an emergency?", options: [{ label: "Yes, it is urgent", reply: "Call us now and we will talk you through turning the water off.", action: "call" }, { label: "No, I need a quote", reply: "Three quick questions and we will get back to you with a price.", action: "quote" }, { label: "Do you cover my area?", reply: "Probably. Check the Areas section or text us your postcode.", action: "text" }] },
};
