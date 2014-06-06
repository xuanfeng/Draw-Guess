// “你画我猜”服务器

// 1. 变量定义
// modules引入
var express = require("express"),
	routers = require("./routers"),
	config = require("./config"),
	gameWord = require("./gameWord"),
	http = require("http"),
	path = require("path"),
	game = require("./controller"),
	gameDao = require("./dbdao");

var app = express(),
	server = http.createServer(app),
	io = require("socket.io").listen(server, {log: true});

var clients = [],	//所有用户，包括自己
	users = [];		//在线用户

var name = "",
	avatorId = 0;


// 服务器游戏变量
var GameVariable = {
	error: false,	//是否出错
	start: false,	//是否已经开始游戏
	word: [],		//关键词、提示语
	drawer: "",		//当前绘画者
	correctGuess: 0,//答对人数
	lastOne: false,	//最后一个玩家
	endScore: []	//数据格式-二维数组[name, avatorId, word, flower, egg, shoe, me]
}

var _timer = {
	sixtyTimer: null
}


// 2. app配置
app.configure(function(){
	app.set("port", config.port || 3000);
	app.set("views", __dirname + "../Client/views");
	app.set("view engine", "ejs");

	app.use(express.favicon());
	app.use(express.logger("dev"));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.methodOverride());
	app.use(app.router);	// 处理post
	app.use(express.static(path.join(__dirname, "/../Client")));
});


