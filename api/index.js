const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const MemoryDatabase = require('../database-memory');
const LoanService = require('../services/loanService-memory');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Initialize database and services
const db = new MemoryDatabase();
const loanService = new LoanService(db);

// Initialize database tables
db.init().then(() => {
    console.log('Database initialized successfully');
}).catch(err => {
    console.error('Database initialization failed:', err);
});

// Routes

// LEND: Create a new loan
app.post('/api/lend', async (req, res) => {
    try {
        const { customer_id, loan_amount, loan_period, interest_rate } = req.body;
        
        // Validate input
        if (!customer_id || !loan_amount || !loan_period || !interest_rate) {
            return res.status(400).json({
                error: 'Missing required fields: customer_id, loan_amount, loan_period, interest_rate'
            });
        }

        if (loan_amount <= 0 || loan_period <= 0 || interest_rate < 0) {
            return res.status(400).json({
                error: 'Invalid values: amounts and periods must be positive'
            });
        }

        const result = await loanService.createLoan(customer_id, loan_amount, loan_period, interest_rate);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating loan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PAYMENT: Make a payment towards a loan
app.post('/api/payment', async (req, res) => {
    try {
        const { loan_id, payment_amount, payment_type } = req.body;
        
        // Validate input
        if (!loan_id || !payment_amount) {
            return res.status(400).json({
                error: 'Missing required fields: loan_id, payment_amount'
            });
        }

        if (payment_amount <= 0) {
            return res.status(400).json({
                error: 'Payment amount must be positive'
            });
        }

        const validPaymentTypes = ['EMI', 'LUMP_SUM'];
        const paymentType = payment_type || 'EMI';
        
        if (!validPaymentTypes.includes(paymentType)) {
            return res.status(400).json({
                error: 'Invalid payment_type. Must be EMI or LUMP_SUM'
            });
        }

        const result = await loanService.makePayment(loan_id, payment_amount, paymentType);
        res.json(result);
    } catch (error) {
        console.error('Error processing payment:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// LEDGER: Get transaction history for a loan
app.get('/api/ledger/:loan_id', async (req, res) => {
    try {
        const { loan_id } = req.params;
        
        if (!loan_id) {
            return res.status(400).json({
                error: 'Loan ID is required'
            });
        }

        const result = await loanService.getLoanLedger(loan_id);
        res.json(result);
    } catch (error) {
        console.error('Error fetching ledger:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// ACCOUNT OVERVIEW: Get all loans for a customer
app.get('/api/account/:customer_id', async (req, res) => {
    try {
        const { customer_id } = req.params;
        
        if (!customer_id) {
            return res.status(400).json({
                error: 'Customer ID is required'
            });
        }

        const result = await loanService.getAccountOverview(customer_id);
        res.json(result);
    } catch (error) {
        console.error('Error fetching account overview:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Handle all routes
app.all('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        res.sendFile(path.join(__dirname, '../public', 'index.html'));
    }
});

module.exports = app;