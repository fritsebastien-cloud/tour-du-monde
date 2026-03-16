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

const PASSWORD = "map";

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(firebaseApp);

let allData = {};
let selectedId = null;
let selectedName = null;
let currentStatus = "todo";
let currentLinks = [];

const statusLabel = {
  todo:   "À explorer",
  wip:    "Piste en cours",
  script: "Script fini",
  done:   "En ligne"
};

// Couleurs des points dans les listes/drawer
const statusColor = {
  todo:   "#4a4a44",
  wip:    "#F5A623",
  script: "#5b7cf7",
  done:   "#4ADE80"
};

// Couleurs de remplissage sur la carte (thème clair)
const mapFill = {
  todo:   "#ddddd8",
  wip:    "#f5c96a",
  script: "#8fb4f5",
  done:   "#72cc92"
};
const mapHover = {
  todo:   "#c8c8c2",
  wip:    "#e8b84e",
  script: "#6d9ee8",
  done:   "#55bb78"
};

const NAME_MAP = {
  // Afrique
  "012":"Algérie","024":"Angola","204":"Bénin","072":"Botswana","854":"Burkina Faso",
  "108":"Burundi","132":"Cap-Vert","120":"Cameroun","140":"Rép. centrafricaine",
  "148":"Tchad","174":"Comores","178":"Congo","180":"Congo (RDC)","384":"Côte d'Ivoire",
  "262":"Djibouti","818":"Égypte","226":"Guinée équatoriale","232":"Érythrée",
  "231":"Éthiopie","266":"Gabon","270":"Gambie","288":"Ghana","324":"Guinée",
  "624":"Guinée-Bissau","404":"Kenya","426":"Lesotho","430":"Liberia","434":"Libye",
  "450":"Madagascar","454":"Malawi","466":"Mali","478":"Mauritanie","480":"Maurice",
  "504":"Maroc","508":"Mozambique","516":"Namibie","562":"Niger","566":"Nigéria",
  "646":"Rwanda","678":"Sao Tomé-et-Principe","686":"Sénégal","694":"Sierra Leone",
  "706":"Somalie","710":"Afrique du Sud","728":"Soudan du Sud","729":"Soudan",
  "748":"Eswatini","768":"Togo","788":"Tunisie","800":"Ouganda","834":"Tanzanie",
  "894":"Zambie","716":"Zimbabwe","732":"Sahara occidental","654":"Sainte-Hélène",
  // Amérique du Nord et Centrale
  "028":"Antigua-et-Barbuda","044":"Bahamas","084":"Belize","124":"Canada",
  "188":"Costa Rica","192":"Cuba","212":"Dominique","214":"Rép. dominicaine",
  "222":"Salvador","308":"Grenade","320":"Guatemala","332":"Haïti","340":"Honduras",
  "388":"Jamaïque","484":"Mexique","558":"Nicaragua","591":"Panama","630":"Porto Rico",
  "659":"Saint-Kitts-et-Nevis","662":"Sainte-Lucie","670":"Saint-Vincent-et-les-Grenadines",
  "780":"Trinité-et-Tobago","840":"États-Unis","052":"Barbade","060":"Bermudes",
  "136":"Îles Caïmans","500":"Montserrat","660":"Anguilla",
  "652":"Saint-Barthélemy","663":"Saint-Martin","666":"Saint-Pierre-et-Miquelon",
  "796":"Îles Turques-et-Caïques","850":"Îles Vierges américaines",
  "092":"Îles Vierges britanniques","316":"Guam","580":"Îles Mariannes du Nord",
  // Amérique du Sud
  "032":"Argentine","068":"Bolivie","076":"Brésil","152":"Chili","170":"Colombie",
  "218":"Équateur","328":"Guyana","600":"Paraguay","604":"Pérou","740":"Suriname",
  "858":"Uruguay","862":"Venezuela","238":"Îles Malouines","239":"Géorgie du Sud",
  // Europe
  "008":"Albanie","276":"Allemagne","020":"Andorre","040":"Autriche","112":"Biélorussie",
  "056":"Belgique","070":"Bosnie-Herzégovine","100":"Bulgarie","196":"Chypre",
  "191":"Croatie","208":"Danemark","233":"Estonie","246":"Finlande","250":"France",
  "268":"Géorgie","300":"Grèce","348":"Hongrie","352":"Islande","372":"Irlande",
  "380":"Italie","428":"Lettonie","440":"Lituanie","442":"Luxembourg","807":"Macédoine du Nord",
  "470":"Malte","498":"Moldavie","499":"Monténégro","528":"Pays-Bas","578":"Norvège",
  "616":"Pologne","620":"Portugal","642":"Roumanie","826":"Royaume-Uni","643":"Russie",
  "688":"Serbie","703":"Slovaquie","705":"Slovénie","724":"Espagne","752":"Suède",
  "756":"Suisse","203":"Tchéquie","804":"Ukraine","051":"Arménie","031":"Azerbaïdjan",
  "304":"Groenland","234":"Îles Féroé","248":"Îles Åland",
  "438":"Liechtenstein","492":"Monaco","674":"Saint-Marin","336":"Vatican",
  "831":"Guernesey","832":"Jersey","833":"Île de Man",
  "531":"Curaçao","533":"Aruba","534":"Sint Maarten",
  // Asie
  "004":"Afghanistan","050":"Bangladesh","064":"Bhoutan","096":"Brunei","116":"Cambodge",
  "156":"Chine","408":"Corée du Nord","410":"Corée du Sud","368":"Irak","364":"Iran",
  "376":"Israël","392":"Japon","400":"Jordanie","398":"Kazakhstan","417":"Kirghizistan",
  "414":"Koweït","418":"Laos","422":"Liban","458":"Malaisie","462":"Maldives",
  "496":"Mongolie","104":"Myanmar","524":"Népal","512":"Oman","586":"Pakistan",
  "275":"Palestine","608":"Philippines","634":"Qatar","682":"Arabie saoudite",
  "702":"Singapour","144":"Sri Lanka","760":"Syrie","158":"Taïwan","762":"Tadjikistan",
  "764":"Thaïlande","626":"Timor oriental","795":"Turkménistan","792":"Turquie",
  "784":"Émirats arabes unis","860":"Ouzbékistan","704":"Viêt Nam","887":"Yémen",
  "048":"Bahreïn","356":"Inde","360":"Indonésie","344":"Hong Kong","446":"Macao",
  "086":"Territoire brit. océan Indien",
  // Océanie
  "036":"Australie","242":"Fidji","296":"Kiribati","584":"Îles Marshall",
  "090":"Îles Salomon","583":"Micronésie","520":"Nauru","554":"Nouvelle-Zélande",
  "585":"Palaos","598":"Papouasie-Nvl-Guinée","882":"Samoa","016":"Samoa américaines",
  "776":"Tonga","548":"Vanuatu","258":"Polynésie française","540":"Nouvelle-Calédonie",
  "184":"Îles Cook","570":"Niué","574":"Île Norfolk","612":"Îles Pitcairn",
  "876":"Wallis-et-Futuna","690":"Seychelles",
  // Autres / Territoires
  "010":"Antarctique","260":"Terres australes françaises",
  "334":"Îles Heard-et-MacDonald","239":"Géorgie du Sud"
};

