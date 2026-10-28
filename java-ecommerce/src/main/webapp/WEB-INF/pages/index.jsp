<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
	String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="cn">
<head>
	<meta charset="UTF-8">
	<title>电商实时经营数据大屏</title>
	<script src="<%=ctx%>/res/js/jquery-1.11.0.min.js"></script>
	<script src="<%=ctx%>/res/js/echarts.js"></script>
	<script src="<%=ctx%>/res/js/main.js"></script>
	<style>
		* { margin:0; padding:0; box-sizing:border-box; }
		html,body { width:100%; height:100vh; overflow:hidden; background: #060a1a; }
		body {
			font-family: "Microsoft YaHei", Arial, sans-serif;
			color: #e6f1ff;
			background: radial-gradient(ellipse at center, #0a1738 0%, #05070f 100%);
			display: flex; flex-direction: column;
		}
		/* 顶部标题 */
		.header {
			height: 8%;
			display: flex; justify-content: center; align-items: center;
			font-size: 28px; font-weight: bold; letter-spacing: 6px;
			color: #fff;
			text-shadow: 0 0 10px #00eaff, 0 0 20px #00eaff, 0 0 40px #0055ff;
			background: url('<%=ctx%>/res/images/header-bg.png') no-repeat center bottom;
			background-size: 60% 100%;
			position: relative;
		}
		.header::before, .header::after {
			content: ''; position: absolute; bottom: 0; width: 30%; height: 2px;
			background: linear-gradient(90deg, transparent, #00eaff, transparent);
		}
		.header::before { left: 5%; }
		.header::after { right: 5%; }

		/* 三列布局 */
		.container {
			flex: 1; display: flex; padding: 10px; gap: 10px; height: 92%;
		}
		.col { display: flex; flex-direction: column; gap: 10px; }
		.col-left { width: 28%; }
		.col-center { width: 44%; }
		.col-right { width: 28%; }

		/* 面板样式（仿截图风格） */
		.panel {
			flex: 1; position: relative; padding: 10px;
			background: rgba(10, 25, 60, 0.4);
			border: 1px solid rgba(0, 180, 255, 0.25);
			box-shadow: inset 0 0 20px rgba(0, 150, 255, 0.1);
			border-radius: 4px;
			display: flex; flex-direction: column;
		}
		/* 面板四角发光小装饰 */
		.panel::before, .panel::after, .panel .corner1, .panel .corner2 {
			content: ''; position: absolute; width: 10px; height: 10px; border: 2px solid #00eaff;
		}
		.panel::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
		.panel::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

		.panel-title {
			font-size: 14px; font-weight: bold; color: #7ad7ff;
			padding-left: 10px; margin-bottom: 8px; position: relative;
			letter-spacing: 2px;
		}
		.panel-title::before {
			content: ''; position: absolute; left: 0; top: 2px;
			width: 4px; height: 14px; background: #00eaff; border-radius: 2px;
		}

		/* 图表容器 */
		.chart { flex: 1; width: 100%; min-height: 0; }

		/* 顶部4个指标卡（占据中间列最上方） */
		.cards { display: flex; gap: 8px; height: 22%; }
		.card {
			flex: 1; background: rgba(10, 30, 70, 0.6);
			border: 1px solid rgba(0, 200, 255, 0.3); border-radius: 4px;
			display: flex; flex-direction: column; justify-content: center; align-items: center;
			box-shadow: 0 0 15px rgba(0, 200, 255, 0.2);
			position: relative;
		}
		.card .label { font-size: 12px; color: #9fd8ff; margin-bottom: 4px; }
		.card .value { font-size: 22px; font-weight: bold; font-family: Consolas; text-shadow: 0 0 10px #00eaff; color: #fff; }
		.card .unit { font-size: 12px; color: #00eaff; margin-left: 2px; }
	</style>
</head>
<body>

<div class="header">电商实时经营数据大屏</div>

<div class="container">
	<!-- 左列 -->
	<div class="col col-left">
		<div class="panel">
			<div class="panel-title">实时大盘</div>
			<div id="c-gmv" class="chart"></div>
		</div>
		<div class="panel">
			<div class="panel-title">城市排行</div>
			<div id="c-city" class="chart"></div>
		</div>
		<div class="panel">
			<div class="panel-title">促销效果</div>
			<div id="c-promotion" class="chart"></div>
		</div>
	</div>

	<!-- 中列 -->
	<div class="col col-center">
		<div class="cards">
			<div class="card"><div class="label">实时 GMV</div><div class="value"><span id="v-gmv">0</span><span class="unit">元</span></div></div>
			<div class="card"><div class="label">订单量</div><div class="value"><span id="v-cnt">0</span><span class="unit">单</span></div></div>
			<div class="card"><div class="label">客单价</div><div class="value"><span id="v-avg">0</span><span class="unit">元</span></div></div>
			<div class="card"><div class="label">取消率</div><div class="value"><span id="v-cancel">0</span><span class="unit">%</span></div></div>
		</div>
		<div class="panel" style="flex: 2;">
			<div class="panel-title">今日成交金额 & 最近交易趋势</div>
			<div id="c-hourly" class="chart"></div>
		</div>
	</div>

	<!-- 右列 -->
	<div class="col col-right">
		<div class="panel">
			<div class="panel-title">平台对比</div>
			<div id="c-platform" class="chart"></div>
		</div>
		<div class="panel">
			<div class="panel-title">支付方式分布</div>
			<div id="c-payment" class="chart"></div>
		</div>
		<div class="panel">
			<div class="panel-title">配送方式分布</div>
			<div id="c-shipping" class="chart"></div>
		</div>
	</div>
</div>

<!-- 用于底部两个图表的隐藏容器（如果屏幕小还可以用到），或者直接放最下面 -->
<div style="display: none;">
	<div id="c-funnel"></div>
	<div id="c-userfreq"></div>
</div>

</body>
</html>