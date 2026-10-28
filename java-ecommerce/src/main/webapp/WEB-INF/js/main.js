/* ===========================================================
   实时电商数据大屏 - 核心逻辑 (适配 9 张 ADS 表)
   =========================================================== */

/* ---------- ① 接口配置 ---------- */
var API = {
	gmv:       '/getGmv',
	hourly:    '/getHourlyTrend',
	platform:  '/getPlatformCmp',
	city:      '/getCityRank',
	promotion: '/getPromotionEff',
	funnel:    '/getOrderFunnel',
	payment:   '/getPaymentDist',
	shipping:  '/getShippingDist',
	user:      '/getUserFreq'
};

var charts = {};
function inst(id) {
	if (!charts[id]) {
		var dom = document.getElementById(id);
		if (!dom) return null;
		charts[id] = echarts.init(dom);
	}
	return charts[id];
}

/* ---------- ② 数字滚动动画 ---------- */
function animateNumber(el, to, decimals, suffix) {
	if (!el) return;
	var from = parseFloat(el.getAttribute('data-val') || '0');
	var start = performance.now(), dur = 900;
	function step(now) {
		var t = Math.min((now - start) / dur, 1);
		var eased = 1 - Math.pow(1 - t, 3);
		var v = from + (to - from) * eased;
		el.textContent = v.toFixed(decimals);
		if (t < 1) requestAnimationFrame(step);
		else el.setAttribute('data-val', to);
	}
	requestAnimationFrame(step);
}

/* ---------- ③ 通用配置 ---------- */
var AXIS_COLOR = '#7ad7ff';
var GRID_COLOR = 'rgba(80,150,255,.1)';
var COLOR_PALETTE = ['#00eaff', '#8a6bff', '#ffb545', '#ff6b9d', '#6be3a0', '#4bb6ff'];

function get(url, cb) {
	$.ajax({
		url: url, type: 'GET', dataType: 'json',
		success: function (res) { cb(res); },
		error: function (xhr, s, e) { console.warn('接口失败：' + url, s, e); }
	});
}

