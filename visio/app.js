// app.js (visio) — assemble le tableau collaboratif Firebase :
// authentification, rôle prof/élève, salle = année, outils, chat, quadrillage.
window.App = { state: { tool: "crayon", color: "#111827", width: 3 } };

const PALETTE = ["#111827", "#ef4444", "#2563eb", "#16a34a", "#f59e0b", "#a21caf", "#ffffff"];
const TEACHER_PASSWORD = "stef2026"; // même mot de passe que l'espace enseignant du site
const ANNEE_LABEL = { "1": "1ère année", "2": "2ème année", "3": "3ème année", "4": "4ème année", "5": "5ème année", "6": "6ème année" };
let ME = { name: "?", role: "eleve" };

document.addEventListener("DOMContentLoaded", () => {
  buildColors();
  bindToolbar();
  bindChat();
  applyGrid("none");
  Board.init({ onCommit: (s) => Collab.sendStroke(s) });
  Audio2.init();

  document.getElementById("logout").addEventListener("click", () => (location.href = "eleve.html"));
  document.getElementById("prof-switch").addEventListener("click", () => (location.href = "?prof=1"));

  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) { location.href = "login.html"; return; }
    let profile = {};
    try {
      const doc = await firebase.firestore().collection("users").doc(user.uid).get();
      profile = doc.exists ? doc.data() : {};
    } catch (e) { console.error(e); }
    const name = profile.name || user.displayName || "Élève";
    const annee = profile.learningProfile && profile.learningProfile.annee ? String(profile.learningProfile.annee) : null;

    const wantProf = new URLSearchParams(location.search).get("prof") === "1";
    if (!wantProf && annee) startStudent(user.uid, name, annee);
    else startProfFlow(user.uid, name);
  });
});

// ---------- démarrage élève ----------
function startStudent(uid, name, annee) {
  ME = { name, role: "eleve" };
  Board.setMe(ME);
  join(uid, "annee-" + annee, ANNEE_LABEL[annee] || annee);
}

// ---------- démarrage prof ----------
function startProfFlow(uid, name) {
  const modal = document.getElementById("prof-modal");
  modal.hidden = false;
  const form = document.getElementById("prof-form");
  const err = document.getElementById("prof-err");
  form.onsubmit = (e) => {
    e.preventDefault();
    if (document.getElementById("prof-pass").value !== TEACHER_PASSWORD) {
      err.textContent = "Mot de passe incorrect.";
      err.hidden = false;
      return;
    }
    modal.hidden = true;
    chooseYear(uid, name || "Stef");
  };
}

function chooseYear(uid, name) {
  const modal = document.getElementById("year-picker");
  const list = document.getElementById("year-list");
  list.innerHTML = "";
  modal.hidden = false;
  for (const v of ["1", "2", "3", "4", "5", "6"]) {
    const b = document.createElement("button");
    b.textContent = ANNEE_LABEL[v];
    b.onclick = () => {
      modal.hidden = true;
      ME = { name: name, role: "prof" };
      Board.setMe(ME);
      join(uid, "annee-" + v, ANNEE_LABEL[v]);
    };
    list.appendChild(b);
  }
}

// ---------- connexion à la salle ----------
function join(uid, room, label) {
  document.getElementById("board-title").textContent = "Tableau — " + label + (ME.role === "prof" ? " (prof)" : "");
  document.getElementById("prof-switch").hidden = ME.role === "prof";
  Collab.init({
    room,
    me: { uid, name: ME.name, role: ME.role },
    onChat: (m) => addMessage(m),
    onPresence: (list) => {
      document.getElementById("presence").textContent =
        list.map((m) => (m.role === "prof" ? "👨‍🏫 " : "🧑 ") + m.name).join("   ·   ");
    },
    onConn: (ok) => {
      const b = document.getElementById("conn");
      b.textContent = ok ? "en ligne" : "hors ligne";
      b.className = "badge " + (ok ? "on" : "off");
    },
  });
}

