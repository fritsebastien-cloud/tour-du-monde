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

const PASSWORD = "map";

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(firebaseApp);

let allData = {};
let selectedId = null;
let selectedName = null;
let currentStatus = "todo";
let currentLinks = [];
let currentArtistPhoto = "";
let artistDebounceTimer = null;

// Références carte (initialisées dans loadMap)
let d3lib = null;
let geoFeatures = [];
let svgSel = null, zoomBeh = null, projFn = null;
let mapW = 0, mapH = 0;
const countryCentroids = {};

// Filtres actifs par statut
const activeFilters = new Set(["todo", "wip", "script", "done"]);

const statusLabel = {
  todo:   "À explorer",
  wip:    "Piste en cours",
  script: "Artiste choisi",
  done:   "Prêt à tourner"
};

const statusColor = {
  todo:   "#4a4a44",
  wip:    "#F5A623",
  script: "#f564a9",
  done:   "#4ADE80"
};

// Couleur du trait au survol (version sombre du fill selon statut)
const mapStroke = {
  todo:   "#a8a8a2",
  wip:    "#d4940a",
  script: "#c8408a",
  done:   "#38a060"
};

const mapFill = {
  todo:   "#ddddd8",
  wip:    "#f5c96a",
  script: "#f59dc8",
  done:   "#72cc92"
};
const mapHover = {
  todo:   "#c8c8c2",
  wip:    "#e8b84e",
  script: "#e87ab0",
  done:   "#55bb78"
};
// Couleurs pour le mode sombre cinématique
const mapFillDark = {
  todo:   "#2e3f58",
  wip:    "#c47a10",
  script: "#b04080",
  done:   "#2a7a50"
};
const mapHoverDark = {
  todo:   "#3a4e6e",
  wip:    "#d98e18",
  script: "#c84e92",
  done:   "#349260"
};
const mapStrokeDark = {
  todo:   "#4a6080",
  wip:    "#f0a030",
  script: "#e060a0",
  done:   "#40b068"
};

