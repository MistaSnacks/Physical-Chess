# Physical Chess Showcase — Execution Spec

Owner: Camren (SoChlo Productions) for client ACE / Abadá Capoeira Brooklyn (physicalchess.org).
Written 2026-09-02. This document is the single source of truth for the build agents. Read all of it before writing code.

## 1. Goal

A fresh, static Astro site deployed to Vercel that lets the client compare **four** live, animated design directions of the Physical Chess kids' capoeira LMS (ages 7–13). Gumball is dropped. Each direction lives at its own route and ports the **same five screens** using the client's **real photos, videos, page structure, and copy** from physicalchess.org and the SoChlo CMS. No lorem ipsum, no stock photos, no emoji-as-icons.

Routes:

| Route | Direction | Register |
|---|---|---|
| `/sticker` | Sticker Roda | ink borders, offset shadows, tilted stickers, confetti |
| `/quest` | Roda Quest | tropical-night adventure map, XP, boss quiz, mascot |
| `/comics` | Axé Comics | chrome-yellow comic book, halftone, starbursts, speech bubbles |
| `/chess` | Grandmaster Roda | checkerboard arena, piece promotions, chess clock |
| `/` | Chooser | one screen listing the four directions with a live thumbnail each |

Every direction is a **complete, distinct visual world**. Sharing data and structure is required; sharing look is forbidden.

## 2. The five screens (identical information architecture in every direction)

The Wix site's member nav is: Home · About Us (Educators, the ACE, ABADÁ, F.A.Q., Contact) · Graduation · Shop · Movements (Capoeira ABADÁ, Virtual Training, Jogos) · Music · Culture (Portuguese, ABADÁ-Capoeira, Manifestations, Folklore, History & Maps). We port that into five LMS screens per route:

| # | File | Screen | What it ports from Wix | Must contain |
|---|---|---|---|---|
| 1 | `index.astro` | **Home / Enter the roda** | Wix home (login wall, "Classes for 7–13 Years of Age", contact 917-776-8150 / info@the-ace.org, "BATIZADO 2026" button) | Hero using a real photo or the ACE compilation video, age line, Log in CTA (demo: goes to dashboard), Batizado 2026 CTA, nav to all five screens, footer with ACE contact |
| 2 | `dashboard.astro` | **My Journey** | Member landing | Greeting for demo student "Maya", the four curriculum modules (Movements, Music, Culture, Graduation) with progress, current corda, next-up CTA, streak, Batizado countdown |
| 3 | `movements.astro` | **Movements lesson player** | Movements → Capoeira ABADÁ / Virtual Training / Jogos | Lesson list (Ginga, Meia lua de frente, Esquiva, Cocorinha, Aú, Jogo), embedded real video lesson, "practice" drill card, mark-complete interaction |
| 4 | `music.astro` | **Music & Culture + quiz** | Music, Culture → Portuguese / Folklore | Instrument cards (berimbau, pandeiro, atabaque, agogô), 6 Portuguese words with meaning, a 3-question quiz (Q2 is "Which country was capoeira born in?" → Brazil) with correct/incorrect states and the direction's reward moment |
| 5 | `batizado.astro` | **Graduation / Batizado** | Graduation, Batizado 2026, What is it?, Cordas (Ranks), Batizado Media | Countdown to Batizado 2026, the six ceremony moments with the real copy (§4.3), cordas rank track with the student's current rank, real photo gallery (≥ 12 photos), Batizado 2026 / 2025 / 2024 videos |

Desktop 1440 and mobile 390 must both look designed. The Paper mobile boards show the quiz screen on mobile; extrapolate the rest.

## 3. Stack, repo, deploy

- Folder: `/Users/admin/physical-chess-showcase` (this file lives at its root). New git repo.
- Astro 5, `output: 'static'`, TypeScript off (plain JS in `<script>` tags is fine), **no UI framework, no CSS framework, no animation library**. Motion is CSS keyframes + Web Animations API + IntersectionObserver. Keep the whole thing dependency-light so it deploys in seconds.
- Fonts via one Google Fonts `<link>` in the base layout: `Fredoka:wght@400..700`, `Nunito:wght@400..900`, `Lilita One`, `Bangers`, `Rubik Mono One`.
- Images: use Wix static URLs directly (§4.1). Use `loading="lazy"` except above-the-fold. Always set `alt`.
- Video: YouTube embeds via `src/components/YouTube.astro` (privacy-enhanced `youtube-nocookie.com`, `?rel=0&modestbranding=1`; pass `autoplay muted loop` for hero backgrounds).
- Deploy: `vercel --prod` from the repo root (Camren is logged into the Vercel CLI). Project name `physical-chess-showcase`.
- Respect `prefers-reduced-motion`: every animation is wrapped so reduced-motion users get the final state instantly.

