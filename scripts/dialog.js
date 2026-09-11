// ============================================
// 角色详情弹窗
// ============================================

var currentDetailCharacter = null;

function openDetail(characterName) {
    updateMoodByBond(characterName);
    if (typeof updateAllMoods === 'function') updateAllMoods();

    currentDetailCharacter = characterName;
    
    var trust = getAffection(characterName, 'trust');
    var dependency = getAffection(characterName, 'dependency');
    var bond = getAffection(characterName, 'bond');
    var mood = getMood(characterName);
    var stage = getStage(bond);
    
    var nameMap = { jack: '杰克', emma: '园丁', michiko: '红蝶' };
    document.getElementById('detail-name').textContent = nameMap[characterName] || characterName;
    document.getElementById('detail-mood').textContent = mood.icon + ' ' + mood.label;
    document.getElementById('detail-stage').textContent = stage.label;
    
    document.getElementById('detail-trust').style.width = Math.min(trust, 100) + '%';
    document.getElementById('detail-dependency').style.width = Math.min(dependency, 100) + '%';
    document.getElementById('detail-bond').style.width = Math.min(bond, 100) + '%';
    document.getElementById('detail-trust-val').textContent = Math.min(trust, 100);
    document.getElementById('detail-dependency-val').textContent = Math.min(dependency, 100);
    document.getElementById('detail-bond-val').textContent = Math.min(bond, 100);
    
    var portraitMap = {
        jack: 'assets/characters/jack_portrait.png',
        emma: 'assets/characters/emma_portrait.png',
        michiko: 'assets/characters/michiko_portrait.png'
    };
    document.getElementById('detail-portrait').src = portraitMap[characterName] || '';
    
    document.getElementById('page-detail').style.display = 'flex';
}

function closeDetail() {
    document.getElementById('page-detail').style.display = 'none';
}

function sendGift() {
    var ap = getActionPoints();
    if (ap <= 0) {
        alert('今天行动力用完了！');
        return;
    }
    if (!currentDetailCharacter) return;
    
    setActionPoints(ap - 1);
    var trust = getAffection(currentDetailCharacter, 'trust');
    var dependency = getAffection(currentDetailCharacter, 'dependency');
    var bond = getAffection(currentDetailCharacter, 'bond');
    setAffection(currentDetailCharacter, 'trust', Math.min(trust + 3, 100));
    setAffection(currentDetailCharacter, 'dependency', Math.min(dependency + 3, 100));
    setAffection(currentDetailCharacter, 'bond', Math.min(bond + 3, 100));
    
    openDetail(currentDetailCharacter);
    updateMainUI();
    showToast('🎁 你送了礼物给 ' + getName(currentDetailCharacter) + '！');
}




function getMood(name) {
    var moodMap = {
        happy: { icon: '😊', label: '开心' },
        calm: { icon: '😐', label: '平静' },
        sad: { icon: '😔', label: '低落' },
        miss: { icon: '😌', label: '思念' }
    };
    var moodKey = localStorage.getItem('mood_' + name) || 'calm';
    return moodMap[moodKey] || moodMap.calm;
}

function updateMoodByBond(characterName) {
    var bond = getAffection(characterName, 'bond');
    var moodKey;
    if (bond >= 80) moodKey = 'happy';
    else if (bond >= 50) moodKey = 'happy';
    else if (bond >= 20) moodKey = 'calm';
    else moodKey = 'calm';
    localStorage.setItem('mood_' + characterName, moodKey);
}

function getStage(bond) {
    if (bond >= 80) return { label: '羁绊', level: 4 };
    if (bond >= 50) return { label: '亲近', level: 3 };
    if (bond >= 20) return { label: '熟悉', level: 2 };
    return { label: '初识', level: 1 };
}

function getName(name) {
    var map = { jack: '杰克', emma: '园丁', michiko: '红蝶' };
    return map[name] || name;
}

function showToast(msg) {
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#F5EDE3;padding:12px 30px;border-radius:30px;font-size:16px;z-index:999;border:1px solid #E8A87C;animation:toastFade 2s forwards;';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(function() { div.remove(); }, 2000);
}
var styleSheet = document.createElement('style');
styleSheet.textContent = '@keyframes toastFade { 0% { opacity:0; transform:translateX(-50%) translateY(10px); } 15% { opacity:1; transform:translateX(-50%) translateY(0); } 85% { opacity:1; } 100% { opacity:0; } }';
document.head.appendChild(styleSheet);






