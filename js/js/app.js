import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ⚠️ TES CLÉS FIREBASE
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

let allData = {};
let selectedId = null;
let selectedName = null;
let currentStatus = "todo";
let currentLinks = [];

const statusLabel = { todo: "À faire", wip: "En cours", done: "Publié" };
const statusColor = { todo: "#4a4a44", wip: "#F5A623", done: "#4ADE80" };

const NAME_MAP = {
  "004":"Afghanistan","008":"Albanie","012":"Algérie","020":"Andorre","024":"Angola",
  "032":"Argentine","036":"Australie","040":"Autriche","031":"Azerbaïdjan",
  "050":"Bangladesh","056":"Belgique","084":"Belize","204":"Bénin","064":"Bhoutan",
  "068":"Bolivie","070":"Bosnie-Herzégovine","072":"Botswana","076":"Brésil",
  "096":"Brunei","100":"Bulgarie","854":"Burkina Faso","108":"Burundi",
  "116":"Cambodge","120":"Cameroun","124":"Canada","140":"Rép. centrafricaine",
  "144":"Sri Lanka","148":"Tchad","152":"Chili","156":"Chine","170":"Colombie",
  "174":"Comores","178":"Congo","180":"Congo (RDC)","188":"Costa Rica",
  "384":"Côte d'Ivoire","191":"Croatie","192":"Cuba","196":"Chypre",
  "203":"Tchéquie","208":"Danemark","262":"Djibouti","214":"Rép. dominicaine",
  "218":"Équateur","818":"Égypte","222":"Salvador","232":"Érythrée",
  "233":"Estonie","231":"Éthiopie","246":"Finlande","250":"France",
  "266":"Gabon","270":"Gambie","268":"Géorgie","276":"Allemagne","288":"Ghana",
  "300":"Grèce","304":"Groenland","320":"Guatemala","324":"Guinée",
  "624":"Guinée-Bissau","328":"Guyana","332":"Haïti","340":"Honduras",
  "348":"Hongrie","356":"Inde","360":"Indonésie","364":"Iran","368":"Irak",
  "372":"Irlande","376":"Israël","380":"Italie","388":"Jamaïque","392":"Japon",
  "400":"Jordanie","398":"Kazakhstan","404":"Kenya","296":"Kiribati",
  "408":"Corée du Nord","410":"Corée du Sud","414":"Koweït","417":"Kirghizistan",
  "418":"Laos","422":"Liban","426":"Lesotho","430":"Liberia","434":"Libye",
  "440":"Lituanie","442":"Luxembourg","450":"Madagascar","454":"Malawi",
  "458":"Malaisie","462":"Maldives","466":"Mali","484":"Mexique","496":"Mongolie",
  "499":"Monténégro","504":"Maroc","508":"Mozambique","104":"Myanmar",
  "516":"Namibie","524":"Népal","528":"Pays-Bas","554":"Nouvelle-Zélande",
  "558":"Nicaragua","562":"Niger","566":"Nigéria","578":"Norvège","512":"Oman",
  "586":"Pakistan","591":"Panama","598":"Papouasie-Nvl-Guinée","600":"Paraguay",
  "604":"Pérou","608":"Philippines","616":"Pologne","620":"Portugal",
  "634":"Qatar","642":"Roumanie","643":"Russie","646":"Rwanda",
  "682":"Arabie saoudite","686":"Sénégal","688":"Serbie","694":"Sierra Leone",
  "703":"Slovaquie","705":"Slovénie","706":"Somalie","710":"Afrique du Sud",
  "724":"Espagne","729":"Soudan du Sud","736":"Soudan","740":"Suriname",
  "752":"Suède","756":"Suisse","760":"Syrie","762":"Tadjikistan",
  "158":"Taïwan","764":"Thaïlande","768":"Togo","780":"Trinité-et-Tobago",
  "788":"Tunisie","792":"Turquie","795":"Turkménistan","800":"Ouganda",
  "804":"Ukraine","784":"Émirats arabes unis","826":"Royaume-Uni",
  "840":"États-Unis","858":"Uruguay","860":"Ouzbékistan","862":"Venezuela",
  "704":"Viêt Nam","887":"Yémen","894":"Zambie","716":"Zimbabwe",
  "051":"Arménie","498":"Moldavie","807":"Macédoine du Nord","275":"Palestine",
  "702":"Singapour","090":"Îles Salomon","548":"Vanuatu","242":"Fidji",
  "583":"Micronésie","585":"Palaos","584":"Îles Marshall","798":"Tuvalu",
  "520":"Nauru","776":"Tonga","882":"Samoa","010":"Antarctique","630":"Porto Rico"
};

