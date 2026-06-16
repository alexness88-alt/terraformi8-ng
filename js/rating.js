// -------------------- STATS --------------------
const playerStats = {};
const corpStats = {};

function processGames() {
    filteredGames.forEach(game => {
        const sortedGame = [...game].sort((a, b) => b.points - a.points);
        const n = sortedGame.length;

        sortedGame.forEach((p, i) => {
            const perf = n === 1 ? 100 : ((n - (i + 1)) / (n - 1)) * 100;

            if (!playerStats[p.player]) {
                playerStats[p.player] = { perf: [], wins: 0 };
            }

            playerStats[p.player].perf.push(perf);
            if (i === 0) playerStats[p.player].wins++;

            if (!corpStats[p.corporation]) {
                corpStats[p.corporation] = { perf: [], wins: 0 };
            }

            corpStats[p.corporation].perf.push(perf);
            if (i === 0) corpStats[p.corporation].wins++;
        });
    });
}

processGames();

// -------------------- STREAKS --------------------
function buildPlayerStreaks(games) {
    const streaks = {};
    const players = new Set();

    games.forEach(game => {
        game.forEach(p => players.add(p.player));
    });

    players.forEach(player => {
        let streak = 0;

        for (let i = games.length - 1; i >= 0; i--) {
            const sortedGame = [...games[i]].sort((a, b) => b.points - a.points);
            const participant = sortedGame.find(p => p.player === player);

            if (!participant) continue;

            const winner = sortedGame[0]?.player;
            if (winner === player) {
                streak++;
            } else {
                break;
            }
        }

        streaks[player] = streak;
    });

    return streaks;
}

function buildCorporationStreaks(games) {
    const streaks = {};
    const corporations = new Set();

    games.forEach(game => {
        game.forEach(p => corporations.add(p.corporation));
    });

    corporations.forEach(corp => {
        let streak = 0;

        for (let i = games.length - 1; i >= 0; i--) {
            const sortedGame = [...games[i]].sort((a, b) => b.points - a.points);
            const participant = sortedGame.find(p => p.corporation === corp);

            if (!participant) continue;

            const winnerCorp = sortedGame[0]?.corporation;
            if (winnerCorp === corp) {
                streak++;
            } else {
                break;
            }
        }

        streaks[corp] = streak;
    });

    return streaks;
}

const playerStreaks = buildPlayerStreaks(filteredGames);
const corpStreaks = buildCorporationStreaks(filteredGames);


// -------------------- RANKING --------------------
function calculateRank(stats, streaks) {
    const out = [];
    const PRIOR_RATING = 50;
    const PRIOR_GAMES = 6;
//    const PRIOR_GAMES = Math.max(3,Math.round(filteredGames.length * 0.5));
    console.log("Bayanesian prior games:", PRIOR_GAMES);
    console.log("Total games:", filteredGames.length);
    
    Object.entries(stats).forEach(([name, d]) => {
        if (!d.perf.length) return;

        const avg = d.perf.reduce((a, b) => a + b, 0) / d.perf.length;
        const rating =
            (avg * d.perf.length + PRIOR_RATING * PRIOR_GAMES) /
            (d.perf.length + PRIOR_GAMES);
        const uncertantyrating =
            (avg * d.perf.length + PRIOR_RATING * (filteredGames.length - d.perf.length)) /
            (filteredGames.length);

        out.push({
            name,
            rating,
            games: d.perf.length,
            wins: d.wins,
            streak: streaks[name] || 0
        });
    });

    return out.sort((a, b) => b.rating - a.rating);
}

const players = calculateRank(playerStats, playerStreaks);
const corps = calculateRank(corpStats, corpStreaks);