// ── Thème ──────────────────────────────────────────────────────────────────────
const themeBtn = document.getElementById("theme-btn");
const sunIcon  = document.getElementById("icon-sun");
const moonIcon = document.getElementById("icon-moon");
function applyTheme(dark) {
  document.body.classList.toggle("dark", dark);
  sunIcon.style.display  = dark ? "none" : "";
  moonIcon.style.display = dark ? "" : "none";
  localStorage.setItem("tdc_theme", dark ? "dark" : "light");
}
const savedTheme = localStorage.getItem("tdc_theme");
applyTheme(savedTheme === "dark");
themeBtn.addEventListener("click", () => applyTheme(!document.body.classList.contains("dark")));

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
  const [d3mod, topomod, world] = await Promise.all([
    import("https://cdn.jsdelivr.net/npm/d3@7/+esm"),
    import("https://cdn.jsdelivr.net/npm/topojson-client@3/+esm"),
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then(r => r.json())
  ]);

  const wrapper = document.getElementById("map-wrapper");
  const W = wrapper.clientWidth || 1200;
  const H = wrapper.clientHeight || 620;

  const svg = d3mod.select("#map-svg").attr("viewBox", `0 0 ${W} ${H}`);
  const g = svg.select("#countries-group");

  const projection = d3mod.geoNaturalEarth1()
    .scale(W / 6.2)
    .translate([W / 2, H / 2]);
  const path = d3mod.geoPath().projection(projection);

  // Largeur en pixels du monde entier à l'échelle 1
  const MAP_W = projection([180, 0])[0] - projection([-180, 0])[0];

  // 3 copies côte à côte pour le défilement infini (-1, 0, +1)
  const copies = [-1, 0, 1].map(offset => {
    return g.append("g")
      .attr("class", "map-copy")
      .attr("transform", `translate(${offset * MAP_W}, 0)`);
  });

  // Rendu des pays dans chaque copie
  const features = topomod.feature(world, world.objects.countries).features;
  copies.forEach(copyG => {
    features.forEach(f => {
      const id = String(f.id).padStart(3, "0");
      const name = NAME_MAP[id];
      if (!name) return;
      const d = path(f.geometry);
      if (!d) return;
      copyG.append("path")
        .attr("d", d)
        .attr("data-id", id)
        .attr("data-name", name)
        .attr("class", "country")
        .attr("fill", mapFill.todo)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.6)
        .on("mouseenter", function(event) {
          showTooltip(event, id, name);
          const s = allData[id]?.status || "todo";
          // Hover sur les 3 copies à la fois
          d3mod.selectAll(`[data-id="${id}"]`).attr("fill", mapHover[s] || mapHover.todo);
        })
        .on("mousemove", moveTooltip)
        .on("mouseleave", () => { hideTooltip(); applyColorById(id); })
        .on("click", () => openPanel(id, name));
    });
  });

  // Zoom avec bouclage horizontal infini
  const zoom = d3mod.zoom()
    .scaleExtent([0.5, 14])
    .on("zoom", event => {
      const { x, y, k } = event.transform;
      const scaledW = MAP_W * k;
      // Normalise x pour boucler sans jamais voir de bord
      const nx = ((x % scaledW) + scaledW) % scaledW;
      copies.forEach((copyG, i) => {
        copyG.attr("transform", `translate(${nx + (i - 1) * scaledW}, ${y}) scale(${k})`);
      });
    });

  svg.call(zoom).on("dblclick.zoom", null);

  document.getElementById("zoom-in").addEventListener("click", () =>
    svg.transition().duration(250).call(zoom.scaleBy, 1.6));
  document.getElementById("zoom-out").addEventListener("click", () =>
    svg.transition().duration(250).call(zoom.scaleBy, 0.625));
  document.getElementById("zoom-reset").addEventListener("click", () =>
    svg.transition().duration(400).call(zoom.transform, d3mod.zoomIdentity));

  document.getElementById("map-loading").remove();
  applyColors();
}

