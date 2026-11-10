# Playbook

How to find prospects, what to look for, how to pitch, and how to deliver the
services you have not sold before. Everything here can be done with free tools.

## 1. Find prospects (15 minutes a day)

1. Open the lead finder (`leads/index.html`), search your town, and work from the top.
   The list is sorted by opportunity score.
2. For each business click **Open in Google Maps** and type the star rating and review
   count into the row. This is the step OpenStreetMap cannot do for you.
3. Confirm the gap is real. OpenStreetMap is community-edited, so "no website listed"
   only means nobody recorded one. Search the business name before you pitch.
4. Skip chains and franchises (hidden by default). The local manager cannot buy from you.

Best prospects, in order:

| Signal | Why it is a good lead | What you sell |
| --- | --- | --- |
| Busy, good business with no website | They have money and an obvious gap | Website |
| Rating under 4.0 with under 30 reviews | A handful of new reviews moves the number | Google profile and reviews |
| Good rating but under 15 reviews | Easy win, low risk for them | Reviews, then SEO |
| Facebook page used as the website | They know they need something | Website |
| Unclaimed or half-empty Google profile | Fast to fix, visible result | Google profile |

Poor prospects: businesses that are closing, ones with many recent angry reviews about
the same real problem (you cannot fix their service), and anyone who needs convincing
that the internet matters.

## 2. The free audit (your foot in the door)

Keep it to one page and 20 minutes of your time. Check and write down:

- **Google profile:** claimed? correct name, address, phone, hours? primary category
  right? number and age of photos? services or menu filled in? replies to reviews?
- **Reviews:** rating, count, date of the latest one, any unanswered bad ones.
- **Website:** exists? loads fast on a phone? phone number tappable? says what they do
  and where in the first screen? Run it through PageSpeed Insights (free) and screenshot the score.
- **Search:** search "[what they do] [town]" in a private window. Are they in the top
  three map results? Who is, and what do those competitors have that they do not?
- **Consistency:** is the name, address and phone identical on Google, Facebook and their site?

End with the three fixes you would do first and a fixed price for each.

## 3. Outreach

Walking in or phoning converts far better than email for local businesses. Go at a
quiet time, ask for the owner, and lead with something specific you noticed.

Opening line: *"I live locally and was looking at [business] on Google. You have great
reviews but I noticed [specific gap]. I put together a short free report on it. Can I
send it to you?"*

Email version, kept short:

> Subject: Quick note about [Business] on Google
>
> Hi [Name], I'm a web developer based in [town]. I looked up [Business] and noticed
> [one specific gap, e.g. "your Google listing has no opening hours and no website link"].
> I wrote up a short free report with three fixes. Would you like me to send it?
> No obligation.
>
> [Your name], [phone]

Rules: one specific observation per message, never criticise their business, one
follow-up after a week and then stop. Email only published business addresses, say who
you are, and stop if they ask. Marketing email rules differ by country, so check yours
before sending in volume.

Track every contact in the lead finder: set the stage and write the next step in notes.
Expect roughly 1 reply in 10 and 1 client in 30 to 50 contacts at the start.

## 4. Delivering each service

### Websites (you know this)

Keep the first clients on a simple one-to-five page static site. Free hosting on
Cloudflare Pages, Netlify or GitHub Pages; the client pays for their own domain
(about 10 to 15 a year) and should own it in their own account.

Every local site needs: what they do and where in the headline, tap-to-call phone,
opening hours, address with a map, real photos, reviews quoted, and one clear action.

### Google Business Profile

The client creates or claims the profile at google.com/business and adds you as a
**manager**. Never create it in your own account. Then:

1. Exact real business name (no added keywords, that risks suspension).
2. The most specific primary category, plus a few secondary ones.
3. Address or service area, phone, website, full opening hours including holidays.
4. Services or products with short descriptions.
5. A 750-character description: what, where, who for.
6. 10 or more real photos: outside, inside, team, work. Add a few every month.
7. Reply to every review, good and bad.
8. Post an update or offer every week or two.

