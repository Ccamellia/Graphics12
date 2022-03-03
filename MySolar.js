// Solar.js
/*用于演示变换和坐标系
 画了一个简单的太阳系，包括一个太阳，一个地球和一个月球
 使用说明：
 *	  按"r"键来启动和停止动画
 *    按"s"键单步执行动画
 *    向上和向下箭头用于控制动画中每一帧的时间间隔,每次按键时间间隔乘2或除2)
 */
 
// 全局变量
var gl;						// WebGL上下文

var runAnimation = true;	// 控制动画运行和暂停
var singleStep = false;		// 控制单步执行模式开启和关闭


var yScale = 1;		//中间长方体y方向缩放因子
var scaleFactor = 1.1;	//yScale缩放系数



/*这3个变量控制动画的状态和速度*/
var hourOfDay = 0.0;		// 一天中的小时数，初始为0
var dayOfYear = 0.0;		// 一年中的天数，初始为0
var hourOfDay1 = 0.0;		// 行星X一天中的小时数，初始为0
var dayOfYear1 = 0.0;		// 行星X一年中的天数，初始为0
var hourOfDayMercury = 0.0;		// 行星X一天中的小时数，初始为0
var dayOfYearMercury = 0.0;		// 行星X一年中的天数，初始为0
var hourOfDay3 = 0.0;		// 行星X一天中的小时数，初始为0
var dayOfYear3 = 0.0;		// 行星X一年中的天数，初始为0
var hourOfDay0 = 0.0;		// 行星X一天中的小时数，初始为0
var dayOfYear0 = 0.0;		// 行星X一年中的天数，初始为0
var hourOfDaymars = 0.0;		// 行星X一天中的小时数，初始为0
var dayOfYearmars = 0.0;		// 行星X一年中的天数，初始为0
var hourOfDayVenus = 0.0;		// 行星X一天中的小时数，初始为0
var dayOfYearVenus = 0.0;
var hourOfDayJupiter = 0.0;		
var dayOfYearJupiter = 0.0;
var hourOfDaySaturn = 0.0;
var dayOfYearSaturn = 0.0;
var hourOfDayUranus = 0.0;
var dayOfYearUranus = 0.0;
var hourOfDayNeptune = 0.0;
var dayOfYearNeptune = 0.0;


// 控制动画速度变量，表示真实时间1秒对应的程序逻辑中的小时数
var animationStep = 24.0; 

var mvpStack = [];  // 模视投影矩阵栈，用数组实现，初始为空
var matProj;	    // 投影矩阵

var u_MVPMatrix;	// Shader中uniform变量"u_MVPMatrix"的索引
var u_Color;		// Shader中uniform变量"u_Color"的索引

var numVertices;	// 一个球的顶点数
var spherePoints = [];	// 存放一个球的顶点坐标数组

var a=[];
for(var r=0;r<360;r++){
	a.push(8*Math.random());
}
var b=[];
for(var r=0;r<360;r++){
	b.push(8*Math.random());
}
var c=[];
for(var r=0;r<360;r++){
	c.push(10*Math.random());
}

var d=[];
for(var r=0;r<360;r++){
	d.push(0.4*Math.random());
}

