// -------------------- APP STATE --------------------

let players = [];
let corps = [];

// -------------------- FILTER --------------------

function getAvailableYears(games) {
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
        renderApp();
    };
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

    filteredGames = sortGamesByTimestamp(filteredGames);
}

// -------------------- TABLES --------------------

function buildTable(id, data) {
    const tbody = document.querySelector(`#${id} tbody`);
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!data.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="color:#666;">Ingen data for valgt filter</td>
            </tr>
        `;
        return;
    }

    data.forEach((x, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${x.name} ${x.streak >= 2 ? "🔥" + x.streak : ""}</td>
            <td>${x.rating.toFixed(1)}</td>
            <td>${x.games}</td>
            <td>${x.wins}</td>
        `;
        tbody.appendChild(tr);
    });
}

// -------------------- RENDER --------------------

function renderApp() {
    const ranking = buildRankings(filteredGames);
    players = ranking.players;
    corps = ranking.corps;

    buildTable("statsTable", players);
    buildTable("corpTable", corps);
    renderCharts(players, corps);
}

function refreshApp() {
    rebuildAllGames();

    const years = getAvailableYears(allGames);
    const selected = localStorage.getItem(SELECTED_YEAR_KEY) || "all";

    if (selected !== "all" && !years.includes(Number(selected))) {
        localStorage.setItem(SELECTED_YEAR_KEY, "all");
    }

    setupYearFilter();
    applyYearFilter();
    updateCorporationSuggestions();
    renderApp();
}

// -------------------- INIT --------------------

async function initApp() {
    try {
        await loadAllGames();
        setupEntryForm();
        setupYearFilter();
        applyYearFilter();
        updateCorporationSuggestions();
        renderApp();
    } catch (error) {
        console.error("Feil ved initialisering av appen:", error);

        const statsBody = document.querySelector("#statsTable tbody");
        const corpBody = document.querySelector("#corpTable tbody");

        if (statsBody) {
            statsBody.innerHTML = `
                <tr>
                    <td colspan="5" style="color:red;">Kunne ikke laste data.</td>
                </tr>
            `;
        }

        if (corpBody) {
            corpBody.innerHTML = `
                <tr>
                    <td colspan="5" style="color:red;">Kunne ikke laste data.</td>
                </tr>
            `;
        }
    }
}

initApp();

console.log("app.js lastet");