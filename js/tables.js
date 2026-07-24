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
    console.log(`${id} built`);
}


function buildList(id, data) {
    const tbody = document.querySelector(`#${id} tbody`);
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!data.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="color:#666;">Ingen data funnet</td>
            </tr>
        `;
        return;
    }

    data.forEach(game => {
        const tr = document.createElement("tr");

        const timestamp = game?.[0]?.timestamp || "";
        const dateOnly = timestamp ? timestamp.split("T")[0] : "";

        // Ranking points
        const sortedGame = [...game].sort((a, b) => b.points - a.points);
        const n = sortedGame.length;

        sortedGame.forEach((p, i) => {
            p.rating = calculateBayesianRating(n, i);
        });

        // Finn høyeste poengsum
        const maxPoints = Math.max(...game.map(p => p.points));

        const gameData = sortedGame
//            .map(p => `${p.player} (${p.points} - ${p.corporation})`)
            .map(p => {                
                const crown = p.points === maxPoints ? "🏆" : "";
                return `${crown}${p.player} ${p.rating} (${p.points}p - ${p.corporation})`;
                // return `${crown}${p.player} ${p.rating}`;
                })
            .join(", ");
            // .join(" <br>");

        tr.innerHTML = `
            <td>${dateOnly}</td>
            <td>${gameData}</td>
        `;

        tbody.appendChild(tr);
    });
    console.log(`${id} built`);
}