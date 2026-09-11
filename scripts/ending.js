// ============================================================
// 存档管理 + 结局展示 + 纪念图册
// ============================================================

var SAVE_SLOT_PREFIX = 'manor_diary_slot_';
var GAME_SAVE_KEYS = [
    'trust_jack','trust_emma','trust_michiko','dependency_jack','dependency_emma','dependency_michiko',
    'bond_jack','bond_emma','bond_michiko','current_day','action_points',
    'unlocked_stories','unlocked_achievements','triggered_branches','key_choices','visited_characters',
    'mood_jack','mood_emma','mood_michiko',
    'jack_book_event_triggered','emma_book_event_triggered','michiko_book_event_triggered',
    'jack_tea_event_triggered','emma_tea_event_triggered','michiko_tea_event_triggered',
    'bookshelf_completed','tea_completed','unlocked_endings'
];

var ENDING_DATA = {
    true_end: { type:'True End', title:'庄园之主', image:'images/background-home1.jpg', text:'三个人都愿意把真正的自己交到你面前。你没有改变这座庄园，却让这里重新有了等待与归来的意义。从今以后，这里不只是他们的避风处，也是你愿意一次次回来的地方。' },
    happy_end: { type:'Happy End', title:'最好的朋友', image:'images/background-home2.jpg', text:'你们没有说过什么惊天动地的承诺，却在一次次相处里变得越来越熟悉。庄园的日子仍旧平凡，而你知道，只要推开门，总有人会笑着和你打招呼。' },
    single_end: { type:'Single End', title:'TA 的陪伴', image:'images/background-home3.jpg', text:'你和那个人的故事走得更远了一些。庄园依旧安静，但你们已经拥有只属于彼此的默契。或许陪伴本身，就是这段日子最好的答案。' },
    normal_end: { type:'Normal End', title:'平凡的日子', image:'images/background-main1.jpg', text:'日子一天天过去。你没有留下轰轰烈烈的故事，却也在庄园里度过了一段安静的时光。有些相遇不一定要有结局，曾经一起看过的风景，也足以被记住。' },
    bad_end: { type:'Bad End', title:'孤独的守望', image:'images/background-main3.jpg', text:'庄园还是原来的庄园，只是再也没有人等你。你站在空荡荡的大厅里，才发现人与人之间的距离，并不会因为时间流逝而自动缩短。' }
};

var endingTimer = null;

function arr(key) { try { var x=JSON.parse(localStorage.getItem(key)); return Array.isArray(x)?x:[]; } catch(e) { return []; } }
function unlockedEndings() { return arr('unlocked_endings'); }
function addEnding(id) { var a=unlockedEndings(); if(a.indexOf(id)===-1){a.push(id);localStorage.setItem('unlocked_endings',JSON.stringify(a));} }

function understandingChoiceCount() {
    // 当前 key_choices 只有 A/B；现有剧情中 A 都是尊重、陪伴、接受或帮助类选择。
    return arr('key_choices').filter(function(x){ return x && x.choice === 'A'; }).length;
}

function calculateEnding() {
    var ns=['jack','emma','michiko'];
    var all80=ns.every(function(n){return getAffection(n,'bond')>=80;});
    var trust60=ns.every(function(n){return getAffection(n,'trust')>=60;});
    var dep60=ns.every(function(n){return getAffection(n,'dependency')>=60;});
    if(all80 && trust60 && dep60 && understandingChoiceCount()>=3) return 'true_end';
    if(all80) return 'happy_end';
    var high=ns.filter(function(n){return getAffection(n,'bond')>=80;}).length;
    var low=ns.filter(function(n){return getAffection(n,'bond')<50;}).length;
    if(high===1 && low===2) return 'single_end';
    var day=getDay();
    if(ns.every(function(n){return getAffection(n,'bond')<30;}) && day>=5) return 'bad_end';
    if(ns.every(function(n){return getAffection(n,'bond')<50;}) && day>=7) return 'normal_end';
    return null;
}

function checkEndingConditions() {
    var main=document.getElementById('page-main');
    if(!main || main.style.display!=='flex') return;
    if(unlockedEndings().length>0) return;
    var id=calculateEnding();
    if(id) showEnding(id);
}

function showEnding(id) {
    var data=ENDING_DATA[id]; if(!data) return;
    addEnding(id);
    if(endingTimer) clearInterval(endingTimer);
    document.getElementById('ending-background').style.backgroundImage='url("'+data.image+'")';
    document.getElementById('ending-title').textContent=data.title;
    var textEl=document.getElementById('ending-text'); textEl.textContent='';
    document.getElementById('page-ending').style.display='flex';
    var chars=data.text.split(''), i=0;
    endingTimer=setInterval(function(){
        if(i>=chars.length){clearInterval(endingTimer);endingTimer=null;return;}
        textEl.textContent+=chars[i++];
    },55);
}

function finishEndingText(){
    var a=unlockedEndings(); if(!a.length) return;
    var data=ENDING_DATA[a[a.length-1]]; if(!data) return;
    if(endingTimer){clearInterval(endingTimer);endingTimer=null;}
    document.getElementById('ending-text').textContent=data.text;
}