// 用于生成一个中心在原点的球的顶点坐标数据(南北极在z轴方向)
// 返回值为球的顶点数，参数为球的半径及经线和纬线数
function buildSphere(radius, columns, rows){
	var vertices = []; // 存放不同顶点的数组

	for (var r = 0; r <= rows; r++){
		var v = r / rows;  // v在[0,1]区间
		var theta1 = v * Math.PI; // theta1在[0,PI]区间

		var temp = vec3(0, 0, 1);
		var n = vec3(temp); // 实现Float32Array深拷贝
		var cosTheta1 = Math.cos(theta1);
		var sinTheta1 = Math.sin(theta1);
		n[0] = temp[0] * cosTheta1 + temp[2] * sinTheta1;
		n[2] = -temp[0] * sinTheta1 + temp[2] * cosTheta1;
		
		for (var c = 0; c <= columns; c++){
			var u = c / columns; // u在[0,1]区间
			var theta2 = u * Math.PI * 2; // theta2在[0,2PI]区间
			var pos = vec3(n);
			temp = vec3(n);
			var cosTheta2 = Math.cos(theta2);
			var sinTheta2 = Math.sin(theta2);
			
			pos[0] = temp[0] * cosTheta2 - temp[1] * sinTheta2;
			pos[1] = temp[0] * sinTheta2 + temp[1] * cosTheta2;
			
			var posFull = mult(radius, pos);
			
			vertices.push(posFull);
		}
	}

	/*生成最终顶点数组数据(使用线段进行绘制)*/
	if(spherePoints.length > 0)
		spherePoints.length = 0; // 如果sphere已经有数据，先回收
	numVertices = rows * columns * 6; // 顶点数

	var colLength = columns + 1;
	for (var r = 0; r < rows; r++){
		var offset = r * colLength;

		for (var c = 0; c < columns; c++){
			var ul = offset  +  c;						// 左上
			var ur = offset  +  c + 1;					// 右上
			var br = offset  +  (c + 1 + colLength);	// 右下
			var bl = offset  +  (c + 0 + colLength);	// 左下

			// 由两条经线和纬线围成的矩形
			// 只绘制从左上顶点出发的3条线段
			spherePoints.push(vertices[ul]);
			spherePoints.push(vertices[ur]);
			spherePoints.push(vertices[ul]);
			spherePoints.push(vertices[bl]);
			spherePoints.push(vertices[ul]);
			spherePoints.push(vertices[br]);
		}
	}

	vertices.length = 0;
}

// 页面加载完成后会调用此函数，函数名可任意(不一定为main)
window.onload = function main(){
	// 获取页面中id为webgl的canvas元素
    var canvas = document.getElementById("webgl");
	if(!canvas){ // 获取失败？
		alert("获取canvas元素失败！"); 
		return;
	}
	
	// 利用辅助程序文件中的功能获取WebGL上下文
	// 成功则后面可通过gl来调用WebGL的函数
    gl = WebGLUtils.setupWebGL(canvas);    
    if (!gl){ // 失败则弹出信息
		alert("获取WebGL上下文失败！"); 
		return;
	}        

	/*设置WebGL相关属性*/
	// 设置视口，占满整个canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // 设置背景色为黑色
	gl.enable(gl.DEPTH_TEST);	// 开启深度检测
	gl.viewport(0, 0, canvas.width, canvas.height);
	// 设置投影矩阵：透视投影，根据视口宽高比指定视域体
	matProj = perspective(80.0, 		// 垂直方向视角
		canvas.width / canvas.height, 	// 视域体宽高比
		1.0, 							// 相机到近裁剪面距离
		30.0);							// 相机到远裁剪面距离
     
	/*初始化顶点坐标数据*/
	// 生成中心在原点半径为1,15条经线和纬线的球的顶点
	buildSphere(1.0, 15, 15);

	/*创建并初始化一个缓冲区对象(Buffer Object)，用于存顶点坐标*/
    var verticesBufferId = gl.createBuffer(); // 创建buffer
	// 将id为verticesBufferId的buffer绑定为当前Array Buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBufferId);
	// 为当前Array Buffer提供数据，传输到GPU
    gl.bufferData(gl.ARRAY_BUFFER, 	 // Buffer类型
		flatten(spherePoints), // Buffer数据源
		gl.STATIC_DRAW );  // 表明是一次提供数据，多遍绘制
	
	/*加载shader程序并为shader中attribute变量提供数据*/
	// 加载id分别为"vertex-shader"和"fragment-shader"的shader程序，
	// 并进行编译和链接，返回shader程序对象program
    var program = initShaders(gl, "vertex-shader", 
		"fragment-shader");
    gl.useProgram(program);	// 启用该shader程序对象 
	
	/*初始化顶点着色器中的顶点位置属性*/
	// 获取名称为"a_Position"的shader attribute变量的位置
    var a_Position = gl.getAttribLocation(program, "a_Position");
	if(a_Position < 0){ // getAttribLocation获取失败则返回-1
		alert("获取attribute变量a_Position失败！"); 
		return;
	}	
	// 指定利用当前Array Buffer为a_Position提供数据的具体方式
    gl.vertexAttribPointer(a_Position, 	// shader attribute变量位置
		3, // 每个顶点属性有3个分量
		gl.FLOAT, // 数组数据类型(浮点型)
		false, 	  // 不进行归一化处理
		0,	 	  // 相邻顶点属性首址间隔(0为紧密排列) 
		0);		  // 第一个顶点属性在Buffer中偏移量
    gl.enableVertexAttribArray(a_Position);  // 启用顶点属性数组

	/*获取shader中uniform变量索引*/
	u_MVPMatrix = gl.getUniformLocation(program, "u_MVPMatrix");
	if(!u_MVPMatrix){
		alert("获取uniform变量u_MVPMatrix失败！")
		return;
	}
	
	u_Color = gl.getUniformLocation(program, "u_Color");
	if(!u_Color){
		alert("获取uniform变量u_Color失败！")
		return;
	}
	
	// 进行绘制
    render();
};

