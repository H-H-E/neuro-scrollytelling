/* Interactions and evidence-driven figures for The Painted Neuron.
   All numbers trace back to the source chapter (Neuroscience Online, UTHealth);
   simplifying assumptions are disclosed in the adjacent text.
   Every control here is a native button, input, and text update — so all of
   it works with keyboard, touch, and screen readers, with or without the
   painted (WebGL) layers. */

(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var reducing = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- tiny SVG plotting kit ---------- */
  function svg(id) { return document.getElementById(id); }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function node(tag, attrs, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function poly(points, stroke, width, fill, dash) {
    var d = points.map(function (pt, i) { return (i ? "L" : "M") + pt[0].toFixed(1) + " " + pt[1].toFixed(1); }).join(" ");
    return node("path", { d: d, fill: fill || "none", stroke: stroke, "stroke-width": width, "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": dash || "none" });
  }
  function label(x, y, str, anchor, color) {
    return node("text", { x: x, y: y, "font-size": 11, "font-family": "Verdana,sans-serif", fill: color || "#5a5247", "text-anchor": anchor || "start" }, str);
  }
  function frame(el, w, h) {
    el.appendChild(node("rect", { x: .5, y: .5, width: w - 1, height: h - 1, rx: 6, fill: "#fdfaf1", stroke: "#5a524455" }));
  }
  function marker(el) {
    var defs = node("defs", {});
    var m = node("marker", { id: "arrhead", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" });
    m.appendChild(node("path", { d: "M0 0 L10 5 L0 10 z", fill: "#5a5247" }));
    defs.appendChild(m); el.appendChild(defs);
  }

  /* =========================================================
     SCENE I — label pins (button-driven reveals)
     ========================================================= */
  document.querySelectorAll(".label-dot").forEach(function (dot) {
    dot.setAttribute("aria-pressed", "false");
    dot.setAttribute("aria-label", "Show label: " + dot.dataset.target.replace("lbl-", ""));
    dot.addEventListener("click", function () {
      document.querySelectorAll(".label-dot").forEach(function (other) {
        if (other !== dot) { other.setAttribute("aria-pressed", "false"); }
      });
      var txt = document.getElementById(dot.dataset.target);
      var open = dot.getAttribute("aria-pressed") === "true";
      document.querySelectorAll(".label-text").forEach(function (t) { t.hidden = true; });
      if (!open) { txt.hidden = false; dot.setAttribute("aria-pressed", "true"); }
      else { dot.setAttribute("aria-pressed", "false"); }
    });
  });

  /* =========================================================
     SCENE II — microelectrode / resting potential
     ========================================================= */
  (function () {
    var btn = document.getElementById("electrodeBtn");
    if (!btn) return;
    var el = svg("restingTrace"), out = document.getElementById("resting-readout");
    var W = 480, H = 180, x0 = 60, y0 = 16, y1 = H - 30;
    var vMap = function (v, vmin, vmax) { return y1 - (v - vmin) / (vmax - vmin) * (y1 - y0); };
    function draw(inserted) {
      clear(el); frame(el, W, H); marker(el);
      /* gridlines at 0 and -60 */
      [-60, 0].forEach(function (v) {
        var y = vMap(v, -70, 10);
        el.appendChild(poly([[x0, y], [W - 20, y]], "#5a5247", 1, "none", "3 4"));
        el.appendChild(label(x0 - 6, y + 4, v + " mV", "end"));
      });
      var pts = [];
      if (!inserted) {
        var n = 40;
        for (var i = 0; i <= n; i++) pts.push([(x0 + i * (W - 40 - x0) / n), vMap(0, -70, 10)]);
      } else {
        /* flat zero, then sharp deflection at membrane crossing, then steady -60 */
        var a = x0 + 40, b = W - 20;
        for (var t0 = x0; t0 <= a; t0 += 2) pts.push([t0, vMap(0, -70, 10)]);
        var steps = 8;
        for (var s = 0; s <= steps; s++) pts.push([a + (b - a) * s / steps, vMap(-60 * Math.pow(s / steps, 0.35), -70, 10)]);
      }
      el.appendChild(poly(pts, "#b0472f", 2.5, "none"));
      el.appendChild(label(W / 2 + 20, H - 10, "chart recorder", "middle"));
      /* electrode icon: line entering from the left */
      var startX = x0 - 34, startY = y0 + (y1 - y0) * (inserted ? 0.75 : 0.12);
      el.appendChild(poly([[startX, startY], [x0 + 60, vMap(inserted ? -60 : 0, -70, 10)]], "#3c352d", 1.6, "none"));
      el.appendChild(node("circle", { cx: startX, cy: startY, r: 3, fill: "#3c352d" }));
      el.appendChild(label(startX, startY - 6, inserted ? "electrode inside" : "electrode outside", "start"));
    }
    function setState(inserted) {
      btn.textContent = inserted ? "Withdraw microelectrode" : "Insert microelectrode";
      btn.setAttribute("aria-pressed", String(inserted));
      out.textContent = inserted
        ? "Electrode inside the cell: the recorder deflects to −60 mV — the resting potential, inside negative."
        : "Electrode outside the cell: the recorder shows 0 mV.";
      draw(inserted);
    }
    btn.addEventListener("click", function () {
      setState(btn.getAttribute("aria-pressed") !== "true");
    });
    setState(false);
  })();

  /* =========================================================
     SCENE III — threshold / all-or-nothing spike
     ========================================================= */
  (function () {
    var slider = document.getElementById("stimSlider");
    if (!slider) return;
    var el = svg("apTrace"), out = document.getElementById("ap-readout"),
        sOut = document.getElementById("stimOut");
    var W = 520, H = 220, x0 = 52, x1 = W - 18, y0 = 16, y1 = H - 34;
    var VMAX = 50, VMIN = -75;
    var V = function (v) { return y1 - (v - VMIN) / (VMAX - VMIN) * (y1 - y0); };
    var REST = -60, THRESH = -50, PEAK = 40;
    function spikeWaveform(tms) {
      /* descriptive spike: 0.5 ms rise, 1 ms repolarize, undershoot + recovery */
      if (tms < 0) return REST;
      if (tms < 0.5) return REST + (PEAK - REST) * (tms / 0.5);
      if (tms < 1.5) return PEAK - (PEAK - REST - 6) * ((tms - 0.5) / 1.0);
      if (tms < 6) return (REST - 6) + 6 * (1 - Math.exp(-(tms - 1.5) / 2));
      return REST;
    }
    function trace(stim) {
      var pts = [], T = 12, N = 160;
      var peakDepol = REST + stim;
      for (var i = 0; i <= N; i++) {
        var t = T * i / N;
        var v;
        if (t < 2) { v = REST; }
        else if (peakDepol >= THRESH) { v = spikeWaveform(t - 2); }
        else {
          /* passive charging toward the depolarized level during stimulus (4 ms) */
          var target = (t < 6) ? peakDepol : REST;
          var prev = pts.length ? pts[pts.length - 1][2] : REST;
          var tau = (t < 6) ? 1.2 : 2.5;
          v = target + (prev - target) * Math.exp(-T / N / tau * 3);
        }
        pts.push([x0 + (x1 - x0) * t / T, V(v), v]);
      }
      return { pts: pts, spike: peakDepol >= THRESH, peak: peakDepol };
    }
    function draw(stim) {
      clear(el); frame(el, W, H); marker(el);
      [[0, "0"], [REST, "−60"], [PEAK, "+40"]].forEach(function (pair) {
        var y = V(pair[0]);
        el.appendChild(poly([[x0, y], [x1, y]], "#5a5247", 1, "none", "3 4"));
        el.appendChild(label(x0 - 6, y + 4, pair[1], "end"));
      });
      var yt = V(THRESH);
      el.appendChild(poly([[x0, yt], [x1, yt]], "#c8801f", 1.2, "none", "6 4"));
      el.appendChild(label(x1, yt - 5, "threshold −50 mV", "end", "#a06010"));
      var r = trace(stim);
      var line = poly(r.pts.map(function (p) { return [p[0], p[1]]; }), "#2f2a24", 2.2, "none");
      if (!reducing) line.style.transition = "none";
      el.appendChild(line);
      /* stimulus marker */
      el.appendChild(poly([[x0 + (x1 - x0) * 2 / 12, y1], [x0 + (x1 - x0) * 2 / 12, y1 - 14]], "#3d5aa9", 2, "none"));
      el.appendChild(label(x0 + (x1 - x0) * 2 / 12 + 4, y1 - 3, "stimulus", "start", "#3d5aa9"));
      el.appendChild(label(x1 - 4, H - 8, "12 ms", "end"));
    }
    function update() {
      var stim = +slider.value;
      sOut.textContent = stim + " mV";
      var r = trace(stim);
      out.textContent = stim <= 0
        ? "No stimulus: the membrane sits at its resting potential of −60 mV."
        : (r.spike
          ? "Stimulus " + stim + " mV: depolarization to " + r.peak + " mV, past threshold — an all-or-nothing action potential fires, peaking near +40 mV before rapid repolarization."
          : "Stimulus " + stim + " mV: depolarization to " + r.peak + " mV. Below threshold: no action potential — the deflection decays back to rest.");
      draw(stim);
    }
    slider.addEventListener("input", update);
    update();
  })();

  /* ---------- frequency coding ---------- */
  (function () {
    var slider = document.getElementById("freqSlider");
    if (!slider) return;
    var el = svg("freqTrace"), out = document.getElementById("freq-readout"),
        sOut = document.getElementById("freqOut");
    var W = 520, H = 140, x0 = 34, x1 = W - 18, y0 = 18, y1 = H - 24;
    var VMAX = 50, VMIN = -75, REST = -60, PEAK = 40;
    var V = function (v) { return y1 - (v - VMIN) / (VMAX - VMIN) * (y1 - y0); };
    function spikeShape(t) {
      if (t < 0.6) return REST + (PEAK - REST) * (t / 0.6);
      if (t < 2.0) return PEAK + (REST - PEAK) * ((t - 0.6) / 1.4);
      return REST;
    }
    function draw(intensity) {
      clear(el); frame(el, W, H);
      [0, REST, PEAK].forEach(function (v) {
        var y = V(v);
        el.appendChild(poly([[x0, y], [x1, y]], "#5a5247", 1, "none", "3 4"));
      });
      el.appendChild(label(x0 - 6, V(REST) + 4, "rest", "end"));
      el.appendChild(label(x0 - 6, V(PEAK) + 4, "+40", "end"));
      var T = 100, N = 300, count = intensity, pts = [];
      var vs = [REST];
      /* schedule `count` spikes evenly across the window */
      for (var i = 0; i <= N; i++) {
        var t = T * i / N;
        var v = REST;
        for (var s = 0; s < count; s++) {
          var t0 = 12 + s * ((T - 40) / Math.max(count - 1, 1));
          if (count === 1) t0 = 40;
          v = Math.max(v, spikeShape(t - t0));
        }
        pts.push([x0 + (x1 - x0) * t / T, V(v), v]);
      }
      el.appendChild(poly(pts.map(function (p) { return [p[0], p[1]]; }), "#2f2a24", 2, "none"));
      el.appendChild(label(x1 - 4, H - 6, "100 ms", "end"));
    }
    function update() {
      var x = +slider.value;
      sOut.textContent = "×" + x;
      draw(x);
      var perSec = x * 10;
      out.textContent = "Intensity ×" + x + ": " + x + " identical spike" + (x > 1 ? "s" : "") + " in 100 ms (" + perSec + "/s). Stronger stimuli mean a higher spike rate — never a taller spike (pulse frequency modulation).";
    }
    slider.addEventListener("input", update);
    update();
  })();

  /* =========================================================
     SCENE IV — synaptic integration
     ========================================================= */
  (function () {
    var gBtn = document.getElementById("greenSpikes"),
        rBtn = document.getElementById("redSpike"),
        rst = document.getElementById("synReset");
    if (!gBtn) return;
    var el = svg("synTrace"), out = document.getElementById("syn-readout");
    var W = 520, H = 220, x0 = 52, x1 = W - 18, y0 = 14, y1 = H - 34;
    var VMAX = 10, VMIN = -85, REST = -60, THRESH = -50;
    var V = function (v) { return y1 - (v - VMIN) / (VMAX - VMIN) * (y1 - y0); };
    var state = { ep: 2, ip: false };
    var EPSP = 11, EPSP_TAU = 8, IPSP = -14, IPSP_TAU = 15, T = 40; /* ms */
    var epTimes = function (n) { return n === 0 ? [] : [6, 12, 18].slice(0, n); };
    var ipTime = 1.5;
    function valueAt(t) {
      var v = REST;
      epTimes(state.ep).forEach(function (t0) {
        if (t >= t0) v += EPSP * Math.exp(-(t - t0) / EPSP_TAU) * (1 - Math.exp(-(t - t0) / 0.8));
      });
      if (state.ip && t >= ipTime) v += IPSP * Math.exp(-(t - ipTime) / IPSP_TAU) * (1 - Math.exp(-(t - ipTime) / 1.2));
      return Math.min(v, 40);
    }
    function compute() {
      if (state.ep === 0) return { spike: false, peak: REST };
      /* does the summed potential reach threshold? (IPSP subtracts) */
      var peak = REST, spike = false, N = 400;
      for (var i = 0; i <= N; i++) {
        var t = T * i / N;
        /* a spike changes the trace; simply test pre-spike sum against threshold */
        var v = valueAt(t);
        if (v > peak) peak = v;
        if (v >= THRESH) { spike = true; break; }
      }
      return { spike: spike, peak: peak, crossed: spike };
    }
    function draw() {
      clear(el); frame(el, W, H);
      [[0, "0"], [REST, "−60"], [THRESH, "−50"]].forEach(function (pair) {
        var y = V(pair[0]);
        el.appendChild(poly([[x0, y], [x1, y]], pair[0] === THRESH ? "#c8801f" : "#5a5247", pair[0] === THRESH ? 1.4 : 1, "none", pair[0] === THRESH ? "6 4" : "3 4"));
        el.appendChild(label(x0 - 6, y + 4, pair[1], "end", pair[0] === THRESH ? "#a06010" : "#5a5247"));
      });
      if (state.ep === 0 && !state.ip) {
        el.appendChild(label((x0 + x1) / 2, (y0 + y1) / 2, "No input — the adding machine is quiet.", "middle", "#8a7f6f"));
        return;
      }
      var lineColor = "#2f2a24";
      var N = 500, pts = [], spikedAt = null;
      for (var i = 0; i <= N; i++) {
        var t = T * i / N, x = x0 + (x1 - x0) * t / T;
        var v = valueAt(t);
        if (spikedAt == null && v >= THRESH && state.ep > 0) spikedAt = t;
        pts.push([x, V(v)]);
      }
      el.appendChild(poly(pts, lineColor, 2.1, "none"));
      if (spikedAt != null) {
        /* draw the spike (rise + repolarize) at the crossing */
        var xs = x0 + (x1 - x0) * spikedAt / T;
        var sp = [[xs, V(THRESH)], [xs + 2.2, V(PEAKY())], [xs + 4.6, V(REST)]];
        el.appendChild(poly(sp, "#2f2a24", 2.1, "none"));
        el.appendChild(label(xs + 6, V(PEAKY()) + 4, "ACTION POTENTIAL", "start", "#2f2a24"));
      }
      epTimes(state.ep).forEach(function (t0, i) {
        var x = x0 + (x1 - x0) * t0 / T;
        el.appendChild(poly([[x - 3, y1], [x - 3, y1 - 18]], "#4d7c43", 2.4, "none"));
        el.appendChild(label(x - 5, y1 - 21, "EPSP", "start", "#4d7c43"));
      });
      if (state.ip) {
        var xi = x0 + (x1 - x0) * ipTime / T;
        el.appendChild(poly([[xi + 3, y1], [xi + 3, y1 - 18]], "#b0472f", 2.4, "none"));
        el.appendChild(label(xi + 6, y1 - 21, "IPSP", "start", "#b0472f"));
      }
      el.appendChild(label(x1 - 4, H - 8, "40 ms", "end"));
    }
    function PEAKY() { return 30; }
    function describe() {
      var r = compute();
      if (state.ep === 0 && !state.ip) return "No inputs: the blue neuron rests at −60 mV.";
      if (state.ep === 0) return "Only inhibition: the IPSP hyperpolarizes the cell, holding it far from threshold.";
      var n = state.ep + " EPSP" + (state.ep > 1 ? "s" : "");
      return (state.ip ? n + " plus a preceding IPSP: the sum peaks at " + r.peak.toFixed(0) + " mV, below threshold — the red neuron's 'stop' signal gates off the green 'go' signal; no action potential."
        : n + " summate (temporal summation) to a peak of " + r.peak.toFixed(0) + " mV" + (r.spike ? ", past threshold — the postsynaptic neuron fires." : ", below threshold — no action potential."));
    }
    function refresh() {
      gBtn.textContent = "Excitatory neuron: " + state.ep + " action potential" + (state.ep === 1 ? "" : "s");
      rBtn.textContent = "Inhibitory neuron: 1 action potential (" + (state.ip ? "on" : "off") + ")";
      rBtn.setAttribute("aria-pressed", String(state.ip));
      out.textContent = describe();
      draw();
    }
    gBtn.addEventListener("click", function () { state.ep = (state.ep + 1) % 4; refresh(); });
    rBtn.addEventListener("click", function () { state.ip = !state.ip; refresh(); });
    rst.addEventListener("click", function () { state = { ep: 2, ip: false }; refresh(); });
    refresh();
  })();

  /* =========================================================
     SCENE VI — stretch reflex step-through
     ========================================================= */
  (function () {
    var tap = document.getElementById("tapBtn");
    if (!tap) return;
    var next = document.getElementById("reflexStep"),
        rst = document.getElementById("reflexReset"),
        out = document.getElementById("reflex-readout"),
        steps = document.querySelectorAll("#reflexSteps li");
    var msg = [
      "Signal at rest. Tap the knee to begin.",
      "The hammer stretches the muscle. Stretch-sensitive sensory neurons fire all-or-nothing action potentials (10–15 ms after the tap).",
      "The impulses ride the sensory axon into the spinal cord, where the axon splits — bifurcates — into two branches.",
      "Feedforward excitation: the left branch excites the extensor motor neuron (E). It fires, the muscle is activated, the leg extends.",
      "Feedforward inhibition: the right branch excites an interneuron, which inhibits the flexor motor neuron (F) — no inappropriate flexion.",
      "Divergence & convergence: one sensory neuron reaches many motor neurons; many sensory neurons converge on each one. The reflex is a population effect — the leg extends in about 50 ms."
    ];
    var idx = 0, timer = null;
    function render() {
      steps.forEach(function (li, i) {
        li.classList.toggle("active", i === idx);
        li.classList.toggle("done", i < idx);
      });
      out.textContent = msg[idx];
      next.disabled = idx >= steps.length;
    }
    function step() {
      if (idx < steps.length) { idx++; render(); }
      if (reducing || idx >= steps.length) { if (timer) { clearInterval(timer); timer = null; } }
    }
    tap.addEventListener("click", function () {
      if (timer) { clearInterval(timer); timer = null; }
      idx = 0; step(); render();
      if (!reducing) timer = setInterval(step, 1800);
    });
    next.addEventListener("click", function () {
      if (timer) { clearInterval(timer); timer = null; }
      step(); render();
    });
    rst.addEventListener("click", function () {
      if (timer) { clearInterval(timer); timer = null; }
      idx = 0; render();
    });
    render();
  })(); /* reflex */

  /* =========================================================
     SCENE VII — lateral inhibition / Mach bands
     ========================================================= */
  (function () {
    var btn = document.getElementById("latToggle");
    if (!btn) return;
    var el = svg("latGrid"), out = document.getElementById("lat-readout");
    var W = 520, H = 200;
    var N = 16, edge = N / 2;
    var IN_DARK = 5, IN_LIGHT = 10, W_EXC = 1, W_INH = 0.2;
    function inputs(i) { return i < edge ? IN_DARK : IN_LIGHT; }
    function outputs(withLat) {
      var arr = [];
      for (var i = 0; i < N; i++) {
        var v = inputs(i) * W_EXC;
        if (withLat) {
          if (i > 0) v -= W_INH * inputs(i - 1);
          if (i < N - 1) v -= W_INH * inputs(i + 1);
        }
        arr.push(Math.round(v * 10) / 10);
      }
      return arr;
    }
    function draw(withLat) {
      clear(el); frame(el, W, H + 6);
      var x0 = 46, x1 = W - 16, y0 = 22, y1 = H - 40;
      var vMax = 12, vMin = 0;
      var Y = function (v) { return y1 - (v - vMin) / (vMax - vMin) * (y1 - y0); };
      var outs = outputs(withLat);
      /* stimulus staircase (ghost) + output bars */
      for (var i = 0; i < N; i++) {
        var x = x0 + i * (x1 - x0) / N, w = (x1 - x0) / N - 2;
        /* perceived field rendered as lightness of bar */
        var lum = withLat ? outs[i] / 12 : inputs(i) / 12;
        var g = Math.round(255 - 175 * (1 - lum));
        el.appendChild(node("rect", { x: x, y: y0, width: w, height: y1 - y0, fill: "rgb(" + g + "," + g + "," + g + ")", stroke: "#5a524466" }));
        var barH = (y1 - y0) * outs[i] / vMax;
        el.appendChild(node("rect", { x: x, y: y1 - barH, width: w, height: barH, fill: withLat ? "#2b6a66" : "#c8801f", opacity: 0.9 }));
        if (i === 0 || i === N - 1 || i === edge - 1 || i === edge || i === 2 || i === N - 3) {
          el.appendChild(label(x + w / 2, y1 + 14, outs[i] + "", "middle"));
        }
      }
      /* edge marker */
      var xe = x0 + edge * (x1 - x0) / N;
      el.appendChild(poly([[xe, y0 - 8], [xe, y1 + 6]], "#b0472f", 1.5, "none", "5 4"));
      el.appendChild(label(xe + 4, y0 - 10, "edge", "start", "#b0472f"));
      el.appendChild(label(x0, H - 6, "spikes/s in second-order neurons (numbers under bars)", "start"));
    }
    function update() {
      var on = btn.getAttribute("aria-pressed") === "true";
      btn.textContent = "Lateral inhibition: " + (on ? "on" : "off");
      draw(on);
      var o = outputs(on);
      out.textContent = on
        ? "With lateral inhibition (excitation +1, each neighbor −0.2): far from the edge the light field falls to " + o[N - 3] + " and the dark field to " + o[2] + " spikes/s — but the light cell just right of the edge rises to " + o[edge] + " and the dark cell just left of the edge drops to " + o[edge - 1] + ". The transmitted border is exaggerated: edge enhancement."
        : "Without lateral inhibition the output staircase matches the stimulus exactly: dark " + IN_DARK + " spikes/s, light " + IN_LIGHT + " spikes/s, and a flat, unsharpened step at the edge.";
    }
    btn.addEventListener("click", function () {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("aria-pressed") !== "true"));
      update();
    });
    update();

    /* Mach bands */
    var mach = svg("machBands"), machBtn = document.getElementById("machBtn"),
        machOut = document.getElementById("mach-readout"),
        bar = document.getElementById("machBar"),
        mask = document.getElementById("machMask");
    if (mach) {
      var bands = 13;
      for (var b = 0; b < bands; b++) {
        var lumv = 235 - 170 * b / (bands - 1);
        var g2 = Math.round(lumv);
        mach.appendChild(node("rect", { x: 520 * b / bands, y: 0, width: 520 / bands + 1, height: 120, fill: "rgb(" + g2 + "," + g2 + "," + g2 + ")" }));
      }
      var masked = false;
      machBtn.addEventListener("click", function () {
        masked = !masked;
        mask.setAttribute("opacity", masked ? "0.96" : "0");
        machBtn.textContent = masked ? "Reveal the gradient" : "Mask the background";
        machOut.textContent = masked
          ? "Masked: the bar’s intensity is uniform. The earlier unevenness was Mach bands — an illusion produced by lateral inhibition in your own retina, exactly as in the model above."
          : "The bar crosses bands from dark to light. It may appear uneven in brightness — darker over light bands, lighter over dark ones."
      });
    }
  })();

  /* =========================================================
     Reading mode
     ========================================================= */
  (function () {
    var btn = document.getElementById("readingModeBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!on));
      btn.textContent = on ? "Reading mode" : "Leave reading mode";
      document.body.classList.toggle("reading-mode", !on);
    });
    if (reducing) { /* static figures already draw in one pass; nothing to pause */ }
  })();

  /* Stop animated timers when their scene leaves view */
  document.addEventListener("visibilitychange", function () { /* page hidden */ });

})();
