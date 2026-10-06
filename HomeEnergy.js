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
        baseline: "発電基準値",

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
        baseline: "Solar Baseline",

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


/* ============================================================
   Colors
============================================================ */

const COLORS = {
    solar: "#C62828",
    batteryCharge: "#EF6C00",
    consumption: "#F9A825",
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
            order: 10
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


    return {
        labels,
        datasets
    };
}


/* ============================================================
   Chart
============================================================ */

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

                    legend: {
                        position: "top",

                        labels: {
                            usePointStyle: true,
                            padding: 18
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

function moveDate(direction) {

    if (period === "day") {

        selectedDate.setDate(
            selectedDate.getDate()
            + direction
        );

    } else if (period === "month") {

        selectedDate.setMonth(
            selectedDate.getMonth()
            + direction
        );

    } else {

        selectedDate.setFullYear(
            selectedDate.getFullYear()
            + direction
        );
    }


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