// -------------------- 存档 --------------------
function captureGameSnapshot(){
    var data={};
    GAME_SAVE_KEYS.forEach(function(k){var v=localStorage.getItem(k);if(v!==null)data[k]=v;});
    return data;
}
function applyGameSnapshot(data){
    GAME_SAVE_KEYS.forEach(function(k){
        if(Object.prototype.hasOwnProperty.call(data,k)) localStorage.setItem(k,data[k]);
        else localStorage.removeItem(k);
    });
    if(typeof updateMainUI==='function') updateMainUI();
    if(typeof refreshAchievements==='function') refreshAchievements();
}
function getSaveSlot(slot){try{var v=localStorage.getItem(SAVE_SLOT_PREFIX+slot);return v?JSON.parse(v):null;}catch(e){return null;}}
function saveToSlot(slot,overwrite){
    if(getSaveSlot(slot)&&!overwrite){alert('这个存档槽已经有内容，请使用“覆盖”。');return;}
    localStorage.setItem(SAVE_SLOT_PREFIX+slot,JSON.stringify({slot:slot,savedAt:new Date().toLocaleString('zh-CN'),data:captureGameSnapshot()}));
    renderSaveSlots(); alert('存档 '+slot+' 已保存。');
}
function loadFromSlot(slot){var r=getSaveSlot(slot);if(!r)return;if(!confirm('确定读取存档 '+slot+' 吗？当前未保存的进度会被替换。'))return;applyGameSnapshot(r.data||{});showPage('page-main');}
function overwriteSlot(slot){if(!getSaveSlot(slot)){saveToSlot(slot,false);return;}if(confirm('确定用当前进度覆盖存档 '+slot+' 吗？'))saveToSlot(slot,true);}
function deleteSlot(slot){if(!getSaveSlot(slot))return;if(!confirm('确定删除存档 '+slot+' 吗？此操作不可恢复。'))return;localStorage.removeItem(SAVE_SLOT_PREFIX+slot);renderSaveSlots();}
function saveMiniBar(name,value){return '<div class="save-mini-row"><span>'+name+'</span><div class="save-mini-track"><div style="width:'+Math.min(value,100)+'%"></div></div><b>'+Math.min(value,100)+'</b></div>';}
function renderSaveSlots(){
    var box=document.getElementById('save-slot-list');if(!box)return;box.innerHTML='';
    for(var slot=1;slot<=3;slot++){
        var r=getSaveSlot(slot), card=document.createElement('div');
        card.className='save-slot-card '+(r?'has-save':'empty-save');
        if(!r){card.innerHTML='<div class="save-slot-title">存档 '+slot+'</div><div class="empty-slot-text">空槽位</div><button class="save-new-btn" onclick="saveToSlot('+slot+',false)">新建存档</button>';box.appendChild(card);continue;}
        var d=r.data||{};
        card.innerHTML='<div class="save-slot-top"><div class="save-slot-title">存档 '+slot+'</div><div class="save-time">'+(r.savedAt||'')+'</div></div>'+
            '<div class="save-day">第 '+(parseInt(d.current_day)||1)+' 天</div>'+saveMiniBar('杰克',parseInt(d.bond_jack)||0)+saveMiniBar('园丁',parseInt(d.bond_emma)||0)+saveMiniBar('红蝶',parseInt(d.bond_michiko)||0)+
            '<div class="save-actions"><button class="save-load-btn" onclick="loadFromSlot('+slot+')">读取</button><button class="save-overwrite-btn" onclick="overwriteSlot('+slot+')">覆盖</button><button class="save-delete-btn" onclick="deleteSlot('+slot+')">删除</button></div>';
        box.appendChild(card);
    }
}

// -------------------- 纪念图册 --------------------
function renderAlbum(){
    var grid=document.getElementById('album-grid');if(!grid)return;grid.innerHTML='';
    var u=unlockedEndings();
    Object.keys(ENDING_DATA).forEach(function(id){
        var d=ENDING_DATA[id], done=u.indexOf(id)!==-1, card=document.createElement('div');
        card.className='album-card '+(done?'album-unlocked':'album-locked');
        if(done) card.style.backgroundImage='linear-gradient(rgba(20,12,8,.25),rgba(20,12,8,.8)),url("'+d.image+'")';
        card.innerHTML='<div class="album-lock">'+(done?'✓':'🔒')+'</div><div class="album-card-info"><span>'+d.type+'</span><strong>'+(done?d.title:'未解锁结局')+'</strong></div>';
        card.onclick=function(){if(done)viewMemory(id);else alert('这个结局还没有解锁。');};
        grid.appendChild(card);
    });
}
function viewMemory(id){
    var d=ENDING_DATA[id];if(!d||unlockedEndings().indexOf(id)===-1)return;
    document.getElementById('album-detail-image').style.backgroundImage='url("'+d.image+'")';
    document.getElementById('album-detail-kicker').textContent=d.type;
    document.getElementById('album-detail-title').textContent=d.title;
    document.getElementById('album-detail-text').textContent=d.text;
    document.getElementById('album-detail').style.display='flex';
}
function closeAlbumDetail(){document.getElementById('album-detail').style.display='none';}

setInterval(function(){renderSaveSlots();renderAlbum();checkEndingConditions();},1000);
setTimeout(function(){renderSaveSlots();renderAlbum();},300);
