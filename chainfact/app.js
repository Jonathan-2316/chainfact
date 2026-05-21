// ============================================================
//  ChainFact — app.js
//  AI: Google Gemini (free)
//  Blockchain: Ethereum Sepolia testnet via MetaMask + ethers.js
// ============================================================

// State
let provider = null;
let signer = null;
let currentResult = null;
let apiKey = "";

// ============================================================
//  Init — load saved API key from localStorage
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("gemini_api_key");
  if (saved) {
    apiKey = saved;
    document.getElementById("api-key-input").value = saved;
    setApiStatus("API key loaded from browser storage.", "success");
  }
  renderHistory();
});

function saveApiKey() {
  const val = document.getElementById("api-key-input").value.trim();
  if (!val) {
    setApiStatus("Please enter your API key.", "error");
    return;
  }
  apiKey = val;
  localStorage.setItem("gemini_api_key", val);
  setApiStatus("API key saved to browser storage.", "success");
}

function setApiStatus(msg, type) {
  const el = document.getElementById("api-status");
  el.className = "status " + type;
  el.textContent = msg;
}

// ============================================================
//  1. WALLET — Connect MetaMask
// ============================================================
async function connectWallet() {
  if (!window.ethereum) {
    setStatus("MetaMask not found. Install it from metamask.io", "error");
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });

    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    const address = await signer.getAddress();
    const short = address.slice(0, 6) + "..." + address.slice(-4);

    document.getElementById("wallet-addr").textContent = short;
    const btn = document.getElementById("connect-btn");
    btn.textContent = "Connected";
    btn.classList.add("connected");

    setStatus("Wallet connected: " + short, "success");
  } catch (err) {
    setStatus("Failed to connect: " + err.message, "error");
  }
}

// ============================================================
//  2. AI — Verify claim via Gemini API
// ============================================================
async function verifyClaim() {
  const claim = document.getElementById("claim-input").value.trim();

  if (!claim) {
    setStatus("Please enter a claim first.", "error");
    return;
  }

  if (!apiKey) {
    setStatus("Enter your Gemini API key above first.", "error");
    return;
  }

  setLoading(true, "Asking AI...");
  hideResult();

  try {
    // Gemini API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Respond with ONLY a JSON object, nothing else, no explanation outside JSON:
{"verdict":"TRUE","explanation":"..."}

Rules:
- verdict must be TRUE, FALSE, or UNCERTAIN
- no markdown, no backticks, no extra text

Claim to fact-check: ${claim}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "API error " + response.status);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Bersihkan markdown fences kalau ada
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    currentResult = {
      claim,
      verdict: parsed.verdict,
      explanation: parsed.explanation,
      timestamp: new Date().toISOString(),
    };

    showResult(parsed.verdict, parsed.explanation);
    setStatus("Done! Connect wallet to save this result on-chain.", "success");

    if (signer) {
      document.getElementById("chain-btn").disabled = false;
    }
  } catch (err) {
    setStatus("Error: " + err.message, "error");
    console.error(err);
  } finally {
    setLoading(false);
  }
}

// ============================================================
//  3. BLOCKCHAIN — Save result hash to Ethereum testnet
// ============================================================
async function saveToChain() {
  if (!signer) {
    setStatus("Connect your wallet first!", "error");
    return;
  }

  if (!currentResult) {
    setStatus("Verify a claim first.", "error");
    return;
  }

  setLoading(true, "Sending transaction to Sepolia...");

  try {
    // Buat string yang akan di-hash
    const dataToHash = JSON.stringify({
      claim: currentResult.claim,
      verdict: currentResult.verdict,
      timestamp: currentResult.timestamp,
    });

    // Hash pakai keccak256 (standar Ethereum)
    const hash = ethers.utils.id(dataToHash);

    // Kirim transaksi — hash tersimpan di field `data` transaksi
    const tx = await signer.sendTransaction({
      to: await signer.getAddress(),
      data: hash,
    });

    setStatus("Transaction sent! Waiting for confirmation...", "loading");

    await tx.wait(1); // tunggu 1 blok

    currentResult.txHash = tx.hash;
    showTxHash(tx.hash);
    saveToHistory(currentResult);
    setStatus("Saved on-chain! TX: " + tx.hash.slice(0, 10) + "...", "success");
    document.getElementById("chain-btn").disabled = true;
    renderHistory();
  } catch (err) {
    if (err.code === 4001) {
      setStatus("Transaction rejected.", "error");
    } else {
      setStatus("Transaction failed: " + err.message, "error");
    }
  } finally {
    setLoading(false);
  }
}

// ============================================================
//  4. HISTORY
// ============================================================
function saveToHistory(result) {
  const history = getHistory();
  history.unshift(result);
  if (history.length > 20) history.pop();
  localStorage.setItem("chainfact_history", JSON.stringify(history));
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("chainfact_history") || "[]");
  } catch {
    return [];
  }
}

function clearHistory() {
  if (confirm("Clear all history?")) {
    localStorage.removeItem("chainfact_history");
    renderHistory();
  }
}

function renderHistory() {
  const list = document.getElementById("history-list");
  const history = getHistory();

  if (history.length === 0) {
    list.innerHTML = '<div class="no-history">No verifications yet.</div>';
    return;
  }

  list.innerHTML = history
    .map((item) => {
      const time = new Date(item.timestamp).toLocaleString();
      const badge = verdictBadge(item.verdict);
      const tx = item.txHash
        ? `<a class="etherscan-link" href="https://sepolia.etherscan.io/tx/${item.txHash}" target="_blank"
           style="font-size:0.65rem">↗ ${item.txHash.slice(0, 10)}...</a>`
        : `<span style="font-family:'Space Mono',monospace;font-size:0.65rem;color:var(--muted)">not saved on-chain</span>`;

      return `
      <div class="history-item">
        <div class="history-meta">${badge}<span class="history-time">${time}</span></div>
        <div class="history-claim">${escapeHtml(item.claim)}</div>
        <div class="history-tx">${tx}</div>
      </div>`;
    })
    .join("");
}

// ============================================================
//  5. UI HELPERS
// ============================================================
function showResult(verdict, explanation) {
  const box = document.getElementById("result-box");
  const badge = document.getElementById("verdict-badge");
  const expl = document.getElementById("explanation");

  box.className = "result-box " + verdict.toLowerCase();
  badge.className = "verdict-badge badge-" + verdict.toLowerCase();
  badge.textContent = verdict;
  expl.textContent = explanation;
  box.style.display = "block";
  document.getElementById("hash-row").style.display = "none";
}

function hideResult() {
  document.getElementById("result-box").style.display = "none";
}

function showTxHash(txHash) {
  document.getElementById("hash-row").style.display = "flex";
  document.getElementById("tx-hash-display").textContent =
    txHash.slice(0, 20) + "...";
  document.getElementById("etherscan-link").href =
    "https://sepolia.etherscan.io/tx/" + txHash;
}

function setStatus(msg, type = "") {
  const el = document.getElementById("status");
  el.className = "status " + type;
  el.innerHTML =
    type === "loading" ? `<span class="spinner"></span>${msg}` : msg;
}

function setLoading(on, msg = "") {
  document.getElementById("verify-btn").disabled = on;
  if (msg) setStatus(msg, "loading");
}

function verdictBadge(v) {
  const map = {
    TRUE: '<span class="verdict-badge badge-true">TRUE</span>',
    FALSE: '<span class="verdict-badge badge-false">FALSE</span>',
    UNCERTAIN: '<span class="verdict-badge badge-uncertain">UNCERTAIN</span>',
  };
  return map[v] || map.UNCERTAIN;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
