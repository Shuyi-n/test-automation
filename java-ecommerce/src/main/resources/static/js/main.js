window.globalState = {
	genderMap: {}, ageMap: {}, levelMap: {}, cityMap: {},
	categoryMap: {}, brandMap: {}, funnelMap: {}, platformMap: {}
};

window.API = {
	gender:   '/api/realtime/gender',
	age:      '/api/realtime/age',
	level:    '/api/realtime/level',
	city:     '/api/realtime/city',
	category: '/api/realtime/category',
	brand:    '/api/realtime/brand',
	funnel:   '/api/realtime/funnel',
	platform: '/api/realtime/platform'
};

window.charts = {};

window.SOFT_PAIRS = [
	{ l: '#7fe0c0', d: '#0e7a5c' },
	{ l: '#7fc8ef', d: '#0e5680' },
	{ l: '#b3a8ee', d: '#3c2c8c' },
	{ l: '#f2a8c0', d: '#8c2857' },
	{ l: '#f0c890', d: '#8a5215' },
	{ l: '#ead47a', d: '#8a6c10' },
	{ l: '#f0a090', d: '#8a2c18' },
	{ l: '#8fd6d8', d: '#136a6c' }
];

window.PYRAMID_PAIRS = [
	{ l: '#7ec2de', d: '#6aa8c6' },
	{ l: '#6ed4c4', d: '#5cb8ac' },
	{ l: '#7cdca0', d: '#68c08c' },
	{ l: '#a8d888', d: '#90bc74' },
	{ l: '#c8dc88', d: '#acc074' },
	{ l: '#e0d890', d: '#c4bc7c' },
	{ l: '#e8cc90', d: '#ccb078' }
];

window.num = function(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; };
window.fmt = function(v, d) { d = d || 0; var s = Number(v).toFixed(d); var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.join('.'); };

window.get = function(url, cb) {
	$.ajax({ url: url, type: 'GET', dataType: 'json', cache: false,
		success: function (res) { if (res && res.code === 200) cb(res.data || []); },
		error: function (xhr) { console.warn('接口失败:', url, xhr.status); }
	});
};

