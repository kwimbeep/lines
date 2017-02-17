/*********************************
 Lines - classes/game.js
 Copyright © 2016 Marcis Berzins (berzins.marcis@gmail.com)
 This program is licensed under the terms of the GNU General Public License: http://www.gnu.org/licenses/gpl-3.0.txt
 *********************************/

//----------------- Item ------------------//

function Item(grid, imageManager, soundManager, x, y, type) {
  this.x = x || 1; this.y = y || 1; this.xPx = 0; this.yPx = 0;
  this.w = 40; this.h = 40; this.hW = this.w / 2; this.hH = this.h / 2;
  
  this.type = type || 1;
  this.grid = grid;
  this.colors = { basic: 'hsla(0, 0%, 50%, 1)', active: 'hsla(0, 0%, 70%, 1)' }; this.alpha = 1;
  this.active = false; this.alive = true; this.remove = false;
  this.moving = false; this.moveFinished = false;
  this.path = [];
  
  this.moveAnimation = new MoveAnimation(this);
  this.trails = [];
  
  this.sprites = {
    basic: new Sprite(imageManager['ITEM_' + this.type + '_BASIC'], this.w, this.h, 1, 0),
    active: new Sprite(imageManager['ITEM_' + this.type + '_ACTIVE'], this.w, this.h, 18, 0.05),
    moving: new Sprite(imageManager['ITEM_' + this.type + '_MOVING'], this.w, this.h, 1, 0)
  };
  this.sprite = this.sprites.basic;
  
  this.calculatePixels();
}

Item.prototype.update = function(fTime) {
  if (this.moving) {
    var stillMoving = this.moveAnimation.update(fTime);
    if (!stillMoving) {
      if (this.path.length) {
        this.startStep(this.path.shift());
      } else {
        this.stopMove();
      }
    }
  }
  if (!this.alive) {
    this.alpha -= 0.025;
    if (this.alpha < 0) { this.die(); }
  }
  if (this.sprite) this.sprite.update(fTime);
};

Item.prototype.draw = function(ctx, xPx, yPx) {
  if (this.alpha < 0) { return; }
  xPx = xPx || this.xPx; yPx = yPx || this.yPx;
  ctx.globalAlpha = this.alpha;
  if (this.sprite) {
    this.sprite.draw(ctx, xPx, yPx);
  } else {
    ctx.fillStyle = (this.active) ? this.colors.active : this.colors.basic;
    ctx.fillRect(xPx, yPx, this.w, this.h);
    ctx.fillStyle = 'hsla(0, 0%, 100%, 1)';
    ctx.fillText(this.type, xPx, yPx);
  }
};

Item.prototype.setSprite = function() {
  if (this.active) {
    this.sprite = this.sprites.active;
  } else if (this.moving) {
    this.sprite = this.sprites.moving;
  } else {
    this.sprite = this.sprites.basic;
  }
  this.sprite.reset();
};

Item.prototype.startStep = function(step) { // start moving one path step
  var pos = this.gridToPixels(step.x, step.y);
  this.moveAnimation.start(pos.x, pos.y);
  this.trails.push(new Trail(this.xPx + (this.w / 2), this.yPx + (this.h / 2)));
  this.x = step.x; this.y = step.y;
};

Item.prototype.startMove = function(path, trails) {
  this.path = path; this.trails = trails;
  this.path.shift(); // first step not needed (current)
  this.startStep(this.path.shift());
  this.moving = true;
  if (this.sprite) this.setSprite();
};

Item.prototype.stopMove = function() {
  this.moving = false;
  this.moveFinished = true;
  if (this.sprite) this.setSprite();
};

Item.prototype.die = function() {
  if (this.alive) {
    this.alive = false;
  } else {
    this.remove = true;
  }
};

Item.prototype.setActive = function(active) {
  if (active === undefined) active = true;
  this.active = active;
  if (this.sprite) this.setSprite();
}

Item.prototype.calculatePixels = function() {
  var pos = this.gridToPixels(this.x, this.y);
  this.xPx = pos.x; this.yPx = pos.y;
};

Item.prototype.gridToPixels = function(x, y) {
  var xPx, yPx;
  xPx = Math.floor(this.grid.x + (this.grid.squareSize * (x - 1)) + ((this.grid.squareSize - this.w) / 2));
  yPx = Math.floor(this.grid.y + (this.grid.squareSize * (y - 1)) + ((this.grid.squareSize - this.h) / 2));
  return {x: xPx, y: yPx};
};

