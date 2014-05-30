/*
 * @ 客户端入口文件
 * @ xuanfeng
 * @ 2013-04-04
 * */
define(function(require, exports, module){
	var $ = require("jquery"),
		Connect = require("connect");
		Draw = require("draw"),
		// Effect = require("effect"),
		Main = require("main"),
		EJS = require("ejs");

	exports.init = function(){
		Connect.listen();
		Draw.init();
		Main.init();
		// Effect.init();
	}
});