import sqlite3
from pathlib import Path

# Database file ka path
BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_DIR = BASE_DIR / "database"

# Agar database folder nahi hai, toh create karo
DATABASE_DIR.mkdir(exist_ok=True)

DATABASE_PATH = DATABASE_DIR / "cloudspend.db"


# Database connection
def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


# Database tables create karna
def initialize_database():

    connection = get_connection()
    cursor = connection.cursor()

    # Transactions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            service TEXT NOT NULL,
            project TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'Recorded'
        )
    """)

    # Budgets table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT UNIQUE NOT NULL,
            amount REAL NOT NULL
        )
    """)

    # Demo transactions insert karna
    cursor.execute("SELECT COUNT(*) FROM transactions")

    if cursor.fetchone()[0] == 0:

        sample_transactions = [
            ("2026-10-01", "Compute Engine", "Project Alpha", "Compute", 850),
            ("2026-10-04", "Cloud Storage", "Project Beta", "Storage", 450),
            ("2026-10-08", "Cloud SQL", "Project Alpha", "Database", 400),
            ("2026-10-12", "Networking", "Project Gamma", "Networking", 300),
            ("2026-10-15", "Compute Engine", "Project Beta", "Compute", 250),
            ("2026-10-19", "Cloud Storage", "Project Alpha", "Storage", 200),
            ("2026-10-23", "Cloud SQL", "Project Gamma", "Database", 200),
            ("2026-10-27", "Networking", "Project Beta", "Networking", 150)
        ]

        cursor.executemany("""
            INSERT INTO transactions
            (date, service, project, category, amount)
            VALUES (?, ?, ?, ?, ?)
        """, sample_transactions)

    # Default monthly budget
    cursor.execute("""
        INSERT OR IGNORE INTO budgets (month, amount)
        VALUES ('2026-10', 10000)
    """)

    connection.commit()
    connection.close()

    print("CloudSpend database initialized successfully!")


if __name__ == "__main__":
    initialize_database()