const API_URL = "http://127.0.0.1:5000/api/transactions";

let allTransactions = [];
let filteredTransactions = [];

const tableBody = document.getElementById("transactionTable");
const searchInput = document.getElementById("searchInput");
const serviceFilter = document.getElementById("serviceFilter");
const sortFilter = document.getElementById("sortFilter");
const emptyMessage = document.getElementById("emptyMessage");

// Format amount in Indian currency
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

// Fetch transactions from Flask backend
async function loadTransactions() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch transactions");
        }

        allTransactions = await response.json();

        updateSummary();
        applyFilters();

    } catch (error) {
        console.error("Error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load transactions. Please check the backend.
                </td>
            </tr>
        `;
    }
}

// Update summary cards
function updateSummary() {
    const total = allTransactions.reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0
    );

    const highest = allTransactions.length
        ? Math.max(...allTransactions.map(t => Number(t.amount)))
        : 0;

    const services = new Set(
        allTransactions.map(t => t.service)
    );

    document.getElementById("transactionCount").textContent =
        allTransactions.length;

    document.getElementById("transactionTotal").textContent =
        formatCurrency(total);

    document.getElementById("highestTransaction").textContent =
        formatCurrency(highest);

    document.getElementById("serviceCount").textContent =
        services.size;
}

// Display transactions in table
function displayTransactions(transactions) {
    tableBody.innerHTML = "";

    if (transactions.length === 0) {
        emptyMessage.style.display = "block";
        return;
    }

    emptyMessage.style.display = "none";

    transactions.forEach(transaction => {
        const row = document.createElement("tr");

        const date = new Date(transaction.date + "T00:00:00");

        row.innerHTML = `
            <td>${date.toLocaleDateString("en-IN")}</td>
            <td>${transaction.service}</td>
            <td>${transaction.project}</td>
            <td>${transaction.category}</td>
            <td><strong>${formatCurrency(transaction.amount)}</strong></td>
            <td>${transaction.status}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Search, filter and sort
function applyFilters() {
    let result = [...allTransactions];

    const searchText = searchInput.value.toLowerCase();

    const selectedService = serviceFilter.value;

    // Search by service or project
    if (searchText) {
        result = result.filter(transaction =>
            transaction.service.toLowerCase().includes(searchText) ||
            transaction.project.toLowerCase().includes(searchText)
        );
    }

    // Filter by service
    if (selectedService !== "all") {
        result = result.filter(transaction =>
            transaction.service === selectedService
        );
    }

    // Sorting
    switch (sortFilter.value) {
        case "newest":
            result.sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );
            break;

        case "oldest":
            result.sort((a, b) =>
                new Date(a.date) - new Date(b.date)
            );
            break;

        case "highest":
            result.sort((a, b) =>
                Number(b.amount) - Number(a.amount)
            );
            break;

        case "lowest":
            result.sort((a, b) =>
                Number(a.amount) - Number(b.amount)
            );
            break;
    }

    filteredTransactions = result;

    displayTransactions(filteredTransactions);
}

// Export filtered transactions to CSV
function exportCSV() {
    if (filteredTransactions.length === 0) {
        alert("No transactions available to export.");
        return;
    }

    const headers = [
        "Date",
        "Service",
        "Project",
        "Category",
        "Amount",
        "Status"
    ];

    const rows = filteredTransactions.map(t => [
        t.date,
        t.service,
        t.project,
        t.category,
        t.amount,
        t.status
    ]);

    const csvContent = [headers, ...rows]
        .map(row =>
            row.map(value =>
                `"${String(value).replace(/"/g, '""')}"`
            ).join(",")
        )
        .join("\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "CloudSpend_Transactions.csv";
    link.click();

    URL.revokeObjectURL(link.href);
}

// Event listeners
searchInput.addEventListener("input", applyFilters);
serviceFilter.addEventListener("change", applyFilters);
sortFilter.addEventListener("change", applyFilters);

document.getElementById("exportCSV")
    .addEventListener("click", exportCSV);

// Load data when page opens
loadTransactions();