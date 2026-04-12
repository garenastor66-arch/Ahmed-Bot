const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const TOKEN = process.env.PAGE_ACCESS_TOKEN;
const DEVELOPER = process.env.DEVELOPER_ID;

// تحميل البيانات
function loadData() {
  return JSON.parse(fs.readFileSync("data.json"));
}

// حفظ البيانات
function saveData(data) {
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

// إنشاء مستخدم
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

// إرسال رسالة
async function sendMessage(id, text) {
  await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${TOKEN}`, {
    recipient: { id },
    message: { text }
  });
}

// استقبال الرسائل
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0]?.messaging?.[0];
  if (!entry) return res.sendStatus(200);

  const sender = entry.sender.id;
  const text = entry.message?.text;

  if (!text || !text.startsWith(".")) return res.sendStatus(200);

  let data = loadData();
  let user = getUser(data, sender);

  const args = text.split(" ");
  const command = args[0];

  // ================= الأوامر =================

  if (command === ".مساعدة" || command === ".اوامر") {
    return sendMessage(sender, `📜 قائمة الأوامر:
.مساعدة - عرض الأوامر
.عن - معلومات البوت
.نكتة - نكتة 😂
.حظي - نسبة حظك 🍀
.وقت - الوقت ⏰
.قول - كرر كلامك

💰 الاقتصاد:
.رصيدي / .بنك / .بنك ايداع الكل
.يومي / .عمل / .تحويل / .سرقة

🎮 الترفيه:
.قمار / .زواج / .نسبة حب

🏆 التوب:
.لفلي / .توب`);
  }

  if (command === ".عن") {
    return sendMessage(sender, "🤖 بوت أحمد - إصدار تجريبي");
  }

  if (command === ".نكتة") {
    const jokes = ["مرة واحد...", "في واحد غبي 😂"];
    return sendMessage(sender, jokes[Math.floor(Math.random()*jokes.length)]);
  }

  if (command === ".حظي") {
    return sendMessage(sender, `🍀 حظك اليوم: ${Math.floor(Math.random()*100)}%`);
  }

  if (command === ".وقت") {
    return sendMessage(sender, new Date().toLocaleString());
  }

  if (command === ".قول") {
    return sendMessage(sender, args.slice(1).join(" "));
  }

  // 💰 اقتصاد
  if (command === ".رصيدي") {
    return sendMessage(sender, `💰 رصيدك: ${user.cash}$`);
  }

  if (command === ".بنك") {
    return sendMessage(sender, `🏦 البنك: ${user.bank}$`);
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
    return sendMessage(sender, "💸 استلمت 200$");
  }

  if (command === ".عمل") {
    let money = Math.floor(Math.random()*300);
    user.cash += money;
    saveData(data);
    return sendMessage(sender, `💼 اشتغلت وكسبت ${money}$`);
  }

  if (command === ".قمار") {
    let bet = parseInt(args[1]);
    if (!bet) return sendMessage(sender, "حدد مبلغ");
    if (Math.random() > 0.5) {
      user.cash += bet;
      return sendMessage(sender, "🎉 فزت!");
    } else {
      user.cash -= bet;
      return sendMessage(sender, "💀 خسرت!");
    }
  }

  if (command === ".لفلي") {
    return sendMessage(sender, `🏆 لفلك: ${user.level}`);
  }

  if (command === ".توب") {
    return sendMessage(sender, "🔥 قريبًا...");
  }

  // حفظ البيانات
  saveData(data);

  res.sendStatus(200);
});

// التحقق
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === process.env.VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

app.listen(3000, () => console.log("Bot running 🔥"));