// ── Login ─────────────────────────────────────────────────────────────────────
const loginScreen = document.getElementById("login-screen");
const appEl = document.getElementById("app");
const pwdInput = document.getElementById("pwd-input");

function tryLogin() {
  if (pwdInput.value === PASSWORD) {
    sessionStorage.setItem("tdc_auth", "1");
    loginScreen.style.display = "none";
    appEl.classList.remove("hidden");
    initApp();
  } else {
    document.getElementById("login-error").classList.add("show");
    pwdInput.value = "";
    pwdInput.focus();
  }
}
document.getElementById("login-btn").addEventListener("click", tryLogin);
pwdInput.addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });
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
async function loadMap() {
  const [d3, topo, world] = await Promise.all([
    import("https://cdn.jsdelivr.net/npm/d3@7/+esm"),
    import("https://cdn.jsdelivr.net/npm/topojson-client@3/+esm"),
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r => r.json())
  ]);

  const wrapper = document.getElementById("map-wrapper");
  const W = wrapper.clientWidth || 1200;
  const H = wrapper.clientHeight || 620;

  const svg = d3.select("#map-svg").attr("viewBox", `0 0 ${W} ${H}`);
  const g = svg.select("#countries-group");

  const projection = d3.geoNaturalEarth1()
    .scale(W / 6.2)
    .translate([W / 2, H / 2]);
  const path = d3.geoPath().projection(projection);

  // Fond océan
  svg.insert("rect", ":first-child")
    .attr("width", W).attr("height", H).attr("fill", "#080d18");

  // Graticule
  const grat = svg.insert("g", "#countries-group").attr("class", "graticule-group");
  grat.append("path")
    .datum(d3.geoGraticule()())
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "rgba(255,255,255,0.035)")
    .attr("stroke-width", 0.4);
  grat.append("path")
    .datum({ type: "Sphere" })
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "rgba(255,255,255,0.07)")
    .attr("stroke-width", 1);

  // Pays
  topo.feature(world, world.objects.countries).features.forEach(f => {
    const id = String(f.id).padStart(3, "0");
    const name = NAME_MAP[id];
    if (!name) return;
    const d = path(f.geometry);
    if (!d) return;
    g.append("path")
      .attr("d", d)
      .attr("data-id", id)
      .attr("data-name", name)
      .attr("class", "country")
      .attr("fill", "#22251e")
      .attr("stroke", "#080d18")
      .attr("stroke-width", 0.4)
      .on("mouseenter", function(event) {
        showTooltip(event, id, name);
        if (!allData[id] || allData[id].status === "todo") d3.select(this).attr("fill", "#3a3d32");
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", function() { hideTooltip(); applyColorToEl(this, id); })
      .on("click", () => openPanel(id, name));
  });

  // Zoom
  const zoom = d3.zoom()
    .scaleExtent([1, 14])
    .translateExtent([[0, 0], [W, H]])
    .on("zoom", event => {
      g.attr("transform", event.transform);
      svg.selectAll(".graticule-group").attr("transform", event.transform);
    });

  svg.call(zoom).on("dblclick.zoom", null);

  document.getElementById("zoom-in").addEventListener("click", () =>
    svg.transition().duration(250).call(zoom.scaleBy, 1.6));
  document.getElementById("zoom-out").addEventListener("click", () =>
    svg.transition().duration(250).call(zoom.scaleBy, 0.625));
  document.getElementById("zoom-reset").addEventListener("click", () =>
    svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity));

  document.getElementById("map-loading").remove();
  applyColors();
}

