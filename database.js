const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'bank_system.db');
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            const createLoansTable = `
                CREATE TABLE IF NOT EXISTS loans (
                    loan_id TEXT PRIMARY KEY,
                    customer_id TEXT NOT NULL,
                    principal_amount REAL NOT NULL,
                    loan_period INTEGER NOT NULL,
                    interest_rate REAL NOT NULL,
                    total_interest REAL NOT NULL,
                    total_amount REAL NOT NULL,
                    monthly_emi REAL NOT NULL,
                    amount_paid REAL DEFAULT 0,
                    balance_amount REAL NOT NULL,
                    emis_paid INTEGER DEFAULT 0,
                    emis_remaining INTEGER NOT NULL,
                    loan_status TEXT DEFAULT 'ACTIVE',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const createTransactionsTable = `
                CREATE TABLE IF NOT EXISTS transactions (
                    transaction_id TEXT PRIMARY KEY,
                    loan_id TEXT NOT NULL,
                    payment_amount REAL NOT NULL,
                    payment_type TEXT NOT NULL,
                    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    balance_before REAL NOT NULL,
                    balance_after REAL NOT NULL,
                    emis_remaining_before INTEGER NOT NULL,
                    emis_remaining_after INTEGER NOT NULL,
                    FOREIGN KEY (loan_id) REFERENCES loans (loan_id)
                )
            `;

            this.db.serialize(() => {
                this.db.run(createLoansTable, (err) => {
                    if (err) {
                        console.error('Error creating loans table:', err);
                        reject(err);
                        return;
                    }
                });

                this.db.run(createTransactionsTable, (err) => {
                    if (err) {
                        console.error('Error creating transactions table:', err);
                        reject(err);
                        return;
                    }
                    console.log('Database tables created successfully');
                    resolve();
                });
            });
        });
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = Database;