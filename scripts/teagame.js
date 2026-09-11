/* ============================================================
   1、页面基础：把固定 1536×1024 的舞台缩放到适配屏幕
   ============================================================ */

// 快捷找元素：$("serveBtn") 等于 document.getElementById("serveBtn")
function $(id) {
  return document.getElementById(id);
}

const STAGE_W = 1536;   // 舞台设计宽度（背景图按这个尺寸布局）
const STAGE_H = 1024;   // 舞台设计高度

// 舞台元素：缩放、居中都作用在它身上
const stage = $("gameStage");

function scaleStage() {
  // 缩放倍率 = “窗口宽/设计宽”和“窗口高/设计高”里较小的那个（保证完整放下）
  const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);

  stage.style.transform = "scale(" + scale + ")";                       // 整个舞台等比缩放
  stage.style.left = (window.innerWidth - STAGE_W * scale) / 2 + "px";  // 水平居中
  stage.style.top = (window.innerHeight - STAGE_H * scale) / 2 + "px";  // 垂直居中
}

// 舞台上的两个装饰层（茶杯发光、撒花）：多处会用到，放在这里备用
const cupGlow = $("cupGlow");           // 茶杯发光圈
const sparkleLayer = $("sparkleLayer"); // 撒花层（完美时往里放 emoji）

/* ============================================================
   2、游戏资料表：所有“游戏设定”都写成表，逻辑只查表不改表
   ============================================================ */

// 中文名映射：程序内部用英文 key，显示给玩家时翻译成中文
const TEA_NAMES = { black: "红茶", green: "绿茶", flower: "花茶" };
const SUGAR_NAMES = { none: "无糖", little: "少糖", much: "多糖" };
const MILK_NAMES = { false: "不加奶", true: "加奶" };   // 奶用布尔值当键

// 角色档案：pref（偏好）= 这个角色想喝的配方，也就是判定的标准答案
const CHARACTERS = {
  jack: {                                    // 杰克：红茶 + 少糖 + 不加奶
    key: "jack", name: "杰克",
    avatarLetter: "杰", desc: "优雅绅士",
    pref: { tea: "black", sugar: "little", milk: false },
  },
  hongdie: {                                 // 红蝶：花茶 + 无糖 + 加奶
    key: "hongdie", name: "红蝶",
    avatarLetter: "蝶", desc: "花间精灵",
    pref: { tea: "flower", sugar: "none", milk: true },
  },
  gardener: {                                // 园丁：绿茶 + 多糖 + 不加奶
    key: "gardener", name: "园丁",
    avatarLetter: "园", desc: "园艺大师",
    pref: { tea: "green", sugar: "much", milk: false },
  },
};
// ["jack","hongdie","gardener"]：凡是要“每个角色都来一遍”就用它
const CHAR_KEYS = Object.keys(CHARACTERS);

// 心情表：进入时由对话页传入；演示时点左上心情卡可切换
const MOODS = {
  happy:   { key: "happy",   emoji: "😊", label: "开心", flavor: "今天心情很不错，想喝一杯贴心的茶～" },
  calm:    { key: "calm",    emoji: "😌", label: "平静", flavor: "神色安闲，想喝一杯刚好对味的茶～" },
  sad:     { key: "sad",     emoji: "😢", label: "低落", flavor: "看起来有点低落，想喝点熟悉的温暖味道…" },
  excited: { key: "excited", emoji: "🤩", label: "期待", flavor: "正兴冲冲地期待着你泡的茶呢！" },
};
// ["happy","calm","sad","excited"]：点心情卡时循环切换用
const MOOD_KEYS = Object.keys(MOODS);

// 三个选择维度的“固定顺序”：茶叶 → 甜度 → 加奶（顺序锁靠它）
const DIM_ORDER = ["tea", "sugar", "milk"];

// 每个维度的展示信息：图标、中文名、引导里说的“罐子名”、步骤序号
const DIM_INFO = {
  tea:   { icon: "🍵", name: "茶叶", hotspotLabel: "茶叶罐", stepNum: "①" },
  sugar: { icon: "🍬", name: "甜度", hotspotLabel: "糖罐",   stepNum: "②" },
  milk:  { icon: "🥛", name: "加奶", hotspotLabel: "牛奶瓶", stepNum: "③" },
};

/* ============================================================
   3、本局状态与运行参数（游戏运行中会不断变化的数据）
   ============================================================ */

// 本局玩家选择：null 表示“还没选”
const gameState = {
  tea: null,
  sugar: null,
  milk: null,
  currentStep: 1,   // 1~3 = 还在选；4 = 三个都选完了，可以奉茶
};

