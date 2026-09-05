//找到并保存书籍元素
const bookstack = document.querySelector(".book-stack");
const book1 = document.querySelector("#book1");
const book2 = document.querySelector("#book2");
const book3 = document.querySelector("#book3");
//记录书籍相对父元素初始位置
const book1firstX = book1.style.left;
const book1firstY = book1.style.top;
//记录初始鼠标书籍相对位置
const rect = bookstack.getBoundingClientRect();
const rect1 = book1.getBoundingClientRect();
const rect2 = book2.getBoundingClientRect();
const rect3 = book3.getBoundingClientRect();
let offsetX = 0;
let offsetY = 0;
//设置状态确定是否处于拖拽状态
let isdragging = false;
//设置一个变量确定书籍序号用于移动和释放
let book = null;

book1.addEventListener("mousedown", 
    function(event) {
        isdragging = true;
        book = book1;
        offsetX = event.clientX - rect1.left;
        offsetY = event.clientY - rect1.top;
    });
book2.addEventListener("mousedown", 
    function(event) {
        isdragging = true;
        book = book2;
        offsetX = event.clientX - rect2.left;
        offsetY = event.clientY - rect2.top;
    });
book3.addEventListener("mousedown", 
    function(event) {
        isdragging = true;
        book = book3;
        offsetX = event.clientX - rect3.left;
        offsetY = event.clientY - rect3.top;
    });        
document.addEventListener("mousemove",
    function(event){
        if(isdragging){
            //书籍绝对位置=书籍相对父元素位置+父元素绝对位置=鼠标绝对位置-鼠标相对书籍位置
            book.style.left = event.clientX - rect.left - offsetX + "px";
            book.style.top = event.clientY - rect.top - offsetY + "px";  
        }
    }
)
document.addEventListener("mouseup",
    function(){
        isdragging = false;
        //松开自动弹回
        book.style.left = book1firstX;
        book.style.top = book1firstY;
    }
)