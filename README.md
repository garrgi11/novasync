# GridSync - Decentralized Automated Electricity Top-Up System

**GridSync** is a decentralized, automated electricity top-up system designed for prepaid energy markets like those in Kenya and other developing regions. It eliminates the outdated, manual process of entering long tokens into physical meters and replaces it with a smart, **Solana-powered solution** that leverages real-time electricity pricing and decentralized trading strategies.

---

## 🔌 The Problem

In many parts of the world, consumers must **prepay for electricity** and manually enter **20-digit tokens** into meters. This system is:

* Time-consuming
* Prone to errors
* Blind to energy price fluctuations

This creates inefficiencies for both **consumers** and **utility providers**, leaving people paying more than they should.

---

## ⚡ Our Solution

GridSync automates prepaid electricity purchases through **Web3 + Solana integration**:

1. **Direct Payment Integration** – Linking payments directly to **meter IDs**, automatically crediting electricity without manual input.
2. **Solana Trading Strategies** – Users deposit SOL and GridSync executes automated trading strategies using **Solana smart contracts**.
3. **Smart Execution** – GridSync buys electricity at **optimal times** (like off-peak hours at night) for maximum savings.
4. **Instant Delivery** – Tokens are instantly credited to the user’s meter — no manual typing required.

---

## ⚙️ How It Works

1. **Payment**: User pays via fiat or crypto through **Solana Pay**.
2. **Deposit**: User deposits SOL into the GridSync app.
3. **Automated Trading**: Smart contracts use **custom Solana trading strategies** to purchase electricity when rates are favorable.
4. **Credit Delivery**: Tokens are automatically synced and credited to the user’s electricity meter.

---

## 🌍 Benefits

* **Consumers** save money by purchasing electricity at cheaper, off-peak times.
* **Utility providers** benefit from smoother demand management.
* **Global scalability** – Works across any prepaid electricity market.
* **Frictionless onboarding** – Built directly on **Solana Pay + Solana Actions**.

---

## 🛠️ Technology Stack

### Frontend

* React + Vite
* Solana Wallet Adapter integration
* Dashboard with real-time meter balances + consumption tracking

### Backend

* Node.js + Express + SQLite3
* RESTful APIs for authentication and onboarding
* Service layer for user/meter operations

### Web3 (Solana)

* **Solana Pay** for seamless payments
* **Solana Actions** for direct integrations
* **Custom smart contracts** for automated trading and tokenized electricity
* Mock energy pricing for demo/testing

---

## 📂 Project Structure

```
Gridsync/
├── frontend/                 # React frontend application
├── backend/                  # Node.js backend application
├── contracts/                # Solana smart contracts
└── README.md
```

---

## 🚀 Quick Start

### Backend Setup

```bash
cd backend  
npm install  
npm run dev  
```

Runs on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend  
npm install  
npm run dev  
```

Runs on `http://localhost:5173`

---

## 🔑 API Endpoints

* `POST /api/auth/check-user` – Check if user exists by wallet address
* `POST /api/auth/onboard` – Create new user with meter ID
* `GET /api/orders` – Retrieve user trading orders
* `POST /api/orders` – Create new automated trading order

---

## 👩🏾‍💻 User Flow

1. Connect Solana wallet (Phantom, Solflare, etc.)
2. Complete onboarding with **meter ID**
3. Deposit SOL using **Solana Pay**
4. Dashboard shows **balance + consumption**
5. Set thresholds for **automated electricity purchases**
6. GridSync executes trades + delivers tokens to the meter

---

## 🔮 What’s Next

* Deploy production-ready Solana smart contracts
* Chainlink oracles for **real-time energy pricing**
* Mobile app for **field usage in emerging markets**
* Direct partnerships with **utility providers**

---

## 📜 License

This project is for **educational and demonstration purposes**, showcasing how Web3 and Solana can solve real-world challenges in energy access.

---
