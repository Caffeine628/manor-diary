// ===== 页面切换函数 =====
function showPage(pageId) {
    var allPages = document.querySelectorAll('.page, .page-overlay, .page-sidebar');
    for (var i = 0; i < allPages.length; i++) {
        allPages[i].style.display = 'none';
    }
    var target = document.getElementById(pageId);
    if (target) {
        target.style.display = 'flex';
    }

    if (pageId === 'page-main') {
        updateMainUI();
    }
}

// ===== 登录注册函数 =====
function doLogin() {
    var username = document.getElementById('login-username').value.trim();
    var password = document.getElementById('login-password').value.trim();
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', username);
    showPage('page-home');
}

function doRegister() {
    var username = document.getElementById('register-username').value.trim();
    var password = document.getElementById('register-password').value.trim();
    var confirm = document.getElementById('register-confirm').value.trim();
    if (!username || !password || !confirm) {
        alert('请填写完整信息');
        return;
    }
    if (password !== confirm) {
        alert('两次密码输入不一致');
        return;
    }
    alert('注册成功！请登录');
    showPage('page-login');
}

function doLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    showPage('page-login');
}


window.onload = function() {
    // 检查登录状态
    var isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        // 如果已登录，显示首页并填充用户名
        var username = localStorage.getItem('username') || '玩家';
        var usernameSpan = document.getElementById('home-username');
        if (usernameSpan) {
            usernameSpan.textContent = username;
        }
        showPage('page-home');
    } else {
        showPage('page-login');
    }
};


window.addEventListener('hashchange', function() {
    var hash = window.location.hash.replace('#', '');
    if (hash) {
        showPage(hash);
    }
});


window.addEventListener('load', function() {
    var hash = window.location.hash.replace('#', '');
    if (hash) {
        showPage(hash);
    }
});


// ===== 刷新大厅界面 =====
function updateMainUI() {
    // 更新天数
    var dayEl = document.getElementById('day-display');
    if (dayEl) {
        dayEl.textContent = '📅 第 ' + getDay() + ' 天';
    }
    // 更新行动力
    var actionEl = document.getElementById('action-display');
    if (actionEl) {
        var ap = getActionPoints();
        actionEl.textContent = '❤️ 行动力：' + ap + '/6';
    }
    // 更新三个角色的好感度进度条
    updateProgress('jack');
    updateProgress('emma');
    updateProgress('michiko');
    updateAllMoods();
}

function updateAllMoods() {
    var moodMap = {
        happy: '😊', calm: '😐', sad: '😔', miss: '😌'
    };
    ['jack', 'emma', 'michiko'].forEach(function(name) {
        var moodKey = localStorage.getItem('mood_' + name) || 'calm';
        var icon = moodMap[moodKey] || '😐';
        var el = document.getElementById('mood-' + name);
        if (el) el.textContent = icon;
    });
}

function updateProgress(name) {
    var val = getAffection(name);
    var bar = document.getElementById('progress-' + name);
    if (bar) {
        var percent = Math.min(val, 100);
        bar.style.width = percent + '%';
    }
}

// ===== 下一天 =====
function nextDay() {
    var ap = getActionPoints();
    if (ap==0) {
        var day = getDay();
        setDay(day + 1);
        setActionPoints(6);
        var moods = ['happy', 'calm', 'sad', 'miss'];
['jack', 'emma', 'michiko'].forEach(function(name) {
    var randomMood = moods[Math.floor(Math.random() * moods.length)];
    localStorage.setItem('mood_' + name, randomMood);
});
        updateMainUI();
        alert('🌅 第 ' + getDay() + ' 天开始了！');
    } else {
        alert('今天还有行动力没用完呢！');
    }
}


function updateProgressBars(name) {
    var trust = getAffection(name, 'trust');
    var dependency = getAffection(name, 'dependency');
    var bond = getAffection(name, 'bond');
    
    var trustBar = document.getElementById('trust-' + name);
    var depBar = document.getElementById('dependency-' + name);
    var bondBar = document.getElementById('bond-' + name);
    
    if (trustBar) trustBar.style.width = Math.min(trust, 100) + '%';
    if (depBar) depBar.style.width = Math.min(dependency, 100) + '%';
    if (bondBar) bondBar.style.width = Math.min(bond, 100) + '%';
}

function updateMainUI() {
    // 更新天数
    var dayEl = document.getElementById('day-display');
    if (dayEl) dayEl.textContent = '📅 第 ' + getDay() + ' 天';
    // 更新行动力
    var actionEl = document.getElementById('action-display');
    if (actionEl) actionEl.textContent = '❤️ 行动力：' + getActionPoints() + '/6';
    // 更新三维进度条
    updateProgressBars('jack');
    updateProgressBars('emma');
    updateProgressBars('michiko');
}

function resetGame() {
    if (!confirm(
        '⚠️ 确定要重置游戏吗？\n\n' +
        '所有角色好感度、天数、行动力、剧情、成就、小游戏进度和触发记录都将清零！\n' +
        '此操作不可撤销！'
    )) {
        return;
    }

    // 清除所有游戏进度
    var keysToRemove = [
        // 三个角色的三项好感度
        'trust_jack',
        'trust_emma',
        'trust_michiko',

        'dependency_jack',
        'dependency_emma',
        'dependency_michiko',

        'bond_jack',
        'bond_emma',
        'bond_michiko',

        // 时间、行动力
        'current_day',
        'action_points',

        // 剧情、成就、选择
        'unlocked_stories',
        'unlocked_achievements',
        'triggered_branches',
        'key_choices',
        'visited_characters',

        // 心情
        'mood_jack',
        'mood_emma',
        'mood_michiko',

        // CG、结局
        'unlocked_cg',
        'unlocked_endings',

        // 书架小游戏：每个角色的触发记录
        'jack_book_event_triggered',
        'emma_book_event_triggered',
        'michiko_book_event_triggered',

        // 泡茶小游戏：每个角色的触发记录
        'jack_tea_event_triggered',
        'emma_tea_event_triggered',
        'michiko_tea_event_triggered',

        // 小游戏完成记录
        'bookshelf_completed',
        'tea_completed',

        // 游戏存档
        'manor_diary_save'
    ];

    // 一个一个删除
    for (var i = 0; i < keysToRemove.length; i++) {
        localStorage.removeItem(keysToRemove[i]);
    }

    // 清除小游戏临时数据
    sessionStorage.removeItem('minigame_character');
    sessionStorage.removeItem('minigame_return_dialog');

    // 恢复初始状态
    localStorage.setItem('current_day', '1');
    localStorage.setItem('action_points', '6');

    localStorage.setItem(
        'unlocked_stories',
        JSON.stringify([])
    );

    localStorage.setItem(
        'unlocked_achievements',
        JSON.stringify([])
    );

    localStorage.setItem(
        'triggered_branches',
        JSON.stringify([])
    );

    localStorage.setItem(
        'key_choices',
        JSON.stringify([])
    );

    // 恢复角色初始心情
    localStorage.setItem('mood_jack', 'calm');
    localStorage.setItem('mood_emma', 'calm');
    localStorage.setItem('mood_michiko', 'calm');

    // 更新页面
    if (typeof updateMainUI === 'function') {
        updateMainUI();
    }

    alert('✅ 游戏已重置！所有游戏进度已清零。');
}