Item.prototype.pixelsToGrid = function(xPx, yPx) {
  var x, y;
  x = Math.floor((xPx - this.grid.x) / this.grid.squareSize) + 1;
  y = Math.floor((yPx - this.grid.y) / this.grid.squareSize) + 1;
  return {x: x, y: y};
};

//--------------- Particle ----------------//

function Particle(x, y, vX, vY, sourceImage) {
  this.x = x; this.y = y; this.size = 20; this.r = 5;
  this.vX = vX / 100; this.vY = vY / 100;
  this.alpha = 0.8; this.inc = -0.013;
  this.friction = 0.975;
  this.imageData = null;
  this.getRandomParticleData(sourceImage);
  this.setCentered();
}

Particle.prototype.update = function(fTime) {
  this.alpha += this.inc;
  this.x += this.vX; this.y += this.vY;
  this.vX *= this.friction; this.vY *= this.friction;
  return this.alpha > 0;
};

Particle.prototype.draw = function(ctx) {
  ctx.globalAlpha = this.alpha;
  ctx.drawImage(this.imageData, this.x, this.y);
  //ctx.fillStyle = 'hsla(0, 0%, 30%, 1)';
  //ctx.beginPath();
  //ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
  //ctx.fill();
};

Particle.prototype.getRandomParticleData = function(sourceImage) {
  this.imageData = document.createElement('canvas');
  this.imageData.width = this.size;
  this.imageData.height = this.size;
  this.imageData.getContext('2d').drawImage(sourceImage, getRandomInt(0, 1) * this.size, getRandomInt(0, 1) * this.size, this.size, this.size, 0, 0, this.size, this.size); // sourceImage is item image
  //this.imageData.getContext('2d').drawImage(sourceImage, this.x + (getRandomInt(-1, 0) * this.size), this.y + (getRandomInt(-1, 0) * this.size), this.size, this.size, 0, 0, this.size, this.size); // sourceImage is main canvas
};

Particle.prototype.setCentered = function() {
  this.x = Math.floor(this.x - (this.size / 2));
  this.y = Math.floor(this.y - (this.size / 2));
};

//----------------- Trail -----------------//

function Trail(x, y) {
  this.x = x; this.y = y;
  this.w = 40; this.h = 40;
  this.inc = 0.02; this.dec = -0.01;
  this.alpha = 0; this.modifier = this.inc;
  this.setCentered();
}

Trail.prototype.update = function() {
  this.alpha += this.modifier;
  if (this.alpha >= 0.5) {
    this.modifier = this.dec;
    this.alpha = 0.5;
  }
  return this.alpha > 0;
};

Trail.prototype.draw = function(ctx) {
  ctx.fillStyle = 'hsla(0, 0%, 100%, 0.5)';
  ctx.globalAlpha = this.alpha;
  ctx.fillRect(this.x, this.y, this.w, this.h);
};

Trail.prototype.setCentered = function() {
  this.x = Math.floor(this.x - (this.w / 2));
  this.y = Math.floor(this.y - (this.h / 2));
};

//------------ Move animation -------------//

function MoveAnimation(parent) {
  this.parent = parent;
  this.speed = 400;
  this.destination = { x: 0, y: 0 };
  this.velocity = { x: 0, y: 0 };
  this.isAnimating = false;
}

MoveAnimation.prototype.update = function(fTime) {
  if (this.isAnimating) {
    var addX, addY;
    addX = fTime * this.velocity.x;
    addY = fTime * this.velocity.y;
    this.parent.xPx += addX; this.parent.yPx += addY;
    if (((this.velocity.x > 0) && (this.parent.xPx >= this.destination.x))
     || ((this.velocity.x < 0) && (this.parent.xPx <= this.destination.x))
     || ((this.velocity.y > 0) && (this.parent.yPx >= this.destination.y))
     || ((this.velocity.y < 0) && (this.parent.yPx <= this.destination.y))) { this.stop(); }
  }
  return this.isAnimating;
};

MoveAnimation.prototype.start = function(dX, dY) {
  this.destination.x = dX;
  this.destination.y = dY;
  var tX = this.destination.x - this.parent.xPx;
  var tY = this.destination.y - this.parent.yPx;
  var distance = Math.sqrt(Math.pow(tX, 2) + Math.pow(tY, 2));
  if (!distance) { return; }
  this.velocity.x = (tX / distance) * this.speed;
  this.velocity.y = (tY / distance) * this.speed;
  this.isAnimating = true;
};

MoveAnimation.prototype.stop = function(correctPosition) {
  if (correctPosition === undefined) correctPosition = true;
  this.isAnimating = false;
  if (correctPosition) {
    this.parent.xPx = this.destination.x;
    this.parent.yPx = this.destination.y;
  }
};