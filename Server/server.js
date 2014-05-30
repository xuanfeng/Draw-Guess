/*
 * @ “你画我猜”服务器
 * @ xuanfeng
 * @ 2013-04-19
 * 
 */

//1. 变量定义

// mudules引入
var express = require("express"),
	sio = require("socket.io"),
	fs = require("fs"),
	path = require("path"),
	url = require("url"),
	parseCookie = require("connect").utils.parseCookie,
	MemoryStore = require("connect/middleware/session/memory");

// 私人聊天使用session
var usersWS = {},  //私人聊天用的websocket
	storeMemory = new MemoryStore({
		reapInterval: 60000*10 
	}); //session store


// 2. app配置
var app = module.export = express.createServer();

app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({
		secret: 'xuanfeng',
		store: storeMemory 
	}));
	app.use(express.methodOverride());
	app.use(app.router);	//处理post
	app.set('views', __dirname + '/../Client');
	app.set('view engine', 'jade');
	app.use(express.static(__dirname + '/../Client'));
});


// 3. 配置socket.io
var io = sio.listen(app);
//设置session
io.set('authorization', function(handshakeData, callback){
	// 通过客户端的cookie字符串来获取其session数据
	handshakeData.cookie = parseCookie(handshakeData.headers.cookie)
	var connect_sid = handshakeData.cookie['connect.sid'];
	
	if (connect_sid) {
		storeMemory.get(connect_sid, function(error, session){
			if (error) {
				// if we cannot grab a session, turn down the connection
				callback(error.message, false);
			}
			else {
				// save the session data and accept the connection
				handshakeData.session = session;
				callback(null, true);
			}
		});
	}
	else {
		callback('nosession');
	}
});


// 3. URL 
/**
 * url处理
 * @param {Object} req
 * @param {Object} res
 */
app.get("/", function(req, res){
	console.log(req.session.name)
 	if(req.session.name && req.session.name!==""){
 		// 已登录，跳转至主页
 		res.redict("/index")
 	}else{
 		// 未登录，跳转至登陆页
 		var loginPath = __dirname + "/../Client/" + url.parse("login.html").pathname;
 		var loginTxt = fs.readFileSync(loginPath);
 		res.end(loginTxt);
 	}
});

app.get("/index", function(req, res){
	console.log(req.session.name)
	if(req.session.name && req.session.name!==""){
		// res.render("index", {name: req.session.name});
		var indexPath = __dirname + "/../Client/" + url.parse("index.html").pathname;
 		var indexTxt = fs.readFileSync(indexPath);
 		res.end(indexTxt);
	}else{
		res.redict("/");
	}
});

app.post("/index", function(req, res){
	var avatorId = req.body.avatorId,
		nickname = req.body.nickname,
		password = req.body.password;

	
	if(nickname && nickname!==""){
		req.session.name = nickname;	//设置session
		req.session.avatorId = avatorId;	//设置session
		console.log(req.session.name+"--------------")
		console.log(req.session.avatorId+"--------------")
		// res.render("index", {nickname: nickname});
		var indexPath = __dirname + "/../Client/" + url.parse("index.html").pathname;
 		var indexTxt = fs.readFileSync(indexPath);
 		res.end(indexTxt);
	}else{
		res.end("昵称不能为空");
	}
});


//===================socket链接监听=================
/**
 * 开始socket链接监听
 * @param {Object} socket
 */
io.sockets.on('connection', function (socket){
	var session = socket.handshake.session;  //session
	var name = session.name;
	usersWS[name] = socket;

	console.log("connect------------success+++++++++")
	console.log(session+"-----------------session")
	console.log(name+"----------------name")
	console.log(session.avatorId+"----------------id")


	// 登录时系统发送消息-在线人数
	function getOnline(){
		var allUser = [];
		for (var i in usersWS){
			allUser.push(i);
		}
		io.sockets.emit('online list', allUser);  //所有人广播
	}
	getOnline();

	// 登录时返回玩家数据
	function getPlayer(){
		console.log("id"+session.avatorId)
		var data = {"name": name, "avatorId": session.avatorId};
		usersWS[name].emit("player data", data);
	}
	getPlayer();
	
	// 系统提示登录通知
	socket.broadcast.emit('system message', '【'+name + '】已进入房间~', 'add');
	
	//公共信息
	socket.on('public message', function(msg, fn){
		socket.broadcast.emit('public message', name, msg);
		fn(true);
	});

	//私人@信息
	socket.on('private message',function(to, avatorId, msg, fn){
		var target = usersWS[to];
		if (target) {
			fn(true);
			target.emit('private message', name+'[私信]', avatorId, msg);
		}
		else {
			fn(false)
			socket.emit('message error', to, msg);
		}
	});
	
	//掉线，断开链接处理
	socket.on('disconnect', function(){
		delete usersWS[name];
		session = null;
		socket.broadcast.emit('system message', '【'+name + '】已经掉线', "sub");
		getOnline();
	});
	
});

// 开始监听
app.listen(3000, function(){
	var address = app.address();
	console.log("Draw&Guess listening on http://127.0.0.1:"+ address.port);
});