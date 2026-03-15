// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// ⚠️  REMPLACE CES VALEURS par celles de ton projet Firebase (voir guide)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBkw6ox4lZx5G3Suo2HIWj6oq-mUaVii-E",
  authDomain:        "map-concept-761a5.firebaseapp.com",
  databaseURL:       "https://map-concept-761a5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "map-concept-761a5",
  storageBucket:     "map-concept-761a5.firebasestorage.app",
  messagingSenderId: "1099257545089",
  appId:             "1:1099257545089:web:02577e8c279d2f6393a880"
};

// ⚠️  CHOISIS TON MOT DE PASSE ICI
const PASSWORD = "map";

// ──────────────────────────────────────────────────────────────────────────────

const app = initializeApp(FIREBASE_CONFIG);
const db  = getDatabase(app);

// ── State ────────────────────────────────────────────────────────────────────
let allData = {};
let selectedId = null;
let selectedName = null;
let currentStatus = "todo";
let currentLinks = [];

const statusLabel = { todo: "À faire", wip: "En cours", done: "Publié" };
const statusColor = { todo: "#555550", wip: "#F5A623", done: "#4ADE80" };

const NAME_MAP = {
  "004":"Afghanistan","008":"Albanie","012":"Algérie","024":"Angola","032":"Argentine",
  "036":"Australie","040":"Autriche","050":"Bangladesh","056":"Belgique","068":"Bolivie",
  "076":"Brésil","100":"Bulgarie","116":"Cambodge","120":"Cameroun","124":"Canada",
  "152":"Chili","156":"Chine","170":"Colombie","180":"Congo (RDC)","188":"Costa Rica",
  "191":"Croatie","192":"Cuba","203":"Tchéquie","208":"Danemark","218":"Équateur",
  "818":"Égypte","231":"Éthiopie","246":"Finlande","250":"France","276":"Allemagne",
  "288":"Ghana","300":"Grèce","320":"Guatemala","332":"Haïti","340":"Honduras",
  "348":"Hongrie","356":"Inde","360":"Indonésie","364":"Iran","368":"Irak",
  "372":"Irlande","376":"Israël","380":"Italie","392":"Japon","400":"Jordanie",
  "404":"Kenya","408":"Corée du Nord","410":"Corée du Sud","414":"Koweït",
  "418":"Laos","422":"Liban","434":"Libye","484":"Mexique","504":"Maroc",
  "508":"Mozambique","524":"Népal","528":"Pays-Bas","554":"Nouvelle-Zélande",
  "566":"Nigeria","578":"Norvège","586":"Pakistan","591":"Panama",
  "598":"Papouasie-Nouvelle-Guinée","600":"Paraguay","604":"Pérou",
  "608":"Philippines","616":"Pologne","620":"Portugal","634":"Qatar",
  "642":"Roumanie","643":"Russie","682":"Arabie Saoudite","706":"Somalie",
  "710":"Afrique du Sud","724":"Espagne","752":"Suède","756":"Suisse",
  "760":"Syrie","158":"Taïwan","764":"Thaïlande","792":"Turquie","800":"Ouganda",
  "804":"Ukraine","784":"Émirats arabes unis","826":"Royaume-Uni","840":"États-Unis",
  "858":"Uruguay","862":"Venezuela","704":"Viêt Nam","887":"Yémen","894":"Zambie","716":"Zimbabwe",
  "012":"Algérie","430":"Libéria","426":"Lesotho","630":"Porto Rico"
};

// ── Login ─────────────────────────────────────────────────────────────────────
const loginScreen = document.getElementById("login-screen");
const appEl       = document.getElementById("app");
const pwdInput    = document.getElementById("pwd-input");
const loginBtn    = document.getElementById("login-btn");
const loginError  = document.getElementById("login-error");

function tryLogin() {
  if (pwdInput.value === PASSWORD) {
    sessionStorage.setItem("tdc_auth", "1");
    loginScreen.style.display = "none";
    appEl.classList.remove("hidden");
    initApp();
  } else {
    loginError.classList.add("show");
    pwdInput.value = "";
    pwdInput.focus();
  }
}
loginBtn.addEventListener("click", tryLogin);
pwdInput.addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });

if (sessionStorage.getItem("tdc_auth") === "1") {
  loginScreen.style.display = "none";
  appEl.classList.remove("hidden");
  initApp();
}

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("tdc_auth");
  location.reload();
});