let currentChar = "jack";    // 这次泡给谁（角色 key）
let currentMood = "happy";   // 当前心情（心情 key）
let busy = false;            // “忙碌锁”：奉茶动画/结果弹窗期间为 true，禁止其它操作
let lastRecord = null;       // 最近一局成绩（退出时带给外部页面）
let autoTimer = null;        // 结果弹窗 2 秒倒计时定时器的编号
let guideTimer = null;       // 引导提示语自动还原定时器的编号

/* ============================================================
   4、存档读写：把好感度等数据写进浏览器的 localStorage
   ============================================================ */

// 存档在小硬盘里的“键名”
const SAVE_KEY = "teaGameSave_v1";

// 造一张“空白成绩单”（三个角色各持有一张，互不干扰）
function newCharStat() {
  return { affection: 0, trust: 0, bond: 0, served: 0, perfect: 0, good: 0, ok: 0, miss: 0 };
}

// 读档：没有存档 / 存档坏了，就返回默认结构
function loadSave() {
  // 默认存档（第一次玩时用）
  const defaultSave = {
    version: 1,
    totalAttempts: 0,
    characters: {
      jack: newCharStat(),
      hongdie: newCharStat(),
      gardener: newCharStat(),
    },
    history: [],
  };

  try {
    const saveText = localStorage.getItem(SAVE_KEY);   // 取出字符串
    if (!saveText) return defaultSave;                 // 空 = 从没存过
    const save = JSON.parse(saveText);                 // 字符串 → 对象

    // 保险：旧存档缺字段就自动补全，防止以后取值报错
    if (!save.characters) save.characters = defaultSave.characters;
    CHAR_KEYS.forEach(function (key) {
      if (!save.characters[key]) save.characters[key] = newCharStat();
    });
    if (typeof save.totalAttempts !== "number") save.totalAttempts = 0;
    if (!Array.isArray(save.history)) save.history = [];

    return save;
  } catch (e) {
    return defaultSave;                                // 任何异常都静静退回默认
  }
}

// 写档：把对象压成字符串再存回去
function writeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) {
    // 浏览器禁用 localStorage 时静默跳过，不能让游戏崩
  }
}

// 全游戏共享的存档：页面一打开就读一次，之后都读写这同一份
const saveData = loadSave();

// 泡完一杯后“记账”：奖励累加给角色 + 记一条历史
function recordResult(record) {
  const stat = saveData.characters[record.character];   // 取该角色的成绩单

  stat.affection += record.rewards.affection;   // 好感度累加
  stat.trust += record.rewards.trust;           // 信任累加
  stat.bond += record.rewards.bond;             // 羁绊累加
  stat.served += 1;                             // 被奉茶次数 +1

  // 统计各等级次数
  if (record.match === 3) stat.perfect += 1;
  else if (record.match === 2) stat.good += 1;
  else if (record.match === 1) stat.ok += 1;
  else stat.miss += 1;

  saveData.history.unshift(record);             // 最新记录插到最前面
  if (saveData.history.length > 200) saveData.history.pop();  // 只留最近 200 条
  writeSave(saveData);                          // 写回小硬盘
}

/* ============================================================
   5、顶部 UI：左上心情卡（角色名/心情/口味偏好提示）+ 右上尝试次数
   ============================================================ */

const moodCard = $("moodCard");       // 整张心情卡（演示中可点击切心情）
const moodFace = $("moodFace");       // 表情圆
const moodLine = $("moodLine");       // “杰克 · 心情：开心”
const moodFlavor = $("moodFlavor");   // 心情的一句话
const needChips = $("needChips");     // 三个偏好小标签的容器
const attemptNum = $("attemptNum");   // 右上角数字

// 把英文 key 翻译成中文，例如 tea 维度的 "black" → "红茶"
function valueName(dim, value) {
  if (dim === "tea") return TEA_NAMES[value] || "？";
  if (dim === "sugar") return SUGAR_NAMES[value] || "？";
  return MILK_NAMES[value] || "？";        // milk 维度的键是 true / false
}

// 用“钥匙”取出完整档案，写代码时更短
function currentCharObj() { return CHARACTERS[currentChar]; }
function currentMoodObj() { return MOODS[currentMood]; }

// 现场造一个“偏好小标签”（HTML 里没有，是用 JS 造的）
function buildNeedChip(dim, value, icon) {
  const chip = document.createElement("span");   // 造一个空 <span>
  chip.className = "need-chip";                  // 给类名（CSS 决定长相）
  chip.textContent = icon + " " + valueName(dim, value);   // 填文字，如“🍵 红茶”
  needChips.appendChild(chip);                   // 挂到卡片上
}