### 3.1 Layout

```
physical-chess-showcase/
  SPEC.md
  package.json            astro only
  astro.config.mjs        output: 'static'
  public/favicon.svg
  src/
    layouts/Base.astro    <html>, fonts link, meta, slot; accepts `direction` prop and adds class on <body>
    styles/base.css       reset, reduced-motion guard, shared utility classes (.sr-only, .wrap)
    data/
      curriculum.js       the modules + lessons (§4.2)
      media.js            photo + video manifest (§4.1)
      student.js          demo student (§4.4)
      batizado.js         ceremony moments, cordas, countdown date (§4.3)
    components/
      YouTube.astro       iframe wrapper
      Gallery.astro       unstyled grid of <figure>s from media.js; each direction restyles it via CSS
      Countdown.astro     renders days/hours/min to a date; client script ticks
      Quiz.astro          unstyled quiz markup + logic emitting `quiz:correct` / `quiz:wrong` / `quiz:done` events; directions style it and react with their reward moment
    directions/
      sticker/  quest/  comics/  chess/
        tokens.css        the direction's variables
        theme.css         all direction styling
        motion.js         the direction's animations (entrance, hover, reward)
        Nav.astro         the direction's header / nav
        Footer.astro
    pages/
      index.astro         chooser
      sticker/{index,dashboard,movements,music,batizado}.astro
      quest/{...same five}
      comics/{...same five}
      chess/{...same five}
```

Shared components ship **zero visual opinion**: semantic HTML + data attributes + BEM-ish class hooks. Each direction's `theme.css` does 100 % of the styling. Do not add a class like `card` in a shared component and style it globally.

## 4. Content inventory (real client assets)

### 4.1 Photos — Wix media (strip Wix's `/v1/fill/...` suffix to get the original; the bare URL below serves the full-size file)

Base: `https://static.wixstatic.com/media/`

| key | file | caption / use |
|---|---|---|
| heroWorkshop | `473014_10bb43a581574e12b16f5091b7fcb4af~mv2.jpg` | Kids workshop with Professor Coco (the Batizado 2026 page hero). Best home hero. |
| heroRoda | `bc3ec7bc825c4e6ca746c659189cea83.jpg` | Wide roda shot used as the Batizado page background |
| heroStrip | `473014_d2a74a236692481582693d7b21567b4cf000.jpg` | Home page banner strip |
| bannerBatizado | `11062b_c0f82e7370a041fb92d161623b53b27af000.jpg` | Batizado 2026 banner |
| cocoTubarao | `473014_5c597a6b0d04429fa4f5cbda9959ffaf~mv2.jpg` | Prof. Coco e Tubarão |
| kidsParents | `473014_12ea738b0df542fd88161b22d4ca4277~mv2.jpg` | Kids playing with parents |
| voltaDoMundo | `473014_cbe6cfd1bab04cc2bc2ff32cf2371eff~mv2.jpg` | Volta do Mundo |
| toroMindinha | `473014_89cb339c29a245aa864c0c3098ef1fa1~mv2.jpg` | Toro e Mindinha (Troca de Cordas) |
| trocaDeCordas | `473014_11a07343b5604f1d9a99e26c57ef693d~mv2.jpg` | Troca de Cordas |
| voltaAdults | `473014_5e22a6297b314f07b2aaec1997547872~mv2.jpg` | Adults receiving their first rank |
| celebration2018 | `473014_28fa1769cd91447cad9a39a742143500~mv2.jpg` | Final celebration 2018 (portrait) |
| cordsTable2018 | `473014_0fb5a2d1ec0f4d88b58b649af4b22038~mv2.jpg` | Cords table 2018 |
| batizado2019a | `473014_c77f25c3da9e4f7295c8d25d41a44173~mv2.jpg` | Batizado 2019 |
| batizado2019b | `473014_6f4af57fab5d4d229edb2d5f280f57a3~mv2.jpg` | ABADÁ Capoeira Brooklyn Batizado 2019 |
| groupFoto2019 | `473014_f60938a091d1493e9e8ef834bf5cc153~mv2.jpg` | Group foto 2019 |
| xampuGasparzinho | `473014_2e8155fa082341448857a7f386f4b24a~mv2.jpg` | Xampu e Gasparzinho |
| troca2019 | `473014_dd25d82081c149a7a051fe25367aa58b~mv2.jpg` | Troca de Cordas 2019 |
| batizado2022 | `473014_0b6497fbfada46e3b2cacad86cbeae53~mv2.jpg` | Batizado 2022 |
| cordsTable2022 | `473014_c289bcb834e04700a99a8e83be64b196~mv2.jpg` | Cords table 2022 |
| kidsWorkshopDay2 | `473014_5f267ec52bbf4576b42c8684d62751cb~mv2.jpg` | Kids Workshop Day 2 |
| pastorPerigoCiborg | `473014_ab96f85e64034164b483afa15f024d2c~mv2.jpg` | Pastor com Perigo e Ciborg |
| guindasteTubarao | `473014_cbc4e60cc6bf494483d28bd788f18370~mv2.jpg` | Tubarão e Guindaste |
| videoPoster1 | `473014_ad3f773426eb4e998ad5d0e5dd1eb144f000.jpg` | Solos video poster |
| videoPoster2 | `473014_c50927cc537d42fa95da724532d5e043f000.jpg` | Solos video poster 2 |
| flyer2023 | `473014_92be22ded2f04a1a95869a4af8fb9aa7~mv2.png` | Batizado 2023 flyer (portrait) |