function applyColorToEl(el, id) {
  const s = allData[id]?.status;
  el.setAttribute("fill", s === "wip" ? "#5c3f08" : s === "done" ? "#163d22" : "#22251e");
  el.setAttribute("stroke", id === selectedId ? "#C8F562" : "#080d18");
  el.setAttribute("stroke-width", id === selectedId ? "1.5" : "0.4");
}
function applyColors() {
  document.querySelectorAll(".country").forEach(el =>
    applyColorToEl(el, el.getAttribute("data-id")));
}
function updateStats() {
  const v = Object.values(allData);
  document.getElementById("cnt-todo").textContent = v.filter(x => x.status === "todo").length;
  document.getElementById("cnt-wip").textContent = v.filter(x => x.status === "wip").length;
  document.getElementById("cnt-done").textContent = v.filter(x => x.status === "done").length;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
const tt = document.getElementById("tooltip");
const mapWrap = document.getElementById("map-wrapper");

function showTooltip(event, id, name) {
  const entry = allData[id];
  document.getElementById("tt-name").textContent = name;
  document.getElementById("tt-status").textContent = entry ? statusLabel[entry.status || "todo"] : "Cliquer pour annoter";
  const noteEl = document.getElementById("tt-note");
  const preview = entry?.artist || entry?.note;
  if (preview) { noteEl.textContent = preview.substring(0, 80) + (preview.length > 80 ? "…" : ""); noteEl.style.display = "block"; }
  else noteEl.style.display = "none";
  tt.style.opacity = "1";
  moveTooltip(event);
}
function moveTooltip(event) {
  const r = mapWrap.getBoundingClientRect();
  let x = event.clientX - r.left + 16, y = event.clientY - r.top + 16;
  if (x + 240 > r.width) x = event.clientX - r.left - 250;
  if (y + 120 > r.height) y = event.clientY - r.top - 105;
  tt.style.left = x + "px"; tt.style.top = y + "px";
}
function hideTooltip() { tt.style.opacity = "0"; }

// ── Panel ─────────────────────────────────────────────────────────────────────
const panel = document.getElementById("panel");
const overlay = document.getElementById("overlay");

function openPanel(id, name) {
  selectedId = id; selectedName = name;
  const entry = allData[id] || {};
  document.getElementById("panel-name").textContent = name;
  document.getElementById("panel-artist").value = entry.artist || "";
  document.getElementById("panel-note").value = entry.note || "";
  currentStatus = entry.status || "todo";
  currentLinks = entry.links || [];
  document.querySelectorAll(".status-btn").forEach(b => b.classList.toggle("active", b.dataset.s === currentStatus));
  renderLinks();
  document.getElementById("last-edit").textContent = entry.editedAt
    ? "Modifié le " + new Date(entry.editedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";
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
document.querySelectorAll(".status-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentStatus = btn.dataset.s;
    document.querySelectorAll(".status-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});
document.getElementById("panel-save").addEventListener("click", () => {
  if (!selectedId) return;
  const entry = { status: currentStatus, artist: document.getElementById("panel-artist").value.trim(),
    note: document.getElementById("panel-note").value.trim(), links: currentLinks, editedAt: Date.now(), name: selectedName };
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
      <a href="${url}" target="_blank" rel="noopener">${url.replace(/^https?:\/\//, "").substring(0, 45)}</a>
      <button class="link-del" data-i="${i}">×</button>
    </div>`).join("");
  list.querySelectorAll(".link-del").forEach(btn =>
    btn.addEventListener("click", () => { currentLinks.splice(Number(btn.dataset.i), 1); renderLinks(); }));
}
document.getElementById("add-link-btn").addEventListener("click", () => {
  const input = document.getElementById("link-input");
  const url = input.value.trim();
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    currentLinks.push(url); renderLinks(); input.value = "";
  }
});

// ── Drawer ────────────────────────────────────────────────────────────────────
const drawer = document.getElementById("list-drawer");
document.getElementById("list-toggle-btn").addEventListener("click", () => { drawer.classList.toggle("hidden"); renderDrawer(); });
document.getElementById("drawer-close").addEventListener("click", () => drawer.classList.add("hidden"));

function renderDrawer() {
  const body = document.getElementById("drawer-body");
  const entries = Object.entries(allData).filter(([, v]) => v?.name);
  if (!entries.length) { body.innerHTML = '<p style="padding:1rem 1.5rem;font-size:13px;color:var(--text2)">Aucun pays annoté.</p>'; return; }
  entries.sort((a, b) => ({ done: 0, wip: 1, todo: 2 }[a[1].status || "todo"] - { done: 0, wip: 1, todo: 2 }[b[1].status || "todo"]));
  body.innerHTML = entries.map(([id, v]) => `
    <div class="drawer-item" data-id="${id}" data-name="${(v.name || id).replace(/"/g, "&quot;")}">
      <div class="di-dot" style="background:${statusColor[v.status || "todo"]}"></div>
      <div><div class="di-name">${v.name || id}</div>
      ${v.artist ? `<div class="di-artist">${v.artist}</div>` : ""}
      ${v.note ? `<div class="di-note">${v.note.substring(0, 60)}…</div>` : ""}</div>
    </div>`).join("");
  body.querySelectorAll(".drawer-item").forEach(el =>
    el.addEventListener("click", () => { drawer.classList.add("hidden"); openPanel(el.dataset.id, el.dataset.name); }));
}

function initApp() { listenToData(); loadMap(); }
