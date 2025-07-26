# Bank Lending System

A RESTful API system for bank lending operations that allows banks to lend money to borrowers and manage loan payments.

## Features

- **LEND**: Create loans with flexible amounts, periods, and interest rates
- **PAYMENT**: Process EMI and lump sum payments
- **LEDGER**: View complete transaction history for any loan
- **ACCOUNT OVERVIEW**: Get comprehensive overview of all customer loans

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite (file-based)
- **Dependencies**: express, sqlite3, uuid, cors, axios

## Installation

1. Clone or download the project
2. Navigate to the project directory:
   ```bash
   cd bank-lending-system
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. Start the server:
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

2. The server will start on port 3000
3. Health check: http://localhost:3000/api/health

## API Endpoints

### 1. LEND - Create a New Loan

**Endpoint**: `POST /api/lend`

**Request Body**:
```json
{
  "customer_id": "CUST001",
  "loan_amount": 100000,
  "loan_period": 2,
  "interest_rate": 10
}
```

**Response**:
```json
{
  "loan_id": "uuid-generated-id",
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

### 2. PAYMENT - Make Loan Payment

**Endpoint**: `POST /api/payment`

**Request Body**:
```json
{
  "loan_id": "loan-uuid",
  "payment_amount": 5000,
  "payment_type": "EMI"
}
```

**Payment Types**:
- `EMI`: Regular monthly payment
- `LUMP_SUM`: Large payment that reduces EMI count

**Response**:
```json
{
  "transaction_id": "transaction-uuid",
  "loan_id": "loan-uuid",
  "payment_amount": 5000,
  "payment_type": "EMI",
  "balance_before": 120000,
  "balance_after": 115000,
  "emis_remaining": 23,
  "loan_status": "ACTIVE",
  "message": "Payment processed successfully"
}
```

### 3. LEDGER - Get Loan Transaction History

**Endpoint**: `GET /api/ledger/{loan_id}`

**Response**:
```json
{
  "loan_id": "loan-uuid",
  "customer_id": "CUST001",
  "loan_details": {
    "principal_amount": 100000,
    "total_amount": 120000,
    "monthly_emi": 5000,
    "loan_status": "ACTIVE"
  },
  "current_status": {
    "balance_amount": 100000,
    "amount_paid": 20000,
    "emis_paid": 4,
    "emis_remaining": 20
  },
  "transactions": [
    {
      "transaction_id": "trans-uuid",
      "payment_amount": 5000,
      "payment_type": "EMI",
      "transaction_date": "2024-01-15T10:30:00Z",
      "balance_before": 120000,
      "balance_after": 115000,
      "emis_remaining_after": 23
    }
  ]
}
```

### 4. ACCOUNT OVERVIEW - Get All Customer Loans

**Endpoint**: `GET /api/account/{customer_id}`

**Response**:
```json
{
  "customer_id": "CUST001",
  "total_loans": 2,
  "summary": {
    "total_principal": 150000,
    "total_amount": 180000,
    "total_paid": 25000,
    "total_balance": 155000
  },
  "loans": [
    {
      "loan_id": "loan-uuid-1",
      "principal_amount": 100000,
      "total_amount": 120000,
      "total_interest": 20000,
      "monthly_emi": 5000,
      "amount_paid": 15000,
      "balance_amount": 105000,
      "emis_paid": 3,
      "emis_remaining": 21,
      "loan_status": "ACTIVE",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Loan Calculations

The system uses simple interest calculation:

- **Interest (I)** = Principal (P) × Number of Years (N) × Rate of Interest (R)
- **Total Amount (A)** = Principal (P) + Interest (I)
- **Monthly EMI** = Total Amount (A) ÷ (Years × 12)

### Example Calculation:
- Principal: ₹100,000
- Period: 2 years
- Interest Rate: 10%
- Interest: 100,000 × 2 × 0.10 = ₹20,000
- Total Amount: 100,000 + 20,000 = ₹120,000
- Monthly EMI: 120,000 ÷ 24 = ₹5,000

## Database Schema

### Loans Table
- `loan_id` (TEXT, PRIMARY KEY)
- `customer_id` (TEXT)
- `principal_amount` (REAL)
- `loan_period` (INTEGER) - in years
- `interest_rate` (REAL) - percentage
- `total_interest` (REAL)
- `total_amount` (REAL)
- `monthly_emi` (REAL)
- `amount_paid` (REAL)
- `balance_amount` (REAL)
- `emis_paid` (INTEGER)
- `emis_remaining` (INTEGER)
- `loan_status` (TEXT) - ACTIVE/CLOSED
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Transactions Table
- `transaction_id` (TEXT, PRIMARY KEY)
- `loan_id` (TEXT, FOREIGN KEY)
- `payment_amount` (REAL)
- `payment_type` (TEXT) - EMI/LUMP_SUM
- `transaction_date` (DATETIME)
- `balance_before` (REAL)
- `balance_after` (REAL)
- `emis_remaining_before` (INTEGER)
- `emis_remaining_after` (INTEGER)

## Testing

Run the test suite:
```bash
npm test
```

The test file includes comprehensive tests for all API endpoints with sample data.

## Design Decisions

1. **Simple Interest**: Used simple interest calculation as specified in requirements
2. **SQLite Database**: File-based database for easy setup and portability
3. **UUID for IDs**: Ensures unique identifiers across the system
4. **Transaction Logging**: Complete audit trail of all payments
5. **Flexible Payments**: Support for both EMI and lump sum payments
6. **Status Tracking**: Automatic loan status management (ACTIVE/CLOSED)

## Error Handling

The API includes comprehensive error handling for:
- Invalid input validation
- Missing required fields
- Loan not found scenarios
- Payment amount validation
- Database operation errors

## Future Enhancements

- Authentication and authorization
- Interest rate variations
- Penalty calculations for late payments
- Loan restructuring capabilities
- Advanced reporting features
- Email notifications
- Web dashboard interface

## License

MIT License