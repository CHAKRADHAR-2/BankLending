const { v4: uuidv4 } = require('uuid');

class LoanService {
    constructor(database) {
        this.db = database;
    }

    // Calculate loan details based on the given formula
    calculateLoanDetails(principal, years, rate) {
        // I = P * N * R (Simple Interest)
        const totalInterest = principal * years * (rate / 100);
        
        // A = P + I
        const totalAmount = principal + totalInterest;
        
        // Monthly EMI = Total Amount / (Years * 12)
        const totalMonths = years * 12;
        const monthlyEMI = totalAmount / totalMonths;

        return {
            principal,
            totalInterest,
            totalAmount,
            monthlyEMI: Math.round(monthlyEMI * 100) / 100, // Round to 2 decimal places
            totalMonths
        };
    }

    // LEND: Create a new loan
    async createLoan(customerId, loanAmount, loanPeriod, interestRate) {
        const loanId = uuidv4();
        const loanDetails = this.calculateLoanDetails(loanAmount, loanPeriod, interestRate);

        const insertLoanSql = `
            INSERT INTO loans (
                loan_id, customer_id, principal_amount, loan_period, interest_rate,
                total_interest, total_amount, monthly_emi, balance_amount, emis_remaining
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.db.run(insertLoanSql, [
            loanId,
            customerId,
            loanAmount,
            loanPeriod,
            interestRate,
            loanDetails.totalInterest,
            loanDetails.totalAmount,
            loanDetails.monthlyEMI,
            loanDetails.totalAmount, // Initial balance is total amount
            loanDetails.totalMonths
        ]);

        return {
            loan_id: loanId,
            customer_id: customerId,
            principal_amount: loanAmount,
            loan_period_years: loanPeriod,
            interest_rate: interestRate,
            total_interest: loanDetails.totalInterest,
            total_amount: loanDetails.totalAmount,
            monthly_emi: loanDetails.monthlyEMI,
            total_emis: loanDetails.totalMonths,
            message: 'Loan created successfully'
        };
    }

    // PAYMENT: Process loan payment
    async makePayment(loanId, paymentAmount, paymentType = 'EMI') {
        // Get current loan details
        const loan = await this.db.get('SELECT * FROM loans WHERE loan_id = ?', [loanId]);
        
        if (!loan) {
            throw new Error('Loan not found');
        }

        if (loan.loan_status === 'CLOSED') {
            throw new Error('Loan is already closed');
        }

        if (paymentAmount > loan.balance_amount) {
            throw new Error(`Payment amount (${paymentAmount}) exceeds balance amount (${loan.balance_amount})`);
        }

        const transactionId = uuidv4();
        const balanceBefore = loan.balance_amount;
        const emisRemainingBefore = loan.emis_remaining;
        
        let balanceAfter = balanceBefore - paymentAmount;
        let emisRemainingAfter = emisRemainingBefore;
        let emisPaidIncrement = 0;

        // Calculate EMIs reduction for lump sum payments
        if (paymentType === 'LUMP_SUM') {
            const emisReduced = Math.floor(paymentAmount / loan.monthly_emi);
            emisRemainingAfter = Math.max(0, emisRemainingBefore - emisReduced);
            emisPaidIncrement = emisReduced;
        } else if (paymentType === 'EMI') {
            emisRemainingAfter = Math.max(0, emisRemainingBefore - 1);
            emisPaidIncrement = 1;
        }

        // Determine loan status
        const newLoanStatus = balanceAfter <= 0 ? 'CLOSED' : 'ACTIVE';
        if (balanceAfter <= 0) {
            balanceAfter = 0;
            emisRemainingAfter = 0;
        }

        // Insert transaction record
        const insertTransactionSql = `
            INSERT INTO transactions (
                transaction_id, loan_id, payment_amount, payment_type,
                balance_before, balance_after, emis_remaining_before, emis_remaining_after
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.db.run(insertTransactionSql, [
            transactionId,
            loanId,
            paymentAmount,
            paymentType,
            balanceBefore,
            balanceAfter,
            emisRemainingBefore,
            emisRemainingAfter
        ]);

        // Update loan record
        const updateLoanSql = `
            UPDATE loans SET 
                amount_paid = amount_paid + ?,
                balance_amount = ?,
                emis_paid = emis_paid + ?,
                emis_remaining = ?,
                loan_status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE loan_id = ?
        `;

        await this.db.run(updateLoanSql, [
            paymentAmount,
            balanceAfter,
            emisPaidIncrement,
            emisRemainingAfter,
            newLoanStatus,
            loanId
        ]);

        return {
            transaction_id: transactionId,
            loan_id: loanId,
            payment_amount: paymentAmount,
            payment_type: paymentType,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            emis_remaining: emisRemainingAfter,
            loan_status: newLoanStatus,
            message: newLoanStatus === 'CLOSED' ? 'Loan fully paid and closed' : 'Payment processed successfully'
        };
    }

    // LEDGER: Get transaction history for a loan
    async getLoanLedger(loanId) {
        // Get loan details
        const loan = await this.db.get('SELECT * FROM loans WHERE loan_id = ?', [loanId]);
        
        if (!loan) {
            throw new Error('Loan not found');
        }

        // Get all transactions for this loan
        const transactions = await this.db.all(
            'SELECT * FROM transactions WHERE loan_id = ? ORDER BY transaction_date ASC',
            [loanId]
        );

        return {
            loan_id: loanId,
            customer_id: loan.customer_id,
            loan_details: {
                principal_amount: loan.principal_amount,
                total_amount: loan.total_amount,
                monthly_emi: loan.monthly_emi,
                loan_status: loan.loan_status
            },
            current_status: {
                balance_amount: loan.balance_amount,
                amount_paid: loan.amount_paid,
                emis_paid: loan.emis_paid,
                emis_remaining: loan.emis_remaining
            },
            transactions: transactions.map(t => ({
                transaction_id: t.transaction_id,
                payment_amount: t.payment_amount,
                payment_type: t.payment_type,
                transaction_date: t.transaction_date,
                balance_before: t.balance_before,
                balance_after: t.balance_after,
                emis_remaining_after: t.emis_remaining_after
            }))
        };
    }

    // ACCOUNT OVERVIEW: Get all loans for a customer
    async getAccountOverview(customerId) {
        const loans = await this.db.all(
            'SELECT * FROM loans WHERE customer_id = ? ORDER BY created_at DESC',
            [customerId]
        );

        const loanSummary = loans.map(loan => ({
            loan_id: loan.loan_id,
            principal_amount: loan.principal_amount,
            total_amount: loan.total_amount,
            total_interest: loan.total_interest,
            monthly_emi: loan.monthly_emi,
            amount_paid: loan.amount_paid,
            balance_amount: loan.balance_amount,
            emis_paid: loan.emis_paid,
            emis_remaining: loan.emis_remaining,
            loan_status: loan.loan_status,
            created_at: loan.created_at
        }));

        // Calculate totals
        const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principal_amount, 0);
        const totalAmount = loans.reduce((sum, loan) => sum + loan.total_amount, 0);
        const totalPaid = loans.reduce((sum, loan) => sum + loan.amount_paid, 0);
        const totalBalance = loans.reduce((sum, loan) => sum + loan.balance_amount, 0);

        return {
            customer_id: customerId,
            total_loans: loans.length,
            summary: {
                total_principal: totalPrincipal,
                total_amount: totalAmount,
                total_paid: totalPaid,
                total_balance: totalBalance
            },
            loans: loanSummary
        };
    }
}

module.exports = LoanService;