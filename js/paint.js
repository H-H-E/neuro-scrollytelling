/* Painted plates — p5.js 1.11.3 (instance mode, WEBGL) + p5.brush 1.1.4.
   Chosen from a five-brush visual study on this exact composition:
   - rotring  : crisp continuous ink lines (outlines, dendrites, fine work)
   - charcoal : soft heavy body strokes (axon cable, leg forms)
   - marker   : bold continuous dark fills (terminals, electrodes)
   - 2B/pen   : avoided — render as broken dot chains at these weights.
   Watercolor fills use brush.fill + beginShape/vertex (verified rendering).
   Each plate is seeded for reproducibility, drawn once when it first enters
   the viewport; no animation loop runs afterward. If p5/WebGL are unavailable
   or reading mode is on, the SVG fallback stays visible and this does nothing. */

(function () {
  "use strict";

  var reducing = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var style = document.createElement("style");
  style.textContent = ".plate.painted .plate-fallback{display:none}";
  document.head.appendChild(style);

  function makePlate(container, w, h, seed, drawFn) {
    var host = container.querySelector(".plate-canvas") || container;
    var sketch = function (p) {
      if (window.brush && brush.instance) brush.instance(p);
      p.setup = function () {
        p.createCanvas(w, h, p.WEBGL);
        p.noLoop();
        if (!window.brush || !brush.load) {
          container.classList.add("paint-failed");
          return;
        }
        try {
          brush.load();
        } catch (err) {
          container.classList.add("paint-failed");
          return;
        }
        brush.seed(seed);
        try {
          drawFn(p);
          container.classList.add("painted");
        } catch (err) {
          container.classList.add("paint-failed");
        }
      };
    };
    try {
      new p5(sketch, host);
    } catch (err) {
      container.classList.add("paint-failed");
    }
  }

  var C = {
    paper: "#f9f4e6",
    sepia: "#7a4d26",
    tan: "#e8b98a",
    teal: "#2b6a66",
    tealWash: "#bfe3e0",
    green: "#4d7c43",
    greenWash: "#cfe0c3",
    red: "#b0472f",
    redWash: "#eecdc3",
    blue: "#3d5aa9",
    ochre: "#c8801f",
    iron: "#3c352d"
  };

  function blob(p, cx, cy, rx, ry, color, rot) {
    brush.fill(color, 78);
    brush.bleed(0.6, 0);
    brush.fillTexture(0.6, 0.55);
    if (rot) brush.rotate(rot);
    brush.beginShape();
    for (var i = 0; i < 10; i++) {
      var a = (i / 10) * p.TWO_PI;
      var wob = 1 + 0.14 * Math.sin(i * 7.13) + 0.05 * Math.cos(i * 3.7);
      brush.vertex(cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob, 0.9);
    }
    brush.endShape(true);
    if (rot) brush.rotate(0);
  }

  function ink(points, weight, color, times, curvature) {
    for (var i = 0; i < (times || 1); i++) {
      brush.set("rotring", color, weight - (i * weight) / 4);
      brush.spline(points, curvature == null ? 0.45 : curvature);
    }
  }

  function charcoal(pts, weight, color, curvature) {
    brush.set("charcoal", color, weight);
    brush.spline(pts, curvature == null ? 0.4 : curvature);
  }

  function markerDot(x, y, r, color) {
    brush.set("marker", color, 1);
    brush.fill(color, 88);
    brush.circle(x, y, r, true);
  }

  /* ---------------- HERO: evening field of cells ---------------- */
  function drawHero(p) {
    p.background(249, 244, 230);
    /* far watercolor washes */
    for (var i = 0; i < 6; i++) {
      blob(p, -330 + i * 130, Math.sin(i * 1.9) * 108, 120, 62, i % 2 ? C.tealWash : C.tan, (i % 3) * 0.12 - 0.12);
    }
    /* long sweeping wave strokes */
    brush.field("waves");
    for (var j = 0; j < 5; j++) {
      brush.set("charcoal", j % 2 ? C.teal : C.sepia, 16 - j * 2);
      brush.flowLine(-420, -150 + j * 78, 840, 0.07 * (j - 2));
    }
    brush.noField();
    /* fine ink field */
    for (var k = 0; k < 26; k++) {
      ink([[-420 + k * 32, -190], [-404 + k * 32, Math.sin(k * 1.7) * 70], [-428 + k * 32, 190]], 2.5, C.iron, 1, 0.55);
    }
    /* constellation: a few cell bodies connected */
    var cells = [[-280, -60], [-90, 40], [120, -90], [300, 60]];
    for (var c = 0; c < cells.length; c++) {
      blob(p, cells[c][0], cells[c][1], 34, 30, c % 2 ? C.tealWash : C.tan, 0.3 * c);
      if (c) ink([[cells[c - 1][0], cells[c - 1][1]], [(cells[c - 1][0] + cells[c][0]) / 2, (cells[c - 1][1] + cells[c][1]) / 2 - 30], [cells[c][0], cells[c][1]]], 3, C.iron, 1, 0.4);
    }
  }

  /* ---------------- PLATE I: the neuron ---------------- */
  function drawNeuron(p) {
    p.background(249, 244, 230);
    /* soma + nucleus */
    blob(p, -40, 16, 62, 52, C.tan, 0.08);
    markerDot(-44, 12, 15, C.sepia);
    /* dendrites: ink outlines + branchlets */
    var dend = [
      [[-92, 2], [-145, -34], [-198, -56], [-252, -98]],
      [[-95, 22], [-155, 30], [-212, 55], [-268, 68]],
      [[-90, 36], [-134, 80], [-178, 106], [-214, 152]],
      [[-80, -6], [-118, -66], [-142, -128], [-165, -158]]
    ];
    for (var i = 0; i < dend.length; i++) {
      charcoal(dend[i], 9 - i, C.tan, 0.55);
      ink(dend[i], 3.4, C.sepia, 2, 0.55);
      var tip = dend[i][dend[i].length - 1];
      ink([tip, [tip[0] - 26, tip[1] + 20]], 2.4, C.sepia, 1, 0.35);
      ink([tip, [tip[0] + 12, tip[1] - 26]], 2.4, C.sepia, 1, 0.35);
    }
    /* axon: charcoal cable + ink spine */
    var axon = [[16, 12], [90, -8], [164, 10], [244, -6], [282, 4]];
    charcoal(axon, 17, C.tan, 0.3);
    ink(axon, 3.6, C.sepia, 1, 0.3);
    /* myelin washes */
    for (var m = 0; m < 4; m++) {
      blob(p, 56 + m * 62, (m % 2 ? 6 : -6), 26, 21, C.tealWash, 0.18 * (m % 2 ? 1 : -1));
    }
    /* presynaptic terminal + vesicles */
    blob(p, 286, 8, 30, 24, C.tan, 0.2);
    markerDot(258, 24, 4.5, C.blue);
    markerDot(268, 14, 4, C.blue);
    markerDot(262, 0, 3.6, C.blue);
    /* postsynaptic cell, cleft between */
    blob(p, 252, 128, 66, 38, C.tealWash, -0.35);
    ink([[300, 30], [308, 96]], 3, C.iron, 1, 0);
  }

  /* ---------------- PLATE IV: integration trio ---------------- */
  function drawIntegration(p) {
    p.background(249, 244, 230);
    /* blue postsynaptic cell (has dendrite tips) */
    blob(p, 40, 60, 78, 64, C.tealWash, 0.1);
    ink([[-20, 30], [10, 44]], 3, C.teal, 1, 0.2);
    /* green excitatory cell + axon */
    blob(p, -212, -104, 48, 42, C.greenWash, 0.22);
    var g1 = [[-176, -82], [-110, -40], [-40, 6], [12, 34]];
    charcoal(g1, 8, C.greenWash, 0.45);
    ink(g1, 3.2, C.green, 1, 0.45);
    markerDot(24, 38, 12, C.green);
    /* red inhibitory cell + axon */
    blob(p, -212, 138, 44, 40, C.redWash, -0.18);
    var r1 = [[-178, 128], [-104, 120], [-36, 96], [4, 78]];
    charcoal(r1, 8, C.redWash, 0.45);
    ink(r1, 3.2, C.red, 1, 0.45);
    markerDot(14, 74, 11, C.red);
  }

  /* ---------------- PLATE VI: reflex ---------------- */
  function drawReflex(p) {
    p.background(249, 244, 230);
    var W = 640, H = 480;
    /* spinal cord: heavy vertical sweep at left */
    var cord = [[-W / 2 + 70, -200], [-W / 2 + 82, -60], [-W / 2 + 74, 80], [-W / 2 + 90, 210]];
    charcoal(cord, 22, "#d9c8a8", 0.2);
    ink(cord, 4, C.iron, 1, 0.2);
    for (var cs = 0; cs < 4; cs++) {
      ink([[-W / 2 + 60, -150 + cs * 100], [-W / 2 + 130, -160 + cs * 100]], 2.6, C.iron, 1, 0.3);
    }
    /* leg: thigh and shin, knee at (140, -20) */
    var thigh = [[10, -170], [80, -95], [140, -20]];
    charcoal(thigh, 42, C.tan, 0.15);
    ink(thigh, 4, C.sepia, 1, 0.15);
    var shin = [[140, -20], [166, 100], [158, 210]];
    charcoal(shin, 30, C.tan, 0.15);
    ink(shin, 3.6, C.sepia, 1, 0.15);
    /* patellar tendon + tap point at knee */
    markerDot(140, -20, 12, C.ochre);
    /* hammer: handle up-left, head near knee */
    ink([[30, -140], [96, -66]], 5, C.iron, 1, 0.05);
    blob(p, 118, -52, 34, 20, "#d9d2c4", 0.5);
    /* MN pool: extensor (teal, bottom-center) + flexor MN + interneuron */
    var up = [[-150, 140], [-80, 165], [-6, 175], [70, 168]];
    ink(up, 3.4, C.iron, 1, 0.35);
    var down = [[-150, 60], [-84, 40], [-18, 28], [52, 20]];
    ink(down, 3, C.iron, 1, 0.35);
    /* interneuron between them, red inhibitory link to flexor MN */
    blob(p, -60, 48, 22, 18, "#dcd6ca", 0.2);
    ink([[-60, 66], [-58, 96]], 3, C.red, 1, 0.1);
    markerDot(-58, 104, 9, C.red);
    /* extensor MN body + efferent to shin muscle */
    blob(p, 60, 168, 24, 20, C.tealWash, -0.15);
    var eff = [[74, 186], [130, 150], [150, 60]];
    ink(eff, 3.6, C.teal, 1, 0.3);
    /* muscle hatch along thigh */
    for (var mh = 0; mh < 7; mh++) {
      ink([[56 + mh * 16, -140], [42 + mh * 16, -100]], 2.2, C.sepia, 1, 0.2);
    }
  }

  /* ---------------- wiring (lazy, one pass per plate) ---------------- */
  function initPaint(container) {
    if (document.body.classList.contains("reading-mode") || container.dataset.painted) return;
    if (!window.p5 || !window.brush) return;
    container.dataset.painted = "1";
    var name = container.dataset.plate;
    if (name === "hero") makePlate(container, 900, 440, 11, drawHero);
    if (name === "neuron") makePlate(container, 640, 420, 27, drawNeuron);
    if (name === "integration") makePlate(container, 620, 380, 41, drawIntegration);
    if (name === "reflex") makePlate(container, 640, 480, 58, drawReflex);
  }

  function init() {
    var plates = document.querySelectorAll("[data-plate]");
    if (reducing) {
      /* no lazy paint under reduced motion: another reader can operate the
         same content through the SVG fallbacks and text */
      return;
    }
    if (!("IntersectionObserver" in window)) {
      plates.forEach(initPaint);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) initPaint(e.target);
      });
    }, { rootMargin: "250px" });
    plates.forEach(function (pl) { io.observe(pl); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
