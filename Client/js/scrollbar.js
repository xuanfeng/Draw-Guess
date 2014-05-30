/*
 * @ 聊天窗口滚动条处理函数
 * @ xuanfeng
 * @ 2013-02-05
 * 
 */

define(function(require, exports, module){
    var $ = require("jquery"),
        io = require("socket"),
        socket = io.connect();
    
    // var sendBtn = $(".chat_btn"),				// 发送按钮
        // msgTxt = $(".message_input"),			// 发送文本
    var contentWrap = $(".chat_content_wrap"),	// 消息容器(滚动条)
        container = $(".chat_content_inner"),	// 消息容器(内容)
        isWebkit = $.browser.safari,			// 是否是webkit内核
        containerMask = $('.chat_content_inner'),		//消息事件代理器
        scrollbarContainer = $('.scroller-container'),	// 滚动条容器
        scrollbar = $('.scrollbar'),			// 滚动条部分
        _height = 570,							// 消息遮罩高度
        isDrag = false,							// 是否拖动滚动条
    	pos = {}, 								// 记录滚动条位置
        preventFlushScreen = false;             // 防止聊天刷屏
    


    //根据消息容器的高度自动改变滚动条的高度
    function changeScrollbarLen() {
        var _len = container.height(),
            _barLen = _height * _height / _len;

        scrollbarContainer.css("display", "block");

        scrollbar.height(_barLen).stop().animate({
            top: _height - _barLen + "px"
        });
    }


    // 滚动条滚动
    var changeScroll = function(){
        var _diff = container.height();
        // console.log(_diff)
        // 把最新的消息推上去
        if (_diff > _height) {
            if(!isWebkit){
                contentWrap.stop().animate({scrollTop: _diff-_height}, 400);
            }else{
                changeScrollbarLen();
                container.stop().animate({
                    top: -(_diff - _height) + "px"
                });
            }
        }
    }
    changeScroll();


    // 兼容不支持自定义滚动条样式
    function initScroll(){
        if(!isWebkit){
            // 更改
            $(".chat_content_wrap").css({"overflow-y": "scroll"});
        }else{

        }
    }
    initScroll();


    //为滚动条绑定滚动事件
    containerMask.on('mousewheel DOMMouseScroll', function(e) {
        var _diff = (e.originalEvent.wheelDelta > 0) ? -30 : 30,
            _top = scrollbar.css('top').replace('px', '') * 1;

        _diff = _top + _diff;

        changePositionOfBar(_diff);
    });


    // 更改滚动条位置
    function changePositionOfBar(dest) {
        var _cheight = container.height(),
            _nextTop;

        // 防止高度过小而继续滚动
        if(_cheight < _height){
        	return false;
        }

        if (dest < 0){
            dest = 0;
        }
        if (dest > _height - scrollbar.height()){
            dest = _height - scrollbar.height();
        }

        _nextTop = -(_cheight - _height) * dest / (_height - scrollbar.height());

        container.css("top", _nextTop);
        scrollbar.css("top", dest + "px");
    }


    //给滚动条添加点击和拖动事件
    scrollbar.on("mousedown", function(e) {
        e.stopPropagation = true;
        isDrag = true;
        pos.y = e.clientY;
    });


    // 选择
    document.onselectstart = function() {
        return !isDrag;
    }


    //document 上绑定鼠标的移动事件
    document.addEventListener("mousemove", function(e){
        //e.stopPropagation();
        var _diffY = e.clientY - pos.y;
        _diffY += scrollbar.css("top").replace("px", "") * 1;

        if (isDrag) {
            changePositionOfBar(_diffY);
        }

        pos.y = e.clientY;
    }, true);


    //document 上绑定鼠标的抬起事件
    $(document).on("mouseup", function(e) {
        e.stopPropagation = true;
        isDrag = false;
    });

    // 刷屏
    containerMask.bind("mouseover", function() {
        preventFlushScreen = true;
    });

    containerMask.bind("mouseout", function() {
        preventFlushScreen = false;
    });

    exports.changeScroll = changeScroll;
});