/* ============ 地球仪 ============ */
window.initGlobe = function() {
	var canvas = document.getElementById('globeCanvas');
	if (!canvas) return;
	var ctx = canvas.getContext('2d');
	var dpr = Math.min(window.devicePixelRatio || 1, 2);
	var W, H, cx, cy, R, centerY, gap;

	function resize() {
		var rect = canvas.parentElement.getBoundingClientRect();
		W = rect.width; H = rect.height;
		canvas.width = Math.max(1, W * dpr);
		canvas.height = Math.max(1, H * dpr);
		canvas.style.width = W + 'px';
		canvas.style.height = H + 'px';
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		cx = W / 2; cy = H / 2;
		R = Math.min(W, H) * 0.42;
		centerY = cy + Math.min(W, H) * 0.01;
		gap = R * 0.26;
	}
	resize();
	window.addEventListener('resize', resize);

	var time = 0, angle = 0;

	function draw() {
		ctx.clearRect(0, 0, W, H);
		time += 0.02; angle += 0.006;

		var pitch = 0.10;
		var cosP = Math.cos(pitch), sinP = Math.sin(pitch);
		var topBaseY = centerY - gap / 2;
		var bottomBaseY = centerY + gap / 2;
		var breathe = 0.88 + Math.sin(time * 0.9) * 0.12;

		var glow = ctx.createRadialGradient(cx, centerY, R * 0.4, cx, centerY, R * 2.4);
		glow.addColorStop(0,   'rgba(80, 200, 255, ' + (0.24 * breathe).toFixed(3) + ')');
		glow.addColorStop(0.5, 'rgba(30, 120, 210, ' + (0.10 * breathe).toFixed(3) + ')');
		glow.addColorStop(1,   'rgba(0, 40, 120, 0)');
		ctx.fillStyle = glow;
		ctx.beginPath(); ctx.arc(cx, centerY, R * 2.4, 0, Math.PI * 2); ctx.fill();

		var midGlow = ctx.createRadialGradient(cx, centerY, 0, cx, centerY, R * 1.25);
		midGlow.addColorStop(0,   'rgba(220, 248, 255, ' + (0.55 * breathe).toFixed(3) + ')');
		midGlow.addColorStop(0.45, 'rgba(120, 220, 255, ' + (0.22 * breathe).toFixed(3) + ')');
		midGlow.addColorStop(1,   'rgba(60, 160, 230, 0)');
		ctx.save();
		ctx.translate(cx, centerY); ctx.scale(1, 0.16); ctx.translate(-cx, -centerY);
		ctx.fillStyle = midGlow;
		ctx.beginPath(); ctx.arc(cx, centerY, R * 1.25, 0, Math.PI * 2); ctx.fill();
		ctx.restore();

		var midLine = ctx.createLinearGradient(cx - R * 1.2, 0, cx + R * 1.2, 0);
		midLine.addColorStop(0,    'rgba(180, 240, 255, 0)');
		midLine.addColorStop(0.5,  'rgba(240, 252, 255, ' + (0.85 * breathe).toFixed(3) + ')');
		midLine.addColorStop(1,    'rgba(180, 240, 255, 0)');
		ctx.beginPath();
		ctx.moveTo(cx - R * 1.2, centerY);
		ctx.lineTo(cx + R * 1.2, centerY);
		ctx.strokeStyle = midLine; ctx.lineWidth = 1.6;
		ctx.shadowColor = 'rgba(0, 220, 255, 1)'; ctx.shadowBlur = 16;
		ctx.stroke(); ctx.shadowBlur = 0;

		function projectTop(phi, theta) {
			var th = theta + angle;
			var sPhi = Math.sin(phi), cPhi = Math.cos(phi);
			var x = R * sPhi * Math.cos(th);
			var y = R * cPhi;
			var z = R * sPhi * Math.sin(th);
			return { x: cx + x, y: topBaseY - (y * cosP - z * sinP), depth: (z / R + 1) / 2 };
		}
		function projectBottom(phi, theta) {
			var th = theta + angle;
			var sPhi = Math.sin(phi), cPhi = Math.cos(phi);
			var x = R * sPhi * Math.cos(th);
			var y = -R * cPhi;
			var z = R * sPhi * Math.sin(th);
			return { x: cx + x, y: bottomBaseY - (y * cosP - z * sinP), depth: (z / R + 1) / 2 };
		}

		var topGrad = ctx.createRadialGradient(cx, topBaseY - R * cosP, R * 0.05, cx, topBaseY, R);
		topGrad.addColorStop(0, 'rgba(150, 225, 255, 0.36)');
		topGrad.addColorStop(0.5, 'rgba(70, 160, 230, 0.18)');
		topGrad.addColorStop(1, 'rgba(20, 70, 140, 0.05)');
		ctx.beginPath(); ctx.arc(cx, topBaseY, R, Math.PI, Math.PI * 2, false); ctx.closePath();
		ctx.fillStyle = topGrad; ctx.fill();

		var botGrad = ctx.createRadialGradient(cx, bottomBaseY + R * cosP, R * 0.05, cx, bottomBaseY, R);
		botGrad.addColorStop(0, 'rgba(150, 225, 255, 0.36)');
		botGrad.addColorStop(0.5, 'rgba(70, 160, 230, 0.18)');
		botGrad.addColorStop(1, 'rgba(20, 70, 140, 0.05)');
		ctx.beginPath(); ctx.arc(cx, bottomBaseY, R, 0, Math.PI, false); ctx.closePath();
		ctx.fillStyle = botGrad; ctx.fill();

		function strokeSegs(projFn) {
			var nM = 22;
			for (var i = 0; i < nM; i++) {
				var theta = (i / nM) * Math.PI * 2;
				var prev = null;
				for (var j = 0; j <= 50; j++) {
					var phi = (j / 50) * Math.PI / 2;
					var p = projFn(phi, theta);
					if (prev) {
						var d = (prev.depth + p.depth) / 2;
						ctx.beginPath();
						ctx.strokeStyle = 'rgba(160, 230, 255, ' + (0.20 + d * 0.72).toFixed(3) + ')';
						ctx.lineWidth = 0.7 + d * 1.2;
						ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
					}
					prev = p;
				}
			}
			var nP = 8;
			for (var k = 1; k <= nP; k++) {
				var phi2 = (k / (nP + 1)) * Math.PI / 2;
				var prev2 = null;
				for (var m = 0; m <= 90; m++) {
					var th2 = (m / 90) * Math.PI * 2;
					var q = projFn(phi2, th2);
					if (prev2) {
						var d2 = (prev2.depth + q.depth) / 2;
						ctx.beginPath();
						ctx.strokeStyle = 'rgba(160, 230, 255, ' + (0.20 + d2 * 0.72).toFixed(3) + ')';
						ctx.lineWidth = 0.7 + d2 * 1.2;
						ctx.moveTo(prev2.x, prev2.y); ctx.lineTo(q.x, q.y); ctx.stroke();
					}
					prev2 = q;
				}
			}
		}

		strokeSegs(projectTop);
		strokeSegs(projectBottom);

		ctx.beginPath(); ctx.ellipse(cx, topBaseY, R, R * sinP, 0, 0, Math.PI * 2);
		ctx.strokeStyle = 'rgba(180, 235, 255, 0.75)'; ctx.lineWidth = 1.4; ctx.stroke();
		ctx.beginPath(); ctx.ellipse(cx, bottomBaseY, R, R * sinP, 0, 0, Math.PI * 2);
		ctx.strokeStyle = 'rgba(180, 235, 255, 0.75)'; ctx.lineWidth = 1.4; ctx.stroke();

		var pulse = 0.90 + Math.sin(time * 1.4) * 0.10;
		ctx.beginPath(); ctx.ellipse(cx, topBaseY, R, R * sinP, 0, 0, Math.PI);
		ctx.strokeStyle = 'rgba(230, 250, 255, ' + pulse.toFixed(3) + ')';
		ctx.lineWidth = 3.0; ctx.shadowColor = 'rgba(0, 220, 255, 1)'; ctx.shadowBlur = 32; ctx.stroke();
		ctx.beginPath(); ctx.ellipse(cx, bottomBaseY, R, R * sinP, 0, Math.PI, Math.PI * 2);
		ctx.strokeStyle = 'rgba(230, 250, 255, ' + pulse.toFixed(3) + ')';
		ctx.lineWidth = 3.0; ctx.stroke(); ctx.shadowBlur = 0;

		var topY = topBaseY - R * cosP;
		ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,1)';
		ctx.shadowColor = 'rgba(0, 220, 255, 1)'; ctx.shadowBlur = 24;
		ctx.arc(cx, topY, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

		var botY = bottomBaseY + R * cosP;
		ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,1)';
		ctx.shadowColor = 'rgba(0, 220, 255, 1)'; ctx.shadowBlur = 24;
		ctx.arc(cx, botY, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

		requestAnimationFrame(draw);
	}
	draw();
};

/* ============ ECharts 初始化 ============ */
window.initCharts = function() {
	var ids  = ['cityChart','behaviorFunnelChart','platformChart','categoryChart','brandChart'];
	var keys = ['city','behavior','platform','category','brand'];
	ids.forEach(function(id, i) {
		var el = document.getElementById(id);
		if (el) window.charts[keys[i]] = echarts.init(el);
	});
};

