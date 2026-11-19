# The Painted Neuron

A hand-painted scrollytelling atlas of neurons, action potentials, and neural
networks. Eight painted plates carry one through-line — *how does one cell
tell another what to do?* — from the anatomy of a single neuron to the
microcircuits and nanocircuits that make a nervous system.

- **Source:** John H. Byrne, Ph.D., [*Introduction to Neurons and Neuronal
  Networks*](https://nba.uth.tmc.edu/neuroscience/m/s1/introduction.html),
  Neuroscience Online, Section 1, Introduction Chapter, Department of
  Neurobiology and Anatomy, McGovern Medical School, UTHealth Houston.
  All factual content and the logic of every interactive figure derive from
  this chapter.
- **Audience (inferred):** curious beginners. **Outcome:** the reader can
  explain how a resting membrane voltage gives rise to a neural impulse and
  how excitation, inhibition, and small circuit motifs make signals useful.
- **Art direction (inferred):** a hand-painted electrophysiology atlas —
  watercolor washes and ink linework on cream paper, with precise chart
  instruments set into the plates.

## Run it

The site is fully static. Serve the directory (some browsers restrict
`file://` only for web fonts; everything here also works from `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No build step; no network access needed at runtime (p5.js and p5.brush are
vendored under `vendor/`).

## Contents

| Path | Role |
| --- | --- |
| `index.html` | All narrative, plates, and interactive demos |
| `css/style.css` | Paper/pigment design system, layout, focus styles |
| `js/paint.js` | Painted plates (p5.js instance mode, WEBGL, p5.brush, seeded, lazy) |
| `js/app.js` | Interactive figures: SVG chart kit + simulators, all native controls |
| `vendor/p5.min.js` | p5.js 1.11.3 (pinned) |
| `vendor/p5.brush.js` | p5.brush 1.1.4 (pinned) |

## Renderer choices (and why)

A five-brush study on one representative composition (see commit history /
`js/paint.js` header) found, at these canvas sizes:

- `rotring` — crisp continuous ink lines → outlines, dendrites, links
- `charcoal` — soft heavy body strokes → axon cable, leg forms, cord
- `marker` — bold continuous tips → terminal boutons, knee dot
- watercolor fills (`brush.fill` + `beginShape`/`vertex`) — cell bodies
- `2B` / `pen` splines — **avoided**: they render as broken dot chains here

Per-plate settings are seeded (`brush.seed`) and one-pass: each plate draws
once when it first enters the viewport (`IntersectionObserver`, 250 px
margin) and its `draw` loop never runs. Labeled fallback SVG diagrams ship
under each canvas and are shown if WebGL/p5 fails, when
`prefers-reduced-motion` is set, or in reading mode.

## Models used by the interactive figures

| Demo | Relationship | Validation |
| --- | --- | --- |
| Threshold spike | Rest −60 mV; threshold −50 mV; spike peaks +40 mV in ~0.5 ms, repolarizes with undershoot; subthreshold stimuli decay passively | All-or-nothing: 9 mV → no spike; 10+ mV → identical spike (source Fig. 3) |
| Frequency coding | Spike count scales with stimulus intensity, amplitude never does | Source Fig. 4 (pulse frequency modulation) |
| Synaptic integration | EPSPs +11 mV, τ = 8 ms, spikes 6 ms apart; IPSP −14 mV, τ = 15 ms; threshold −50 mV | One EPSP subthreshold (−52); two EPSPs summate to −49.8 fire; same two + IPSP → −54 no fire; three fire (source Fig. 5 reference cases) |
| Lateral inhibition | out = in − 0.2·(in_l + in_r); in = 5 dark / 10 light | Far fields 3 and 6, edge cells 2 and 7 spikes/s — exactly the chapter’s numbers (Fig. 10) |
| Mach bands | Uniform bar over gradient bands; mask reveals uniformity | Source Fig. 11 |

All are disclosed in-page as simplified illustrative reconstructions, with
parameters and reference cases listed next to each demo.

## Accessibility

- Skip link, semantic headings, native `button`/`input`/`label` controls
- Every outcome is mirrored in text (`aria-live` readouts next to each demo)
- Full keyboard operation: label pins, sliders, toggles, step-throughs
- `prefers-reduced-motion`: no plate painting, no auto-advance timers;
  SVG fallbacks and manual stepping throughout
- Reading mode (floating button): hides painted canvases, shows all SVG
  figures, full narrative remains in the normal scroll flow
- Tested with WebGL disabled: all fallbacks show, all demos still operate

## Verification run

Headless Chromium 153 (Playwright), 1280×900 and 390×800 viewports:

- Scrolled the full page: 0 page errors; 4 canvases painted (hero + 3 plates)
- Screenshots inspected at desktop and mobile sizes (hero, all plates,
  charts): no clipping or overlap found
- AP slider 12 mV → spike fires, readout matches trace
- Two-PSP / two-PSP+IPSP reference cases pass (see table)
- Lateral-inhibition outputs match the source’s numbers exactly
- Reduced-motion context: no canvas painting, tap step advances manually only
- WebGL blocked: `.paint-failed` set on all three plates, SVG fallbacks visible,
  demos still operative, no page errors

Known gap: the hero plate’s fallback is the page’s painted CSS paper
background (it is decorative and `aria-hidden`), so nothing is lost without
WebGL; the three anatomical plates all carry full labeled SVG fallbacks.
