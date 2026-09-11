
//关卡
/* ========== 全局状态 ========== */
const state = {
    level: 1,
    placed: 0,            // 第一关已放好书数
    selected: new Set(),  // 第二关当前选中的书名
    round: 0,             // 第二关进行到第几轮
    picked: null,         // 第三关当前拎起来的书
    left: 0               // 第三关还剩几本没归位
};

/* ========== 内容配置（唯一答案源） ========== */
const ROW_THEMES = ["novel", "science", "reference", "philosophy"];
// 每层书名（下标对应 DOM 里 .shelf-row 的顺序）：小说 / 科普 / 工具书 / 哲学
const ROW_TITLES = [
    ["红楼梦","三国演义","西游记","水浒传","活着","围城","百年孤独","老人与海"],
    ["时间简史","万物简史","昆虫记","从一到无穷大","十万个为什么","物种起源","自私的基因","果壳中的宇宙"],
    ["新华字典","现代汉语词典","辞海","牛津词典","成语词典","中国大百科全书","世界地图册","唐诗鉴赏辞典"],
    ["理想国","沉思录","存在与时间","纯粹理性批判","中国哲学简史","查拉图斯特拉如是说","道德经","庄子"]
];

// 书名 -> 属于哪一层（由上面的表推导）
function themeOf(title) {
    for (let i = 0; i < ROW_TITLES.length; i++)
        if (ROW_TITLES[i].includes(title)) return ROW_THEMES[i];
    return null;
}

// 三个躺着进架的书配置（book1/2/3 都是真实书名，送回各自类别所在层）
const LEVEL1_CONFIG = {
    book1: { row: 0, title: "骆驼祥子",     cls: "green", w: 52, h: "90%" },  // 小说层
    book2: { row: 1, title: "上帝掷骰子吗", cls: "brown", w: 55, h: "95%" },  // 科普层
    book3: { row: 3, title: "苏菲的世界",   cls: "blue",  w: 47, h: "86%" }   // 哲学层
};


/* ========== 通用工具 ========== */
function getRows()  { return [...document.querySelectorAll(".shelf-row")]; }
function findBook(title) { return document.querySelector(`.book[data-title="${title}"]`); }
function rowFromPoint(x, y) { /* 见第三关步骤 */ }
function toast(msg) {
    let tip = document.getElementById("toast");
    if (!tip) {
        tip = document.createElement("div");
        tip.id = "toast";
        document.body.appendChild(tip);
    }
    tip.textContent = msg;
    tip.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => tip.classList.remove("show"), 1800);
}
function startLevel(n) { /* 见第六步 */ }
//关卡1
function rowFromPoint(x, y) {
    return getRows().find(row => {
        const r = row.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }) || null;
}
/* 三本躺书的父容器（书堆） */
const stack = document.querySelector(".book-stack");

function bindLevel1Drag() {
    document.querySelectorAll(".lying-book").forEach(book => {
        book.addEventListener("mousedown", onDown);
    });
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
}

let drag = null;  // { book, offsetX, offsetY, homeX, homeY }

function onDown(e) {
    const book = e.target.closest(".lying-book");
    if (!book || state.level !== 1 || book.dataset.placed) return;
    e.preventDefault();
    const sr = stack.getBoundingClientRect();
    const br = book.getBoundingClientRect();
    drag = {
        book, sr,
        offsetX: e.clientX - br.left,
        offsetY: e.clientY - br.top,
        homeX: br.left - sr.left,     // 相对书堆的初始位置
        homeY: br.top - sr.top
    };
    // 从 class 的 bottom 定位切换成 top/left 定位，先落在原位
    book.style.left = drag.homeX + "px";
    book.style.top  = drag.homeY + "px";
    book.classList.add("dragging");   // CSS 里已有：去掉旋转、加光效
}

function onMove(e) {
    if (!drag) return;
    drag.book.style.left = (e.clientX - drag.sr.left - drag.offsetX) + "px";
    drag.book.style.top  = (e.clientY - drag.sr.top  - drag.offsetY) + "px";
}