// Continents pour le drawer
const CONTINENT = {
  // Afrique
  "012":"Afrique","024":"Afrique","204":"Afrique","072":"Afrique","854":"Afrique",
  "108":"Afrique","132":"Afrique","120":"Afrique","140":"Afrique","148":"Afrique",
  "174":"Afrique","178":"Afrique","180":"Afrique","384":"Afrique","262":"Afrique",
  "818":"Afrique","226":"Afrique","232":"Afrique","231":"Afrique","266":"Afrique",
  "270":"Afrique","288":"Afrique","324":"Afrique","624":"Afrique","404":"Afrique",
  "426":"Afrique","430":"Afrique","434":"Afrique","450":"Afrique","454":"Afrique",
  "466":"Afrique","478":"Afrique","480":"Afrique","504":"Afrique","508":"Afrique",
  "516":"Afrique","562":"Afrique","566":"Afrique","646":"Afrique","678":"Afrique",
  "686":"Afrique","694":"Afrique","706":"Afrique","710":"Afrique","728":"Afrique",
  "729":"Afrique","748":"Afrique","768":"Afrique","788":"Afrique","800":"Afrique",
  "834":"Afrique","894":"Afrique","716":"Afrique","732":"Afrique","654":"Afrique",
  "690":"Afrique",
  // Amér. Nord
  "028":"Amér. Nord","044":"Amér. Nord","084":"Amér. Nord","124":"Amér. Nord",
  "188":"Amér. Nord","192":"Amér. Nord","212":"Amér. Nord","214":"Amér. Nord",
  "222":"Amér. Nord","308":"Amér. Nord","320":"Amér. Nord","332":"Amér. Nord",
  "340":"Amér. Nord","388":"Amér. Nord","484":"Amér. Nord","558":"Amér. Nord",
  "591":"Amér. Nord","630":"Amér. Nord","659":"Amér. Nord","662":"Amér. Nord",
  "670":"Amér. Nord","780":"Amér. Nord","840":"Amér. Nord","052":"Amér. Nord",
  "060":"Amér. Nord","136":"Amér. Nord","500":"Amér. Nord","660":"Amér. Nord",
  "652":"Amér. Nord","663":"Amér. Nord","666":"Amér. Nord","796":"Amér. Nord",
  "850":"Amér. Nord","092":"Amér. Nord","316":"Amér. Nord","580":"Amér. Nord",
  "531":"Amér. Nord","533":"Amér. Nord","534":"Amér. Nord",
  // Amér. Sud
  "032":"Amér. Sud","068":"Amér. Sud","076":"Amér. Sud","152":"Amér. Sud",
  "170":"Amér. Sud","218":"Amér. Sud","328":"Amér. Sud","600":"Amér. Sud",
  "604":"Amér. Sud","740":"Amér. Sud","858":"Amér. Sud","862":"Amér. Sud",
  "238":"Amér. Sud","239":"Amér. Sud",
  // Asie
  "004":"Asie","050":"Asie","064":"Asie","096":"Asie","116":"Asie",
  "156":"Asie","408":"Asie","410":"Asie","368":"Asie","364":"Asie",
  "376":"Asie","392":"Asie","400":"Asie","398":"Asie","417":"Asie",
  "414":"Asie","418":"Asie","422":"Asie","458":"Asie","462":"Asie",
  "496":"Asie","104":"Asie","524":"Asie","512":"Asie","586":"Asie",
  "275":"Asie","608":"Asie","634":"Asie","682":"Asie","702":"Asie",
  "144":"Asie","760":"Asie","158":"Asie","762":"Asie","764":"Asie",
  "626":"Asie","795":"Asie","792":"Asie","784":"Asie","860":"Asie",
  "704":"Asie","887":"Asie","048":"Asie","356":"Asie","360":"Asie",
  "344":"Asie","446":"Asie","086":"Asie",
  // Europe
  "008":"Europe","276":"Europe","020":"Europe","040":"Europe","112":"Europe",
  "056":"Europe","070":"Europe","100":"Europe","196":"Europe","191":"Europe",
  "208":"Europe","233":"Europe","246":"Europe","250":"Europe","268":"Europe",
  "300":"Europe","348":"Europe","352":"Europe","372":"Europe","380":"Europe",
  "428":"Europe","440":"Europe","442":"Europe","807":"Europe","470":"Europe",
  "498":"Europe","499":"Europe","528":"Europe","578":"Europe","616":"Europe",
  "620":"Europe","642":"Europe","826":"Europe","643":"Europe","688":"Europe",
  "703":"Europe","705":"Europe","724":"Europe","752":"Europe","756":"Europe",
  "203":"Europe","804":"Europe","051":"Europe","031":"Europe","304":"Europe",
  "234":"Europe","248":"Europe","438":"Europe","492":"Europe","674":"Europe",
  "336":"Europe","831":"Europe","832":"Europe","833":"Europe",
  // Océanie
  "036":"Océanie","242":"Océanie","296":"Océanie","584":"Océanie",
  "090":"Océanie","583":"Océanie","520":"Océanie","554":"Océanie",
  "585":"Océanie","598":"Océanie","882":"Océanie","016":"Océanie",
  "776":"Océanie","548":"Océanie","258":"Océanie","540":"Océanie",
  "184":"Océanie","570":"Océanie","574":"Océanie","612":"Océanie","876":"Océanie",
  // Autres
  "010":"Autres","260":"Autres","334":"Autres"
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
  // Autres
  "010":"Antarctique","260":"Terres australes françaises",
  "334":"Îles Heard-et-MacDonald"
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
  // Mettre à jour les couleurs de la carte selon le thème
  if (document.getElementById("countries-group").children.length > 0) applyColors();
}
// Dark par défaut sauf si l'utilisateur a explicitement choisi le mode clair
const savedTheme = localStorage.getItem("tdc_theme");
applyTheme(savedTheme !== "light");
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
const MICROSTATES = [
  { id:"492", lon:7.4167,   lat:43.7333  },
  { id:"336", lon:12.4534,  lat:41.9029  },
  { id:"674", lon:12.4500,  lat:43.9333  },
  { id:"438", lon:9.5333,   lat:47.1667  },
  { id:"470", lon:14.3754,  lat:35.9375  },
  { id:"048", lon:50.5500,  lat:26.0275  },
  { id:"702", lon:103.8198, lat:1.3521   },
  { id:"462", lon:73.2207,  lat:3.2028   },
  { id:"690", lon:55.4920,  lat:-4.6796  },
  { id:"678", lon:6.6131,   lat:0.1864   },
  { id:"132", lon:-23.6052, lat:15.1111  },
];

