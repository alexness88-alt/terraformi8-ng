// -------------------- FILTER --------------------
function setupYearFilter() {
    const select = document.getElementById("yearFilter");

    const years = [...new Set(
        allGames
            .map(g => g?.[0]?.timestamp)
            .filter(Boolean)
            .map(ts => parseDate(ts))
            .filter(d => d instanceof Date && !Number.isNaN(d.getTime()))
            .map(d => d.getFullYear())
    )].sort((a, b) => a - b);

    select.innerHTML =
        '<option value="all">Totalt</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join("");

    const selected = localStorage.getItem("selectedYear") || "all";
    select.value = years.includes(Number(selected)) || selected === "all" ? selected : "all";

    filteredGames = select.value === "all"
        ? [...allGames]
        : allGames.filter(g => {
            const d = parseDate(g?.[0]?.timestamp);
            if (!d || Number.isNaN(d.getTime())) return false;
            return d.getFullYear().toString() === select.value;
        });

    select.addEventListener("change", () => {
        localStorage.setItem("selectedYear", select.value);
        location.reload();
    });
}

setupYearFilter();


// -------------------- SORT GAMES --------------------
filteredGames.sort((a, b) => {
    const da = parseDate(a?.[0]?.timestamp);
    const db = parseDate(b?.[0]?.timestamp);
    return da - db;
});


// -------------------- BUILD TABLES --------------------
function buildTable(id, data) {
    const tbody = document.querySelector(`#${id} tbody`);
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!data.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td colspan="5" style="color:#666;">Ingen data for valgt filter</td>
        `;
        tbody.appendChild(tr);
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

buildTable("statsTable", players);
buildTable("corpTable", corps);