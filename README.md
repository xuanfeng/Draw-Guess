#基于 HTML5 实现的多人在线游戏“你画我猜”


----------
##相关技术
服务器：Node.js
服务器框架：express
数据传输：socket.io
数据库：MongoDB
图形音效：HTML5（audio、canvas、tag、websocket、）
游戏动画：CSS3
Javascript库：jQuery
前端模块化：sea.js
CSS框架：LESS
模版引擎：Ejs



----------

##运行步骤

1. 软件安装：Git、NodeJs、MongoDB
2. 运行数据库：mongod
3. 运行服务器：node server.js
4. 开始游戏：http://localhost:3000

------------------------

##游戏功能
- 绘制图形
- 聊天猜关键字
- 私信聊天
- 使用道具打分
- 查看在线玩家及积分
- 注册登录


--------------------


### 项目结构

- **Client**：客户端文件
    - **audio**: 音效文件
    - **css**: LESS编译后的样式文件
    - **images**：图片文件
    - **js**：前端逻辑文件
        - **app.js**：客户端入口文件
        - **chat.js**：聊天功能
        - **connect.js**：与服务器数据交互(中转站)
        - **draw.js**：绘画操作
        - **effect.js**：道具点评特效
        - **ejs.js**：Ejs模板引擎
        - **jquery.bigcolorpicker.js**：颜色选取组件
        - **jquery.cookie.js**：cookie操作函数
        - **jquery.js**：jquery库
        - **json2.js**：json操作函数
        - **login.js**：登录处理
        - **main.js**：游戏主逻辑
        - **scrollbar.js**：聊天窗口滚动条处理函数
        - **sea.js**：seajs模块化
        - **socket.js**：socket.io库文件
    - **less**：LESS源文件
    - **views**：Ejs模版文件        

- **Server** 与服务器交互的后台代码
    - **node_modules**：node模块
    - **config.js**：服务器相关配置
    - **controller.js**：服务器controller控制层-业务逻辑
    - **dbdao.js**：服务器dao层-数据库操作
    - **gameword.js**：游戏关键词数据
    - **package.json**：项目信息
    - **server.js**：服务器入口及主代码