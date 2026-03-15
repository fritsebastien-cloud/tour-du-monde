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
const PASSWORD = "tourdumond2025";

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(firebaseApp);

// ── Colors (hardcoded, no CSS variable reading) ────────────────────────────────
const COLORS = {
  light: {
    ocean: "#c8dff0", land: "#d8d8d2", landHover: "#b0b0a8",
    wip: "#f5a623", wipHover: "#d4891a", done: "#4caf7d", doneHover: "#3a9068",
    stroke: "#ffffff", graticule: "rgba(0,0,0,0.05)", sphere: "rgba(0,0,0,0.08)"
  },
  dark: {
    ocean: "#0e1e35", land: "#2a2e28", landHover: "#3e4238",
    wip: "#7a4e0a", wipHover: "#9a6510", done: "#1a4d2c", doneHover: "#245e38",
    stroke: "#0f1117", graticule: "rgba(255,255,255,0.04)", sphere: "rgba(255,255,255,0.06)"
  }
};

let isDark = localStorage.getItem("tdc_theme") === "dark";
const c = () => isDark ? COLORS.dark : COLORS.light;

let allData = {};
let selectedId = null;
let selectedName = null;
let currentStatus = "todo";
let currentLinks = [];
let d3lib = null;
const featureGeoms = {};

const statusLabel = { todo: "À faire", wip: "En cours", done: "Publié" };
const statusDot   = { todo: "#c0c0b8", wip: "#f5a623", done: "#4caf7d" };

const NAME_MAP = {
  "004":"Afghanistan","008":"Albanie","012":"Algérie","020":"Andorre","024":"Angola",
  "028":"Antigua-et-Barbuda","032":"Argentine","036":"Australie","040":"Autriche",
  "031":"Azerbaïdjan","044":"Bahamas","048":"Bahreïn","050":"Bangladesh",
  "052":"Barbade","112":"Biélorussie","056":"Belgique","084":"Belize","204":"Bénin",
  "064":"Bhoutan","068":"Bolivie","070":"Bosnie-Herzégovine","072":"Botswana",
  "076":"Brésil","096":"Brunei","100":"Bulgarie","854":"Burkina Faso","108":"Burundi",
  "116":"Cambodge","120":"Cameroun","124":"Canada","132":"Cap-Vert",
  "140":"Rép. centrafricaine","144":"Sri Lanka","148":"Tchad","152":"Chili",
  "156":"Chine","170":"Colombie","174":"Comores","178":"Congo","180":"Congo (RDC)",
  "188":"Costa Rica","384":"Côte d'Ivoire","191":"Croatie","192":"Cuba",
  "196":"Chypre","203":"Tchéquie","208":"Danemark","262":"Djibouti",
  "214":"Rép. dominicaine","218":"Équateur","818":"Égypte","222":"Salvador",
  "226":"Guinée équatoriale","232":"Érythrée","233":"Estonie","748":"Eswatini",
  "231":"Éthiopie","246":"Finlande","250":"France","266":"Gabon","270":"Gambie",
  "268":"Géorgie","276":"Allemagne","288":"Ghana","300":"Grèce","304":"Groenland",
  "320":"Guatemala","324":"Guinée","624":"Guinée-Bissau","328":"Guyana",
  "332":"Haïti","340":"Honduras","348":"Hongrie","352":"Islande","356":"Inde",
  "360":"Indonésie","364":"Iran","368":"Irak","372":"Irlande","376":"Israël",
  "380":"Italie","388":"Jamaïque","392":"Japon","400":"Jordanie","398":"Kazakhstan",
  "404":"Kenya","296":"Kiribati","408":"Corée du Nord","410":"Corée du Sud",
  "414":"Koweït","417":"Kirghizistan","418":"Laos","422":"Liban","426":"Lesotho",
  "430":"Liberia","434":"Libye","440":"Lituanie","442":"Luxembourg",
  "450":"Madagascar","454":"Malawi","458":"Malaisie","462":"Maldives","466":"Mali",
  "470":"Malte","478":"Mauritanie","480":"Maurice","484":"Mexique","496":"Mongolie",
  "499":"Monténégro","504":"Maroc","508":"Mozambique","104":"Myanmar",
  "516":"Namibie","524":"Népal","528":"Pays-Bas","554":"Nouvelle-Zélande",
  "558":"Nicaragua","562":"Niger","566":"Nigéria","578":"Norvège","512":"Oman",
  "586":"Pakistan","591":"Panama","598":"Papouasie-Nvl-Guinée","600":"Paraguay",
  "604":"Pérou","608":"Philippines","616":"Pologne","620":"Portugal",
  "634":"Qatar","642":"Roumanie","643":"Russie","646":"Rwanda",
  "682":"Arabie saoudite","686":"Sénégal","688":"Serbie","694":"Sierra Leone",
  "703":"Slovaquie","705":"Slovénie","706":"Somalie","710":"Afrique du Sud",
  "716":"Zimbabwe","724":"Espagne","728":"Soudan du Sud","729":"Soudan",
  "740":"Suriname","752":"Suède","756":"Suisse","760":"Syrie","762":"Tadjikistan",
  "764":"Thaïlande","768":"Togo","780":"Trinité-et-Tobago","788":"Tunisie",
  "792":"Turquie","795":"Turkménistan","800":"Ouganda","804":"Ukraine",
  "784":"Émirats arabes unis","826":"Royaume-Uni","840":"États-Unis",
  "858":"Uruguay","860":"Ouzbékistan","862":"Venezuela","704":"Viêt Nam",
  "887":"Yémen","894":"Zambie","051":"Arménie","498":"Moldavie",
  "807":"Macédoine du Nord","702":"Singapour","090":"Îles Salomon",
  "548":"Vanuatu","242":"Fidji","776":"Tonga","882":"Samoa",
  "158":"Taïwan","630":"Porto Rico","275":"Palestine","238":"Îles Malouines"
};

