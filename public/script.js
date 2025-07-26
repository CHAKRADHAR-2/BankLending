// API Base URL
const API_BASE = '/api';

// Tab Management
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Utility Functions
function showLoading(buttonElement) {
    const originalText = buttonElement.innerHTML;
    buttonElement.innerHTML = '<span class="loading"></span> Processing...';
    buttonElement.disabled = true;
    return originalText;
}

function hideLoading(buttonElement, originalText) {
    buttonElement.innerHTML = originalText;
    buttonElement.disabled = false;
}

function showResult(elementId, content, isError = false) {
    const resultElement = document.getElementById(elementId);
    resultElement.innerHTML = content;
    resultElement.className = `result-section ${isError ? 'error' : 'success'} fade-in`;
    resultElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-IN');
}

// API Call Function
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            config.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'API request failed');
        }
        
        return result;
    } catch (error) {
        throw new Error(error.message || 'Network error occurred');
    }
}

// Form Handlers
document.addEventListener('DOMContentLoaded', function() {
    // Health Check on Load
    checkServerHealth();
    
    // Lend Form Handler
    document.getElementById('lendForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = showLoading(submitBtn);
        
        try {
            const formData = new FormData(e.target);
            const data = {
                customer_id: formData.get('customer_id'),
                loan_amount: parseFloat(formData.get('loan_amount')),
                loan_period: parseInt(formData.get('loan_period')),
                interest_rate: parseFloat(formData.get('interest_rate'))
            };
            
            const result = await apiCall('/lend', 'POST', data);
            const loanData = result.data;
            
            // Calculate additional fields for display
            const totalInterest = loanData.loan_amount * (loanData.interest_rate / 100) * loanData.loan_period;
            const totalAmount = loanData.loan_amount + totalInterest;
            const totalMonths = loanData.loan_period * 12;
            const monthlyEMI = totalAmount / totalMonths;
            
            const resultHTML = `
                <h3><i class="fas fa-check-circle"></i> Loan Created Successfully!</h3>
                <div class="loan-details">
                    <p><strong>Loan ID:</strong> ${loanData.loan_id}</p>
                    <p><strong>Customer ID:</strong> ${loanData.customer_id}</p>
                    <p><strong>Principal Amount:</strong> ${formatCurrency(loanData.loan_amount)}</p>
                    <p><strong>Loan Period:</strong> ${loanData.loan_period} years</p>
                    <p><strong>Interest Rate:</strong> ${loanData.interest_rate}%</p>
                    <p><strong>Total Interest:</strong> ${formatCurrency(totalInterest)}</p>
                    <p><strong>Total Amount:</strong> ${formatCurrency(totalAmount)}</p>
                    <p><strong>Monthly EMI:</strong> ${formatCurrency(monthlyEMI)}</p>
                    <p><strong>Total EMIs:</strong> ${totalMonths}</p>
                </div>
                <div class="calculation-breakdown">
                    <h4>Calculation Breakdown:</h4>
                    <ul>
                        <li>Interest = ${formatCurrency(loanData.loan_amount)} × ${loanData.loan_period} × ${loanData.interest_rate}% = ${formatCurrency(totalInterest)}</li>
                        <li>Total Amount = ${formatCurrency(loanData.loan_amount)} + ${formatCurrency(totalInterest)} = ${formatCurrency(totalAmount)}</li>
                        <li>Monthly EMI = ${formatCurrency(totalAmount)} ÷ ${totalMonths} = ${formatCurrency(monthlyEMI)}</li>
                    </ul>
                </div>
            `;
            
            showResult('lendResult', resultHTML);
            e.target.reset();
            
        } catch (error) {
            showResult('lendResult', `<h3><i class="fas fa-exclamation-triangle"></i> Error</h3><p>${error.message}</p>`, true);
        } finally {
            hideLoading(submitBtn, originalText);
        }
    });
    
    // Payment Form Handler
    document.getElementById('paymentForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = showLoading(submitBtn);
        
        try {
            const formData = new FormData(e.target);
            const data = {
                loan_id: formData.get('loan_id'),
                payment_amount: parseFloat(formData.get('payment_amount')),
                payment_type: formData.get('payment_type')
            };
            
            const result = await apiCall('/payment', 'POST', data);
            const paymentData = result.data;
            
            const resultHTML = `
                <h3><i class="fas fa-check-circle"></i> Payment Processed Successfully!</h3>
                <div class="payment-details">
                    <p><strong>Payment ID:</strong> ${paymentData.payment_id}</p>
                    <p><strong>Loan ID:</strong> ${paymentData.loan_id}</p>
                    <p><strong>Payment Amount:</strong> ${formatCurrency(paymentData.payment_amount)}</p>
                    <p><strong>Payment Type:</strong> ${paymentData.payment_type}</p>
                    <p><strong>Remaining Balance:</strong> ${formatCurrency(paymentData.remaining_balance)}</p>
                    <p><strong>Loan Status:</strong> <span class="status-${paymentData.loan_status.toLowerCase()}">${paymentData.loan_status}</span></p>
                    <p><strong>Payment Date:</strong> ${formatDate(paymentData.payment_date)}</p>
                </div>
            `;
            
            showResult('paymentResult', resultHTML);
            e.target.reset();
            
        } catch (error) {
            showResult('paymentResult', `<h3><i class="fas fa-exclamation-triangle"></i> Error</h3><p>${error.message}</p>`, true);
        } finally {
            hideLoading(submitBtn, originalText);
        }
    });
    
    // Ledger Form Handler
    document.getElementById('ledgerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = showLoading(submitBtn);
        
        try {
            const formData = new FormData(e.target);
            const loanId = formData.get('loan_id');
            
            const result = await apiCall(`/ledger/${loanId}`);
            const ledgerData = result.data;
            
            let transactionsHTML = '';
            if (ledgerData.payment_history && ledgerData.payment_history.length > 0) {
                transactionsHTML = ledgerData.payment_history.map(payment => `
                    <tr>
                        <td>${payment.payment_id.substring(0, 8)}...</td>
                        <td>${formatCurrency(payment.payment_amount)}</td>
                        <td><span class="payment-type-${payment.payment_type.toLowerCase()}">${payment.payment_type}</span></td>
                        <td>${formatDate(payment.payment_date)}</td>
                    </tr>
                `).join('');
            } else {
                transactionsHTML = '<tr><td colspan="4" class="text-center">No transactions found</td></tr>';
            }
            
            const resultHTML = `
                <h3><i class="fas fa-book"></i> Loan Ledger</h3>
                <div class="ledger-summary">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <h4>Loan Details</h4>
                            <p><strong>Loan ID:</strong> ${ledgerData.loan_details.loan_id}</p>
                            <p><strong>Customer ID:</strong> ${ledgerData.loan_details.customer_id}</p>
                            <p><strong>Original Amount:</strong> ${formatCurrency(ledgerData.loan_details.original_amount)}</p>
                            <p><strong>Interest Rate:</strong> ${ledgerData.loan_details.interest_rate}%</p>
                            <p><strong>Loan Period:</strong> ${ledgerData.loan_details.loan_period} years</p>
                            <p><strong>Status:</strong> <span class="status-${ledgerData.loan_details.status.toLowerCase()}">${ledgerData.loan_details.status}</span></p>
                        </div>
                        <div class="summary-item">
                            <h4>Payment Summary</h4>
                            <p><strong>Total Paid:</strong> ${formatCurrency(ledgerData.summary.total_paid)}</p>
                            <p><strong>Outstanding Balance:</strong> ${formatCurrency(ledgerData.summary.outstanding_balance)}</p>
                            <p><strong>Number of Payments:</strong> ${ledgerData.summary.number_of_payments}</p>
                        </div>
                    </div>
                </div>
                <div class="transactions-table">
                    <h4>Payment History</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Payment ID</th>
                                <th>Amount</th>
                                <th>Type</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactionsHTML}
                        </tbody>
                    </table>
                </div>
            `;
            
            showResult('ledgerResult', resultHTML);
            
        } catch (error) {
            showResult('ledgerResult', `<h3><i class="fas fa-exclamation-triangle"></i> Error</h3><p>${error.message}</p>`, true);
        } finally {
            hideLoading(submitBtn, originalText);
        }
    });
    
    // Account Form Handler
    document.getElementById('accountForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = showLoading(submitBtn);
        
        try {
            const formData = new FormData(e.target);
            const customerId = formData.get('customer_id');
            
            const result = await apiCall(`/account/${customerId}`);
            const accountData = result.data;
            
            let loansHTML = '';
            if (accountData.loans && accountData.loans.length > 0) {
                loansHTML = accountData.loans.map(loan => {
                    const totalPaid = loan.loan_amount - loan.outstanding_balance;
                    const progressPercent = Math.round((totalPaid / loan.loan_amount) * 100);
                    
                    return `
                        <div class="loan-card">
                            <div class="loan-header">
                                <h4>Loan ID: ${loan.loan_id.substring(0, 8)}...</h4>
                                <span class="status-badge status-${loan.status.toLowerCase()}">${loan.status}</span>
                            </div>
                            <div class="loan-details-grid">
                                <div class="detail-item">
                                    <span class="label">Loan Amount:</span>
                                    <span class="value">${formatCurrency(loan.loan_amount)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Interest Rate:</span>
                                    <span class="value">${loan.interest_rate}%</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Loan Period:</span>
                                    <span class="value">${loan.loan_period} years</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Amount Paid:</span>
                                    <span class="value">${formatCurrency(loan.total_paid)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Outstanding Balance:</span>
                                    <span class="value">${formatCurrency(loan.outstanding_balance)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Payments Made:</span>
                                    <span class="value">${loan.number_of_payments}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Created:</span>
                                    <span class="value">${formatDate(loan.created_at)}</span>
                                </div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                            <div class="progress-text">${progressPercent}% Paid</div>
                        </div>
                    `;
                }).join('');
            } else {
                loansHTML = '<div class="no-loans">No loans found for this customer.</div>';
            }
            
            const resultHTML = `
                <h3><i class="fas fa-user"></i> Account Overview - ${accountData.customer_id}</h3>
                <div class="account-summary">
                    <div class="summary-stats">
                        <div class="stat-item">
                            <div class="stat-value">${accountData.summary.total_loans}</div>
                            <div class="stat-label">Total Loans</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${formatCurrency(accountData.summary.total_outstanding)}</div>
                            <div class="stat-label">Total Outstanding</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${accountData.summary.active_loans}</div>
                            <div class="stat-label">Active Loans</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${accountData.summary.paid_loans}</div>
                            <div class="stat-label">Paid Loans</div>
                        </div>
                    </div>
                </div>
                <div class="loans-container">
                    <h4>Individual Loans</h4>
                    ${loansHTML}
                </div>
            `;
            
            showResult('accountResult', resultHTML);
            
        } catch (error) {
            showResult('accountResult', `<h3><i class="fas fa-exclamation-triangle"></i> Error</h3><p>${error.message}</p>`, true);
        } finally {
            hideLoading(submitBtn, originalText);
        }
    });
});