// 刷新左上角心情卡：表情 + 角色名&心情 + 语气 + 三个偏好标签
function renderMoodArea() {
  const mood = currentMoodObj();
  const char = currentCharObj();

  moodFace.textContent = mood.emoji;
  moodLine.textContent = char.name + " · 心情：" + mood.label;
  moodFlavor.textContent = mood.flavor;
  moodCard.title = "（演示）点击切换心情，当前：" + mood.label;

  // 偏好提示区：先清空，再按“茶→糖→奶”的顺序放三个标签
  needChips.innerHTML = "";
  buildNeedChip(DIM_ORDER[0], char.pref.tea, "🍵");
  buildNeedChip(DIM_ORDER[1], char.pref.sugar, "🍬");
  buildNeedChip(DIM_ORDER[2], char.pref.milk, "🥛");
}

// 刷新右上角“🍵 尝试 N 次”
function renderAttempt() {
  attemptNum.textContent = saveData.totalAttempts;
}

/* ============================================================
   6、右侧角色栏：只显示“当前目标角色”一张卡（点击换下一位）
   ============================================================ */

const charList = $("charList");   // 卡片容器（里面始终只有一张）

// 画卡片：按 currentChar 造一张“目标角色卡”（每次换人都重画）
function buildTargetCard() {
  const c = currentCharObj();             // 当前目标角色的档案

  charList.innerHTML = "";                // 只保留一张：先清空容器

  const card = document.createElement("div");
  card.className = "char-card active";    // 唯一一张卡，它本身就是“目标”
  card.title = "点击切换到下一位角色";

  // 左上角“目标”角标
  const mark = document.createElement("span");
  mark.className = "char-mark";
  mark.textContent = "目标";

  // 头像区（插图预留位：以后换成 <img> 即可）
  const avatar = document.createElement("div");
  avatar.className = "char-avatar";
  const letter = document.createElement("span");
  letter.className = "avatar-letter";
  letter.textContent = c.avatarLetter;
  const tag = document.createElement("span");
  tag.className = "avatar-tag";
  tag.textContent = "插图位";
  avatar.appendChild(letter);
  avatar.appendChild(tag);

  // 文字区：名字 + 小介绍 + 切换提示
  const textBox = document.createElement("div");
  textBox.className = "char-text";
  const nameEl = document.createElement("div");
  nameEl.className = "char-name";
  nameEl.textContent = c.name;
 const descEl = document.createElement("div");
  descEl.className = "char-desc";
  /*descEl.textContent = c.desc;*/
  const hintEl = document.createElement("div");
  hintEl.className = "char-hint";
  /*hintEl.textContent = "点击换下一位 ⇄";*/
  textBox.appendChild(nameEl);
  textBox.appendChild(descEl);
  textBox.appendChild(hintEl);

  // 拼装 + 点击换人
  card.appendChild(mark);
  card.appendChild(avatar);
  card.appendChild(textBox);
  card.addEventListener("click", switchToNextTarget);
  charList.appendChild(card);
}

// 兼容旧名字：以前是“给三张卡加高亮”，现在只有一张卡，重画即可
function renderCharPanel() {
  buildTargetCard();
}

// 点击卡片 → 按顺序换到下一位：杰克 → 红蝶 → 园丁 → 杰克（% 取余实现循环）
function switchToNextTarget() {
  if (busy) return;                                     // 动画/弹窗期间不换人
  const index = CHAR_KEYS.indexOf(currentChar);
  const nextKey = CHAR_KEYS[(index + 1) % CHAR_KEYS.length];
  switchTarget(nextKey);
}

// 换到指定角色：更新目标 + 重画卡片 + 重新开局（resetRound 在第 8 节）
function switchTarget(key) {
  if (busy || key === currentChar) return;     // 动画中 / 点自己 → 忽略
  currentChar = key;
  renderCharPanel();                           // 重画卡片，显示新目标
  resetRound("已切换目标为「" + CHARACTERS[key].name + "」，请重新选择～");
}

/* ============================================================
   7、选料热点与步骤 UI：谁可以点 / 引导文字 / 奉茶按钮
   ============================================================ */

// 三个热点：盖在原图茶叶罐/糖罐/牛奶瓶上的透明可点区
const itemTea = $("itemTea");
const itemSugar = $("itemSugar");
const itemMilk = $("itemMilk");
const tapHint = $("tapHint");         // 指向当前物品的引导小气泡

// 维度名 → 热点元素：想操作“该选的罐子”时用 HOTSPOTS[维度]
const HOTSPOTS = { tea: itemTea, sugar: itemSugar, milk: itemMilk };

const guideStep = $("guideStep");     // 左下引导：第一行文字
const guidePicks = $("guidePicks");   // 左下引导：三个摘要小标签
const serveBtn = $("serveBtn");       // 底部“奉茶”按钮