// ============================================
// 对话弹窗（编号06）
// ============================================

var currentDialogCharacter = null;
var currentDialogLines = [];
var currentDialogIndex = 0;
var isPrinting = false;
var printTimer = null;

// 从详情弹窗点击“聊天”调用
function openChat() {
    closeDetail();
    if (!currentDetailCharacter) {
        alert('请先选择角色');
        return;
    }
    openScene(currentDetailCharacter);  // 
}
// 直接打开对话弹窗


function openDialog(characterName) {
    if (!characterName) return;
    currentDialogCharacter = characterName;

    var dialogData = getDialogForCharacter(characterName);
    currentDialogLines = dialogData;
    currentDialogIndex = 0;

    var nameMap = { jack: '杰克', emma: '园丁', michiko: '红蝶' };
    document.getElementById('dialog-name').textContent = nameMap[characterName] || characterName;

    // ===== 更新阶段标签 =====
    var bond = getAffection(characterName, 'bond');
    document.getElementById('dialog-stage-tag').textContent = getStageLabel(bond);

    var portraitMap = {
        jack: 'assets/characters/jack_portrait.png',
        emma: 'assets/characters/emma_portrait.png',
        michiko: 'assets/characters/michiko_portrait.png'
    };
    var portraitEl = document.getElementById('dialog-portrait');
    if (portraitEl) portraitEl.src = portraitMap[characterName] || '';

    var el = document.getElementById('page-dialog');
    if (el) {
        el.style.display = 'flex';
        el.style.justifyContent = 'center';
        el.style.alignItems = 'center';
    } else {
        alert('对话弹窗元素不存在！');
        return;
    }

    showNextDialogLine();
}

// 获取当前角色对话
function getDialogForCharacter(name) {
    var data = DIALOG_DATA[name];
    if (!data) return [{ text: '……' }];

    var bond = getAffection(name, 'bond');
    var trust = getAffection(name, 'trust');

    var stageKey;
    if (bond >= 80) stageKey = 'bond';
    else if (bond >= 50) stageKey = 'close';
    else if (bond >= 20) stageKey = 'familiar';
    else stageKey = 'initial';

    var stage = data.stages[stageKey];
    var lines = [];

    // 基础对话
    if (stage && stage.lines) {
        lines = lines.concat(stage.lines);
    }

    // 信任加成对话
    if (stage && stage.trustBonus) {
        var cond = stage.trustBonus.condition;
        if (trust >= cond.trust) {
            lines = lines.concat(stage.trustBonus.lines);
        }
    }

    // 如果为空则给默认
    if (lines.length === 0) {
        lines = [{ text: '……你来了。', mood: 'calm' }];
    }

    return lines;
}

// 显示下一句对话
function showNextDialogLine() {
    if (currentDialogIndex >= currentDialogLines.length) {
        // 对话结束
        document.getElementById('dialog-continue').textContent = '点击关闭 ▲';
        document.getElementById('dialog-continue').classList.add('active');
        return;
    }

    var line = currentDialogLines[currentDialogIndex];
    var text = line.text || '……';
    var mood = line.mood || 'calm';

    // 更新心情
    var moodMap = {
        happy: '😊', calm: '😐', sad: '😔', miss: '😌'
    };
    // 在名字旁显示心情
    var nameEl = document.getElementById('dialog-name');
    var moodEmoji = moodMap[mood] || '😐';
    // 不改变名字本身，只在对话内容中体现

    // 逐字打印
    var textEl = document.getElementById('dialog-text');
    var cursorEl = document.getElementById('dialog-cursor');
    var continueEl = document.getElementById('dialog-continue');
    continueEl.textContent = '点击继续 ▼';
    continueEl.classList.remove('active');

    // 清空之前的打字
    if (printTimer) {
        clearInterval(printTimer);
        printTimer = null;
    }
    textEl.textContent = '';
    isPrinting = true;

    var chars = text.split('');
    var index = 0;

    printTimer = setInterval(function() {
        if (index < chars.length) {
            textEl.textContent += chars[index];
            index++;
        } else {
            clearInterval(printTimer);
            printTimer = null;
            isPrinting = false;
            continueEl.classList.add('active');
            cursorEl.style.display = 'none';
        }
    }, 45);  // 每45ms一个字

    cursorEl.style.display = 'inline-block';
    currentDialogIndex++;
}