function onUp(e) {
    if (!drag) return;
    const book = drag.book;
    const cfg  = LEVEL1_CONFIG[book.id];
    const row  = rowFromPoint(e.clientX, e.clientY);
    book.classList.remove("dragging");

    // 松开鼠标那一刻的位置（用于弹回动画的位移量）
    const dropX = parseFloat(book.style.left);
    const dropY = parseFloat(book.style.top);

    if (row && getRows().indexOf(row) === cfg.row) {
        placeOnShelf(book, cfg, row);       // 正确：变成普通立书
    } else {
        bounceBack(book, drag.homeX, drag.homeY, dropX, dropY); // 失败：弹回
        if (row) toast("这层好像不是放它的地方…");
    }
    drag = null;
}
//放对之后变回普通立书
function placeOnShelf(book, cfg, row) {
    book.dataset.placed = "1";
    book.style.display = "none";
    book.classList.remove("dragging");

    const b = document.createElement("div");
    b.className = "book " + cfg.cls;              // .book 已有完整样式
    b.dataset.title = cfg.title;                  // 悬停能显示书名
    b.style.setProperty("--width", cfg.w + "px");
    b.style.setProperty("--height", cfg.h);
    row.appendChild(b);                            // 插到该层末尾

    b.style.animation = "bookCorrect 0.35s ease-out"; // 复用你 CSS 里的落架动画
    b.addEventListener("animationend", () => b.style.animation = "");

    state.placed++;
    if (state.placed === 3) finishLevel("第一关完成！三本书都回到自己的层了。");
}
//失败弹回
function bounceBack(book, homeX, homeY, dropX, dropY) {
    book.style.left = homeX + "px";
    book.style.top  = homeY + "px";
    book.style.setProperty("--error-x", (dropX - homeX) + "px");
    book.style.setProperty("--error-y", (dropY - homeY) + "px");
    book.classList.add("returning");
    book.addEventListener("animationend", function h() {
        book.classList.remove("returning");
        book.removeEventListener("animationend", h);
    });
}
//第二关：6 轮递进，难度从易到难（答案都是书架上真实存在的书名）
const LEVEL2_ROUNDS = [
    // 1. 热身：明确点名两本（跨小说/科普两排）
    { text: "访客想读一本《围城》，再借一本科普书《万物简史》。",
      answer: ["围城", "万物简史"] },
    // 2. 名著线索：按内容特征找书
    { text: "找出四大名著里的《西游记》，还有一本写尽一个家族百年兴衰的《百年孤独》。",
      answer: ["西游记", "百年孤独"] },
    // 3. 特征字筛选：跨层数书（共3本，答案唯一）
    { text: "把所有书名里带“史”字的书都挑出来（一共 3 本）。",
      answer: ["时间简史", "万物简史", "中国哲学简史"] },
    // 4. 同类里辨别：哲学层三本，同层有干扰项
    { text: "哲学区请出三本：讲理想国度的《理想国》、老子所著的《道德经》、逍遥游的《庄子》。",
      answer: ["理想国", "道德经", "庄子"] },
    // 5. 计数型：工具书层数“典”字（共5本）
    { text: "工具书层里，书名带“典”字的书全部借走（一共 5 本）。",
      answer: ["新华字典", "现代汉语词典", "牛津词典", "成语词典", "唐诗鉴赏辞典"] },
    // 6. 终局：跨四层、线索考知识（5本）
    { text: "睡前阅读套装要凑齐 5 本：讲宇宙的《果壳中的宇宙》、《物种起源》、海明威的《老人与海》、罗马皇帝写的《沉思录》、工具书《辞海》。",
      answer: ["果壳中的宇宙", "物种起源", "老人与海", "沉思录", "辞海"] }
];

function bindLevel2() {
    state.round = 0;
    document.querySelector("#page-book").classList.add("level2");
    showRound();
    // 事件绑定一次即可：点击书 = 切换选中；点确认 = 判定
    document.querySelectorAll(".shelf-row .book").forEach(book => {
        book.addEventListener("click", onBookClick);
    });
    const confirmBtn = document.querySelector("#confirm-btn");
    const clearBtn = document.querySelector("#clear-btn");
    if (confirmBtn) confirmBtn.addEventListener("click", checkRound);
    if (clearBtn) clearBtn.addEventListener("click", clearSelection);
}

