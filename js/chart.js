// -------------------- VARIABLES --------------------

let rankingChartInstance = null;
let corpChartInstance = null;

const isSmallScreen = window.innerWidth < 800;


// -------------------- CHART COLORS --------------------
const playerColors = {
    "Alexander": "#59a14f",
    "Nhat": "#f28e2b",
    "Paul": "#edc948",
    "Anton": "#000000"
};

const fallbackColors = [
    "#4e79a7",
    "#e15759",
    "#76b7b2",
    "#b07aa1",
    "#ff9da7",
    "#9c755f",
    "#bab0ab",
    "#59a14f",
    "#f28e2b",
    "#edc948"
];


// -------------------- AVATARS --------------------
const avatars = {};
const defaultAvatar = new Image();
defaultAvatar.src = "images/default.png";

function getAvatar(player) {
    if (!avatars[player]) {
        const img = new Image();

        img.onload = () => {
            if (rankingChartInstance) {
                rankingChartInstance.update();
            }
        };

        img.onerror = () => {
            avatars[player] = defaultAvatar;
            if (rankingChartInstance) {
                rankingChartInstance.update();
            }
        };

        img.src = `images/${player.toLowerCase()}.png`;
        avatars[player] = img;
    console.log(`Avatar returned for ${player}`);
    }

    return avatars[player];
}

const avatarPlugin = {
    id: "avatarPlugin",

    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);

        meta.data.forEach((bar, i) => {
            const player = chart.data.labels[i];
            const img = getAvatar(player);

            if (!img || !img.complete || img.naturalWidth === 0) {
                return;
            }

            const size = Math.max(bar.width * 0.8, 24);

            ctx.save();

            ctx.beginPath();
            ctx.arc(
                bar.x,
                bar.y - size / 2 - 8,
                size / 2,
                0,
                Math.PI * 2
            );
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(
                img,
                bar.x - size / 2,
                bar.y - size - 8,
                size,
                size
            );

            ctx.restore();
        });
        
    console.log(`Drawing avatar`);
    }
    
};


// -------------------- CONFETTI --------------------
function celebrateTopBar(chart) {
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    let highestBar = meta.data[0];
    let highestValue = chart.data.datasets[0].data[0];

    meta.data.forEach((bar, i) => {
        const value = chart.data.datasets[0].data[i];
        if (value > highestValue) {
            highestValue = value;
            highestBar = bar;
        }
    });

    const canvas = chart.canvas;
    const rect = canvas.getBoundingClientRect();

    const x = (rect.left + highestBar.x) / window.innerWidth;
    const y = (rect.top + highestBar.y + 20) / window.innerHeight;

    confetti({
        particleCount: 150,
        spread: 120,
        startVelocity: 60,
        origin: { x, y }
    });
    console.log(`Confetti shot`);
}


// -------------------- BUILD CHART --------------------
function destroyCharts() {
    if (rankingChartInstance) {
        rankingChartInstance.destroy();
        rankingChartInstance = null;
    }

    if (corpChartInstance) {
        corpChartInstance.destroy();
        corpChartInstance = null;
    }
    console.log(`Charts destroyed`);
}

function buildChart(id, data, colorMap = {}, useAvatarPlugin = false) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;

    const dataset = data.slice(0, 5);
    dataset.sort((a, b) => a.name.localeCompare(b.name, "no"))

    console.log(`${id} built`);
    return new Chart(canvas, {
        type: "bar",
        plugins: useAvatarPlugin ? [avatarPlugin] : [],
        data: {
            labels: dataset.map(x => {
                if (!isSmallScreen) {return x.name;}
                if (x.name.length > 10) {return x.name.substring(0, 10) + "...";}
                return x.name;
            }),
            datasets: [{
                label: "Bayesian Rating",
                data: dataset.map(x => Number(x.rating.toFixed(1))),
                backgroundColor: dataset.map((x, i) => {
                    const key = x.name;
                    return colorMap[key] || fallbackColors[i % fallbackColors.length];
                })
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1800,
                easing: "easeOutQuart"
            },
            transitions: {
                resize: {
                    animation: {
                        duration: 1000
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}