// ── Login ─────────────────────────────────────────────────────────────────────
const loginScreen = document.getElementById("login-screen");
const appEl = document.getElementById("app");

function applyTheme() {
  document.body.classList.toggle("dark", isDark);
  document.getElementById("icon-sun").classList.toggle("hidden", isDark);
  document.getElementById("icon-moon").classList.toggle("hidden", !isDark);
  if (d3lib) redrawMapColors();
}
applyTheme();

document.getElementById("theme-btn").addEventListener("click", () => {
  isDark = !isDark;
  localStorage.setItem("tdc_theme", isDark ? "dark" : "light");
  applyTheme();
});

function tryLogin() {
  if (document.getElementById("pwd-input").value === PASSWORD) {
    sessionStorage.setItem("tdc_auth", "1");
    loginScreen.style.display = "none";
    appEl.classList.remove("hidden");
    initApp();
  } else {
    document.getElementById("login-error").classList.add("show");
    document.getElementById("pwd-input").value = "";
    document.getElementById("pwd-input").focus();
  }
}
document.getElementById("login-btn").addEventListener("click", tryLogin);
document.getElementById("pwd-input").addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });

if (sessionStorage.getItem("tdc_auth") === "1") {
  loginScreen.style.display = "none";
  appEl.classList.remove("hidden");
  initApp();
}
document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("tdc_auth"); location.reload();
});

// ── Firebase ──────────────────────────────────────────────────────────────────
function saveCountry(id, entry) { set(ref(db, "countries/" + id), entry); }
function listenToData() {
  onValue(ref(db, "countries"), snapshot => {
    allData = snapshot.val() || {};
    applyColors(); updateStats(); renderDrawer();
  });
}

// ── Map ───────────────────────────────────────────────────────────────────────
let svgEl, zoomBehavior;

function getFill(id, hover) {
  const s = allData[id]?.status;
  if (!s || s === "todo") return hover ? c().landHover : c().land;
  if (s === "wip") return hover ? c().wipHover : c().wip;
  if (s === "done") return hover ? c().doneHover : c().done;
  return c().land;
}

