const API_URL = "http://127.0.0.1:5000";
const SELECTED_MONTH = "2026-10";

let spendingChart = null;
let serviceChart = null;
let dashboardTransactions = [];


// 1. Currency Formatter
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}


// 2. Load Dashboard Data
async function loadDashboard() {

    try {

        const [dashboardResponse, transactionsResponse] =
            await Promise.all([

                fetch(`${API_URL}/api/dashboard?month=${SELECTED_MONTH}`),

                fetch(`${API_URL}/api/transactions`)

            ]);

        if (!dashboardResponse.ok || !transactionsResponse.ok) {
            throw new Error("Unable to fetch dashboard data");
        }

        const dashboard = await dashboardResponse.json();

        const allTransactions = await transactionsResponse.json();

        // October transactions only
        dashboardTransactions = allTransactions.filter(transaction =>
            transaction.date.startsWith(SELECTED_MONTH)
        );

        updateSummaryCards(dashboard);

        updateBudgetProgress(dashboard);

        updateSpendingChart();

        updateServiceChart(dashboardTransactions);

        // Spending filter
        const spendingFilter =
            document.getElementById("spendingFilter");

        if (spendingFilter) {

            spendingFilter.addEventListener(
                "change",
                updateSpendingChart
            );

        }

    } catch (error) {

        console.error("Dashboard Error:", error);

    }

}


// 3. Update Summary Cards
function updateSummaryCards(data) {

    document.getElementById("totalSpending").textContent =
        formatCurrency(data.total_spending);

    document.getElementById("monthlyBudget").textContent =
        formatCurrency(data.monthly_budget);

    document.getElementById("remainingBudget").textContent =
        formatCurrency(data.remaining_budget);

    document.getElementById("predictedBill").textContent =
        formatCurrency(data.predicted_bill);

    const percentage = data.monthly_budget > 0
        ? (data.remaining_budget / data.monthly_budget) * 100
        : 0;

    document.getElementById("remainingPercentage").textContent =
        `${percentage.toFixed(1)}% budget remaining`;

}


// 4. Update Budget Progress
function updateBudgetProgress(data) {

    const spentPercentage = data.monthly_budget > 0
        ? (data.total_spending / data.monthly_budget) * 100
        : 0;

    document.getElementById("budgetPercentage").textContent =
        `${spentPercentage.toFixed(1)}%`;

    document.getElementById("spentAmount").textContent =
        `${formatCurrency(data.total_spending)} spent`;

    document.getElementById("budgetAmount").textContent =
        `${formatCurrency(data.monthly_budget)} budget`;

    document.getElementById("budgetProgress").style.width =
        `${Math.min(spentPercentage, 100)}%`;

}


// 5. Interactive Spending Analytics
function updateSpendingChart() {

    const filter = document.getElementById("spendingFilter");

    const selectedDays = filter
        ? Number(filter.value)
        : 7;

    // October 2026 has 31 days
    const daysInMonth = 31;

  const startDay = Math.max(
    1,
    daysInMonth - selectedDays + 1
);

    const labels = [];

    const dailySpending = [];

    for (let day = startDay; day <= daysInMonth; day++) {

        labels.push(`Day ${day}`);

        dailySpending.push(0);

    }

    dashboardTransactions.forEach(transaction => {

        const day = Number(transaction.date.split("-")[2]);

        if (day >= startDay && day <= daysInMonth) {

            dailySpending[day - startDay] +=
                Number(transaction.amount);

        }

    });

    const ctx = document.getElementById("spendingChart");

    if (!ctx) return;

    if (spendingChart) {

        spendingChart.destroy();

    }

    spendingChart = new Chart(ctx, {

        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: "Daily Spending",

                data: dailySpending,

                borderColor: "#38BDF8",

                backgroundColor: "rgba(56, 189, 248, 0.20)",

                borderWidth: 2,

                pointRadius: 4,

                tension: 0.4,

                fill: true

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    display: true,

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

                        color: "rgba(148,163,184,0.05)"

                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {

                        color: "#94A3B8"

                    },

                    grid: {

                        color: "rgba(148,163,184,0.08)"

                    }

                }

            }

        }

    });

}


// 6. Service Breakdown
function updateServiceChart(transactions) {

    const serviceSpending = {};

    transactions.forEach(transaction => {

        const service = transaction.service || "Other";

        serviceSpending[service] =
            (serviceSpending[service] || 0) +
            Number(transaction.amount);

    });

    const labels = Object.keys(serviceSpending);

    const values = Object.values(serviceSpending);

    const ctx = document.getElementById("serviceChart");

    if (!ctx) return;

    if (serviceChart) {

        serviceChart.destroy();

    }

    serviceChart = new Chart(ctx, {

        type: "doughnut",

        data: {

            labels: labels,

            datasets: [{

                data: values,

                backgroundColor: [
                    "#38BDF8",
                    "#FB7185",
                    "#FB923C",
                    "#FBBF24"
                ],

                borderColor: "#151F32",

                borderWidth: 2

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    position: "bottom",

                    labels: {

                        color: "#94A3B8"

                    }

                }

            }

        }

    });


    // Service List
    const serviceList = document.getElementById("serviceList");

    if (serviceList) {

        serviceList.innerHTML = "";

        labels.forEach((service, index) => {

            const item = document.createElement("div");

            item.className = "service-item";

            const name = document.createElement("span");

            name.textContent = service;

            const amount = document.createElement("strong");

            amount.textContent = formatCurrency(values[index]);

            item.appendChild(name);

            item.appendChild(amount);

            serviceList.appendChild(item);

        });

    }

}


// 7. Start Dashboard
document.addEventListener(
    "DOMContentLoaded",
    loadDashboard
);