async function loadMap() {
  const [d3mod, topomod, world] = await Promise.all([
    import("https://cdn.jsdelivr.net/npm/d3@7/+esm"),
    import("https://cdn.jsdelivr.net/npm/topojson-client@3/+esm"),
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then(r => r.json())
  ]);

  d3lib = d3mod;

  const wrapper = document.getElementById("map-wrapper");
  mapW = wrapper.clientWidth || 1200;
  mapH = wrapper.clientHeight || 620;

  const svg = d3mod.select("#map-svg").attr("viewBox", `0 0 ${mapW} ${mapH}`);
  svgSel = svg;
  const g = svg.select("#countries-group");

  const projection = d3mod.geoNaturalEarth1()
    .scale(mapW / 5.5)
    .translate([mapW / 2, mapH / 2]);
  projFn = projection;
  const path = d3mod.geoPath().projection(projection);

  const MAP_W   = projection([180, 0])[0] - projection([-180, 0])[0];
  const NORTH_Y = projection([0,  90])[1];
  const SOUTH_Y = projection([0, -90])[1];
  const MAP_CENTER_Y = (NORTH_Y + SOUTH_Y) / 2;

  const copies = [-1, 0, 1].map(col => ({
    g: g.append("g").attr("class", "map-copy"),
    col
  }));

  // Graticule (lignes lat/lon) dans chaque copie
  const graticule = d3mod.geoGraticule().step([30, 30]);
  copies.forEach(({ g: copyG }) => {
    copyG.insert("path", ":first-child")
      .datum(graticule())
      .attr("d", path)
      .attr("fill", "none")
      .attr("class", "graticule-line")
      .attr("stroke-width", 0.35);
  });

  const features = topomod.feature(world, world.objects.countries).features;
  geoFeatures = features;

  // Centroids géographiques pour la recherche
  features.forEach(f => {
    const id = String(f.id).padStart(3, "0");
    if (NAME_MAP[id]) countryCentroids[id] = d3mod.geoCentroid(f);
  });
  MICROSTATES.forEach(({ id, lon, lat }) => { countryCentroids[id] = [lon, lat]; });

  // Rendu des pays (3 copies)
  copies.forEach(({ g: copyG }) => {
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
        .on("mouseenter", function(event) {
          showTooltip(event, id, name);
          const s = allData[id]?.status || null;
          const dark = document.body.classList.contains("dark");
          const hovers  = dark ? mapHoverDark  : mapHover;
          const strokes = dark ? mapStrokeDark : mapStroke;
          d3mod.selectAll(`[data-id="${id}"]`)
            .attr("fill", hovers[s]  || hovers.todo)
            .attr("stroke", strokes[s] || strokes.todo)
            .attr("stroke-width", 1.2);
        })
        .on("mousemove", moveTooltip)
        .on("mouseleave", () => {
          hideTooltip();
          applyColorById(id);
          d3mod.selectAll(`[data-id="${id}"]`).attr("stroke", "transparent").attr("stroke-width", 0);
        })
        .on("click", () => openPanel(id, name))
        .on("contextmenu", function(event) { showCtxMenu(event, id, name); });
    });

    // Micro-États : points
    MICROSTATES.forEach(({ id, lon, lat }) => {
      const name = NAME_MAP[id];
      if (!name) return;
      const [cx, cy] = projection([lon, lat]);
      copyG.append("circle")
        .attr("cx", cx).attr("cy", cy).attr("r", 3.5)
        .attr("data-id", id).attr("data-name", name)
        .attr("class", "country microstate")
        .attr("fill", mapFill.todo)
        .on("mouseenter", function(event) {
          showTooltip(event, id, name);
          const s = allData[id]?.status || null;
          const dark = document.body.classList.contains("dark");
          const hovers  = dark ? mapHoverDark  : mapHover;
          const strokes = dark ? mapStrokeDark : mapStroke;
          d3mod.selectAll(`[data-id="${id}"]`)
            .attr("fill", hovers[s]  || hovers.todo)
            .attr("stroke", strokes[s] || strokes.todo)
            .attr("stroke-width", 1.2);
        })
        .on("mousemove", moveTooltip)
        .on("mouseleave", () => {
          hideTooltip();
          applyColorById(id);
          d3mod.selectAll(`[data-id="${id}"]`).attr("stroke", "transparent").attr("stroke-width", 0);
        })
        .on("click", () => openPanel(id, name))
        .on("contextmenu", function(event) { showCtxMenu(event, id, name); });
    });
  });

  const zoom = d3mod.zoom()
    .scaleExtent([0.8, 14])
    .on("zoom", event => {
      const { x, y, k } = event.transform;
      const sW = MAP_W * k;
      const nx = ((x % sW) + sW) % sW;

      const minY = mapH - k * SOUTH_Y;
      const maxY = -k * NORTH_Y;
      let ty;
      if (minY > maxY) {
        ty = mapH / 2 - k * MAP_CENTER_Y;
      } else {
        ty = Math.max(minY, Math.min(maxY, y));
      }

      copies.forEach(({ g: copyG, col }) => {
        copyG.attr("transform", `translate(${nx + col * sW}, ${ty}) scale(${k})`);
      });
      svg.selectAll(".microstate").attr("r", 3.5 / k).attr("stroke-width", 0.8 / k);
    });

  zoomBeh = zoom;
  svg.call(zoom).on("dblclick.zoom", null);
  svg.call(zoom.transform, d3mod.zoomIdentity);

  document.getElementById("zoom-in").addEventListener("click", () =>
    svg.transition().duration(250).call(zoom.scaleBy, 1.6));
  document.getElementById("zoom-out").addEventListener("click", () =>
    svg.transition().duration(250).call(zoom.scaleBy, 0.625));
  document.getElementById("zoom-reset").addEventListener("click", () =>
    svg.transition().duration(400).call(zoom.transform, d3mod.zoomIdentity));

  document.getElementById("map-loading").remove();
  applyColors();
  initSearch();
  // Fade-in cinématique des pays
  requestAnimationFrame(() => setTimeout(() => {
    document.getElementById("countries-group").classList.add("loaded");
  }, 60));
}

