# M-PESA Expense Tracker
![Node.js](https://img.shields.io/badge/Node.js-Backend-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql)

A personal finance project built around M-PESA transaction messages (M-PESA is a mobile money service widely used in Kenya and other African countries). It transforms these messages into structured financial records, making it easier to organize spending and understand where money goes.

> **Project status:** Backend API in development. The transaction-processing and category endpoints are implemented; the frontend, secure phone integration, and deployment are still planned.

## Tech Stack

- **Runtime:** Node.js
- **Backend:** Express.js
- **Database:** PostgreSQL
- **Testing:** Node.js built-in test runner
- **Transaction processing:** Regular expressions and date parsing

## Features

- Parse supported M-PESA messages for incoming and outgoing transactions.
- Extract transaction references, amounts, counterparties, and transaction dates.
- Store transactions in PostgreSQL.
- Prevent duplicate transactions using unique transaction references.
- Organize transactions into categories.
- Create categories and assign them to transactions.
- Validate transaction data using application logic and database constraints.
- Test transaction parsing, including malformed messages and invalid dates.

## How It Works

The planned application will receive selected M-PESA SMS messages through an Android SMS-forwarding application. The backend will parse each message, validate the transaction, and store it in PostgreSQL.

```text
M-PESA SMS
    |
    v
Android SMS Forwarder
    |
    v
Express.js API
    |
    v
Message Parser
    |
    v
PostgreSQL Database
    |
    v
Expense Tracking Dashboard
```

*The complete phone-to-dashboard workflow is a work in progress. The diagram represents the intended architecture, not a fully deployed system.*

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Abdirahman0646/mpesa-expense-tracker.git
cd mpesa-expense-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mpesa_tracker
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
PORT=3000
```

Replace the example database credentials with your own local PostgreSQL settings. Never commit your `.env` file or real credentials to GitHub.

### 4. Prepare the database

Create the PostgreSQL database and required tables before starting the API. The database schema setup will be documented separately as the project develops.

### 5. Start the API

```bash
node server.js
```

The API runs on port `3000` by default.

Check the root endpoint:

```text
GET http://localhost:3000/
```

Expected response:

```json
{
  "message": "M-PESA Expense Tracker API is running"
}
```

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Check API status |
| POST | `/webhook` | Receive and process an SMS message |
| GET | `/transactions` | Retrieve stored transactions |
| GET | `/categories` | Retrieve available categories |
| POST | `/categories` | Create a category |
| PATCH | `/transactions/:reference/category` | Assign a category to a transaction |

## Running Tests

Run the transaction parser test suite:

```bash
node --test src/parser.test.js
```

The current test suite covers valid incoming and outgoing messages, amount extraction, date conversion, invalid dates, malformed amounts, and other edge cases.

## Security

- Never share M-PESA PINs, OTPs, or account credentials.
- Keep database credentials in environment variables.
- Use HTTPS and authenticate webhook requests before connecting a real phone.
- Do not expose the current unauthenticated webhook to the public internet.
- Use synthetic transaction messages during development and testing.

## Current Limitations

- Only the supported M-PESA SMS formats are parsed.
- The frontend dashboard has not yet been implemented.
- Real phone integration and production deployment are not yet complete.
- Webhook authentication and production security hardening remain outstanding.

## Project Goals

The next stages are to secure the webhook, integrate an Android SMS forwarder, improve transaction handling, and build a dashboard for reviewing and analyzing expenses.

---

Built as a hands-on learning project to develop practical skills in backend development, database design, API testing, and application security.