// 清除本轮的已选书
function clearSelection() {
    if (state.level !== 2) return;
    state.selected.clear();
    document.querySelectorAll(".book.selected").forEach(b => b.classList.remove("selected"));
}

function onBookClick(e) {
    if (state.level !== 2) return;
    const title = e.currentTarget.dataset.title;
    if (state.selected.has(title)) {
        state.selected.delete(title);
        e.currentTarget.classList.remove("selected");
    } else {
        state.selected.add(title);
        e.currentTarget.classList.add("selected");
    }
}

function showRound() {
    state.selected.clear();
    document.querySelectorAll(".book.selected").forEach(b => b.classList.remove("selected"));
    const rd = LEVEL2_ROUNDS[state.round];
    document.querySelector("#level-name").textContent = `第二关：取书（${state.round+1}/${LEVEL2_ROUNDS.length}）`;
    document.querySelector("#hint-text").textContent = rd.text;
}

function checkRound() {
    if (state.level !== 2) return;
    const rd = LEVEL2_ROUNDS[state.round];
    const sel = [...state.selected];
    const ok = rd.answer.length === sel.length &&
               rd.answer.every(t => state.selected.has(t));
    if (ok) {
        state.round++;
        if (state.round >= LEVEL2_ROUNDS.length) {
            finishLevel("第二关完成！你是个合格的庄园管家。");
        } else showRound();
    } else {
        // 答错给出具体反馈：漏了哪几本、多选了哪几本
        const missing = rd.answer.filter(t => !state.selected.has(t));
        const extra = sel.filter(t => !rd.answer.includes(t));
        let msg = "不对哦：";
        if (missing.length) msg += `还差 ${missing.length} 本（${missing.join("、")}）`;
        if (extra.length) msg += (missing.length ? "；" : "") + `多选了 ${extra.join("、")}`;
        toast(msg);
    }
}
//第三关
// 4 本被放错层的书：homeRow 是正确层，wrongRow 是开场后被丢到的层
const LEVEL3_MISPLACED = [
    { title: "活着",   homeRow: 0, wrongRow: 1 },  // 小说《活着》混进了科普层
    { title: "昆虫记", homeRow: 1, wrongRow: 0 },  // 科普《昆虫记》混进了小说层
    { title: "辞海",   homeRow: 2, wrongRow: 3 },  // 工具书《辞海》混进了哲学层
    { title: "庄子",   homeRow: 3, wrongRow: 2 }   // 哲学《庄子》混进了工具书层
];

function bindLevel3() {
    state.left = LEVEL3_MISPLACED.length;
    // 1) 把每本书丢到 wrongRow（从原行移除、追加到错误行末尾）
    LEVEL3_MISPLACED.forEach(m => {
        const b = findBook(m.title);
        getRows()[m.wrongRow].appendChild(b);   // appendChild 会自动从原位置移除
    });
    // 2) 提示
    document.querySelector("#hint-text").textContent =
        "有 4 本书被放错层了：先悬停读书名，判断每层类别（小说/科普/工具书/哲学），再点书、点目标层把它放回去。";
    // 3) 事件：委托到书架层，一次绑定
    document.querySelector(".shelf-interior").addEventListener("click", onShelfClick);
}

