// ===== 页面切换函数 =====
function showPage(pageId) {
    var allPages = document.querySelectorAll('.page, .page-overlay, .page-sidebar');
    for (var i = 0; i < allPages.length; i++) {
        allPages[i].style.display = 'none';
    }
    var target = document.getElementById(pageId);
    if (target) {
        target.style.display = 'block';
    }
}

// ===== 页面加载时默认显示首页 =====
window.onload = function() {
    showPage('page-home');
};