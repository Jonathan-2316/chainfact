# ChainFact — AI Fact Checker on Blockchain

A web app that verifies claims using Google Gemini AI and stores results permanently on the Ethereum Sepolia testnet.

**Stack:** HTML · Vanilla JS · Google Gemini API · Ethers.js · MetaMask

---

## How to Run

1. Download or clone this repo
2. Open `index.html` directly in your browser — no build step or server needed

## Setup

### 1. Gemini API Key (free)
- Go to https://aistudio.google.com
- Login with Google → click "Get API Key" → "Create API key"
- Paste the key in the input field inside the app

### 2. MetaMask + Test ETH (optional)
- Install MetaMask from https://metamask.io
- Create a new wallet
- Switch network to **Sepolia Testnet**
- Get free test ETH at https://sepoliafaucet.com

---

## Features

- **AI Verification** — sends a claim to Gemini, returns a TRUE / FALSE / UNCERTAIN verdict
- **On-chain proof** — verification result is hashed (keccak256) and stored in an Ethereum transaction's data field
- **Etherscan link** — every saved result links to Sepolia Etherscan as permanent proof
- **History** — last 20 verifications stored in browser localStorage

## How the Blockchain Part Works

```
Claim + verdict + timestamp
        ↓
   keccak256 hash (via ethers.js)
        ↓
  Ethereum transaction (data field)
        ↓
   Sepolia testnet — permanent & public
        ↓
   Sepolia Etherscan link
```

No smart contract used — the hash is stored directly in the transaction's `data` field. This is the simplest way to store a proof of existence on-chain.

---

## My Contribution & What I Learned

This project was built with AI assistance for boilerplate and UI structure. Here's what I personally handled:

**What I did:**
- Debugged all API errors end-to-end — rate limits, deprecated models, JSON parsing failures
- Identified that Gemini 2.0 Flash was deprecated and pushed for the correct current model
- Troubleshot file replacement and browser cache issues independently
- Made all project decisions: skipping MetaMask for now, choosing the right free model, deciding when to move on
- Read and understood the core logic well enough to explain how each function works

**What I learned:**
- How to call a REST API from vanilla JavaScript using `fetch()`
- Prompt engineering: structuring prompts to force structured JSON output from an AI model
- Parsing and sanitizing AI output — why raw text needs to be cleaned before `JSON.parse()`
- How keccak256 hashing works and why it's used in Ethereum
- How to connect a web app to MetaMask using ethers.js
- How browser `localStorage` works for lightweight state persistence
- How to read and reason about code written by someone else (or AI) — a real developer skill