// Zoom vers un pays depuis la recherche
function zoomToCountry(id) {
  const ll = countryCentroids[id];
  if (!ll || !svgSel || !zoomBeh || !projFn || !d3lib) return;
  const [px, py] = projFn(ll);
  const k = 5;
  svgSel.transition().duration(700).call(
    zoomBeh.transform,
    d3lib.zoomIdentity.translate(mapW / 2 - k * px, mapH / 2 - k * py).scale(k)
  );
}

// ── Couleurs ──────────────────────────────────────────────────────────────────
function applyColorToEl(el, id) {
  const s = allData[id]?.status || null;
  const filtered = s && !activeFilters.has(s);
  const dark = document.body.classList.contains("dark");
  const fills = dark ? mapFillDark : mapFill;
  el.setAttribute("fill", filtered ? (dark ? "#111827" : "#e8e8e4") : (fills[s] || fills.todo));
  el.style.opacity = filtered ? "0.3" : "1";
}
function applyColorById(id) {
  document.querySelectorAll(`[data-id="${id}"]`).forEach(el => applyColorToEl(el, id));
}
function applyColors() {
  document.querySelectorAll("[data-id]").forEach(el =>
    applyColorToEl(el, el.getAttribute("data-id")));
}

function updateStats() {
  const TOTAL = 241;
  const v = Object.values(allData);
  const counts = {
    wip:    v.filter(x => x.status === "wip").length,
    script: v.filter(x => x.status === "script").length,
    done:   v.filter(x => x.status === "done").length,
  };
  const annotated = counts.wip + counts.script + counts.done;

  document.getElementById("cnt-wip").textContent    = counts.wip;
  document.getElementById("cnt-script").textContent = counts.script;
  document.getElementById("cnt-done").textContent   = counts.done;

  const lbl = document.getElementById("progress-label");
  if (lbl) lbl.textContent = `${annotated} / ${TOTAL}`;

  const bar = document.getElementById("progress-bar");
  if (bar) {
    bar.innerHTML = [
      ["wip", counts.wip], ["script", counts.script], ["done", counts.done]
    ].map(([s, n]) => n > 0
      ? `<span class="pb-${s}" style="width:${n / TOTAL * 100}%"></span>` : ""
    ).join("");
  }
}

// ── Recherche ─────────────────────────────────────────────────────────────────
function initSearch() {
  const input   = document.getElementById("search-input");
  const results = document.getElementById("search-results");

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.classList.remove("open"); return; }

    const matches = Object.entries(NAME_MAP)
      .filter(([, name]) => name.toLowerCase().includes(q))
      .sort((a, b) => {
        const al = a[1].toLowerCase().startsWith(q) ? 0 : 1;
        const bl = b[1].toLowerCase().startsWith(q) ? 0 : 1;
        return al - bl || a[1].localeCompare(b[1], "fr");
      })
      .slice(0, 8);

    if (!matches.length) { results.classList.remove("open"); return; }

    results.innerHTML = matches.map(([id, name]) => {
      const s = allData[id]?.status || "todo";
      return `<div class="sr-item" data-id="${id}">
        <span class="sr-dot" style="background:${mapFill[s]}"></span>${name}
      </div>`;
    }).join("");
    results.classList.add("open");

    results.querySelectorAll(".sr-item").forEach(item => {
      item.addEventListener("click", () => {
        zoomToCountry(item.dataset.id);
        input.value = "";
        results.classList.remove("open");
      });
    });
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".search-wrap")) results.classList.remove("open");
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Escape") { input.value = ""; results.classList.remove("open"); input.blur(); }
  });
}

// ── Filtres statut ────────────────────────────────────────────────────────────
document.querySelectorAll(".fbtn").forEach(btn => {
  btn.addEventListener("click", () => {
    const f = btn.dataset.f;
    if (activeFilters.has(f)) {
      activeFilters.delete(f);
      btn.classList.remove("active");
    } else {
      activeFilters.add(f);
      btn.classList.add("active");
    }
    applyColors();
  });
});

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
  document.getElementById("panel-status-label").textContent = statusLabel[status] || "À explorer";
}