async function loadMap() {
  const [d3, topo, world] = await Promise.all([
    import("https://cdn.jsdelivr.net/npm/d3@7/+esm"),
    import("https://cdn.jsdelivr.net/npm/topojson-client@3/+esm"),
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r => r.json())
  ]);
  d3lib = d3;

  const wrapper = document.getElementById("map-wrapper");
  const W = wrapper.clientWidth || 1200;
  const H = wrapper.clientHeight || 620;

  svgEl = d3.select("#map-svg").attr("viewBox", `0 0 ${W} ${H}`);

  // Ocean
  svgEl.append("rect").attr("id","ocean-bg")
    .attr("width", W).attr("height", H)
    .attr("fill", c().ocean);

  const proj = d3.geoNaturalEarth1()
    .scale(W / 6.2)
    .translate([W / 2, H / 2]);
  const path = d3.geoPath().projection(proj);

  const g = svgEl.append("g").attr("id","map-g");

  // Graticule
  g.append("path").datum(d3.geoGraticule()())
    .attr("id","grat").attr("d", path)
    .attr("fill","none").attr("stroke", c().graticule).attr("stroke-width", 0.4);

  g.append("path").datum({type:"Sphere"})
    .attr("id","sphere").attr("d", path)
    .attr("fill","none").attr("stroke", c().sphere).attr("stroke-width", 1);

  const cg = g.append("g").attr("id","cg");

  topo.feature(world, world.objects.countries).features.forEach(f => {
    const id = String(f.id).padStart(3,"0");
    const name = NAME_MAP[id];
    if (!name) return;
    const d = path(f.geometry);
    if (!d) return;
    featureGeoms[id] = f.geometry;
    cg.append("path")
      .attr("d", d)
      .attr("data-id", id)
      .attr("fill", getFill(id, false))
      .attr("stroke", c().stroke)
      .attr("stroke-width", 0.4)
      .style("cursor","pointer")
      .on("mouseenter", function(ev) {
        showTooltip(ev, id, name);
        if (id !== selectedId) d3.select(this).attr("fill", getFill(id, true));
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", function() {
        hideTooltip();
        if (id !== selectedId) d3.select(this).attr("fill", getFill(id, false));
      })
      .on("click", () => openPanel(id, name, path));
  });

  // Zoom
  zoomBehavior = d3.zoom().scaleExtent([0.85, 16])
    .on("zoom", ev => g.attr("transform", ev.transform));
  svgEl.call(zoomBehavior).on("dblclick.zoom", null);

  document.getElementById("zoom-in").addEventListener("click", () =>
    svgEl.transition().duration(250).call(zoomBehavior.scaleBy, 1.6));
  document.getElementById("zoom-out").addEventListener("click", () =>
    svgEl.transition().duration(250).call(zoomBehavior.scaleBy, 0.625));
  document.getElementById("zoom-reset").addEventListener("click", () =>
    svgEl.transition().duration(400).call(zoomBehavior.transform, d3.zoomIdentity));

  document.getElementById("map-loading").style.display = "none";
  applyColors();
  startShimmer();
}

function applyColors() {
  document.querySelectorAll("[data-id]").forEach(el => {
    const id = el.getAttribute("data-id");
    el.setAttribute("fill", getFill(id, false));
    el.setAttribute("stroke", id === selectedId ? "#f5a623" : c().stroke);
    el.setAttribute("stroke-width", id === selectedId ? "1.5" : "0.4");
  });
}

function redrawMapColors() {
  document.getElementById("ocean-bg")?.setAttribute("fill", c().ocean);
  document.getElementById("grat")?.setAttribute("stroke", c().graticule);
  document.getElementById("sphere")?.setAttribute("stroke", c().sphere);
  document.getElementById("map-loading").style.background = isDark ? "#0e1e35" : "#c8dff0";
  applyColors();
}

function updateStats() {
  const v = Object.values(allData);
  document.getElementById("cnt-todo").textContent = v.filter(x => x.status === "todo").length;
  document.getElementById("cnt-wip").textContent  = v.filter(x => x.status === "wip").length;
  document.getElementById("cnt-done").textContent = v.filter(x => x.status === "done").length;
}

