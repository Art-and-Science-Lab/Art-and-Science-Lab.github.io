const DATA_ROOT = "data/HomeEnergy";


/* ============================================================
   Language
============================================================ */

const translations = {

    ja: {
        title: "ホームエネルギー",

        day: "日",
        month: "月",
        year: "年",

        solar: "太陽光発電量",
        batteryCharge: "蓄電池充電量",
        consumption: "消費電力量",
        import: "買電量",
        export: "売電量",
        batterySOC: "電池残量",
        baseline: "発電予測値",

        energyAxis: "電力量 (kWh)",
        socAxis: "電池残量 (%)",

        noData: "データがありません"
    },

    en: {
        title: "Home Energy",

        day: "Day",
        month: "Month",
        year: "Year",

        solar: "Solar Generation",
        batteryCharge: "Battery Charge",
        consumption: "Consumption",
        import: "Grid Import",
        export: "Grid Export",
        batterySOC: "Battery SOC",
        baseline: "Solar Forecast",

        energyAxis: "Energy (kWh)",
        socAxis: "Battery SOC (%)",

        noData: "No data available"
    }
};


let language =
    navigator.language.toLowerCase().startsWith("ja")
        ? "ja"
        : "en";


/* ============================================================
   State
============================================================ */

let period = "day";

let selectedDate = new Date();

selectedDate.setDate(
    selectedDate.getDate() - 1
);

let chart = null;

// Keep legend selections across date, period and language changes.
const seriesVisibility = {};

// Navigation limits
const MIN_DAY = new Date(2026, 8, 18);   // 2026-09-18
const MIN_MONTH = new Date(2026, 0, 1);  // 2026-01
const MIN_YEAR = 2024;

/* ============================================================
   Colors
============================================================ */

const COLORS = {
    solar: "#C62828",
    batteryCharge: "#F9A825",
    consumption: "#C5AA55",
    import: "#2E7D32",
    export: "#1565C0",
    soc: "#7B1FA2",
    baseline: "#D6E6F5"
};


/* ============================================================
   Utility
============================================================ */

function pad(value) {
    return String(value).padStart(2, "0");
}


function dateParts() {

    return {
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        day: selectedDate.getDate()
    };
}


function csvFile() {

    const d = dateParts();

    if (period === "day") {

        return (
            `${DATA_ROOT}/Day/` +
            `${d.year}${pad(d.month)}${pad(d.day)}.csv`
        );
    }

    if (period === "month") {

        return (
            `${DATA_ROOT}/Month/` +
            `${d.year}${pad(d.month)}.csv`
        );
    }

    return (
        `${DATA_ROOT}/Year/` +
        `${d.year}.csv`
    );
}


/* ============================================================
   Date display
============================================================ */

function updateDateDisplay() {

    const d = dateParts();

    let text;

    if (period === "day") {

        text =
            `${d.year}-${pad(d.month)}-${pad(d.day)}`;

    } else if (period === "month") {

        text =
            `${d.year}-${pad(d.month)}`;

    } else {

        text = `${d.year}`;
    }

    document.getElementById(
        "currentDate"
    ).textContent = text;
    updateNavigationButtons();
}


/* ============================================================
   CSV
============================================================ */

function parseCSV(text) {

    const lines = text
        .trim()
        .split(/\r?\n/);

    const headers =
        lines[0].split(",");

    return lines
        .slice(1)
        .map(line => {

            const values =
                line.split(",");

            const row = {};

            headers.forEach(
                (header, index) => {

                    row[header.trim()] =
                        values[index] !== undefined
                            ? values[index].trim()
                            : "";
                }
            );

            return row;
        });
}


/* ============================================================
   Data conversion
============================================================ */

function numberValue(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return 0;
    }

    const n = Number(value);

    return Number.isFinite(n)
        ? n
        : 0;
}


