import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBkw6ox4lZx5G3Suo2HIWj6oq-mUaVii-E",
  authDomain: "map-concept-761a5.firebaseapp.com",
  databaseURL: "https://map-concept-761a5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "map-concept-761a5",
  storageBucket: "map-concept-761a5.firebasestorage.app",
  messagingSenderId: "1099257545089",
  appId: "1:1099257545089:web:02577e8c279d2f6393a880"
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);
const scoresRef = ref(db, "qrcode-scores");

// ── SCREENS ─────────────────────────────────────────────────────────────────
const screens = {
  welcome: document.getElementById("screen-welcome"),
  roll: document.getElementById("screen-roll"),
  leaderboard: document.getElementById("screen-leaderboard")
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
  if (name === "leaderboard") loadLeaderboard();
}

// ── LOAD STATS ON WELCOME ───────────────────────────────────────────────────
function loadWelcomeStats() {
  onValue(scoresRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    const entries = Object.values(data);
    animateCounter(document.getElementById("players-count"), entries.length);
    const best = Math.min(...entries.map(e => e.score));
    document.getElementById("best-score").textContent = best.toLocaleString("fr-FR");
  }, { onlyOnce: true });
}

function animateCounter(el, target, duration = 1200) {
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(ease * target);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

loadWelcomeStats();

// ── ROLL ────────────────────────────────────────────────────────────────────
let finalNumber = null;

function rollAnimation() {
  const rollEl = document.getElementById("roll-number");
  rollEl.classList.add("spinning");
  finalNumber = Math.floor(Math.random() * 10000) + 1;

  const duration = 2000;
  const start = Date.now();

  function tick() {
    const elapsed = Date.now() - start;
    if (elapsed < duration) {
      rollEl.textContent = Math.floor(Math.random() * 10000) + 1;
      const delay = 30 + (elapsed / duration) * 150;
      setTimeout(tick, delay);
    } else {
      rollEl.textContent = finalNumber.toLocaleString("fr-FR");
      rollEl.classList.remove("spinning");
      document.getElementById("name-form").classList.remove("hidden");
      document.getElementById("name-input").focus();
    }
  }
  tick();
}

// ── SAVE ────────────────────────────────────────────────────────────────────
function saveScore(name, score) {
  return push(scoresRef, { name, score, date: Date.now() });
}

// ── LEADERBOARD ─────────────────────────────────────────────────────────────
function loadLeaderboard() {
  const listEl = document.getElementById("leaderboard-list");
  listEl.innerHTML = '<p class="loading-text">Chargement...</p>';

  onValue(scoresRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      listEl.innerHTML = '<p class="lb-empty">Aucun joueur pour le moment. Sois le premier !</p>';
      document.getElementById("total-players").textContent = "";
      return;
    }

    const entries = Object.values(data);
    // Plus petit score en haut (le plus chanceux = plus petit nombre)
    entries.sort((a, b) => a.score - b.score);

    document.getElementById("total-players").textContent =
      entries.length + " joueur" + (entries.length > 1 ? "s" : "") + " au total";

    listEl.innerHTML = entries.map((entry, i) => {
      const rank = i + 1;
      const topClass = rank <= 3 ? " top-" + rank : "";
      const medal = rank === 1 ? "\uD83E\uDD47" : rank === 2 ? "\uD83E\uDD48" : rank === 3 ? "\uD83E\uDD49" : "";
      const dateStr = new Date(entry.date).toLocaleDateString("fr-FR", {
        day: "numeric", month: "short", year: "numeric"
      });
      const displayName = escapeHtml(entry.name);

      return '<div class="lb-row' + topClass + '">' +
        '<div class="lb-rank">' + (medal || rank) + '</div>' +
        '<div class="lb-info">' +
          '<div class="lb-name">' + displayName + '</div>' +
          '<div class="lb-date">' + dateStr + '</div>' +
        '</div>' +
        '<div class="lb-score">' + entry.score.toLocaleString("fr-FR") + '</div>' +
      '</div>';
    }).join("");
  }, { onlyOnce: true });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ── EVENT LISTENERS ─────────────────────────────────────────────────────────
document.getElementById("btn-play").addEventListener("click", () => {
  document.getElementById("roll-number").textContent = "\u2014";
  document.getElementById("name-form").classList.add("hidden");
  document.getElementById("save-msg").classList.add("hidden");
  document.getElementById("btn-to-leaderboard").classList.add("hidden");
  document.getElementById("name-input").value = "";
  document.getElementById("btn-save").disabled = false;
  document.getElementById("btn-save").innerHTML = 'Enregistrer mon score <span class="arrow">\u2192</span>';
  document.getElementById("save-msg").style.color = "";
  finalNumber = null;
  showScreen("roll");
  setTimeout(rollAnimation, 300);
});

document.getElementById("btn-save").addEventListener("click", () => {
  const nameInput = document.getElementById("name-input");
  const name = nameInput.value.trim();

  if (!name) {
    nameInput.style.borderColor = "var(--accent-3)";
    nameInput.setAttribute("placeholder", "Entre ton pr\u00e9nom !");
    setTimeout(() => {
      nameInput.style.borderColor = "";
      nameInput.setAttribute("placeholder", "Ton pr\u00e9nom");
    }, 2000);
    return;
  }
  if (!finalNumber) return;

  const btn = document.getElementById("btn-save");
  btn.disabled = true;
  btn.innerHTML = 'Enregistrement... <span class="arrow">\u23F3</span>';

  saveScore(name, finalNumber).then(() => {
    document.getElementById("name-form").classList.add("hidden");
    const msg = document.getElementById("save-msg");
    msg.textContent = "Bravo " + name + " ! Ton score de " + finalNumber.toLocaleString("fr-FR") + " est enregistr\u00e9.";
    msg.style.color = "var(--accent)";
    msg.classList.remove("hidden");
    document.getElementById("btn-to-leaderboard").classList.remove("hidden");
  }).catch(() => {
    btn.disabled = false;
    btn.innerHTML = 'Enregistrer mon score <span class="arrow">\u2192</span>';
    const msg = document.getElementById("save-msg");
    msg.textContent = "Erreur, r\u00e9essaie !";
    msg.style.color = "var(--accent-3)";
    msg.classList.remove("hidden");
  });
});

document.getElementById("name-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btn-save").click();
});

document.getElementById("btn-leaderboard").addEventListener("click", () => showScreen("leaderboard"));
document.getElementById("btn-to-leaderboard").addEventListener("click", () => showScreen("leaderboard"));
document.getElementById("btn-back").addEventListener("click", () => showScreen("welcome"));
document.getElementById("btn-back-home").addEventListener("click", () => showScreen("welcome"));