// 按键响应
window.onkeydown = function(){
	switch(event.keyCode){
		case 82: // r/R键
			if (singleStep) {	// 如果之前为单步执行模式
				singleStep = false;	 // 结束单步执行
				runAnimation = true; // 重启动画
			}
			else {
				runAnimation = !runAnimation;// 切换动画开关状态
			}
			break;
		case 83: // s/S键
			singleStep = true;
			runAnimation = true;
			break;
		case 38: // Up键
			 animationStep *= 2.0;	// 加快动画速度
			 break;
		case 40: // Down键
			 animationStep /= 2.0;	// 减慢动画速度
			 break;
	}
}

// 记录上一次调用函数的时刻
var last = Date.now();

// 根据时间更新旋转角度
function animation(){
	// 计算距离上次调用经过多长的时间
	var now = Date.now();
	var elapsed = now - last; // 毫秒
	last = now;
	
	if (runAnimation) {	// 如果动画开启
		// 更新动画状态
		var hours = animationStep * elapsed / 1000.0; // 过去的小时数
        hourOfDay += hours;
        dayOfYear += hours / 24.0;
		hourOfDay1 += hours;
        dayOfYear1 += hours / 36.0;
		hourOfDay0 += hours;
        dayOfYear0 += hours / 10.0;
		hourOfDaymars += hours;
        dayOfYearmars += hours / (24*1.03);
		hourOfDayMercury += hours;
        dayOfYearMercury += hours / (24*58);
		hourOfDayVenus += hours;
        dayOfYearVenus += hours / (24*243);
		hourOfDayJupiter += hours;
        dayOfYearJupiter += hours / (24*0.4);
		hourOfDaySaturn += hours;
        dayOfYearSaturn += hours / (24*0.42);
		hourOfDayUranus += hours;
        dayOfYearUranus += hours / (24*0.42);
		hourOfDayNeptune += hours;
        dayOfYearNeptune += hours / (24*0.75);
		
		
		// 防止溢出
        hourOfDay %= 24;
        dayOfYear %= 365;
		hourOfDay1 %= 36;
        dayOfYear1 %= 300;
		hourOfDay0 %= 60;
        dayOfYear0 %= 500;
		hourOfDaymars %= (24*1.03);
        dayOfYearmars %= 687;
		hourOfDayMercury %= (24*58);
        dayOfYearMercury %= 88;
		hourOfDayVenus %= (24*243);
        dayOfYearVenus %= 224;
		hourOfDayJupiter %= (24*0.4);
        dayOfYearJupiter %= 4332;
		hourOfDaySaturn %= (24*0.42);
        dayOfYearSaturn %= 10759;
		hourOfDayUranus %= (24*0.42);
        dayOfYearUranus %= 10759;
		hourOfDayNeptune %= (24*0.75);
        dayOfYearNeptune %= 165;
		
		
		
	}
}


