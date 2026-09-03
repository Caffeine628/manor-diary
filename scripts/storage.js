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
        affection_jack: parseInt(localStorage.getItem('affection_jack')) || 0,
        affection_emma: parseInt(localStorage.getItem('affection_emma')) || 0,
        affection_michiko: parseInt(localStorage.getItem('affection_michiko')) || 0,
        current_day: parseInt(localStorage.getItem('current_day')) || 1,
        action_points: parseInt(localStorage.getItem('action_points')) || 6,
        unlocked_stories: JSON.parse(localStorage.getItem('unlocked_stories')) || [],
        unlocked_achievements: JSON.parse(localStorage.getItem('unlocked_achievements')) || []
    };
    localStorage.setItem('manor_diary_save', JSON.stringify(data));
}

function loadGame() {
    var saved = localStorage.getItem('manor_diary_save');
    if (saved) {
        var data = JSON.parse(saved);
        localStorage.setItem('affection_jack', data.affection_jack || 0);
        localStorage.setItem('affection_emma', data.affection_emma || 0);
        localStorage.setItem('affection_michiko', data.affection_michiko || 0);
        localStorage.setItem('current_day', data.current_day || 1);
        localStorage.setItem('action_points', data.action_points || 6);
        localStorage.setItem('unlocked_stories', JSON.stringify(data.unlocked_stories || []));
        localStorage.setItem('unlocked_achievements', JSON.stringify(data.unlocked_achievements || []));
        return true;
    }
    return false;
}

// ===== 快捷函数 =====
function getAffection(name) { return parseInt(localStorage.getItem('affection_' + name)) || 0; }
function setAffection(name, value) { localStorage.setItem('affection_' + name, value); saveGame(); }
function getDay() { return parseInt(localStorage.getItem('current_day')) || 1; }
function setDay(value) { localStorage.setItem('current_day', value); saveGame(); }
function getActionPoints() { return parseInt(localStorage.getItem('action_points')) || 6; }
function setActionPoints(value) { localStorage.setItem('action_points', value); saveGame(); }
function getUnlockedStories() { return JSON.parse(localStorage.getItem('unlocked_stories')) || []; }
function addUnlockedStory(id) { var arr = getUnlockedStories(); if (!arr.includes(id)) { arr.push(id); localStorage.setItem('unlocked_stories', JSON.stringify(arr)); saveGame(); } }
function getUnlockedAchievements() { return JSON.parse(localStorage.getItem('unlocked_achievements')) || []; }
function addUnlockedAchievement(id) { var arr = getUnlockedAchievements(); if (!arr.includes(id)) { arr.push(id); localStorage.setItem('unlocked_achievements', JSON.stringify(arr)); saveGame(); } }