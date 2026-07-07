// board.js — moteur de dessin du tableau.
// Gère les canvas, le rendu des traits, et les outils "libres" (crayon, fluo, gomme, ligne).
// Les instruments géométriques sont délégués à instruments.js.
//
// Système de coordonnées : chaque point est normalisé par la LARGEUR du canvas
// (nx = x/W, ny = y/W). L'échelle est donc uniforme => cercles et angles restent
// corrects même si les deux écrans n'ont pas la même taille.

window.Board = (function () {
  let board, overlay, wrap, bctx, octx;
  let dpr = 1, cssW = 0, cssH = 0;
  let strokes = [];            // traits validés (partagés)
  let drawing = null;          // trait en cours (outils libres)
  let onCommit = () => {};     // callback -> collab
  let me = { name: "?", role: "eleve" };

  // ---------- init ----------
  function init(opts) {
    board = document.getElementById("board");
    overlay = document.getElementById("overlay");
    wrap = document.getElementById("canvas-wrap");
    bctx = board.getContext("2d");
    octx = overlay.getContext("2d");
    onCommit = opts.onCommit || onCommit;

    window.addEventListener("resize", resize);
    resize();

    board.addEventListener("pointerdown", onDown);
    board.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    board.addEventListener("pointerleave", () => sendCursor(null));

    requestAnimationFrame(loop);
  }

  function setMe(u) { me = u; }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    cssW = wrap.clientWidth;
    cssH = wrap.clientHeight;
    for (const c of [board, overlay]) {
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(cssH * dpr);
    }
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderBoard();
  }

  // ---------- conversions ----------
  function eventPt(e) {
    const r = board.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function toNorm(p) { return { x: p.x / cssW, y: p.y / cssW }; }
  function toScreen(p) { return { x: p.x * cssW, y: p.y * cssW }; }

  // ---------- rendu ----------
  function renderStroke(ctx, s) {
    if (!s.points || s.points.length === 0) return;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (s.tool === "gomme") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = s.width;
    } else if (s.tool === "fluo") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = s.width;
      ctx.lineCap = "butt";
    } else if (s.tool === "compas") {
      // cercle : points = [centre, pointSurCercle]
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      const c = toScreen(s.points[0]);
      const e = toScreen(s.points[1]);
      const rad = Math.hypot(e.x - c.x, e.y - c.y);
      ctx.beginPath();
      ctx.arc(c.x, c.y, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
    }
    ctx.beginPath();
    const p0 = toScreen(s.points[0]);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < s.points.length; i++) {
      const p = toScreen(s.points[i]);
      ctx.lineTo(p.x, p.y);
    }
    if (s.points.length === 1) ctx.lineTo(p0.x + 0.1, p0.y + 0.1);
    ctx.stroke();
    ctx.restore();
  }

  function renderBoard() {
    bctx.clearRect(0, 0, cssW, cssH);
    for (const s of strokes) renderStroke(bctx, s);
    if (drawing) renderStroke(bctx, drawing);
  }

  // rendu de l'overlay (instruments + curseurs distants + aperçus)
  function renderOverlay() {
    octx.clearRect(0, 0, cssW, cssH);
    try {
      if (window.Instruments) window.Instruments.render(octx);
      if (window.Collab) window.Collab.renderCursors(octx, toScreen);
    } catch (e) {
      console.error("Erreur de rendu overlay:", e);
    }
  }
  // boucle d'animation — protégée pour ne jamais s'arrêter
  function loop() {
    renderOverlay();
    requestAnimationFrame(loop);
  }

  // ---------- gestion pointeur ----------
  function isInstrumentTool(t) {
    return ["regle", "equerre", "aristo", "rapporteur", "compas", "thamographe"].includes(t);
  }

  function onDown(e) {
    board.setPointerCapture?.(e.pointerId);
    const p = eventPt(e);
    const t = App.state.tool;
    if (isInstrumentTool(t)) {
      window.Instruments.pointerDown(p, App.state);
      renderOverlay();
      return;
    }
    drawing = {
      id: uid(),
      author: me.name,
      tool: t,
      color: App.state.color,
      width: App.state.width * (t === "fluo" ? 4 : 1),
      points: [toNorm(p)],
    };
    if (t === "ligne") drawing.points.push(toNorm(p)); // 2e point suivra
    renderBoard();
  }

  function onMove(e) {
    const p = eventPt(e);
    sendCursor(p);
    const t = App.state.tool;
    if (isInstrumentTool(t)) {
      window.Instruments.pointerMove(p, App.state);
      renderOverlay();
      return;
    }
    if (!drawing) return;
    if (t === "ligne") {
      drawing.points[1] = toNorm(p); // ligne droite : on ne garde que 2 points
    } else {
      drawing.points.push(toNorm(p));
    }
    renderBoard();
  }

  function onUp(e) {
    const t = App.state.tool;
    if (isInstrumentTool(t)) {
      window.Instruments.pointerUp(eventPt(e), App.state);
      renderOverlay();
      return;
    }
    if (!drawing) return;
    commit(drawing);
    drawing = null;
  }

  function sendCursor(p) {
    if (window.Collab) window.Collab.sendCursor(p ? toNorm(p) : null);
  }

  // ---------- API partagée ----------
  function commit(stroke) {
    strokes.push(stroke);
    renderBoard();
    onCommit(stroke);
  }
  // Fabrique un trait à partir de points en pixels écran (utilisé par les instruments)
  function makeStroke(tool, color, width, screenPoints) {
    return {
      id: uid(),
      author: me.name,
      tool, color, width,
      points: screenPoints.map(toNorm),
    };
  }

  function addRemoteStroke(s) {
    if (s && s.id && strokes.some((x) => x.id === s.id)) return; // évite les doublons (écho Firebase)
    strokes.push(s);
    renderBoard();
  }
  function setStrokes(arr) { strokes = arr || []; renderBoard(); }
  function clearAll() { strokes = []; renderBoard(); }
  function removeById(id) { strokes = strokes.filter((s) => s.id !== id); renderBoard(); }
  function lastMineId() {
    for (let i = strokes.length - 1; i >= 0; i--)
      if (strokes[i].author === me.name) return strokes[i].id;
    return null;
  }

  function uid() { return Math.random().toString(36).slice(2, 10); }

  return {
    init, setMe, resize, makeStroke,
    commit, addRemoteStroke, setStrokes, clearAll, removeById, lastMineId,
    renderBoard, pokeOverlay: renderOverlay,
    toNorm, toScreen,
    get width() { return cssW; },
  };
})();