// 绘制太阳系
// 参数为模视投影矩阵
function drawSolarSystem(mvp){
	/*下面开始构建整个太阳系，在世界坐标系下考虑问题*/
	// 注意缩放变换和地球系统无关，不应影响地球系统的绘制
	mvpStack.push(mvp); // 将MVP矩阵压进栈
    mvp = mult(mvp, rotateY(3600.0 * dayOfYear / 3000.0));//控制两个小太阳的旋转
	mvpStack.push(mvp); // 将MVP矩阵压进栈
	mvp = mult(mvp, translate(0, 0, 0));//向左平移，平移量决定小太阳到太阳系中心距离 
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(1.6, 1.6, 1.6)); // 控制太阳大小的缩放变换
    // 太阳直接画在原点，无须变换，用一个黄色的球体表示
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 1, 0.65, 0.195 );  // 黄色
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop(); // 出栈，此时针对太阳的缩放变换就不包含在mvp中了
	
	mvpStack.push(mvp); // 将MVP矩阵压进栈
    mvp = mult(mvp, rotateY(3600.0 * dayOfYear / 3000.0));//控制两个小太阳的旋转
	mvpStack.push(mvp); // 将MVP矩阵压进栈
	mvp = mult(mvp, translate(0, 0, 0));//向左平移，平移量决定小太阳到太阳系中心距离 
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(1.6, 1.6, 1.6)); // 控制太阳大小的缩放变换
    // 太阳直接画在原点，无须变换，用一个黄色的球体表示
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 1.0, 0.8, 0.195 );  // 黄色
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop(); // 出栈，此时针对太阳的缩放变换就不包含在mvp中了
	
	mvpStack.push(mvp); // 将MVP矩阵压进栈
    mvp = mult(mvp, rotateY(3600.0 * dayOfYear / 3000.0));//控制两个小太阳的旋转
	mvpStack.push(mvp); // 将MVP矩阵压进栈
	mvp = mult(mvp, translate(0, 0, 0));//向左平移，平移量决定小太阳到太阳系中心距离 
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(1.6, 1.6, 1.6)); // 控制太阳大小的缩放变换
    // 太阳直接画在原点，无须变换，用一个黄色的球体表示
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 1.0, 0.72, 0.32 );  // 黄色
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop(); // 出栈，此时针对太阳的缩放变换就不包含在mvp中了
	
	
    /*对地球系统定位，绕太阳放置它*/
	// 用dayOfYearX来控制其绕太阳系中心的旋转
	mvpStack.push(mvp); // 保存矩阵状态
    mvp = mult(mvp, rotateY(360.0 * dayOfYear / 365.0));
	// 用于控制行星X和太阳系中心之间距离的平移变换
    mvp = mult(mvp, translate(3.0, 0.0, 0.0));
	// 绘制地球系统
	drawEarthSystem(mvp);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
	//外行星带
	mvpStack.push(mvp); // 保存矩阵状态
	mvp = mult(mvp, rotateY(300.0 * dayOfYear1 / 200.0));
	mvp = mult(mvp, rotateY(-300.0 * dayOfYear1 / 2000.0));
	mvp = mult(mvp,rotateZ(5));
	drawoutsideSystem(mvp);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
	//星星
	mvpStack.push(mvp); // 保存矩阵状态
	mvp = mult(mvp, rotateY(300.0 * dayOfYear0 / 1200.0));
	mvp = mult(mvp, rotateY(-300.0 * dayOfYear0 / 2000.0));
	mvp = mult(mvp,rotateZ(8));
	
	drawhuan(mvp);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
	/*对火星系统定位，绕太阳放置它*/
	mvpStack.push(mvp); // 保存矩阵状态
    mvp = mult(mvp, rotateY(360.0 * dayOfYearmars / 687.0));
	// 用于控制行星X和太阳系中心之间距离的平移变换
    mvp = mult(mvp, translate(3.8, 0.0, 0.0));
	// 绘制地球系统
	drawMarsSystem(mvp);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
	/*对Mercury水系统定位，绕太阳放置它*/
	mvpStack.push(mvp); // 保存矩阵状态
    mvp = mult(mvp, rotateY(360.0 * dayOfYearMercury / 88.0));
	// 用于控制行星X和太阳系中心之间距离的平移变换
    mvp = mult(mvp, translate(1.9, 0.0, 0.0));
	// 绘制地球系统
	drawMercurySystem(mvp);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
	/*对金星Venus系统定位，绕太阳放置它*/
	mvpStack.push(mvp); // 保存矩阵状态
    mvp = mult(mvp, rotateY(360.0 * dayOfYearVenus / 224.0));
	// 用于控制行星X和太阳系中心之间距离的平移变换
    mvp = mult(mvp, translate(2.2, 0.0, 0.0));
	// 绘制地球系统
	drawVenusSystem(mvp);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
	/*对木星Jupiter系统定位，绕太阳放置它*/
	mvpStack.push(mvp); // 保存矩阵状态
    mvp = mult(mvp, rotateY(360.0 * dayOfYearJupiter / 224.0));
	// 用于控制行星X和太阳系中心之间距离的平移变换
    mvp = mult(mvp, translate(4.9, 0.0, 0.0));
	// 绘制地球系统
	drawJupiterSystem(mvp);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
	
	/*对土星Saturn系统定位，绕太阳放置它*/
	mvpStack.push(mvp); // 保存矩阵状态
    mvp = mult(mvp, rotateY(360.0 * dayOfYearSaturn / 10759.0));
	// 用于控制行星X和太阳系中心之间距离的平移变换
    mvp = mult(mvp, translate(6., 0.0, 0.0));
	//40度倾斜
	mvp = mult(mvp, rotateY(-360.0 * dayOfYearSaturn / 10759.0));
	mvp = mult(mvp,rotateZ(40));
	// 绘制地球系统
	drawSaturnSystem(mvp);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
	/*对天王星Uranus系统定位，绕太阳放置它*/
	mvpStack.push(mvp); // 保存矩阵状态
    mvp = mult(mvp, rotateY(360.0 * dayOfYearUranus / 30685.0));
	// 用于控制行星X和太阳系中心之间距离的平移变换
    mvp = mult(mvp, translate(7.7, 0.0, 0.0));
	mvp = mult(mvp, rotateY(-360.0 * dayOfYearUranus / 30685.0));
	mvp = mult(mvp,rotateZ(10));
	// 绘制地球系统
	drawUranusSystem(mvp);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
	/*对海王Neptune系统定位，绕太阳放置它*/
	mvpStack.push(mvp); // 保存矩阵状态
    mvp = mult(mvp, rotateY(360.0 * dayOfYearNeptune / 165.0));
	// 用于控制行星X和太阳系中心之间距离的平移变换
    mvp = mult(mvp, translate(8.8, 0.0, 0.0));
	// 绘制地球系统
	drawNeptuneSystem(mvp);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
}

