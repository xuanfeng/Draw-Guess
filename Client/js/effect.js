/*
 * @ 道具点评特效
 * @ xuanfeng
 * @ 2013-04-19
 * 
 */

define(function(require, exports, module){
	var $ = require("jquery");
	// 拖鞋
	function Shoe(){
		var _this = this,
			conWidth = $(".canvas_container").width(),
			conHeight = $(".canvas_container").height(),
			shoeTpl = '<div class="s_shoe_wrapper"><div class="front_shoe icon"></div><div class="back_shoe icon"></div></div><div class="s_shoe_shadow icon"></div>';

		this.shoe$ = $('<div class="s_shoe"></div>').append(shoeTpl)
		$(".canvas_container").append(this.shoe$);
		this.x = conWidth/2 - 90/2 + 210 - parseInt(Math.random()*420);
		this.y = conHeight/2 - 200/2 + 130 - parseInt(Math.random()*260);
		this.shoeMove();
		
		setTimeout(function(){
			_this.shoeShadow();
		}, 1000);
	}

	Shoe.prototype.shoeMove = function(){
		var _this = this;
		_this.shoe$.fadeIn(100, function(){
			_this.shoe$.css({
				left: _this.x,
				top: _this.y
			});
		}).find(".s_shoe_wrapper").addClass('flipIt');
	}

	Shoe.prototype.shoeShadow = function(){
		var _this = this;
		this.shoe$.find(".s_shoe_shadow").show();
		this.shoe$.find(".s_shoe_wrapper").animate({
			top: "50px"
		}, 600, function(){
			_this.shoe$.fadeOut(100, function(){
				_this.shoe$.remove();
			});
		});
	}


	// 鲜花
	function Flower(){
		var _this = this,
			conWidth = $(".canvas_container").width(),
			conHeight = $(".canvas_container").height(),
			$flower = $('<div class="s_flower icon"></div>');
		this.x = conWidth/2 - 60/2 + 210 - parseInt(Math.random()*420);
		this.y = conHeight/2 - 120/2 + 130 - parseInt(Math.random()*260);

		$flower.css({
			left: _this.x,
			top: _this.y
		});
		$(".canvas_container").append($flower);
		setTimeout(function(){
			$flower.remove();
		}, 1600)
	}


	// 鸡蛋
	function Egg(){
		var _this = this,
			conWidth = $(".canvas_container").width(),
			conHeight = $(".canvas_container").height(),
			eggTpl = '<div class="s_egg_wrapper"><div class="front_egg icon"></div><div class="back_egg icon"></div></div><div class="s_egg_shadow icon"><div class="s_egg_boom icon"></div></div>';

		this.egg$ = $('<div class="s_egg"></div>').append(eggTpl)
		$(".canvas_container").append(this.egg$);
		this.x = conWidth/2 - 100/2 + 200 - parseInt(Math.random()*400);
		this.y = conHeight/2 - 120/2 + 80 - parseInt(Math.random()*200);
		
		this.eggMove();
		setTimeout(function(){
			_this.eggShadow();
		}, 1000);
	}

	Egg.prototype.eggMove = function(){
		var _this = this;
		_this.egg$.fadeIn(100, function(){
			_this.egg$.css({
				left: _this.x,
				top: _this.y
			});
		}).find(".s_egg_wrapper").addClass('flipIt');
	}

	Egg.prototype.eggShadow = function(){
		var _this = this;
		this.egg$.find(".s_egg_wrapper").hide();
		this.egg$.find(".s_egg_shadow").show();
		this.egg$.find(".s_egg_boom").animate({
			top: "40px"
		}, 600, function(){
			_this.egg$.fadeOut(100, function(){
				_this.egg$.remove();
			});
		});
	}
	
	module.exports = {
		Flower: Flower,
		Egg: Egg,
		Shoe: Shoe
	}

});