/* ============ 用户信息（性别环 + 会员等级环 + 年龄柱） ============ */
window.renderProfile = function() {
	$.when(
		$.ajax({ url: window.API.gender, dataType: 'json', cache: false }),
		$.ajax({ url: window.API.age,    dataType: 'json', cache: false }),
		$.ajax({ url: window.API.level,  dataType: 'json', cache: false })
	).done(function(gRes, aRes, lRes) {
		var gRows = (gRes[0] && gRes[0].data) || [];
		var aRows = (aRes[0] && aRes[0].data) || [];
		var lRows = (lRes[0] && lRes[0].data) || [];

		gRows.forEach(function(r) {
			var k = String(r.gender || '未知');
			var v = window.num(r.order_cnt);
			if (v > 0) window.globalState.genderMap[k] = (window.globalState.genderMap[k] || 0) + v;
		});
		aRows.forEach(function(r) {
			var k = String(r.age_group || '未知');
			var v = window.num(r.order_cnt);
			if (v > 0) window.globalState.ageMap[k] = (window.globalState.ageMap[k] || 0) + v;
		});
		lRows.forEach(function(r) {
			var k = String(r.user_level || '未知');
			var v = window.num(r.order_cnt);
			if (v > 0) window.globalState.levelMap[k] = (window.globalState.levelMap[k] || 0) + v;
		});

		var host = document.getElementById('profileChart');
		if (!host) return;

		if (!host.dataset.built) {
			host.dataset.built = '1';
			host.style.display = 'flex';
			host.style.flexDirection = 'column';
			host.innerHTML =
				'<div style="display:flex;width:100%;height:46%;min-height:0;">' +
				'<div id="pfGender" style="flex:1;min-width:0;"></div>' +
				'<div id="pfLevel"  style="flex:1;min-width:0;"></div>' +
				'</div>' +
				'<div id="pfAge" style="width:100%;height:54%;min-height:0;"></div>';
			window.charts.pfGender = echarts.init(document.getElementById('pfGender'));
			window.charts.pfLevel  = echarts.init(document.getElementById('pfLevel'));
			window.charts.pfAge    = echarts.init(document.getElementById('pfAge'));
		}

		var male   = window.globalState.genderMap['男'] || 0;
		var female = window.globalState.genderMap['女'] || 0;
		var gTotal = male + female || 1;
		var malePct   = Math.round(male / gTotal * 100);
		var femalePct = 100 - malePct;
		var gMale   = window.SOFT_PAIRS[1];
		var gFemale = window.SOFT_PAIRS[3];

		window.charts.pfGender.setOption({
			animationDuration: 1000,
			tooltip: { trigger: 'item', confine: true, formatter: '{b}: {c} ({d}%)',
				backgroundColor: 'rgba(4,14,34,0.95)', borderColor: '#38bdf8',
				textStyle: { color: '#fff', fontSize: 12 } },
			title: { text: '性别分布', left: 'center', top: 2,
				textStyle: { color: '#a9d6ff', fontSize: 11, fontWeight: 'normal' } },
			graphic: [
				{ type: 'text', left: 'center', top: '34%',
					style: { text: '♂ ' + malePct + '%', fill: gMale.l, fontSize: 13, fontWeight: 'bold', textAlign: 'center' } },
				{ type: 'text', left: 'center', top: '54%',
					style: { text: '♀ ' + femalePct + '%', fill: gFemale.l, fontSize: 13, fontWeight: 'bold', textAlign: 'center' } }
			],
			series: [{
				type: 'pie', radius: ['52%', '72%'], center: ['50%', '56%'],
				startAngle: 90, clockwise: true,
				label: { show: false }, labelLine: { show: false },
				itemStyle: { borderColor: '#01040c', borderWidth: 3 },
				data: [
					{ value: male, name: '男', itemStyle: { color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.85, [
								{ offset: 0, color: gMale.l }, { offset: 0.7, color: gMale.l }, { offset: 1, color: gMale.d } ]) } },
					{ value: female, name: '女', itemStyle: { color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.85, [
								{ offset: 0, color: gFemale.l }, { offset: 0.7, color: gFemale.l }, { offset: 1, color: gFemale.d } ]) } }
				]
			}]
		});

		var levelPalette = [
			{ l: '#adcefb', d: '#6aa8c6' },
			{ l: '#fbad4c', d: '#5cb8ac' },
			{ l: '#0291f0', d: '#68c08c' },
			{ l: '#f75d84', d: '#90bc74' },
			{ l: '#874ce2', d: '#acc074' },
			{ l: '#3fd7dc', d: '#c4bc7c' },
			{ l: '#f48668', d: '#ccb078' }
		];

		var levelKeys = Object.keys(window.globalState.levelMap);
		var levelArr = levelKeys.map(function(k, i) {
			var pair = levelPalette[i % levelPalette.length];
			return {
				name: k, value: window.globalState.levelMap[k],
				itemStyle: { color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.85, [
						{ offset: 0, color: pair.l }, { offset: 0.55, color: pair.l }, { offset: 1, color: pair.d } ]) }
			};
		});

		window.charts.pfLevel.setOption({
			animationDuration: 1000,
			tooltip: { trigger: 'item', confine: true, formatter: '{b}: {c} ({d}%)',
				backgroundColor: 'rgba(4,14,34,0.95)', borderColor: '#38bdf8',
				textStyle: { color: '#fff', fontSize: 12 } },
			title: { text: '会员等级', left: 'center', top: 2,
				textStyle: { color: '#a9d6ff', fontSize: 11, fontWeight: 'normal' } },
			legend: { bottom: 0, left: 'center', itemWidth: 7, itemHeight: 7, itemGap: 8,
				textStyle: { color: '#d6ecff', fontSize: 10, fontWeight: 'bold' } },
			series: [{
				type: 'pie', radius: ['46%', '66%'], center: ['50%', '46%'],
				startAngle: 90, clockwise: true,
				label: { show: false }, labelLine: { show: false },
				itemStyle: { borderColor: '#01040c', borderWidth: 3 },
				data: levelArr
			}]
		});

		var ageArr = Object.keys(window.globalState.ageMap).map(function(k) {
			return { name: k, value: window.globalState.ageMap[k] };
		});
		ageArr.sort(function(a, b) { return String(a.name).localeCompare(String(b.name)); });

		window.charts.pfAge.setOption({
			animationDuration: 1000,
			grid: { left: 6, right: 10, top: 22, bottom: 4, containLabel: true },
			tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
				backgroundColor: 'rgba(4,14,34,0.95)', borderColor: '#38bdf8',
				textStyle: { color: '#fff', fontSize: 12 } },
			title: { text: '年龄分布', left: 'center', top: 0,
				textStyle: { color: '#a9d6ff', fontSize: 11, fontWeight: 'normal' } },
			xAxis: { type: 'category', data: ageArr.map(function(d) { return d.name; }),
				axisLine: { lineStyle: { color: 'rgba(56, 189, 248, 0.3)' } },
				axisTick: { show: false },
				axisLabel: { color: '#8ab4f8', fontSize: 10 } },
			yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false },
				axisLabel: { show: true, color: '#8ab4f8', fontSize: 9 },
				splitLine: { lineStyle: { color: 'rgba(56, 189, 248, 0.1)', type: 'dashed' } } },
			series: [{
				type: 'bar', barWidth: 16,
				data: ageArr.map(function(d, i) {
					var pair = window.SOFT_PAIRS[i % window.SOFT_PAIRS.length];
					return { value: d.value, itemStyle: {
							color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
								{ offset: 0, color: pair.l }, { offset: 1, color: pair.d } ]),
							borderRadius: [4, 4, 0, 0] } };
				}),
				label: { show: true, position: 'top', color: '#bfe6ff', fontSize: 10, fontWeight: 'bold',
					formatter: function(p) { return window.fmt(p.value, 0); } }
			}]
		});
	});
};

