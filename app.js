import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

// ==================================================
// ⚙️ الإعدادات (أضف أرقام الـ ID الخاصة بالبوتات هنا)
// ==================================================

const BOTS_DATA = {
  "39369782": { command: "!اسرق ٥", name: "Heist Bot" },
  "32060007": { command: "!صيد ٣",   name: "Fishing Bot" },
  "76305584": { command: "!صياد ٣",  name: "Hunter Bot" },
  "45578849": { command: "!بطل ٥",   name: "Hero Bot" }
};

const accounts = [
  { identity: process.env.U_MAIL_1, secret: process.env.U_PASS_1 },
  { identity: process.env.U_MAIL_2, secret: process.env.U_PASS_2 },
  { identity: process.env.U_MAIL_3, secret: process.env.U_PASS_3 },
  { identity: process.env.U_MAIL_4, secret: process.env.U_PASS_4 },
  { identity: process.env.U_MAIL_5, secret: process.env.U_PASS_5 },
  { identity: process.env.U_MAIL_6, secret: process.env.U_PASS_6 },
  { identity: process.env.U_MAIL_7, secret: process.env.U_PASS_7 },
  { identity: process.env.U_MAIL_8, secret: process.env.U_PASS_8 },
  { identity: process.env.U_MAIL_9, secret: process.env.U_PASS_9 },
  { identity: process.env.U_MAIL_10, secret: process.env.U_PASS_10 },
  { identity: process.env.U_MAIL_11, secret: process.env.U_PASS_11 },
  { identity: process.env.U_MAIL_12, secret: process.env.U_PASS_12 },
  { identity: process.env.U_MAIL_13, secret: process.env.U_PASS_13 },
  { identity: process.env.U_MAIL_14, secret: process.env.U_PASS_14 }
];

const ACTIVE_ACCOUNTS = [10];
const DELAY = 12000;
const WORK_TIME = 54 * 60 * 1000;
const REST_TIME = 6 * 60 * 1000;

// ==================================================

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// هذه الدالة الآن تأخذ الرقم الأول فقط وتتجاهل أي شيء بعده
function extractRoomId(text = "") {
  // تنظيف النص من الرموز الخفية
  const cleaned = text.replace(/[\u200B-\u200F\uFEFF]/g, '').replace(/\s+/g, ' ');
  
  // الأولوية دائماً للبحث عن النمط الأول (ID XXX) أو (XXX)
  // وبما أننا نستخدم match() فهي ستجد أول رقم مطابق وتتوقف فوراً (وهذا المطلوب)
  const match = cleaned.match(/\(ID\s*(\d+)\)/i) || cleaned.match(/\((\d+)\)/);
  
  return match ? Number(match[1]) : null;
}

function isBonusMessage(content = "") {
  return /Bonus-/i.test(content) || content.includes("معزز") || content.includes("معزز إضافي");
}

accounts.forEach((acc, index) => {
  if (ACTIVE_ACCOUNTS.length > 0 && !ACTIVE_ACCOUNTS.includes(index + 1)) return;

  const service = new WOLF();
  let queue = [];
  let isProcessing = false;
  let isResting = false;

  function addToQueue(roomId, command) {
    if (!roomId) return;
    queue.unshift({ roomId, command });
  }

  async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    while (queue.length > 0) {
      if (isResting) break;

      const { roomId, command } = queue.shift();

      try {
        if (service.groups?.join) await service.groups.join(roomId);
        else if (service.group?.join) await service.group.join(roomId);
        else if (service.joinGroup) await service.joinGroup(roomId);

        await service.messaging.sendGroupMessage(roomId, command);
        console.log(`🚀 [حساب ${index + 1}] دخل ${roomId} وأرسل: ${command}`);
      } catch (err) {
        console.log(`❌ [حساب ${index + 1}] خطأ:`, err.message);
      }
      await sleep(DELAY);
    }
    isProcessing = false;
  }

  service.on('message', async (message) => {
    if (message.isGroup) return;

    const senderId = message.sourceSubscriberId.toString();
    const botInfo = BOTS_DATA[senderId];

    if (!botInfo) return; 

    const content = message.body || message.content || message.text || message.message || "";
    if (!isBonusMessage(content)) return;

    const roomId = extractRoomId(content);
    if (!roomId) return;

    console.log(`📥 [حساب ${index + 1}] استلمت من ${botInfo.name} | غرفة: ${roomId} | أمر: ${botInfo.command}`);

    addToQueue(roomId, botInfo.command);

    if (!isResting) processQueue();
  });

  async function cycle() {
    while (true) {
      isResting = false;
      await sleep(WORK_TIME);
      isResting = true;
      await sleep(REST_TIME);
    }
  }

  service.on('ready', () => {
    console.log(`✅ الحساب ${index + 1} جاهز`);
    cycle();
  });

  service.login(acc.identity, acc.secret);
});
