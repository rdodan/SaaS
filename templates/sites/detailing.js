// Example client: car detailing. Made-up business, placeholder contact details.
window.SITE = {
  catalog: { label: "Detailing and car care", blurb: "Dark and cinematic. A story that plays as you scroll, a before and after slider and detailed packages. Suits detailers, body shops, tinting and wraps." },
  business: {
    name: "Tidewater Auto Care",
    logo: ["Tidewater", " Auto Care"],
    tagline: "Hand car care studio",
    phone: "555-0142",
    email: "hello@example.com",
    address: "12 Example Road, Your Town",
    mapsUrl: "https://www.google.com/maps",
    reviewsUrl: "https://www.google.com/maps",
    instagramUrl: "https://www.instagram.com",
  },
  theme: { skin: "cinema", mode: "dark", bg: "#070c12", bg2: "#0d151e", ink: "#eaf2f8", muted: "#8fa1b1", line: "#1c2a38", accent: "#4fd1c5", accentInk: "#04211e", filmBg: "#04080d", display: "Sora", body: "Inter", uppercase: false, radius: "10px", card: "16px" },
  film: {
    chapters: [
      { title: "Every drive leaves a mark." },
      { title: "Dust settles. Rain dries. Brakes shed.", text: "None of it is dramatic. It simply builds up, week after week, until the colour looks flat." },
      { title: "We take it back, layer by layer.", text: "A slow hand wash, then the paint is cleaned, levelled and sealed so water runs straight off." },
      { title: "Then the inside.", text: "Because that is the part you actually sit in." },
    ],
    // To use real footage: export a clip as numbered JPGs and set
    // sequence: { path: "frames/frame_{n}.jpg", count: 120, pad: 4 }
  },
  hero: { style: "film", title: "Car detailing and paint protection in Your Town", cta: "Get my price" },
  beforeAfter: { kicker: "See the difference", title: ["Drag the line.", "Watch it come back."], text: "One car, photographed before we started and after we finished." },
  services: {
    kicker: "What we offer",
    title: ["Two ways", "to look after it."],
    items: [
      {
        name: "Maintenance Detail",
        text: "For cars that are basically looked after and need a proper reset, inside and out. At our studio or on your drive.",
        groups: [
          { label: "Cabin", items: ["Thorough vacuum, including the boot", "Seats and carpets cleaned", "Dashboard, doors and trim wiped down", "Leather fed where fitted", "Glass, inside"] },
          { label: "Bodywork", items: ["Gentle hand wash and dry", "Wheels and arches", "Tyres dressed", "Glass, outside"] },
        ],
        steps: ["We walk round the car with you and note anything to watch", "The cabin is emptied and cleaned from the roof down", "Wheels are done first, then the body is washed by hand", "Dried, finished and checked with you before you leave"],
      },
      {
        name: "Restoration Detail",
        text: "For paint that has gone dull or swirled. We correct it by machine and seal it under a long-lasting coating.",
        groups: [
          { label: "Cabin", items: ["Everything in the Maintenance Detail", "Steam cleaning", "Carpets and fabric seats wet-cleaned"] },
          { label: "Paintwork", items: ["Pre-wash and contact wash", "Bonded dirt removed chemically and with clay", "Machine polish in one or two stages", "Protective coating", "Wheels polished"] },
        ],
        steps: ["Paint inspected under bright lights and measured", "Deep clean to strip everything off the surface", "A small test area first, then polishing one panel at a time", "Coating applied and left to harden", "Care sheet and a walk-round at collection"],
      },
    ],
  },
  process: {
    kicker: "Working with us",
    title: ["From message", "to mirror finish."],
    steps: [
      { title: "Send us a few details", text: "Car, condition and what bothers you most. Photos help." },
      { title: "We quote and book you in", text: "A clear price and a date, at the studio or at your address." },
      { title: "Collect it gleaming", text: "We show you what we did and how to keep it that way." },
    ],
  },
  work: {
    kicker: "From the studio",
    title: ["Recent cars", "we are proud of."],
    text: "Replace these tiles with your own photos. Your own work always beats stock images.",
    items: [
      { tag: "Machine polish", title: "Black coupe" },
      { tag: "Cabin", title: "Family SUV" },
      { tag: "Leather", title: "Cream interior" },
      { tag: "Bodywork", title: "Daily driver" },
      { tag: "Coating", title: "Brand new hatch" },
      { tag: "Wheels", title: "Diamond-cut alloys" },
    ],
  },
  areas: {
    kicker: "Where we work",
    title: ["Our studio,", "or your driveway."],
    text: "We travel up to about 30 miles for mobile work.",
    groups: [
      { name: "North", blurb: "Closest to the studio.", towns: ["Ashby", "Northfield", "Millbrook", "Oakley", "Stonebridge"] },
      { name: "South", towns: ["Riverton", "Southgate", "Fernhill", "Marlow End"] },
      { name: "East", towns: ["Eastwick", "Harbour Green", "Kingsley", "Thornbury", "Westmere", "Lakeside"] },
    ],
  },
  faq: {
    kicker: "Common questions",
    title: ["Things people", "ask us first."],
    items: [
      { q: "Is a detail just an expensive car wash?", a: "No. A wash takes off loose dirt. A detail cleans every surface properly, puts right what can be put right, and protects it." },
      { q: "How long will you need the car?", a: "Half a day for a Maintenance Detail. A Restoration Detail usually takes one to two days because the coating needs time to harden." },
      { q: "Can you do it at my house?", a: "Yes, if there is room to open the doors fully and we can reach water and a socket." },
      { q: "Will every scratch disappear?", a: "Swirls and light marks, yes. A scratch you can catch with a fingernail has gone through the top layer and needs a body shop." },
      { q: "What should I do afterwards?", a: "Wash it by hand and avoid brush car washes. We give you a short care sheet." },
    ],
  },
  quote: {
    kicker: "Get a price",
    title: ["Tell us about the car.", "We will do the sums."],
    text: "Three taps and your details. We reply the same day.",
    cta: "Get a price",
    endpoint: "",
    steps: [
      { title: "What do you drive?", name: "vehicle", options: ["Hatchback", "Saloon", "SUV", "Van or pickup", "Something else"] },
      { title: "What state is it in?", name: "condition", options: ["Mostly tidy", "Well used", "It has been a while"] },
      { title: "Which sounds right?", name: "package", options: ["Maintenance Detail", "Restoration Detail", "Help me choose"] },
    ],
  },
  chat: {
    greeting: "Hello! What would you like to know?",
    options: [
      { label: "How much will it cost?", reply: "It depends on the car and its condition. Answer three quick questions and we will send a price today.", action: "quote" },
      { label: "Do you travel to me?", reply: "Up to about 30 miles. Look up your town under Areas, or text us your postcode.", action: "text" },
      { label: "I would rather talk", reply: "No problem. Ring or text and we will get back to you quickly.", action: "call" },
    ],
  },
};