// 点击弹窗任意处继续
function continueDialog() {
    if (isPrinting) {
        // 正在打字，立即补全
        if (printTimer) {
            clearInterval(printTimer);
            printTimer = null;
        }
        var textEl = document.getElementById('dialog-text');
        var currentLine = currentDialogLines[currentDialogIndex - 1];
        if (currentLine) {
            textEl.textContent = currentLine.text || '……';
        }
        isPrinting = false;
        document.getElementById('dialog-cursor').style.display = 'none';
        document.getElementById('dialog-continue').classList.add('active');
        return;
    }

    // 如果对话结束，关闭
    if (currentDialogIndex >= currentDialogLines.length) {
        closeDialog();
        return;
    }

    // 显示下一句
    showNextDialogLine();
}




// ============================================================
// 关闭对话
// ============================================================

function closeDialog() {

    if (printTimer) {
        clearInterval(printTimer);
        printTimer = null;
    }

    isPrinting = false;

    var dialog = document.getElementById('page-dialog');

    if (dialog) {
        dialog.style.display = 'none';
    }

    currentDialogLines = [];
    currentDialogIndex = 0;


    // 记录当前角色
    var characterName = currentDialogCharacter;

    if (!characterName) {
        return;
    }


    // ========================================================
    // 第一优先级：检查分支剧情
    // ========================================================

    var bond = getAffection(characterName, 'bond');

    var branches = BRANCH_DATA[characterName] || [];

    var triggered = JSON.parse(
        localStorage.getItem('triggered_branches')
    ) || [];


    for (var i = 0; i < branches.length; i++) {

        if (
            branches[i].trigger.bond <= bond &&
            triggered.indexOf(branches[i].id) === -1
        ) {

            setTimeout(function() {

                openBranch(characterName);

            }, 400);

            return;
        }
    }


    // ========================================================
    // 第二优先级：检查小游戏
    // ========================================================

    setTimeout(function() {

        checkMiniGameTrigger(characterName);

    }, 500);
}



// ============================================================
// 当前等待进入的小游戏
// ============================================================

var pendingMiniGame = null;


// ============================================================
// 检查小游戏触发
// ============================================================

function checkMiniGameTrigger(characterName) {

    if (!characterName) return false;

    var gameType = getEligibleMiniGame(characterName);
    if (!gameType) return false;

    // 去掉原来的“特殊事件”弹窗，达到条件后直接进入对应小游戏。
    // 书架小游戏仍然保持现有三关，不修改小游戏本身。
    markMiniGameEventTriggered(gameType, characterName);
    pendingMiniGame = { gameType: gameType, characterName: characterName };
    startPendingMiniGame();
    return true;
}


// ============================================================
// 显示小游戏特殊事件弹窗
// ============================================================

function showMiniGameEvent(gameType, characterName) {

    var config = MINI_GAME_CONFIG[gameType];

    if (!config) return;


    // 保存当前等待进入的小游戏
    pendingMiniGame = {
        gameType: gameType,
        characterName: characterName
    };


    // ========================================================
    // 非常重要：
    // 弹窗一出现，就立刻消耗这个角色的触发机会
    //
    // 所以：
    // 杰克弹出来 → 杰克的机会已经用掉
    // 就算玩家点击 X 关闭，也不会再弹
    // ========================================================

    markMiniGameEventTriggered(
        gameType,
        characterName
    );


    var name =
        MINI_GAME_CHARACTER_NAMES[characterName] ||
        characterName;


    var portraitMap = {

        jack:
            'assets/characters/jack_portrait.png',

        emma:
            'assets/characters/emma_portrait.png',

        michiko:
            'assets/characters/michiko_portrait.png'

    };


    // 角色头像
    var portrait =
        document.getElementById('minigame-event-portrait');

    if (portrait) {
        portrait.src =
            portraitMap[characterName] || '';
    }


    // 角色名字
    var nameEl =
        document.getElementById('minigame-event-name');

    if (nameEl) {
        nameEl.textContent = name;
    }


    // 提示文字
    var textEl =
        document.getElementById('minigame-event-text');


    if (textEl) {

        if (gameType === 'bookshelf') {

            textEl.textContent =
                '你和' + name +
                '的羁绊已经达到30，帮他整理一下书架吧！';

        } else {

            textEl.textContent =
                '你和' + name +
                '的羁绊已经达到60，为他泡一杯茶吧。';

        }
    }


    // 按钮文字
    var goBtn =
        document.getElementById('minigame-event-go');


    if (goBtn) {
        goBtn.textContent = config.buttonText + ' →';
    }


    // 显示弹窗
    var page =
        document.getElementById('page-minigame-event');


    if (page) {

        page.style.display = 'flex';

        page.style.justifyContent = 'center';

        page.style.alignItems = 'center';
    }
}