For fixed-size crops use Wix's transform: `<file>/v1/fill/w_<W>,h_<H>,al_c,q_85/<file>` (e.g. `…~mv2.jpg/v1/fill/w_800,h_600,al_c,q_85/…~mv2.jpg`). The media manifest exports a `wix(key, w, h)` helper.

> Pending: the member-only pages (Movements, Music, Culture, Graduation) and the Wix Media Manager could not be read without Wix MCP authorization. When the shared agent runs, if `mcp__wix__*` tools are available, list the site's media files and add any kid-class / movement / instrument photos to `media.js` under the same key scheme. If not available, ship with the inventory above.

### 4.2 Videos — SoChlo Productions CMS (YouTube)

| key | id | title | use |
|---|---|---|---|
| aceCompilation | `r5G5G1RMakk` | The Abadá Capoeira Experience (program compilation with voiceover) | Home hero background / "What is Physical Chess" |
| batizado2026 | `R9ofSmjDe0I` | Abadá Capoeira NYC Batizado 2026 | Batizado screen featured video |
| batizado2025 | `18UN2FHpS10` | Abadá Capoeira NYC Batizado 2025 | Batizado screen |
| batizado2024 | `qRHd8yXlMVk` | Abadá Capoeira NYC Batizado 2024 | Batizado screen |
| aulaoBushwick | `EBvKKDFnZho` | ACE Aulão at Achievement First Bushwick Elementary | Movements lesson video |
| acePresentation | `y2NLf9Vw78w` | Abadá Capoeira Experience Presentation | Movements: "Jogo" lesson |
| sankofaHaus | `gv8gtMagSj0` | ACE x Sankofa Haus | Music & Culture |
| berkeleyCarroll | `2OSrC0C9FGQ` | ACE – Berkeley Carroll | Movements alt |
| bhmShowcase | `-V_OzLj_Hf8` | ACE Black History Month Showcase | Culture |
| acb2024 | `ercczK8Cgf8` | Abadá Capoeira Brooklyn 2024 | Dashboard "latest from the roda" |

Credit line wherever a video appears: "Video: SoChlo Productions".

### 4.3 Batizado copy (verbatim from physicalchess.org, keep it)

Intro: "Batizado is our welcoming event for new students and cultural celebration of current students' progress throughout the year. It's filled with rich traditions, incredible performances and energy through the roof! The sense of community is palpable and contagious. Come join us and see for yourself!"

Moments (title → copy → photo key):
1. Abertura → "The opening of our events are always a spectacle to behold. The music, energy, athleticism and grace are amazing! Just try and keep your hands clapping while you watch." → cocoTubarao
2. Solos → "These dazzling displays of technique and showmanship are sure to wow you. The Capoeirista does a solo performance exhibiting their skills. Sit back and enjoy!" → videoPoster1
3. Batizado → "New students are officially welcomed by very experienced Capoeiristas, usually in a very fun way, during their first official game as a student of ABADÁ-Capoeira. Each and every student always remembers their first game with fondness for the rest of their lives in and outside of Capoeira." → kidsParents
4. Volta do Mundo → "When a student's name is called they walk around the roda in a very large circle. Their first time passing the berimbau, our main instrument, they show a sign of respect and continue on to receive their cord and tie it while they continue walking around the roda. When the berimbau calls everyone's attention they move to one of the sides to prepare to play their first game as an official student." → voltaDoMundo
5. Troca de Cordas → "Current students who continue to show progress receive a new corda. They walk around the roda, paying respect to the berimbau their first time around after which they receive their new corda which they tie above their current corda while they play with their fellow students changing cordas." → toroMindinha
6. Jogo de Compra → "After the students receiving their new cordas have all played amongst each other, students who already have that corda continue to buy the game to play with their new colleagues." → troca2019

