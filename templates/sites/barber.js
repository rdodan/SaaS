// Example client: barbershop. Made-up business, placeholder contact details.
window.SITE = {
  catalog: { label: "Barbers and salons", blurb: "Warm and classic. Suits barbers, hair and beauty salons, tattoo studios." },
  business: {
    name: "Oak & Blade",
    logo: ["Oak &", " Blade"],
    tagline: "Barbershop",
    phone: "555-0178",
    email: "hello@example.com",
    address: "4 Example Street, Your Town",
    mapsUrl: "https://www.google.com/maps",
    reviewsUrl: "https://www.google.com/maps",
    instagramUrl: "https://www.instagram.com",
  },
  theme: { mode: "light", bg: "#f5efe6", bg2: "#ebe3d6", ink: "#221a15", muted: "#6f6258", line: "#d6cab8", accent: "#8c2f1b", accentInk: "#ffffff", filmBg: "#140e0b", display: "DM Serif Display", body: "DM Sans", serif: true, uppercase: false, radius: "8px" },
  film: {
    chapters: [
      { title: "A good haircut takes time." },
      { title: "So we take it.", text: "Thirty unhurried minutes, one barber, your chair." },
      { title: "Hot towel. Sharp blade.", text: "The traditional shave, done properly." },
    ],
  },
  hero: { title: "Traditional barbershop in Your Town", cta: "Book a chair" },
  beforeAfter: { kicker: "Before and after", title: ["Walk in rough.", "Walk out sharp."], text: "Drag the handle to compare." },
  services: {
    kicker: "Services",
    title: ["Cuts,", "shaves and beards."],
    items: [
      { name: "The Cut", price: "From 22", text: "Consultation, cut, wash and style.", groups: [{ label: "Includes", items: ["Consultation", "Scissor or clipper cut", "Wash", "Style and product"] }] },
      { name: "Cut and Shave", price: "From 38", text: "The full sitting. Leave an hour.", groups: [{ label: "Includes", items: ["Everything in The Cut", "Hot towel", "Straight razor shave", "Beard shaping"] }], steps: ["Consultation in the chair", "Cut and wash", "Hot towel and lather", "Straight razor shave and finish"] },
    ],
  },
  process: { kicker: "How it works", title: ["Book. Sit.", "Relax."], steps: [{ title: "Book online or walk in", text: "Booked chairs are never kept waiting." }, { title: "Tell us what you want", text: "Bring a photo if it helps. We will tell you honestly what suits." }, { title: "Leave looking sharp", text: "With advice on keeping it that way." }] },
  work: { kicker: "Recent cuts", title: ["Our work,", "our chairs."], text: "Replace these tiles with your own photos.", items: [{ tag: "Fade", title: "Skin fade" }, { tag: "Classic", title: "Side part" }, { tag: "Beard", title: "Beard sculpt" }, { tag: "Shave", title: "Hot towel shave" }] },
  faq: { kicker: "Questions", title: ["Before", "you book."], items: [{ q: "Do I need to book?", a: "Walk-ins are welcome, but booking guarantees your time." }, { q: "Do you cut children's hair?", a: "Yes, from age five." }, { q: "How do I pay?", a: "Card or cash, in the shop." }] },
  quote: {
    kicker: "Book a chair",
    title: ["Pick a service.", "We do the rest."],
    text: "Request a time and we will confirm by text.",
    cta: "Book now",
    submit: "Request my booking",
    endpoint: "",
    steps: [
      { title: "What are you having?", name: "service", options: ["The Cut", "Cut and Shave", "Beard only", "Not sure"] },
      { title: "When suits you?", name: "when", options: ["Weekday daytime", "Weekday evening", "Saturday"] },
    ],
  },
  chat: { greeting: "Hello! How can we help?", options: [{ label: "Book a chair", reply: "Two quick questions and we will confirm a time by text.", action: "quote" }, { label: "Opening hours", reply: "Tuesday to Saturday, 9 to 6. Late night Thursday.", action: null }, { label: "Call the shop", reply: "Give us a ring.", action: "call" }] },
};
