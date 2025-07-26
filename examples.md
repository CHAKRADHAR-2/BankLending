# API Usage Examples

This document provides practical examples of how to use the Bank Lending System API.

## Prerequisites

1. Start the server: `npm start`
2. Server runs on: `http://localhost:3000`

## Example 1: Complete Loan Lifecycle

### Step 1: Create a Loan
```bash
curl -X POST http://localhost:3000/api/lend \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST001",
    "loan_amount": 100000,
    "loan_period": 2,
    "interest_rate": 10
  }'
```

**Response:**
```json
{
  "loan_id": "3407f933-c725-4fd6-9b84-44a517cfa475",
  "customer_id": "CUST001",
  "principal_amount": 100000,
  "loan_period_years": 2,
  "interest_rate": 10,
  "total_interest": 20000,
  "total_amount": 120000,
  "monthly_emi": 5000,
  "total_emis": 24,
  "message": "Loan created successfully"
}
```

### Step 2: Make EMI Payment
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "3407f933-c725-4fd6-9b84-44a517cfa475",
    "payment_amount": 5000,
    "payment_type": "EMI"
  }'
```

### Step 3: Make Lump Sum Payment
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "3407f933-c725-4fd6-9b84-44a517cfa475",
    "payment_amount": 15000,
    "payment_type": "LUMP_SUM"
  }'
```

### Step 4: Check Loan Ledger
```bash
curl -X GET http://localhost:3000/api/ledger/3407f933-c725-4fd6-9b84-44a517cfa475
```

### Step 5: View Account Overview
```bash
curl -X GET http://localhost:3000/api/account/CUST001
```

## Example 2: Multiple Loans for Same Customer

### Create First Loan (Home Loan)
```bash
curl -X POST http://localhost:3000/api/lend \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST002",
    "loan_amount": 500000,
    "loan_period": 5,
    "interest_rate": 8.5
  }'
```

### Create Second Loan (Personal Loan)
```bash
curl -X POST http://localhost:3000/api/lend \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST002",
    "loan_amount": 50000,
    "loan_period": 1,
    "interest_rate": 12
  }'
```

### View Complete Account Overview
```bash
curl -X GET http://localhost:3000/api/account/CUST002
```

## Example 3: Different Interest Rate Scenarios

### Low Interest Rate Loan
```bash
curl -X POST http://localhost:3000/api/lend \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST003",
    "loan_amount": 200000,
    "loan_period": 3,
    "interest_rate": 6
  }'
```

**Calculation:**
- Interest = 200,000 × 3 × 0.06 = ₹36,000
- Total Amount = 200,000 + 36,000 = ₹236,000
- Monthly EMI = 236,000 ÷ 36 = ₹6,555.56

### High Interest Rate Loan
```bash
curl -X POST http://localhost:3000/api/lend \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST004",
    "loan_amount": 75000,
    "loan_period": 2,
    "interest_rate": 15
  }'
```

**Calculation:**
- Interest = 75,000 × 2 × 0.15 = ₹22,500
- Total Amount = 75,000 + 22,500 = ₹97,500
- Monthly EMI = 97,500 ÷ 24 = ₹4,062.50

## Example 4: Payment Scenarios

### Regular EMI Payments
```bash
# Month 1 EMI
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "your-loan-id",
    "payment_amount": 5000,
    "payment_type": "EMI"
  }'

# Month 2 EMI
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "your-loan-id",
    "payment_amount": 5000,
    "payment_type": "EMI"
  }'
```

### Lump Sum Payment (Reduces EMI Count)
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "your-loan-id",
    "payment_amount": 25000,
    "payment_type": "LUMP_SUM"
  }'
```

**Effect:** If EMI is ₹5,000, a ₹25,000 lump sum payment reduces EMI count by 5 (25,000 ÷ 5,000).

## Example 5: Error Handling

### Invalid Loan Amount
```bash
curl -X POST http://localhost:3000/api/lend \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST005",
    "loan_amount": -1000,
    "loan_period": 2,
    "interest_rate": 10
  }'
```

**Response:**
```json
{
  "error": "Invalid values: amounts and periods must be positive"
}
```

### Payment Exceeding Balance
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "your-loan-id",
    "payment_amount": 999999,
    "payment_type": "EMI"
  }'
```

**Response:**
```json
{
  "error": "Payment amount (999999) exceeds balance amount (current_balance)"
}
```

### Non-existent Loan
```bash
curl -X GET http://localhost:3000/api/ledger/invalid-loan-id
```

**Response:**
```json
{
  "error": "Loan not found"
}
```

## Example 6: Health Check

```bash
curl -X GET http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-07-26T07:12:54.685Z"
}
```

## JavaScript/Node.js Examples

### Using Axios
```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Create a loan
async function createLoan() {
  try {
    const response = await axios.post(`${BASE_URL}/lend`, {
      customer_id: 'CUST001',
      loan_amount: 100000,
      loan_period: 2,
      interest_rate: 10
    });
    console.log('Loan created:', response.data);
    return response.data.loan_id;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Make payment
async function makePayment(loanId) {
  try {
    const response = await axios.post(`${BASE_URL}/payment`, {
      loan_id: loanId,
      payment_amount: 5000,
      payment_type: 'EMI'
    });
    console.log('Payment made:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

### Using Fetch API
```javascript
// Create loan using fetch
async function createLoanWithFetch() {
  try {
    const response = await fetch('http://localhost:3000/api/lend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: 'CUST001',
        loan_amount: 100000,
        loan_period: 2,
        interest_rate: 10
      })
    });
    
    const data = await response.json();
    console.log('Loan created:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Testing with Postman

1. Import the following collection:
   - Base URL: `http://localhost:3000/api`
   - Create requests for each endpoint
   - Set appropriate headers: `Content-Type: application/json`

2. Test sequence:
   - POST `/lend` → Get loan_id
   - POST `/payment` → Use loan_id from step 1
   - GET `/ledger/{loan_id}` → View transactions
   - GET `/account/{customer_id}` → View all loans

## Performance Considerations

- The system uses SQLite which is suitable for development and small-scale production
- For high-volume production, consider migrating to PostgreSQL or MySQL
- Add connection pooling for better database performance
- Implement caching for frequently accessed data