function openPanel(id, name) {
  selectedId = id; selectedName = name;
  const entry = allData[id] || {};
  document.getElementById("panel-name").textContent       = name;
  document.getElementById("panel-artist").value           = entry.artist   || "";
  document.getElementById("panel-category").value         = entry.category || "";
  document.getElementById("panel-note").value             = entry.note     || "";
  currentStatus      = entry.status && entry.status !== "todo" ? entry.status : null;
  currentLinks       = entry.links  || [];
  currentArtistPhoto = entry.artistPhoto || "";
  document.getElementById("artist-suggestions").classList.add("hidden");
  renderArtistPhoto();

  document.querySelectorAll(".sbtn").forEach(b =>
    b.classList.toggle("active", b.dataset.s === currentStatus));
  updatePanelStatusDot(currentStatus);
  renderLinks();

  document.getElementById("last-edit").textContent = entry.editedAt
    ? "Modifié le " + new Date(entry.editedAt).toLocaleDateString("fr-FR",
        { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : "";

  document.querySelectorAll(".country.selected").forEach(el => {
    el.classList.remove("selected");
    el.setAttribute("stroke", "transparent");
    el.setAttribute("stroke-width", 0);
  });
  const selStatus = allData[id]?.status || null;
  document.querySelectorAll(`[data-id="${id}"]`).forEach(el => {
    el.classList.add("selected");
    el.setAttribute("stroke", mapStroke[selStatus] || mapStroke.todo);
  });

  panel.classList.remove("hidden");
  overlay.classList.remove("hidden");
  applyColors();
  renderFloatingCountry(id);
}

function autoSave() {
  if (!selectedId) return;
  const artist   = document.getElementById("panel-artist").value.trim();
  const category = document.getElementById("panel-category").value.trim();
  const note     = document.getElementById("panel-note").value.trim();
  const hasContent = currentStatus || artist || category || note || currentLinks.length;
  if (!hasContent) {
    // Rien à sauvegarder — effacer l'entrée si elle existait
    if (allData[selectedId]) {
      delete allData[selectedId];
      set(ref(db, "countries/" + selectedId), null);
      applyColorById(selectedId); updateStats(); renderDrawer();
    }
    return;
  }
  const entry = {
    status:      currentStatus || null,
    artist, category, note,
    links:       currentLinks,
    artistPhoto: currentArtistPhoto || null,
    editedAt:    Date.now(),
    name:        selectedName
  };
  allData[selectedId] = { ...(allData[selectedId] || {}), ...entry };
  saveCountry(selectedId, allData[selectedId]);
  applyColors(); updateStats(); renderDrawer();
}

// ── Pays flottant 3D ──────────────────────────────────────────────────────────
const glowRGB = {
  todo:   { dark: "70,110,220",  light: "61,74,107"   },
  wip:    { dark: "240,160,40",  light: "196,122,16"  },
  script: { dark: "230,70,160",  light: "176,64,128"  },
  done:   { dark: "60,200,120",  light: "42,122,80"   },
};

// Couleurs de fill dédiées au float — toujours visibles quel que soit le thème
const floatFill = {
  todo:   { dark: "#7090c8", light: "#3d4a6b" },
  wip:    { dark: "#f0a020", light: "#b06e0e" },
  script: { dark: "#e858b0", light: "#a03878" },
  done:   { dark: "#48c878", light: "#256e48" },
};

// Polygone dominant par surface géographique réelle (d3.geoArea, pas besoin de projection)
// → France sans DOM-TOM, USA sans Alaska/Hawaii, Russie sans îles, etc.
function getDominantPolygon(feature) {
  if (!feature.geometry || feature.geometry.type !== "MultiPolygon") return feature;
  let best = null, bestArea = 0;
  for (const poly of feature.geometry.coordinates) {
    const f = { type: "Feature", geometry: { type: "Polygon", coordinates: poly }, properties: {} };
    const area = d3lib.geoArea(f);
    if (area > bestArea) { bestArea = area; best = poly; }
  }
  return best
    ? { ...feature, geometry: { type: "Polygon", coordinates: best } }
    : feature;
}

function renderFloatingCountry(id) {
  const floatEl = document.getElementById("country-shape-area");
  const feature = geoFeatures.find(f => String(f.id).padStart(3, "0") === id);
  if (!feature || !d3lib) { floatEl.classList.remove("loaded"); return; }

  const RENDER = 1200, PAD = 56;
  let dStr, viewBox;
  try {
    // 1. Polygone dominant (surface géo réelle → pas besoin de projection)
    const main = getDominantPolygon(feature);

    // 2. Centroïde géographique du polygone principal
    const [cLon, cLat] = d3lib.geoCentroid(main);

    // 3. Projection adaptée :
    //    - Pôles (|lat| > 75°) → azimutale centrée sur le pôle (Antarctique, Groenland…)
    //    - Autres → NaturalEarth1 pivotée sur la longitude → élimine le problème antiméridien (Russie…)
    let proj;
    if (Math.abs(cLat) > 75) {
      proj = d3lib.geoAzimuthalEqualArea()
        .rotate([0, cLat > 0 ? -90 : 90])
        .fitSize([RENDER, RENDER], main);
    } else {
      proj = d3lib.geoNaturalEarth1()
        .rotate([-cLon, 0])
        .fitSize([RENDER, RENDER], main);
    }

    const pathFn = d3lib.geoPath(proj);
    dStr = pathFn(main);
    const [[x0, y0], [x1, y1]] = pathFn.bounds(main);
    if (!isFinite(x0) || x1 <= x0 || y1 <= y0) throw new Error("invalid bounds");
    viewBox = `${x0 - PAD} ${y0 - PAD} ${x1 - x0 + PAD * 2} ${y1 - y0 + PAD * 2}`;
  } catch(e) { floatEl.classList.remove("loaded"); return; }
  if (!dStr || dStr.length < 6) { floatEl.classList.remove("loaded"); return; }

  const SVG = 150;
  const s    = allData[id]?.status || null;
  const dark = document.body.classList.contains("dark");
  const fill = (floatFill[s || "todo"] || floatFill.todo)[dark ? "dark" : "light"];
  const rgb  = (glowRGB[s || "todo"] || glowRGB.todo)[dark ? "dark" : "light"];

  floatEl.innerHTML = `
    <svg viewBox="${viewBox}" width="${SVG}" height="${SVG}" xmlns="http://www.w3.org/2000/svg">
      <path d="${dStr}" fill="${fill}"/>
    </svg>`;

  floatEl.classList.remove("loaded");
  void floatEl.offsetWidth;
  floatEl.classList.add("loaded");
}

function closePanel() {
  autoSave();
  document.getElementById("country-shape-area").classList.remove("loaded");
  document.querySelectorAll(".country.selected").forEach(el => {
    el.classList.remove("selected");
    el.setAttribute("stroke", "transparent");
    el.setAttribute("stroke-width", 0);
  });
  panel.classList.add("hidden"); overlay.classList.add("hidden");
  selectedId = null; applyColors();
}

document.getElementById("panel-close").addEventListener("click", closePanel);
overlay.addEventListener("click", closePanel);

document.querySelectorAll(".sbtn[data-s]").forEach(btn => {
  btn.addEventListener("click", () => {
    currentStatus = btn.dataset.s;
    document.querySelectorAll(".sbtn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    updatePanelStatusDot(currentStatus);
    autoSave();
  });
});

document.getElementById("status-clear").addEventListener("click", () => {
  currentStatus = null;
  document.querySelectorAll(".sbtn").forEach(b => b.classList.remove("active"));
  updatePanelStatusDot(null);
  autoSave();
});

document.getElementById("panel-save").addEventListener("click", () => {
  if (!selectedId) return;
  autoSave();
  const btn = document.getElementById("panel-save");
  btn.textContent = "Enregistré ✓"; btn.classList.add("saved");
  setTimeout(() => { btn.textContent = "Enregistrer"; btn.classList.remove("saved"); }, 2000);
});

// ── Raccourcis clavier ────────────────────────────────────────────────────────
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (!panel.classList.contains("hidden")) { closePanel(); return; }
    const drawer = document.getElementById("list-drawer");
    if (!drawer.classList.contains("hidden")) drawer.classList.add("hidden");
  }
  if (e.key === "Enter" && !panel.classList.contains("hidden") && e.target.tagName !== "TEXTAREA") {
    e.preventDefault();
    document.getElementById("panel-save").click();
  }
});