Cordas (ABADÁ kids' progression used in the designs): Crua (natural) → Crua-Amarela → Amarela → Amarela-Laranja → Laranja. Colors: `#E8DCC3`, half `#E8DCC3`/`#FFC93C`, `#FFC93C`, half `#FFC93C`/`#FF8A1F`, `#FF8A1F`. (The Grandmaster direction maps these to pawn → knight → bishop → rook → queen.)

Batizado 2026 date for the countdown: use **2026-10-10T11:00:00-04:00** as a placeholder and label it "date TBC" in small text. Contact: 917-776-8150 · info@the-ace.org · Classes for 7–13 years of age.

### 4.4 Curriculum data (`curriculum.js`)

Four modules mirroring the Wix nav. Lesson types: `video | drill | reading | quiz`. Each lesson has `id, title, type, minutes, videoKey?, photoKey?, summary`.

- **movements** "Movements" — Ginga Basics (video, aulaoBushwick), Meia Lua de Frente (video, berkeleyCarroll), Esquiva & Cocorinha (drill), Aú (video, acePresentation), Jogos: your first game (video, acePresentation). Status: first three done.
- **music** "Music" — Meet the Berimbau (reading), Pandeiro & Atabaque (video, sankofaHaus), Sing the Roda (drill), Music Quiz (quiz, 3 questions). Status: first done, quiz in progress.
- **culture** "Culture" — Portuguese for the Roda (reading: Axé, Roda, Ginga, Mestre, Corda, Berimbau with meanings), ABADÁ-Capoeira (video, bhmShowcase), Folklore & Manifestations (reading), History & Maps (reading). Status: locked until Music done.
- **graduation** "Graduation" — What is Batizado? (reading), Cordas (reading), Batizado 2026 (video, batizado2026). Status: locked.

Progress numbers everywhere must be **computed from this data**, never hard-coded.

### 4.5 Demo student (`student.js`)

`{ firstName: 'Maya', apelido: 'Gatinha', corda: 'crua', nextCorda: 'crua-amarela', streakDays: 4, xp: 320, xpToNext: 500, stars: 12, badges: 2 }`

## 5. Direction specs

For every direction the build agent must, before coding: (a) call `mcp__paper__get_screenshot` on the three artboard IDs listed, (b) call `mcp__paper__get_jsx` on the dashboard artboard and copy exact colors, radii, borders, shadows, type sizes and spacing from it. Screenshots are for judging; JSX is for values. Paper file: `01M017JHZGTKX64S7G2TBPBBKH`.

### 5.1 `/sticker` — Sticker Roda  (Paper: dashboard `1-0`, module/quiz `3B-0`, mobile quiz `5P-0`)

- Ground `#F4FAFF`, white surfaces, ink `#14324F`, ink-soft `#4A6B8A`, brand blue `#3D9BE9` / deep `#1F7FD1`, sky `#C9DDE1`, sun `#FFC93C`, lime `#2FBF71`, coral `#FF6B57`.
- Fredoka 700 display (44 / 26 / 18), Nunito body 15–18.
- 3px ink borders, hard offset shadows `6px 6px 0 ink`, cards tilted ±1.5°, pill buttons, sticker icons in rounded squares.
- **Motion (the reason this direction gets a second look):** cards drop in with a spring (translateY 24px → 0, rotate from 0 to their resting tilt, 60ms stagger); hover lifts 4px and straightens the tilt; progress bars fill on scroll; correct quiz answer bounces and fires confetti (canvas, 120 pieces in sun/lime/coral/blue, 1.6 s); "Done!" chips pop with a scale overshoot; the 👋 in the greeting is an SVG hand that waves. Mobile: bottom sheet slides up.
- The client saw this one static. It must feel alive on first paint.

### 5.2 `/quest` — Roda Quest  (Paper: map `ED-0`, quiz `EE-0`, mobile `U9-0`)

- Ground palm shadow `#0B2E24`, surface deep leaf `#154334` / border `#1E5A46`, hibiscus `#FF4F7A`, mango `#FFB238` (+ shadow `#7A4A00`), firefly lime `#B9F26B` (+ shadow `#4E7A22`), cream `#FFF6E5`, muted `#9FC4B3` / `#7FA894`.
- Lilita One display (56 / 40 / 26), Nunito 800 labels with 0.1em tracking, Nunito 600 body.
- Dashboard **is the map**: SVG winding path, 96px nodes with 6px ink border and 8px drop, current node 120px with dashed halo and "YOU ARE HERE!" flag, gold rotated gate for the next corda, HUD panel (avatar, MAYA, corda, XP bar, 3 stats, Batizado card), "NEXT UP" mango pill. Stars scattered on the ground, two soft stage-light circles.
- Real photos live inside the nodes as circular masks (heroWorkshop for the current node; done nodes show a check over a dimmed photo) and in a "latest from the roda" video card.
- **Motion:** path draws on (stroke-dashoffset, 1.2 s), nodes pop in along the path with stagger, the current node pulses (halo scale 1 → 1.08) and the flag bobs; XP bar fills; mascot Mestre Bira (SVG figure in a mango circle) breathes; quiz hearts shake on a wrong answer, correct answer bounces lime and the "+50 XP" chip flies up to the HUD; boss-quiz completion = screen-wide lime flash + confetti in hibiscus/mango/lime.
- Screen mapping: Home = night sky hero with video; Movements = map node detail with lesson steps in the left "level rail"; Music = boss quiz; Batizado = the gate opens (Corda Amarela gate animates open to reveal the ceremony and gallery).

### 5.3 `/comics` — Axé Comics  (Paper: dashboard `EF-0`, quiz `EG-0`, mobile `UA-0`)

- Ground chrome yellow `#FFD21F`, panels pure white, ink `#111111`, cobalt `#1E4FD8`, cadmium red `#FF2E2E`, halftone gray. No rounded corners except speech bubbles (28px).
- Bangers display (104 / 44 / 26, 0.02–0.06em tracking), Nunito 900 labels, Nunito 800 body 15–19.
- 5px ink borders, `10px 10px 0 ink` shadows, panels tilted ±1.5°, halftone dot field (SVG) top-right, starburst stickers (18-point polygon, red, "DONE!" / "AXÉ!"), speech bubbles with triangular tails, comic caption boxes in yellow, a black corda meter bar at the bottom.
- Real photos are the panel art: each module panel's middle area is a photo with a halftone overlay (CSS radial-gradient dots, mix-blend multiply) so it reads as printed comic art. Video panels get a "▶ PLAY!" cobalt button.
- **Motion:** panels slide in from alternating sides with a slight overshoot; starbursts scale from 0 with rotation and a 2-frame "wobble"; halftone field drifts slowly; speech bubble types its text (CSS steps); hover on a panel bumps its shadow to 14px; correct answer = AXÉ! burst from the corner + panel shakes; page transitions use a "POW" wipe (a red diagonal band sweeps across).
- Screen mapping: Home = cover of Issue #4 ("MAYA VS. THE RODA!"), Dashboard = the strip, Movements = a full-page splash panel with the video and step panels underneath, Music = quiz panel, Batizado = "Special Issue" with the six moments as a 3×2 panel grid and the gallery as a contact sheet.

### 5.4 `/chess` — Grandmaster Roda  (Paper: board `XN-0`, puzzle `XO-0`, mobile `XP-0`)

- Bone `#F3EEE4`, ink `#0F0F0F`, kingfisher `#1D5DFF`, legal-move lime `#C6F547`, capture orange `#FF7A1A` (one use per screen), muted `#9A927F`, rule `#E4DCCB`. No radii at all. Borders 3–4px ink, shadows `6px 6px 0` / `10px 10px 0` ink.
- Rubik Mono One display (62 / 28 / 14–16, all caps), Nunito 900 labels 0.1–0.16em tracking, Nunito 600 body.
- Dashboard = checkerboard floor (120px squares) running off the right edge; modules are tiles standing on squares (done = white tile with pawn, current = kingfisher tile with orange knight on a lime square, locked = dashed outline with padlock), a knight-jump arrow, lime legal-move dots, an orange rotated "YOUR MOVE" flag; left column: eyebrow, "YOUR MOVE, MAYA.", promotion track (pawn/knight/bishop/rook/queen), scoresheet MOVE LIST with notation, "MAKE YOUR MOVE →" button.
- Real photos: the checkerboard's light squares occasionally hold a photo (2–3 squares), the position panel on the quiz becomes a photo with the board grid overlaid; the Batizado gallery is laid out on a board (photos on alternating squares).
- **Motion:** squares fade in in a checker wave (diagonal stagger), tiles slide onto their square, the knight arrow draws on, the lime dots pulse, chess clock ticks down for real (Maya's side counts), correct answer = "CHECK!" bar slams down and the piece on the position panel jumps to its square; finishing the quiz = "CHECKMATE" full-screen with the board flipping (3D rotateX).

## 6. Motion rules (all directions)

1. Every page has an **entrance sequence** ≤ 1.2 s total, then settles. Nothing loops except one deliberate idle (pulse, bob, breathe, drift).
2. Every interactive element has hover + active states in the direction's language.
3. One **reward moment** per direction on quiz-correct, one **celebration** on quiz-complete.
4. `@media (prefers-reduced-motion: reduce)` → no transforms, no confetti, instant final states.
5. 60 fps: animate only `transform`, `opacity`, `stroke-dashoffset`, `clip-path`. No layout-thrashing JS loops; use rAF for the confetti canvas only.
6. Page navigation inside a direction: use the View Transitions API via Astro's `<ClientRouter />` with a direction-specific `::view-transition` style (Sticker: fade+slide; Quest: fade through palm-shadow; Comics: red band wipe; Chess: checker wipe).

## 7. Work packages (5 agents)

Agent 1 runs first; agents 2–5 run in parallel afterwards.

**Agent 1 — Foundation (`shared`)**
- Scaffold repo (§3.1), `package.json` (astro ^5), `astro.config.mjs`, `Base.astro`, `base.css`, `public/favicon.svg`.
- Write `data/media.js` (§4.1 + §4.2 with `wix()` helper and `yt()` helper), `data/curriculum.js`, `data/student.js`, `data/batizado.js`.
- If `mcp__wix__*` tools exist in the session, query the site's media manager for additional kid-class photos and append them to `media.js`; otherwise skip and note it.
- Build the four shared components (§3.1) with **no styling** and documented class hooks + custom events.
- Build `/` chooser: four large tiles (one per direction) with its name, one-line register, a live `<iframe>` thumbnail of its `/dashboard` scaled to 0.25, and an "Open" link. Neutral styling (white, ink, Nunito) so it favors none.
- Create empty `src/directions/<dir>/` folders each containing a `README.md` that states the artboard IDs and the palette from §5 so the route agents start from the same place.
- `npm install`, `npm run build` must pass. Commit.

**Agents 2–5 — one per route (`sticker`, `quest`, `comics`, `chess`)**
- Read this SPEC and your direction's `README.md`. Screenshot and `get_jsx` your Paper boards.
- Build `tokens.css`, `theme.css`, `motion.js`, `Nav.astro`, `Footer.astro`, and the five pages under `src/pages/<dir>/`.
- Use only shared data/components for content; never fork the data.
- Ship all animations from §5 and the rules in §6.
- Verify with `npm run build`, then `npm run preview` and screenshot all five pages at 1440 and 390 wide (Playwright is available via `npx playwright screenshot` or use headless Chrome `--screenshot`). Fix what looks wrong before reporting. Save screenshots to `screenshots/<dir>/`.
- Do not touch another direction's folder or the shared files (if a shared change is essential, make it minimal, backwards-compatible, and say so in the report).

## 8. Acceptance checklist (every route)

- [ ] 5 pages render at 1440 and 390 with no horizontal scroll
- [ ] All photos are real Wix assets from `media.js`; all videos from `media.js`; SoChlo credit shown
- [ ] Batizado copy is verbatim (§4.3); contact and age line present on Home
- [ ] Progress numbers computed from `curriculum.js`
- [ ] Quiz works: wrong state, correct state, reward, completion
- [ ] Entrance animation, hover states, reward moment, reduced-motion fallback
- [ ] Lighthouse performance ≥ 85 on Home (no huge unoptimized images: request Wix crops ≤ 1600px wide)
- [ ] `npm run build` clean, no console errors
- [ ] Visually unmistakable from the other three routes

## 9. After the agents

Camren / Claude: review screenshots, run `vercel --prod`, post the URL, and record it in memory. The showcase URL plus `/sticker`, `/quest`, `/comics`, `/chess` go to the client.