// ============================================================
// 点击“去整理 / 去泡茶”
// ============================================================

function startPendingMiniGame() {

    if (!pendingMiniGame) return;


    var gameType =
        pendingMiniGame.gameType;

    var characterName =
        pendingMiniGame.characterName;


    // 先关闭弹窗
    var page =
        document.getElementById('page-minigame-event');

    if (page) {
        page.style.display = 'none';
    }


    // 保存本次小游戏对应的角色
    sessionStorage.setItem(
        'minigame_character',
        characterName
    );


    // 标记小游戏返回后需要重新打开对话
    sessionStorage.setItem(
        'minigame_return_dialog',
        'true'
    );


    // ========================================================
    // 跳转
    // ========================================================

    if (gameType === 'bookshelf') {

        window.location.href =
            'bookgame.html?character=' +
            encodeURIComponent(characterName);

    }

    else if (gameType === 'tea') {

        window.location.href =
            'teagame.html?character=' +
            encodeURIComponent(characterName);

    }
}


// ============================================================
// 关闭小游戏提示
//
// 注意：机会已经在 showMiniGameEvent() 中消耗
// 所以这里关闭以后不会再次出现。
// ============================================================

function skipMiniGameEvent() {

    pendingMiniGame = null;


    var page =
        document.getElementById('page-minigame-event');


    if (page) {
        page.style.display = 'none';
    }
}
function getStageLabel(bond) {
    if (bond >= 80) return '挚友';
    if (bond >= 50) return '亲密';
    if (bond >= 20) return '熟悉';
    return '初识';
}


var sceneCharacter = null;
var sceneText = '';

var sceneCharacter = null;
var sceneText = '';
var sceneLineTimer = null;


function openScene(characterName) {

    sceneCharacter = characterName;

    var bond = getAffection(characterName, 'bond');

    var stageKey;

    if (bond >= 80) {
        stageKey = 'bond';
    } else if (bond >= 50) {
        stageKey = 'close';
    } else if (bond >= 20) {
        stageKey = 'familiar';
    } else {
        stageKey = 'initial';
    }


    var sceneData = SCENE_DATA[characterName];

    if (!sceneData) {
        enterDialog();
        return;
    }


    var stage = sceneData[stageKey];

    if (!stage) {
        enterDialog();
        return;
    }


    sceneText = stage.text || '……';


    /* ===== 设置人物名字 ===== */

    document.getElementById('scene-name-tag').textContent =
        getName(characterName);


    /* ===== 设置人物立绘 ===== */

    var portraitMap = {

        jack: 'assets/characters/jack_portrait.png',

        emma: 'assets/characters/emma_portrait.png',

        michiko: 'assets/characters/michiko_portrait.png'

    };


    document.getElementById('scene-portrait').src =
        portraitMap[characterName] || '';


    /* ===== 清空旧文字 ===== */

    var textBox = document.getElementById('scene-text');

    textBox.innerHTML = '';


    /* ===== 隐藏按钮 ===== */

    document.getElementById('scene-next-btn').style.display =
        'none';


    /* ===== 显示场景页面 ===== */

    var scenePage = document.getElementById('page-scene');

    scenePage.style.display = 'flex';


    /* ===== 开始逐行打印 ===== */

    printSceneLines();
}


/* ==========================================
   场景文字逐行出现
   ========================================== */

var sceneCharacter = null;
var sceneText = '';
var sceneLineTimer = null;