/* ============ 玫瑰图（商品品类 · 独立色板） ============ */
window.renderCategoryRose = function(rows) {
	if (!window.charts.category) return;
	if (!rows || !rows.length) { window.charts.category.clear(); return; }
	rows.forEach(function (r) {
		var k = String(r.category || '未知');
		var v = window.num(r.gmv);
		if (v > 0) window.globalState.categoryMap[k] = (window.globalState.categoryMap[k] || 0) + v;
	});
	var arr = Object.keys(window.globalState.categoryMap).map(function(k) {
		return { name: k, value: window.globalState.categoryMap[k] };
	});
	arr.sort(function (a, b) { return b.value - a.value; });
	arr = arr.slice(0, 8);

	var rosePalette = [
		{ l: '#f1e434', d: '#6aa8c6' },
		{ l: '#7fc9c2', d: '#5cb8ac' },
		{ l: '#30beb3', d: '#68c08c' },
		{ l: '#f56286', d: '#90bc74' },
		{ l: '#f57965', d: '#acc074' },
		{ l: '#3fd7dc', d: '#c4bc7c' },
		{ l: '#01a7f0', d: '#ccb078' },
		{ l: '#aa61ef', d: '#8c2857' }
	];

	var data = arr.map(function(d, i) {
		var pair = rosePalette[i % rosePalette.length];
		return {
			name: d.name, value: d.value,
			itemStyle: {
				color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.85, [
					{ offset: 0, color: pair.l }, { offset: 0.55, color: pair.l }, { offset: 1, color: pair.d } ]),
				borderColor: 'rgba(4, 14, 34, 0.85)', borderWidth: 1.5, borderRadius: 2,
				shadowBlur: 10, shadowColor: 'rgba(56, 189, 248, 0.20)'
			}
		};
	});

	window.charts.category.setOption({
		animationDuration: 1500,
		tooltip: { trigger: 'item', confine: true, formatter: '{b}<br/>{c} ({d}%)',
			backgroundColor: 'rgba(4,14,34,0.95)', borderColor: '#38bdf8',
			textStyle: { color: '#fff', fontSize: 12 } },
		legend: { bottom: 0, left: 'center', itemWidth: 8, itemHeight: 8, itemGap: 8,
			textStyle: { color: '#cfe0f5', fontSize: 9 }, type: 'scroll' },
		series: [{
			type: 'pie', radius: ['10%', '52%'], center: ['50%', '44%'], roseType: 'radius',
			label: { show: true, formatter: '{d}%', color: '#cfe8ff', fontSize: 11, fontWeight: 'bold' },
			labelLine: { show: true, length: 8, length2: 10,
				lineStyle: { color: 'rgba(125, 211, 252, 0.55)' } },
			data: data
		}]
	});

	window.updateKPI();
};

