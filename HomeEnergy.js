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
        noData: "データがありません",
        table: "表", graph: "グラフ", hour: "時間", average: "平均値", minimum: "最小値", maximum: "最大値"
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
        noData: "No data available",
        table: "Table", graph: "Graph", hour: "Hour", average: "Ave", minimum: "Min", maximum: "Max"
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

const ENERGY_YMAX = {
    day: 4,
    month: 30,
    year: 800
};

// 最新CSVの日付を取得するまで未設定
let selectedDate = null;
let maxAvailableDate = null;

let chart = null;
let viewMode = "graph";
let currentRows = null;

// 凡例の表示状態を維持
const seriesVisibility = {};

// Navigation limits
const MIN_DAY = new Date(2026, 8, 18);
const MIN_MONTH = new Date(2026, 0, 1);
const MIN_YEAR = 2024;

/* ============================================================
   Colors
============================================================ */

const COLORS = {
    solar: "#C62828",
    consumption: "#F9A825",
    import: "#C5AA55",
    export: "#2E7D32",
    batteryCharge: "#1565C0",
    soc: "#7B1FA2",
    baseline: "#D6E6F5"
};

/* ============================================================
   Utility
============================================================ */

function pad(value) {
    return String(value).padStart(2, "0");
}

function getYesterday() {
    const yesterday = new Date();

    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);

    return yesterday;
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

    return `${DATA_ROOT}/Year/${d.year}.csv`;
}

/* ============================================================
   Date display
============================================================ */

function updateDateDisplay() {
    if (!selectedDate) return;

    const d = dateParts();
    let text;

    if (period === "day") {
        text = `${d.year}-${pad(d.month)}-${pad(d.day)}`;
    } else if (period === "month") {
        text = `${d.year}-${pad(d.month)}`;
    } else {
        text = `${d.year}`;
    }

    document.getElementById("currentDate").textContent = text;

    updateNavigationButtons();
}

/* ============================================================
   CSV
============================================================ */