// ── Firebase sync ─────────────────────────────────────────────────────────────
function saveCountry(id, entry) {
  set(ref(db, "countries/" + id), entry);
}

function listenToData() {
  onValue(ref(db, "countries"), snapshot => {
    allData = snapshot.val() || {};
    applyColors();
    updateStats();
    renderDrawer();
  });
}

// ── Map ───────────────────────────────────────────────────────────────────────
async function loadMap() {
  const loading = document.createElement("div");
  loading.id = "map-loading";
  loading.innerHTML = '<span class="loading-text">Chargement de la carte…</span>';
  document.getElementById("map-wrapper").appendChild(loading);

  const resp  = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
  const world = await resp.json();

  const topoLib = await import("https://cdn.jsdelivr.net/npm/topojson-client@3/+esm");
  const countries = topoLib.feature(world, world.objects.countries);

  const W = 1000, H = 500;
  function project(lon, lat) {
    const x = (lon + 180) * (W / 360);
    const y = H / 2 - H * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) / (2 * Math.PI);
    return [x, y];
  }
  function ringToD(ring) {
    return ring.map((pt, i) => {
      const [x, y] = project(pt[0], pt[1]);
      return (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ") + " Z";
  }
  function geomToD(g) {
    if (g.type === "Polygon") return g.coordinates.map(ringToD).join(" ");
    if (g.type === "MultiPolygon") return g.coordinates.map(p => p.map(ringToD).join(" ")).join(" ");
    return "";
  }

  const g = document.getElementById("countries-group");
  countries.features.forEach(f => {
    const id   = String(f.id).padStart(3, "0");
    const name = NAME_MAP[id] || "Pays " + id;
    const d    = geomToD(f.geometry);
    if (!d) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("data-id", id);
    path.setAttribute("data-name", name);
    path.classList.add("country");
    path.addEventListener("mouseenter", e => showTooltip(e, id, name));
    path.addEventListener("mousemove",  moveTooltip);
    path.addEventListener("mouseleave", hideTooltip);
    path.addEventListener("click",      () => openPanel(id, name));
    g.appendChild(path);
  });

  loading.remove();
  applyColors();
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
const tt      = document.getElementById("tooltip");
const mapWrap = document.getElementById("map-wrapper");

function showTooltip(e, id, name) {
  const entry = allData[id];
  document.getElementById("tt-name").textContent = name;
  document.getElementById("tt-status").textContent = entry ? statusLabel[entry.status || "todo"] : "";
  const noteEl = document.getElementById("tt-note");
  const preview = entry?.artist || entry?.note;
  if (preview) { noteEl.textContent = preview.substring(0, 80) + (preview.length > 80 ? "…" : ""); noteEl.style.display = "block"; }
  else noteEl.style.display = "none";
  tt.style.opacity = "1";
  moveTooltip(e);
}
function moveTooltip(e) {
  const r = mapWrap.getBoundingClientRect();
  let x = e.clientX - r.left + 14;
  let y = e.clientY - r.top  + 14;
  if (x + 230 > r.width)  x = e.clientX - r.left - 234;
  if (y + 100 > r.height) y = e.clientY - r.top  - 90;
  tt.style.left = x + "px"; tt.style.top = y + "px";
}
function hideTooltip() { tt.style.opacity = "0"; }

// ── Colors & Stats ────────────────────────────────────────────────────────────
function applyColors() {
  document.querySelectorAll(".country").forEach(el => {
    const id = el.getAttribute("data-id");
    el.className = "country" + (allData[id] ? " status-" + (allData[id].status || "todo") : "");
    if (id === selectedId) el.classList.add("status-selected");
  });
}
function updateStats() {
  const v = Object.values(allData);
  document.getElementById("cnt-todo").textContent = v.filter(x => x.status === "todo").length;
  document.getElementById("cnt-wip").textContent  = v.filter(x => x.status === "wip").length;
  document.getElementById("cnt-done").textContent = v.filter(x => x.status === "done").length;
}

// ── Panel ─────────────────────────────────────────────────────────────────────
const panel   = document.getElementById("panel");
const overlay = document.getElementById("overlay");

function openPanel(id, name) {
  selectedId   = id;
  selectedName = name;
  const entry  = allData[id] || {};

  document.getElementById("panel-name").textContent   = name;
  document.getElementById("panel-artist").value       = entry.artist || "";
  document.getElementById("panel-note").value         = entry.note   || "";
  currentStatus = entry.status || "todo";
  currentLinks  = entry.links  || [];

  document.querySelectorAll(".status-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.s === currentStatus);
  });

  renderLinks();

  const le = document.getElementById("last-edit");
  le.textContent = entry.editedAt ? "Modifié " + new Date(entry.editedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";

  panel.classList.remove("hidden");
  overlay.classList.remove("hidden");
  applyColors();
}

function closePanel() {
  panel.classList.add("hidden");
  overlay.classList.add("hidden");
  selectedId = null;
  applyColors();
}

document.getElementById("panel-close").addEventListener("click", closePanel);
overlay.addEventListener("click", closePanel);

document.querySelectorAll(".status-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentStatus = btn.dataset.s;
    document.querySelectorAll(".status-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

document.getElementById("panel-save").addEventListener("click", () => {
  if (!selectedId) return;
  const entry = {
    status:   currentStatus,
    artist:   document.getElementById("panel-artist").value.trim(),
    note:     document.getElementById("panel-note").value.trim(),
    links:    currentLinks,
    editedAt: Date.now()
  };
  allData[selectedId] = { ...allData[selectedId], ...entry, name: selectedName };
  saveCountry(selectedId, allData[selectedId]);
  applyColors(); updateStats(); renderDrawer();
  const btn = document.getElementById("panel-save");
  btn.textContent = "Enregistré ✓"; btn.classList.add("saved");
  setTimeout(() => { btn.textContent = "Enregistrer"; btn.classList.remove("saved"); }, 2000);
});

// ── Links ─────────────────────────────────────────────────────────────────────
function renderLinks() {
  const list = document.getElementById("links-list");
  list.innerHTML = currentLinks.map((url, i) => `
    <div class="link-item">
      <a href="${url}" target="_blank" rel="noopener">${url.replace(/^https?:\/\//, "").substring(0, 40)}…</a>
      <button class="link-del" data-i="${i}">×</button>
    </div>`).join("");
  list.querySelectorAll(".link-del").forEach(btn => {
    btn.addEventListener("click", () => {
      currentLinks.splice(Number(btn.dataset.i), 1);
      renderLinks();
    });
  });
}
document.getElementById("add-link-btn").addEventListener("click", () => {
  const input = document.getElementById("link-input");
  const url = input.value.trim();
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    currentLinks.push(url); renderLinks(); input.value = "";
  }
});

// ── Drawer (list) ─────────────────────────────────────────────────────────────
const drawer = document.getElementById("list-drawer");

document.getElementById("list-toggle-btn").addEventListener("click", () => {
  drawer.classList.toggle("hidden");
  renderDrawer();
});
document.getElementById("drawer-close").addEventListener("click", () => {
  drawer.classList.add("hidden");
});

function renderDrawer() {
  const body = document.getElementById("drawer-body");
  const entries = Object.entries(allData).filter(([,v]) => v.status !== undefined);
  if (!entries.length) {
    body.innerHTML = '<p style="padding:1rem 1.5rem;font-size:13px;color:var(--text2)">Aucun pays annoté pour l\'instant.</p>';
    return;
  }
  entries.sort((a, b) => {
    const ord = { done: 0, wip: 1, todo: 2 };
    return ord[a[1].status] - ord[b[1].status];
  });
  body.innerHTML = entries.map(([id, v]) => `
    <div class="drawer-item" data-id="${id}" data-name="${(v.name||id).replace(/"/g,'&quot;')}">
      <div class="di-dot" style="background:${statusColor[v.status||'todo']}"></div>
      <div>
        <div class="di-name">${v.name || id}</div>
        ${v.artist ? `<div class="di-artist">${v.artist}</div>` : ""}
        ${v.note   ? `<div class="di-note">${v.note.substring(0,60)}…</div>` : ""}
      </div>
    </div>`).join("");
  body.querySelectorAll(".drawer-item").forEach(el => {
    el.addEventListener("click", () => {
      drawer.classList.add("hidden");
      openPanel(el.dataset.id, el.dataset.name);
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initApp() {
  listenToData();
  loadMap();
}
