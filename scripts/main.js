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
    showPage('page-main');
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
   
        showPage('page-login');
    
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