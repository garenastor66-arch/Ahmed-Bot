const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const TOKEN = process.env.PAGE_ACCESS_TOKEN;
const DEVELOPER = process.env.DEVELOPER_ID;

// ================= DATA =================

function loadData() {
  return JSON.parse(fs.readFileSync("data.json"));
}

function saveData(data) {
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

function getUser(data, id) {
  if (!data.users[id]) {
    data.users[id] = {
      cash: 100,
      bank: 0,
      xp: 0,
      level: 1
    };
  }
  return data.users[id];
}

// ================= SEND =================

async function sendMessage(id, text) {
  await axios.post(
    `https://graph.facebook.com/v17.0/me/messages?access_token=${TOKEN}`,
    {
      recipient: { id },
      message: { text }
    }
  );
}

// ================= WEBHOOK =================

app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0]?.messaging?.[0];
  if (!entry) return res.sendStatus(200);

  const sender = entry.sender.id;
  const text = entry.message?.text;

  let data = loadData();
  let user = getUser(data, sender);

  // 🔴 إطفاء البوت
  if (data.botOff && sender !== DEVELOPER) {
    return res.sendStatus(200);
  }

  if (!text || !text.startsWith(".")) return res.sendStatus(200);

  const args = text.split(" ");
  const command = args[0];

  // ================= المطور =================

  if (command === ".اطفاء") {
    if (sender !== DEVELOPER) return;
    data.botOff = true;
    saveData(data);
    return sendMessage(sender, "🛑 تم إطفاء البوت");
  }

  if (command === ".تشغيل") {
    if (sender !== DEVELOPER) return;
    data.botOff = false;
    saveData(data);
    return sendMessage(sender, "✅ تم تشغيل البوت");
  }

  // ================= عامة =================

  if (command === ".مساعدة") {
    return sendMessage(sender, "📜 اكتب .اوامر");
  }

  if (command === ".اوامر") {
    return sendMessage(sender, "📜 تم إعداد 56 أمر 😈");
  }

  if (command === ".عن") {
    return sendMessage(sender, "🤖 بوت أحمد");
  }

  if (command === ".نكتة") {
    return sendMessage(sender, "😂 مرة واحد...");
  }

  if (command === ".حظي") {
    return sendMessage(sender, `🍀 ${Math.floor(Math.random()*100)}%`);
  }

  if (command === ".وقت") {
    return sendMessage(sender, new Date().toLocaleString());
  }

  if (command === ".قول") {
    return sendMessage(sender, args.slice(1).join(" "));
  }

  // ================= تقرير =================

  if (command === ".تقرير") {
    let report = args.slice(1).join(" ");
    if (!report) return sendMessage(sender, "❌ اكتب التقرير");

    await sendMessage(DEVELOPER, `📩 تقرير:\n${report}`);
    return sendMessage(sender, "✅ تم الإرسال");
  }

  // ================= اقتصاد =================

  if (command === ".رصيدي") {
    return sendMessage(sender, `💰 ${user.cash}$`);
  }

  if (command === ".بنك") {
    return sendMessage(sender, `🏦 ${user.bank}$`);
  }

  if (command === ".بنك" && args[1] === "ايداع" && args[2] === "الكل") {
    user.bank += user.cash;
    user.cash = 0;
    saveData(data);
    return sendMessage(sender, "✅ تم الإيداع");
  }

  if (command === ".يومي") {
    user.cash += 200;
    saveData(data);
    return sendMessage(sender, "💸 +200$");
  }

  if (command === ".عمل") {
    let money = Math.floor(Math.random()*300);
    user.cash += money;
    saveData(data);
    return sendMessage(sender, `💼 +${money}$`);
  }

  // ================= ترفيه =================

  if (command === ".قمار") {
    let bet = parseInt(args[1]);
    if (!bet || bet > user.cash) return sendMessage(sender, "❌ مبلغ غير صالح");

    if (Math.random() > 0.5) {
      user.cash += bet;
      return sendMessage(sender, `🎉 +${bet}$`);
    } else {
      user.cash -= bet;
      return sendMessage(sender, `💀 -${bet}$`);
    }
  }

  if (command === ".نسبة") {
    return sendMessage(sender, `❤️ ${Math.floor(Math.random()*100)}%`);
  }

  if (command === ".ذكاء") {
    const arr = ["نعم", "لا", "ربما"];
    return sendMessage(sender, arr[Math.floor(Math.random()*arr.length)]);
  }

  // ================= لفل =================

  if (command === ".لفلي") {
    return sendMessage(sender, `🏆 ${user.level}`);
  }

  if (command === ".توب") {
    return sendMessage(sender, "🔥 قريبًا");
  }

  // ================= حماية =================

  if (command === ".حماية") {
    if (sender !== DEVELOPER) return;
    data.protection = true;
    saveData(data);
    return sendMessage(sender, "🛡️ تم تفعيل الحماية");
  }

  // ⚠️ ملاحظة: لا يمكن استرجاع اسم/صورة الجروب فعليًا
  if (data.protection) {
    console.log("Protection Active");
  }

  saveData(data);
  res.sendStatus(200);
});

// ================= VERIFY =================

app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === process.env.VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

app.listen(process.env.PORT || 3000, () =>
  console.log("🔥 Bot Running")
);