function onShelfClick(e) {
    if (state.level !== 3) return;
    const book = e.target.closest(".book");

    if (book) {                       // 点书：拎起/放下
        state.picked = (state.picked === book) ? null : book;
        document.querySelectorAll(".book.picked").forEach(b => b.classList.remove("picked"));
        if (state.picked) state.picked.classList.add("picked");
        return;
    }
    if (!state.picked) { toast("先点一本要移动的书"); return; }

    // 点到了某一行（空白处）→ 判定
    const row = e.target.closest(".shelf-row");
    const targetRow = getRows().indexOf(row);
    const info = LEVEL3_MISPLACED.find(m => m.title === state.picked.dataset.title);

    if (info && targetRow === info.homeRow) {
        row.appendChild(state.picked);            // 归位
        state.picked.classList.remove("picked");
        state.left--;
        toast("归位成功！");
        if (state.left === 0)
            finishLevel("第三关完成！四类藏书各归其位，书房井井有条。");
    } else {
        toast("这层的主题不太对，再读读书名想想"); // 保持原位不移动，直接取消拎起
    }
    state.picked = null;
}
//关卡切换与重置
const shelfSnapshot = document.querySelector(".shelf-interior").innerHTML;
const stackSnapshot = document.querySelector(".book-stack").innerHTML;

function startLevel(n) {
    state.level = n;
    state.placed = 0; state.selected.clear(); state.picked = null;
    // 还原
    document.querySelector(".shelf-interior").innerHTML = shelfSnapshot;
    document.querySelector(".book-stack").innerHTML = stackSnapshot;
    // 还原后要重新绑一次悬停书名用的结构（HTML 自带 data-title，无需重绑）
    document.querySelector("#level-complete").classList.add("hidden");

    const stack = document.querySelector(".book-stack");
    stack.style.display = (n === 1) ? "" : "none";   // 只有第一关有躺书

    const actions = document.querySelector("#level-actions");
    if (actions) actions.style.display = (n === 2) ? "" : "none";  // 确认/清除只在第二关出现

    if (n === 1) {
        document.querySelector("#level-name").textContent = "第一关：整理书架";
        document.querySelector("#hint-text").textContent = "三本书被抽出来放在了一旁：悬停读读各层的书名，判断它们该回哪一层（小说/科普/工具书/哲学），再拖回去";
        bindLevel1Drag();          // ← 关键：绑定拖拽监听
    }
    if (n === 2) {
        // showRound() 里会设置“第二关：取书（x/y）”标题
        bindLevel2();
    }
    if (n === 3) {
        document.querySelector("#level-name").textContent = "第三关：错位书归位";
        bindLevel3();
    }
}

function finishLevel(msg) {

    document.querySelector("#complete-text").textContent = msg;

    const isFinal = (state.level === 3);


    // ========================================================
    // 三关全部完成
    // ========================================================

    if (isFinal) {

        // 全局标记：书架小游戏已经通关
        localStorage.setItem(
            'bookshelf_completed',
            'true'
        );

        console.log('书架小游戏通关！以后所有角色都不能再次触发书架游戏。');
    }


    document.querySelector("#next-btn")
        .classList.toggle("hidden", isFinal);

    document.querySelector("#final-actions")
        .classList.toggle("hidden", !isFinal);

    document.querySelector("#level-complete")
        .classList.remove("hidden");
}
// 页面加载完，直接从第一关开始
const nextBtn = document.querySelector("#next-btn");
if (nextBtn) nextBtn.addEventListener("click", () => startLevel(state.level + 1));
const restartBtn = document.querySelector("#restart-btn");
if (restartBtn) restartBtn.addEventListener("click", () => startLevel(1));   // 全部通关后重新开始
// ============================================================
// 返回大厅并重新打开刚才的角色对话
// ============================================================

function returnToDialog() {
    // 退出书架游戏，直接回到大厅
    window.location.href = 'index.html';
}

// ============================================================
// 左上角退出
// ============================================================

const quitBtn =
    document.querySelector("#quit-btn");

if (quitBtn) {

    quitBtn.addEventListener(
        "click",
        returnToDialog
    );
}


// ============================================================
// 最终完成后的退出
// ============================================================

const exitBtn =
    document.querySelector("#exit-btn");

if (exitBtn) {

    exitBtn.addEventListener(
        "click",
        returnToDialog
    );
}

// 开场介绍弹窗：点“开始整理”后才进入第一关
const introModal = document.querySelector("#intro-modal");
const startBtn = document.querySelector("#start-btn");
if (startBtn && introModal) {
    startBtn.addEventListener("click", () => {
        introModal.classList.add("hidden");
        startLevel(1);
    });
}