// Health Check Function
async function checkServerHealth() {
    try {
        const result = await apiCall('/health');
        const statusElement = document.getElementById('serverStatus');
        if (statusElement) {
            statusElement.innerHTML = '🟢 Running on port 3000';
            statusElement.className = 'status-indicator online';
        }
    } catch (error) {
        const statusElement = document.getElementById('serverStatus');
        if (statusElement) {
            statusElement.innerHTML = '🔴 Server Offline';
            statusElement.className = 'status-indicator offline';
        }
    }
}

// Auto-refresh server status every 30 seconds
setInterval(checkServerHealth, 30000);

// Add some additional CSS styles dynamically
const additionalStyles = `
<style>
.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.summary-item {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid #3498db;
}

.summary-item h4 {
    color: #2c3e50;
    margin-bottom: 1rem;
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.5rem;
}

.transactions-table {
    margin-top: 2rem;
}

.transactions-table table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.transactions-table th,
.transactions-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

.transactions-table th {
    background: #2c3e50;
    color: white;
    font-weight: 600;
}

.transactions-table tr:hover {
    background: #f8f9fa;
}

.payment-type-emi {
    background: #d4edda;
    color: #155724;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
}

.payment-type-lump_sum {
    background: #fff3cd;
    color: #856404;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
}

.status-active {
    color: #27ae60;
    font-weight: bold;
}

.status-closed {
    color: #e74c3c;
    font-weight: bold;
}

.summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.stat-item {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    border-top: 4px solid #3498db;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.stat-label {
    color: #666;
    font-size: 0.9rem;
}

.loan-card {
    background: white;
    border-radius: 10px;
    padding: 2rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    border-left: 4px solid #3498db;
}

.loan-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
}

.loan-header h4 {
    color: #2c3e50;
    margin: 0;
}

.status-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
}

.status-badge.status-active {
    background: #d4edda;
    color: #155724;
}

.status-badge.status-closed {
    background: #f8d7da;
    color: #721c24;
}

.loan-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0;
}

.detail-item .label {
    color: #666;
    font-weight: 500;
}

.detail-item .value {
    color: #2c3e50;
    font-weight: 600;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3498db, #2ecc71);
    transition: width 0.3s ease;
}

.progress-text {
    text-align: center;
    font-size: 0.9rem;
    color: #666;
}

.no-loans {
    text-align: center;
    padding: 3rem;
    color: #666;
    font-style: italic;
}

.status-indicator.online {
    color: #27ae60;
}

.status-indicator.offline {
    color: #e74c3c;
}

@media (max-width: 768px) {
    .summary-stats {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .loan-details-grid {
        grid-template-columns: 1fr;
    }
    
    .transactions-table {
        overflow-x: auto;
    }
    
    .transactions-table table {
        min-width: 600px;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);