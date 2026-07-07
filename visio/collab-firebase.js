// collab-firebase.js — synchro temps réel via Firebase Realtime Database.
// Même interface que l'ancien module Socket.IO, mais 100 % statique (aucun serveur).
// Structure RTDB :
//   boards/{room}/strokes   : traits (push) — état partagé du tableau
//   boards/{room}/chat      : messages
//   boards/{room}/presence  : {sid: {name, role, t}}   (retiré à la déconnexion)
//   boards/{room}/cursors   : {sid: {x, y, name, role}} (retiré à la déconnexion)
//   boards/{room}/signals/{sid} : boîte de réception WebRTC (offres/réponses/ICE)
window.Collab = (function () {
  let db, base, sid, me;
  let cursors = new Map();
  let seen = new Set();          // ids de traits déjà affichés (anti-doublon)
  let idToKey = new Map();       // id du trait -> clé RTDB (pour l'annulation)
  let peersMap = new Map();      // sid -> {name, role} (pour l'audio)
  let lastCursorSent = 0;
  let handlers = {};

  function init(cfg) {
    handlers = cfg;
    me = cfg.me;
    sid = me.uid + "-" + Math.random().toString(36).slice(2, 8);
    db = firebase.database();
    base = db.ref("boards/" + cfg.room);

    // --- Présence (+ découverte des pairs pour l'audio) ---
    const pref = base.child("presence/" + sid);
    pref.set({ name: me.name, role: me.role, t: Date.now() });
    pref.onDisconnect().remove();
    base.child("presence").on("value", (snap) => {
      const list = [];
      const now = new Map();
      snap.forEach((c) => {
        const v = c.val();
        list.push(v);
        if (c.key !== sid) now.set(c.key, v);
      });
      // diff pour l'audio
      for (const [k, v] of now) if (!peersMap.has(k)) window.Audio2?.onPeerJoined({ id: k, ...v });
      for (const k of peersMap.keys()) if (!now.has(k)) window.Audio2?.onPeerLeft({ id: k });
      peersMap = now;
      handlers.onPresence?.(list);
    });

    // --- Traits ---
    base.child("strokes").on("child_added", (s) => {
      const v = s.val();
      if (!v || !v.id) return;
      idToKey.set(v.id, s.key);
      if (seen.has(v.id)) return;
      seen.add(v.id);
      Board.addRemoteStroke(v);
    });
    base.child("strokes").on("child_removed", (s) => {
      const v = s.val();
      if (v && v.id) { Board.removeById(v.id); seen.delete(v.id); idToKey.delete(v.id); }
    });

    // --- Chat (50 derniers) ---
    base.child("chat").limitToLast(50).on("child_added", (s) => {
      const m = s.val();
      if (m) handlers.onChat?.(m);
    });

    // --- Curseurs ---
    base.child("cursors").on("value", (snap) => {
      cursors.clear();
      snap.forEach((c) => { if (c.key !== sid) cursors.set(c.key, c.val()); });
    });
    base.child("cursors/" + sid).onDisconnect().remove();

    // --- Signaux WebRTC (ma boîte de réception) ---
    base.child("signals/" + sid).on("child_added", (s) => {
      const v = s.val();
      s.ref.remove();
      if (v) window.Audio2?.onSignal({ from: v.from, name: v.name, data: v.data });
    });

    // état connexion
    db.ref(".info/connected").on("value", (s) => handlers.onConn?.(!!s.val()));
  }

  // --- Émissions ---
  function sendStroke(s) {
    seen.add(s.id);
    const ref = base.child("strokes").push();
    idToKey.set(s.id, ref.key);
    ref.set(s);
  }
  function sendClear() { base.child("strokes").remove(); } // déclenche child_removed partout
  function sendUndo(id) {
    const k = idToKey.get(id);
    if (k) base.child("strokes/" + k).remove();
  }
  function sendChat(text) {
    base.child("chat").push({ name: me.name, role: me.role, text: String(text || "").slice(0, 2000), t: Date.now() });
  }
  function sendCursor(nPt) {
    if (!nPt) { base.child("cursors/" + sid).remove(); return; }
    const now = performance.now();
    if (now - lastCursorSent < 60) return; // ~16 fps, ménage la base
    lastCursorSent = now;
    base.child("cursors/" + sid).set({ x: nPt.x, y: nPt.y, name: me.name, role: me.role });
  }
  function sendSignal(to, data) {
    base.child("signals/" + to).push({ from: sid, name: me.name, data });
  }

  // --- Rendu des curseurs distants (appelé par la boucle du Board) ---
  function renderCursors(ctx, toScreen) {
    for (const [, c] of cursors) {
      const p = toScreen({ x: c.x, y: c.y });
      ctx.save();
      ctx.fillStyle = c.role === "prof" ? "#2ecc71" : "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y + 16);
      ctx.lineTo(p.x + 5, p.y + 11);
      ctx.lineTo(p.x + 11, p.y + 16);
      ctx.closePath();
      ctx.fill();
      ctx.font = "11px 'DM Sans', system-ui";
      ctx.fillText(c.name || "", p.x + 12, p.y + 14);
      ctx.restore();
    }
  }

  function id() { return sid; }

  return { init, sendStroke, sendClear, sendUndo, sendChat, sendCursor, sendSignal, renderCursors, id };
})();