function parseCSV(text) {
    // UTF-8 BOMを除去
    const cleaned = text.replace(/^\uFEFF/, "").trim();

    if (!cleaned) return [];

    const lines = cleaned.split(/\r?\n/);
    const headers = lines[0].split(",");

    return lines.slice(1).map(line => {
        const values = line.split(",");
        const row = {};

        headers.forEach((header, index) => {
            row[header.trim()] =
                values[index] !== undefined
                    ? values[index].trim()
                    : "";
        });

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

    return Number.isFinite(n) ? n : 0;
}

/* ============================================================
   Chart data
============================================================ */

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

    const labels = rows.map(row => row[xColumn]);
    const datasets = [];

    if (period === "year") {
        datasets.push({
            type: "bar",
            label: t.baseline,
            data: rows.map(row =>
                numberValue(row["発電基準値"])
            ),
            backgroundColor: COLORS.baseline,
            borderWidth: 0,
            order: 10,
            yAxisID: "energy",
            seriesKey: "baseline"
        });
    }

    const series = [
        ["solar", "太陽光発電量"],
        ["consumption", "消費電力量"],
        ["import", "買電量"],
        ["export", "売電量"],
        ["batteryCharge", "蓄電池充電量"],
        ["soc", "電池残量"]
    ];

    const labelsByKey = {
        solar: t.solar,
        consumption: t.consumption,
        import: t.import,
        export: t.export,
        batteryCharge: t.batteryCharge,
        soc: t.batterySOC
    };

    series.forEach(([key, column]) => {
        const isSOC = key === "soc";

        datasets.push({
            label: labelsByKey[key],
            data: rows.map(row =>
                numberValue(row[column])
            ),
            borderColor: COLORS[key],
            backgroundColor: COLORS[key],
            borderWidth: 3,
            ...(isSOC ? { borderDash: [8, 6] } : {}),
            pointRadius: 2,
            tension: 0,
            yAxisID: isSOC ? "soc" : "energy",
            seriesKey: key
        });
    });

    datasets.forEach(dataset => {
        dataset.hidden =
            seriesVisibility[dataset.seriesKey] === false;
    });

    return {
        labels,
        datasets
    };
}
/* ============================================================
   Interactive legend
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

        button.style.setProperty(
            "--series-color",
            COLORS[key]
        );

        button.classList.toggle("off", !visible);
        button.setAttribute("aria-pressed", String(visible));

        button.addEventListener("click", () => {
            const nextVisible =
                !chart.isDatasetVisible(index);

            seriesVisibility[key] = nextVisible;

            chart.setDatasetVisibility(
                index,
                nextVisible
            );

            updateSocAxis();
            chart.update();
            renderLegend();
        });

        container.appendChild(button);
    });
}

/* ============================================================
   Chart axes
============================================================ */

function updateSocAxis() {
    if (!chart) return;

    const socIndex = chart.data.datasets.findIndex(
        dataset => dataset.yAxisID === "soc"
    );

    chart.options.scales.soc.display =
        socIndex !== -1 &&
        chart.isDatasetVisible(socIndex);
}

function updateEnergyAxis() {
    if (!chart) return;

    const fixedMax = ENERGY_YMAX[period];

    const maxValue = Math.max(
        0,
        ...chart.data.datasets
            .filter(dataset =>
                dataset.yAxisID === "energy"
            )
            .flatMap(dataset => dataset.data)
            .map(value => Number(value) || 0)
    );

    chart.options.scales.energy.max =
        maxValue > fixedMax
            ? undefined
            : fixedMax;
}

/* ============================================================
   Chart
============================================================ */

function drawChart(rows) {
    const t = translations[language];

    if (chart) {
        chart.destroy();
    }

    const ctx = document
        .getElementById("energyChart")
        .getContext("2d");

    chart = new Chart(ctx, {
        type: "line",

        data: makeChartData(rows),

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const digits =
                                period === "day" ? 3 : 1;

                            const value = context.parsed.y;

                            if (value == null) {
                                return context.dataset.label;
                            }

                            return (
                                context.dataset.label +
                                ": " +
                                Number(value).toFixed(digits)
                            );
                        }
                    }
                }
            },

            scales: {
                x: {
                    grid: {
                        color: "rgba(0,0,0,0.08)"
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
                        color: "rgba(0,0,0,0.08)"
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
    });

    renderLegend();
    updateSocAxis();
    updateEnergyAxis();
    chart.update();
}

/* ============================================================
   Table view (independent of Chart.js)
============================================================ */

const TABLE_COLUMNS = [
    ["solar", "太陽光発電量"],
    ["consumption", "消費電力量"],
    ["import", "買電量"],
    ["export", "売電量"],
    ["batteryCharge", "蓄電池充電量"],
    ["batterySOC", "電池残量"]
];

function tableColumns() {
    return period === "year"
        ? [["baseline", "発電基準値"], ...TABLE_COLUMNS]
        : TABLE_COLUMNS;
}

function isTableObservation(row, column, index) {
    if (!selectedDate || !maxAvailableDate) return false;

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const key = period === "day" ? "時間" : period === "month" ? "日" : "月";
    const position = Number(row[key]);
    if (!Number.isInteger(position)) return false;

    if (period === "day") return position >= 0 && position <= 23;

    if (period === "month") {
        const lastDay = new Date(year, month + 1, 0).getDate();
        const limit = year === maxAvailableDate.getFullYear() &&
                      month === maxAvailableDate.getMonth()
            ? maxAvailableDate.getDate()
            : lastDay;
        if (position < 1 || position > limit) return false;

        // 設備設置前は太陽光・蓄電池関連の0を観測値とみなさない。
        if (["solar", "batteryCharge", "export", "batterySOC"].includes(column)) {
            return new Date(year, month, position) >= MIN_DAY;
        }
        return true;
    }

    if (position < 1 || position > 12) return false;
    const isCurrentYear = year === maxAvailableDate.getFullYear();

    // 発電予測値は年に関係なく12か月すべてを統計対象とする。
    if (column === "baseline") return true;
    if (isCurrentYear && position >= maxAvailableDate.getMonth() + 1) return false;

    if (["solar", "batteryCharge", "export", "batterySOC"].includes(column)) {
        return new Date(year, position, 0) >= MIN_DAY;
    }
    return true;
}

