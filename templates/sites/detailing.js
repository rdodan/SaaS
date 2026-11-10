// Example client: car detailing. Made-up business, placeholder contact details.
window.SITE = {
  catalog: { label: "Detailing and car care", blurb: "Dark and cinematic. A story that plays as you scroll, a before and after slider and detailed packages. Suits detailers, body shops, tinting and wraps." },
  business: {
    name: "Gloss Garage",
    logo: ["Gloss", "Garage"],
    tagline: "Professional car detailing",
    phone: "555-0142",
    email: "hello@example.com",
    address: "12 Example Road, Your Town",
    mapsUrl: "https://www.google.com/maps",
    reviewsUrl: "https://www.google.com/maps",
    instagramUrl: "https://www.instagram.com",
  },
  theme: { skin: "cinema", mode: "dark", bg: "#0b0b0d", bg2: "#131316", ink: "#f4f2ee", muted: "#9d9a95", line: "#28282c", accent: "#ff3b4e", accentInk: "#ffffff", display: "Anton", body: "Manrope" },
  film: {
    chapters: [
      { title: "Your car works hard for you." },
      { title: "Road salt. Grime. Sun.", text: "They wear the paint down a little every week. A safe, thorough wash is where looking after it starts." },
      { title: "Polish. Then protect.", text: "Machine polishing takes out fine swirl marks. A coating then seals the finish against water, dirt and UV." },
      { title: "You spend a lot of time in there.", text: "Make it somewhere clean." },
    ],
    // To use real footage: export a clip as numbered JPGs and set
    // sequence: { path: "frames/frame_{n}.jpg", count: 120, pad: 4 }
  },
  hero: { style: "film", title: "Professional car detailing in Your Town", cta: "Book now" },
  beforeAfter: { kicker: "Before and after", title: ["Same car.", "New light."], text: "The only difference is a careful, step-by-step detail." },
  services: {
    kicker: "Detailing packages",
    title: ["Refresh it.", "Or restore it."],
    items: [
      {
        name: "Standard Package",
        text: "A deep interior clean plus an exterior wash. At our garage or at your place.",
        groups: [
          { label: "Interior", items: ["Full vacuum", "Carpet and upholstery clean", "Plastics and trim", "Leather clean and condition", "Interior glass"] },
          { label: "Exterior", items: ["Hand wash", "Wheels cleaned and protected", "Tyre dressing", "Exterior glass"] },
        ],
        steps: ["Walk-round and photos with you", "Interior emptied, vacuumed and cleaned top to bottom", "Wheels first, then a two-bucket hand wash", "Dry, dress and final inspection together"],
      },
      {
        name: "Premium Package",
        text: "Paint correction and a protective coating, plus our most complete interior detail.",
        groups: [
          { label: "Interior", items: ["Everything in Standard", "Steam clean", "Carpet shampoo and extraction", "Seat shampoo"] },
          { label: "Exterior restoration", items: ["Foam pre-wash and safe wash", "Iron remover and clay bar", "One or two stage machine polish", "Protective coating", "Wheel polish"] },
        ],
        steps: ["Inspection under proper lighting", "Decontamination wash", "Test spot, then machine polishing panel by panel", "Coating applied and left to cure", "Handover with care instructions"],
      },
    ],
  },
  process: {
    kicker: "How it works",
    title: ["Simple. Careful.", "Three steps."],
    steps: [
      { title: "Free inspection and quote", text: "We look over your car, talk through what you want and recommend the right package." },
      { title: "The detail", text: "We clean, correct and protect using safe methods and professional products." },
      { title: "Handover and care tips", text: "We walk you through the result and show you how to make it last." },
    ],
  },
  work: {
    kicker: "Recent work",
    title: ["Real cars.", "Real finishes."],
    text: "Replace these tiles with your own photos. Real work always beats stock images.",
    items: [
      { tag: "Paint correction", title: "Black coupe" },
      { tag: "Interior detail", title: "Family SUV" },
      { tag: "Interior detail", title: "Leather refresh" },
      { tag: "Exterior detail", title: "Daily driver" },
      { tag: "Coating", title: "New car protection" },
      { tag: "Wheels", title: "Alloy refurbish" },
    ],
  },
  areas: {
    kicker: "Areas we serve",
    title: ["Within 30 miles", "of our garage."],
    text: "Bring the car to us, or we come to your home or workplace.",
    groups: [
      { name: "North", blurb: "Our home patch.", towns: ["Ashby", "Northfield", "Millbrook", "Oakley", "Stonebridge"] },
      { name: "South", towns: ["Riverton", "Southgate", "Fernhill", "Marlow End"] },
      { name: "East", towns: ["Eastwick", "Harbour Green", "Kingsley", "Thornbury", "Westmere", "Lakeside"] },
    ],
  },
  faq: {
    kicker: "Questions",
    title: ["Good", "questions."],
    items: [
      { q: "What is the difference between a car wash and a detail?", a: "A wash removes surface dirt. A detail deep cleans, restores and protects every surface, inside and out." },
      { q: "How long does it take?", a: "A standard package takes a few hours. Paint correction and coating usually needs the car for a day or two." },
      { q: "Do you come to me?", a: "Yes. We work at your home or workplace as long as there is space around the car and access to water and power." },
      { q: "Will polishing remove every scratch?", a: "It removes swirl marks and light scratches. Deep scratches you can feel with a fingernail usually need paintwork." },
      { q: "How do I look after it afterwards?", a: "We show you at handover. In short: gentle hand washes and no automatic brush washes." },
    ],
  },
  quote: {
    kicker: "Free quote",
    title: ["Some cars get washed.", "Yours gets detailed."],
    text: "Tell us about your car. We will get back to you shortly.",
    endpoint: "",
    steps: [
      { title: "First, your car.", name: "vehicle", options: ["Hatchback", "Saloon", "SUV", "Van or pickup", "Something else"] },
      { title: "Be honest. How bad is it?", name: "condition", options: ["Pretty clean", "Lived in", "Needs rescuing"] },
      { title: "What are you after?", name: "package", options: ["Standard Package", "Premium Package", "Not sure yet"] },
    ],
  },
  chat: {
    greeting: "Hi! What can we help with?",
    options: [
      { label: "Get a price", reply: "Prices depend on the car and its condition. Three quick questions and we will send you a quote.", action: "quote" },
      { label: "Do you come to me?", reply: "Yes, within about 30 miles. Check your town in the Areas section, or text us your postcode.", action: "text" },
      { label: "Talk to a person", reply: "Of course. Call or text and we will pick up as soon as we can.", action: "call" },
    ],
  },
};