function makeChartData(rows) {

    const t = translations[language];

    let xColumn;

    if (period === "day") {
        xColumn = "時間";
    } else if (period === "month") {
        xColumn = "日";
    } else {
        xColumn = "月";
    }


    const labels =
        rows.map(row => row[xColumn]);


    const datasets = [];


    if (period === "year") {

        datasets.push({
            type: "bar",
            label: t.baseline,
            data: rows.map(
                row =>
                    numberValue(
                        row["発電基準値"]
                    )
            ),
            backgroundColor:
                COLORS.baseline,
            borderWidth: 0,
            order: 10,
            yAxisID: "energy"
        });
    }


    datasets.push(

        {
            label: t.solar,
            data: rows.map(
                row =>
                    numberValue(
                        row["太陽光発電量"]
                    )
            ),
            borderColor: COLORS.solar,
            backgroundColor: COLORS.solar,
            borderWidth: 3,
            pointRadius: 2,
            tension: 0,
            yAxisID: "energy"
        },

        {
            label: t.batteryCharge,
            data: rows.map(
                row =>
                    numberValue(
                        row["蓄電池充電量"]
                    )
            ),
            borderColor:
                COLORS.batteryCharge,
            backgroundColor:
                COLORS.batteryCharge,
            borderWidth: 3,
            pointRadius: 2,
            tension: 0,
            yAxisID: "energy"
        },

        {
            label: t.consumption,
            data: rows.map(
                row =>
                    numberValue(
                        row["消費電力量"]
                    )
            ),
            borderColor:
                COLORS.consumption,
            backgroundColor:
                COLORS.consumption,
            borderWidth: 3,
            pointRadius: 2,
            tension: 0,
            yAxisID: "energy"
        },

        {
            label: t.import,
            data: rows.map(
                row =>
                    numberValue(
                        row["買電量"]
                    )
            ),
            borderColor:
                COLORS.import,
            backgroundColor:
                COLORS.import,
            borderWidth: 3,
            pointRadius: 2,
            tension: 0,
            yAxisID: "energy"
        },

        {
            label: t.export,
            data: rows.map(
                row =>
                    numberValue(
                        row["売電量"]
                    )
            ),
            borderColor:
                COLORS.export,
            backgroundColor:
                COLORS.export,
            borderWidth: 3,
            pointRadius: 2,
            tension: 0,
            yAxisID: "energy"
        },

        {
            label: t.batterySOC,
            data: rows.map(
                row =>
                    numberValue(
                        row["電池残量"]
                    )
            ),
            borderColor:
                COLORS.soc,
            backgroundColor:
                COLORS.soc,
            borderWidth: 3,
            borderDash: [8, 6],
            pointRadius: 2,
            tension: 0,
            yAxisID: "soc"
        }
    );


    // Stable identifiers independent of translated legend labels.
    const seriesKeys = period === "year"
        ? ["baseline", "solar", "batteryCharge", "consumption", "import", "export", "soc"]
        : ["solar", "batteryCharge", "consumption", "import", "export", "soc"];
    datasets.forEach((dataset, index) => {
        dataset.seriesKey = seriesKeys[index];
        dataset.hidden = seriesVisibility[dataset.seriesKey] === false;
    });

    return {
        labels,
        datasets
    };
}


/* ============================================================
   Interactive legend (HTML buttons, Chart.js visibility API)
============================================================ */

function renderLegend() {
    const container = document.getElementById("energyLegend");
    container.replaceChildren();
    if (!chart) return;

    chart.data.datasets.forEach((dataset, index) => {
        const key = dataset.seriesKey;
        const visible = chart.isDatasetVisible(index);
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = dataset.label;
        button.style.setProperty("--series-color", COLORS[key]);
        button.classList.toggle("off", !visible);
        button.setAttribute("aria-pressed", String(visible));
        button.addEventListener("click", () => {
            const nextVisible = !chart.isDatasetVisible(index);
            seriesVisibility[key] = nextVisible;
            chart.setDatasetVisibility(index, nextVisible);
            updateSocAxis();
            chart.update();
            renderLegend();
        });
        container.appendChild(button);
    });
}

/* ============================================================
   Chart
============================================================ */
function updateSocAxis() {
    if (!chart) return;

    const socIndex = chart.data.datasets.findIndex(
        dataset => dataset.yAxisID === "soc"
    );

    chart.options.scales.soc.display =
        socIndex !== -1 && chart.isDatasetVisible(socIndex);
}

function drawChart(rows) {

    const t = translations[language];

    if (chart) {
        chart.destroy();
    }


    const ctx =
        document
            .getElementById(
                "energyChart"
            )
            .getContext("2d");


    chart = new Chart(
        ctx,
        {
            type: "line",

            data:
                makeChartData(rows),

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                plugins: {
                    legend: { display: false },

                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const digits = period === "day" ? 3 : 1;
                                const value = context.parsed.y;

                                if (value == null) {
                                    return context.dataset.label;
                                }

                                return context.dataset.label + ": " +
                                    Number(value).toFixed(digits);
                            }
                        }
                    }
                },

                scales: {

                    x: {
                        grid: {
                            color:
                                "rgba(0,0,0,0.08)"
                        }
                    },

                    energy: {
                        position: "left",
                        beginAtZero: true,

                        title: {
                            display: true,
                            text: t.energyAxis
                        },

                        grid: {
                            color:
                                "rgba(0,0,0,0.08)"
                        }
                    },

                    soc: {
                        position: "right",
                        min: 0,
                        max: 100,

                        title: {
                            display: true,
                            text: t.socAxis
                        },

                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        }
    );
    renderLegend();
    updateSocAxis();
    chart.update();
}

