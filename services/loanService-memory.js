class LoanService {
    constructor(database) {
        this.db = database;
    }

    async createLoan(customer_id, loan_amount, loan_period, interest_rate) {
        try {
            const loan = await this.db.createLoan(customer_id, loan_amount, loan_period, interest_rate);
            
            return {
                success: true,
                message: 'Loan created successfully',
                data: {
                    loan_id: loan.loan_id,
                    customer_id: loan.customer_id,
                    loan_amount: loan.loan_amount,
                    loan_period: loan.loan_period,
                    interest_rate: loan.interest_rate,
                    outstanding_balance: loan.outstanding_balance,
                    status: loan.status,
                    created_at: loan.created_at
                }
            };
        } catch (error) {
            throw new Error(`Failed to create loan: ${error.message}`);
        }
    }

    async makePayment(loan_id, payment_amount, payment_type = 'EMI') {
        try {
            // Get the loan
            const loan = await this.db.getLoan(loan_id);
            
            if (loan.status !== 'ACTIVE') {
                throw new Error('Cannot make payment on inactive loan');
            }

            if (payment_amount > loan.outstanding_balance) {
                throw new Error('Payment amount exceeds outstanding balance');
            }

            // Create payment record
            const payment = await this.db.createPayment(loan_id, payment_amount, payment_type);
            
            // Update loan balance
            const new_balance = loan.outstanding_balance - payment_amount;
            const status = new_balance <= 0 ? 'PAID' : 'ACTIVE';
            
            await this.db.updateLoan(loan_id, {
                outstanding_balance: new_balance,
                status: status
            });

            return {
                success: true,
                message: 'Payment processed successfully',
                data: {
                    payment_id: payment.payment_id,
                    loan_id: payment.loan_id,
                    payment_amount: payment.payment_amount,
                    payment_type: payment.payment_type,
                    remaining_balance: new_balance,
                    loan_status: status,
                    payment_date: payment.created_at
                }
            };
        } catch (error) {
            throw new Error(`Payment processing failed: ${error.message}`);
        }
    }

    async getLoanLedger(loan_id) {
        try {
            const loan = await this.db.getLoan(loan_id);
            const payments = await this.db.getPaymentsByLoan(loan_id);

            // Calculate total paid
            const total_paid = payments.reduce((sum, payment) => sum + payment.payment_amount, 0);

            return {
                success: true,
                data: {
                    loan_details: {
                        loan_id: loan.loan_id,
                        customer_id: loan.customer_id,
                        original_amount: loan.loan_amount,
                        interest_rate: loan.interest_rate,
                        loan_period: loan.loan_period,
                        outstanding_balance: loan.outstanding_balance,
                        status: loan.status,
                        created_at: loan.created_at
                    },
                    payment_history: payments.map(payment => ({
                        payment_id: payment.payment_id,
                        payment_amount: payment.payment_amount,
                        payment_type: payment.payment_type,
                        payment_date: payment.created_at
                    })),
                    summary: {
                        total_paid: total_paid,
                        outstanding_balance: loan.outstanding_balance,
                        number_of_payments: payments.length
                    }
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch loan ledger: ${error.message}`);
        }
    }

    async getAccountOverview(customer_id) {
        try {
            const loans = await this.db.getLoansByCustomer(customer_id);
            
            if (loans.length === 0) {
                return {
                    success: true,
                    message: 'No loans found for this customer',
                    data: {
                        customer_id: customer_id,
                        loans: [],
                        summary: {
                            total_loans: 0,
                            total_outstanding: 0,
                            active_loans: 0,
                            paid_loans: 0
                        }
                    }
                };
            }

            // Get payment details for each loan
            const loansWithPayments = await Promise.all(
                loans.map(async (loan) => {
                    const payments = await this.db.getPaymentsByLoan(loan.loan_id);
                    const total_paid = payments.reduce((sum, payment) => sum + payment.payment_amount, 0);
                    
                    return {
                        loan_id: loan.loan_id,
                        loan_amount: loan.loan_amount,
                        interest_rate: loan.interest_rate,
                        loan_period: loan.loan_period,
                        outstanding_balance: loan.outstanding_balance,
                        status: loan.status,
                        created_at: loan.created_at,
                        total_paid: total_paid,
                        number_of_payments: payments.length
                    };
                })
            );

            // Calculate summary
            const summary = {
                total_loans: loans.length,
                total_outstanding: loans.reduce((sum, loan) => sum + loan.outstanding_balance, 0),
                active_loans: loans.filter(loan => loan.status === 'ACTIVE').length,
                paid_loans: loans.filter(loan => loan.status === 'PAID').length
            };

            return {
                success: true,
                data: {
                    customer_id: customer_id,
                    loans: loansWithPayments,
                    summary: summary
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch account overview: ${error.message}`);
        }
    }
}

module.exports = LoanService;