// 现在该选哪个维度？顺序锁：tea → sugar → milk；三个选完返回 null
function pendingDim() {
  if (gameState.currentStep <= 3) {
    return DIM_ORDER[gameState.currentStep - 1];
  }
  return null;
}

// 三个罐子的状态：轮到它 → 可点+呼吸光圈；选过了 → 金圈锁定
function updateHotspots() {
  const pending = pendingDim();
  DIM_ORDER.forEach(function (dim) {
    const hotspot = HOTSPOTS[dim];
    const isLocked = (gameState[dim] !== null);   // 选过了吗
    const isMyTurn = (dim === pending);           // 轮到它了吗

    hotspot.classList.toggle("locked", isLocked);
    hotspot.classList.toggle("clickable", !isLocked && isMyTurn);
    hotspot.classList.toggle("next", !isLocked && isMyTurn);
  });
}

// 左下引导卡：一段文字 + 三个“已选/待选”摘要
function updateGuide(note) {
  const pending = pendingDim();
  const char = currentCharObj();
  const mood = currentMoodObj();

  // —— 第一行文字：三种情况 ——
  let html = "";
  if (note) {
    html = "<b>" + note + "</b>";                                  // 情况1：临时提示语
  } else if (pending) {
    const info = DIM_INFO[pending];
    html = "目标：" + char.name + "（心情 " + mood.emoji + mood.label + "）<br>" +
           "第 " + gameState.currentStep + " 步 / 共 3 步：点击桌上的<b>" +
           info.hotspotLabel + "</b>选择" + info.name;              // 情况2：还在选
  } else {
    html = "三种配料都选好了，点击下方橙色的<b>「奉茶」</b>按钮吧！";  // 情况3：选完了
  }
  guideStep.innerHTML = html;

  // —— 三个摘要小标签：选完一项亮一项 ——
  guidePicks.innerHTML = "";
  DIM_ORDER.forEach(function (dim) {
    const info = DIM_INFO[dim];
    const chosen = (gameState[dim] !== null);

    const pick = document.createElement("span");
    pick.className = "guide-pick";
    if (chosen) pick.classList.add("done");     // 已选：绿边绿字
    else pick.classList.add("pending");         // 没选：灰字“待选”

    const icon = document.createElement("span");
    icon.textContent = info.icon;
    const label = document.createElement("span");
    label.textContent = info.name + "：";
    const value = document.createElement("span");
    value.className = "g-val";
    if (chosen) value.textContent = valueName(dim, gameState[dim]);
    else value.textContent = "待选";

    pick.appendChild(icon);
    pick.appendChild(label);
    pick.appendChild(value);
    guidePicks.appendChild(pick);
  });
}

// 奉茶按钮：三步全选完（currentStep 到 4）才可用，变橙色
function updateServeBtn() {
  const ready = (gameState.currentStep >= 4);
  serveBtn.disabled = !ready;
}

// 引导小气泡：出现在“当前该点的那件物品”上方
function updateTapHint() {
  const pending = pendingDim();
  if (!pending || busy) {         // 没有该选的、或正在动画 → 隐藏气泡
    tapHint.hidden = true;
    return;
  }

  const hotspot = HOTSPOTS[pending];
  const info = DIM_INFO[pending];

  tapHint.textContent = info.stepNum + " 点击" + info.hotspotLabel;
  tapHint.hidden = false;

  // 定位：水平放到罐子正上方中间（先量出气泡自己宽度再算）
  const bubbleWidth = tapHint.offsetWidth;
  let x = hotspot.offsetLeft + (hotspot.offsetWidth - bubbleWidth) / 2;
  x = Math.max(8, Math.min(x, STAGE_W - bubbleWidth - 8));   // 别跑出舞台
  tapHint.style.left = x + "px";
  tapHint.style.top = (hotspot.offsetTop - 48) + "px";
}

// 一次刷新上面四样东西（罐子 / 引导文字 / 奉茶按钮 / 小气泡）
function updateRoundUI(note) {
  updateHotspots();
  updateGuide(note);
  updateServeBtn();
  updateTapHint();

  // 提示语显示 2.4 秒后自动还原成正常步骤引导
  if (guideTimer) {
    window.clearTimeout(guideTimer);
    guideTimer = null;
  }
  if (note) {
    guideTimer = window.setTimeout(function () {
      guideTimer = null;
      updateRoundUI();
    }, 2400);
  }
}

/* ============================================================
   8、进入与重置：每局开始前“擦桌子”，并按角色+心情生成需求
   ============================================================ */

// 生成“需求模板”= 目标角色想喝的配方 = 判定标准答案
// 提示：以后想让心情影响配方，就在这里根据 currentMood 改返回值即可
function buildNeedTemplate() {
  const pref = CHARACTERS[currentChar].pref;
  return { tea: pref.tea, sugar: pref.sugar, milk: pref.milk };
}

