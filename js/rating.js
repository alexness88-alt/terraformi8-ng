// -------------------- STATS --------------------

function calculateRatingPoints(playerCount, position) {
    if (playerCount === 1) {
        return 100;
    }

    const expansion = (playerCount - 2) * 6.25;
    const min = Math.max(0, 25 - expansion);
    const max = Math.min(100, 75 + expansion);

    return Number(
        max - (position / (playerCount - 1)) * (max - min)
    );
}


function processGames(games) {
    const playerStats = {};
    const corpStats = {};

    games.forEach(game => {
        const sortedGame = [...game].sort((a, b) => b.points - a.points);
        const n = sortedGame.length;

        sortedGame.forEach((p, i) => {
            const perf = calculateRatingPoints(n, i);

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

    console.log("Games processed");
    return { playerStats, corpStats };
}

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

            if (sortedGame[0]?.player === player) {
                streak++;
            } else {
                break;
            }
        }

        streaks[player] = streak;
    });

    console.log("Player streak stats built");
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

            if (sortedGame[0]?.corporation === corp) {
                streak++;
            } else {
                break;
            }
        }

        streaks[corp] = streak;
    });
    console.log("Corp streak stats built");

    return streaks;
}

// -------------------- RANKING --------------------

function calculateRank(stats, streaks) {
    const out = [];
    const PRIOR_RATING = 50;
    const PRIOR_GAMES = 6;

    Object.entries(stats).forEach(([name, d]) => {
        if (!d.perf.length) return;

        const avg = d.perf.reduce((a, b) => a + b, 0) / d.perf.length;

        const rating =
            (avg * d.perf.length + PRIOR_RATING * PRIOR_GAMES) /
            (d.perf.length + PRIOR_GAMES);

        out.push({
            name,
            rating,
            games: d.perf.length,
            wins: d.wins,
            streak: streaks[name] || 0
        });
    });

    console.log("Rank calculated");
    return out.sort((a, b) => b.rating - a.rating);
}

function buildRankings(games) {
    const { playerStats, corpStats } = processGames(games);

    const playerStreaks = buildPlayerStreaks(games);
    const corpStreaks = buildCorporationStreaks(games);

    console.log("Ranking built");
    return {
        players: calculateRank(playerStats, playerStreaks),
        corps: calculateRank(corpStats, corpStreaks)
    };
}