/* ============ 用户行为转化（全息椭圆堆叠 · 百分比居中 · 右侧引线文字） ============ */
window.renderBehaviorFunnel = function(rows) {
	if (!window.charts.behavior) return;
	if (!rows || !rows.length) { window.charts.behavior.clear(); return; }
	rows.forEach(function (r) {
		var s = String(r.behavior_stage || '未知');
		var v = window.num(r.user_cnt);
		if (v > 0) window.globalState.funnelMap[s] = (window.globalState.funnelMap[s] || 0) + v;
	});
	var order = ['浏览', '加购', '收藏', '下单', '支付', '评价', '分享'];
	var arr = order.map(function(k) {
		return { name: k, value: window.globalState.funnelMap[k] || 0 };
	}).filter(function(d) { return d.value > 0; });

	if (!arr.length) { window.charts.behavior.clear(); return; }

	var n = arr.length;
	var vMax = 0;
	arr.forEach(function(d) { if (d.value > vMax) vMax = d.value; });
	if (vMax <= 0) vMax = 1;

	/* ===== 转化率基准：以「浏览」为 100%，没有浏览就用第一层 ===== */
	var vBase = 0;
	for (var bi = 0; bi < arr.length; bi++) {
		if (arr[bi].name === '浏览') { vBase = arr[bi].value; break; }
	}
	if (vBase <= 0) vBase = arr[0].value || 1;

	function rateOf(v) { return (v / vBase * 100); }
	/* =========================================================== */

	var funnelPalette = ['#3dd9f0','#22e0c0','#7fe0a0','#c8e878','#eac868','#f09070','#c070e0'];

	window.charts.behavior.setOption({
		animationDuration: 900,
		animationDurationUpdate: 900,
		tooltip: {
			trigger: 'item',
			formatter: function(p) {
				var d = arr[p.dataIndex];
				if (!d) return '';
				var rate = rateOf(d.value).toFixed(1);
				return d.name + '<br/>用户数：' + window.fmt(d.value, 0) + '<br/>转化率：' + rate + '%';
			},
			backgroundColor: 'rgba(4,14,34,0.95)', borderColor: '#22e0f0',
			textStyle: { color: '#fff', fontSize: 12 }
		},
		xAxis: { type: 'value', show: false, min: 0, max: 100 },
		yAxis: { type: 'value', show: false, min: 0, max: 100 },
		series: [{
			type: 'custom',
			renderItem: function(params, api) {
				var idx = params.dataIndex;
				var chartW = window.charts.behavior.getWidth();
				var chartH = window.charts.behavior.getHeight();
				var d = arr[idx];
				var color = funnelPalette[idx % funnelPalette.length];
				var pct = rateOf(d.value).toFixed(1);

				var cx = chartW * 0.30, yTop = chartH * 0.12, yBot = chartH * 0.90;
				var wMax = chartW * 0.19, flat = 0.40, textX = chartW * 0.62;
				var step = n > 1 ? (yBot - yTop) / (n - 1) : 0;
				var cy = yTop + idx * step;
				var ratio = d.value / vMax;
				var rx = wMax * (0.55 + 0.45 * ratio);
				var ry = rx * flat;

				var children = [];
				children.push({ type: 'ellipse',
					shape: { cx: cx, cy: cy, rx: rx * 1.16, ry: ry * 1.16 },
					style: { fill: 'transparent', stroke: color, lineWidth: 1, lineDash: [4, 4], opacity: 0.45 }, z: 1 });
				children.push({ type: 'ellipse',
					shape: { cx: cx, cy: cy, rx: rx, ry: ry },
					style: { fill: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
							{ offset: 0, color: color + '55' },
							{ offset: 0.65, color: color + '22' },
							{ offset: 1, color: color + '08' } ]),
						stroke: color, lineWidth: 1.6, shadowBlur: 14, shadowColor: color }, z: 2 });
				children.push({ type: 'ellipse',
					shape: { cx: cx, cy: cy, rx: rx * 0.55, ry: ry * 0.55 },
					style: { fill: 'transparent', stroke: color, lineWidth: 0.8, opacity: 0.65 }, z: 3 });
				children.push({ type: 'text',
					style: { text: pct + '%', fill: '#ffffff', fontSize: 13, fontWeight: 'bold',
						textAlign: 'center', textVerticalAlign: 'middle',
						textShadowBlur: 10, textShadowColor: color },
					position: [cx, cy], z: 5 });
				children.push({ type: 'polyline',
					shape: { points: [[cx + rx * 1.16, cy], [textX - 10, cy], [textX, cy]] },
					style: { stroke: color, lineWidth: 1, opacity: 0.7 }, z: 4 });
				children.push({ type: 'circle',
					shape: { cx: cx + rx * 1.16, cy: cy, r: 2.4 },
					style: { fill: color, shadowBlur: 6, shadowColor: color }, z: 5 });
				children.push({ type: 'text',
					style: { text: d.name + '  ' + window.fmt(d.value, 0), fill: '#ffffff', fontSize: 12,
						fontWeight: 'bold', textAlign: 'left', textVerticalAlign: 'middle',
						textShadowBlur: 6, textShadowColor: 'rgba(0, 0, 0, 0.9)' },
					position: [textX + 6, cy], z: 5 });

				return { type: 'group', children: children };
			},
			data: arr.map(function(d, i) { return [i, d.value]; }),
			z: 3
		}]
	});
};