// 重置本局：清空选择回到第 1 步（note = 左下角短暂显示的提示语）
// 说明：函数里用到的 modalLayer / resultLayer 定义在下面第 9、10 节，
//       但 resetRound 只在“开机或点击”之后才被调用，那时它们早已定义好。
function resetRound(note) {
  // 清掉上一局的痕迹
  busy = false;
  clearAutoTimer();                              // 取消结果倒计时（定义在第 10 节）
  if (guideTimer) {
    window.clearTimeout(guideTimer);
    guideTimer = null;
  }
  modalLayer.classList.remove("show");           // 关选择弹窗
  resultLayer.classList.remove("show");          // 关结果弹窗
  stage.classList.remove("serving");             // 停蒸汽动画
  cupGlow.classList.remove("on");                // 关发光
  sparkleLayer.innerHTML = "";                   // 清撒花

  // 清空玩家选择、回到第 1 步
  gameState.tea = null;
  gameState.sugar = null;
  gameState.milk = null;
  gameState.currentStep = 1;

  // 解锁三个热点
  itemTea.classList.remove("locked");
  itemSugar.classList.remove("locked");
  itemMilk.classList.remove("locked");

  // 刷新界面
  renderMoodArea();          // 左上心情卡（换人/切心情后都走到这，保证跟着变）
  buildNeedTemplate();       // 生成本局标准答案
  updateRoundUI(note);       // 步骤 UI 回到第 1 步状态
}

// 进入泡茶页（开机、或外部 TeaGame.open 都会调它）
function enterTeaGame(charKey, moodKey) {
  currentChar = charKey;
  currentMood = moodKey;
  renderCharPanel();          // 高亮目标卡
  renderAttempt();            // 显示尝试次数
  closeFeedbackNow();         // 清掉可能残留的弹窗（定义在第 10 节）
  resetRound();               // 正式开局
}

/* ============================================================
   9、三步选择：点罐子 → 弹窗 → 选定即锁定
   ============================================================ */

// 三个维度的可选项（选择弹窗的按钮由它生成）——放在“用它的地方”
const CHOICES = {
  tea: {
    title: "选择茶叶",
    options: [
      { key: "black",  label: "红茶", desc: "醇厚温暖", cls: "swatch-tea-black" },
      { key: "green",  label: "绿茶", desc: "清新自然", cls: "swatch-tea-green" },
      { key: "flower", label: "花茶", desc: "花香馥郁", cls: "swatch-tea-flower" },
    ],
  },
  sugar: {
    title: "选择甜度",
    options: [
      { key: "none",   label: "无糖", desc: "清冽纯粹", cls: "swatch-sugar-none" },
      { key: "little", label: "少糖", desc: "微甜刚好", cls: "swatch-sugar-little" },
      { key: "much",   label: "多糖", desc: "甜度浓郁", cls: "swatch-sugar-much" },
    ],
  },
  milk: {
    title: "是否加奶",
    options: [
      { key: false, label: "不加奶", desc: "保留茶的原味", cls: "swatch-milk-no" },
      { key: true,  label: "加奶",   desc: "口感更香浓",   cls: "swatch-milk-yes" },
    ],
  },
};

// 弹窗相关元素
const modalLayer = $("modalLayer");       // 灰色遮罩层（默认隐藏）
const modalTitle = $("modalTitle");       // 弹窗标题
const modalOptions = $("modalOptions");   // 放选项按钮的区域

// 点罐子后调用：打开这个维度的选择弹窗
function openDimModal(dim) {
  if (busy) return;

  // 两道规则闸门：已经选过 或 还没轮到它 → 不开（防跳步、防改已选）
  const alreadyChosen = (gameState[dim] !== null);
  const notMyTurn = (dim !== pendingDim());
  if (alreadyChosen || notMyTurn) return;

  const data = CHOICES[dim];
  modalTitle.textContent = data.title;

  // 清空旧按钮，按选项表现场生成新按钮
  modalOptions.innerHTML = "";
  data.options.forEach(function (opt) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";

    const swatch = document.createElement("span");
    swatch.className = "opt-swatch " + opt.cls;    // 彩色圆点
    const label = document.createElement("span");
    label.textContent = opt.label;                 // 主文字，如“红茶”
    const desc = document.createElement("span");
    desc.className = "opt-desc";
    desc.textContent = opt.desc;                   // 小说明，如“醇厚温暖”

    btn.appendChild(swatch);
    btn.appendChild(label);
    btn.appendChild(desc);
    btn.addEventListener("click", function () { applyChoice(dim, opt); });
    modalOptions.appendChild(btn);
  });

  modalLayer.classList.add("show");                // 显示弹窗
}

