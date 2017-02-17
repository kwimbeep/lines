/*********************************
 Lines - managers/image.js
 Copyright © 2016 Marcis Berzins (berzins.marcis@gmail.com)
 This program is licensed under the terms of the GNU General Public License: http://www.gnu.org/licenses/gpl-3.0.txt
 *********************************/

function ImageManager() {
  this.IMAGES = {
    ITEM_1_BASIC: 'data/images/item_1_basic.png',
    ITEM_1_ACTIVE: 'data/images/item_1_active.png',
    ITEM_1_MOVING: 'data/images/item_1_moving.png',
    ITEM_2_BASIC: 'data/images/item_2_basic.png',
    ITEM_2_ACTIVE: 'data/images/item_2_active.png',
    ITEM_2_MOVING: 'data/images/item_2_moving.png',
    ITEM_3_BASIC: 'data/images/item_3_basic.png',
    ITEM_3_ACTIVE: 'data/images/item_3_active.png',
    ITEM_3_MOVING: 'data/images/item_3_moving.png',
    ITEM_4_BASIC: 'data/images/item_4_basic.png',
    ITEM_4_ACTIVE: 'data/images/item_4_active.png',
    ITEM_4_MOVING: 'data/images/item_4_moving.png',
    ITEM_5_BASIC: 'data/images/item_5_basic.png',
    ITEM_5_ACTIVE: 'data/images/item_5_active.png',
    ITEM_5_MOVING: 'data/images/item_5_moving.png',
    ITEM_6_BASIC: 'data/images/item_6_basic.png',
    ITEM_6_ACTIVE: 'data/images/item_6_active.png',
    ITEM_6_MOVING: 'data/images/item_6_moving.png'
  };
  this.loadState = { count: Object.keys(this.IMAGES).length, loaded: 0, ready: false };
  this.init();
}

ImageManager.prototype.init = function() {
  for (var p in this.IMAGES) {
    var i = new Image();
    var that = this;
    i.addEventListener('load', function() {
      that.loadState.loaded++;
      if (that.loadState.loaded >= that.loadState.count) { that.loadState.ready = true; }
    }, false);
    i.src = this.IMAGES[p];
    this[p] = i;
  }
};