// 绘制海王Neptune系统
// 参数为模视投影矩阵
function drawNeptuneSystem(mvp){
	// 绘制地球，地球的缩放和自转不应该影响月球
    mvpStack.push(mvp); // 保存矩阵状态
	// 地球自转，用hourOfDay进行控制
	mvp = mult(mvp, rotateY(360.0 * hourOfDayNeptune / (24.0 * 0.75)));
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(0.6, 0.6, 0.6));// 控制地球大小的缩放变换
	// 画一个蓝色的球来表示地球
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 54/255, 175/255, 250/255);  // 蓝色
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop(); // 恢复矩阵状态

}

// 绘制天王星Saturn系统
// 参数为模视投影矩阵
function drawUranusSystem(mvp){
	// 绘制地球，地球的缩放和自转不应该影响月球
    mvpStack.push(mvp); // 保存矩阵状态
	// 地球自转，用hourOfDay进行控制
	mvp = mult(mvp, rotateY(360.0 * hourOfDayUranus / (24.0 * 0.41)));
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(0.65, 0.65, 0.65));// 控制地球大小的缩放变换
	// 画一个蓝色的球来表示地球
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 131/255, 221/255, 255/255);  // 蓝色
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
	/*环*/
	 mvpStack.push(mvp); // 保存矩阵状态

	mvp = mult(mvp, rotateY(360.0  *hourOfDayUranus / (24.0 * 0.41)));
	mvp=mult(mvp,rotateX(90));
	mvp = mult(mvp, scale(0.9, 0.9, 0.01));// 控制大小的缩放变换
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 131/255, 221/255, 255/255 ); 
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop();

}



// 绘制土星Saturn系统
// 参数为模视投影矩阵
function drawSaturnSystem(mvp){
	// 绘制地球，地球的缩放和自转不应该影响月球
    mvpStack.push(mvp); // 保存矩阵状态
	// 地球自转，用hourOfDay进行控制
	mvp = mult(mvp, rotateY(360.0 * hourOfDaySaturn / (24.0 * 0.41)));
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(0.65, 0.65, 0.65));// 控制地球大小的缩放变换
	// 画一个蓝色的球来表示地球
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 216/255, 234/255, 174/255);  // 蓝色
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
	/*环*/
	 mvpStack.push(mvp); // 保存矩阵状态
	//mvp=mult(mvp,rotateZ(40));
	mvp = mult(mvp, rotateY(360.0  *hourOfDaySaturn / (24.0 * 0.41)));
	mvp=mult(mvp,rotateX(90));
	mvp = mult(mvp, scale(0.9, 0.9, 0.01));// 控制大小的缩放变换
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 216/255, 234/255, 174/255 ); 
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop();

}

