/*
 * @ 聊天功能
 * @ xuanfeng
 * @ 2013-04-04
 * */
define(function(require, exports, module){
	var $ = require("jquery"),
		io = require("socket"),
		socket = io.connect(),
        cookie = require("jquery.cookie"),
		scrollBar = require("scrollbar"),
        Main = require("main"),
        EJS = require("ejs");

	var sendBtn = $(".chat_btn"),				// 发送按钮
        avatorId = $.cookie("avatorId") || 1,							// 头像Id
        msgTxt = $(".message_input");			// 发送文本

	// 消息格式化
    var _formatHTML = function(html){
        return html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // 日期格式化
    var _timeFormat = function(time){
		return time <= 9 ? "0"+time : time;
	}

	// 显示聊天信息(包括系统消息)
	var showMessage = function(data, type){
		// data={avatorId: , from: , msg: }
		// type={item: , detail: }
		// var from = from ? _formatHTML(data.from) : ",
		var	msg = data.from != "系统" ? _formatHTML(data.msg) : data.msg,
			date = new Date(),
			dateH = _timeFormat(date.getHours()),
			dateM = _timeFormat(date.getMinutes()),
			dateS = _timeFormat(date.getSeconds()),
			time = dateH + ":" + dateM + ":" + dateS,
			msgTpl;


		// type = !type.item ? " : "type_" + type.detail;
		var from = type.detail==="private" ? data.from+"[私聊]" : data.from;

        var Msg = {
            detail: type.detail,
            avatorId: data.avatorId,
            from: from,
            time: time,
            msg: msg
        }

		if(type.item == "normal"){
			// 正常发言
			msgTpl = new EJS({url: "./views/message.ejs"}).render({data: Msg, type: "normal"});
		}else{
			// 系统消息
			msgTpl = new EJS({url: "./views/message.ejs"}).render({data: Msg, type: "private"});
		}

        // 回答正确
        if(from != "系统" && type.detail!="private"){
            socket.emit("score", {
                type: "answer",
                name: from
            });
        }

		$(".chat_content_inner").append(msgTpl);

		// 自定义滚动条
		scrollBar.changeScroll();
	}



    // 点击发送
    sendBtn.on("click", function() {
        sendMsg();
    });

    // 快捷键发送
    msgTxt.on("keydown",function(event) {
        var keyCode = event.keyCode || event.which;
        if (keyCode == 13) {
            sendMsg();
        }
    });


    // 发送消息函数，向服务器发送聊天数据
    function sendMsg(){
        var msg = msgTxt.val();

      	// 内容为空
        if($.trim(msg) == ""){
            msgTxt.val("").stop(false, true)
                .css("background","#f5cfcf")
                .animate({opacity: 0.3}, 300, function(){
                    msgTxt.css("background","#ffffff").css("opacity", "1");
            });
            msgTxt.focus();
            return false;
        }

        // 私信or群发
    	if (msg.substr(0, 1) == "@") {
    		// 如果以@开头，则为私人信息
    		var space = msg.indexOf(" ");
    		if (space > 0) {
    			// 发送私人消息
    			var to = msg.substr(1, space-1);
    			msg = msg.substr(space + 1);
    			socket.emit("private message", to, avatorId, msg, function(ok){
    				// 回调函数
    				if (ok) {
    					// 发送私信成功，则显示自己的发言
    					var data = {"avatorId": avatorId, "from": $(".name").text()+"[对\""+to+"\"的私信]", "msg": msg},
    						type = {"item": "normal", "detail": "private"};
    					showMessage(data, type);
    				}
    			});
    		}
    	}else{
    		// 发送公共消息
    		socket.emit("public message", avatorId, $(".name").text(), msg, function(ok){
    			if (ok){
    				var data = {"avatorId": avatorId, "from": $(".name").text(), "msg": msg},
    					type = {"item": "normal", "detail": "me"};
    				showMessage(data, type);
    			}
    		});
    	}
    	
    	msgTxt.val("");
        msgTxt.focus();
    }



	// 获取在线人员列表
    var showOnline = function(list){
        var html = new EJS({url: "./views/online.ejs"}).render({user: list});
        $(".online_list").html(html);
    }

    // 切换在线人员列表
    $(".show_online").on("click", function(){
        var $this = $(this),
            $chat = $("#online");
        $this.toggleClass("close_online");
        
        if($this.hasClass("close_online")){
            // 显示
            $chat.animate({
                right: 4,
                opacity: 1
            }, 400);
        }else{
            // 隐藏
            $chat.animate({
                right: -220,
                opacity: 0
            }, 200);
        }
    });



    // 清空聊天记录
    $(".clear_chat").on("click", function(){
        $(".chat_content_inner").empty().removeAttr("style");
        // 系统再输出一些默认文字
        var data = {"avatorId": avatorId, "msg": "记录已清空，继续游戏吧~"},
    		type = {"item": "notice", "detail": "focus"};
    	showMessage(data, type);
    });



    // 点击头像@某个人
    $("#online").on("click", ".online_member", function(){
        var nickname = $(this).find(".nickname").text();
        _privateMessage(nickname);
    });

    // 在输入框中@某人
    var _privateMessage = function(nickname){
        $(".message_input").val("@" + nickname + " " + $(".message_input").val()).focus();
        _setCaretPosition("message_input");
    }

    // 报错 - 在输入框代替输入文字
    var _setCaretPosition = function(elemId){
        var elem = document.getElementById(elemId);
        var caretPos = elem.value.length;
        if (elem != null) {
            if (elem.createTextRange) {
                var range = elem.createTextRange();
                range.move("character", caretPos);
                range.select();
            }
            else {
                // chrome
                elem.setSelectionRange(caretPos, caretPos);
                elem.focus();
                //空格键
                // var evt = document.createEvent("KeyboardEvent");
                // evt.initKeyEvent("keypress", true, true, null, false, false, false, false, 0, 32);
                // elem.dispatchEvent(evt);
                // 退格键
                // evt = document.createEvent("KeyboardEvent");
                // evt.initKeyEvent("keypress", true, true, null, false, false, false, false, 8, 0);
                // elem.dispatchEvent(evt);
            }
        }
    }



	exports.showMessage = showMessage;
	exports.showOnline = showOnline;
})