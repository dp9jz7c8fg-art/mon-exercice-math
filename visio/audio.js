// audio.js — audio temps réel en WebRTC (peer-to-peer).
// Nommé "Audio2" car window.Audio est déjà pris par le navigateur.
// Règle anti-collision (glare) : c'est le pair au plus petit socket.id qui émet l'offre.
window.Audio2 = (function () {
  const ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  let localStream = null;
  let micOn = false;
  let muted = false;
  const peers = new Map();       // id -> { pc, ready }
  let statusEl, remoteWrap, micBtn, muteBtn;

  function init() {
    statusEl = document.getElementById("audio-status");
    remoteWrap = document.getElementById("remote-audios");
    micBtn = document.getElementById("mic-toggle");
    muteBtn = document.getElementById("mute-toggle");

    micBtn.addEventListener("click", toggleMic);
    muteBtn.addEventListener("click", toggleMute);
  }

  function myId() { return window.Collab.id(); }

  function peer(id) {
    if (!peers.has(id)) peers.set(id, { pc: null, ready: false });
    return peers.get(id);
  }

  async function toggleMic() {
    if (!micOn) {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (e) {
        setStatus("Micro refusé ou indisponible.", true);
        return;
      }
      micOn = true;
      micBtn.textContent = "Quitter l'audio";
      micBtn.classList.add("live");
      muteBtn.disabled = false;
      // annonce à tous les pairs connus
      let announced = 0;
      for (const id of peers.keys()) { window.Collab.sendSignal(id, { type: "audio-ready" }); announced++; }
      setStatus(announced
        ? "Micro actif — connexion en cours…"
        : "Micro actif ✅ En attente que l'autre participant clique sur « Rejoindre l'audio ».");
    } else {
      leaveAudio();
    }
  }

  function toggleMute() {
    if (!localStream) return;
    muted = !muted;
    localStream.getAudioTracks().forEach((t) => (t.enabled = !muted));
    muteBtn.textContent = muted ? "Réactiver le micro" : "Couper le micro";
    setStatus(muted ? "Micro coupé." : "Micro actif.");
  }

  function leaveAudio() {
    micOn = false; muted = false;
    micBtn.textContent = "Rejoindre l'audio";
    micBtn.classList.remove("live");
    muteBtn.disabled = true; muteBtn.textContent = "Couper le micro";
    localStream?.getTracks().forEach((t) => t.stop());
    localStream = null;
    for (const [id, p] of peers) { p.pc?.close(); p.pc = null; }
    remoteWrap.innerHTML = "";
    setStatus("Micro non connecté");
  }

  function createPC(id) {
    const p = peer(id);
    if (p.pc) return p.pc;
    const pc = new RTCPeerConnection(ICE);
    if (localStream) localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    pc.onicecandidate = (e) => {
      if (e.candidate) window.Collab.sendSignal(id, { type: "ice", candidate: e.candidate });
    };
    pc.ontrack = (e) => attachRemote(id, e.streams[0]);
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("En communication ✅");
    };
    p.pc = pc;
    return pc;
  }

  async function makeOffer(id) {
    const pc = createPC(id);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    window.Collab.sendSignal(id, { type: "offer", sdp: pc.localDescription });
  }

  // ---- événements reçus via collab ----
  function onPeerJoined(p) {
    peer(p.id);
    if (micOn) { window.Collab.sendSignal(p.id, { type: "audio-ready" }); setStatus("Micro actif — connexion en cours…"); }
  }
  function onPeerLeft(p) {
    const x = peers.get(p.id);
    x?.pc?.close();
    peers.delete(p.id);
    document.getElementById("aud-" + p.id)?.remove();
  }

  async function onSignal({ from, data }) {
    const p = peer(from);
    if (data.type === "audio-ready") {
      p.ready = true;
      if (micOn && myId() < from) makeOffer(from); // plus petit id => initiateur
    } else if (data.type === "offer") {
      const pc = createPC(from);
      await pc.setRemoteDescription(data.sdp);
      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);
      window.Collab.sendSignal(from, { type: "answer", sdp: pc.localDescription });
    } else if (data.type === "answer") {
      await p.pc?.setRemoteDescription(data.sdp);
    } else if (data.type === "ice") {
      try { await p.pc?.addIceCandidate(data.candidate); } catch {}
    }
  }

  function attachRemote(id, stream) {
    let el = document.getElementById("aud-" + id);
    if (!el) {
      el = document.createElement("audio");
      el.id = "aud-" + id;
      el.autoplay = true;
      remoteWrap.appendChild(el);
    }
    el.srcObject = stream;
  }

  function setStatus(txt, err) {
    statusEl.textContent = txt;
    statusEl.style.color = err ? "#ef4444" : "";
  }

  // liste des pairs déjà présents (fournie par le serveur à la connexion)
  function setInitialPeers(ids) { (ids || []).forEach((id) => peer(id)); }

  return { init, onPeerJoined, onPeerLeft, onSignal, setInitialPeers };
})();