function applyColorToEl(el, id) {
  const s = allData[id]?.status || "todo";
  el.setAttribute("fill", mapFill[s] || mapFill.todo);
  el.setAttribute("stroke", id === selectedId ? "#333333" : "#ffffff");
  el.setAttribute("stroke-width", id === selectedId ? "1.5" : "0.6");
}
// Met à jour les 3 copies d'un pays en même temps
function applyColorById(id) {
  document.querySelectorAll(`[data-id="${id}"]`).forEach(el => applyColorToEl(el, id));
}
function applyColors() {
  document.querySelectorAll("[data-id]").forEach(el =>
    applyColorToEl(el, el.getAttribute("data-id")));
}
function updateStats() {
  const v = Object.values(allData);
  document.getElementById("cnt-todo").textContent   = v.filter(x => x.status === "todo").length;
  document.getElementById("cnt-wip").textContent    = v.filter(x => x.status === "wip").length;
  document.getElementById("cnt-script").textContent = v.filter(x => x.status === "script").length;
  document.getElementById("cnt-done").textContent   = v.filter(x => x.status === "done").length;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
const tt = document.getElementById("tooltip");
const mapWrap = document.getElementById("map-wrapper");

function showTooltip(event, id, name) {
  const entry = allData[id];
  document.getElementById("tt-name").textContent = name;
  document.getElementById("tt-status").textContent = entry
    ? statusLabel[entry.status || "todo"]
    : "Cliquer pour annoter";
  const noteEl = document.getElementById("tt-note");
  const preview = entry?.artist || entry?.note;
  if (preview) {
    noteEl.textContent = preview.substring(0, 80) + (preview.length > 80 ? "…" : "");
    noteEl.style.display = "block";
  } else {
    noteEl.style.display = "none";
  }
  tt.style.opacity = "1";
  moveTooltip(event);
}
function moveTooltip(event) {
  const r = mapWrap.getBoundingClientRect();
  let x = event.clientX - r.left + 16, y = event.clientY - r.top + 16;
  if (x + 240 > r.width)  x = event.clientX - r.left - 250;
  if (y + 120 > r.height) y = event.clientY - r.top - 105;
  tt.style.left = x + "px"; tt.style.top = y + "px";
}
function hideTooltip() { tt.style.opacity = "0"; }

// ── Panel ─────────────────────────────────────────────────────────────────────
const panel   = document.getElementById("panel");
const overlay = document.getElementById("overlay");

function updatePanelStatusDot(status) {
  const dot = document.getElementById("panel-status-dot");
  dot.style.background = statusColor[status] || statusColor.todo;
  document.getElementById("panel-status-label").textContent = statusLabel[status] || statusLabel.todo;
}

function openPanel(id, name) {
  selectedId = id; selectedName = name;
  const entry = allData[id] || {};
  document.getElementById("panel-name").textContent       = name;
  document.getElementById("panel-artist").value           = entry.artist   || "";
  document.getElementById("panel-category").value         = entry.category || "";
  document.getElementById("panel-note").value             = entry.note     || "";
  currentStatus = entry.status || "todo";
  currentLinks  = entry.links  || [];

  document.querySelectorAll(".sbtn").forEach(b =>
    b.classList.toggle("active", b.dataset.s === currentStatus));
  updatePanelStatusDot(currentStatus);
  renderLinks();

  document.getElementById("last-edit").textContent = entry.editedAt
    ? "Modifié le " + new Date(entry.editedAt).toLocaleDateString("fr-FR",
        { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : "";

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
    updatePanelStatusDot(currentStatus);
  });
});

