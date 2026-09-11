// ============================================
// 【统一】所有人统一用以下变量名
// 好感度：affection_jack, affection_emma, affection_michiko
// 天数：current_day
// 行动力：action_points
// 已解锁剧情：unlocked_stories（数组）
// 已达成成就：unlocked_achievements（数组）
// ============================================

function saveGame() {
    var data = {
        trust_jack: parseInt(localStorage.getItem('trust_jack')) || 0,
        trust_emma: parseInt(localStorage.getItem('trust_emma')) || 0,
        trust_michiko: parseInt(localStorage.getItem('trust_michiko')) || 0,
        dependency_jack: parseInt(localStorage.getItem('dependency_jack')) || 0,
        dependency_emma: parseInt(localStorage.getItem('dependency_emma')) || 0,
        dependency_michiko: parseInt(localStorage.getItem('dependency_michiko')) || 0,
        bond_jack: parseInt(localStorage.getItem('bond_jack')) || 0,
        bond_emma: parseInt(localStorage.getItem('bond_emma')) || 0,
        bond_michiko: parseInt(localStorage.getItem('bond_michiko')) || 0,
        current_day: parseInt(localStorage.getItem('current_day')) || 1,
        action_points: parseInt(localStorage.getItem('action_points')) || 6,
        unlocked_stories: JSON.parse(localStorage.getItem('unlocked_stories')) || [],
        unlocked_achievements: JSON.parse(localStorage.getItem('unlocked_achievements')) || [],
        mood_jack: localStorage.getItem('mood_jack') || 'calm',
        mood_emma: localStorage.getItem('mood_emma') || 'calm',
        mood_michiko: localStorage.getItem('mood_michiko') || 'calm'
    };
    localStorage.setItem('manor_diary_save', JSON.stringify(data));
}
function loadGame() {
    var saved = localStorage.getItem('manor_diary_save');
    if (!saved) return false;

    try {
        var data = JSON.parse(saved);

        // 恢复三维好感度
        localStorage.setItem('trust_jack', data.trust_jack || 0);
        localStorage.setItem('trust_emma', data.trust_emma || 0);
        localStorage.setItem('trust_michiko', data.trust_michiko || 0);
        localStorage.setItem('dependency_jack', data.dependency_jack || 0);
        localStorage.setItem('dependency_emma', data.dependency_emma || 0);
        localStorage.setItem('dependency_michiko', data.dependency_michiko || 0);
        localStorage.setItem('bond_jack', data.bond_jack || 0);
        localStorage.setItem('bond_emma', data.bond_emma || 0);
        localStorage.setItem('bond_michiko', data.bond_michiko || 0);

        // 恢复天数和行动力（注意：行动力如果没存或存了负数，重置为6）
        localStorage.setItem('current_day', data.current_day || 1);
        var ap = parseInt(data.action_points);
        if (isNaN(ap) || ap < 0) ap = 6;
        localStorage.setItem('action_points', ap);

        // 恢复剧情和成就列表
        localStorage.setItem('unlocked_stories', JSON.stringify(data.unlocked_stories || []));
        localStorage.setItem('unlocked_achievements', JSON.stringify(data.unlocked_achievements || []));

        // 恢复角色心情（如果有存）
        if (data.mood_jack) localStorage.setItem('mood_jack', data.mood_jack);
        if (data.mood_emma) localStorage.setItem('mood_emma', data.mood_emma);
        if (data.mood_michiko) localStorage.setItem('mood_michiko', data.mood_michiko);

        return true;
    } catch (e) {
        console.warn('读取存档失败，使用默认数据');
        return false;
    }
}

// ===== 快捷函数 =====
// ===== 三维好感度读写 =====
function getAffection(name, type) {
    if (!type) {
        // 兼容旧写法：如果只传一个参数，默认返回羁绊值
        type = 'bond';
    }
    var key = type + '_' + name;
    return parseInt(localStorage.getItem(key)) || 0;
}

function setAffection(name, type, value) {
    if (typeof type === 'number') {
        // 兼容旧写法：如果第二个参数是数字，说明是 setAffection('jack', 50) 这种调用
        // 默认存到 bond
        var val = type;
        var key = 'bond_' + name;
        localStorage.setItem(key, val);
        saveGame();
        return;
    }
    var key = type + '_' + name;
    localStorage.setItem(key, value);
    saveGame();
}

// 获取三维好感度的快捷函数（方便其他地方调用）
function getTrust(name) { return getAffection(name, 'trust'); }
function getDependency(name) { return getAffection(name, 'dependency'); }
function getBond(name) { return getAffection(name, 'bond'); }

function setTrust(name, val) { setAffection(name, 'trust', val); }
function setDependency(name, val) { setAffection(name, 'dependency', val); }
function setBond(name, val) { setAffection(name, 'bond', val); }
// function getAffection(name) { return parseInt(localStorage.getItem('affection_' + name)) || 0; }
// function setAffection(name, value) { localStorage.setItem('affection_' + name, value); saveGame(); }
function getDay() { return parseInt(localStorage.getItem('current_day')) || 1; }
function setDay(value) { localStorage.setItem('current_day', value); saveGame(); }
function getActionPoints() {
    var value = parseInt(localStorage.getItem('action_points'));
    return isNaN(value) ? 6 : value;
}
function setActionPoints(value) {
    if (value < 0) value = 0;  // 防止负数
    localStorage.setItem('action_points', value);
    saveGame();
}
function getUnlockedStories() { return JSON.parse(localStorage.getItem('unlocked_stories')) || []; }
function addUnlockedStory(id) { var arr = getUnlockedStories(); if (!arr.includes(id)) { arr.push(id); localStorage.setItem('unlocked_stories', JSON.stringify(arr)); saveGame(); } }
function getUnlockedAchievements() { return JSON.parse(localStorage.getItem('unlocked_achievements')) || []; }
function addUnlockedAchievement(id) { var arr = getUnlockedAchievements(); if (!arr.includes(id)) { arr.push(id); localStorage.setItem('unlocked_achievements', JSON.stringify(arr)); saveGame(); } }