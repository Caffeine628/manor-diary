// 返回大厅
document.getElementById('backBtn').addEventListener('click', function () {
    // 清除小游戏暂存信息
    sessionStorage.removeItem('minigame_character');
    sessionStorage.removeItem('minigame_return_dialog');

    // 回大厅
    window.location.href = 'index.html#page-main';
});