/* ============ 平台交易对比（真圆柱 · 柱体变细 · 柱顶数值） ============ */
/* ============ 平台交易对比（真圆柱 · 柱体变细 · 整体下移 · 大小不变） ============ */
/* ============ 平台交易对比（电池形状 · 正极凸起 + 电量分格 + 发光） ============ */
/* ============ 平台交易对比（电池形状 · 正极凸起 + 电量分格 + 发光） ============ */
/* ============ 平台交易对比（彩色立体柱 · 三面明暗 + 独立配色） ============ */
window.renderPlatform = function(rows) {
	if (!window.charts.platform) return;

	/* ====== 固定平台列表：三个平台始终显示，值为 0 也占位 ====== */
	var PLATFORM_LIST = ['抖音', '京东', '淘宝'];

	/* 接口有数据就累加到 platformMap */
	if (rows && rows.length) {
		rows.forEach(function (r) {
			var k = String(r.platform_name || '').trim();
			var v = window.num(r.gmv);
			if (k && v > 0) {
				window.globalState.platformMap[k] = (window.globalState.platformMap[k] || 0) + v;
			}
		});
	}

	/* 按固定列表取数，没数据的补 0 */
	var arr = PLATFORM_LIST.map(function (k) {
		return { name: k, value: window.globalState.platformMap[k] || 0 };
	});

	/* ★ 按数值降序排序：谁 GMV 高谁排第一 ★ */
	arr.sort(function (a, b) { return b.value - a.value; });

	var names  = arr.map(function (d) { return d.name; });
	var values = arr.map(function (d) { return d.value; });

	/* ====== 平台独立色板（每平台一组：front 正面 / side 右侧暗 / top 顶面亮） ======
	   要改色就改这 5 行，互不影响；按排名顺序取色 */
	var platformPalettes = [
		{ front: '#ff6b9d', side: '#a83a64', top: '#ffa8c8' },   /* 粉 */
		{ front: '#ffa940', side: '#b87220', top: '#ffc878' },   /* 橙 */
		{ front: '#40c4ff', side: '#1a7fb3', top: '#80daff' },   /* 蓝 */
		{ front: '#7dd87d', side: '#4a9a4a', top: '#b0eab0' },   /* 绿 */
		{ front: '#b388ff', side: '#7048c8', top: '#d8b8ff' }    /* 紫 */
	];
	/* ======================================================================== */

	var BODY_W = 44;    /* 正面宽度 */
	var DX = 11;        /* 立体向右偏移 */
	var DY = -9;        /* 立体向上偏移 */

	function shortNum(v) {
		var n = window.num(v);
		if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿';
		if (n >= 10000)     return (n / 10000).toFixed(1) + '万';
		return window.fmt(n, 0);
	}

	window.charts.platform.setOption({
		animationDuration: 1200,
		animationDurationUpdate: 1200,
		grid: { left: 40, right: 40, top: 72, bottom: 4 },
		tooltip: {
			trigger: 'item',
			formatter: function(p) {
				var idx = p.dataIndex;
				if (idx == null) return '';
				return names[idx] + '<br/>GMV：' + window.fmt(values[idx], 0) + '<br/>排名：第 ' + (idx + 1) + ' 名';
			},
			backgroundColor: 'rgba(4,14,34,0.95)', borderColor: '#22d3ee',
			textStyle: { color: '#fff', fontSize: 12 }
		},
		xAxis: { type: 'category', data: names,
			axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false } },
		yAxis: { type: 'value', show: false,
			axisLabel: { show: false }, axisLine: { show: false },
			axisTick: { show: false }, splitLine: { show: false }, splitArea: { show: false },
			max: function(v) { return Math.max(v.max * 1.15, 10); } },
		series: [{
			type: 'custom',
			renderItem: function(params, api) {
				var idx = params.dataIndex;
				var v   = api.value(1);
				var top = api.coord([api.value(0), v]);
				var bot = api.coord([api.value(0), 0]);
				var cx = top[0];
				var yT = top[1];
				var yB = bot[1];

				/* 值为 0 的柱给最小高度 8px */
				if (v <= 0) yT = yB - 8;

				var halfW = BODY_W / 2;
				var pal = platformPalettes[idx % platformPalettes.length];

				var frontPath = 'M' + (cx - halfW) + ',' + yT +
					' L' + (cx + halfW) + ',' + yT +
					' L' + (cx + halfW) + ',' + yB +
					' L' + (cx - halfW) + ',' + yB + ' Z';

				var sidePath = 'M' + (cx + halfW) + ',' + yT +
					' L' + (cx + halfW + DX) + ',' + (yT + DY) +
					' L' + (cx + halfW + DX) + ',' + (yB + DY) +
					' L' + (cx + halfW) + ',' + yB + ' Z';

				var topPath = 'M' + (cx - halfW) + ',' + yT +
					' L' + (cx + halfW) + ',' + yT +
					' L' + (cx + halfW + DX) + ',' + (yT + DY) +
					' L' + (cx - halfW + DX) + ',' + (yT + DY) + ' Z';

				var children = [];

				children.push({
					type: 'path', shape: { pathData: sidePath },
					style: {
						fill: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
							{ offset: 0, color: pal.front },
							{ offset: 1, color: pal.side }
						]),
						stroke: pal.side, lineWidth: 1
					}, z: 1
				});

				children.push({
					type: 'path', shape: { pathData: frontPath },
					style: {
						fill: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{ offset: 0,    color: pal.top },
							{ offset: 0.35, color: pal.front },
							{ offset: 1,    color: pal.side }
						]),
						stroke: pal.top, lineWidth: 1,
						shadowBlur: 16, shadowColor: pal.front
					}, z: 2
				});

				children.push({
					type: 'path', shape: { pathData: topPath },
					style: {
						fill: pal.top, stroke: pal.top, lineWidth: 1,
						shadowBlur: 12, shadowColor: pal.top
					}, z: 3
				});

				/* 排名数字 = 当前索引 + 1（因为已经排序过） */
				children.push({
					type: 'text',
					style: {
						text: String(idx + 1),
						fill: '#ffffff', fontSize: 24, fontWeight: 'bold',
						textAlign: 'center', textVerticalAlign: 'middle',
						textShadowBlur: 10, textShadowColor: 'rgba(0,0,0,0.65)'
					},
					position: [cx, (yT + yB) / 2]
				});

				children.push({
					type: 'text',
					style: {
						text: names[idx],
						fill: pal.top, fontSize: 12, fontWeight: 'bold',
						textAlign: 'center', textVerticalAlign: 'bottom',
						textShadowBlur: 8, textShadowColor: pal.front
					},
					position: [cx + DX / 2, yT + DY - 24]
				});

				children.push({
					type: 'text',
					style: {
						text: shortNum(values[idx]),
						fill: '#ffffff', fontSize: 14, fontWeight: 'bold',
						textAlign: 'center', textVerticalAlign: 'bottom',
						textShadowBlur: 10, textShadowColor: pal.front
					},
					position: [cx + DX / 2, yT + DY - 6]
				});

				return { type: 'group', children: children };
			},
			data: arr.map(function(d, i) { return [i, d.value]; }),
			z: 3
		}]
	});

	window.updateKPI();
};