// 玩家选定一项：保存 → 关弹窗 → 锁定罐子 → 进入下一步
function applyChoice(dim, opt) {
  gameState[dim] = opt.key;                        // 保存选择（如 tea = "black"）
  modalLayer.classList.remove("show");             // 关弹窗
  HOTSPOTS[dim].classList.add("locked");           // 罐子锁定（金圈 + 对勾）

  if (gameState.currentStep < 4) {                 // 还没到第 4 步就推进
    gameState.currentStep += 1;
  }
  updateRoundUI();                                 // 刷新界面
}

/* ============================================================
   10、奉茶判定与结果：算匹配数 → 结果弹窗 → 2 秒自动关闭
   ============================================================ */

// 结果弹窗相关元素
const resultLayer = $("resultLayer");       // 遮罩层
const resultEmoji = $("resultEmoji");       // 大表情
const resultTitle = $("resultTitle");       // 标题
const resultSub = $("resultSub");           // 副标题
const resultRewards = $("resultRewards");   // 加成列表
const resultAuto = $("resultAuto");         // “N 秒后自动关闭…”

// 奖励等级表：匹配几项 → 用哪档文案、加多少好感/信任/羁绊
const LEVELS = {
  3: {
    emoji: "🥰", title: "完美！完全合TA口味",
    rewards: { affection: 8, trust: 3, bond: 2 },
    rows: [ { t: "好感度", v: 8 }, { t: "信任", v: 3 }, { t: "羁绊", v: 2 } ],
  },
  2: {
    emoji: "😊", title: "不错哦！",
    rewards: { affection: 5, trust: 2, bond: 1 },
    rows: [ { t: "好感度", v: 5 }, { t: "信任", v: 2 }, { t: "羁绊", v: 1 } ],
  },
  1: {
    emoji: "🙂", title: "还可以～",              // 只加信任，好感不变
    rewards: { affection: 0, trust: 1, bond: 0 },
    rows: [ { t: "信任", v: 1 }, { t: "好感度", v: 0 } ],
  },
  0: {
    emoji: "😶", title: "好像没对上口味……",
    rewards: { affection: 0, trust: 0, bond: 0 },
    rows: [],
  },
};

// 几个“魔法数字”起个名字，方便以后调整
const SERVE_ANIMATION_MS = 1400;   // 奉茶动画时长（毫秒）
const SPARKLE_COUNT = 18;          // 撒花颗数
const SPARKLE_LIFE_MS = 2600;      // 每颗星星存活时间

// 点“奉茶”按钮后执行
function serveTea() {
  if (busy) return;                            // 忙碌中：忽略
  if (gameState.currentStep < 4) return;       // 还没选齐：忽略

  busy = true;                                 // 上锁，防连点
  serveBtn.disabled = true;                    // 按钮临时变灰
  stage.classList.add("serving");              // 加 serving 类 → CSS 显示蒸汽

  // 尝试次数 +1，并立刻存档、刷新显示
  saveData.totalAttempts += 1;
  writeSave(saveData);
  renderAttempt();

  // 等蒸汽动画播完再判定
  window.setTimeout(function () {
    stage.classList.remove("serving");
    const record = judgeResult();              // 判定，得到成绩单
    showFeedback(record);                      // 弹结果
  }, SERVE_ANIMATION_MS);
}

// 判定：把玩家三样选择和标准答案逐项比较，算出匹配数并打包成绩单
function judgeResult() {
  const need = buildNeedTemplate();            // 标准答案（第 8 节生成）
  let match = 0;

  DIM_ORDER.forEach(function (dim) {
    if (gameState[dim] === need[dim]) match += 1;   // 这一项一样就 +1
  });

  const char = currentCharObj();
  const mood = currentMoodObj();

  const record = {
    time: new Date().toLocaleString("zh-CN"),    // 时间
    character: char.key,                         // 角色 key
    characterName: char.name,                    // 角色名
    mood: mood.key,
    moodLabel: mood.label,
    moodEmoji: mood.emoji,
    picks: {                                     // 玩家实际选择
      tea: gameState.tea,
      sugar: gameState.sugar,
      milk: gameState.milk,
    },
    pickText:                                    // 给人看的中文描述
      valueName("tea", gameState.tea) + " · " +
      valueName("sugar", gameState.sugar) + " · " +
      valueName("milk", gameState.milk),
    target: { tea: need.tea, sugar: need.sugar, milk: need.milk },  // 答案副本
    match: match,                                // 匹配数 0~3
    rewards: LEVELS[match].rewards,              // 按档位查奖励
    actionCost: 1,                               // 行动力（预留，暂未扣）
  };

  recordResult(record);                          // 写入存档（第 4 节）
  notifyHost("result", record);                  // 通知外部页面（第 11 节）
  return record;
}

