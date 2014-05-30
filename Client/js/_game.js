var gameTime = $(".game_time"),
	gameTip = $(".game_tip");


// 游戏流程

// 时间控制
/*
 * 45s
*/

function timeControl(){
	var timer = null,
		countTime = 49,
		text;
	timer = setInterval(function(){
		if(countTime < 10){
			text = "0" + countTime;
		}else{
			text = "" + countTime;
		}
		gameTime.text(text);
		countTime--;

		if(countTime < 0){
			clearInterval(timer);
			console.log("time up")
		}
	}, 1000);
}

timeControl();


// 提示控制
function tipControl(data){
	var tip = "<span class='game_tip_title'>游戏提示：</span>" + data[0],
		tipTimer = null;
	gameTip.html(tip);
	// debugger;
	setTimeout(function(){
		tip += "、" +data[1];
		gameTip.html(tip);
	}, 10000);
	setTimeout(function(){
		tip += "、" +data[2];
		gameTip.html(tip);
	}, 20000);
}

var tip = ["动物", "角", "草"];
tipControl(tip);