// ── Menu contextuel clic droit ────────────────────────────────────────────────
const ctxMenu = document.getElementById("ctx-menu");

function showCtxMenu(event, id, name) {
  event.preventDefault();
  ctxMenu.dataset.id   = id;
  ctxMenu.dataset.name = name;
  // Positionner en évitant les bords
  const x = Math.min(event.clientX, window.innerWidth  - 180);
  const y = Math.min(event.clientY, window.innerHeight - 160);
  ctxMenu.style.left = x + "px";
  ctxMenu.style.top  = y + "px";
  ctxMenu.classList.remove("hidden");
}

document.addEventListener("click",       () => ctxMenu.classList.add("hidden"));
document.addEventListener("contextmenu", e => {
  if (!e.target.closest(".country")) ctxMenu.classList.add("hidden");
});

ctxMenu.querySelectorAll(".ctx-item[data-s]").forEach(item => {
  item.addEventListener("click", e => {
    e.stopPropagation();
    const id   = ctxMenu.dataset.id;
    const name = ctxMenu.dataset.name;
    const s    = item.dataset.s;
    const entry = allData[id] || {};
    allData[id] = { ...entry, status: s, editedAt: Date.now(), name };
    saveCountry(id, allData[id]);
    applyColorById(id); updateStats(); renderDrawer();
    ctxMenu.classList.add("hidden");
  });
});

document.getElementById("ctx-clear").addEventListener("click", e => {
  e.stopPropagation();
  const id   = ctxMenu.dataset.id;
  if (allData[id]) {
    delete allData[id];
    set(ref(db, "countries/" + id), null);
    applyColorById(id); updateStats(); renderDrawer();
  }
  ctxMenu.classList.add("hidden");
});

document.getElementById("ctx-open").addEventListener("click", e => {
  e.stopPropagation();
  const id   = ctxMenu.dataset.id;
  const name = ctxMenu.dataset.name;
  ctxMenu.classList.add("hidden");
  openPanel(id, name);
});

// ── Artist photo picker ───────────────────────────────────────────────────────
function renderArtistPhoto() {
  const sel      = document.getElementById("artist-photo-selected");
  const heroEl   = document.getElementById("country-hero");
  const photoDiv = document.getElementById("hero-artist-photo");
  const img      = document.getElementById("hero-artist-img");
  if (currentArtistPhoto) {
    img.src = currentArtistPhoto;
    sel.classList.remove("hidden");
    photoDiv.classList.remove("hidden");
    heroEl.classList.add("has-photo");
  } else {
    sel.classList.add("hidden");
    heroEl.classList.remove("has-photo");
    setTimeout(() => { if (!currentArtistPhoto) photoDiv.classList.add("hidden"); }, 400);
  }
}

function deezerJSONP(query) {
  return new Promise((resolve, reject) => {
    const cb = "__dz_" + Date.now();
    const s  = document.createElement("script");
    s.src = `https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=10&output=jsonp&callback=${cb}`;
    const cleanup = () => { delete window[cb]; s.remove(); };
    window[cb] = data => { cleanup(); resolve(data); };
    s.onerror  = ()   => { cleanup(); reject(); };
    setTimeout(()     => { cleanup(); reject(); }, 6000);
    document.head.appendChild(s);
  });
}