// 3. socket链接监听
io.sockets.on("connection", function(socket){

	// 用户上线
	socket.on("online", function(data){
		var data = JSON.parse(data);
		name = data.nickname;
		avatorId = data.avatorId;


		// 新上线用户，需要发送用户上线提醒，需要向客户端发送新的用户列表
		users.push(data.nickname);

		// 计分初始化
		GameVariable.endScore.push([name, avatorId, 0, 0, 0, 0, 0]);

		// socket设置
		clients[data.nickname] = socket;

		// 上线信息发送
		socket.broadcast.emit("system message", "【" + name + "】已经进入房间", "add");
		
		// 有新用户上线时更新房间信息、返回玩家数据
		getOnline();
		getPlayer();

		// 可能属于页面刷新重登
		// 清空服务器计时60s
		clearTimeout(_timer.sixtyTimer);
	});

	// 获取在线玩家数据
	function getOnline(){
		game.online(users, function(list){
			for(var index in clients){
				clients[index].emit("online list", list);
				clients[index].emit("room member", list);
			}
		});
	}

	// 登录时返回玩家数据
	function getPlayer(){
		var data = {"name": name, "avatorId": avatorId};
		clients[name].emit("player data", data);
	}
	

	//公共信息
	socket.on("public message", function(avatorId, name, msg, callback){
		callback(true);  // 回调函数

		if(msg != GameVariable.word[0]){
			// 向其他人发消息，除了自己
			socket.broadcast.emit("public message", avatorId, name, msg);
		}else{
			msg = "恭喜" + name + "猜对正确答案！";
			GameVariable.correctGuess++;

			// 积分统计
			scoreCount({
				type: "word",
				name: name,
				avatorId: avatorId
			});

			// 向全部人发消息，包括自己
			for(var index in clients){
				clients[index].emit("correct answer", name, msg);
			}
			// 全部答对-小局结束
			if(GameVariable.correctGuess == users.length-1){
				console.log("全部答对啊啊啊啊啊");
				scoreSend();
				// 开始游戏-自动开始
				setTimeout(function(){
					startGame("next game");
				}, 5000);
				
				GameVariable.correctGuess = 0;
			}
		}
	});

	//私人@信息
	socket.on("private message",function(to, avatorId, msg, callback){
		var target = clients[to];
		if (target) {
			target.emit("private message", name+"[私信]", avatorId, msg);
			callback(true);
		}
		else {
			socket.emit("message error", to, msg);
			callback(false);
		}
	});

	// 系统消息
	socket.on("system message", function(msg, detail){
		for(var index in clients){
			clients[index].emit("system message", msg, detail);
		}
	});

	// 手动下线
	socket.on("offline", function(user){
		socket.disconnect();
	});

	// 下线
	socket.on("disconnect", function(){
		console.log("disconnect");
		setTimeout(function(){
			for(var index in clients){
				if(clients[index] == socket){
					// 下线事删除其积分
					var gameScore = GameVariable.endScore;
					for(var i=0; i<gameScore.length; i++){
						if(index == gameScore[i][0]){
							GameVariable.endScore.splice(i, 1);
							break;
						}
					}

					// 删除下线用户
					users.splice(users.indexOf(index), 1);

					// 删除下线socket
					delete clients[index];
					socket.broadcast.emit("system message", "【"+name + "】已经掉线", "sub");
					game.online(users, function(list){
						for(var index_online in clients){
							clients[index_online].emit("online list", JSON.stringify(list));
							clients[index_online].emit("room member", JSON.stringify(list));
						}
						
					});
					break;
				}
			}
		}, 100);
	});



	// 绘画
	socket.on("graphType", function(type){
		for(var index in clients){
			clients[index].emit("graphType", type);
		}
	});
	socket.on("graphData", function(data){
		for(var index in clients){
			clients[index].emit("graphData", data);
		}
	});
	socket.on("graphHandle", function(data){
		for(var index in clients){
			clients[index].emit("graphHandle", data);
		}
	});
	socket.on("graphCmd", function(cmd){
		for(var index in clients){
			clients[index].emit("graphCmd", cmd);
		}
	});


	// 主游戏逻辑 

	// 开始游戏-第一场
	socket.on("start game", function(callback){
		if(users.length == 1){
			callback();
			return false;
		}
		// callback();
		startGame("start game");
	});


	// 每局开场数据组装后发送
	function startGame(method){
		// 第一场开始或自动开始
		var _method = method || "next game";
		var data = dataBuild();
		if(method == "start game"){
			GameVariable.lastOne = false;
		}

		if(!GameVariable.lastOne){
			// 不是最后一名玩家
			for(var index in clients){
				clients[index].emit(_method, data);
			}
		}else{
			// 已经结束-最后一名玩家绘制完成
			GameVariable.start = false;
			// setTimeout(function(){
				// 显示积分榜
				for(var index in clients){
					clients[index].emit("end game", GameVariable.endScore);
				}
				// 积分重计
				for(var i=0; i<GameVariable.endScore.length; i++){
					GameVariable.endScore[i].splice(2, 4, 0, 0, 0, 0, 0);
				}
				// 数值初始化
				extend(GameVariable, {
					error: false,
					start: false,
					word: [],
					drawer: "",
					correctGuess: 0,
					lastOne: false
				});

				// 清空服务器计时60s
				clearTimeout(_timer.sixtyTimer);
			// }, 5000);
			setTimeout(function(){
				// 显示房间信息-5s
				getOnline();
			}, 5000);
		}
		// 清空服务器计时60s
		clearTimeout(_timer.sixtyTimer);
		_timer.sixtyTimer = setTimeout(function(){
			// 返回小局比赛结果
			scoreSend();
			// 自动开始下一局游戏
			setTimeout(function(){
				startGame("next game");
			}, 5000);
		}, 60000);
	}

	// 每场数据组装
	function dataBuild(){
		GameVariable.start = true;
		GameVariable.word = getWord();
		console.log("当前绘画者drawer "+GameVariable.drawer);
		console.log("当前在线人数drawer "+users.length);
		console.log("第一个usres[0]"+users);

		// 当前绘画者
		if(GameVariable.drawer == ""){
			// 第一名玩家
			GameVariable.drawer = users[0];
			console.log("第一名绘画者-----------"+GameVariable.drawer);
		}else{
			console.log("其他局当前绘画者currentDrawer:"+GameVariable.drawer);
			var currentDrawer = GameVariable.drawer;
			for(var i=0; i<users.length; i++){
				if(currentDrawer == users[i] && i != users.length-1){
					console.log("下一个绘画者usres[i+1]"+users[i+1]);
					GameVariable.drawer = users[i+1];
					break;
				}
				if(i == users.length-1){
					console.log("最后一名绘画者绘画完成")
					GameVariable.lastOne = true;
					break;
				}
			}
		}
		console.log("继续开局-------------------------")
		console.log(GameVariable)
		return GameVariable;
	}

	// 获取随机关键词
	function getWord(){
		var pos = Math.floor(Math.random() * gameWord.word.length);
		return gameWord.word[pos];
	}



	// 下一局游戏
	socket.on("next game", function(){
		// 返回小局比赛结果 - show answer
		scoreSend();
		// 自动开始下一局游戏
		setTimeout(function(){
			startGame("next game");
		}, 5100);
	});

	// 每局成绩发送
	function scoreSend(){
		var pos = 0;
		for(var i=0; i<GameVariable.endScore.length; i++){
			if(GameVariable.drawer == GameVariable.endScore[i][0]){
				pos = i;
				break;
			}
		}

		var scoreData = {
			num: GameVariable.endScore[pos][2],
			word: GameVariable.word[0]
		}
		console.log(GameVariable.endScore);
		for(var index in clients){
			clients[index].emit("show answer", scoreData);
		}
		// 清空服务器计时60s
		clearTimeout(_timer.sixtyTimer);
	}

	// 手动结束游戏-放弃绘画
	socket.on("give up", function(){
		// 返回小局比赛结果 - show answer
		scoreSend();
		// 自动开始下一局游戏
		setTimeout(function(){
			startGame("next game");
		}, 5100);
		// 清空服务器计时60s
		clearTimeout(_timer.sixtyTimer);
	});

	// 积分统计-回答正确
	socket.on("score", function(data){
		scoreCount(data);
	});

	function toolSend(type){
		for(var index in clients){
			clients[index].emit(type, name);
		}
	}

	function scoreCount(data){
		var drawer = GameVariable.drawer;	//正在绘画者
		console.log("分数统计：drawer "+drawer);
		console.log("分数统计：name "+data.name);
		
		// 分析得分类型
		var type = 2;
		switch(data.type){
			case "word": 	//别人答对
				type = 2;
				break;
			case "flower": 	//鲜花
				type = 3;
				toolSend("flower", data.name);
				break;
			case "egg": 	//鸡蛋
				type = 4;
				toolSend("egg", data.name);
				break;
			case "shoe": 	//拖鞋
				type = 5;
				toolSend("shoe", data.name);
				break;
			case "me": 		//自己答对-其他人的绘画
				type = 6;
				break;
			default:
				type = 2;
				break;
		}

		for(var i=0; i<GameVariable.endScore.length; i++){
			// 答对者加分-别人
			if(data.name == GameVariable.endScore[i][0]){
				console.log("for循环里面"+GameVariable.endScore[i][0]);
				GameVariable.endScore[i][6] += 1;
				continue;
			}
			// 绘画者加分-自己
			if(drawer == GameVariable.endScore[i][0]){
				GameVariable.endScore[i][type] += 1;
				continue;
			}
		}

		console.log("分数！！！！！！！！！！！- "+GameVariable.endScore);
	}

	// 对象扩展
	var extend = (function(){	//将这个函数的返回值赋值给extend
		// 在修复它之前，首先检查是否存在bug
		for(var p in {toString: null}){
			return function extend(o){
				// 如果代码执行到这里，那么for/in循环会正确工作并返回
				// 一个简单版本的extend()函数
				for (var i=1; i<arguments.length; i++){
					var source =arguments[i];
					for(var prop in source) o[prop] = source[prop];
				}
				return o;
			};
		}
		// 如果代码执行到这里，说明for/in循环不会枚举测试对象的toString属性
		// 因此返回另一个版本的extend()函数，这个函数显式测试
		// Object.prototype中的不可枚举属性
		return function patched_extend(o){
			for(var i=1; i<arguments.length; i++){
				var source = arguments[i];
				// 复制所有的可枚举属性
				for(var prop in source) o[prop] = source[prop];
	 
				// 现在检查特殊属性
				for(var j=0; j<protoprops.length; j++){
					prop = protoprops[j];
					if(source.hasOwnProperty(prop)) o[prop] = source[prop];
				}
			}
			return o;
		};
		// 这个列表列出了需要检查的特殊属性
		var protoprops = ["toString", "valueOf", "constructor", "hasOwnProperty", 
				  "isPrototypeOf", "propertyIsEnumerable", "toLocaleString"];
	}());

});


