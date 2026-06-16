// -------------------- HELPERS --------------------
function parseDate(value) {
    if (!value) return null;
    return new Date(String(value).replace(" ", "T"));
}

function parsePoints(value) {
    if (value === null || value === undefined) return NaN;
    return Number(String(value).trim().replace(",", "."));
}

function formatTimestampForStorage(value) {
    return String(value || "").trim();
}

// -------------------- LOAD --------------------
// async function loadCsvData() {
//     const response = await fetch("data/games.csv");
//     return await response.text();
// }

let rankingChartInstance = null;
let corpChartInstance = null;

function loadGames() {
    try {
        const local = localStorage.getItem("games");
        if (local) {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn("Kunne ikke lese localStorage-data. Faller tilbake til CSV.", e);
    }

    const csv = document.getElementById("csv-data").textContent.trim();
    const rows = csv.split("\n").slice(1); // hopper over header

    const gamesByTimestamp = {};

    rows.forEach(r => {
        if (!r.trim()) return;

        const parts = r.split(";");
        if (parts.length < 4) return;

        const [timestampRaw, playerRaw, corpRaw, pointsRaw] = parts;

        const timestamp = timestampRaw.trim();
        const player = playerRaw.trim();
        const corporation = corpRaw.trim();
        const points = parsePoints(pointsRaw);

        if (!timestamp || !player || !corporation || Number.isNaN(points)) return;

        if (!gamesByTimestamp[timestamp]) {
            gamesByTimestamp[timestamp] = [];
        }

        gamesByTimestamp[timestamp].push({
            player,
            corporation,
            points,
            timestamp
        });
    });

    return Object.values(gamesByTimestamp);
}

let allGames = loadGames();
let filteredGames = [...allGames];


// -------------------- ADD GAME --------------------
function addPlayerRow(player = "", corp = "", points = "") {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>
            <input class="player" value="${player}">
        </td>
        <td>
            <input class="corp" value="${corp}">
        </td>
        <td>
            <input class="points" type="number" step="0.1" value="${points}">
        </td>
        <td>
            <button type="button" class="icon-btn" onclick="this.closest('tr').remove()">❌</button>
        </td>
    `;

    document.getElementById("entryBody").appendChild(row);
}

function addGame() {
    const timestamp = formatTimestampForStorage(
        document.getElementById("timestamp").value
    );

    if (!timestamp) {
        alert("Velg dato/tid");
        return;
    }

    const rows = document.querySelectorAll("#entryBody tr");
    const game = [];

    rows.forEach(row => {
        const player = row.querySelector(".player").value.trim();
        const corporation = row.querySelector(".corp").value.trim();
        const pointsRaw = row.querySelector(".points").value.trim();
        const points = parsePoints(pointsRaw);

        if (!player || !corporation || pointsRaw === "" || Number.isNaN(points)) {
            return;
        }

        game.push({
            player,
            corporation,
            points,
            timestamp
        });
    });

    if (game.length < 2) {
        alert("Minst to spillere må registreres");
        return;
    }

    allGames.push(game);
    saveGames();
    location.reload();
}


// Prefill data
const now = new Date();
now.setMinutes(
    now.getMinutes() - now.getTimezoneOffset()
);

document.getElementById("timestamp").value =
    now.toISOString().slice(0, 16);


addPlayerRow("Alexander");
addPlayerRow("Nhat");
addPlayerRow("Paul");
addPlayerRow("Anton");


// -------------------- SAVE --------------------
function saveGames() {
    localStorage.setItem("games", JSON.stringify(allGames));
}


// -------------------- RESET --------------------
function resetData() {
    if (!confirm("Er du sikker? Alle lokalt lagrede spill slettes.")) {
        return;
    }

    localStorage.removeItem("games");
    localStorage.removeItem("selectedYear");
    location.reload();
}