// ======================================
// CLOUDSPEND COST ADVISOR
// ======================================


// 1. Sample Cloud Billing Data

const billingData = [

    {
        service: "Compute Engine",
        category: "Compute",
        cost: 2500,
        recommendation:
            "Review your VM machine types and running hours. Consider stopping unused instances.",
        potentialSaving: 400,
        priority: "High"
    },

    {
        service: "Cloud Storage",
        category: "Storage",
        cost: 1200,
        recommendation:
            "Review old files, unused storage and storage classes. Consider lifecycle policies.",
        potentialSaving: 150,
        priority: "Medium"
    },

    {
        service: "Cloud SQL",
        category: "Database",
        cost: 1000,
        recommendation:
            "Review database instance sizing and storage allocation.",
        potentialSaving: 100,
        priority: "Medium"
    },

    {
        service: "Networking",
        category: "Networking",
        cost: 750,
        recommendation:
            "Review network egress traffic and identify unnecessary data transfers.",
        potentialSaving: 0,
        priority: "Low"
    }

];


// 2. Currency Formatter

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-IN", {

        style: "currency",

        currency: "INR",

        maximumFractionDigits: 0

    }).format(amount);

}


// 3. Generate Recommendations

function generateRecommendations() {

    const container = document.getElementById(
        "recommendationContainer"
    );

    container.innerHTML = "";


    billingData.forEach((item) => {

        const card = document.createElement("div");

        card.className = "recommendation-card";


        card.innerHTML = `

            <div class="recommendation-top">

                <span class="priority ${item.priority.toLowerCase()}">

                    ${item.priority} Priority

                </span>

                <span class="service-cost">

                    ${formatCurrency(item.cost)}

                </span>

            </div>


            <h3>${item.service}</h3>


            <p class="recommendation-description">

                ${item.recommendation}

            </p>


            <div class="saving-info">

                <span>Potential Monthly Savings</span>

                <strong>${formatCurrency(item.potentialSaving)}</strong>

            </div>

        `;


        container.appendChild(card);

    });

}


// 4. Calculate Potential Savings

function calculatePotentialSavings() {

    const totalSavings = billingData.reduce(

        (total, item) => total + item.potentialSaving,

        0

    );


    document.getElementById("potentialSavings").textContent =

        formatCurrency(totalSavings);

}


// 5. Identify Issues

function identifyIssues() {

    const issues = billingData.filter(

        item => item.potentialSaving > 0

    );


    document.getElementById("issueCount").textContent =

        issues.length;

}


// 6. Service Spending Analysis

function generateServiceAnalysis() {

    const container = document.getElementById(
        "serviceAnalysis"
    );


    const total = billingData.reduce(

        (sum, item) => sum + item.cost,

        0

    );


    container.innerHTML = "";


    billingData.forEach(item => {

        const percentage = (item.cost / total) * 100;


        const row = document.createElement("div");

        row.className = "analysis-row";


        row.innerHTML = `

            <div class="analysis-details">

                <strong>${item.service}</strong>

                <span>${formatCurrency(item.cost)}</span>

            </div>


            <div class="analysis-track">

                <div class="analysis-fill"
                     style="width: ${percentage}%">

                </div>

            </div>


            <p>${percentage.toFixed(1)}% of total spending</p>

        `;


        container.appendChild(row);

    });

}


// 7. Analyze Button

document.getElementById("analyzeButton").addEventListener(

    "click",

    function() {

        generateRecommendations();

        calculatePotentialSavings();

        identifyIssues();

        generateServiceAnalysis();


        this.textContent = "Analysis Updated ✓";

    }

);


// 8. Initial Dashboard Load

generateRecommendations();

calculatePotentialSavings();

identifyIssues();

generateServiceAnalysis();