/*
 * @ 游戏主逻辑
 * @ xuanfeng
 * @ 2013-04-19
 * 
 */



define(function(require, exports, module){
	var $ =require("jquery"),
		io = require("socket"),
		JSON = require("json2"),
		socket = io.connect(),
		Effect = require("effect"),
		EJS = require("ejs");

	// 定时器
	var _timer = {
		tipTimer1: null,
		tipTimer2: null,
		sixtyTimer: null,
		toolTimer1: null,
		toolTimer2: null,
		scoreTimer1: null,
		scoreTimer2: null
	}

	// 客户端全局游戏变量
	var GameData = {
		start: false,	//游戏是否开始
		word: [],		//关键词
		drawer: "",		//当前绘画者
		bindDraw: false	//是否可绘画
	}


	// 开始游戏-第一场
	function startGame(data){
		$(".room_wrapper").remove();	//隐藏房间
		normalGameStart(data);
	}

	// 游戏开局普通操作函数-时间60s、关键词、工具栏、画布等统一控制
	function normalGameStart(data){
		GameData.start = true;
		GameData.word = data.word;
		GameData.drawer = data.drawer;

		$("canvas").show();		//画布显示
		timeControl(59);		//时间控制
		if(GameData.drawer != $(".player .name").text()){
			// 当前玩家不是绘画者
			drawToolShow(false);
			tipControl(GameData.word, false);
		}else{
			// 是绘画者
			drawToolShow(true);
			tipControl(GameData.word, true);
		}
	}

	// 绘画工具显示/隐藏
	function drawToolShow(flag){
		$(".draw_tool").css("opacity", "1");
		if(flag){
			// 绘画者
			$(".draw_controller").fadeIn(200)
			$(".draw_turn").hide();
			GameData.bindDraw = true;
		}else{
			$(".draw_controller").fadeOut(100);
			$(".draw_turn").show();
			GameData.bindDraw = false;
		}
	}

	// 关键词、提示语显示
	function tipControl(word, flag){
		var tip1 = "游戏关键词：";
		var tip2 = "游戏提示：";
		var gameTip = $(".game_tip");
		setTimeout(_timer.tipTimer1);
		setTimeout(_timer.tipTimer2);
		if(flag){
			 tip1 += word[0];
			gameTip.text(tip1);
		}else{
			_timer.tipTimer1 = setTimeout(function(){
				tip2 += word[1];
				gameTip.text(tip2);
				playAudio(2);
			}, 10000);
			_timer.tipTimer2 = setTimeout(function(){
				tip2 += "、" + word[2];
				gameTip.text(tip2);
				playAudio(2);
			}, 20000);
		}
	}

	// 时间60s
	function timeControl(time){
		var countTime = time || 59,
			text = "";
		_timer.sixtyTimer = setInterval(function(){
			if(countTime < 10){
				text = "0" + countTime;
				playAudio(3);
			}else{
				text = "" + countTime;
			}
			$(".game_time").text(text);
			countTime--;

			if(countTime < 0){
				clearInterval(_timer.sixtyTimer);
				console.log("time up");
				countTime = 59;
			}
		}, 1000);
	}

	// 显示游戏结果
	function showAnswer(data){
		Draw.normalHandle.resetCanvas();	// 清空画布
		GameData.bindDraw = false;			// 停止绘画
		drawToolShow(false);				// 隐藏绘画工具
		clearInterval(_timer.sixtyTimer);
		$(".game_tip").text("游戏提示");
		$(".game_time").text("60");

		playAudio(5);
		setTimeout(function(){
			playAudio(6);
		}, 1400);

		console.log(data);

		// 显示结果界面
		var html = new EJS({url: "./views/tool.ejs"}).render({score: data});
		$(".canvas_container").append(html);
		
		// 倒计时关闭界面-5s
		var restTime = 4;
		_timer.toolTimer1 = setInterval(function(){
			$(".canvas_container .result_time_to_close").text("倒计时：" + restTime);
			restTime--;
		}, 1000);
		_timer.toolTimer2 = setTimeout(hideTool, 5000);
	}

	// 手动隐藏每局结果
	function hideTool(){
		$(".canvas_container .result").remove();
		clearInterval(_timer.toolTimer1);
		clearTimeout(_timer.toolTimer2);
		restTime = 4;
	}

	// 自动开始下一场
	function nextGame(data){
		normalGameStart(data);
		playAudio(7);
	}

	// 结束游戏
	function endGame(data){
		clearInterval(_timer.toolTimer1);
		clearTimeout(_timer.toolTimer2);
		clearTimeout(_timer.tipTimer1);
		clearTimeout(_timer.tipTimer2);
		clearInterval(_timer.sixtyTimer);

		playAudio(4);

		console.log(data);
		// 显示结果界面
		var html = new EJS({url: "./views/score.ejs"}).render({player: data});
		$("body").append(html);

		// 倒计时关闭界面-5s
		var restTime = 4;
		_timer.scoreTimer1 = setInterval(function(){
			$(".score_wrapper .score_time").text("倒计时：" + restTime);
			restTime--;
		}, 1000);
		_timer.scoreTimer2 = setTimeout(function(){
			$(".score_wrapper").remove();
			clearInterval(_timer.scoreTimer1);
			clearTimeout(_timer.scoreTimer2);
			restTime = 4;
		}, 5000);
	}

	// 开始游戏前显示房间信息
	function showRoom(list){
		var html = new EJS({url: "./views/room.ejs"}).render({user: list});
		$(".room_wrapper").remove();
		$(".canvas_container").append(html);
		$(".room_wrapper").fadeIn(200);
	}


	// 检测支持audio的格式
	function checkAudioCompat(){
        var myAudio = document.createElement('audio');
        var msg = "";   
        if (myAudio.canPlayType){
            // CanPlayType returns maybe, probably, or an empty string.
            var playMsg = myAudio.canPlayType('audio/mpeg');
            playMsg = myAudio.canPlayType('audio/ogg; codecs="vorbis"'); 
            if ("" != playMsg){
                return msg="ogg";                    
            }
            if ("" != playMsg){
                return msg="mp3";
            }
        }  
    }

    // 根据key播放声音
    function playAudio(i){
		try{
			// if(i != 3){
				$("body").find(".audio").eq(i).get(0).currentTime=0;
				$("body").find(".audio").eq(i).get(0).play();
			// }else{
				// var timer = 0;
				// $("body").find(".audio").eq(i).get(0).currentTime=0;
				// $("body").find(".audio").eq(i).get(0).play();

				// var Timer = setInterval(function(){
				// 	timer++;
				// 	console.log(timer);
				// 	$("body").find(".audio").eq(i).get(0).currentTime=0;
				// 	$("body").find(".audio").eq(i).get(0).play();
				// 	if(timer == 9){
				// 		clearInterval(Timer);
				// 	}
				// }, 1000);
			// }
		}catch(e){
			console.log(e);
		}
    }

	// 游戏音效
	function audioInit(){
		// 获取格式
		var audio_msg = checkAudioCompat(),
			audio = ["egg", "shoe", "flower", "time", "end", "score", "hand", "giveup", "right"];
		// 0-鸡蛋 1-拖鞋 2-鲜花 3-计时 4-结束 5-结果 6-掌声 7-放弃 8-答对
		var data = {
			type: audio_msg,
			audio: audio
		}
		var html = new EJS({url: "./views/audio.ejs"}).render({media: data});
		$("body").append(html);
	}

	function correctAnswer(){
		playAudio(8);
	}

	// 事件绑定初始化
	var eventInit = function(){
		// 点击开始游戏-每一局的入口
		$(".canvas_container").on("click", ".room_game_start", function(){
			socket.emit("start game", function(){
				// 回调函数-人数不足2人
				$(".room_game_start").text("人数不足").css("background", "#E7AB12");
				setTimeout(function(){
					$(".room_game_start").text("开始游戏").css("background", "#6e8a14");
				}, 2000);
			});
		});

		// 退出-右上角图标
		$(".exit").click(function(){
			if(confirm("确定离开房间？")){
				socket.emit("offline");
				$.removeCookie("nickname");
				$.removeCookie("avatorId");
				location.href = "http://127.0.0.1:3000/login";
			}
		});

		// 放弃绘画-手动结束游戏
		$(".give_up").click(function(){
			// socket.emit("next game");
			socket.emit("give up");
			// socket.emit("end once", GameData.drawer, GameData.word[0]);
			socket.emit("system message", $(".name").text()+"放弃绘画！", "focus");
		});


		// 道具点评
		// 0-鸡蛋 1-拖鞋 2-鲜花 3-计时 4-结束 5-结果 6-掌声 7-放弃 8-答对
		$(".canvas_container").on("click", ".result_flower", function(){
			socket.emit("score", {
				type: "flower",
				name: $(".name").text()
			});
		});
		$(".canvas_container").on("click", ".result_egg", function(){
			socket.emit("score", {
				type: "egg",
				name: $(".name").text()
			});
		});
		$(".canvas_container").on("click", ".result_shoe", function(){
			socket.emit("score", {
				type: "shoe",
				name: $(".name").text()
			});
		});

		$(".media li").each(function(i){
			$(this).click(function(){
				console.log(i);
				playAudio(i);
			});
		});
	}

	function test(){
		var html = new EJS({url: "./views/tool.ejs"}).render({score: {num: 1, word: "歪密"}});
		$(".canvas_container").append(html);
	}

	function flower(){
		hideTool();
		new Effect.Flower();
		playAudio(2);
	}

	function egg(){
		hideTool();
		new Effect.Egg();
		playAudio(0);
	}

	function shoe(){
		hideTool();
		new Effect.Shoe();
		playAudio(1);
	}


	var Main = {
		init: function(){
			eventInit();
			// test();
			audioInit();
		},
		startGame: startGame,	// 开始首场游戏
		showAnswer: showAnswer,	// 显示游戏结果
		nextGame: nextGame,		// 自动开始游戏
		endGame: endGame,
		GameData: GameData,
		showRoom: showRoom,
		correctAnswer: correctAnswer,
		flower: flower,
		egg: egg,
		shoe: shoe
	}

	module.exports = Main;
});