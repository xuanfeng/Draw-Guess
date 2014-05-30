/*
 * @ 登录处理
 * @ xuanfeng
 * @ 2013-04-19
 * 
 */


define(function(require, exports, module){
	var $ = require("jquery"),
		JSON = require("json2");

	module.exports = {
		init: function(){
			// 切换至选择头像
			$(".avator").click(function(){
				$('.transform').addClass('flipIt');
			});

			// 更换头像
			$(".avator_show").click(function(){
				$(this).addClass('has_select').siblings('div').removeClass('has_select');
				$('.transform').removeClass('flipIt');

				var portaitId = $(this).find("img").attr("src");
				$(".avator").find("img").attr("src", portaitId);
				$(".avator_hidden").val(portaitId.match(/\d/)[0]);
			});

			// 切换登录注册
			$(".form_title span").each(function(i){
				$(this).click(function(){
					$(this).siblings("span").removeClass('active').end().addClass("active");
					$(".form_wrap form").hide().eq(i).fadeIn(300);
				});
			});

			
			// 输入用户名，更换头像
			var hasSignup = false;
			$(".nickname_login").blur(function(){
				var nickname = $.trim($(this).val());
				if(nickname != ""){
					$.ajax({
						async: false,
						url: "/getAvatorId",
						data: {nickname: nickname},
						dataType: 'html',
						type: 'post',
						beforeSend: function (xhr) {
							 xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
						},
						statusCode: {
						     404: function(){}
					   	},
						success: function(data){
							var json = JSON.parse(data);
							// console.log(json.avatorId);
							$(".avator_show").eq(json.avatorId-1).trigger("click");
						}		
					});
					return false;
				}
			});



			// 登录
			$(".submit_btn").click(function(){
				var $nickname = $(this).parents("form").find(".nickname"),
					$psw = $(this).parents("form").find(".password"),
					$dbpsw = $(this).parents("form").find(".repeat_password");

				// 昵称
				if($.trim($nickname.val()) == ""){
			        $nickname.val('').stop(false, true)
			            .css('background','#f5cfcf')
			            .animate({opacity: 0.3}, 300, function(){
			                $nickname.css('background','rgba(255, 255, 255, 0.2)').css('opacity', '1');
			        });
			        $nickname.focus();
			        return false;
			    }
			    // 密码
			    if($psw.val() == ""){
			        $psw.val('').stop(false, true)
			            .css('background','#f5cfcf')
			            .animate({opacity: 0.3}, 300, function(){
			                $psw.css('background','rgba(255, 255, 255, 0.2)').css('opacity', '1');
			        });
			        $psw.focus();
			        return false;
			    }
			    // 重复密码
			    if($dbpsw.length){
			    	if($dbpsw.val() == ""){
				    	$dbpsw.val('').stop(false, true)
				            .css('background','#f5cfcf')
				            .animate({opacity: 0.3}, 300, function(){
				                $dbpsw.css('background','rgba(255, 255, 255, 0.2)').css('opacity', '1');
				        });
				        $dbpsw.focus();
				        return false;
				    }else if($dbpsw.val() != $psw.val()){
				    	$dbpsw.parents("form").find(".error_tip").text("密码不一致").show();
				    	return false;
				    }
				    $dbpsw.parents("form").find(".error_tip").text("").hide();
			    }

				var action = $(this).parents("form").attr("action");
				$.ajax({
					async: false,
					url: action,
					data: $(this).parents("form").serialize(),
					dataType: 'html',
					type: 'post',
					beforeSend: function (xhr) {
						 xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
					},
					statusCode: {
					     200: function(){},
					     403: function(){}
				   	},
					success: function(data){
						var res = JSON.parse(data);
						var type = res.type;

						// 密码错误
						switch(type){
							case "error psw":
								if(action == "/login"){
						     		$(".login_form .error_tip").text("密码不正确！").show();
						     		return false;
								}
								break;
							case "same name":
								if(action == "/join"){
						     		$(".join_form .error_tip").text("该昵称已注册！").show();
								}
								break;
							case "join suc":
								if(action == "/join"){
						     		$("span.login").trigger("click");
						     		$(".login_form .error_tip").text("注册成功，请登录！").show();
								}
								break;
							default: 
								break;
						}

					}		
				});
				return false;
			});
		}
	}

// end
});