async function searchArtistImages(query) {
  const sug   = document.getElementById("artist-suggestions");
  const inner = document.getElementById("artist-sug-inner");
  inner.innerHTML = '<span class="sug-msg">Recherche…</span>';
  sug.classList.remove("hidden");
  try {
    const data = await deezerJSONP(query);
    // Filtrer les artistes sans vraie photo (placeholder Deezer = chemin vide "/artist//")
    const photos = (data.data || [])
      .filter(a => a.picture_big && !a.picture_big.includes("/artist//"))
      .slice(0, 8)
      .map(a => ({ src: a.picture_big, srcHero: a.picture_xl || a.picture_big, title: a.name }));

    if (!photos.length) { inner.innerHTML = '<span class="sug-msg">Aucun résultat Deezer</span>'; return; }

    inner.innerHTML = photos.map(p =>
      `<img src="${p.src}" alt="${p.title.replace(/"/g,'&quot;')}" title="${p.title.replace(/"/g,'&quot;')}" />`
    ).join("");

    inner.querySelectorAll("img").forEach((img, i) => {
      img.addEventListener("click", () => {
        currentArtistPhoto = photos[i].srcHero;
        renderArtistPhoto();
        sug.classList.add("hidden");
      });
    });
  } catch(e) {
    inner.innerHTML = '<span class="sug-msg">Erreur de chargement</span>';
  }
}

document.getElementById("panel-artist").addEventListener("input", e => {
  clearTimeout(artistDebounceTimer);
  const q = e.target.value.trim();
  if (!q) { document.getElementById("artist-suggestions").classList.add("hidden"); return; }
  artistDebounceTimer = setTimeout(() => searchArtistImages(q), 650);
});

document.getElementById("artist-photo-clear").addEventListener("click", () => {
  currentArtistPhoto = "";
  renderArtistPhoto();
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

// ── Drawer groupé par continent ───────────────────────────────────────────────
const drawer = document.getElementById("list-drawer");
document.getElementById("list-toggle-btn").addEventListener("click", () => {
  drawer.classList.toggle("hidden"); renderDrawer();
});
document.getElementById("drawer-close").addEventListener("click", () =>
  drawer.classList.add("hidden"));

const CONTINENT_ORDER = ["Afrique", "Amér. Nord", "Amér. Sud", "Asie", "Europe", "Océanie", "Autres"];
const STATUS_ORDER = { done: 0, script: 1, wip: 2, todo: 3 };

function renderDrawer() {
  const body = document.getElementById("drawer-body");
  const entries = Object.entries(allData).filter(([, v]) => v?.name);
  if (!entries.length) {
    body.innerHTML = '<p style="padding:1rem 1.5rem;font-size:13px;color:#aaa">Aucun pays annoté.</p>';
    return;
  }

  entries.sort((a, b) =>
    (STATUS_ORDER[a[1].status || "todo"] ?? 3) - (STATUS_ORDER[b[1].status || "todo"] ?? 3));

  const byContinent = {};
  entries.forEach(([id, v]) => {
    const c = CONTINENT[id] || "Autres";
    if (!byContinent[c]) byContinent[c] = [];
    byContinent[c].push([id, v]);
  });

  let html = "";
  CONTINENT_ORDER.forEach(c => {
    if (!byContinent[c]) return;
    html += `<div class="drawer-continent">${c} <span style="font-weight:400;opacity:0.7">(${byContinent[c].length})</span></div>`;
    html += byContinent[c].map(([id, v]) => `
      <div class="ditem" data-id="${id}" data-name="${(v.name || id).replace(/"/g, "&quot;")}">
        <div class="d-dot" style="background:${statusColor[v.status || "todo"]}"></div>
        <div>
          <div class="d-name">${v.name || id}</div>
          ${v.artist   ? `<div class="d-artist">${v.artist}</div>`   : ""}
          ${v.category ? `<div class="d-cat">${v.category}</div>` : ""}
        </div>
      </div>`).join("");
  });

  body.innerHTML = html;
  body.querySelectorAll(".ditem").forEach(el =>
    el.addEventListener("click", () => {
      drawer.classList.add("hidden");
      openPanel(el.dataset.id, el.dataset.name);
    }));
}

function initApp() { listenToData(); loadMap(); }