### Reviews

- Get the review link from the profile ("Ask for reviews") and turn it into a QR code
  (free generators exist) on a counter card, receipt or invoice.
- The best moment to ask is right after a happy customer says thank you, in person.
  Follow with a text containing the link.
- Reply to bad reviews within a day: thank them, apologise for the experience, offer
  to fix it offline, never argue.
- Never buy reviews, write fake ones, offer discounts for reviews, or only ask people
  you know are happy ("review gating"). All break Google's rules and can get the
  profile suspended. Reviews can only be removed if they break Google's policies
  (spam, wrong business, abuse); report those from the profile.

### Local SEO

Rankings in the map results come down to relevance, distance and prominence. You
control two of them:

- **On the site:** title tag like "Plumber in Leeds | Business Name", one page per
  main service, town name used naturally, address and phone in the footer matching
  Google exactly, `LocalBusiness` schema markup, fast on mobile.
- **Off the site:** Google profile complete, steady new reviews, same name, address
  and phone on Bing Places, Apple Business Connect, Facebook and the main local directories.
- **Measure:** set up Google Search Console and Google Analytics (both free). Send a
  monthly one-page report: calls and direction requests from the profile, search
  clicks, rating and review count, what you did, what is next.

Be honest about timing: profile fixes show in days, rankings take two to four months.

### Video

Start with what a phone can do well.

- Film vertical (9:16), in daylight, with the phone steady. Clean the lens.
- A clip-on microphone (about 20) improves quality more than any camera.
- Good first videos: a 20-second tour, the owner saying what they do and why, a
  before and after, one customer saying what they liked.
- Hook in the first two seconds, 15 to 40 seconds total, always add captions.
- Edit free in CapCut or DaVinci Resolve. Use only music you are licensed to use; the
  libraries inside Instagram and TikTok are safe on those platforms only.
- Reuse each video: Google profile, website, Instagram Reels, TikTok, YouTube Shorts, Facebook.
- Get written permission from anyone who appears on camera.

### Selling a website: how the conversation goes

Most local owners cannot describe the site they want, but they know instantly what they
like when they see it. So show, do not ask.

1. **Show two or three examples** from the catalog (`templates/`) on your phone or
   laptop. More than three and people stall.
2. **Ask about the business, not the website:** what do you want people to do (call,
   book, visit)? Which jobs make you the most money? Which areas do you cover? What do
   customers always ask?
3. **Build a preview with their name, colours and services** before they pay. Copying a
   config takes under an hour, and a site with their own name on it sells itself.
4. **Agree the scope in writing:** pages and sections, who supplies photos and text,
   two rounds of changes, the price and the date.
5. **Collect the content:** logo, 10 to 20 real photos, services and prices, towns
   covered, opening hours. Content is what delays projects, so chase it early.
6. **Launch, then offer the care plan:** hosting, small changes, Google profile posts
   and a monthly report.

Keep the choice small. "Which of these three do you like, and what colour is your van?"
gets a faster yes than a blank page.

## 5. Pricing to start

Adjust to your area; these are starting shapes, not rules.

| Offer | Type | Starting point |
| --- | --- | --- |
| Free audit | Free | Your foot in the door |
| Google profile setup and tidy | One-off | Low, a few hours of work |
| Review kit (link, QR card, reply templates) | One-off | Low |
| Website, one to five pages | One-off | Your main ticket |
| Care plan: hosting, updates, profile posts, monthly report | Monthly | Recurring income, the real goal |
| Video pack, 3 to 5 short clips | One-off | Mid |

Take 50% up front on one-off work. Do the first one or two clients cheaply in exchange
for a testimonial and permission to show the work, then raise prices.

## 6. When to spend money

Nothing is needed to land the first client. Later, in rough order: a domain for your
own site, a form service if you outgrow the free tier, then the Google Places API for
automatic ratings in the lead finder.
