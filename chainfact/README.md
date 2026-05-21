# ChainFact — AI Fact Checker on Blockchain

Web app yang memverifikasi klaim pakai AI (Google Gemini) dan menyimpan hasilnya secara permanen di Ethereum Sepolia testnet.

**Stack:** HTML · Vanilla JS · Google Gemini API · Ethers.js · MetaMask

> UI structure assisted by AI. Core logic (API integration, blockchain interaction, state management) written and understood manually.

---

## Cara Menjalankan

1. Download atau clone repo ini
2. Buka `index.html` langsung di browser — tidak perlu build step atau server

## Setup

### 1. Gemini API Key (gratis)

- Buka https://aistudio.google.com
- Login dengan Google → klik "Get API Key" → "Create API key"
- Paste key di kolom input yang tersedia di dalam app

### 2. MetaMask + Test ETH

- Install MetaMask dari https://metamask.io
- Buat wallet baru
- Ganti network ke **Sepolia Testnet**
- Minta test ETH gratis di https://sepoliafaucet.com

---

## Fitur

- **AI Verification** — kirim klaim ke Gemini, dapat verdict TRUE / FALSE / UNCERTAIN
- **On-chain proof** — hash hasil verifikasi (keccak256) disimpan di data field transaksi Ethereum
- **Etherscan link** — setiap hasil yang disimpan punya link ke Sepolia Etherscan sebagai bukti
- **History** — 20 verifikasi terakhir tersimpan di localStorage browser

## Cara Kerja (Blockchain Part)

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

Tidak menggunakan smart contract — hash disimpan langsung di `data` field transaksi. Ini cara paling simpel untuk menyimpan bukti (proof of existence) di blockchain.

## Yang Dipelajari dari Project Ini

- Fetch API & memanggil REST API eksternal
- Prompt engineering: memaksa AI mengembalikan format JSON
- Parsing output AI dan handle edge case
- Konsep keccak256 hashing
- Menghubungkan web app ke MetaMask via ethers.js
- Mengirim transaksi ke Ethereum testnet
- localStorage untuk state management
