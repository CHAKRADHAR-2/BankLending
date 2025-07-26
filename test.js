const axios = require('axios');

// Base URL for the API
const BASE_URL = 'http://localhost:3000/api';

// Test data
const testCustomerId = 'CUST001';
let testLoanId = null;

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
        throw error;
    }
}

// Test functions
async function testHealthCheck() {
    console.log('\n=== Testing Health Check ===');
    const result = await apiCall('GET', '/health');
    console.log('Health check result:', result);
}

async function testCreateLoan() {
    console.log('\n=== Testing LEND (Create Loan) ===');
    const loanData = {
        customer_id: testCustomerId,
        loan_amount: 100000,
        loan_period: 2,
        interest_rate: 10
    };
    
    const result = await apiCall('POST', '/lend', loanData);
    testLoanId = result.loan_id;
    console.log('Loan created:', result);
    
    // Verify calculations
    const expectedInterest = 100000 * 2 * 0.10; // 20000
    const expectedTotal = 100000 + 20000; // 120000
    const expectedEMI = 120000 / (2 * 12); // 5000
    
    console.log('Calculation verification:');
    console.log(`Expected Interest: ${expectedInterest}, Actual: ${result.total_interest}`);
    console.log(`Expected Total: ${expectedTotal}, Actual: ${result.total_amount}`);
    console.log(`Expected EMI: ${expectedEMI}, Actual: ${result.monthly_emi}`);
}

async function testEMIPayment() {
    console.log('\n=== Testing PAYMENT (EMI) ===');
    const paymentData = {
        loan_id: testLoanId,
        payment_amount: 5000,
        payment_type: 'EMI'
    };
    
    const result = await apiCall('POST', '/payment', paymentData);
    console.log('EMI payment result:', result);
}

async function testLumpSumPayment() {
    console.log('\n=== Testing PAYMENT (Lump Sum) ===');
    const paymentData = {
        loan_id: testLoanId,
        payment_amount: 15000,
        payment_type: 'LUMP_SUM'
    };
    
    const result = await apiCall('POST', '/payment', paymentData);
    console.log('Lump sum payment result:', result);
}

async function testLedger() {
    console.log('\n=== Testing LEDGER ===');
    const result = await apiCall('GET', `/ledger/${testLoanId}`);
    console.log('Ledger result:', JSON.stringify(result, null, 2));
}

async function testAccountOverview() {
    console.log('\n=== Testing ACCOUNT OVERVIEW ===');
    const result = await apiCall('GET', `/account/${testCustomerId}`);
    console.log('Account overview:', JSON.stringify(result, null, 2));
}

async function testCreateSecondLoan() {
    console.log('\n=== Testing Second Loan Creation ===');
    const loanData = {
        customer_id: testCustomerId,
        loan_amount: 50000,
        loan_period: 1,
        interest_rate: 12
    };
    
    const result = await apiCall('POST', '/lend', loanData);
    console.log('Second loan created:', result);
}

// Main test function
async function runTests() {
    console.log('Starting Bank Lending System Tests...');
    console.log('Make sure the server is running on port 3000');
    
    try {
        await testHealthCheck();
        await testCreateLoan();
        await testEMIPayment();
        await testLumpSumPayment();
        await testLedger();
        await testCreateSecondLoan();
        await testAccountOverview();
        
        console.log('\n=== All Tests Completed Successfully! ===');
    } catch (error) {
        console.error('\n=== Test Failed ===');
        console.error('Error:', error.message);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };