
Ptero.Crater.TimePane = function(w,h,maxTime) {
	this.pixelW = w;
	this.pixelH = h;
	this.maxTime = maxTime;
	this.minTime = 0.25;

	this.timeStartX = 100;
	this.timeEndX = this.pixelW - 50;
	this.timeLenX = this.timeEndX - this.timeStartX;
	this.timeY = this.pixelH / 2;

	this.nodeRadius = 4;
};

Ptero.Crater.TimePane.prototype = {

	/* COORDINATE FUNCTIONS */

	getY: function(model) {
		var len = Ptero.Crater.enemy_model_list.models.length;
		var y;
		if (len == 1) {
			y = 0;
		}
		else {
			y = model.order / (len-1) - 0.5;
			y = -y;
		}
		return y;
	},

	screenToTime: function(x,y) {
		var t = (x - this.timeStartX) / this.timeLenX;
		t = Math.max(0,t);
		t = Math.min(1,t);
		t *= this.maxTime;
		return t;
	},

	timeToScreen: function(t) {
		return {
			x: t/this.maxTime*this.timeLenX + this.timeStartX,
			y: this.timeY,
		};
	},

	/* INPUT FUNCTIONS */

	getNodeInfoFromCursor: function(x,y) {
		var min_dist_sq = 100;
		var times = Ptero.Crater.enemy_model.times;
		var i,len = times.length;

		var node,pos;
		var dx,dy,dist_sq;
		var closest_index;
		var offset_x, offset_y;

		for (i=0; i<len; i++) {
			pos = this.timeToScreen(times[i]);
			pos.y = this.transform({t:0,y:this.getY(Ptero.Crater.enemy_model)}).y;
			dx = pos.x - x;
			dy = pos.y - y;
			dist_sq = dx*dx + dy*dy;
			if (dist_sq < min_dist_sq) {
				closest_index = i;
				min_dist_sq = dist_sq;
				offset_x = dx;
				offset_y = dy;
			}
		}

		return {
			index: closest_index,
			offset_x: offset_x,
			offset_y: offset_y,
		};
	},

	selectNode: function(index,offset_x,offset_y) {
		console.log(index);
		Ptero.Crater.enemy_model.selectPoint(index);
		this.selectedOffsetX = offset_x;
		this.selectedOffsetY = offset_y;
	},

	updateNodePosition: function(x,y) {
		var times = Ptero.Crater.enemy_model.times;
		var delta_times = Ptero.Crater.enemy_model.delta_times;
		var i = Ptero.Crater.enemy_model.selectedIndex;
		if (i == undefined) {
			return;
		}

		var time = this.screenToTime(
			x + this.selectedOffsetX,
			y + this.selectedOffsetY
		);

		times[i] = time;

		Ptero.Crater.enemy_model.refreshTimes();
		Ptero.Crater.enemy_model.refreshPath();

		Ptero.Crater.enemy_model_list.setTime(time);
	},

	mouseStart: function(x,y) {
		var i = this.getNodeInfoFromCursor(x,y);
		this.selectNode(i.index, i.offset_x, i.offset_y);
	},
	mouseMove: function(x,y) {
		this.updateNodePosition(x,y);
	},
	mouseEnd: function(x,y) {
	},


	/* PAINTER FUNCTIONS */

	transform: function(pos) {
		// Input: pos.t, pos.y
		var s = this.timeToScreen(pos.t);
		var y = pos.y;
		var result = {
			x: s.x,
			y: (-y * this.pixelH/2) + this.pixelH/2,
		};
		return result;
	},
	moveTo: function(ctx,pos) {
		var p = this.transform(pos);
		ctx.moveTo(p.x,p.y);
	},
	lineTo: function(ctx,pos) {
		var p = this.transform(pos);
		ctx.lineTo(p.x,p.y);
	},
	line: function(ctx, p1, p2) {
		ctx.beginPath();
		this.moveTo(ctx, p1);
		this.lineTo(ctx, p2);
		ctx.stroke();
	},
	lines: function(ctx, points) {
		var i,len;
		ctx.beginPath();
		this.moveTo(ctx, points[0]);
		for (i=1,len=points.length; i<len; i++) {
			this.lineTo(ctx, points[i]);
		}
		ctx.closePath();
		ctx.stroke();
	},
	fillCircle: function(ctx, spacePos, radius, color) {
		ctx.beginPath();
		var pos = this.transform(spacePos);
		ctx.arc(pos.x, pos.y, radius, 0, Math.PI*2);
		ctx.fillStyle = color;
		ctx.fill();
	},
	strokeCircle: function(ctx, spacePos, radius, color, thickness) {
		ctx.beginPath();
		var pos = this.transform(spacePos);
		ctx.arc(pos.x, pos.y, radius, 0, Math.PI*2);
		ctx.lineWidth = thickness;
		ctx.strokeStyle = color;
		ctx.stroke();
	},

	/* DRAWING FUNCTIONS */

	drawAxes: function(ctx) {
		ctx.strokeStyle = "#BBB";
		ctx.lineWidth = 1;

		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = '1em serif';
		ctx.fillStyle = "#777";
		var s = this.timeToScreen(0);
		ctx.fillText('time (s)', s.x/2, s.y);

		ctx.textBaseline = 'top';
		ctx.fillStyle = "#BBB";
		ctx.font = '0.8em serif';
		var h = 0.5;
		for (t=0; t<=this.maxTime; t++) {
			this.line(ctx,
				{t:t, y: h},
				{t:t, y: -h});
			s = this.transform({t:t, y: -h});
			ctx.fillText(t, s.x, s.y+5);
		}
	},

	drawModelPath: function(ctx, model) {
		ctx.strokeStyle = "#777";
		ctx.lineWidth = 2;
		var y = this.getY(model);
		this.line(ctx,
			{t:model.enemy.path.startTime, y:y},
			{t:model.enemy.path.totalTime, y:y});
	},

	drawModelNodes: function(ctx, model) {
		var isActive = (model == Ptero.Crater.enemy_model);
		var times = model.times;
		var delta_times = model.delta_times;
		var i,len = times.length;

		if (isActive) {
			var selectedIndex = model.selectedIndex;
			ctx.textBaseline = "bottom";
			ctx.textAlign = "center";
			var y = this.getY(model);
			for (i=0; i<len; i++) {
				if (selectedIndex != i) {
					this.fillCircle(ctx, {t:times[i], y:y}, this.nodeRadius, "#555",2);
				}
				if (i > 0 && model == Ptero.Crater.enemy_model) {
					var pos = this.transform({t:times[i-1]+delta_times[i]/2, y:y+0.1});
					ctx.fillText(delta_times[i].toFixed(2)+"s", pos.x, pos.y);
				}
			}
			var selectedPoint = model.getSelectedPoint();
			if (selectedPoint) {
				for (i=0; i<len; i++) {
					if (selectedIndex == i) {
						this.fillCircle(ctx, {t:times[i], y:y}, this.nodeRadius, "#F00",2);
					}
				}
			}
			else {
				this.fillCircle(ctx, {t:model.enemy.path.time, y:y}, this.nodeRadius, "#00F",2);
			}
		}
		else {
			if (model.enemy.getPosition()) {
				var y = this.getY(model);
				this.fillCircle(ctx, {t:model.enemy.path.time, y:y}, this.nodeRadius, "#555",2);
			}
		}
	},

	/* MAIN FUNCTIONS */

	draw: function(ctx) {
		ctx.fillStyle = "#EEE";
		ctx.fillRect(0,0,this.pixelW,this.pixelH);
		this.drawAxes(ctx);

		var models = Ptero.Crater.enemy_model_list.models;
		var i,len=models.length;
		var e;
		if (len > 1) {
			ctx.globalAlpha = 0.35;
			for (i=0; i<len; i++) {
				var e = models[i];
				if (e != Ptero.Crater.enemy_model) {
					this.drawModelPath(ctx, e);
					this.drawModelNodes(ctx, e);
				}
			}
			ctx.globalAlpha = 1;
		}

		e = Ptero.Crater.enemy_model;
		this.drawModelPath(ctx, e);
		this.drawModelNodes(ctx, e);
	},
	update: function(dt) {
	},
	init: function() {
	},
};
