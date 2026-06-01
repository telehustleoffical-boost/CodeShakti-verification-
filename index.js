const express = require("express");
const crypto = require("crypto");
const app = express();

app.use(express.json());
app.use(require("cors")());

// ================== FAKE DB ==================
let users = {};

// ================== VERIFY TELEGRAM WEBAPP ==================
function verifyTelegram(initData, botToken) {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    urlParams.delete("hash");

    const dataCheckString = [...urlParams.entries()]
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");

    const secret = crypto.createHmac("sha256", "WebAppData")
        .update(botToken)
        .digest();

    const hmac = crypto.createHmac("sha256", secret)
        .update(dataCheckString)
        .digest("hex");

    return hmac === hash;
}

// ================== USER LOGIN ==================
app.post("/auth", (req, res) => {
    const { initData, botToken } = req.body;

    if (!verifyTelegram(initData, botToken)) {
        return res.json({ ok: false, message: "Invalid login" });
    }

    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get("user"));

    if (!users[user.id]) {
        users[user.id] = {
            id: user.id,
            name: user.first_name,
            balance: 0
        };
    }

    res.json({ ok: true, user: users[user.id] });
});

// ================== LEADERBOARD ==================
app.get("/leaderboard", (req, res) => {
    const sorted = Object.values(users)
        .sort((a, b) => b.balance - a.balance);
    res.json(sorted);
});

// ================== GET USER ==================
app.get("/user/:id", (req, res) => {
    res.json(users[req.params.id] || {});
});

// ================== START ==================
app.listen(3000, () => console.log("Server running"));