// ---------- barre d'outils ----------
function bindToolbar() {
  const INSTR = ["regle", "equerre", "aristo", "rapporteur", "compas", "thamographe"];
  document.querySelectorAll(".tool").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tool").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      App.state.tool = btn.dataset.tool;
      Instruments.setActive(INSTR.includes(App.state.tool) ? App.state.tool : null);
      showInstrHint(App.state.tool);
      Board.pokeOverlay();
    });
  });
  document.getElementById("width").addEventListener("input", (e) => (App.state.width = +e.target.value));
  document.getElementById("grid").addEventListener("change", (e) => applyGrid(e.target.value));
  document.getElementById("clear").addEventListener("click", () => {
    if (confirm("Tout effacer le tableau ?")) Collab.sendClear();
  });
  document.getElementById("undo").addEventListener("click", () => {
    const id = Board.lastMineId();
    if (id) Collab.sendUndo(id);
  });
}

function showInstrHint(tool) {
  const el = document.getElementById("instr-hint");
  const hints = {
    regle: 'Trace le long du <span class="edge">bord orange</span> · <b>⟳</b> pivoter · <b>▦</b> déplacer',
    equerre: 'Trace le long d\'un <span class="edge">bord orange</span> · <b>⟳</b> pivoter · <b>▦</b> déplacer',
    aristo: 'Trace le long d\'un <span class="edge">bord orange</span> · angle affiché · <b>⟳</b> pivoter · <b>▦</b> déplacer',
    rapporteur: 'Trace depuis le <span class="edge">bord orange</span> pour lire l\'angle · <b>⟳</b> pivoter · <b>▦</b> déplacer',
    compas: 'Clique le <b>centre</b> puis étire jusqu\'au rayon voulu, relâche pour tracer le cercle',
    thamographe: 'Règle 0 au <b>centre</b> · trace le long du <span class="edge">bord orange</span> · clique un <b>trou n°</b> pour un cercle · <b>▦</b> déplacer · <b>⟳</b> pivoter',
  };
  if (hints[tool]) { el.innerHTML = hints[tool]; el.hidden = false; }
  else el.hidden = true;
}

function buildColors() {
  const wrap = document.getElementById("colors");
  PALETTE.forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "swatch" + (i === 0 ? " active" : "");
    b.style.background = c;
    if (c === "#ffffff") b.style.border = "2px solid #94a3b8";
    b.addEventListener("click", () => {
      document.querySelectorAll(".swatch").forEach((s) => s.classList.remove("active"));
      b.classList.add("active");
      App.state.color = c;
    });
    wrap.appendChild(b);
  });
}

function applyGrid(kind) {
  const el = document.getElementById("board");
  const line = "#c7d2e5";
  el.style.backgroundColor = "#ffffff";
  el.style.backgroundPosition = "0 0";
  if (kind === "none") el.style.backgroundImage = "none";
  else if (kind === "squares") {
    el.style.backgroundImage = `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`;
    el.style.backgroundSize = "40px 40px";
  } else if (kind === "small") {
    el.style.backgroundImage = `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`;
    el.style.backgroundSize = "20px 20px";
  } else if (kind === "dots") {
    el.style.backgroundImage = `radial-gradient(${line} 1.4px, transparent 1.4px)`;
    el.style.backgroundSize = "24px 24px";
  }
}

function bindChat() {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = input.value.trim();
    if (!t) return;
    Collab.sendChat(t);
    input.value = "";
  });
}

function addMessage(m) {
  const box = document.getElementById("messages");
  const div = document.createElement("div");
  const mine = m.name === ME.name;
  div.className = "msg" + (m.role === "prof" ? " prof" : "") + (mine ? " mine" : "");
  const who = document.createElement("span");
  who.className = "who";
  who.textContent = m.name + (m.role === "prof" ? " (prof)" : "");
  div.appendChild(who);
  div.appendChild(document.createTextNode(m.text));
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
