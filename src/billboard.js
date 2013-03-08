// We try to remove the complexity of drawing a front-facing texture
// in the frustum by creating the notion of a "billboard".
// A billboard is a fixed-size rectangle that has a desired scale.
// All scales are relative to the background scale, since we use it
// to determine the aspect ratio of the game.

Ptero.Billboard = function(x,y,w,h,scale) {
	this.setCenter(x,y);
	this.setSize(w,h);
	this.scale = (scale == undefined) ? 1 : scale;
};

Ptero.Billboard.prototype = {
	setSize: function(w,h) {
		this.w = w;
		this.h = h;
	},
	setCenter: function(x,y) {
		this.centerX = x;
		this.centerY = y;
	},
	getSpaceRect: function(pos) {
		var frustum = Ptero.screen.getFrustum();
		var scale = this.scale * Ptero.background.getScale();
		scale /= Ptero.screen.getScreenToSpaceRatio();
		return {
			w: this.w * scale,
			h: this.h * scale,
			x: pos.x - this.centerX*scale,
			y: pos.y - this.centerY*scale,
			z: pos.z,
		};
	},
	getNearRect: function(pos) {
		var frustum = Ptero.screen.getFrustum();
		var scale = this.scale * Ptero.background.getScale();
		scale /= Ptero.screen.getScreenToSpaceRatio();
		scale = scale / pos.z * frustum.near;
		return {
			w: this.w * scale,
			h: this.h * scale,
			x: pos.x - this.centerX*scale,
			y: pos.y - this.centerY*scale,
			z: frustum.near,
		};
	},
	getScreenRect: function(pos) {
		var frustum = Ptero.screen.getFrustum();
		var screenPos = Ptero.screen.spaceToScreen(pos);
		var scale = this.scale * Ptero.background.getScale();
		scale = scale / pos.z * frustum.near;
		return {
			w: this.w * scale,
			h: this.h * scale,
			x: screenPos.x - this.centerX*scale,
			y: screenPos.y - this.centerY*scale,
		};
	},

	getRelativeCursor: function(x,y,pos) {
		var rect = this.getScreenRect(pos);
		var midx = rect.x + rect.w/2;
		var midy = rect.y + rect.h/2;
		x -= midx;
		y -= midy;
		var nx,ny;
		
		// (x+yi)(cos + isin)
		// (xcos + ixsin + iycos - ysin)
		if (pos.angle) {
			var c = Math.cos(-pos.angle);
			var s = Math.sin(-pos.angle);
			nx = x*c - y*s;
			ny = x*s + y*c;
		}
		else {
			nx = x;
			ny = y;
		}

		nx += rect.w/2;
		ny += rect.h/2;
		return {x:nx, y:ny};
	},

	isInsideScreenRect: function(x,y,pos) {
		var rect = this.getScreenRect(pos);
		var p = this.getRelativeCursor(x,y,pos);
		if (0 <= p.x && p.x <= rect.w &&
			0 <= p.y && p.y <= rect.h) {
			return true;
		}
		return false;
	},

	isOverRotationHandle: function(x,y,pos) {
		var rect = this.getScreenRect(pos);
		var p = this.getRelativeCursor(x,y,pos);
		var dx = (rect.w/2) - p.x;
		var dy = 0 - p.y;
		var dist_sq = dx*dx+dy*dy;
		return dist_sq <= 64;
	},
};