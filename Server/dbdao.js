var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var dburl = require("./config").db;	//获取数据库地址

exports.connect = function(){
	mongoose.connect(dburl);
}

exports.disconnect = function(callback){
	mongoose.disconnect(callback);
}

exports.setup = function(callback){
	callback(null);
}

// 定义game对象模型
var GamerSchema = new Schema({
	// id: {					//玩家id
	// 	type: Number,
	// 	min: 1000
	// },
	nickname: String,		//用户名
	password: String,		//密码
	avatorId: {			//头像id
		type: Number,
		default: 1
	},
	createData: Date,		//创建日期
	modifydate: {			//修改日期
		type: Date,
		default: Date.now()
	},
	score: {				//游戏分数
		type: Number,
		default: 0
	},
	gameCount: Number		//游戏次数
});


// 访问game对象模型
// mongoose.model("Gamer", GamerSchema);
// var Gamer = mongoose.model("Gamer");
var GamerModel = mongoose.model("Gamer", GamerSchema);
var GamerEntity = new GamerModel();

// 空数据
exports.emptyData = {}

// 添加用户
exports.add = function(data, callback){
	GamerEntity.nickname = data.nickname;
	GamerEntity.password = data.password;
	GamerEntity.avatorId = data.avatorId;

	// 是否已经有人注册-不能同名
	exports.findByNickname(data.nickname, function(error, gamer){
	    if(error){
	    	console.log(error);
	    }else{
	    	if(!gamer){
	    		GamerEntity.save(function(error){
					if(error){
						console.log("数据添加出错" + error);
					}else{
						console.log("0000000000000")
						console.log(GamerEntity.nickname)
						console.log(GamerEntity.password)
						console.log(GamerEntity.avatorId)
						callback(null);
					}
				});
	    	}else{
	    		// 重名
	    		callback("same");
	    	}
	    }
	});
	
}

// 获取头像id
exports.getAvatorId = function(nickname, callback){
	exports.findByNickname(nickname, function(error, gamer){
	    if(error) {
	        // console.log("FATAL " + error);
	        callback("error", error);
	    } else {
	    	// console.log("id"+gamer);
	    	callback(null, gamer.avatorId)
	    }
	});
}
exports.online = function(nickname, callback){
	exports.findByNickname(nickname, function(error, gamer){
	    if(error) {
	        callback("error", error);
	    } else {
	    	callback(null, {
	    		avatorId: gamer.avatorId,
	    		nickname: gamer.nickname,
	    		score: gamer.score
	    	});
	    }
	});
}


// 登陆验证
exports.login = function(data, callback){
	exports.findByNickname(data.nickname, function(error, gamer){
	    if(error) {
	        console.log("FATAL " + error);
	        callback("error", error);
	    } else {
	    	console.log(gamer);
	    	callback(null, gamer.password);
	    }
	});
}

// 删除用户
exports.delete = function(id, callback){
	exports.findGamerById(id, function(error, gamer){
		if(error){
			callback(error)
		}else{
			console.log("delete success");
			gamer.remove();
			callback(null);
		}
	});
}

// 保存分数
exports.saveScore = function(id, score, callback){
	exports.findGamerById(id, function(error, gamer){
		if(error){
			callback(error);
		}else{
			gamer.modifydate = new Date();
			gamer.score = score;
			gamer.save(function(error){
				if(error){
					console.log("FATAL " + error);
					callback(error);
				}else{
					callback(null);
				}
			});
		}
	})
}


// 列出所有玩家
exports.allGamers = function(callback){
	GamerModel.find({}, callback);
}


// 
var findGamerById = exports.findGamerById = function(id, callback){
    GamerModel.findOne({_id: id}, function(error, gamer){
        if(error){
            console.log('FATAL ' + error);
            callback(error, null);
        }
        callback(null, gamer);
    });
}

// 通过名称查找数据
exports.findByNickname = function(nickname, callback) {
    GamerModel.findOne({nickname: nickname}, function(error, gamer){
        if(error){
            console.log('FATAL ' + error);
            callback(error, null);
        }
        callback(null, gamer);
    });
}