// 绘制外行星带系统
// 参数为模视投影矩阵
function drawoutsideSystem(mvp){
	for(var i=0.0;i<360.0;i++){
	mvpStack.push(mvp); // 保存矩阵状态	
	mvp = mult(mvp, rotateY(i));
	mvp = mult(mvp, translate(4+d[i], 0.0, 0.0));
	
	mvp = mult(mvp, scale(0.02, 0.02, 0.02));// 控制大小的缩放变换
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 140/255, 180/255, 180/255 );  
	gl.drawArrays(gl.LINES, 0, numVertices);	
	mvp = mvpStack.pop(); // 恢复矩阵状态
	}
}

// 绘制木星Jupiter系统
// 参数为模视投影矩阵
function drawJupiterSystem(mvp){
	// 绘制地球，地球的缩放和自转不应该影响月球
    mvpStack.push(mvp); // 保存矩阵状态
	// 地球自转，用hourOfDay进行控制
	mvp = mult(mvp, rotateY(360.0 * hourOfDayJupiter / (24.0 * 0.41)));
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(0.7, 0.7, 0.7));// 控制地球大小的缩放变换
	// 画一个蓝色的球来表示地球
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 255/255, 220/255, 150/255);  // 蓝色
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop(); // 恢复矩阵状态

}

     
// 绘制金星Venus系统
// 参数为模视投影矩阵
function drawVenusSystem(mvp){
	// 绘制地球，地球的缩放和自转不应该影响月球
    mvpStack.push(mvp); // 保存矩阵状态
	// 地球自转，用hourOfDay进行控制
	mvp = mult(mvp, rotateY(360.0 * hourOfDayVenus / (24.0 * 243)));
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(0.08, 0.08, 0.08));// 控制地球大小的缩放变换
	// 画一个蓝色的球来表示地球
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 253/255, 255/255, 153/255);  // 蓝色
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop(); // 恢复矩阵状态

}

// 绘制水星系统
// 参数为模视投影矩阵
function drawMercurySystem(mvp){
	// 绘制地球，地球的缩放和自转不应该影响月球
    mvpStack.push(mvp); // 保存矩阵状态
	// 地球自转，用hourOfDay进行控制
	mvp = mult(mvp, rotateY(360.0 * hourOfDayMercury / (24.0 * 58)));
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(0.08, 0.08, 0.08));// 控制地球大小的缩放变换
	// 画一个蓝色的球来表示地球
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 158/255, 132/255, 53/255);  // 蓝色
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop(); // 恢复矩阵状态

}

// 绘制月球系统
// 参数为模视投影矩阵
function drawMoonSystem(mvp){
	mvpStack.push(mvp); // 保存矩阵状态
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(0.18, 0.18, 0.18));// 控制月球大小的缩放变换
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 0.9, 0.82, 0.59 ); 
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop(); // 恢复矩阵状态
	
	/**绘制月球卫星*/
	// 用dayOfYear来控制其绕月球的旋转
  	mvp = mult(mvp, rotateY(360.0 * 48.0 * dayOfYear / 365.0));
	// 用于控制月球卫星与月球之间距离的平移变换
    mvp = mult(mvp, translate( 0.19, 0.0, 0.0 ));
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(0.02, 0.02, 0.02));// 控制月球卫星大小的缩放变换
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 0.3, 0.3, 0.9 ); 
	gl.drawArrays(gl.LINES, 0, numVertices);
}
   
// 绘制Mars系统
// 参数为模视投影矩阵
function drawMarsSystem(mvp){
	// 绘制地球，地球的缩放和自转不应该影响月球
    mvpStack.push(mvp); // 保存矩阵状态
	// 地球自转，用hourOfDay进行控制
	mvp = mult(mvp, rotateY(360.0 * hourOfDay / (24.0 * 1.03)));
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(0.23, 0.23, 0.23));// 控制地球大小的缩放变换
	// 画一个蓝色的球来表示地球
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 204/255, 73/255, 85/255);  // 蓝色
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop(); // 恢复矩阵状态

}

