// ============================================================
// 小游戏触发系统

// ============================================================

var MINI_GAME_CONFIG = {

    bookshelf: {
        bond: 30,
        completedKey: 'bookshelf_completed',
        eventKey: 'book_event_triggered',
        title: '整理书架',
        buttonText: '去整理书架'
    },

    tea: {
        bond: 60,
        completedKey: 'tea_completed',
        eventKey: 'tea_event_triggered',
        title: '泡茶',
        buttonText: '去泡茶'
    }

};


// ============================================================
// 角色中文名
// ============================================================

var MINI_GAME_CHARACTER_NAMES = {
    jack: '杰克',
    emma: '园丁',
    michiko: '红蝶'
};


// ============================================================
// 获取某个角色某个小游戏的事件 Key

// ============================================================

function getMiniGameEventKey(gameType, characterName) {

    var config = MINI_GAME_CONFIG[gameType];

    if (!config) return '';

    return characterName + '_' + config.eventKey;
}


// ============================================================
// 判断：这个角色是否已经触发过这个小游戏
// ============================================================

function hasMiniGameEventTriggered(gameType, characterName) {

    var key = getMiniGameEventKey(gameType, characterName);

    if (!key) return false;

    return localStorage.getItem(key) === 'true';
}


// ============================================================
// 标记：这个角色已经触发过这个小游戏
// ============================================================

function markMiniGameEventTriggered(gameType, characterName) {

    var key = getMiniGameEventKey(gameType, characterName);

    if (!key) return;

    localStorage.setItem(key, 'true');
}


// ============================================================
// 判断：整个小游戏是否已经通关
// ============================================================

function isMiniGameCompleted(gameType) {

    var config = MINI_GAME_CONFIG[gameType];

    if (!config) return false;

    return localStorage.getItem(config.completedKey) === 'true';
}


// ============================================================
// 标记整个小游戏已经通关
// ============================================================

function completeMiniGame(gameType) {

    var config = MINI_GAME_CONFIG[gameType];

    if (!config) return;

    localStorage.setItem(config.completedKey, 'true');

    console.log('小游戏已完成：', gameType);
}


// ============================================================
// 获取当前角色可以触发的小游戏
//
// 优先检查书架，再检查泡茶。
// 这样如果某角色一次性从 20 涨到 60，
// 会先触发书架，之后再触发泡茶。
// ============================================================

function getEligibleMiniGame(characterName) {

    if (!characterName) return null;


    // -------------------------
    // 先检查书架
    // -------------------------

    var bond = getAffection(characterName, 'bond');

    if (
        !isMiniGameCompleted('bookshelf') &&
        bond >= MINI_GAME_CONFIG.bookshelf.bond &&
        !hasMiniGameEventTriggered('bookshelf', characterName)
    ) {

        return 'bookshelf';
    }


    // -------------------------
    // 再检查泡茶
    // -------------------------

    if (
        !isMiniGameCompleted('tea') &&
        bond >= MINI_GAME_CONFIG.tea.bond &&
        !hasMiniGameEventTriggered('tea', characterName)
    ) {

        return 'tea';
    }


    return null;
}