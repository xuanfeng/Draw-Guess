/*
 * @ 绘画操作
 * @ xuanfeng
 * @ 2013-04-19
 * 
 */

define(function(require, exports, module){
	var $ =require("jquery"),
		io = require("socket"),
		JSON = require("json2"),
		socket = io.connect(),
		Main = require("main"),
		bigColorpicker = require("jquery.bigcolorpicker");
	
	// 绘图数据
	var Data = {
		color: "#000000",
		size: 1,
		graphType: "pencil",	//初始画笔工具

		x: 0,
		y: 0,

		canvas: $("#canvas")[0],
		context: null,
		canvas_bak: $("#canvas_bak")[0],
		context_bak: null,

		canvasWidth: 840,
		canvasHeight: 540,
		
		startX: 0,				//鼠标按下坐标
		startY: 0,				//鼠标按下坐标

		canDraw: false,			//是否可绘制

		cancelIndex: null,		//撤销的次数
		cancelList: ["data:image/png;base64,"]		//撤销步骤图像保存
	}


	//初始化
	var initCanvas = function(){

		Data.canvas.width = Data.canvasWidth;
		Data.canvas.height = Data.canvasHeight;
		Data.context = Data.canvas.getContext("2d");

		Data.canvasTop = $(Data.canvas).offset().top;
		Data.canvasLeft = $(Data.canvas).offset().left;

		Data.canvas_bak.width = Data.canvasWidth;
		Data.canvas_bak.height = Data.canvasHeight;
		Data.context_bak = Data.canvas_bak.getContext("2d");		

		//把蒙版放于画板上面。先画在蒙版上 再复制到画布上
		$(Data.canvas_bak).css("z-index", 1);
	}
	
	// 绑定绘画板工具
	var bindDraw = function(){

		// 铅笔
		$(".draw_tool .pencil").on("click", function(){
			if(Main.GameData.bindDraw){
				socket.emit("graphType", "pencil");
			}
		});
		// 涂鸦
		$(".draw_tool .handwriting").on("click", function(){
			if(Main.GameData.bindDraw){
				socket.emit("graphType", "handwriting");
			}
		});
		// 画笔大小
		$(".draw_tool .showLine").on("click", function(){
			if(Main.GameData.bindDraw){
				normalHandle.showLineSize(this);
			}
		});
		// 橡皮擦
		$(".draw_tool .rubber").on("click", function(){
			if(Main.GameData.bindDraw){
				socket.emit("graphType", "rubber");
			}
		});
		// 直线
		$(".draw_tool .line").on("click", function(){
			if(Main.GameData.bindDraw){
				socket.emit("graphType", "line");
			}
		});
		// 方形
		$(".draw_tool .square").on("click", function(){
			if(Main.GameData.bindDraw){
				socket.emit("graphType", "square");
			}
		});
		// 圆形
		$(".draw_tool .circle").on("click", function(){
			if(Main.GameData.bindDraw){
				socket.emit("graphType", "circle");
			}
		});
		// 填充
		$(".draw_tool .fill").on("click", function(){
			if(Main.GameData.bindDraw){
				socket.emit("graphCmd", "fill");
			}
		});
		// 撤销
		$(".draw_tool .cancel").on("click", function(){
			if(Main.GameData.bindDraw){
				socket.emit("graphCmd", "cancel");
			}
		});
		// 恢复
		$(".draw_tool .next").on("click", function(){
			if(Main.GameData.bindDraw){
				socket.emit("graphCmd", "next");
			}
		});
		// 清空
		$(".draw_tool .clearContext").on("click", function(){
			if(Main.GameData.bindDraw){
				socket.emit("graphCmd", "clearContext");
			}
		});
		// 下载
		$(".draw_tool .downloadImage").on("click", function(){
			if(Main.GameData.bindDraw){
				normalHandle.downloadImage();
			}
		});


		// 初始化铅笔工具
		// $(".draw_controller li:first").click();

		// 选择线条大小
		$(".line_size li").click(function(){
			if(Main.GameData.bindDraw){
				iSize = $(this).find("button").data("value");
				socket.emit("graphData",{
					name: "size",
					value: iSize
				});
				$("#line_size").hide();
				$(this).find("button").addClass("selected").end().siblings("li").find("button").removeClass("selected");
			}
		});

		// 隐藏线条宽度板
		$(".draw_tool .linesize").hover(function(){
			normalHandle.showLineSize($(this)[0]);
		},function(){
			// 延迟隐藏
			var timer = setTimeout(function(){
				$(".line_size").fadeOut(200);
			},100);
			$(".line_size").hover(function(){
				$(".line_size").show();
				clearTimeout(timer);
			},function(){
				$(".line_size").fadeOut(200);
			});
		});

		//选择颜色
		$(".draw_tool .showColor").bigColorpicker(function(el, icolor){
			socket.emit("graphData", {
				name: "color",
				value: icolor
			});
		});
		// 初始化颜色面板插件
		$("#f333").bigColorpicker("f3", "L", 6);

		// 画布绘画事件绑定
		$(Data.canvas_bak)
			.off()
			.on("mousedown", function(e){
				if(Main.GameData.bindDraw){
					drawHandleSend.mousedown(e);
				}
			}).on("mousemove", function(e){
				if(Main.GameData.bindDraw){
					drawHandleSend.mousemove(e);
				}
			}).on("mouseup", function(e){
				if(Main.GameData.bindDraw){
					drawHandleSend.mouseup(e);
				}
			}).on("mouseout", function(e){
				if(Main.GameData.bindDraw){
					drawHandleSend.mouseout(e);
				}
			});
	}



	// 发送数据
	var drawHandleSend = {

		// 鼠标按下-发送坐标
		mousedown: function(e){
			var scrollTop = $(window).scrollTop(),
				scrollLeft = $(window).scrollLeft(),
				canvasTop = $(Data.canvas).offset().top - scrollTop,
				canvasLeft = $(Data.canvas).offset().left - scrollLeft;

			// 相对于画布左上角的坐标
			var X = e.clientX - canvasLeft,
				Y = e.clientY - canvasTop;

			socket.emit("graphHandle", {
				type: "mousedown",
				x: X,
				y: Y
			});

			// 阻止点击时的cursor的变化，draw
			e = e || window.event;
			e.preventDefault();
		},

		// 鼠标移动-发送坐标
		mousemove: function(e){
			// 加上判断防止在没mousedown时，乱发坐标。只有橡皮擦、圆形、涂鸦需要坐标，不画的时候会有对应图形提示。
			if(Data.canDraw || Data.graphType=="rubber" || Data.graphType=="circle" || Data.graphType=="handwriting"){
				var scrollTop = $(window).scrollTop(),
					scrollLeft = $(window).scrollLeft(),
					canvasTop = $(Data.canvas).offset().top - scrollTop,
					canvasLeft = $(Data.canvas).offset().left - scrollLeft;

				// 相对于画布左上角的坐标
				var X = e.clientX - canvasLeft,
					Y = e.clientY - canvasTop;

				socket.emit("graphHandle", {
					type: "mousemove",
					x: X,
					y: Y
				});
			}
		},

		// 鼠标抬起-发送坐标，结束绘制
		mouseup: function(e){
			socket.emit("graphHandle", {
				type: "mouseup",
				x: e.clientX,
				y: e.clientY
			});
		},

		// 鼠标移出画板-用于涂鸦
		mouseout: function(){
			socket.emit("graphHandle", {
				type: "mouseout"
			});
		}
	}


	// 接收数据
	var drawHandleRecive = {

		// 鼠标按下获取 根据xy坐标画图
		mousedown: function(graphHandleData){

			var x = graphHandleData.x,
				y = graphHandleData.y;

			// 记录按下坐标，mousemove需要使用
			Data.startX = x;
			Data.startY = y;

			Data.context.strokeStyle = Data.color;
			Data.context_bak.strokeStyle = Data.color;
			Data.context_bak.lineWidth = Data.size;
			Data.context_bak.moveTo(x, y);

			Data.canDraw = true;			
			
			// 绘制
			if(Data.graphType == "pencil"){
				Data.context_bak.beginPath();
			}else if(Data.graphType == "circle"){
				Data.context.beginPath();
				Data.context.moveTo(x, y);
				Data.context.lineTo(x+1, y+1);
				Data.context.stroke();	
			}else if(Data.graphType == "rubber"){							
				Data.context.clearRect(x - Data.size*10, y - Data.size*10, Data.size*20, Data.size*20);				
			}	
		},


		// 鼠标移动
		mousemove: function(graphHandleData){

			var x = graphHandleData.x,
				y = graphHandleData.y;

			// 画笔
			if(Data.graphType == "pencil"){
				if(Data.canDraw){
					Data.context_bak.lineTo(x, y);
					Data.context_bak.stroke();						
				}
			//涂鸦 未画得时候，出现一个小圆
			}else if(Data.graphType == "handwriting"){											
				if(Data.canDraw){
					// 鼠标点击移动产生的圆圈
					Data.context_bak.beginPath();	
					Data.context_bak.strokeStyle = Data.color;
					Data.context_bak.fillStyle  = Data.color;
					Data.context_bak.arc(x, y, Data.size*10, 0, Math.PI*2, false);		
					Data.context_bak.fill();
					Data.context_bak.stroke();
					Data.context_bak.restore();
				}else{
					normalHandle.clearContext();
					// 未mousedown，跟随鼠标的模拟圆圈
					Data.context_bak.beginPath();		
					Data.context_bak.strokeStyle = Data.color;			
					Data.context_bak.fillStyle  = Data.color;
					Data.context_bak.arc(x, y, Data.size*10, 0, Math.PI*2, false);
					Data.context_bak.fill();
					Data.context_bak.stroke();
				}
			//橡皮擦 未画的时候，出现小方块。 按下鼠标，开始清空区域
			}else if(Data.graphType == "rubber"){	
				Data.context_bak.lineWidth = 1;
				normalHandle.clearContext();
				Data.context_bak.beginPath();			
				Data.context_bak.strokeStyle = "#000000";						
				Data.context_bak.moveTo(x - Data.size*10, y - Data.size*10);						
				Data.context_bak.lineTo(x + Data.size*10, y - Data.size*10);
				Data.context_bak.lineTo(x + Data.size*10, y + Data.size*10);
				Data.context_bak.lineTo(x - Data.size*10, y + Data.size*10);
				Data.context_bak.lineTo(x - Data.size*10, y - Data.size*10);	
				Data.context_bak.stroke();		
				if(Data.canDraw){							
					Data.context.clearRect(x - Data.size*10,  y - Data.size*10, Data.size*20, Data.size*20);				
				}
			//直线
			}else if(Data.graphType == "line"){						
				if(Data.canDraw){
					Data.context_bak.beginPath();
					normalHandle.clearContext();
					Data.context_bak.moveTo(Data.startX, Data.startY);
					Data.context_bak.lineTo(x, y);
					Data.context_bak.stroke();
				}
			//方块 4条直线
			}else if(Data.graphType == "square"){
				if(Data.canDraw){
					Data.context_bak.beginPath();
					normalHandle.clearContext();
					Data.context_bak.moveTo(Data.startX, Data.startY);						
					Data.context_bak.lineTo(x, Data.startY);
					Data.context_bak.lineTo(x, y);
					Data.context_bak.lineTo(Data.startX, y);
					Data.context_bak.lineTo(Data.startX, Data.startY);
					Data.context_bak.stroke();
				}
			//圆 未画得时候 出现一个小圆
			}else if(Data.graphType == "circle"){						
				normalHandle.clearContext();
				if(Data.canDraw){
					// 鼠标点击移动时产生的圆
					Data.context_bak.beginPath();			
					var radius = Math.sqrt((Data.startX - x) * (Data.startX - x) + (Data.startY - y) * (Data.startY - y));
					Data.context_bak.arc(Data.startX, Data.startY, radius, 0, Math.PI*2, false);									
					Data.context_bak.stroke();
				}else{	
					Data.context_bak.beginPath();					
					Data.context_bak.arc(x, y, 20, 0, Math.PI*2, false);
					Data.context_bak.stroke();
				}
			}
		},


		//鼠标离开 把蒙版canvas的图片生成到canvas中
		mouseup: function(graphHandleData){
			Data.canDraw = false;
			var image = new Image();
			if(Data.graphType != "rubber"){		
				image.src = Data.canvas_bak.toDataURL();
				image.onload = function(){
					Data.context.drawImage(image, 0, 0, image.width, image.height, 0, 0, Data.canvasWidth, Data.canvasHeight);
					// 清空一层canvas，一笔完成，记录成步数
					normalHandle.clearContext();
					normalHandle.saveImageToAry();
				}
			}
		},


		//鼠标离开区域以外 除了涂鸦，都清空
		mouseout: function(){
			if(Data.graphType != "handwriting"){
				normalHandle.clearContext();
			}
		}
	}


	// 普通操作函数
	var normalHandle = {

		//清空层
		clearContext: function(flag){
			if(!flag){
				// 清空bak层，记录步数
				Data.context_bak.clearRect(0, 0, Data.canvasWidth, Data.canvasHeight);
			}else{
				// 清空全部
				Data.context.clearRect(0, 0, Data.canvasWidth, Data.canvasHeight);
				Data.context_bak.clearRect(0, 0, Data.canvasWidth, Data.canvasHeight);
			}
		},

		//保存历史 用于撤销
		saveImageToAry: function (){
			var dataUrl = Data.canvas.toDataURL();
			Data.cancelList.push(dataUrl);
			Data.cancelIndex = Data.cancelList.length - 1;		
		},

		//展开线条大小选择器
		showLineSize: function(obj){
			if($("#line_size").is(":hidden")){
				var top = $(obj).offset().top - $("#container").offset().top + 35,
					left = $(obj).offset().left - $("#container").offset().left - 10;				
				$("#line_size").css({
					left: left,
					top: top
				}).show();
			}else{
				$("#line_size").hide();
			}
		},

		//下载图片
		downloadImage: function(){
			$("#downloadImage_a")[0].href = Data.canvas.toDataURL();
			setTimeout(function(){
				$("#downloadImage_a").attr("href", "javascript:;");
			}, 1000)
		},

		// 填充前景
		fill: function(){
			Data.context.fillStyle = Data.color;
			Data.context_bak.fillStyle =  Data.color;
			Data.context.fillRect(0, 0, Data.canvasWidth, Data.canvasHeight);

			var image = new Image();
			image.src = Data.canvas_bak.toDataURL();
			Data.context.drawImage(image, 0, 0, image.width, image.height, 0, 0, Data.canvasWidth, Data.canvasHeight);
			normalHandle.clearContext();
			normalHandle.saveImageToAry();
		},


		//撤销上一个操作
		cancel: function(){
			if(Data.cancelIndex > 0){
				Data.cancelIndex--;
				Data.context.clearRect(0, 0, Data.canvasWidth, Data.canvasHeight);
				var image = new Image();
				var url = Data.cancelList[Data.cancelIndex];
				image.src = url;
				image.onload = function(){
					Data.context.drawImage(image, 0, 0, image.width, image.height, 0, 0, Data.canvasWidth, Data.canvasHeight);
				}
			}
		},

		//恢复上一个操作
		next: function(){
			if(Data.cancelIndex < Data.cancelList.length-1){
				Data.cancelIndex++;
				Data.context.clearRect(0, 0, Data.canvasWidth, Data.canvasHeight);

				var image = new Image(),
					url = Data.cancelList[Data.cancelIndex];
				image.src = url;
				image.onload = function(){
					Data.context.drawImage(image, 0, 0, image.width, image.height, 0, 0, Data.canvasWidth, Data.canvasHeight);
				}
			}
		},

		// 重置绘画板-下一局游戏
		resetCanvas: function(){
			normalHandle.clearContext(true);
			// 基础数据重置
			Data = {
				color: "#000000",
				size: 1,
				graphType: "pencil",	//初始画笔工具

				x: 0,
				y: 0,

				canvas: $("#canvas")[0],
				context: Data.canvas.getContext("2d"),
				canvas_bak: $("#canvas_bak")[0],
				context_bak: Data.canvas_bak.getContext("2d"),

				canvasWidth: 840,
				canvasHeight: 540,
				
				startX: 0,				//鼠标按下坐标
				startY: 0,				//鼠标按下坐标

				canDraw: false,			//是否可绘制

				cancelIndex: null,		//撤销的次数
				cancelList: ["data:image/png;base64,"]		//撤销步骤图像保存
			}
		}

	}


	// 数据操作-从connect接收
	var dataChange = {
		// 更改画笔类型
		typeChange: function(graphType){
			Data.graphType = graphType;		//全局画笔类型
			Draw.chooseImg(graphType);		//更新选中状态
		},

		// 更改颜色
		colorChange: function(color){
			Data.color = color;
			$(".dot_color").css({"background": color});
		},

		// 更改尺寸
		sizeChange: function(size){
			Data.size = size;
		}
	}




	//选择功能按钮 修改样式
	var Draw = {
		chooseImg: function(type){
			var imgAry  = $(".draw_controller li");
			for(var i=0; i<imgAry.length; i++){
				$(imgAry[i]).removeClass("active");
				$(imgAry[i]).addClass("normal");				
			}
			$("." + type).removeClass("normal").addClass("active");
		},
		init: function(){
			initCanvas();
			bindDraw();
		},
		drawHandleSend: drawHandleSend,		//绘画数据发送只服务器
		drawHandleRecive: drawHandleRecive,	//从服务器接收绘画数据
		normalHandle: normalHandle,			//常规操作-命令模式，无需数据
		dataChange: dataChange,				//数据操作（type、color、size）
		bindDraw: bindDraw					//
	}
	
	module.exports = Draw;
});