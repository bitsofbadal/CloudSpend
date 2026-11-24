// ========================================
// CLOUDSPEND BUDGET MANAGER
// Backend Connected Version
// ========================================

const API_URL = "";

const SELECTED_MONTH = "2026-10";

let monthlyBudget = 10000;

let currentSpending = 0;


// ========================================
// 1. Get HTML Elements
// ========================================

const budgetInput = document.getElementById("budgetInput");

const saveButton = document.getElementById("saveBudget");

const budgetMessage = document.getElementById("budgetMessage");


// ========================================
// 2. Currency Formatter
// ========================================

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-IN", {

        style: "currency",

        currency: "INR",

        maximumFractionDigits: 0

    }).format(amount);

}


// ========================================
// 3. Load Budget and Transactions
// ========================================

async function loadBudgetData() {

    try {

        const [budgetResponse, transactionsResponse] =
            await Promise.all([

                fetch(`${API_URL}/api/budget?month=${SELECTED_MONTH}`),

                fetch(`${API_URL}/api/transactions`)

            ]);

        if (!budgetResponse.ok || !transactionsResponse.ok) {

            throw new Error("Unable to load budget data");

        }

        const budgetData = await budgetResponse.json();

        const transactions = await transactionsResponse.json();


        // Load saved budget

        monthlyBudget = Number(budgetData.budget);


        // Calculate October spending

        const monthlyTransactions = transactions.filter(transaction =>

            transaction.date.startsWith(SELECTED_MONTH)

        );


        currentSpending = monthlyTransactions.reduce(

            (total, transaction) =>

                total + Number(transaction.amount),

            0

        );


        // Update input

        budgetInput.value = monthlyBudget;


        // Update dashboard

        updateBudgetDashboard();


    }

    catch (error) {

        console.error("Budget Loading Error:", error);

        budgetMessage.textContent =
            "Unable to connect to the server. Please check your backend.";

        budgetMessage.style.color = "#F87171";

    }

}


// ========================================
// 4. Update Budget Dashboard
// ========================================

function updateBudgetDashboard() {

    const remaining = monthlyBudget - currentSpending;

    const percentage = monthlyBudget > 0

        ? (currentSpending / monthlyBudget) * 100

        : 0;


    // Update Cards

    document.getElementById("monthlyBudget").textContent =

        formatCurrency(monthlyBudget);


    document.getElementById("currentSpending").textContent =

        formatCurrency(currentSpending);


    document.getElementById("remainingBudget").textContent =

        formatCurrency(Math.max(remaining, 0));


    document.getElementById("budgetPercentage").textContent =

        percentage.toFixed(1) + "%";


    // Update Progress Bar

    document.getElementById("budgetProgress").style.width =

        Math.min(percentage, 100) + "%";


    // Update Labels

    document.getElementById("spentLabel").textContent =

        formatCurrency(currentSpending) + " spent";


    document.getElementById("limitLabel").textContent =

        formatCurrency(monthlyBudget) + " budget";


    // Update Status

    updateBudgetAlert(percentage);

}


// ========================================
// 5. Budget Alert System
// ========================================

function updateBudgetAlert(percentage) {

    const alertBox = document.getElementById("alertBox");

    const alertTitle = document.getElementById("alertTitle");

    const alertDescription = document.getElementById("alertDescription");

    const budgetStatus = document.getElementById("budgetStatus");


    alertBox.className = "budget-alert";


    if (percentage >= 100) {

        budgetStatus.textContent = "Budget Exceeded";

        budgetStatus.style.color = "#F87171";

        alertBox.classList.add("danger");

        alertTitle.textContent = "🔴 Budget Exceeded!";

        alertDescription.textContent =

            "Your cloud expenditure has exceeded your monthly budget by " +

            formatCurrency(currentSpending - monthlyBudget) + ".";

    }

    else if (percentage >= 80) {

        budgetStatus.textContent = "High Spending";

        budgetStatus.style.color = "#FBBF24";

        alertBox.classList.add("warning-alert");

        alertTitle.textContent = "🟡 High Spending Warning";

        alertDescription.textContent =

            "You have used " + percentage.toFixed(1) +

            "% of your monthly budget. Review your cloud expenses.";

    }

    else if (percentage >= 50) {

        budgetStatus.textContent = "Moderate Spending";

        budgetStatus.style.color = "#60A5FA";

        alertBox.classList.add("info-alert");

        alertTitle.textContent = "🔵 Spending Update";

        alertDescription.textContent =

            "You have used " + percentage.toFixed(1) +

            "% of your monthly budget.";

    }

    else {

        budgetStatus.textContent = "On Track";

        budgetStatus.style.color = "#34D399";

        alertBox.classList.add("success-alert");

        alertTitle.textContent = "🟢 Budget On Track";

        alertDescription.textContent =

            "Your spending is currently within a healthy range.";

    }

}


// ========================================
// 6. Save Budget to Database
// ========================================

async function saveBudget() {

    const newBudget = Number(budgetInput.value);


    if (!Number.isFinite(newBudget) || newBudget <= 0) {

        budgetMessage.textContent =

            "Please enter a valid budget amount.";

        budgetMessage.style.color = "#F87171";

        return;

    }


    saveButton.disabled = true;

    saveButton.textContent = "Saving...";


    try {

        const response = await fetch(`${API_URL}/api/budget`, {

            method: "PUT",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                amount: newBudget,

                month: SELECTED_MONTH

            })

        });


        const result = await response.json();


        if (!response.ok) {

            throw new Error(result.error || "Unable to save budget");

        }


        monthlyBudget = Number(result.budget);


        updateBudgetDashboard();


        budgetMessage.textContent =

            "Your monthly budget has been saved successfully!";

        budgetMessage.style.color = "#34D399";


    }

    catch (error) {

        console.error("Budget Save Error:", error);

        budgetMessage.textContent = error.message;

        budgetMessage.style.color = "#F87171";

    }

    finally {

        saveButton.disabled = false;

        saveButton.textContent = "Save Budget";

    }

}


// ========================================
// 7. Save Button Event
// ========================================

saveButton.addEventListener("click", saveBudget);


// ========================================
// 8. Initial Load
// ========================================

document.addEventListener("DOMContentLoaded", loadBudgetData);