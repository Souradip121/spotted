---
name: Spotted
description: Kalyani as a contact sheet. A darkroom photo map for one college town.
colors:
  safelight-red: "#e3262b"
  safelight-hot: "#ff4246"
  free-green: "#45c46a"
  edge-amber: "#f39237"
  true-black: "#000000"
  film-base: "#030303"
  tray-ink: "#111110"
  tray-ink-raised: "#181817"
  rule-line: "#2a2928"
  rule-line-strong: "#3b3937"
  sprocket-grey: "#4a4744"
  print-white: "#f1ede6"
  print-grey: "#b0aaa1"
  print-faint: "#858077"
  pin-ring: "#f4efe6"
  on-safelight: "#ffffff"
  darkroom-ground: "#070000"
  map-ground: "#131716"
  map-water: "#0a1114"
  map-road: "#545a57"
typography:
  display-hero:
    fontFamily: "Antonio, Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(4.4rem, 22vw, 6rem)"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "0.005em"
  display:
    fontFamily: "Antonio, Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "2.55rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.005em"
  headline:
    fontFamily: "Antonio, Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "2.1rem"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "0.005em"
  title:
    fontFamily: "Antonio, Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.55rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0.01em"
  title-ui:
    fontFamily: "Barlow Semi Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  body-lg:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Barlow Semi Condensed, Barlow, system-ui, sans-serif"
    fontSize: "0.93rem"
    fontWeight: 500
    lineHeight: 1
  label-button:
    fontFamily: "Barlow Semi Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.01em"
  nav:
    fontFamily: "Barlow Semi Condensed, Barlow, system-ui, sans-serif"
    fontSize: "0.74rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.04em"
  edge:
    fontFamily: "Barlow Condensed, Barlow Semi Condensed, sans-serif"
    fontSize: "0.74rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.16em"
    fontFeature: "tnum"
rounded:
  print: "2px"
  cell: "8px"
  panel: "12px"
  sheet: "22px"
  pill: "999px"
spacing:
  chip-gap: "6px"
  frame-inset: "8px"
  row: "12px"
  stack: "16px"
  gutter: "20px"
  section: "22px"
components:
  button-primary:
    backgroundColor: "{colors.safelight-red}"
    textColor: "{colors.on-safelight}"
    typography: "{typography.label-button}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.safelight-hot}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.print-white}"
    typography: "{typography.label-button}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "48px"
  button-quiet-hover:
    backgroundColor: "{colors.tray-ink-raised}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.safelight-hot}"
    typography: "{typography.label-button}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "48px"
  button-small:
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "36px"
  chip:
    backgroundColor: "{colors.tray-ink}"
    textColor: "{colors.print-white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.safelight-red}"
    textColor: "{colors.on-safelight}"
  segmented-tab-selected:
    backgroundColor: "{colors.safelight-red}"
    textColor: "{colors.on-safelight}"
    rounded: "{rounded.pill}"
    height: "42px"
  input:
    backgroundColor: "{colors.tray-ink}"
    textColor: "{colors.print-white}"
    typography: "{typography.body}"
    rounded: "{rounded.panel}"
    padding: "12px 16px"
    height: "50px"
  switch-ghost-on:
    backgroundColor: "{colors.print-grey}"
    rounded: "{rounded.pill}"
    width: "36px"
    height: "22px"
  badge:
    backgroundColor: "{colors.safelight-red}"
    textColor: "{colors.on-safelight}"
    rounded: "{rounded.pill}"
    padding: "0 6px"
    height: "20px"
  edge-print:
    textColor: "{colors.edge-amber}"
    typography: "{typography.edge}"
    padding: "0 14px"
    height: "16px"
  demo-tag:
    textColor: "{colors.edge-amber}"
    typography: "{typography.edge}"
    rounded: "{rounded.pill}"
    padding: "4px 9px"
  film-nav:
    backgroundColor: "#020202"
    textColor: "{colors.print-faint}"
    typography: "{typography.nav}"
    height: "96px"
  shutter:
    backgroundColor: "{colors.safelight-red}"
    textColor: "{colors.on-safelight}"
    rounded: "{rounded.pill}"
    size: "58px"
  photo-pin:
    rounded: "{rounded.pill}"
    size: "54px"
  day-cell:
    backgroundColor: "#121211"
    rounded: "{rounded.cell}"
    height: "42px"
  sheet:
    backgroundColor: "#0d0d0c"
    rounded: "{rounded.sheet}"
    padding: "10px 20px 22px"
  toast:
    backgroundColor: "#151413"
    textColor: "{colors.print-white}"
    rounded: "{rounded.panel}"
    padding: "12px 14px"