// 结果弹窗：按匹配档位填文案与加成
function showFeedback(record) {
  const level = LEVELS[record.match];

  resultEmoji.textContent = level.emoji;
  resultTitle.textContent = level.title;
  resultSub.textContent =
    "TA想喝：" + valueName("tea", record.target.tea) + " · " +
    valueName("sugar", record.target.sugar) + " · " +
    valueName("milk", record.target.milk) +
    "　|　你泡了：" + record.pickText;

  // 加成列表：有加成就一列出来，没加成显示“无属性加成”
  resultRewards.innerHTML = "";
  if (level.rows.length === 0) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.className = "zero";
    span.textContent = "（无属性加成）";
    li.appendChild(span);
    resultRewards.appendChild(li);
  } else {
    level.rows.forEach(function (row) {
      const li = document.createElement("li");
      li.textContent = row.t + "　";
      const value = document.createElement("b");
      value.className = "up";
      if (row.v > 0) value.textContent = "+" + row.v;
      else value.textContent = "不变";
      li.appendChild(value);
      resultRewards.appendChild(li);
    });
  }

  // 完美（3/3）时庆祝一下
  if (record.match === 3) {
    cupGlow.classList.add("on");
    launchSparkles();
  } else {
    cupGlow.classList.remove("on");
  }

  resultLayer.classList.add("show");     // 显示弹窗
  startAutoClose(record);                // 开始 2 秒倒计时
}

// 结果弹窗 2 秒倒计时：每秒更新文字，到 0 自动退出本页
function startAutoClose(record) {
  let secondsLeft = 2;
  resultAuto.textContent = secondsLeft + " 秒后自动关闭…";
  clearAutoTimer();

  autoTimer = window.setInterval(function () {
    secondsLeft -= 1;
    if (secondsLeft <= 0) {
      clearAutoTimer();
      exitTeaPage("result", record);     // 退出（定义在第 11 节）
    } else {
      resultAuto.textContent = secondsLeft + " 秒后自动关闭…";
    }
  }, 1000);
}

// 取消结果倒计时
function clearAutoTimer() {
  if (autoTimer) {
    window.clearInterval(autoTimer);
    autoTimer = null;
  }
}

// 立刻收起结果弹窗及相关特效
function closeFeedbackNow() {
  clearAutoTimer();
  resultLayer.classList.remove("show");
  sparkleLayer.innerHTML = "";
  cupGlow.classList.remove("on");
  stage.classList.remove("serving");
}

// 完美时撒星星：随机位置、随机方向、随机延迟
function launchSparkles() {
  const symbols = ["✨", "🌸", "☕", "🍃", "⭐"];
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const star = document.createElement("span");
    star.className = "sparkle";
    star.textContent = symbols[Math.floor(Math.random() * symbols.length)];  // 随机 emoji
    star.style.left = Math.random() * 100 + "%";
    star.style.top = 45 + Math.random() * 40 + "%";
    star.style.setProperty("--dx", (Math.random() * 120 - 60) + "px");
    star.style.setProperty("--rot", (Math.random() * 360 - 180) + "deg");
    star.style.animationDelay = Math.random() * 0.5 + "s";
    sparkleLayer.appendChild(star);
    window.setTimeout(function () { star.remove(); }, SPARKLE_LIFE_MS);  // 播完就移除
  }
}

/* ============================================================
   11、退出与通知外部页面（判定结果 / 退出事件）
   ============================================================ */

// 读网址参数：?character=jack&mood=happy&returnTo=xxx
const URL_PARAMS = new URLSearchParams(window.location.search);
const RETURN_TO = URL_PARAMS.get("returnTo");       // 网址指定了就用它
const DEFAULT_RETURN_PAGE = "index.html#page-main";            // 没指定时默认回主页面

// 别人用 TeaGame.on() 注册的回调都存在这两个数组里
const resultCbs = [];
const exitCbs = [];

// 把消息“广播”出去：三种接轨方式
function notifyHost(type, record) {
  // 方式 1：iframe 场景 —— 发消息给父窗口
  try {
    if (window.parent && window.parent !== window) {
      const messageType = (type === "result") ? "teaResult" : "teaExit";
      window.parent.postMessage({ source: "teaGame", type: messageType, data: record }, "*");
    }
  } catch (e) {
    // 跨域时忽略，不影响本页
  }

  // 方式 2：同窗口 —— 抛自定义事件（外部监听 "tea:result" / "tea:exit"）
  window.dispatchEvent(new CustomEvent("tea:" + type, { detail: record }));

  // 方式 3：同窗口 —— 调用 TeaGame.on() 注册过的回调
  if (type === "result") resultCbs.forEach(function (cb) { cb(record); });
  if (type === "exit") exitCbs.forEach(function (cb) { cb(record); });
}