function formatTableValue(value, column) {
    if (value === "" || value === undefined || value === null) return "—";

    const n = Number(value);
    if (!Number.isFinite(n)) return "—";

    if (column === "batterySOC" || column === "baseline") {
        return n.toFixed(1);
    }

    return n.toFixed(period === "day" ? 3 : 1);
}

function drawTable(rows) {
    const table = document.getElementById("energyTable");
    if (!table) return;

    const t = translations[language];
    const columns = tableColumns();
    const key = period === "day" ? "時間" : period === "month" ? "日" : "月";

    table.replaceChildren();

    const thead = table.createTHead();
    const heading = thead.insertRow();

    const first = document.createElement("th");
    first.textContent = period === "day" ? t.hour : period === "month" ? t.day : t.month;
    first.scope = "col";
    heading.appendChild(first);

    for (const [name] of columns) {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = t[name];
        heading.appendChild(th);
    }

    const tbody = table.createTBody();
    const summaryLabels = [t.average, t.minimum, t.maximum];

    for (let stat = 0; stat < 3; stat++) {
        const tr = tbody.insertRow();
        tr.className = "summary-row";

        const label = tr.insertCell();
        label.textContent = summaryLabels[stat];

        for (const [name, csvName] of columns) {
            const values = rows
                .filter((row, index) => isTableObservation(row, name, index))
                .map(row => row[csvName])
                .filter(value =>
                    value !== "" &&
                    value != null &&
                    Number.isFinite(Number(value))
                )
                .map(Number);

            const td = tr.insertCell();

            const value = values.length === 0 ? null :
                stat === 0
                    ? values.reduce((a, b) => a + b, 0) / values.length
                    : stat === 1
                        ? Math.min(...values)
                        : Math.max(...values);

            td.textContent =
                value === null ? "—" : formatTableValue(value, name);
        }
    }

    for (const row of rows) {
        const tr = tbody.insertRow();

        const label = tr.insertCell();
        label.textContent = row[key] ?? "";

        for (const [name, csvName] of columns) {
            const td = tr.insertCell();
            td.textContent = formatTableValue(row[csvName], name);
        }
    }
}

function updateView() {
    const tableContainer =
        document.getElementById("energyTableContainer");

    const chartContainer =
        document.querySelector(".chart-container");

    const legend =
        document.getElementById("energyLegend");

    const toggle =
        document.getElementById("viewToggleButton");

    const isTable = viewMode === "table";

    if (tableContainer) {
        tableContainer.style.display = isTable ? "" : "none";
    }

    if (chartContainer) {
        chartContainer.style.display = isTable ? "none" : "";
    }

    if (legend) {
        legend.style.display = isTable ? "none" : "";
    }

    if (toggle) {
        toggle.textContent =
            translations[language][isTable ? "graph" : "table"];

        toggle.setAttribute("aria-pressed", String(isTable));
    }

    if (isTable && currentRows) {
        drawTable(currentRows);
    }

    if (!isTable && chart) {
        chart.resize();
    }
}

/* ============================================================
   Load CSV
============================================================ */