---

# Design System: Spotted

## Overview

**Creative North Star: "The Darkroom Contact Sheet"**

Spotted is a darkroom, and Kalyani is the contact sheet on the tray. The ground is true black. Photos are prints on film strips, with sprocket bands above and below and amber edge print under them. The only coloured light in the room is the red safelight, and it lands on what you can act on. The town map is the developing tray: a cold green-black basemap where every pin is a frame someone shot. Friends appear on it only if they chose to share, and their labels say who is free.

The density is phone-native and photo-first. Black and the photos carry the screen. Chrome is pill-shaped and kept low in contrast. Display type is tall and condensed, like the lettering on a film box. One fine layer of grain runs over everything, and photos develop out of a red tint the first time they appear. The world rejects the generic white social feed and the neon "find my friends" radar. The approved concept is `../ui-concepts/spotted/spotted_a_darkroom.png`.

**Key Characteristics:**
- True black ground (#000000), warm off-white type, no light surfaces apart from the Google sign-in button.
- Three signal colours, one job each: red for action and selection, green for "free", amber for edge print.
- Film-strip grammar: sprocket bands above and below every photo frame, the request card and the nav, with edge print under the band.
- Antonio for display, Barlow Semi Condensed for UI, Barlow for reading, Barlow Condensed caps for edge print.
- One authored motion ("develop") plus stepped grain. Everything else is short state feedback.
- A 480 px phone column. On desktop it stands in a red-lit darkroom.

## Colors

A warm black darkroom lit by one red safelight, with green and amber used as narrow signals rather than accents.

### Primary
- **Safelight Red** (#e3262b): The colour of action and current selection. It fills primary buttons, the selected filter chip and segmented tab, the shutter (post) button, the checked checkbox, notification badges and the 4 px dot over the current nav item. It also tints the focus ring on fields and the text selection. Red fills carry a red glow shadow (see Elevation & Depth).
- **Safelight Hot** (#ff4246): The brighter step of the same light. It is the hover fill of primary buttons and the colour of red text on black: link buttons, outline buttons, "Edit week", danger rows, today's day header and the caret. It is also the focus outline (2 px, 2 px offset).

### Secondary
- **Free Green** (#45c46a): Means "free", nothing else. It colours the dot on the Free now chip and the Free now heading, the dot on a free friend's pin label, the free-hour bars in the week grid, on-slots in the week editor and the `.status` "free" text.

### Tertiary
- **Edge Amber** (#f39237): The ink of film edge print. It is used for stock names (SPOTTED 400, DEMO 400), frame numbers, the edge triangle and DEMO marks. Demo tags pair it with a dim amber hairline (#5b3a17).

### Neutral
- **True Black** (#000000): The page, the screens, the top bar and the app column.
- **Film Base** (#030303): The film strip behind frames and contact sheets. The nav (#020202) and the frame well (#050505) are the same material.
- **Tray Ink** (#111110): Fill for chips, fields, segmented tracks, search and comment pills.
- **Tray Ink Raised** (#181817): Hover fill for icon buttons and quiet buttons.
- **Rule Line** (#2a2928) / **Rule Line Strong** (#3b3937): Hairlines. Strong is the default 1 px border on chips, fields and quiet buttons, and the outer ring of the shutter.
- **Sprocket Grey** (#4a4744): The sprocket holes. It is baked into the sprocket SVG tile.
- **Print White** (#f1ede6): Primary text. It is warm, not pure white.
- **Print Grey** (#b0aaa1): Secondary text, field labels, inactive tab text and the Ghost switch when on.
- **Print Faint** (#858077): Tertiary text, timestamps, inactive nav items and stat labels.
- **Pin Ring** (#f4efe6): The 3 px ring around photo pins, friend avatars and the profile avatar.
- **On Safelight** (#ffffff): Text and icons on red fills.
- **Darkroom Ground** (#070000): The desktop backdrop behind the phone column, under two red radial glows.
- **Map Ground** (#131716), **Map Water** (#0a1114), **Map Road** (#545a57): The basemap in `src/map/style.js`. It is a cold green-black, set against the warm black UI so the map reads as a tray rather than as another panel. Roads step up in grey (minor #2c3230, mid #3c4240, major #545a57). Rail is a dim dashed red-brown (#4a3431). Labels are Noto Sans (the OpenFreeMap glyphs) in muted grey-greens. Neighbourhood names are uppercase with 0.2 tracking.

### Named Rules
**The Safelight Rule.** Red (#e3262b) is the safelight. It is used only for actions and the current selection. In the build, "current" covers the selected chip or tab, the current nav item, today and the "now" line in the week grid, and your own live presence (your pin's red ring and halo, the live dot in the sharing banner, "you · live"). Badges count actions that are waiting. Exact photo pins end in a red tail; area-only pins get a hollow ring tail. Nothing decorative is red.

**The Free Means Green Rule.** Green is used only for "free". A success state, an "on" switch or live sharing is never green.

**The Edge Print Rule.** Amber is used only for edge print: film stock, frame numbers, the triangle and DEMO marks. It is never used for headings, icons or emphasis.

**The Neutral Ghost Rule.** Ghost on is the safe default, so the Ghost switch uses a neutral switch: a Print Grey track with a near-black knob (#0b0b0a). It is neither red nor green.

**Resolved drift (12 Nov):** settings section headings are now muted UI headings, not amber edge print; sign-in safety icons are neutral (`--text-2`); the "Share live location" switch uses the red `.switch.live` state, so green stays reserved for "free".

## Typography

**Display Font:** Antonio (with Barlow Condensed, Arial Narrow)
**UI Font:** Barlow Semi Condensed (with Barlow, system-ui)
**Body Font:** Barlow (with system-ui)
**Edge Print Font:** Barlow Condensed, uppercase

**Character:** Antonio is the tall, condensed lettering on a film box: the wordmark and screen titles. The Barlow family keeps the UI on the same narrow skeleton. The semi-condensed width carries labels and controls, the regular width carries reading text, and the condensed caps are the machine-printed edge of the film.

### Hierarchy
- **Display Hero** (600, clamp(4.4rem, 22vw, 6rem), 0.9): The wordmark on sign-in only.
- **Display** (600, 2.55rem, 1): The "Spotted" wordmark top-left on tab screens, and the "Frames" title. It drops to 2.2rem below 361 px.
- **Headline** (600, 2.1rem, 1.02): Profile names (2.4rem on the profile head), with balanced wrapping.
- **Title** (Antonio 500, 1.55rem, 1.1): Section and sheet titles ("Free now", "Share your live location?"). The centred post-screen title is Antonio 600 1.7rem.
- **Title UI** (Barlow Semi Condensed 600, 1.05rem, 1.2): Card titles such as "Ishita sent you a request". Names and list titles are 600 at about 1.02–1.08rem.
- **Body** (Barlow 400, 16px, 1.45): Default text and all inputs (16 px, so phones don't zoom). Post captions are 1.12rem/1.4, and comments 0.98rem/1.4.
- **Label** (Barlow Semi Condensed 500, 0.93rem, 1): Chips, pin labels (0.82rem), banners and toasts (0.92–0.95rem). Buttons are 600 at 1.02rem.
- **Nav** (Barlow Semi Condensed 500, 0.74rem, 0.04em): Film-nav item labels.
- **Edge** (Barlow Condensed 600, 0.74rem, 0.16em, uppercase, tabular numerals, amber): Edge print only. It is 0.64rem inside the nav, 0.6rem for DEMO marks and 0.7rem in demo tags.

### Named Rules
**The Four Faces Rule.** Each face has one job. Antonio is the wordmark and display face, Barlow Semi Condensed is the UI face, Barlow is the body face, and Barlow Condensed caps are the edge print. Don't set body copy in Antonio or controls in Barlow.

**The Tabular Count Rule.** Numbers that count (likes, badges, frame numbers, week dates, the Free now count) use tabular numerals.

## Layout

The app is one phone column, `max-width: 480px`, centred, full dynamic viewport height, with `overflow: hidden`. The film nav is pinned to the bottom at 96 px plus the safe-area inset, and every screen scrolls inside the space above it. Full-screen views (a post, sign-in) cover the nav.

- **Gutters and rhythm:** 20 px side gutter on pages. Stacks default to a 16 px gap, and 22 px between sections. Rows use 12 px. Filter chips sit 6 px apart in a horizontal scroller that hides its scrollbar.
- **Top bar:** The wordmark is on the left. Controls sit on the right on 44 px circular hit targets (Ghost chip, settings, add friend). The bar is sticky on true black with a 14 px black fade under it. On the map the fade is off and the chips sit directly under the bar.
- **Map panel:** The map fills the space between the chips and the nav, inset 8 px at the sides and bottom, with 12 px corners, a 1 px inner hairline and a 70 px inner vignette. A 48 px locate button sits bottom-left. The compact attribution sits bottom-right and is restyled dark.
- **Strips bleed:** Film strips (post frame, request card, contact sheet) run edge to edge, past the page gutter.
- **Contact sheet:** A three-column grid of square cells with 3 px gaps on film base. Each cell carries its frame number in edge print at the bottom left.
- **Week grid:** One name column (minmax(100px, 1.35fr)) and six day columns (Mon–Sat), with 5 px row and 4 px column gaps. Below 361 px the name column becomes 88 px with 28 px avatars.

**The Phone Column Rule.** The app is always a phone column. At 560 px and wider, the body becomes the darkroom. Two red radial glows (rgba(150,10,14,.55) from the top, rgba(90,4,8,.45) from below) sit on Darkroom Ground. The column gets 1 px #1c1b1a side rules and a deep black drop shadow. The layout never widens into a desktop grid.

## Elevation & Depth

Depth is tonal on true black, plus two kinds of shadow. Black ambient shadows lift floating things (map buttons, banners, toasts, sheets, pins) off the map or page. Red glow shadows exist only under safelight fills, so a red control looks lit. A grain layer sits over everything.

### Shadow Vocabulary
- **Safelight glow** (`box-shadow: 0 10px 26px -12px rgba(227, 38, 43, .95)`): Under primary buttons. Smaller versions sit under the selected chip (`0 6px 18px -8px rgba(227,38,43,.9)`) and the selected tab (`0 8px 20px -10px rgba(227,38,43,.9)`).
- **Shutter** (`box-shadow: 0 0 0 5px #020202, 0 0 0 6.5px #3b3937, 0 12px 28px -8px rgba(227, 38, 43, .9)`): A black gap, a grey ring and a red glow. It makes the post button sit in the nav like a lens mount.
- **Pin lift** (`box-shadow: 0 0 0 3px #f4efe6, 0 8px 18px rgba(0, 0, 0, .75)`): The Pin Ring plus a drop shadow, on photo pins and friend avatars.
- **Float** (`box-shadow: 0 8px 20px rgba(0, 0, 0, .6)`): Map buttons. Banners use `0 10px 24px rgba(0,0,0,.5)`.
- **Toast** (`box-shadow: 0 14px 34px rgba(0, 0, 0, .7)`) and **Sheet** (`box-shadow: 0 -20px 60px rgba(0, 0, 0, .7)`).
- **Map vignette** (`box-shadow: inset 0 0 70px rgba(0, 0, 0, .85)`): Darkens the edges of the map tray.
- **Field focus** (`box-shadow: 0 0 0 3px rgba(227, 38, 43, .22)`): Red halo on focused fields.

### Grain
A fixed full-screen layer above everything (z-index 1000, no pointer events). It is a 220 px SVG fractal-noise tile at 0.085 opacity that jitters through 6 positions every 1.2 s (`steps(6)`). Reduced motion and `?shot=N` stop it.

### Named Rules
**The Coloured Light Rule.** Only safelight-red elements cast coloured shadow. Every other shadow is black.

## Shapes

- **Pills** (999px) for all controls: buttons, chips, segmented tracks and tabs, search, the comment box, badges, pin labels and demo tags.
- **Circles** for people and places on the map: avatars, photo-pin discs, icon buttons, the locate button and the shutter.
- **Rectangles** for prints. Photos keep near-square 2 px corners and never become rounded cards. Contact-sheet cells are square with no radius.
- **Panels** at 12 px: the map tray, fields, banners, toasts and the compose pin map. Week-grid day cells and checkboxes use 8 px and 7 px. Bottom sheets round only the top corners, at 22 px.
- **Sprocket holes** are 11×10 rounded rectangles (2.2 px radius), repeated on a 26×18 tile with `space` so each band shows whole holes. The pin tail is a teardrop (`border-radius: 50% 50% 50% 0`, rotated −45°).
- **Icons:** one stroke family on a 24 grid, with a 1.75 stroke and round caps and joins. They are inline SVG at 18, 24 or 28 px. The shutter's plus uses a 2.2 stroke.

## Components

### Buttons
- **Shape:** Pill (999px), 48 px minimum height, 0 22px padding, Barlow Semi Condensed 600.
- **Primary:** Safelight Red fill and border, white text, safelight glow. Hover moves to Safelight Hot. Press scales to 0.97. Disabled is 45% opacity with no glow.
- **Quiet:** Transparent with a Rule Line Strong border and Print White text. Hover gets Tray Ink Raised. It is the "Cancel", "Ignore" and "Not now" partner to a primary.
- **Outline:** Transparent with a red border and Safelight Hot text (empty-state calls like "Find people").
- **Small:** 36 px high with 0 16px padding and no glow. A hidden `::after` keeps the hit area at 44 px.
- **Google sign-in:** The one light fill (#f2efea, near-black text). It is kept for the third-party button on sign-in.
- **Focus:** A 2 px Safelight Hot outline. On red fills the outline switches to Print White.

### Chips
- **Filter chip:** Tray Ink fill, 1 px Rule Line Strong border, 36 px high, icon plus label. Selected (`aria-pressed`) fills red with white text and a glow. The Free now chip leads with a green dot (white when selected) and a tabular count.
- **Ghost chip:** The ghost icon, "Ghost" and a small switch, in the top bar beside settings. Ghost on uses the neutral switch.
- **Place chip:** A pin icon plus the place name, with "· area" in Print Faint for area-only pins. It links back to the map.
- **Demo tag:** Amber edge-print caps in a pill with a #5b3a17 hairline ("Demo frame", "Demo profile", "Demo").

### Segmented tabs
A Tray Ink pill track with 4 px padding holding 42 px pill tabs. The selected tab fills red with a glow. A tab's badge inverts to white on red.

### Inputs / Fields
- **Style:** Tray Ink fill, 1 px Rule Line Strong border, 12 px radius, 50 px minimum height, 16 px Barlow text, placeholder #8b867e, Safelight Hot caret.
- **Focus:** Red border, a 3 px red halo at 22%, and the fill deepens slightly (#121110).
- **Pill variants:** Search and the comment box are pills. They light their border red on `:focus-within`. Autofill is forced back to Tray Ink.
- **Checkbox:** A 24 px box with a 7 px radius and a 1.5 px #6a6661 border. Checked fills red with a white tick.

### Switch
A pill track with a #f4f1ec knob. It is 48×28 by default and 36×22 small. The Ghost variant goes Print Grey with a dark knob when on (The Neutral Ghost Rule). A red-on variant exists in CSS but is unused.

### Navigation (film nav)
The bottom bar is a strip of film. The order is a 16 px sprocket band, then five equal columns (Map, Frames, shutter, Friends, You), then an edge-print line: "SPOTTED 400 · KALYANI", the frame count and the triangle. Items are a 24 px icon over a 0.74rem label in Print Faint. The current item turns Print White with a 4 px glowing red dot above it. The centre shutter is a 58 px red disc raised 14 px above the row. Friends carries a red request badge, and You shows your 26 px avatar.

### Film Frame (signature)
The order is: an optional top edge print, a sprocket band, the frame (film base with 8 px side insets and the 2 px-cornered photo), a sprocket band, then the bottom edge print. The edge print is stock name, frame number, spacer, then the amber triangle. The stock is "SPOTTED 400", or "DEMO 400" for demo rows. Strips without a photo use a reduced edge print with the stock only and no triangle, as on the request card. The sign-in form sits in a strip with its edge print above the band.

**The Sprocket Rule.** A sprocket band runs above and below every photo frame, the request card and the contact sheet, and on top of the nav. The edge print sits under the band, never inside the photo.

### Photo develop (signature motion)
Each photo first appears in a red safelight tint (`grayscale(1) sepia(1) saturate(7) hue-rotate(-48deg) brightness(.28) contrast(1.5) blur(5px)` at 0 opacity). Once it loads, it develops to full colour over 1.5 s on the house ease (`cubic-bezier(.16, 1, .3, 1)`) and is clear at 35%. A photo develops once per session. After that, the same path renders instantly. In compose, the loaded photo develops in, and while it posts it dips back toward the safelight tint.

**The One Authored Moment Rule.** Develop is the only authored motion. Grain runs at 6 steps. Everything else is functional feedback of about 0.2–0.45 s on the one ease: screens rising 10 px, sheets sliding up, toasts, chip and button press scales, the like pop, and the pulsing live dot. Reduced motion and `?shot=N` freeze all of it: photos show developed, the grain stops and transitions are off.

### Map pins (signature)
- **Photo pin:** A 54 px disc of the thumbnail with the Pin Ring and lift shadow, over a 12 px red teardrop tail. Area-only pins get a hollow ring tail. Below zoom 13.2 the disc shrinks to 38 px. Hover or focus scales it to 1.08, and focus swaps the ring to Safelight Hot.
- **Friend pin:** A 46 px ringed avatar over a dark pill label ("Riya · free till 5 pm"). The label leads with a green dot when free and a grey one when busy, and ends in an amber DEMO mark for demo rows. Your own pin gets a red ring, a 9 px red halo and a red "you · live" dot. Friend pins stack above photo pins.
- **Mechanics:** Pins are DOM markers (MapLibre `Marker` with HTML elements), so they are not part of the map's own label collision. `relax()` separates them in screen space. It runs after every marker sync and on every `moveend`. It makes up to 14 passes that push overlapping boxes apart along the axis of least overlap, keeps them 4 px inside the panel, and caps the nudge at 170 px across and 80 px down.

### Free-now week grid
Day cells are 42 px high with an 8 px radius, a #121211 fill and a #1d1c1b hairline. Free hours are green bars with a 3 px radius, inset 4 px. Today's column takes a red-tinted cell (#160d0d fill, #3d1517 border) and a red-hot day header. A 1.5 px Safelight Hot "now" line with a red glow crosses today's cells. Your row is first, with an "Edit week" link that opens the hourly week editor (30 px slots, green when on).

### Sheets and toasts
- **Sheet:** Slides up from the bottom over a 64% black backdrop. It has a #0d0d0c fill, 22 px top corners, a 40×4 grab handle and a maximum height of 88%. Escape closes it and focus returns to where it was. Menus inside are 54 px rows with hairline dividers, and danger rows are Safelight Hot.
- **Toast:** A #151413 panel with a 12 px radius above the nav, with a check icon in Print Grey or an x in Safelight Hot for errors. Success is never green.

## Do's and Don'ts

### Do:
- **Do** keep Safelight Red (#e3262b, hover #ff4246) for actions and the current selection, and give every red fill its red glow.
- **Do** use Free Green only to say someone is free: dots, bars, slots, "free till" labels.
- **Do** keep Edge Amber inside edge print: stock name, frame number, the triangle, DEMO marks and demo tags.
- **Do** frame every photo, the request card and the nav with sprocket bands, with the edge print (stock · frame number · triangle) under the band.
- **Do** mark every demo row in the film itself: DEMO 400 stock, a DEMO mark on its pin label and grid row, and a demo tag on its post or profile.
- **Do** let photos develop out of the safelight once per session, and show them developed under reduced motion and `?shot=N`.
- **Do** build map pins as DOM markers and run `relax()` after every marker update and every `moveend`, so no two pins overlap.
- **Do** keep the app a 480 px phone column, and on wide screens stand it in the red-lit darkroom ground.
- **Do** keep touch targets at 44 px, extending compact controls with an invisible `::after`.

### Don't:
- **Don't** print a real film brand in the edge print (the concept's "KODAK 400" was replaced). The stock is SPOTTED 400 or DEMO 400.
- **Don't** colour the Ghost switch red or green when on. Ghost on is the safe default and stays neutral.
- **Don't** use green for success, an "on" switch or live sharing.
- **Don't** use amber for headings, icons or emphasis.
- **Don't** add a second authored animation. Grain and develop are the world's motion.
- **Don't** round photos into cards or crop them to circles outside map pins and avatars. Prints keep 2 px corners.
- **Don't** use light surfaces or coloured shadows other than the safelight glow. The Google button is the only light fill.
- **Don't** set body copy in Antonio or controls in Barlow. Each face keeps its job.
