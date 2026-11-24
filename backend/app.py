from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from datetime import datetime
import calendar

from database import get_connection, initialize_database
# Flask application
app = Flask(
    __name__,
    static_folder="../frontend",
    static_url_path=""
)

CORS(app)

initialize_database()

CORS(app)

# Initialize database when application starts
initialize_database()


# Current month
def get_current_month():
    return datetime.now().strftime("%Y-%m")


# Home API
@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")


# Dashboard API
@app.route("/api/dashboard", methods=["GET"])
def dashboard():

    connection = get_connection()
    cursor = connection.cursor()

    # Selected month, otherwise current month
    month = request.args.get("month", get_current_month())

    try:
        selected_date = datetime.strptime(month, "%Y-%m")
    except ValueError:
        connection.close()
        return jsonify({"error": "Invalid month format. Use YYYY-MM"}), 400

    # Total days in selected month
    total_days = calendar.monthrange(
        selected_date.year,
        selected_date.month
    )[1]

    # Current month or historical month
    today = datetime.now()

    if selected_date.year == today.year and selected_date.month == today.month:
        days_elapsed = today.day
    elif selected_date < today.replace(day=1, hour=0, minute=0, second=0, microsecond=0):
        days_elapsed = total_days
    else:
        days_elapsed = 1

    # Total spending
    cursor.execute("""
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE date LIKE ?
    """, (month + "%",))

    total_spending = float(cursor.fetchone()[0])

    # Monthly budget
    cursor.execute("""
        SELECT amount FROM budgets
        WHERE month = ?
    """, (month,))

    budget_data = cursor.fetchone()
    monthly_budget = float(budget_data[0]) if budget_data else 10000

    # Transaction count
    cursor.execute("""
        SELECT COUNT(*) FROM transactions
        WHERE date LIKE ?
    """, (month + "%",))

    transaction_count = cursor.fetchone()[0]

    connection.close()

    # Remaining budget
    remaining = max(monthly_budget - total_spending, 0)

    # Predicted bill
    predicted_bill = (
        (total_spending / days_elapsed) * total_days
        if days_elapsed > 0 else 0
    )

    return jsonify({
        "month": month,
        "total_spending": round(total_spending, 2),
        "monthly_budget": round(monthly_budget, 2),
        "remaining_budget": round(remaining, 2),
        "predicted_bill": round(predicted_bill, 2),
        "transaction_count": transaction_count,
        "days_elapsed": days_elapsed,
        "total_days": total_days
    })


# Transactions API
@app.route("/api/transactions", methods=["GET"])
def transactions():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT * FROM transactions
        ORDER BY date DESC
    """)

    records = [dict(row) for row in cursor.fetchall()]

    connection.close()

    return jsonify(records)


# Budget API
@app.route("/api/budget", methods=["GET", "PUT"])
def budget():

    connection = get_connection()
    cursor = connection.cursor()

    if request.method == "GET":

        month = request.args.get("month", get_current_month())

        cursor.execute("""
            SELECT amount FROM budgets
            WHERE month = ?
        """, (month,))

        result = cursor.fetchone()
        connection.close()

        return jsonify({
            "month": month,
            "budget": float(result[0]) if result else 10000
        })

    # PUT request: Update budget

    data = request.get_json(silent=True) or {}

    month = data.get("month", get_current_month())

    try:
        datetime.strptime(month, "%Y-%m")
        amount = float(data.get("amount"))

    except (TypeError, ValueError):
        connection.close()
        return jsonify({
            "error": "Please provide a valid month and budget amount"
        }), 400

    if amount <= 0:
        connection.close()
        return jsonify({
            "error": "Budget must be greater than zero"
        }), 400

    cursor.execute("""
        INSERT INTO budgets (month, amount)
        VALUES (?, ?)
        ON CONFLICT(month)
        DO UPDATE SET amount = excluded.amount
    """, (month, amount))

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Budget updated successfully!",
        "month": month,
        "budget": amount
    })

  # Run server
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )