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
            
            const resultHTML = `
                <h3><i class="fas fa-check-circle"></i> Loan Created Successfully!</h3>
                <div class="loan-details">
                    <p><strong>Loan ID:</strong> ${result.loan_id}</p>
                    <p><strong>Customer ID:</strong> ${result.customer_id}</p>
                    <p><strong>Principal Amount:</strong> ${formatCurrency(result.principal_amount)}</p>
                    <p><strong>Loan Period:</strong> ${result.loan_period_years} years</p>
                    <p><strong>Interest Rate:</strong> ${result.interest_rate}%</p>
                    <p><strong>Total Interest:</strong> ${formatCurrency(result.total_interest)}</p>
                    <p><strong>Total Amount:</strong> ${formatCurrency(result.total_amount)}</p>
                    <p><strong>Monthly EMI:</strong> ${formatCurrency(result.monthly_emi)}</p>
                    <p><strong>Total EMIs:</strong> ${result.total_emis}</p>
                </div>
                <div class="calculation-breakdown">
                    <h4>Calculation Breakdown:</h4>
                    <ul>
                        <li>Interest = ${formatCurrency(result.principal_amount)} × ${result.loan_period_years} × ${result.interest_rate}% = ${formatCurrency(result.total_interest)}</li>
                        <li>Total Amount = ${formatCurrency(result.principal_amount)} + ${formatCurrency(result.total_interest)} = ${formatCurrency(result.total_amount)}</li>
                        <li>Monthly EMI = ${formatCurrency(result.total_amount)} ÷ ${result.total_emis} = ${formatCurrency(result.monthly_emi)}</li>
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
            
            const resultHTML = `
                <h3><i class="fas fa-check-circle"></i> Payment Processed Successfully!</h3>
                <div class="payment-details">
                    <p><strong>Transaction ID:</strong> ${result.transaction_id}</p>
                    <p><strong>Loan ID:</strong> ${result.loan_id}</p>
                    <p><strong>Payment Amount:</strong> ${formatCurrency(result.payment_amount)}</p>
                    <p><strong>Payment Type:</strong> ${result.payment_type}</p>
                    <p><strong>Balance Before:</strong> ${formatCurrency(result.balance_before)}</p>
                    <p><strong>Balance After:</strong> ${formatCurrency(result.balance_after)}</p>
                    <p><strong>EMIs Remaining:</strong> ${result.emis_remaining}</p>
                    <p><strong>Loan Status:</strong> <span class="status-${result.loan_status.toLowerCase()}">${result.loan_status}</span></p>
                </div>
                ${result.payment_type === 'LUMP_SUM' ? `
                <div class="emi-reduction">
                    <h4>EMI Reduction Calculation:</h4>
                    <p>EMIs Reduced: ${formatCurrency(result.payment_amount)} ÷ Monthly EMI = ${Math.floor(result.payment_amount / (result.balance_before - result.balance_after + result.payment_amount) * result.emis_remaining / result.balance_after)} EMIs</p>
                </div>
                ` : ''}
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
            
            let transactionsHTML = '';
            if (result.transactions && result.transactions.length > 0) {
                transactionsHTML = result.transactions.map(transaction => `
                    <tr>
                        <td>${transaction.transaction_id.substring(0, 8)}...</td>
                        <td>${formatCurrency(transaction.payment_amount)}</td>
                        <td><span class="payment-type-${transaction.payment_type.toLowerCase()}">${transaction.payment_type}</span></td>
                        <td>${formatDate(transaction.transaction_date)}</td>
                        <td>${formatCurrency(transaction.balance_before)}</td>
                        <td>${formatCurrency(transaction.balance_after)}</td>
                        <td>${transaction.emis_remaining_after}</td>
                    </tr>
                `).join('');
            } else {
                transactionsHTML = '<tr><td colspan="7" class="text-center">No transactions found</td></tr>';
            }
            
            const resultHTML = `
                <h3><i class="fas fa-book"></i> Loan Ledger</h3>
                <div class="ledger-summary">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <h4>Loan Details</h4>
                            <p><strong>Loan ID:</strong> ${result.loan_id}</p>
                            <p><strong>Customer ID:</strong> ${result.customer_id}</p>
                            <p><strong>Principal:</strong> ${formatCurrency(result.loan_details.principal_amount)}</p>
                            <p><strong>Total Amount:</strong> ${formatCurrency(result.loan_details.total_amount)}</p>
                            <p><strong>Monthly EMI:</strong> ${formatCurrency(result.loan_details.monthly_emi)}</p>
                            <p><strong>Status:</strong> <span class="status-${result.loan_details.loan_status.toLowerCase()}">${result.loan_details.loan_status}</span></p>
                        </div>
                        <div class="summary-item">
                            <h4>Current Status</h4>
                            <p><strong>Balance Amount:</strong> ${formatCurrency(result.current_status.balance_amount)}</p>
                            <p><strong>Amount Paid:</strong> ${formatCurrency(result.current_status.amount_paid)}</p>
                            <p><strong>EMIs Paid:</strong> ${result.current_status.emis_paid}</p>
                            <p><strong>EMIs Remaining:</strong> ${result.current_status.emis_remaining}</p>
                            <p><strong>Progress:</strong> ${Math.round((result.current_status.emis_paid / (result.current_status.emis_paid + result.current_status.emis_remaining)) * 100)}%</p>
                        </div>
                    </div>
                </div>
                <div class="transactions-table">
                    <h4>Transaction History</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Amount</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Balance Before</th>
                                <th>Balance After</th>
                                <th>EMIs Remaining</th>
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
            
            let loansHTML = '';
            if (result.loans && result.loans.length > 0) {
                loansHTML = result.loans.map(loan => `
                    <div class="loan-card">
                        <div class="loan-header">
                            <h4>Loan ID: ${loan.loan_id.substring(0, 8)}...</h4>
                            <span class="status-badge status-${loan.loan_status.toLowerCase()}">${loan.loan_status}</span>
                        </div>
                        <div class="loan-details-grid">
                            <div class="detail-item">
                                <span class="label">Principal:</span>
                                <span class="value">${formatCurrency(loan.principal_amount)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Total Amount:</span>
                                <span class="value">${formatCurrency(loan.total_amount)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Monthly EMI:</span>
                                <span class="value">${formatCurrency(loan.monthly_emi)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Amount Paid:</span>
                                <span class="value">${formatCurrency(loan.amount_paid)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Balance:</span>
                                <span class="value">${formatCurrency(loan.balance_amount)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">EMIs Paid:</span>
                                <span class="value">${loan.emis_paid}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">EMIs Remaining:</span>
                                <span class="value">${loan.emis_remaining}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Created:</span>
                                <span class="value">${formatDate(loan.created_at)}</span>
                            </div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.round((loan.emis_paid / (loan.emis_paid + loan.emis_remaining)) * 100)}%"></div>
                        </div>
                        <div class="progress-text">${Math.round((loan.emis_paid / (loan.emis_paid + loan.emis_remaining)) * 100)}% Complete</div>
                    </div>
                `).join('');
            } else {
                loansHTML = '<div class="no-loans">No loans found for this customer.</div>';
            }
            
            const resultHTML = `
                <h3><i class="fas fa-user"></i> Account Overview - ${result.customer_id}</h3>
                <div class="account-summary">
                    <div class="summary-stats">
                        <div class="stat-item">
                            <div class="stat-value">${result.total_loans}</div>
                            <div class="stat-label">Total Loans</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${formatCurrency(result.summary.total_principal)}</div>
                            <div class="stat-label">Total Principal</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${formatCurrency(result.summary.total_amount)}</div>
                            <div class="stat-label">Total Amount</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${formatCurrency(result.summary.total_paid)}</div>
                            <div class="stat-label">Total Paid</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${formatCurrency(result.summary.total_balance)}</div>
                            <div class="stat-label">Total Balance</div>
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