/* ---------- ④ 拉取数据并渲染 ---------- */
function refreshAll() {
	// 1. 顶部指标卡 (ads_realtime_gmv)
	get(API.gmv, function (res) {
		var d = Array.isArray(res) ? (res[res.length - 1] || {}) : (res.data || res);
		if (!d) return;
		animateNumber(document.getElementById('v-gmv'),    Number(d.gmv || 0),        2);
		animateNumber(document.getElementById('v-cnt'),    Number(d.order_cnt || d.cnt || 0),  0);
		animateNumber(document.getElementById('v-avg'),    Number(d.avg_amount || 0), 2);
		var cr = Number(d.cancel_rate || 0);
		animateNumber(document.getElementById('v-cancel'), cr <= 1 ? cr * 100 : cr, 2);
	});

	// 2. 小时趋势 (ads_hourly_trend)
	get(API.hourly, function (res) {
		var arr = Array.isArray(res) ? res : (res.data || []);
		var xs = [], gmv = [], cnt = [];
		for (var i = 0; i < arr.length; i++) {
			xs.push(arr[i].stat_hour || '');
			gmv.push(Number(arr[i].gmv || 0));
			cnt.push(Number(arr[i].order_cnt || 0));
		}
		var c = inst('c-hourly');
		if (!c) return;
		c.setOption({
			tooltip: { trigger: 'axis' },
			legend: { textStyle: { color: '#9fd8ff' }, top: 0, data: ['GMV', '订单量'] },
			grid: { left: 50, right: 50, top: 35, bottom: 25 },
			xAxis: { type: 'category', data: xs, axisLine: { lineStyle: { color: AXIS_COLOR } }, axisLabel: { color: AXIS_COLOR, fontSize: 11 } },
			yAxis: [
				{ type: 'value', name: 'GMV', nameTextStyle: { color: '#9fd8ff' }, axisLabel: { color: AXIS_COLOR }, splitLine: { lineStyle: { color: GRID_COLOR } } },
				{ type: 'value', name: '订单量', nameTextStyle: { color: '#9fd8ff' }, axisLabel: { color: AXIS_COLOR }, splitLine: { show: false } }
			],
			series: [
				{ name: 'GMV', type: 'line', smooth: true, showSymbol: false, data: gmv,
					lineStyle: { width: 2, color: '#00eaff' }, itemStyle: { color: '#00eaff' },
					areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0, color:'rgba(0,240,255,.6)'}, {offset:1, color:'rgba(0,240,255,0)'}]) } },
				{ name: '订单量', type: 'bar', yAxisIndex: 1, data: cnt, barWidth: '30%',
					itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0, color:'#8a6bff'}, {offset:1, color:'rgba(138,107,255,.1)'}]), borderRadius: [4,4,0,0] } }
			]
		});
	});

	// 3. 平台对比 (ads_platform_cmp) - 横向条
	get(API.platform, function (res) {
		var arr = Array.isArray(res) ? res : (res.data || []);
		var latest = {};
		for (var i = 0; i < arr.length; i++) latest[arr[i].platform] = arr[i];
		var xs = [], vs = [];
		for (var k in latest) { xs.push(k); vs.push(Number(latest[k].gmv || 0)); }
		var c = inst('c-platform');
		if (!c) return;
		c.setOption({
			tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
			grid: { left: 60, right: 30, top: 15, bottom: 20 },
			xAxis: { type: 'value', axisLabel: { color: AXIS_COLOR }, splitLine: { lineStyle: { color: GRID_COLOR } } },
			yAxis: { type: 'category', data: xs, axisLine: { lineStyle: { color: AXIS_COLOR } }, axisLabel: { color: '#cfe9ff', fontSize: 11 } },
			series: [{ type: 'bar', data: vs, barWidth: '50%',
				label: { show: true, position: 'right', color: '#9fd8ff' },
				itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0, [{offset:0, color:'rgba(0,240,255,.2)'}, {offset:1, color:'#00eaff'}]), borderRadius: [0,4,4,0] } }]
		});
	});

	// 4. 城市排行 (ads_city_rank) - 横向条
	get(API.city, function (res) {
		var arr = Array.isArray(res) ? res : (res.data || []);
		var latest = {};
		for (var i = 0; i < arr.length; i++) latest[arr[i].city] = arr[i];
		var list = [];
		for (var k in latest) list.push(latest[k]);
		list.sort(function(a,b){ return Number(a.gmv) - Number(b.gmv); }).slice(-8);
		var ys = list.map(function(x){ return x.city; });
		var vs = list.map(function(x){ return Number(x.gmv); });
		var c = inst('c-city');
		if (!c) return;
		c.setOption({
			tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
			grid: { left: 60, right: 30, top: 10, bottom: 20 },
			xAxis: { type: 'value', axisLabel: { color: AXIS_COLOR }, splitLine: { lineStyle: { color: GRID_COLOR } } },
			yAxis: { type: 'category', data: ys, axisLine: { lineStyle: { color: AXIS_COLOR } }, axisLabel: { color: '#cfe9ff', fontSize: 11 } },
			series: [{ type: 'bar', data: vs, barWidth: '50%',
				itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0, [{offset:0, color:'rgba(0,240,255,.2)'}, {offset:1, color:'#00eaff'}]), borderRadius: [0,4,4,0] } }]
		});
	});

	// 5. 促销效果 (ads_promotion_eff) - 柱状+折线
	get(API.promotion, function (res) {
		var arr = Array.isArray(res) ? res : (res.data || []);
		var latest = {};
		for (var i = 0; i < arr.length; i++) latest[arr[i].promotion_id] = arr[i];
		var xs = [], gmv = [], disc = [];
		for (var k in latest) { xs.push(k); gmv.push(Number(latest[k].gmv||0)); disc.push(Number(latest[k].avg_discount||0)); }
		var c = inst('c-promotion');
		if (!c) return;
		c.setOption({
			tooltip: { trigger: 'axis' },
			legend: { textStyle: { color: '#9fd8ff' }, top: 0, data: ['GMV', '平均折扣'] },
			grid: { left: 45, right: 40, top: 30, bottom: 20 },
			xAxis: { type: 'category', data: xs, axisLine: { lineStyle: { color: AXIS_COLOR } }, axisLabel: { color: AXIS_COLOR, fontSize: 10 } },
			yAxis: { type: 'value', axisLabel: { color: AXIS_COLOR }, splitLine: { lineStyle: { color: GRID_COLOR } } },
			series: [
				{ name: 'GMV', type: 'bar', data: gmv, barWidth: '40%', itemStyle: { color: '#00eaff', borderRadius: [4,4,0,0] } },
				{ name: '平均折扣', type: 'line', data: disc, smooth: true, itemStyle: { color: '#ffb545' } }
			]
		});
	});

	// 6. 支付方式分布 (ads_payment_dist) - 饼图
	get(API.payment, function (res) {
		var arr = Array.isArray(res) ? res : (res.data || []);
		var latest = {};
		for (var i = 0; i < arr.length; i++) latest[arr[i].payment_method] = arr[i];
		var data = [];
		for (var k in latest) data.push({ name: k, value: Number(latest[k].cnt || 0) });
		var c = inst('c-payment');
		if (!c) return;
		c.setOption({
			tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
			legend: { textStyle: { color: '#9fd8ff' }, bottom: 0, left: 'center' },
			color: COLOR_PALETTE,
			series: [{ type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'], label: { color: '#cfe9ff', fontSize: 11 }, data: data }]
		});
	});

	// 7. 配送方式分布 (ads_shipping_dist) - 柱状图
	get(API.shipping, function (res) {
		var arr = Array.isArray(res) ? res : (res.data || []);
		var latest = {};
		for (var i = 0; i < arr.length; i++) latest[arr[i].shipping_method] = arr[i];
		var xs = [], vs = [];
		for (var k in latest) { xs.push(k); vs.push(Number(latest[k].cnt || 0)); }
		var c = inst('c-shipping');
		if (!c) return;
		c.setOption({
			tooltip: { trigger: 'axis' },
			grid: { left: 45, right: 20, top: 20, bottom: 25 },
			xAxis: { type: 'category', data: xs, axisLine: { lineStyle: { color: AXIS_COLOR } }, axisLabel: { color: AXIS_COLOR, fontSize: 10, interval: 0 } },
			yAxis: { type: 'value', axisLabel: { color: AXIS_COLOR }, splitLine: { lineStyle: { color: GRID_COLOR } } },
			series: [{ type: 'bar', data: vs, barWidth: '40%',
				label: { show: true, position: 'top', color: '#9fd8ff' },
				itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0, color:'#ffb545'}, {offset:1, color:'rgba(255,181,69,.1)'}]), borderRadius: [4,4,0,0] } }]
		});
	});

	// 8. 订单漏斗 (ads_order_funnel) - 漏斗图（备用，隐藏容器）
	get(API.funnel, function (res) {
		var arr = Array.isArray(res) ? res : (res.data || []);
		var latest = {};
		for (var i = 0; i < arr.length; i++) latest[arr[i].order_status] = arr[i];
		var data = [];
		for (var k in latest) data.push({ name: k, value: Number(latest[k].cnt || 0) });
		data.sort(function(a,b){ return b.value - a.value; });
		var c = inst('c-funnel');
		if (!c) return;
		c.setOption({
			tooltip: { trigger: 'item', formatter: '{b}: {c}' },
			color: COLOR_PALETTE,
			series: [{ type: 'funnel', left: '12%', right: '12%', top: 40, bottom: 10, minSize: '25%', maxSize: '90%', gap: 3, sort: 'descending',
				label: { color: '#cfe9ff', fontSize: 11, formatter: '{b} {c}' }, data: data }]
		});
	});

	// 9. 用户频次 (ads_user_freq) - 环形图（备用，隐藏容器）
	get(API.user, function (res) {
		var arr = Array.isArray(res) ? res : (res.data || []);
		var latest = {};
		for (var i = 0; i < arr.length; i++) latest[arr[i].freq_level] = arr[i];
		var data = [];
		for (var k in latest) data.push({ name: k, value: Number(latest[k].user_cnt || 0) });
		var c = inst('c-userfreq');
		if (!c) return;
		c.setOption({
			tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
			color: COLOR_PALETTE,
			series: [{ type: 'pie', radius: ['40%', '65%'], center: ['50%', '50%'], label: { color: '#cfe9ff', fontSize: 11 }, data: data }]
		});
	});
}

/* ---------- ⑤ 启动与刷新 ---------- */
window.addEventListener('load', function () {
	refreshAll();
	setInterval(refreshAll, 5000); // 每 5 秒刷新一次
	window.addEventListener('resize', function () {
		for (var k in charts) { if(charts[k]) charts[k].resize(); }
	});
});