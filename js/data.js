// -------------------- VARIABLES --------------------

const LOCAL_GAMES_KEY = "tm_local_games";
const SELECTED_YEAR_KEY = "selectedYear";

let baseGames = [];
let localGames = [];
let allGames = [];
let filteredGames = [];

function parseDate(value) {
    if (!value) return null;

    const d = new Date(String(value).replace(" ", "T"));
    // console.log(`Date parsed: ${Number.isNaN(d.getTime()) ? null : d}`); 
    return Number.isNaN(d.getTime()) ? null : d;
}

function parsePoints(value) {
    if (value === null || value === undefined) return NaN;
    // console.log(`Points parsed: ${Number(String(value).trim().replace(",", "."))}`); 
    return Number(String(value).trim().replace(",", "."));
}

function sortGamesByTimestamp(games) {
    console.log(`Games sorted by timestamp`); 
    return [...games].sort((a, b) => {
        const da = parseDate(a?.[0]?.timestamp);
        const db = parseDate(b?.[0]?.timestamp);

        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;

        return da - db;
    });
}

// -------------------- LOAD GAMES --------------------
// ------- Parse csv -------
async function loadCsvData() {
    const response = await fetch("data/games.csv");

    if (!response.ok) {
        throw new Error(`Kunne ikke laste data/games.csv (${response.status})`);
    }

    const csvText = await response.text();
    console.log(`CSV loaded`);
    return csvText.trim();
}

function parseCsvToGames(csvText) {
    const rows = csvText.split(/\r?\n/).slice(1); // hopper over header
    const gamesByTimestamp = {};

    rows.forEach(row => {
        if (!row.trim()) return;

        const parts = row.split(";");
        if (parts.length < 4) return;

        const [timestampRaw, playerRaw, corpRaw, pointsRaw] = parts;

        const timestamp = timestampRaw.trim();
        const player = playerRaw.trim();
        const corporation = corpRaw.trim();
        const points = parsePoints(pointsRaw);

        if (!timestamp || !player || !corporation || Number.isNaN(points)) {
            return;
        }

        if (!gamesByTimestamp[timestamp]) {
            gamesByTimestamp[timestamp] = [];
        }

        gamesByTimestamp[timestamp].push({
            player,
            corporation,
            points,
            timestamp,
            source: "server"
        });
    });

    console.log(`CSV parsed`);
    return Object.values(gamesByTimestamp);
}


// ------- Parse local storage -------
function loadLocalGames() {
    try {
        const raw = localStorage.getItem(LOCAL_GAMES_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        console.log(`Local games loaded`);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn("Kunne ikke lese lokale spill fra localStorage.", error);
        return [];
    }
}


// ------- Load games -------
async function loadAllGames() {
    const csvText = await loadCsvData();
    baseGames = parseCsvToGames(csvText);
    localGames = loadLocalGames();
    allGames = sortGamesByTimestamp([...baseGames, ...localGames]);
    console.log(`Games loaded`);
}


// -------------------- ENTRY FORM --------------------

function getAllCorporations(games) {
    console.log(`Listed all corporations`);
    return [...new Set(
        games.flatMap(game =>
            game.map(player => player.corporation).filter(Boolean)
        )
    )].sort((a, b) => a.localeCompare(b, "no"));
}

function updateCorporationSuggestions() {
    const datalist = document.getElementById("corporationSuggestions");
    if (!datalist) return;

    const corporations = getAllCorporations(allGames);

    datalist.innerHTML = corporations
        .map(corp => `<option value="${corp}"></option>`)
        .join("");
    console.log(`Created corporation suggestions list`);
}

function getAllPlayers(games) {
    console.log(`Listed all players`);
    return [...new Set(
        games.flatMap(game =>
            game.map(player => player.player).filter(Boolean)
        )
    )].sort((a, b) => a.localeCompare(b, "no"));
}

function updatePlayerSuggestions() {
    const datalist = document.getElementById("playerSuggestions");
    if (!datalist) return;

    const players = getAllPlayers(allGames);

    datalist.innerHTML = players
        .map(player => `<option value="${player}"></option>`)
        .join("");
    console.log(`Created player suggestions list`);
}

function resetEntryForm() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

    const timestampInput = document.getElementById("timestamp");
    if (timestampInput) {
        timestampInput.value = now.toISOString().slice(0, 16);
    }

    const rows = document.querySelectorAll("#entryBody tr");

    rows.forEach(row => {
        const corpInput = row.querySelector(".corp");
        const pointsInput = row.querySelector(".points");

        if (corpInput) corpInput.value = "";
        if (pointsInput) pointsInput.value = "";
    });
    console.log(`Entry form resetted`);
}

function addPlayerRow(player = "", corp = "", points = "") {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td><input class="player" list="playerSuggestions" value="${player}"></td>
        <td><input class="corp" list="corporationSuggestions" value="${corp}"></td>
        <td><input class="points" type="number" step="0.1" value="${points}"></td>
        <td>
            <button type="button" class="icon-btn" onclick="this.closest('tr').remove()">❌</button>
        </td>
    `;

    document.getElementById("entryBody").appendChild(row);
    console.log(`Player field added to entry form`);
}

function setupEntryForm() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

    const timestampInput = document.getElementById("timestamp");
    if (timestampInput) {
        timestampInput.value = now.toISOString().slice(0, 16);
    }

    const entryBody = document.getElementById("entryBody");
    if (entryBody && !entryBody.children.length) {
        addPlayerRow("Alexander");
        addPlayerRow("Nhat");
        addPlayerRow("Paul");
        addPlayerRow("Anton");
    }
    console.log(`Entry form setup complete`);
}

function saveLocalGames() {
    localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(localGames));
    console.log(`Game saved to local storage`);
}

function addGame() {
    const timestamp = String(document.getElementById("timestamp")?.value || "").trim();

    if (!timestamp) {
        alert("Velg dato/tid");
        return;
    }

    const rows = document.querySelectorAll("#entryBody tr");
    const game = [];

    rows.forEach(row => {
        const player = row.querySelector(".player")?.value.trim();
        const corporation = row.querySelector(".corp")?.value.trim();
        const pointsRaw = row.querySelector(".points")?.value.trim();
        const points = parsePoints(pointsRaw);

        if (!player || !corporation || pointsRaw === "" || Number.isNaN(points)) {
            return;
        }

        game.push({
            player,
            corporation,
            points,
            timestamp,
            source: "local"
        });
    });

    if (game.length < 2) {
        alert("Minst to spillere må registreres");
        return;
    }

    localGames.push(game);
    localGames = sortGamesByTimestamp(localGames);
    saveLocalGames();
    
    // Refresh data and reset form
    allGames = sortGamesByTimestamp([...baseGames, ...localGames]); 
    renderPage();
    resetEntryForm();

    console.log(`Game added`);
}


// -------------------- RESET LOCAL DATA --------------------

function resetLocalData() {
    if (!confirm("Er du sikker? Alle lokalt lagrede spill slettes.")) {
        return;
    }

    localStorage.removeItem(LOCAL_GAMES_KEY);
    localStorage.removeItem(SELECTED_YEAR_KEY);

    localGames = []; 
    console.log(`Local storage reset`);
    renderPage();
}


// -------------------- COPY LOCAL DATA --------------------

async function copyLocalData() {
    try {
        const clipboardText = localGames
            .map(gameSession =>
                gameSession
                    .map(game =>
                        `${game.timestamp};${game.player};${game.corporation};${game.points}`
                    )
                    .join("\n")
            )
            .join("\n\n");

        await navigator.clipboard.writeText(clipboardText);

        alert("Spillene er kopiert til utklippstavlen.");
    } catch (err) {
        console.error(err);
        alert("Kunne ikke kopiere spillene.");
    }
}


// -------------------- FILTER --------------------

function getAvailableYears(games) {
    console.log(`Listed all years`);
    return [...new Set(
        games
            .map(g => g?.[0]?.timestamp)
            .filter(Boolean)
            .map(ts => parseDate(ts))
            .filter(d => d instanceof Date && !Number.isNaN(d.getTime()))
            .map(d => d.getFullYear())
    )].sort((a, b) => a - b);
}

function setupYearFilter() {
    const select = document.getElementById("yearFilter");
    if (!select) return;

    const years = getAvailableYears(allGames);

    select.innerHTML =
        '<option value="all">Totalt</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join("");

    const selected = localStorage.getItem(SELECTED_YEAR_KEY) || "all";
    select.value =
        selected === "all" || years.includes(Number(selected))
            ? selected
            : "all";

    select.onchange = () => {
        localStorage.setItem(SELECTED_YEAR_KEY, select.value);
        applyYearFilter();
    };
    console.log(`Filter setup complete`);
}

function applyYearFilter() {
    const select = document.getElementById("yearFilter");
    const selectedYear = select?.value || "all";

    filteredGames = selectedYear === "all"
        ? [...allGames]
        : allGames.filter(game => {
            const d = parseDate(game?.[0]?.timestamp);
            return d && String(d.getFullYear()) === selectedYear;
        });

    renderPage();
    console.log(`Games filtered by year`);
}