async function loadData() {
    if (!selectedDate) return;

    updateDateDisplay();

    const status = document.getElementById("status");
    status.textContent = "";

    try {
        const response = await fetch(
            csvFile(),
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        const rows = parseCSV(text);

        currentRows = rows;
        drawChart(rows);
        updateView();

    } catch (error) {
        currentRows = null;

        const table = document.getElementById("energyTable");
        if (table) table.replaceChildren();

        if (chart) {
            chart.destroy();
            chart = null;
        }

        renderLegend();

        status.textContent =
            translations[language].noData;

        console.error(error);
    }
}

/* ============================================================
   Language
============================================================ */

function updateLanguage() {
    const t = translations[language];

    document.documentElement.lang = language;

    document.getElementById("pageTitle").textContent =
        t.title;

    const shortEnglish =
        language === "en" &&
        window.matchMedia("(max-width: 600px)").matches;

    document.getElementById("dayButton").textContent =
        shortEnglish ? "D" : t.day;

    document.getElementById("monthButton").textContent =
        shortEnglish ? "M" : t.month;

    document.getElementById("yearButton").textContent =
        shortEnglish ? "Y" : t.year;
    
    document.getElementById("allButton").textContent =
    language === "ja" ? "すべて" : "ALL";

    document.getElementById("langJa").classList.toggle(
        "active",
        language === "ja"
    );

    document.getElementById("langEn").classList.toggle(
        "active",
        language === "en"
    );

    updateView();

    if (selectedDate) {
        loadData();
    }
}

/* ============================================================
   Latest published daily CSV
============================================================ */

// 昨日から遡り、最新の有効な日別CSVを探す。
// 日別CSVの24時間分が揃っていることも確認する。

async function findLatestCsvDate() {
    const day = getYesterday();

    while (day >= MIN_DAY) {
        const filename =
            `${day.getFullYear()}` +
            `${pad(day.getMonth() + 1)}` +
            `${pad(day.getDate())}`;

        const url =
            `${DATA_ROOT}/Day/${filename}.csv`;

        const response = await fetch(url, {
            cache: "no-store"
        });

        if (response.ok) {
            const text = await response.text();
            const rows = parseCSV(text);

            const header = text
                .replace(/^\uFEFF/, "")
                .split(/\r?\n/, 1)[0];

            // HTTP 200だけではなく、
            // CSVの構造も確認する。
            if (
                header.startsWith("時間,") &&
                rows.length === 24 &&
                rows.every((row, index) =>
                    Number(row["時間"]) === index
                )
            ) {
                return new Date(day);
            }

        } else if (response.status !== 404) {
            throw new Error(
                `CSV lookup failed: ` +
                `HTTP ${response.status} (${url})`
            );
        }

        day.setDate(day.getDate() - 1);
    }

    return null;
}

/* ============================================================
   Initialize
============================================================ */

async function initialize() {
    const previous =
        document.getElementById("previousButton");

    const next =
        document.getElementById("nextButton");

    previous.disabled = true;
    next.disabled = true;

    try {
        maxAvailableDate =
            await findLatestCsvDate();

        if (!maxAvailableDate) {
            document.getElementById("status").textContent =
                translations[language].noData;

            return;
        }

        selectedDate = new Date(maxAvailableDate);

        updateLanguage();

    } catch (error) {
        console.error(
            "Could not determine latest CSV date:",
            error
        );

        document.getElementById("status").textContent =
            translations[language].noData;
    }
}

/* ============================================================
   Period
============================================================ */

function setPeriod(newPeriod) {
    if (!maxAvailableDate) return;

    period = newPeriod;

    // 日・月・年とも、最新の日別CSVを基準にする。
    selectedDate = new Date(maxAvailableDate);

    document
        .querySelectorAll(".period")
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

function isDateAllowed(date) {
    if (!maxAvailableDate) return false;

    if (period === "day") {
        return (
            date >= MIN_DAY &&
            date <= maxAvailableDate
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
            maxAvailableDate.getFullYear() * 12 +
            maxAvailableDate.getMonth();

        return (
            value >= min &&
            value <= max
        );
    }

    return (
        date.getFullYear() >= MIN_YEAR &&
        date.getFullYear() <=
            maxAvailableDate.getFullYear()
    );
}

function updateNavigationButtons() {
    const previous =
        document.getElementById("previousButton");

    const next =
        document.getElementById("nextButton");

    const previousDate = new Date(selectedDate);
    const nextDate = new Date(selectedDate);

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
    .querySelectorAll(".period")
    .forEach(button => {
        button.addEventListener(
            "click",
            () => setPeriod(button.dataset.period)
        );
    });

document
    .getElementById("previousButton")
    .addEventListener(
        "click",
        () => moveDate(-1)
    );

document
    .getElementById("nextButton")
    .addEventListener(
        "click",
        () => moveDate(1)
    );

document
    .getElementById("langJa")
    .addEventListener(
        "click",
        () => {
            language = "ja";
            updateLanguage();
        }
    );

document
    .getElementById("langEn")
    .addEventListener(
        "click",
        () => {
            language = "en";
            updateLanguage();
        }
    );

document
    .getElementById("viewToggleButton")
    .addEventListener("click", () => {
        viewMode = viewMode === "graph" ? "table" : "graph";
        updateView();
    });

/* ============================================================
   Start
============================================================ */

initialize();