// ── Shimmer ───────────────────────────────────────────────────────────────────
function startShimmer() {
  setInterval(() => {
    const el = document.createElement("div");
    el.className = "shimmer-el";
    document.getElementById("map-wrapper").appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }, 20000);
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
const tt = document.getElementById("tooltip");
const mapWrap = document.getElementById("map-wrapper");

function showTooltip(ev, id, name) {
  const e = allData[id];
  document.getElementById("tt-name").textContent = name;
  const parts = [];
  if (e?.status) parts.push(statusLabel[e.status]);
  if (e?.artist) parts.push(e.artist);
  if (e?.category) parts.push(e.category);
  document.getElementById("tt-meta").textContent = parts.join(" · ") || "Cliquer pour annoter";
  tt.style.opacity = "1";
  moveTooltip(ev);
}
function moveTooltip(ev) {
  const r = mapWrap.getBoundingClientRect();
  let x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14;
  if (x + 210 > r.width)  x = ev.clientX - r.left - 220;
  if (y + 60  > r.height) y = ev.clientY - r.top  - 55;
  tt.style.left = x + "px"; tt.style.top = y + "px";
}
function hideTooltip() { tt.style.opacity = "0"; }

// ── Country silhouette ────────────────────────────────────────────────────────
function renderSilhouette(id) {
  const el = document.getElementById("panel-shape");
  el.innerHTML = "";
  if (!d3lib || !featureGeoms[id]) return;
  try {
    const size = 56;
    const feat = { type: "Feature", geometry: featureGeoms[id] };
    const p = d3lib.geoMercator().fitSize([size, size], feat);
    const pf = d3lib.geoPath().projection(p);
    const d = pf(feat);
    if (!d) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    const s = allData[id]?.status;
    path.setAttribute("fill", s === "wip" ? "#f5a623" : s === "done" ? "#4caf7d" : (isDark ? "#3e4238" : "#c0c0b8"));
    path.setAttribute("opacity", "0.75");
    el.appendChild(path);
  } catch(e) {}
}

// ── Panel ─────────────────────────────────────────────────────────────────────
const panel = document.getElementById("panel");
const overlay = document.getElementById("overlay");

function openPanel(id, name) {
  selectedId = id; selectedName = name;
  const entry = allData[id] || {};
  document.getElementById("panel-name").textContent = name;
  document.getElementById("panel-status-label").textContent = statusLabel[entry.status || "todo"];
  document.getElementById("panel-artist").value = entry.artist || "";
  document.getElementById("panel-note").value = entry.note || "";
  document.getElementById("panel-category").value = entry.category || "";
  currentStatus = entry.status || "todo";
  currentLinks = Array.isArray(entry.links) ? [...entry.links] : [];
  document.querySelectorAll(".sbtn").forEach(b => b.classList.toggle("active", b.dataset.s === currentStatus));
  renderLinks();
  renderSilhouette(id);
  document.getElementById("last-edit").textContent = entry.editedAt
    ? "Modifié le " + new Date(entry.editedAt).toLocaleDateString("fr-FR", { day:"numeric", month:"long", hour:"2-digit", minute:"2-digit" }) : "";
  panel.classList.remove("hidden");
  overlay.classList.remove("hidden");
  applyColors();
}

function closePanel() {
  panel.classList.add("hidden"); overlay.classList.add("hidden");
  selectedId = null; applyColors();
}

document.getElementById("panel-close").addEventListener("click", closePanel);
overlay.addEventListener("click", closePanel);

document.querySelectorAll(".sbtn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentStatus = btn.dataset.s;
    document.querySelectorAll(".sbtn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-status-label").textContent = statusLabel[currentStatus];
    renderSilhouette(selectedId);
  });
});

document.getElementById("panel-save").addEventListener("click", () => {
  if (!selectedId) return;
  const entry = {
    status: currentStatus,
    artist: document.getElementById("panel-artist").value.trim(),
    note: document.getElementById("panel-note").value.trim(),
    category: document.getElementById("panel-category").value.trim(),
    links: currentLinks,
    editedAt: Date.now(),
    name: selectedName
  };
  allData[selectedId] = { ...(allData[selectedId] || {}), ...entry };
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
      <a href="${url}" target="_blank" rel="noopener">${url.replace(/^https?:\/\//,"").substring(0,46)}</a>
      <button class="link-del" data-i="${i}">×</button>
    </div>`).join("");
  list.querySelectorAll(".link-del").forEach(b =>
    b.addEventListener("click", () => { currentLinks.splice(Number(b.dataset.i),1); renderLinks(); }));
}
document.getElementById("add-link-btn").addEventListener("click", () => {
  const inp = document.getElementById("link-input");
  const url = inp.value.trim();
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    currentLinks.push(url); renderLinks(); inp.value = "";
  }
});

// ── Drawer ────────────────────────────────────────────────────────────────────
const drawer = document.getElementById("list-drawer");
document.getElementById("list-toggle-btn").addEventListener("click", () => {
  drawer.classList.toggle("hidden");
  if (!drawer.classList.contains("hidden")) renderDrawer();
});
document.getElementById("drawer-close").addEventListener("click", () => drawer.classList.add("hidden"));

function renderDrawer() {
  const body = document.getElementById("drawer-body");
  const entries = Object.entries(allData).filter(([,v]) => v?.name);
  if (!entries.length) {
    body.innerHTML = '<p style="padding:1rem 1.4rem;font-size:12px;color:#bbb">Aucun pays annoté.</p>';
    return;
  }
  const ord = { done:0, wip:1, todo:2 };
  entries.sort((a,b) => (ord[a[1].status||"todo"]) - (ord[b[1].status||"todo"]));
  body.innerHTML = entries.map(([id,v]) => `
    <div class="ditem" data-id="${id}" data-name="${(v.name||id).replace(/"/g,"&quot;")}">
      <div class="d-dot" style="background:${statusDot[v.status||"todo"]}"></div>
      <div>
        <div class="d-name">${v.name||id}</div>
        ${v.artist ? `<div class="d-artist">${v.artist}</div>` : ""}
        ${v.category ? `<div class="d-cat">${v.category}</div>` : ""}
      </div>
    </div>`).join("");
  body.querySelectorAll(".ditem").forEach(el =>
    el.addEventListener("click", () => { drawer.classList.add("hidden"); openPanel(el.dataset.id, el.dataset.name); }));
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initApp() { listenToData(); loadMap(); }