/* ============ 商品品牌分析（雷达图 · 蓝网格 + 青色面 + 顶点白心青圈） ============ */
/* ============ 商品品牌分析（雷达图 · 橙色发光 · 蓝网格 + 顶点白心橙圈） ============ */
window.renderBrandRadar = function(rows) {
	if (!window.charts.brand) return;
	if (!rows || !rows.length) { window.charts.brand.clear(); return; }

	rows.forEach(function (r) {
		var k = String(r.brand || '未知');
		var v = window.num(r.gmv);
		if (v > 0) window.globalState.brandMap[k] = (window.globalState.brandMap[k] || 0) + v;
	});

	var arr = Object.keys(window.globalState.brandMap).map(function(k) {
		return { name: k, value: window.globalState.brandMap[k] };
	});
	arr.sort(function (a, b) { return b.value - a.value; });
	arr = arr.slice(0, 8);

	var maxV = 0;
	arr.forEach(function(d) { if (d.value > maxV) maxV = d.value; });
	maxV = maxV * 1.15 || 1;

	var indicator = arr.map(function(d) { return { name: d.name, max: maxV }; });
	var values = arr.map(function(d) { return d.value; });

	var chartW = window.charts.brand.getWidth()  || 300;
	var chartH = window.charts.brand.getHeight() || 200;
	var cxPx = chartW * 0.50;
	var cyPx = chartH * 0.52;
	var Rmax = Math.min(chartW, chartH) * 0.30;
	var n = arr.length;

	var graphics = [];
	arr.forEach(function(d, i) {
		var phi = -i * 2 * Math.PI / n;
		var r = Rmax * (d.value / maxV);
		var px = cxPx + r * Math.sin(phi);
		var py = cyPx - r * Math.cos(phi);

		/* 橙色外柔光 */
		graphics.push({ type: 'circle', left: px - 6.5, top: py - 6.5, shape: { r: 6.5 },
			style: { fill: 'rgba(255, 154, 60, 0.32)' }, z: 100 });
		/* 橙色实心圈 */
		graphics.push({ type: 'circle', left: px - 3.4, top: py - 3.4, shape: { r: 3.4 },
			style: { fill: '#ff9a3c' }, z: 101 });
		/* 白心 */
		graphics.push({ type: 'circle', left: px - 1.4, top: py - 1.4, shape: { r: 1.4 },
			style: { fill: '#ffffff' }, z: 102 });
	});

	window.charts.brand.setOption({
		animationDuration: 900,
		animationDurationUpdate: 900,
		tooltip: { trigger: 'item', confine: true,
			backgroundColor: 'rgba(4,14,34,0.95)', borderColor: '#ff9a3c',
			textStyle: { color: '#fff', fontSize: 12 } },
		graphic: graphics,
		radar: {
			center: ['50%', '52%'], radius: '60%',
			splitNumber: 5, shape: 'polygon',
			indicator: indicator,
			axisName: {
				formatter: function(name) {
					var idx = -1, val = 0;
					for (var i = 0; i < arr.length; i++) {
						if (arr[i].name === name) { idx = i; val = arr[i].value; break; }
					}
					if (idx < 0) return name;
					return '{n|' + (idx + 1) + '. ' + name + '}\n{v|' + window.fmt(val, 0) + '}';
				},
				rich: {
					/* 名称保持蓝，数值换成橙 */
					n: { color: '#7fb3e8', fontSize: 10, fontWeight: 'bold', lineHeight: 15, align: 'center' },
					v: { color: '#ffb347', fontSize: 12, fontWeight: 'bold', lineHeight: 17, align: 'center' }
				},
				padding: [0, 0]
			},
			/* 网格保持蓝（衬底），也可以改橙 */
			axisLine:  { lineStyle: { color: 'rgba(74, 130, 200, 0.60)', width: 1 } },
			splitLine: { lineStyle: { color: 'rgba(74, 130, 200, 0.55)', width: 1 } },
			splitArea: { show: false }
		},
		series: [{
			type: 'radar',
			symbol: 'none',
			lineStyle: {
				color: '#ff9a3c',
				width: 2,
				shadowBlur: 14,
				shadowColor: 'rgba(255, 154, 60, 0.95)'
			},
			itemStyle: { color: '#ff9a3c' },
			areaStyle: {
				color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
					{ offset: 0, color: 'rgba(255, 140, 50, 0.42)' },
					{ offset: 1, color: 'rgba(255, 180, 80, 0.60)' }
				])
			},
			data: [{ value: values, name: '品牌 GMV' }]
		}]
	});

	window.updateKPI();
};

