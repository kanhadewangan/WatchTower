# Watchtower: Product Showcase Video

A ~90-second screen-recorded walkthrough of Watchtower. This README holds the script, shot list and recording checklist.

- **Length:** about 90 seconds (about 220 words of voiceover at a relaxed pace)
- **Format:** 1920×1080, 30 fps, screen recording with voiceover
- **Audience:** developers and small teams who run websites and want to know when one goes down
- **Tone:** calm, confident, no hype. Show the product and let it speak.

> Only show or claim things the app really does today (see [What the video may claim](#what-the-video-may-claim)).

---

## One-line pitch

**Know when your site goes down before your users do.**

---

## Script

| # | Time | On screen | Voiceover | On-screen text |
|---|------|-----------|-----------|----------------|
| 1 | 0:00–0:08 | Landing page hero. Slow scroll down to the product mockup. | "Your website goes down at 3 a.m. Who finds out first: you, or your users?" | **Know when your site goes down before your users do.** |
| 2 | 0:08–0:18 | Click **Start Watching**. The signup page appears. Fill in the form and submit. | "Watchtower watches your sites around the clock. Getting started takes a minute: create an account, and you're in." | Create an account |
| 3 | 0:18–0:30 | Log in, land on the Dashboard (empty state). Click **Add monitor**, type a name and URL, submit. | "Add a site by pasting its URL. No agents to install, no config files." | Add a site in seconds |
| 4 | 0:30–0:45 | Dashboard with 3–4 monitors. Hover the stat cards, then the status banner and the monitors list (Up / Down pills, uptime, response time, last check). | "Your dashboard shows what matters: overall uptime, response times, and the current status of every site, at a glance." | Uptime · Response time · Live status |
| 5 | 0:45–1:00 | Click a monitor. Show the stats, then the response-time chart. Switch 1H → 24H → 7D. Hover for the tooltip. | "Open any monitor for the detail: response-time trends, availability, and every check that ran. Switch the time range to zoom in or out." | Charts for 1H · 24H · 7D · 30D |
| 6 | 1:00–1:12 | Cut to a monitor that is **Down** (red banner on the Dashboard). Then show the alert email in an inbox. | "When something breaks, Watchtower emails you, so you hear about it from us, not from a customer." | Email alerts |
| 7 | 1:12–1:22 | Sidebar → **Incident Log**. Show an ongoing incident and a resolved one with duration and failed checks. Click one to open the monitor. | "Every outage is recorded in the incident log: when it started, how long it lasted, and when it was fixed." | Incident log |
| 8 | 1:22–1:30 | Back to the landing page, the pricing card, then the logo and **Start Watching**. | "Watchtower is free while we're in beta. Start watching today." | **Start Watching** · Free during beta |

### Voiceover (read straight through)

> Your website goes down at 3 a.m. Who finds out first: you, or your users?
>
> Watchtower watches your sites around the clock. Getting started takes a minute: create an account, and you're in.
>
> Add a site by pasting its URL. No agents to install, no config files.
>
> Your dashboard shows what matters: overall uptime, response times, and the current status of every site, at a glance.
>
> Open any monitor for the detail: response-time trends, availability, and every check that ran. Switch the time range to zoom in or out.
>
> When something breaks, Watchtower emails you, so you hear about it from us, not from a customer.
>
> Every outage is recorded in the incident log: when it started, how long it lasted, and when it was fixed.
>
> Watchtower is free while we're in beta. Start watching today.

---

## What the video may claim

Everything below is implemented. Anything not on this list should stay out of the video.

| Claim | Where it lives |
|-------|----------------|
| Sign up, log in | `/signup`, `/login` |
| Add a site by name and URL | Dashboard → **Add monitor** |
| Checks run about every minute once monitoring is started | Monitor page → **Enlist New Check** |
| Per-site uptime, average response time, error rate | Dashboard and monitor page |
| Response-time and availability charts with 1H / 24H / 7D / 30D ranges | Monitor page |
| Email alert when the error rate is above 5% or uptime drops below 90% | `service/timer.ts` (checked every 5 minutes) |
| Incident log derived from failed checks (ongoing / resolved, duration) | `/incidents` |
| 30 days of check history is kept | `service/timer.ts` daily cleanup |
| Free during beta | Landing page pricing card |

**Do not claim:** checking from multiple regions (the region picker is only a label), a specific alert speed, uptime figures, user counts, customers or testimonials, or paid plans.

---

## Optional: 20-second "under the hood" cut (for developers)

Use for a technical audience or a repo README embed.

| Time | On screen | Voiceover |
|------|-----------|-----------|
| 0:00–0:07 | Architecture diagram from the main README | "Checks run on a timer and are pushed onto a Redis buffer instead of hitting the database on every request." |
| 0:07–0:14 | Terminal showing the flush log line | "A worker drains the buffer in batches and writes them to Postgres in one query." |
| 0:14–0:20 | Incident Log or the charts | "From there, the dashboard, charts and incident log are all built from the same check history." |

---

## Recording checklist

### Before you record

- [ ] Run the API, the frontend, Postgres and Redis locally (`docker compose up -d`, `bun run api/index.ts`, and `npm run dev` in `frontend/`). Restart the API after code changes.
- [ ] Create a clean demo account.
- [ ] Add 3–4 demo sites that are good to look at:
  - 2–3 healthy sites you own or that are safe to ping (for example `https://example.com`).
  - 1 site that fails on purpose, such as a made-up hostname, so you have an ongoing incident and a Down status.
- [ ] Start monitoring on each site from its monitor page, and let it run for at least 30 minutes so the charts and the incident log have data. For a resolved incident, point a site at a bad URL, then fix it.
- [ ] Confirm email alerts work (SMTP settings in `.env`) and capture the alert email.
- [ ] Hide personal data: browser bookmarks, other tabs, notifications, real email addresses in the inbox.
- [ ] Clean browser window at 1920×1080, zoom 100%, dark mode, no extensions visible.

### While recording

- Record each scene as its own clip so a retake only costs a few seconds.
- Move the cursor slowly and deliberately. Pause for a beat after each click.
- Don't type in real time: pre-fill or speed up the typing in the edit.
- Record the voiceover separately, in a quiet room, after the screen capture is locked.

### Edit and polish

- Add the on-screen text from the table as short, bottom-aligned captions.
- Gentle zoom (110–125%) on the element being described: stat cards, chart, incident row.
- Soft background music, mixed low under the voiceover.
- End card: Watchtower logo, **Start Watching**, and the site URL.
- Export an MP4 (H.264) and add captions (`.srt`) for accessibility and muted autoplay.

---

## Deliverables

| File | Purpose |
|------|---------|
| `showcase.mp4` | Main 90-second video |
| `showcase.srt` | Captions |
| `thumbnail.png` | 1280×720 thumbnail: dashboard screenshot plus the headline |
| `showcase-short.mp4` (optional) | 20–30 s vertical cut for social media, scenes 1, 4 and 6 |