// 退出本页：点“返回” / 结果弹窗自动关闭，都会走到这里
// reason："result" = 结果弹窗结束；"back" = 玩家点返回
function exitTeaPage(reason, record) {
  if (reason === "result") {
    lastRecord = record;        // 记住最近一局
    closeFeedbackNow();         // 收起弹窗
    busy = false;               // 解锁
  }
  notifyHost("exit", lastRecord);   // 通知外部：我要走了
  window.location.href = RETURN_TO || DEFAULT_RETURN_PAGE;   // 跳回主页面
}

/* ============================================================
   12、对外 API：window.TeaGame —— 给别的页面用的遥控器
   （挂到 window 上，同窗口的其它脚本才能访问到）
   ============================================================ */

window.TeaGame = {
  version: "1.0",

  // 打开泡茶界面：TeaGame.open({ character:"jack", mood:"happy" })
  open: function (options) {
    if (!options) options = {};                                    // 没传参数也不报错
    const charKey = CHARACTERS[options.character] ? options.character : "jack";
    const moodKey = MOODS[options.mood] ? options.mood : "happy";
    enterTeaGame(charKey, moodKey);
  },

  // 手动关闭（回主页面）
  close: function () {
    if (busy) return;
    exitTeaPage("back");
  },

  // 注册回调：TeaGame.on("result", fn) / TeaGame.on("exit", fn)
  on: function (type, callback) {
    if (type === "result") resultCbs.push(callback);
    if (type === "exit") exitCbs.push(callback);
  },

  // 给外部一份存档拷贝（深拷贝，外部乱改也不影响本页）
  getSave: function () {
    return JSON.parse(JSON.stringify(saveData));
  },

  // 最近一局成绩（没有就返回 null）
  getLastRecord: function () {
    if (!lastRecord) return null;
    return JSON.parse(JSON.stringify(lastRecord));
  },

  // 清空存档（仅调试用）
  resetSave: function () {
    const fresh = {
      version: 1,
      totalAttempts: 0,
      characters: {
        jack: newCharStat(),
        hongdie: newCharStat(),
        gardener: newCharStat(),
      },
      history: [],
    };
    writeSave(fresh);
    Object.keys(saveData).forEach(function (key) { delete saveData[key]; });
    Object.assign(saveData, fresh);
    renderAttempt();
  },
};

/* ============================================================
   13、事件绑定：把“用户点击”接到对应函数上
   ============================================================ */

// 三个罐子 → 打开对应维度的选择弹窗（能不能开由 openDimModal 内部判断）
itemTea.addEventListener("click", function () { openDimModal("tea"); });
itemSugar.addEventListener("click", function () { openDimModal("sugar"); });
itemMilk.addEventListener("click", function () { openDimModal("milk"); });

// 选择弹窗：点灰色遮罩本身 / 点“取消” → 关闭
modalLayer.addEventListener("click", function (event) {
  if (event.target === modalLayer) modalLayer.classList.remove("show");
});
$("modalClose").addEventListener("click", function () {
  modalLayer.classList.remove("show");
});

// 奉茶按钮
serveBtn.addEventListener("click", serveTea);

// 左上“返回”：回主页面
$("backBtn").addEventListener("click", function () {
  if (busy) return;                 // 动画/弹窗期间不允许返回
  exitTeaPage("back");
});

// 左上心情卡：演示用点击切换心情（正式版由对话页传入，可删掉这段）
moodCard.addEventListener("click", function () {
  if (busy) return;
  const currentIndex = MOOD_KEYS.indexOf(currentMood);
  currentMood = MOOD_KEYS[(currentIndex + 1) % MOOD_KEYS.length];  // 下一个，到头回第一个
  resetRound("心情已切换为「" + MOODS[currentMood].label + "」，重新开始选择～");
});

// 窗口大小变化 → 重新缩放舞台
window.addEventListener("resize", scaleStage);

/* ============================================================
   14、初始化：文件最末尾，才是真正的“开机”时刻
   （前面所有 const / let 到这里都已经定义好了）
   ============================================================ */

scaleStage();        // 1) 舞台适配屏幕
buildTargetCard();   // 2) 画出右侧“当前目标角色”卡片

// 3) 支持网址带参进入：index.html?character=jack&mood=happy
const urlChar = URL_PARAMS.get("character");
const urlMood = URL_PARAMS.get("mood");
if (CHARACTERS[urlChar]) currentChar = urlChar;
if (MOODS[urlMood]) currentMood = urlMood;

// 4) 正式开局（默认杰克 + 开心）
enterTeaGame(currentChar, currentMood);
