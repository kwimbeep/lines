/*********************************
 Lines - managers/input.js
 Copyright © 2017 Marcis Berzins (berzins.marcis@gmail.com)
 This program is licensed under the terms of the GNU General Public License: http://www.gnu.org/licenses/gpl-3.0.txt
 *********************************/

// global: game

function InputManager() {
  this.KEYS = { ENTER: 13, CONTROL: 17, ESC: 27, SPACE: 32, PAGEUP: 33, PAGEDOWN: 34, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, DELETE: 46, A: 65, D: 68, F: 70, K: 75, Q: 81, R: 82, S: 83, U: 85, W: 87, Z: 90 };
  this.events = [];
  this.keysDown = {};
  this.pointer = {x: 0, y: 0, down: false};
  this.getMouseCoordinates = function(e) {
    var r = game.canvas().getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / game.scaleFactor(),
      y: (e.clientY - r.top) / game.scaleFactor()
    };
  };
  document.body.addEventListener("keydown", function(e) { game.inputManager().handleKeyDown(e); }, false);
  document.body.addEventListener("keyup", function(e) { game.inputManager().handleKeyUp(e); }, false);
  if ('ontouchstart' in document.documentElement) {
    document.body.addEventListener("touchstart", function(e) { game.inputManager().handleTouchStart(e); }, false);
    document.body.addEventListener("touchend", function(e) { game.inputManager().handleTouchEnd(e); }, false);
    document.body.addEventListener("touchmove", function(e) { game.inputManager().handleTouchMove(e); }, false);
  } else {
    document.body.addEventListener("mousedown", function(e) { game.inputManager().handleMouseDown(e); }, false);
    document.body.addEventListener("mouseup", function(e) { game.inputManager().handleMouseUp(e); }, false);
    document.body.addEventListener("mousemove", function(e) { game.inputManager().handleMouseMove(e); }, false);
  }
}

InputManager.prototype.handleMouseDown = function(e) { this.handleMouse(e, 'pointerDown'); this.pointer.down = true; };
InputManager.prototype.handleMouseUp = function(e) { this.handleMouse(e, 'pointerUp'); this.pointer.down = false; };
InputManager.prototype.handleMouseMove = function(e) { this.handleMouse(e, 'pointerMove'); };

InputManager.prototype.handleMouse = function(e, type) {
  var c = this.getMouseCoordinates(e);
  this.events.push({
    type: type,
    x: c.x,
    y: c.y
  });
  this.pointer.x = c.x;
  this.pointer.y = c.y;
};

InputManager.prototype.handleKeyDown = function(e) { this.handleKey(e, 'keyDown'); this.keysDown[e.keyCode] = true; };
InputManager.prototype.handleKeyUp = function(e) { this.handleKey(e, 'keyUp'); this.keysDown[e.keyCode] = false; };

InputManager.prototype.handleKey = function(e, type) {
  if ((e.keyCode === 32) || (e.keyCode === 33) || (e.keyCode === 34) || (e.keyCode === 37) || (e.keyCode === 38) || (e.keyCode === 39) || (e.keyCode === 40)) { e.preventDefault(); }
  this.events.push({
    type: type,
    key: e.keyCode
  });
};

InputManager.prototype.handleTouchStart = function(e) { this.handleTouch(e, 'pointerDown'); this.pointer.down = true; };
InputManager.prototype.handleTouchEnd = function(e) { this.handleTouch(e, 'pointerUp'); this.pointer.down = false; };
InputManager.prototype.handleTouchMove = function(e) { this.handleTouch(e, 'pointerMove'); };

InputManager.prototype.handleTouch = function(e, type) {
  e.preventDefault();
  if (e.changedTouches.length) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      this.handleMouse(e.changedTouches[i], type);
    }
  }
};

InputManager.prototype.getEvent = function() {
  if (this.events.length) {
    return this.events.shift();
  } else {
    return false;
  }
};

InputManager.prototype.resetEvents = function() {
  this.events.length = 0;
};

InputManager.prototype.resetKeys = function() {
  delete this.keysDown;
  this.keysDown = {};
};

InputManager.prototype.resetPointer = function() {
  this.pointer.x = 0;
  this.pointer.y = 0;
  this.pointer.down = false;
};