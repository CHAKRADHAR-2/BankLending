const { v4: uuidv4 } = require('uuid');

class MemoryDatabase {
    constructor() {
        this.loans = new Map();
        this.payments = new Map();
        this.customers = new Map();
    }

    async init() {
        // Initialize with some sample data for demonstration
        console.log('Memory database initialized');
        return Promise.resolve();
    }

    async createLoan(customer_id, loan_amount, loan_period, interest_rate) {
        const loan_id = uuidv4();
        const created_at = new Date().toISOString();
        
        const loan = {
            loan_id,
            customer_id,
            loan_amount: parseFloat(loan_amount),
            loan_period: parseInt(loan_period),
            interest_rate: parseFloat(interest_rate),
            outstanding_balance: parseFloat(loan_amount),
            status: 'ACTIVE',
            created_at
        };

        this.loans.set(loan_id, loan);
        
        // Track customer
        if (!this.customers.has(customer_id)) {
            this.customers.set(customer_id, []);
        }
        this.customers.get(customer_id).push(loan_id);

        return loan;
    }

    async getLoan(loan_id) {
        const loan = this.loans.get(loan_id);
        if (!loan) {
            throw new Error(`Loan with ID ${loan_id} not found`);
        }
        return loan;
    }

    async updateLoan(loan_id, updates) {
        const loan = this.loans.get(loan_id);
        if (!loan) {
            throw new Error(`Loan with ID ${loan_id} not found`);
        }
        
        const updatedLoan = { ...loan, ...updates };
        this.loans.set(loan_id, updatedLoan);
        return updatedLoan;
    }

    async createPayment(loan_id, payment_amount, payment_type) {
        const payment_id = uuidv4();
        const created_at = new Date().toISOString();
        
        const payment = {
            payment_id,
            loan_id,
            payment_amount: parseFloat(payment_amount),
            payment_type,
            created_at
        };

        if (!this.payments.has(loan_id)) {
            this.payments.set(loan_id, []);
        }
        this.payments.get(loan_id).push(payment);

        return payment;
    }

    async getPaymentsByLoan(loan_id) {
        return this.payments.get(loan_id) || [];
    }

    async getLoansByCustomer(customer_id) {
        const loanIds = this.customers.get(customer_id) || [];
        return loanIds.map(id => this.loans.get(id)).filter(Boolean);
    }

    async getAllLoans() {
        return Array.from(this.loans.values());
    }

    async getAllPayments() {
        const allPayments = [];
        for (const payments of this.payments.values()) {
            allPayments.push(...payments);
        }
        return allPayments;
    }

    // Helper method to get loan with payments
    async getLoanWithPayments(loan_id) {
        const loan = await this.getLoan(loan_id);
        const payments = await this.getPaymentsByLoan(loan_id);
        return { ...loan, payments };
    }
}

module.exports = MemoryDatabase;