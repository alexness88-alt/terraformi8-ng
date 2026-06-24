// -------------------- DATA / HELPERS --------------------

const LOCAL_GAMES_KEY = "tm_local_games";
const SELECTED_YEAR_KEY = "selectedYear";

let baseGames = [];
let localGames = [];
let allGames = [];
let filteredGames = [];

let rankingChartInstance = null;
let corpChartInstance = null;

function parseDate(value) {
    if (!value) return null;

    const d = new Date(String(value).replace(" ", "T"));
    return Number.isNaN(d.getTime()) ? null : d;
}

function parsePoints(value) {
    if (value === null || value === undefined) return NaN;
    return Number(String(value).trim().replace(",", "."));
}

function formatTimestampForStorage(value) {
    return String(value || "").trim();
}

function sortGamesByTimestamp(games) {
    return [...games].sort((a, b) => {
        const da = parseDate(a?.[0]?.timestamp);
        const db = parseDate(b?.[0]?.timestamp);

        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;

        return da - db;
    });
}

// -------------------- CSV --------------------

async function loadCsvData() {
    const response = await fetch("data/games.csv");

    if (!response.ok) {
        throw new Error(`Kunne ikke laste data/games.csv (${response.status})`);
    }

    const csvText = await response.text();
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

    return sortGamesByTimestamp(Object.values(gamesByTimestamp));
}

// -------------------- LOCAL STORAGE --------------------

function loadLocalGames() {
    try {
        const raw = localStorage.getItem(LOCAL_GAMES_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn("Kunne ikke lese lokale spill fra localStorage.", error);
        return [];
    }
}

function saveLocalGames() {
    localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(localGames));
}

function rebuildAllGames() {
    allGames = sortGamesByTimestamp([...baseGames, ...localGames]);
}

async function loadAllGames() {
    const csvText = await loadCsvData();
    baseGames = parseCsvToGames(csvText);
    localGames = loadLocalGames();
    rebuildAllGames();
    filteredGames = [...allGames];
}

// -------------------- ENTRY FORM --------------------

function getAllCorporations(games) {
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
}

function addPlayerRow(player = "", corp = "", points = "") {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td><input class="player" value="${player}"></td>
        <td><input class="corp" list="corporationSuggestions" value="${corp}"></td>
        <td><input class="points" type="number" step="0.1" value="${points}"></td>
        <td>
            <button type="button" class="icon-btn" onclick="this.closest('tr').remove()">❌</button>
        </td>
    `;

    document.getElementById("entryBody").appendChild(row);
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
}

function addGame() {
    const timestamp = formatTimestampForStorage(
        document.getElementById("timestamp")?.value
    );

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
    rebuildAllGames();

    if (typeof refreshApp === "function") {
        refreshApp();
    }

    resetEntryForm();

    alert("Spill lagret lokalt");
}

function resetData() {
    if (!confirm("Er du sikker? Alle lokalt lagrede spill slettes.")) {
        return;
    }

    localStorage.removeItem(LOCAL_GAMES_KEY);
    localStorage.removeItem(SELECTED_YEAR_KEY);

    localGames = [];
    rebuildAllGames();

    if (typeof refreshApp === "function") {
        refreshApp();
    }
}

console.log("data.js lastet");