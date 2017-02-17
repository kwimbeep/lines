/*********************************
 Lines - classes/misc.js
 Copyright © 2016 Marcis Berzins (berzins.marcis@gmail.com)
 This program is licensed under the terms of the GNU General Public License: http://www.gnu.org/licenses/gpl-3.0.txt
 *********************************/

//-------------- Timer ---------------//

function Timer(i) {
  this.timer = 0;
  this.interval = i;
}

Timer.prototype.tick = function(fTime) {
  this.timer += fTime;
  return this.timer >= this.interval;
};

Timer.prototype.reset = function() {
  this.timer = 0;
};

//----------------- Queue -----------------//

function Queue() {
  this.q = [];
  this.oId = 0;
}

Queue.prototype.add = function(object) {
  this.oId++;
  object.id = this.oId;
  this.q.push(object);
  return object;
};

Queue.prototype.remove = function(i) {
  delete this.q[i];
  this.q.splice(i, 1);
};

Queue.prototype.removeById = function(id) {
  for (var i = 0; i < this.q.length; i++) {
    if (this.q[i].id === id) {
      this.remove(i);
      break;
    }
  }
};

Queue.prototype.clear = function() {
  this.q.length = 0;
  this.oId = 0;
};

Queue.prototype.process = function(fn, params) {
  if (params === undefined) params = [];
  this.q.map(function(o, i, q) { o[fn].apply(o, params); });
  //for (var i = 0; i < this.q.length; i++) {
  //  this.q[i][fn].apply(this.q[i], params);
  //}
};

Queue.prototype.getObjects = function() {
  return this.q;
}

//---------------- Sprite -----------------//

function Sprite(image, w, h, c, fps) {
  this.image = image;
  this.cellWidth = w;
  this.cellHeight = h;
  this.cellCount = c;
  this.currentCell = 0;
  this.timer = new Timer(fps);
}

Sprite.prototype.reset = function() {
  this.timer.reset();
  this.currentCell = 0;
};

Sprite.prototype.advance = function() {
  if (this.currentCell >= this.cellCount - 1) {
    this.currentCell = 0;
  } else {
    this.currentCell++;
  }
};

Sprite.prototype.update = function(fTime) {
  if ((this.cellCount > 1) && this.timer.tick(fTime)) {
    this.timer.reset();
    this.advance();
  }
};

Sprite.prototype.draw = function(ctx, x, y) {
  ctx.drawImage(this.image, this.cellWidth * this.currentCell, 0, this.cellWidth, this.cellHeight, x, y, this.cellWidth, this.cellHeight);
};

//---------------- Stats ------------------//

function Stats() {
  this.score = 0;
  this.scorePos = { x: 0, y: 0 };
  this.items = {
    score: {
      text: 'Score',
      x: 15, y: 60, w: 195, h: 65
    },
    next: {
      text: 'Next',
      x: 220, y: 60, w: 195, h: 65
    }
  };
  
  this.scorePos.x = this.items.score.x + this.items.score.w - 15;
  this.scorePos.y = this.items.score.y + (this.items.score.h / 2);
}

Stats.prototype.reset = function() {
  this.score = 0;
};

Stats.prototype.save = function() {
  localData('record', this.count);
};

Stats.prototype.load = function() {
  this.record = localData('record');
};

Stats.prototype.draw = function(ctx) {
  ctx.save();
  ctx.font = '12px lfont';
  ctx.strokeStyle = 'hsla(180, 7%, 60%, 1)';
  ctx.lineWidth = 3;
  
  for (var p in this.items) {
    var x = this.items[p].x; var y = this.items[p].y;
    var w = this.items[p].w; var h = this.items[p].h;
    
    ctx.fillStyle = 'hsla(210, 8%, 55%, 1)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    
    ctx.fillStyle = 'hsla(175, 5%, 75%, 0.9)';
    ctx.fillText(this.items[p].text, x + 10, y + 10);
  }
  
  ctx.font = '44px lfont';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'hsla(175, 5%, 90%, 0.9)';
  ctx.fillText(this.score, this.scorePos.x, this.scorePos.y);
  ctx.restore();
};

//-------------- Clickable ----------------//

function Clickable() {
  this.items = {};
}

Clickable.prototype.check = function(x, y, pointerDown) {
  if (pointerDown === undefined) pointerDown = false;
  var returnValue = null;
  for (var p in this.items) {
    if ((x > this.items[p].x) && (x < this.items[p].x + this.items[p].w) && (y > this.items[p].y) && (y < this.items[p].y + this.items[p].h)) {
      this.items[p].active = (pointerDown) ? true : false;
      returnValue = p;
    } else {
      this.items[p].active = false;
    }
  }
  return returnValue;
};

Clickable.prototype.deactivateAll = function() {
  for (var p in this.items) {
    this.items[p].active = false;
  }
};

//--------------- Controls ----------------//

function Controls() {
  this.clickable = new Clickable();
  this.clickable.items = {
    minRow: {
      text: 'Line Length',
      active: false,
      x: 15, y: 15, w: 195, h: 35
    },
    reset: {
      text: 'Reset',
      active: false,
      x: 220, y: 15, w: 195, h: 35
    }
  };
}

Controls.prototype.check = function(x, y, pointerDown) {
  return this.clickable.check(x, y, pointerDown);
};

Controls.prototype.setItemText = function(item, text) {
  if (this.clickable.items[item]) {
    this.clickable.items[item].text = text;
  }
};

Controls.prototype.draw = function(ctx) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'hsla(180, 7%, 60%, 0.7)';
  ctx.lineWidth = 3;
  
  var items = this.clickable.items;
  for (var p in items) {
    var x = items[p].x; var y = items[p].y;
    var w = items[p].w; var h = items[p].h;
    var cX = x + (w / 2); var cY = y + (h / 2);
    
    ctx.fillStyle = (items[p].active) ? 'hsla(210, 8%, 64%, 1)' : 'hsla(210, 8%, 44%, 1)';
    ctx.fillRect(x, y, w, h);
    
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    
    ctx.fillStyle = 'hsla(175, 5%, 90%, 0.9)';
    ctx.fillText(items[p].text, cX, cY);
  }
  
  ctx.restore();
};