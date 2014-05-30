/*
 * @ 服务器controller控制层-业务逻辑
 * @ xuanfeng
 * @ 2013-04-19
 * 
 */


var config = require("./config");
var db = require("./dbdao");

// 显示所有玩家
exports.allgamers = function(req, res, next){
	db.allGamers(function(error, gamers){
		if(error){
			return next(error);
		}
		// 显示所有玩家
		// res.render("allgamers.html", {gamer: gamer});
	});
}

// 注册玩家
exports.new = function(req, res, next){
	var username = req.body.username || "";
	var password = req.body.password || "";
	var avatorId = req.body.avatorId || 1;
	var data = {
		username: username,
		password: password,
		avatorId: avatorId
	}
	db.add(data, function(error, row){
		if(error){
			return next(error);
		}
		res.redirect("/index");
	});
}


exports.view = function(req, res, next){
	res.redirect("/");
}

// 获取头像id
exports.getAvatorId = function(req, res, next){
	var nickname = req.body.nickname;
	db.getAvatorId(nickname, function(error, id){
		if(error){
			console.log("error: "+error);
		}else{
			res.send({
				"avatorId": id
			});
		}
	});
}

// 在线人数
exports.online = function(user, callback){
	var onlineList = [];
	for(var i=0; i<user.length; i++){
		db.online(user[i], function(error, data){
			onlineList.push(data);
			callback(onlineList);
		});
	}
}

// 注册
exports.join = function(req, res, next){
	var nickname = req.body.nickname;
	var password = req.body.password;
	var avatorId = req.body.avatorId;

	var data = {
		nickname: nickname,
		password: password,
		avatorId: avatorId
	}
	db.add(data, function(error, _password){
		if(error == "same"){
			res.send({
				type: "same name"
			});
		}else{
			res.send({
				type: "join suc"
			})
		}
	});
}


// 登陆
exports.login = function(req, res, next){
	var nickname = req.body.nickname;
	var password = req.body.password;
	var avatorId = req.body.avatorId;
	res.cookie("nickname", nickname);
	res.cookie("avatorId", avatorId);

	var data = {
		nickname: nickname,
		password: password,
		avatorId: avatorId
	}
	db.login(data, function(error, db_psw){
		if(error){
			console.log("error: "+ error);
		}else{
			if(password == db_psw){
				console.log("sssss")
				// res.send("../Client/views/index.html");
				res.redirect("/index");
			}else{
				res.send({
					type: "error psw"
				});
				return false;
			}
		}
	});
}
