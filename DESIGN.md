---
version: alpha
name: RapiTugas
description: Buku penghubung digital untuk orang tua yang membaca instruksi guru dari ekspor WhatsApp.
colors:
  ink: '#233e50'
  muted: '#536b78'
  paper: '#ffffff'
  background: '#f4f7f8'
  accent: '#f8cb56'
  mint: '#e2f1eb'
  border: '#d9e2e6'
  danger: '#a02c3b'
  success: '#24664e'
  hover: '#eaf0f2'
  scrollbar: '#8399a5'
typography:
  display:
    fontFamily: 'Trebuchet MS, system-ui, sans-serif'
  body:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
rounded:
  control: '12px'
  panel: '22px'
spacing:
  unit: '4px'
  page-max: '1160px'
components:
  button:
    height: '44px'
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
  card:
    rounded: '{rounded.panel}'
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
  dialog:
    width: '560px'
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
---

# RapiTugas design

## Overview
Product register. Indonesian-speaking parent, explicitly using Android, needs to isolate teacher instructions from school-group noise. This is a new project; the conversation is the business brief, with no inherited components or repository policy. Signature: a school notebook with a yellow subject tab and a restrained handwritten-style underline. Avoid dashboard metrics and commercial landing-page conventions. No JavaScript-rendered decorative media or remote font dependency.

Token ownership model A: this file's frontmatter generates dist/tokens.css through scripts/tokens.py. CSS components consume those variables. The generation check verifies drift. This is a light theme; forced-color and reduced-motion modes use platform defaults.

## Colors
Ink is the primary action and reading color. Yellow is a book-tab accent, never small white text. Mint indicates selected teachers or completed tasks with accompanying text. Danger is reserved for deletion/errors. Muted text must retain readable contrast on paper. Borders separate paper sheets.

## Typography
Display uses Trebuchet MS when installed, with a stable local system fallback; body uses the system font. No remote font fetches. Body baseline 16px, line-height 1.6; metadata 12–14px. Message content preserves line breaks and wraps long unbroken names/links. Indonesian UI, dates formatted id-ID; imported timestamps are wall time as written in the source, not shifted to another timezone.

## Layout
Maximum 1160px, generous 32px desktop gutters, 20px mobile gutters. Desktop notebook illustration beside introduction; mobile stacked illustration. Workspace sidebar 232px and a readable message column. At 760px, teacher filters become a horizontal row and messages form a single column. Body owns vertical scroll; dialog body scrolls independently within visual viewport. Minimum 44px touch controls. Lists render in batches of 40.

## Elevation & Depth
Borders on ordinary message cards, a mild paper shadow on the notebook only, modal backdrop separates dialogs. No gradient surfaces or glassmorphism.

## Shapes
12px controls, 22px panels and dialogs. Avatars are rounded squares. The notebook's single rotated lower sheet is the visual signature; routine controls stay aligned.

## Components
Shared .btn has primary, outline, ghost, danger variants. Hover changes surface; focus-visible uses a 3px ink ring with offset; pressed translates 1px; disabled uses opacity with no pointer action. Search fields have clear buttons. Platform-native select popups are accepted for Android date order and group selection. Dialog uses native showModal for focus trapping, Escape, and inert background; shared open/close handlers restore trigger focus. Toast is one role=status region; errors remain inline. File read shows busy state at fixed button size. All icons are inline text or local SVG with adjacent labels. Global scrollbar tokens apply to all scrollers, with forced-color fallback. No animation beyond short control feedback, disabled in reduced motion.

## Do's and Don'ts
- Preserve original message content and explicit task status.
- Keep sample data clearly labelled and separate from real imports.
- Never infer a teacher, deadline, or task completion without user action.
- Never send imported chat text to a server or put it in the URL.
- Bundle every runtime asset locally; offline requires one successful online load.
