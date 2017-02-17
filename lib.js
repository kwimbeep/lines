/*********************************
 Lines - lib.js
 Copyright © 2016 Marcis Berzins (berzins.marcis@gmail.com)
 This program is licensed under the terms of the GNU General Public License: http://www.gnu.org/licenses/gpl-3.0.txt
 *********************************/

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getNextIndex(index, array) {
  return (index < array.length - 1) ? index + 1 : 0;
}

function getPrevIndex(index, array) {
  return (index > 0) ? index - 1 : array.length - 1;
}

function removeDuplicates(fromArray, comparisonArray) { // http://stackoverflow.com/a/14930567
  return fromArray.filter(function(v, i, a) { return comparisonArray.indexOf(v) == -1; });
}

function copyProperties(target, source) {
  for (var p in source) {
    if (source.hasOwnProperty(p)) {
      target[p] = clone(source[p]);
    }
  }
}

function clone(o) {
  if (o == null || typeof(o) != 'object') return o;
  var t = o.constructor();
  for(var p in o) t[p] = clone(o[p]);
  return t;
}

function drawInfo(ctx, info) {
  ctx.save();
  ctx.fillStyle = 'hsla(0, 0%, 0%, 1)';
  var i = 0;
  for (var p in info) {
    ctx.fillText(p + ': ' + info[p], 0, ((12 * i)));
    i++;
  }
  ctx.restore();
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function drawArrow(ctx, deg, cX, cY, lineLength) {
  var rDeg, dX, dY;
  rDeg = d2r(deg);
  dX = (Math.cos(rDeg) * lineLength) + cX;
  dY = (Math.sin(rDeg) * lineLength) + cY;
  ctx.moveTo(dX, dY);
  ctx.lineTo(cX, cY);
  deg = 360 - deg;
  rDeg = d2r(deg);
  dX = (Math.cos(rDeg) * lineLength) + cX;
  dY = (Math.sin(rDeg) * lineLength) + cY;
  ctx.lineTo(dX, dY);
}

function d2r(d) {
  return d * Math.PI / 180;
}

function get(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() { callback(xhr); };
  xhr.open("GET", url, true);
  xhr.overrideMimeType("text/plain");
  xhr.send();
}

function testLocalData() {
  try {
    window.localStorage.test = 'test';
    window.localStorage.removeItem('test');
    return true;
  } catch(e) {
    return false;
  }
}

function localData(k, v) {
  //if (!window.localStorage) return 0;
  if (!testLocalData()) return 0;
  if (v === undefined) {
    if (window.localStorage[k]) {
      try { return JSON.parse(window.localStorage[k]); }
      catch (e) { return window.localStorage[k]; }
    } else {
      return 0;
    }
  } else {
    if (typeof v === 'object') {
      window.localStorage[k] = JSON.stringify(v);
    } else {
      window.localStorage[k] = v;
    }
    return 1;
  }
}

function getTime() {
  if (window.performance && window.performance.now)
    return window.performance.now();
  else
    return new Date().getTime();
}

// http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimationFrame = window.requestAnimationFrame
                            || window.webkitRequestAnimationFrame
                            || window.mozRequestAnimationFrame
                            || function(callback) { window.setTimeout(callback, 1000 / 60); };