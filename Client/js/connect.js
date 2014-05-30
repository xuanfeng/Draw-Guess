/*
 * @ 与服务器数据交互(中转站)
 * @ xuanfeng
 * @ 2013-04-04
 * */
 define(function(require, exports, module){
	var $ = require("jquery"),
		io = require("socket"),
		socket = io.connect(),
		JSON = require("json2"),
		Chat = require("chat"),
		cookie = require("jquery.cookie"),
		Draw = require("draw"),
		Main = require("main");

	var listener = function(){
		
		var from = $.cookie("nickname"),
			avatorId = $.cookie("avatorId");

		// 1. 消息管理
		// 上线
		socket.emit("online", JSON.stringify({nickname: from, avatorId: avatorId}));

		// 成功连接服务器
		socket.on("connect", function(){
			console.log("success");
			$(".loader").hide();
			$("#container").fadeIn();
			$(".chat_content_inner").empty();
			$(".logo").css({"left": 0});
			
			Chat.showMessage({
				"avatorId": 1, 
				"from": "系统",
				"msg": "您已成功进入房间! <br/>\
						1. 答案通过发言框输入发送<br/>\
						2. \"@对方名字 消息\"(或点击头像)发送私信<br/>\
						3. 游戏后将会统计积分，生成排行<br/>\
						4. 一轮完毕，欢迎进行互动"
			}, {
				"item": "nocice", 
				"detail": "focus"
			});
		});
		
		// 接收到公共消息
		socket.on("public message", function(avatorId, name, msg){
			var data = {"avatorId": avatorId, "from": name, "msg": msg},
				type = {"item": "normal", "detail": "other"};
			Chat.showMessage(data, type);
		});
		
		// 接收到私人信息
		socket.on("private message", function(from, avatorId, msg){
			var data = {"avatorId": avatorId, "from": from, "msg": msg},
				type = {"item": "normal", "detail": "other"};
			Chat.showMessage(data, type);
		});
		
		// 接收到系统信息
		socket.on("system message", function(msg, detail){
			var data = {"avatorId": 1, "from": "系统", "msg": msg},
				type = {"item": "notice", "detail": detail};
			Chat.showMessage(data, type);
		});

		// 接收到正确答案
		socket.on("correct answer", function(name, msg){
			var data = {"avatorId": 1, "from": name, "msg": msg},
				type = {"item": "notice", "detail": "right"};
			Chat.showMessage(data, type);
			Main.correctAnswer();
		});
		
		// 发送消息失败
		socket.on("message error", function(to, msg){
			var data = {"avatorId": avatorId, "from": "系统", "msg": "刚才发送给【" + to + "】的消息“" + msg + "”不成功！"},
				type = {"item": "notice", "detail": "sub"};
			Chat.showMessage(data, type);
		});


		// 2. 绘画
		// 更改画笔类型
		socket.on("graphType", function(graphType){
			Draw.dataChange.typeChange(graphType);
		});

		//  更改绘画数据：color、size
		socket.on("graphData", function(praphData){
			switch(praphData.name){
				case "color":
					Draw.dataChange.colorChange(praphData.value);
					break;
				case "size":
					Draw.dataChange.sizeChange(praphData.value);
					break;
				default:
					break;
			}
		});

		// 更新绘画操作及位置
		socket.on("graphHandle", function(graphHandle){
			var graphHandleType = graphHandle.type,
				clientX = graphHandle.x || 0,
				clientY = graphHandle.y || 0,
				graphHandleData = {
					x: clientX,
					y: clientY
				};

			switch(graphHandleType){
				case "mousedown": 
					Draw.drawHandleRecive.mousedown(graphHandleData);
					break;
				 case "mousemove": 
					Draw.drawHandleRecive.mousemove(graphHandleData);
					break;
				case "mouseup": 
					Draw.drawHandleRecive.mouseup(graphHandleData);
					break;
				case "mouseout": 
					Draw.drawHandleRecive.mouseout();
					break;
				default: 
					break;
			}

		});

		// 普通操作-命令模式
		socket.on("graphCmd", function(graphCmd){
			switch(graphCmd){
				case "fill":
					// 填充
					Draw.normalHandle.fill();
					break;
				case "cancel":
					// 上一步
					Draw.normalHandle.cancel();
					break;
				case "next":
					// 下一步
					Draw.normalHandle.next();
					break;
				case "clearContext":
					// 参数true，清空画布
					Draw.normalHandle.clearContext(true);
					break;
				default:
					break;
			}
		});


		// 3. 游戏操作

		// 获取游戏玩家数据-进房间时获取
		socket.on("player data", function(data){
			$(".player").find("span").text(data.name).end().find("img").attr("src", "images/avator_"+data.avatorId+".jpg");
			$(".player").fadeIn(200);
		});

		// 刷新在线列表
		socket.on("online list", function(list){
			Chat.showOnline(list);
		});

		//显示房间信息
		socket.on("room member", function(list){
			Main.showRoom(list);
		});

		// 游戏开始-第一场
		socket.on("start game", function(data){
			Main.startGame(data);
		});

		// 显示游戏结果
		socket.on("show answer", function(data){
			Main.showAnswer(data);
		});

		// 开始下一局游戏
		socket.on("next game", function(data){
			Main.nextGame(data);
		});

		// 放弃绘画
		socket.on("give up", function(data){
			Main.nextGame(data);
		});

		// 结束游戏
		socket.on("end game", function(data){
			Main.endGame(data);
			alert("游戏结束");
		});

		// 鲜花
		socket.on("flower", function(name){
			Main.flower();
			var data = {"avatorId": 1, "from": "系统", "msg": name+"使用了鲜花！"},
				type = {"item": "notice", "detail": "focus"};
			Chat.showMessage(data, type);
		});

		// 鲜花
		socket.on("egg", function(name){
			Main.egg();
			var data = {"avatorId": 1, "from": "系统", "msg": name+"使用了鸡蛋！"},
				type = {"item": "notice", "detail": "focus"};
			Chat.showMessage(data, type);
		});

		// 鲜花
		socket.on("shoe", function(name){
			Main.shoe();
			var data = {"avatorId": 1, "from": "系统", "msg": name+"使用了拖鞋！"},
				type = {"item": "notice", "detail": "focus"};
			Chat.showMessage(data, type);
		});

	};

	exports.listen = listener;
});