function openScene(characterName) {

    sceneCharacter = characterName;

    var bond = getAffection(characterName, 'bond');

    var stageKey;

    if (bond >= 80) {
        stageKey = 'bond';
    } else if (bond >= 50) {
        stageKey = 'close';
    } else if (bond >= 20) {
        stageKey = 'familiar';
    } else {
        stageKey = 'initial';
    }


    var sceneData = SCENE_DATA[characterName];

    if (!sceneData) {
        enterDialog();
        return;
    }


    var stage = sceneData[stageKey];

    if (!stage) {
        enterDialog();
        return;
    }


    sceneText = stage.text || '……';


    /* ===== 设置人物名字 ===== */

    document.getElementById('scene-name-tag').textContent =
        getName(characterName);


    /* ===== 设置人物立绘 ===== */

    var portraitMap = {

        jack: 'assets/characters/jack_portrait.png',

        emma: 'assets/characters/emma_portrait.png',

        michiko: 'assets/characters/michiko_portrait.png'

    };


    document.getElementById('scene-portrait').src =
        portraitMap[characterName] || '';


    /* ===== 清空旧文字 ===== */

    var textBox = document.getElementById('scene-text');

    textBox.innerHTML = '';


    /* ===== 隐藏按钮 ===== */

    document.getElementById('scene-next-btn').style.display =
        'none';


    /* ===== 显示场景页面 ===== */

    var scenePage = document.getElementById('page-scene');

    scenePage.style.display = 'flex';


    /* ===== 开始逐行打印 ===== */

    printSceneLines();
}


/* ==========================================
   场景文字逐行出现
   ========================================== */

function printSceneLines() {

    var textBox = document.getElementById('scene-text');

    textBox.innerHTML = '';

    var lines = sceneText
        .split('\n')
        .filter(function(line) {
            return line.trim() !== '';
        });

    var lineIndex = 0;


    function showNextLine() {

        if (lineIndex >= lines.length) {

            document.getElementById('scene-next-btn')
                .style.display = 'block';

            return;
        }


        var line = document.createElement('div');

        line.className = 'scene-line';

        textBox.appendChild(line);


        var text = lines[lineIndex];

        var charIndex = 0;


        function typeCharacter() {

    if (charIndex >= text.length) {

        lineIndex++;

        // 这一段打完后，停顿一下，再打印下一段
        setTimeout(showNextLine, 700);

        return;
    }

    line.textContent += text.charAt(charIndex);

    charIndex++;

    // 自动滚动
    var container = document.getElementById('scene-text-container');

    if (container) {
        container.scrollTop = container.scrollHeight;
    }

    // 每个字出现的速度
    setTimeout(typeCharacter, 70);
}

        typeCharacter();
    }


    showNextLine();
}



function skipScene() {
    // 关闭场景展示页
    document.getElementById('page-scene').style.display = 'none';

    // 直接进入当前角色的对话
    if (sceneCharacter) {
        openDialog(sceneCharacter);
    }
}
/* ==========================================
   点击“和他聊一聊”
   ========================================== */



function enterDialog() {

    /* 如果文字还没打印完，直接让文字全部出现 */

    if (sceneLineTimer) {
        clearTimeout(sceneLineTimer);
        sceneLineTimer = null;
    }


    /* 关闭场景页 */

    document.getElementById('page-scene')
        .style.display = 'none';


    /* 打开聊天 */

    openDialog(sceneCharacter);
}



// ============================================
// 分支剧情弹窗逻辑
// ============================================

var branchTimer = null;
var branchPrinting = false;
var branchLines = [];
var branchIndex = 0;
var branchOptionsData = [];
var currentBranchId = null;
var currentBranchCharacter = null;

function openBranch(characterName) {
    if (!characterName) return;
    currentBranchCharacter = characterName;

    var bond = getAffection(characterName, 'bond');
    var branches = BRANCH_DATA[characterName] || [];
    var branch = null;

    for (var i = 0; i < branches.length; i++) {
        if (branches[i].trigger.bond <= bond) {
            var triggered = JSON.parse(localStorage.getItem('triggered_branches')) || [];
            if (triggered.indexOf(branches[i].id) === -1) {
                branch = branches[i];
                break;
            }
        }
    }

    if (!branch) return;

    currentBranchId = branch.id;
    branchOptionsData = branch.options;
    branchLines = branch.text.split('\n\n');
    branchIndex = 0;

    document.getElementById('branch-title').textContent = branch.title;
    var stageLabel = getStage(bond).label;
    document.getElementById('branch-stage-label').textContent = '· ' + stageLabel + ' ·';
    document.getElementById('branch-portrait').src = branch.portrait || 'assets/characters/' + characterName + '_portrait.png';

    document.getElementById('branch-options').style.display = 'none';
    document.getElementById('branch-options').innerHTML = '';
    document.getElementById('branch-text').textContent = '';
    document.getElementById('branch-cursor').style.display = 'inline-block';

    document.getElementById('page-branch').style.display = 'flex';
    document.getElementById('page-branch').style.justifyContent = 'center';
    document.getElementById('page-branch').style.alignItems = 'center';

    showNextBranchLine();
}