document.getElementById("panel-save").addEventListener("click", () => {
  if (!selectedId) return;
  const entry = {
    status:   currentStatus,
    artist:   document.getElementById("panel-artist").value.trim(),
    category: document.getElementById("panel-category").value.trim(),
    note:     document.getElementById("panel-note").value.trim(),
    links:    currentLinks,
    editedAt: Date.now(),
    name:     selectedName
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
document.getElementById("list-toggle-btn").addEventListener("click", () => {
  drawer.classList.toggle("hidden"); renderDrawer();
});
document.getElementById("drawer-close").addEventListener("click", () =>
  drawer.classList.add("hidden"));

function renderDrawer() {
  const body = document.getElementById("drawer-body");
  const entries = Object.entries(allData).filter(([, v]) => v?.name);
  if (!entries.length) {
    body.innerHTML = '<p style="padding:1rem 1.5rem;font-size:13px;color:#aaa">Aucun pays annoté.</p>';
    return;
  }
  const order = { done: 0, script: 1, wip: 2, todo: 3 };
  entries.sort((a, b) => (order[a[1].status || "todo"] ?? 3) - (order[b[1].status || "todo"] ?? 3));
  body.innerHTML = entries.map(([id, v]) => `
    <div class="ditem" data-id="${id}" data-name="${(v.name || id).replace(/"/g, "&quot;")}">
      <div class="d-dot" style="background:${statusColor[v.status || "todo"]}"></div>
      <div>
        <div class="d-name">${v.name || id}</div>
        ${v.artist   ? `<div class="d-artist">${v.artist}</div>` : ""}
        ${v.category ? `<div class="d-cat">${v.category}</div>` : ""}
      </div>
    </div>`).join("");
  body.querySelectorAll(".ditem").forEach(el =>
    el.addEventListener("click", () => {
      drawer.classList.add("hidden");
      openPanel(el.dataset.id, el.dataset.name);
    }));
}

function initApp() { listenToData(); loadMap(); }
