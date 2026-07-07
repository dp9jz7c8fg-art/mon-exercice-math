// instruments.js — instruments de géométrie posés sur le tableau.
// Chaque instrument est déplaçable (glisser le corps), rotatif (poignée ronde),
// et sert de guide : on trace le long de son arête (aimantation).
// Le compas est un mode de tracé (centre + rayon).
//
// Tout se passe en pixels écran ; la conversion en coordonnées normalisées
// est faite au moment de valider le trait (Board.makeStroke).

window.Instruments = (function () {
  const SNAP = 42;                 // distance d'aimantation à une arête (px)
  const FILL = "rgba(56,189,248,0.10)";
  const EDGE = "rgba(2,132,199,0.95)";
  const HI = "#f97316";            // surlignage du/des bord(s) où l'on trace
  const GRAD = "rgba(15,23,42,0.85)";

  let inst = null;                 // instrument courant {type,x,y,angle}
  let mode = null;                 // 'move' | 'rotate' | 'draw'
  let grab = null;                 // décalage pour le déplacement
  let seg = null;                  // segment en cours {a,b} (px)
  let compass = null;              // {center, edge} pendant le tracé au compas

  // ---------- géométrie locale des instruments ----------
  function geom(type) {
    switch (type) {
      case "regle":
        return {
          shape: [{ x: -260, y: -32 }, { x: 260, y: -32 }, { x: 260, y: 32 }, { x: -260, y: 32 }],
          edges: [[{ x: -260, y: -32 }, { x: 260, y: -32 }]], // arête haute
          handle: { x: 300, y: 0 },
          move: { x: 0, y: 12 },
          rule: { a: { x: -260, y: -32 }, b: { x: 260, y: -32 } }, // arête graduée
        };
      case "equerre": {
        const A = { x: -200, y: 140 }, B = { x: 200, y: 140 }, C = { x: -200, y: -160 };
        return { shape: [A, B, C], edges: [[A, B], [A, C], [B, C]], handle: { x: 250, y: 140 }, move: { x: -110, y: 40 }, rule: { a: A, b: B } };
      }
      case "aristo": {
        const A = { x: -220, y: 80 }, B = { x: 220, y: 80 }, C = { x: 0, y: -140 };
        return { shape: [A, B, C], edges: [[A, B], [A, C], [B, C]], handle: { x: 260, y: 80 }, move: { x: 0, y: 30 }, rule: { a: A, b: B }, protractor: { x: 0, y: 80, r: 200 } };
      }
      case "rapporteur":
        return {
          shape: null, semicircle: { r: 190 },
          edges: [[{ x: -190, y: 0 }, { x: 190, y: 0 }]], // diamètre
          handle: { x: 224, y: 0 },
          move: { x: 0, y: -70 },
          rule: { a: { x: -190, y: 0 }, b: { x: 190, y: 0 } },
          protractor: { x: 0, y: 0, r: 190 },
        };
      case "thamographe": {
        // Origine (0,0) = centre des cercles + centre du rapporteur, placée en bas
        // pour que l'arc tienne dans le corps. Règle 0-au-centre sur le bord haut.
        const TL = { x: -230, y: -170 }, TR = { x: 230, y: -170 }, BR = { x: 230, y: 70 }, BL = { x: -230, y: 70 };
        return {
          shape: [TL, TR, BR, BL],
          round: 16,
          edges: [[TL, TR], [TR, BR]],        // bord haut (règle centre) + bord droit (angle droit)
          handle: { x: 272, y: 0 },
          move: { x: -180, y: 40 },
          centerRule: { a: TL, b: TR },        // règle graduée depuis le centre
          protractor: { x: 0, y: 0, r: 150 },  // arc rapporteur centré sur l'origine
          // trous de traçage de cercles concentriques (rayon en px ; label en cm)
          holes: [{ r: 40, l: "1" }, { r: 80, l: "2" }, { r: 120, l: "3" }, { r: 160, l: "4" }, { r: 200, l: "5" }],
          center: { x: 0, y: 0 },
        };
      }
    }
  }

  // ---------- transformations ----------
  function toWorld(inst, pt) {
    const c = Math.cos(inst.angle), s = Math.sin(inst.angle);
    return { x: inst.x + pt.x * c - pt.y * s, y: inst.y + pt.x * s + pt.y * c };
  }
  function toLocal(inst, p) {
    const c = Math.cos(-inst.angle), s = Math.sin(-inst.angle);
    const dx = p.x - inst.x, dy = p.y - inst.y;
    return { x: dx * c - dy * s, y: dx * s + dy * c };
  }
  function worldEdges(inst) {
    const g = geom(inst.type);
    return g.edges.map(([a, b]) => [toWorld(inst, a), toWorld(inst, b)]);
  }

  // projette p sur la droite (infinie) passant par a-b
  function projLine(p, a, b) {
    const abx = b.x - a.x, aby = b.y - a.y;
    const t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / (abx * abx + aby * aby);
    return { x: a.x + t * abx, y: a.y + t * aby };
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function nearestEdge(inst, p) {
    let best = null;
    for (const [a, b] of worldEdges(inst)) {
      const q = projLine(p, a, b);
      const d = dist(p, q);
      if (!best || d < best.d) best = { a, b, d };
    }
    return best;
  }

  function pointInPoly(inst, p) {
    const g = geom(inst.type);
    if (!g.shape) {
      // rapporteur : demi-disque
      const l = toLocal(inst, p);
      return l.y <= 6 && Math.hypot(l.x, l.y) <= g.semicircle.r;
    }
    const l = toLocal(inst, p);
    const pts = g.shape;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
      if (((yi > l.y) !== (yj > l.y)) && (l.x < ((xj - xi) * (l.y - yi)) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  // ---------- activation ----------
  function ensure(type) {
    if (!inst || inst.type !== type) {
      const wrap = document.getElementById("canvas-wrap");
      inst = { type, x: wrap.clientWidth / 2, y: wrap.clientHeight / 2, angle: 0 };
    }
  }
  function setActive(type) {
    if (type === "compas" || !type) { /* pas d'objet fixe */ return; }
    ensure(type);
  }

  // ---------- interactions ----------
  function pointerDown(p, state) {
    if (state.tool === "compas") { compass = { center: p, edge: p }; return; }
    ensure(state.tool);
    const g = geom(inst.type);
    const handle = toWorld(inst, g.handle);
    if (dist(p, handle) < 24) { mode = "rotate"; return; }

    const mh = toWorld(inst, g.move);
    if (dist(p, mh) < 22) { mode = "move"; grab = { dx: p.x - inst.x, dy: p.y - inst.y }; return; }

    // thamographe : clic sur un trou => trace un cercle concentrique centré sur l'origine
    if (g.holes) {
      const c = toWorld(inst, g.center);
      for (const h of g.holes) {
        const hp = toWorld(inst, { x: h.r, y: 0 });
        if (dist(p, hp) < 15) {
          Board.commit(Board.makeStroke("compas", state.color, state.width, [c, hp]));
          mode = null;
          return;
        }
      }
    }

    const ne = nearestEdge(inst, p);
    if (ne && ne.d < SNAP) {
      mode = "draw";
      const s = projLine(p, ne.a, ne.b);
      seg = { a: s, b: s, edge: ne };
      return;
    }
    if (pointInPoly(inst, p)) { mode = "move"; grab = { dx: p.x - inst.x, dy: p.y - inst.y }; return; }
    // hors instrument : tracé d'une ligne droite libre
    mode = "draw";
    seg = { a: p, b: p, edge: null };
  }

  function pointerMove(p, state) {
    if (compass) { compass.edge = p; return; }
    if (!mode) return;
    if (mode === "rotate") {
      const g = geom(inst.type);
      const base = Math.atan2(g.handle.y, g.handle.x);
      inst.angle = Math.atan2(p.y - inst.y, p.x - inst.x) - base;
    } else if (mode === "move") {
      inst.x = p.x - grab.dx; inst.y = p.y - grab.dy;
    } else if (mode === "draw" && seg) {
      seg.b = seg.edge ? projLine(p, seg.edge.a, seg.edge.b) : p;
    }
  }

  function pointerUp(p, state) {
    if (compass) {
      if (dist(compass.center, compass.edge) > 3) {
        Board.commit(Board.makeStroke("compas", state.color, state.width, [compass.center, compass.edge]));
      }
      compass = null;
      return;
    }
    if (mode === "draw" && seg && dist(seg.a, seg.b) > 3) {
      Board.commit(Board.makeStroke("crayon", state.color, state.width, [seg.a, seg.b]));
    }
    mode = null; seg = null;
  }

  // ---------- rendu ----------
  function render(ctx) {
    if (inst && ["regle", "equerre", "aristo", "rapporteur", "thamographe"].includes(App.state.tool)) drawInstrument(ctx, inst);
    if (seg) {
      ctx.save();
      ctx.strokeStyle = App.state.color; ctx.lineWidth = App.state.width; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(seg.a.x, seg.a.y); ctx.lineTo(seg.b.x, seg.b.y); ctx.stroke();
      ctx.restore();
      if (inst && (inst.type === "rapporteur" || inst.type === "aristo")) drawAngleReadout(ctx);
    }
    if (compass) drawCompass(ctx);
  }

  function drawInstrument(ctx, inst) {
    const g = geom(inst.type);
    ctx.save();
    ctx.translate(inst.x, inst.y);
    ctx.rotate(inst.angle);
    ctx.lineWidth = 1.5; ctx.strokeStyle = EDGE; ctx.fillStyle = FILL;

    if (g.shape) {
      ctx.beginPath();
      if (g.round && ctx.roundRect) {
        const xs = g.shape.map((p) => p.x), ys = g.shape.map((p) => p.y);
        const x = Math.min(...xs), y = Math.min(...ys);
        ctx.roundRect(x, y, Math.max(...xs) - x, Math.max(...ys) - y, g.round);
      } else {
        g.shape.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
        ctx.closePath();
      }
      ctx.fill(); ctx.stroke();
    }
    if (g.semicircle) {
      ctx.beginPath();
      ctx.arc(0, 0, g.semicircle.r, Math.PI, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (g.rule) drawGraduations(ctx, g.rule.a, g.rule.b);
    if (g.centerRule) drawCenterGraduations(ctx, g.centerRule.a, g.centerRule.b);
    if (g.protractor) drawProtractorMarks(ctx, g.protractor);
    if (g.holes) drawHoles(ctx, g);

    // surlignage des bords où l'on peut tracer
    ctx.strokeStyle = HI; ctx.lineWidth = 4; ctx.lineCap = "round";
    for (const [a, b] of g.edges) {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    // poignée de déplacement (carré gris)
    ctx.fillStyle = "#475569"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(g.move.x - 11, g.move.y - 11, 22, 22, 5);
    else ctx.rect(g.move.x - 11, g.move.y - 11, 22, 22);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1.5;
    for (const dy of [-4, 0, 4]) { // petites rainures = "poignée"
      ctx.beginPath(); ctx.moveTo(g.move.x - 5, g.move.y + dy); ctx.lineTo(g.move.x + 5, g.move.y + dy); ctx.stroke();
    }

    // poignée de rotation
    ctx.beginPath();
    ctx.arc(g.handle.x, g.handle.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8"; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  // graduations en cm/mm le long d'une arête
  function drawGraduations(ctx, a, b) {
    const len = dist(a, b);
    const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
    const nx = -uy, ny = ux; // normale
    const step = 10; // 10 px = 1 mm approx (échelle libre)
    ctx.save();
    ctx.strokeStyle = GRAD; ctx.fillStyle = GRAD; ctx.lineWidth = 1;
    ctx.font = "9px system-ui"; ctx.textAlign = "center";
    let cm = 0;
    for (let d = 0; d <= len; d += step) {
      const big = (d % 100 === 0), mid = (d % 50 === 0);
      const h = big ? 12 : mid ? 8 : 5;
      const px = a.x + ux * d, py = a.y + uy * d;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + nx * h, py + ny * h);
      ctx.stroke();
      if (big) { ctx.fillText(String(cm++), px + nx * 20, py + ny * 20 + 3); }
    }
    ctx.restore();
  }

  // règle graduée avec 0 au CENTRE (signature du thamographe)
  function drawCenterGraduations(ctx, a, b) {
    const len = dist(a, b);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
    const nx = -uy, ny = ux;
    const step = 10;
    ctx.save();
    ctx.strokeStyle = GRAD; ctx.fillStyle = GRAD; ctx.lineWidth = 1;
    ctx.font = "9px system-ui"; ctx.textAlign = "center";
    for (let d = 0; d <= len / 2; d += step) {
      const big = d % 100 === 0, mid = d % 50 === 0;
      const h = big ? 12 : mid ? 8 : 5;
      for (const sign of [1, -1]) {
        if (d === 0 && sign === -1) continue;
        const px = mx + ux * d * sign, py = my + uy * d * sign;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + nx * h, py + ny * h); ctx.stroke();
        if (big) ctx.fillText(String(d / 100), px + nx * 20, py + ny * 20 + 3);
      }
    }
    ctx.restore();
  }

  // trous de traçage de cercles concentriques
  function drawHoles(ctx, g) {
    ctx.save();
    ctx.font = "10px system-ui"; ctx.textAlign = "center";
    // centre
    ctx.strokeStyle = HI; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(g.center.x, g.center.y, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(g.center.x - 9, g.center.y); ctx.lineTo(g.center.x + 9, g.center.y);
    ctx.moveTo(g.center.x, g.center.y - 9); ctx.lineTo(g.center.x, g.center.y + 9);
    ctx.stroke();
    // trous numérotés
    for (const h of g.holes) {
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.strokeStyle = EDGE; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(h.r, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = GRAD; ctx.fillText(h.l, h.r, -12);
    }
    ctx.restore();
  }

  // graduation angulaire 0..180 du rapporteur
  function drawProtractorMarks(ctx, pr) {
    ctx.save();
    ctx.translate(pr.x, pr.y);
    ctx.strokeStyle = GRAD; ctx.fillStyle = GRAD; ctx.lineWidth = 1;
    ctx.font = "9px system-ui"; ctx.textAlign = "center";
    for (let deg = 0; deg <= 180; deg += 5) {
      const a = Math.PI - (deg * Math.PI) / 180; // 0° à droite, 180° à gauche
      const rOut = pr.r;
      const big = deg % 10 === 0;
      const rIn = rOut - (big ? 14 : 8);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rIn, -Math.sin(a) * rIn);
      ctx.lineTo(Math.cos(a) * rOut, -Math.sin(a) * rOut);
      ctx.stroke();
      if (deg % 30 === 0) {
        const rt = rOut - 26;
        ctx.fillText(String(deg), Math.cos(a) * rt, -Math.sin(a) * rt + 3);
      }
    }
    ctx.restore();
  }

  function drawAngleReadout(ctx) {
    const g = geom(inst.type);
    const base = g.rule || { a: { x: -1, y: 0 }, b: { x: 1, y: 0 } };
    const A = toWorld(inst, base.a), B = toWorld(inst, base.b);
    const baseAng = Math.atan2(B.y - A.y, B.x - A.x);
    const segAng = Math.atan2(seg.b.y - seg.a.y, seg.b.x - seg.a.x);
    let deg = ((segAng - baseAng) * 180) / Math.PI;
    deg = ((deg % 360) + 360) % 360;
    if (deg > 180) deg = 360 - deg;
    ctx.save();
    ctx.fillStyle = "#0f172a"; ctx.strokeStyle = "#fff";
    ctx.font = "bold 14px system-ui";
    const tx = seg.b.x + 12, ty = seg.b.y - 12;
    const label = deg.toFixed(0) + "°";
    ctx.lineWidth = 3; ctx.strokeText(label, tx, ty);
    ctx.fillText(label, tx, ty);
    ctx.restore();
  }

  function drawCompass(ctx) {
    const r = dist(compass.center, compass.edge);
    ctx.save();
    ctx.strokeStyle = App.state.color; ctx.lineWidth = App.state.width;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.arc(compass.center.x, compass.center.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(compass.center.x, compass.center.y);
    ctx.lineTo(compass.edge.x, compass.edge.y);
    ctx.stroke();
    // croix du centre
    ctx.beginPath();
    ctx.moveTo(compass.center.x - 6, compass.center.y); ctx.lineTo(compass.center.x + 6, compass.center.y);
    ctx.moveTo(compass.center.x, compass.center.y - 6); ctx.lineTo(compass.center.x, compass.center.y + 6);
    ctx.stroke();
    ctx.fillStyle = "#0f172a"; ctx.font = "bold 13px system-ui";
    ctx.fillText("r = " + Math.round(r) + " px", compass.center.x + 8, compass.center.y - 8);
    ctx.restore();
  }

  return { setActive, pointerDown, pointerMove, pointerUp, render };
})();
