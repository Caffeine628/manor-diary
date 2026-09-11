// ============================================================
// 成就系统
// ============================================================

var ACHIEVEMENT_DATA = [
    { id: 'first_meet', icon: '🌱', name: '初次相遇', desc: '第一次点击任意角色。' },
    { id: 'tea_master', icon: '🍵', name: '茶艺大师', desc: '首次完成泡茶小游戏。' },
    { id: 'book_master', icon: '📚', name: '整理达人', desc: '完成书架小游戏三关。' },
    { id: 'close_friend', icon: '💛', name: '交心好友', desc: '任意角色的羁绊达到 100。' },
    { id: 'manor_favorite', icon: '🏡', name: '庄园团宠', desc: '三个角色的羁绊全部达到 100。' },
    { id: 'story_collector', icon: '📖', name: '故事收集者', desc: '解锁全部 12 段角色阶段剧情。' }
];

function readJsonSafe(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
    catch (e) { return fallback; }
}
function getAchievementList() { return readJsonSafe('unlocked_achievements', []); }
function setAchievementList(list) { localStorage.setItem('unlocked_achievements', JSON.stringify(list)); }
function getVisitedCharacters() { return readJsonSafe('visited_characters', []); }

function unlockAchievement(id) {
    var list = getAchievementList();
    if (list.indexOf(id) !== -1) return;
    list.push(id);
    setAchievementList(list);
    showAchievementNotice(id);
}

function showAchievementNotice(id) {
    var data = ACHIEVEMENT_DATA.find(function (x) { return x.id === id; });
    if (!data) return;
    var old = document.getElementById('achievement-notice');
    if (old) old.remove();
    var div = document.createElement('div');
    div.id = 'achievement-notice';
    div.innerHTML = '<div class="notice-icon">🏆</div><div><strong>成就解锁</strong><br>' + data.name + '</div>';
    document.body.appendChild(div);
    setTimeout(function () { if (div.parentNode) div.remove(); }, 2200);
}

function getStoryProgressCount() {
    var chars = ['jack', 'emma', 'michiko'];
    var visited = getVisitedCharacters();
    var count = 0;
    for (var i = 0; i < chars.length; i++) {
        if (visited.indexOf(chars[i]) === -1) continue;
        var bond = getAffection(chars[i], 'bond');
        count += 1; // 初识
        if (bond >= 20) count++;
        if (bond >= 50) count++;
        if (bond >= 80) count++;
    }
    return count;
}

function refreshAchievements() {
    if (getVisitedCharacters().length > 0) unlockAchievement('first_meet');
    if (localStorage.getItem('tea_completed') === 'true') unlockAchievement('tea_master');
    if (localStorage.getItem('bookshelf_completed') === 'true') unlockAchievement('book_master');

    var names = ['jack', 'emma', 'michiko'];
    var any100 = false, all100 = true;
    names.forEach(function (name) {
        var bond = getAffection(name, 'bond');
        if (bond >= 100) any100 = true;
        if (bond < 100) all100 = false;
    });
    if (any100) unlockAchievement('close_friend');
    if (all100) unlockAchievement('manor_favorite');
    if (getStoryProgressCount() >= 12) unlockAchievement('story_collector');
    renderAchievementPanel();
}

function renderAchievementPanel() {
    var listEl = document.getElementById('achievement-list');
    var progressEl = document.getElementById('achievement-progress');
    if (!listEl || !progressEl) return;
    var unlocked = getAchievementList();
    var count = ACHIEVEMENT_DATA.filter(function (x) { return unlocked.indexOf(x.id) !== -1; }).length;
    progressEl.innerHTML = '<div class="achievement-progress-title">收集进度 ' + count + ' / ' + ACHIEVEMENT_DATA.length + '</div>' +
        '<div class="achievement-progress-track"><div style="width:' + (count / ACHIEVEMENT_DATA.length * 100) + '%"></div></div>';
    listEl.innerHTML = '';
    ACHIEVEMENT_DATA.forEach(function (item) {
        var done = unlocked.indexOf(item.id) !== -1;
        var row = document.createElement('div');
        row.className = 'achievement-row ' + (done ? 'done' : 'locked');
        row.innerHTML = '<div class="achievement-icon">' + (done ? item.icon : '🔒') + '</div>' +
            '<div class="achievement-info"><div class="achievement-name">' + item.name + '</div>' +
            '<div class="achievement-desc">' + item.desc + '</div></div>' +
            '<div class="achievement-status">' + (done ? '✓ 已达成' : '未解锁') + '</div>';
        listEl.appendChild(row);
    });
}

function openAchievement() {
    refreshAchievements();
    document.getElementById('achievement-mask').style.display = 'block';
    document.getElementById('page-achievement').style.display = 'block';
}
function closeAchievement() {
    document.getElementById('achievement-mask').style.display = 'none';
    document.getElementById('page-achievement').style.display = 'none';
    showPage('page-main');
}

// 不改大厅原有 onclick：记录“第一次点击角色”和成就按钮打开时刷新内容。
document.addEventListener('click', function (e) {
    var character = e.target.closest ? e.target.closest('.character') : null;
    if (character) {
        var raw = character.getAttribute('onclick') || '';
        var match = raw.match(/openDetail\(['"]([^'"]+)['"]\)/);
        if (match) {
            var visited = getVisitedCharacters();
            if (visited.indexOf(match[1]) === -1) {
                visited.push(match[1]);
                localStorage.setItem('visited_characters', JSON.stringify(visited));
            }
            setTimeout(refreshAchievements, 50);
        }
    }
    var nav = e.target.closest ? e.target.closest('.nav-btn') : null;
    if (nav && (nav.textContent || '').indexOf('成就') !== -1) {
        setTimeout(openAchievement, 0);
    }
});

setInterval(refreshAchievements, 1000);
setTimeout(refreshAchievements, 200);