// 绘制地球系统
// 参数为模视投影矩阵
function drawEarthSystem(mvp){
	/*下面开始在地球系统的小世界坐标系下考虑问题*/
	// 绘制地球，地球的缩放和自转不应该影响月球
    mvpStack.push(mvp); // 保存矩阵状态
	// 地球自转，用hourOfDay进行控制
	mvp = mult(mvp, rotateY(360.0 * hourOfDay / 24.0));
	mvp = mult(mvp,rotateX(90));	//调整南北极为y轴方向
	mvp = mult(mvp, scale(0.45, 0.45, 0.45));// 控制地球大小的缩放变换
	// 画一个蓝色的球来表示地球
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 0.2, 0.3, 0.7 );  // 蓝色
	gl.drawArrays(gl.LINES, 0, numVertices);
	mvp = mvpStack.pop(); // 恢复矩阵状态

	/*画月球系统*/
	// 用dayOfYear来控制其绕地球的旋转
  	mvp = mult(mvp, rotateY(360.0 * 12.0 * dayOfYear / 365.0));
	// 用于控制地月距离的平移变换
    mvp = mult(mvp, translate( 0.84, 0.0, 0.0 ));
	drawMoonSystem(mvp);
}

//星星
function drawhuan(mvp){
	
	for(var i=0.0;i<360.0;i++){
	mvpStack.push(mvp); // 保存矩阵状态	
	mvp = mult(mvp, rotateY(i));
	mvp = mult(mvp, translate(12+a[i], 0.0, 0.0));
	
	mvp = mult(mvp, scale(0.01, 0.01, 0.01));// 控制大小的缩放变换
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 0.3, 0.3, 0.3 );  
	gl.drawArrays(gl.LINES, 0, numVertices);	
	mvp = mvpStack.pop(); // 恢复矩阵状态
	}
	for(var i=0.0;i<360.0;i++){
	mvpStack.push(mvp); // 保存矩阵状态	
	mvp = mult(mvp, rotateY(i));
	mvp = mult(mvp, translate(9.0+b[i], 0.0, 0.0));
	
	mvp = mult(mvp, scale(0.02, 0.02, 0.02));// 控制大小的缩放变换
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 0.3, 0.3, 0.4 );  
	gl.drawArrays(gl.LINES, 0, numVertices);	
	mvp = mvpStack.pop(); // 恢复矩阵状态
	}
	for(var i=0.0;i<360.0;i++){
	mvpStack.push(mvp); // 保存矩阵状态	
	mvp = mult(mvp, rotateY(i));
	mvp = mult(mvp, translate(6+c[i], 0.0, 0.0));
	
	mvp = mult(mvp, scale(0.01, 0.01, 0.01));// 控制大小的缩放变换
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mvp)); // 传模视投影矩阵
	gl.uniform3f(u_Color, 0.35, 0.3, 0.3 );  
	gl.drawArrays(gl.LINES, 0, numVertices);	
	mvp = mvpStack.pop(); // 恢复矩阵状态
	}
	

	
}

// 绘制函数
function render() {
	// 更新动画相关参数
	animation();
	

	
	
	// 清颜色缓存和深度缓存
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   
	var mvp = matProj;	// 定义模视投影矩阵，初始化为投影矩阵
	
	mvp = mult(mvp, lookAt(vec3(0,2,12),vec3(0,0,0),vec3(0,1,0)));
	// 在观察坐标系(照相机坐标系)下思考，
	// 定位整个场景(第一种观点)或世界坐标系(第二种观点)
	// 向负z轴方向平移8个单位
    //mvp = mult(mvp, translate(0.0, 0.0, -8.0));

	// 将太阳系绕x轴旋转15度以便在xy-平面上方观察
	mvp = mult(mvp, rotateX(15.0));
	
	// 绘制太阳系
	drawSolarSystem(mvp);
	
	
	// 如果是单步执行，则关闭动画
	if (singleStep) {	 				
		runAnimation = false;
	}
	
	requestAnimFrame(render); // 请求重绘
}