// 4. URL处理
app.get("/", function(req, res){
	if(!req.headers.cookie){
		res.redirect("/login");
		return false;
	}
	console.log(req.headers.cookie)

	var cookies = req.headers.cookie.split("; ");
	var isSign = false;
	for(var i=0; i<cookies.length; i++){
		cookie = cookies[i].split("=");
		console.log(cookie[i]);
		if(cookie[0]=="nickname" && cookie[1]!=""){
			isSign = true;
			break;
		}
	}
	if(!isSign){
		res.redirect("/login");
		return false;
	}
	res.redirect("/index");
});

app.get("/index", function(req, res){
	if(!req.headers.cookie){
		res.redirect("/login");
		return false;
	}

	var cookies = req.headers.cookie.split("; ");
	var isSign = false;
	for(var i=0; i<cookies.length; i++){
		cookie = cookies[i].split("=");
		if(cookie[0]=="nickname" && cookie[1]!=""){
			isSign = true;
			break;
		}
	}
	if(!isSign){
		res.redirect("/login");
		return false;
	}
	res.sendfile(path.resolve("../Client/views/index.html"));	
});

app.get("/login", function(req, res){
	res.sendfile(path.resolve("../Client/views/login.html"));
});

// 提交登陆表单
app.post("/login", game.login);
app.post("/join", game.join);

// 输入昵称获取头像
app.post("/getAvatorId", game.getAvatorId);


gameDao.connect(function(error){
	if(error) throw error;
});

app.on("close", function(error){
	gameDao.disconnect(function(err){});
});




// 5. 监听
server.listen(app.get("port"), function(){
	console.log("Express server listening on port " + app.get("port"));
});


