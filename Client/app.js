define(function(require, exports, module){
	var $ = require("jquery"),
		Connect = require("connect");

	exports.init = function(){
		Connect.listen();
	}
});