/* ============ 城市交易额排行（竖向柱 · 底部发光 · 顶部橙亮） ============ */
/* ============ 平台交易对比（真圆柱 · 柱体变细 · 整体下移 · 大小不变） ============ */
/* ============ 城市交易额排行（竖向柱 · 底部发光 · 顶部橙亮） ============ */
/* ============ 城市交易额排行（竖向柱 · 底部发光 · 顶部橙亮） ============ */
/* ============ 城市交易额排行（竖向柱 · 底部发光 · 顶部橙亮） ============ */
/* ============ 城市交易额排行（竖向柱 · 底部发光 · 顶部橙亮） ============ */
window.renderRankBar = function(chartKey, map, rows, field, valueField, topN) {
	if (!window.charts[chartKey]) return;
	if (!rows || !rows.length) { window.charts[chartKey].clear(); return; }
	rows.forEach(function (r) {
		var k = String(r[field] || '未知');
		var v = window.num(r[valueField]);
		if (v > 0) map[k] = (map[k] || 0) + v;
	});
	var arr = Object.keys(map).map(function(k) { return { name: k, value: map[k] }; });
	arr.sort(function(a, b) { return String(a.name).localeCompare(String(b.name)); });
	arr = arr.slice(0, topN || 10);

	var names  = arr.map(function(d) { return d.name; });
	var values = arr.map(function(d) { return d.value; });
	var vMax = 0;
	values.forEach(function(v) { if (v > vMax) vMax = v; });
	if (vMax <= 0) vMax = 1;

	function shortNum(v) {
		var n = window.num(v);
		if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿';
		if (n >= 10000)     return (n / 10000).toFixed(1) + '万';
		return window.fmt(n, 0);
	}

	window.charts[chartKey].setOption({
		animationDuration: 900,
		animationDurationUpdate: 700,
		grid: { left: 0, right: 0, top: 28, bottom: 2, containLabel: true },
		tooltip: {
			trigger: 'axis', axisPointer: { type: 'shadow' },
			formatter: function(p) { var d = p[0]; return d.name + '<br/>' + window.fmt(d.value, 0); },
			backgroundColor: 'rgba(4,14,34,0.95)', borderColor: '#38bdf8',
			textStyle: { color: '#fff', fontSize: 12 }
		},
		xAxis: { type: 'category', data: names, axisTick: { show: false },
			axisLine: { lineStyle: { color: 'rgba(56, 189, 248, 0.35)' } },
			axisLabel: { color: '#8ab4f8', fontSize: 10, interval: 0 } },
		yAxis: { type: 'value', show: false,
			axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false },
			splitLine: { show: false }, splitArea: { show: false }, max: vMax * 1.0 },
		series: [
			/* ① 底层：柱脚光晕 */
			{
				type: 'bar',
				barCategoryGap: '55%',        /* 关键①：柱子更细 */
				barGap: '-100%',
				silent: true,
				z: 1,
				itemStyle: {
					color: 'rgba(0, 0, 0, 0)',
					borderRadius: [3, 3, 0, 0],
					shadowBlur: 32,
					shadowColor: 'rgba(90, 190, 255, 1)',
					shadowOffsetY: 10
				},
				data: values
			},
			/* ② 上层：主柱（底青 → 中白 → 顶橙，经过白桥接所以过渡自然） */
			{
				type: 'bar',
				barCategoryGap: '55%',        /* 关键①：和光晕柱一致 */
				z: 2,
				data: values.map(function(v) {
					return {
						value: v,
						itemStyle: {
							color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
								{ offset: 0,    color: 'rgba(110, 200, 250, 0.95)' },  /* 底：亮青 */
								{ offset: 0.30, color: 'rgba(140, 205, 245, 0.85)' },
								{ offset: 0.55, color: 'rgba(200, 220, 235, 0.90)' },  /* 中：接近白（桥接色） */
								{ offset: 0.72, color: 'rgba(245, 210, 175, 0.95)' },
								{ offset: 0.88, color: 'rgba(255, 195, 105, 1.00)' },
								{ offset: 1,    color: 'rgba(255, 205, 115, 1.00)' }   /* 顶：亮橙 */
							]),
							borderColor: 'rgba(180, 230, 255, 0.65)',
							borderWidth: 1,
							borderRadius: [3, 3, 0, 0],
							shadowBlur: 18,
							shadowColor: 'rgba(140, 210, 255, 0.75)',
							shadowOffsetY: 6
						}
					};
				}),
				label: { show: true, position: 'top', color: '#ffffff', fontSize: 10, fontWeight: 'bold',
					formatter: function(p) { return shortNum(p.value); },
					textShadowBlur: 10, textShadowColor: 'rgba(80, 180, 255, 0.95)' }
			}
		]
	});
};
/* ============ KPI（球体上的三个数字） ============ */
window.updateKPI = function() {
	var totalGmv = 0;
	Object.keys(window.globalState.categoryMap).forEach(function(k) {
		totalGmv += window.globalState.categoryMap[k];
	});
	var totalOrder = window.globalState.funnelMap['下单'] || 0;
	var totalUser  = window.globalState.funnelMap['浏览'] || 0;

	var elGmv   = document.getElementById('kpiGmv');
	var elOrder = document.getElementById('kpiOrder');
	var elUser  = document.getElementById('kpiUser');
	if (elGmv)   elGmv.textContent   = window.fmt(totalGmv, 0);
	if (elOrder) elOrder.textContent = window.fmt(totalOrder, 0);
	if (elUser)  elUser.textContent  = window.fmt(totalUser, 0);
};

window.renderCity = function(rows) {
	window.renderRankBar('city', window.globalState.cityMap, rows, 'city', 'gmv', 10);
};
window.renderCity = function(rows) {
	window.renderRankBar('city', window.globalState.cityMap, rows, 'city', 'gmv', 10);
};

window.refreshAll = function() {
	window.renderProfile();
	window.get(window.API.city,     window.renderCity);
	window.get(window.API.category, window.renderCategoryRose);
	window.get(window.API.brand,    window.renderBrandRadar);
	window.get(window.API.funnel,   window.renderBehaviorFunnel);
	window.get(window.API.platform, window.renderPlatform);
};

$(function () {
	if (typeof echarts === 'undefined') { alert('echarts.js 未加载成功'); return; }
	window.initCharts();
	window.initGlobe();
	window.refreshAll();
	setInterval(window.refreshAll, 2000);
});

var __rt = null;
window.addEventListener('resize', function () {
	clearTimeout(__rt);
	__rt = setTimeout(function () {
		Object.keys(window.charts).forEach(function (k) { if (window.charts[k]) window.charts[k].resize(); });
	}, 150);
});