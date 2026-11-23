// ========================================
// CLOUDSPEND ANALYTICS
// Backend Connected Version
// ========================================

const API_URL = "http://127.0.0.1:5000";

// October 2026 demo period
const SELECTED_MONTH = "2026-10";

let allTransactions = [];

let dailyChart = null;
let serviceChart = null;
let monthlyChart = null;


// ========================================
// 1. Currency Formatter
// ========================================

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);

}


// ========================================
// 2. Service Categories
// ========================================

const serviceCategories = {

    "Compute Engine": "Compute",

    "Cloud Storage": "Storage",

    "Cloud SQL": "Database",

    "Networking": "Networking"

};


// ========================================
// 3. Load Backend Transactions
// ========================================

async function loadAnalytics() {

    try {

        const response = await fetch(
            `${API_URL}/api/transactions`
        );

        if (!response.ok) {

            throw new Error("Unable to fetch transactions");

        }

        const transactions = await response.json();

        // Filter October 2026 demo transactions
        allTransactions = transactions.filter(transaction =>
            transaction.date.startsWith(SELECTED_MONTH)
        );

        // Initial dashboard
        updateAnalytics(30);

        updateMonthlyChart();

    }

    catch (error) {

        console.error("Analytics Error:", error);

        document.getElementById("totalSpending").textContent = "Error";

    }

}


// ========================================
// 4. Prepare Daily Spending Data
// ========================================

function getDailyData(days) {

    const endDate = new Date(2026, 9, 31);

    const startDate = new Date(endDate);

    startDate.setDate(endDate.getDate() - days + 1);

    const dailyData = [];

    for (let i = 0; i < days; i++) {

        const currentDate = new Date(startDate);

        currentDate.setDate(startDate.getDate() + i);

        const dateString = [
            currentDate.getFullYear(),
            String(currentDate.getMonth() + 1).padStart(2, "0"),
            String(currentDate.getDate()).padStart(2, "0")
        ].join("-");

        const dailyTotal = allTransactions
            .filter(transaction => transaction.date === dateString)
            .reduce((sum, transaction) =>
                sum + Number(transaction.amount), 0
            );

        dailyData.push({

            date: dateString,

            cost: dailyTotal

        });

    }

    return dailyData;

}


// ========================================
// 5. Create Daily Spending Chart
// ========================================

function createDailyChart(labels, values) {

    const canvas = document.getElementById("dailyChart");

    if (!canvas) return;

    if (dailyChart) {

        dailyChart.destroy();

    }

    dailyChart = new Chart(canvas, {

        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: "Daily Spending",

                data: values,

                borderColor: "#3B82F6",

                backgroundColor: "rgba(59,130,246,0.15)",

                fill: true,

                tension: 0.4,

                pointRadius: 3

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    labels: {

                        color: "#94A3B8"

                    }

                }

            },

            scales: {

                x: {

                    ticks: {

                        color: "#94A3B8",

                        maxTicksLimit: 10

                    },

                    grid: {

                        color: "#273449"

                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {

                        color: "#94A3B8"

                    },

                    grid: {

                        color: "#273449"

                    }

                }

            }

        }

    });

}


// ========================================
// 6. Service Breakdown Chart
// ========================================

function updateServiceChart() {

    const serviceTotals = {};

    allTransactions.forEach(transaction => {

        const service = transaction.service;

        serviceTotals[service] =
            (serviceTotals[service] || 0) +
            Number(transaction.amount);

    });

    const labels = Object.keys(serviceTotals);

    const values = Object.values(serviceTotals);

    const canvas = document.getElementById("serviceBreakdown");

    if (!canvas) return;

    if (serviceChart) {

        serviceChart.destroy();

    }

    serviceChart = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: labels,

            datasets: [{

                data: values,

                backgroundColor: [
                    "#3B82F6",
                    "#06B6D4",
                    "#8B5CF6",
                    "#F59E0B"
                ],

                borderWidth: 0

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    position: "bottom",

                    labels: {

                        color: "#94A3B8",

                        padding: 15

                    }

                }

            }

        }

    });

}


// ========================================
// 7. Service-wise Expense Table
// ========================================

function generateServiceTable() {

    const table = document.getElementById("serviceTable");

    table.innerHTML = "";

    const serviceTotals = {};

    allTransactions.forEach(transaction => {

        const service = transaction.service;

        serviceTotals[service] =
            (serviceTotals[service] || 0) +
            Number(transaction.amount);

    });

    const total = Object.values(serviceTotals)
        .reduce((sum, amount) => sum + amount, 0);

    Object.entries(serviceTotals).forEach(([service, cost]) => {

        const percentage = total > 0
            ? (cost / total) * 100
            : 0;

        const row = document.createElement("tr");

        const values = [
            service,
            serviceCategories[service] || "Other",
            formatCurrency(cost),
            `${percentage.toFixed(1)}%`
        ];

        values.forEach(value => {

            const cell = document.createElement("td");

            cell.textContent = value;

            row.appendChild(cell);

        });

        table.appendChild(row);

    });

}


// ========================================
// 8. Update Summary Cards and Daily Chart
// ========================================

function updateAnalytics(days) {

    const selectedData = getDailyData(days);

    const costs = selectedData.map(item => item.cost);

    const total = costs.reduce((sum, cost) => sum + cost, 0);

    const average = days > 0 ? total / days : 0;

    const highest = costs.length > 0
        ? Math.max(...costs)
        : 0;

    const activeServices = new Set(
        allTransactions.map(transaction => transaction.service)
    ).size;


    // Summary Cards

    document.getElementById("totalSpending").textContent =
        formatCurrency(total);

    document.getElementById("dailyAverage").textContent =
        formatCurrency(average);

    document.getElementById("highestSpending").textContent =
        formatCurrency(highest);

    document.getElementById("activeServices").textContent =
        activeServices;


    // Daily Chart

    const labels = selectedData.map(item => {

        return new Date(item.date + "T00:00:00")
            .toLocaleDateString("en-IN", {

                day: "numeric",

                month: "short"

            });

    });

    createDailyChart(labels, costs);

    updateServiceChart();

    generateServiceTable();

}


// ========================================
// 9. Monthly Spending Comparison
// ========================================

function updateMonthlyChart() {

    const monthlyTotals = {};

    allTransactions.forEach(transaction => {

        const month = transaction.date.substring(0, 7);

        monthlyTotals[month] =
            (monthlyTotals[month] || 0) +
            Number(transaction.amount);

    });

    // August, September and October 2026
    const months = [
        "2026-08",
        "2026-09",
        "2026-10"
    ];

    const labels = [
        "August",
        "September",
        "October"
    ];

    const values = months.map(month =>
        monthlyTotals[month] || 0
    );

    const canvas = document.getElementById("monthlyChart");

    if (!canvas) return;

    if (monthlyChart) {

        monthlyChart.destroy();

    }

    monthlyChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [{

                label: "Monthly Spending",

                data: values,

                backgroundColor: [
                    "#3B82F6",
                    "#06B6D4",
                    "#8B5CF6"
                ],

                borderRadius: 7

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    labels: {

                        color: "#94A3B8"

                    }

                }

            },

            scales: {

                x: {

                    ticks: {

                        color: "#94A3B8"

                    },

                    grid: {

                        display: false

                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {

                        color: "#94A3B8"

                    },

                    grid: {

                        color: "#273449"

                    }

                }

            }

        }

    });

}


// ========================================
// 10. Date Filter
// ========================================

const dateFilter = document.getElementById("dateFilter");

dateFilter.addEventListener("change", function () {

    const selectedDays = Number(this.value);

    updateAnalytics(selectedDays);

});


// ========================================
// 11. Start Analytics
// ========================================

document.addEventListener("DOMContentLoaded", loadAnalytics);