function showNextBranchLine() {
    if (branchIndex >= branchLines.length) {
        showBranchOptions();
        return;
    }

    var textEl = document.getElementById('branch-text');
    var cursorEl = document.getElementById('branch-cursor');
    var text = branchLines[branchIndex] || '……';

    textEl.textContent = '';
    cursorEl.style.display = 'inline-block';
    branchPrinting = true;

    var chars = text.split('');
    var idx = 0;
    if (branchTimer) clearInterval(branchTimer);

    branchTimer = setInterval(function() {
        if (idx < chars.length) {
            textEl.textContent += chars[idx];
            idx++;
        } else {
            clearInterval(branchTimer);
            branchTimer = null;
            branchPrinting = false;
            cursorEl.style.display = 'none';
            setTimeout(function() {
                if (branchIndex < branchLines.length) {
                    branchIndex++;
                    showNextBranchLine();
                } else {
                    showBranchOptions();
                }
            }, 1200);
        }
    }, 45);
}

function showBranchOptions() {
    var container = document.getElementById('branch-options');
    container.innerHTML = '';
    container.style.display = 'flex';

    for (var i = 0; i < branchOptionsData.length; i++) {
        var opt = branchOptionsData[i];
        var btn = document.createElement('button');
        btn.innerHTML = '<span class="option-label">' + opt.label + '.</span> ' + opt.text;
        btn.onclick = (function(optData) {
            return function() { selectBranchOption(optData); };
        })(opt);
        container.appendChild(btn);
    }
}

function selectBranchOption(opt) {
    if (!currentBranchCharacter) return;

    var trust = getAffection(currentBranchCharacter, 'trust');
    var dep = getAffection(currentBranchCharacter, 'dependency');
    var bond = getAffection(currentBranchCharacter, 'bond');

    if (opt.effects.trust) {
        setAffection(currentBranchCharacter, 'trust', Math.min(trust + opt.effects.trust, 100));
    }
    if (opt.effects.dependency) {
        setAffection(currentBranchCharacter, 'dependency', Math.min(dep + opt.effects.dependency, 100));
    }
    if (opt.effects.bond) {
        setAffection(currentBranchCharacter, 'bond', Math.min(bond + opt.effects.bond, 100));
    }

    var triggered = JSON.parse(localStorage.getItem('triggered_branches')) || [];
    if (triggered.indexOf(currentBranchId) === -1) {
        triggered.push(currentBranchId);
        localStorage.setItem('triggered_branches', JSON.stringify(triggered));
    }

    var keyChoices = JSON.parse(localStorage.getItem('key_choices')) || [];
    keyChoices.push({ branch: currentBranchId, choice: opt.label });
    localStorage.setItem('key_choices', JSON.stringify(keyChoices));

    var container = document.getElementById('branch-options');
    container.innerHTML = '';
    var feedback = document.createElement('p');
    feedback.style.cssText = 'color:#d4c9b8;font-size:15px;line-height:1.9;padding:10px 0;font-style:italic;border-top:1px solid rgba(232,168,124,0.1);margin-top:6px;';
    feedback.textContent = opt.nextText || '……';
    container.appendChild(feedback);

    updateMainUI();

    setTimeout(function() {
        closeBranch();
    }, 2800);
}

function closeBranch() {
    if (branchTimer) {
        clearInterval(branchTimer);
        branchTimer = null;
    }
    document.getElementById('page-branch').style.display = 'none';
    branchOptionsData = [];
    branchLines = [];
    branchIndex = 0;
    branchPrinting = false;
    currentBranchId = null;
    updateMainUI();
}

function skipBranch() {
    if (branchPrinting) {
        if (branchTimer) {
            clearInterval(branchTimer);
            branchTimer = null;
        }
        var textEl = document.getElementById('branch-text');
        var fullText = branchLines[branchIndex] || '';
        textEl.textContent = fullText;
        branchPrinting = false;
        document.getElementById('branch-cursor').style.display = 'none';
        setTimeout(function() {
            branchIndex++;
            showNextBranchLine();
        }, 600);
    } else {
        if (branchIndex < branchLines.length) {
            branchIndex = branchLines.length;
            showBranchOptions();
        }
    }
}