/* ============================================================
   Load
============================================================ */

async function loadData() {

    updateDateDisplay();

    const status =
        document.getElementById(
            "status"
        );

    status.textContent = "";


    try {

        const response =
            await fetch(
                csvFile(),
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const text =
            await response.text();


        const rows =
            parseCSV(text);


        drawChart(rows);

    } catch (error) {

        if (chart) {
            chart.destroy();
            chart = null;
        }
        renderLegend();

        status.textContent =
            translations[language]
                .noData;

        console.error(error);
    }
}


/* ============================================================
   Language
============================================================ */

function updateLanguage() {

    const t =
        translations[language];


    document.documentElement.lang =
        language;


    document.getElementById(
        "pageTitle"
    ).textContent = t.title;


    document.getElementById(
        "dayButton"
    ).textContent = t.day;


    document.getElementById(
        "monthButton"
    ).textContent = t.month;


    document.getElementById(
        "yearButton"
    ).textContent = t.year;


    document.getElementById(
        "langJa"
    ).classList.toggle(
        "active",
        language === "ja"
    );


    document.getElementById(
        "langEn"
    ).classList.toggle(
        "active",
        language === "en"
    );


    loadData();
}


/* ============================================================
   Period
============================================================ */

function setPeriod(newPeriod) {

    period = newPeriod;

    // 表示期間を切り替えたら、
    // 常に昨日を基準とした最新データへ戻す

    selectedDate = getYesterday();


    document
        .querySelectorAll(
            ".period"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.period === period
            );
        });


    loadData();
}


/* ============================================================
   Navigation
============================================================ */

function getYesterday() {

    const yesterday = new Date();

    yesterday.setHours(0, 0, 0, 0);

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    return yesterday;
}


function isDateAllowed(date) {

    const yesterday = getYesterday();


    if (period === "day") {

        return (
            date >= MIN_DAY &&
            date <= yesterday
        );
    }


    if (period === "month") {

        const value =
            date.getFullYear() * 12 +
            date.getMonth();

        const min =
            MIN_MONTH.getFullYear() * 12 +
            MIN_MONTH.getMonth();

        const max =
            yesterday.getFullYear() * 12 +
            yesterday.getMonth();

        return (
            value >= min &&
            value <= max
        );
    }


    return (
        date.getFullYear() >= MIN_YEAR &&
        date.getFullYear() <=
            yesterday.getFullYear()
    );
}

function updateNavigationButtons() {

    const previous =
        document.getElementById(
            "previousButton"
        );

    const next =
        document.getElementById(
            "nextButton"
        );


    const previousDate =
        new Date(selectedDate);

    const nextDate =
        new Date(selectedDate);


    if (period === "day") {

        previousDate.setDate(
            previousDate.getDate() - 1
        );

        nextDate.setDate(
            nextDate.getDate() + 1
        );

    } else if (period === "month") {

        previousDate.setMonth(
            previousDate.getMonth() - 1
        );

        nextDate.setMonth(
            nextDate.getMonth() + 1
        );

    } else {

        previousDate.setFullYear(
            previousDate.getFullYear() - 1
        );

        nextDate.setFullYear(
            nextDate.getFullYear() + 1
        );
    }


    previous.disabled =
        !isDateAllowed(previousDate);

    next.disabled =
        !isDateAllowed(nextDate);
}

function moveDate(direction) {

    const newDate = new Date(selectedDate);

    if (period === "day") {

        newDate.setDate(
            newDate.getDate() + direction
        );

    } else if (period === "month") {

        newDate.setMonth(
            newDate.getMonth() + direction
        );

    } else {

        newDate.setFullYear(
            newDate.getFullYear() + direction
        );
    }


    if (!isDateAllowed(newDate)) {
        return;
    }


    selectedDate = newDate;

    loadData();
}

/* ============================================================
   Events
============================================================ */

document
    .querySelectorAll(
        ".period"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                setPeriod(
                    button.dataset.period
                );
            }
        );
    });


document
    .getElementById(
        "previousButton"
    )
    .addEventListener(
        "click",
        () => moveDate(-1)
    );


document
    .getElementById(
        "nextButton"
    )
    .addEventListener(
        "click",
        () => moveDate(1)
    );


document
    .getElementById(
        "langJa"
    )
    .addEventListener(
        "click",
        () => {

            language = "ja";
            updateLanguage();
        }
    );


document
    .getElementById(
        "langEn"
    )
    .addEventListener(
        "click",
        () => {

            language = "en";
            updateLanguage();
        }
    );


/* ============================================================
   Start
============================================================ */

updateLanguage();