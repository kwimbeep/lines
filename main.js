/*********************************
 Lines - main.js
 Copyright © 2016 Marcis Berzins (berzins.marcis@gmail.com)
 This program is licensed under the terms of the GNU General Public License: http://www.gnu.org/licenses/gpl-3.0.txt
 *********************************/

var game = (function() {

  var w = 430, h = 550, scaleFactor = 1;
  var mainCtx = null, bgCtx = null, statsCtx = null, mainCanvas = null;
  var mainCtxActive = false; bgCtxActive = false; statsCtxActive = false;
  var lastTime = 0, frameTime = 0;
  var imageManager = new ImageManager(), soundManager = new SoundManager(), inputManager = null;
  var controls = new Controls(), eventLocks = 0;
  var stats = new Stats();
  var info = {};
  
  var grid = {w: 10, h: 10, squareSize: 40, x: 0, y: 0};
  var nextItemsPos = {x: 280, y: 73};
  var items = new Queue(), nextItems = [], activeItem = null;
  var nextItemsCount = 3, itemTypeCount = 6;
  
  var trails = [], particles = [];
  
  var justDeployed = false, toDeploy = false;
  
  var freeCellsLeft = grid.w * grid.h, playing = false;
  
  var minRows = [3, 4, 5, 6], defaultMinRow = 1, minRowPrefix = 'Line Length: ';
  var minRow = defaultMinRow;

  function getFrameTime() {
    var tNow = getTime();
    frameTime = (tNow - lastTime) / 1000;
    if (frameTime > 0.03) frameTime = 0.03;
    lastTime = tNow;
  }
  
  //--------------------------------------------//
  
  function loop() {
    getFrameTime();
    events();
    update();
    draw();
    if (playing) {
      requestAnimationFrame(loop);
    } else {
      gameOver();
    }
  }
  
  function events() {
    if (eventLocks) { inputManager.resetEvents(); return; }
    var event;
    while (event = inputManager.getEvent()) {
      switch (event.type) {
        case 'pointerDown':
          var o = getItem(event.x, event.y, items.getObjects(), true); // check for item
          if (o) { // item clicked
            if (!o.alive) { return; }
            if (activeItem) { activeItem.setActive(false); } // active item already exists
            if (!(activeItem === o)) { // other item clicked
              activeItem = o; activeItem.setActive();
              soundManager.playSound('PICK');
            } else { // already active item clicked
              activeItem = null;
              soundManager.playSound('PLACE');
            }
          } else { // no item clicked...
            if (activeItem) { // ...but item has been selected previously
              var pos = activeItem.pixelsToGrid(event.x, event.y); // check if empty grid cell clicked
              if (!(pos.x < 1 || pos.x > grid.w) && !(pos.y < 1 || pos.y > grid.h) && !(pos.x == activeItem.x && pos.y == activeItem.y) && !getItem(pos.x, pos.y, items.getObjects())) {
                var path = aStar(activeItem.x, activeItem.y, pos.x, pos.y); // try to create path and start moving
                if (path) {
                  activeItem.startMove(path, trails);
                  activeItem.setActive(false);
                  eventLocks++;
                }
              }
            }
            var button = controls.check(event.x, event.y, true); // check for control buttons
            if (button) { soundManager.playSound('CLICK'); }
          }
          mainCtxActive = true;
          statsCtxActive = true;
          break;
        case 'pointerUp':
          var button = controls.check(event.x, event.y, false);
          switch (button) {
            case 'reset':
              initGame();
              break;
            case 'minRow':
              minRow = getNextIndex(minRow, minRows);
              initGame();
              break;
          }
          statsCtxActive = true;
          break;
      }
    }
  }
  
  function update() {
    var stillFading = 0;
    var o = items.getObjects();
    
    if ((activeItem && activeItem.moveFinished) || justDeployed) { // check for lines after movement or deployment
      var r = checkLines();
      
      if (r.length) { // line down
        soundManager.playSound('LINE');
        for (var i = 0; i < r.length; i++) { // init element removing + adding one event lock
          r[i].die();
          generateParticles(r[i].xPx + (r[i].w / 2), r[i].yPx + (r[i].h / 2), r[i].sprites.basic.image);
          eventLocks++;
        }
        stats.score += r.length; // increment stats
        statsCtxActive = true; // enable stats ctx to redraw score
      }
      
      if (activeItem && activeItem.moveFinished) {
        if (!r.length) { soundManager.playSound('PLACE'); } // no lines down
        activeItem.moveFinished = false;
        activeItem = null;
        eventLocks--;
        toDeploy = true; // just moved, so need to deploy new items (if any items to remove - deploy after removing)
      } else if (justDeployed) {
        justDeployed = false; // prevent repeated line check
      }
    }
    
    for (var i = 0; i < o.length; i++) { // update + check for elements to remove
      o[i].update(frameTime);
      stillFading += (o[i].alive) ? 0 : 1; // not alive, but not yet removed (fading)
      if (o[i].remove) { // removing element from board + removing one event lock
        freeCellsLeft++;
        items.remove(i);
        eventLocks--;
      }
    }
    
    if (!stillFading && toDeploy) { // finished removing all items (if any) and new items waiting for deployment
      if (freeCellsLeft <= nextItemsCount) { // not enough free place left
        playing = false; // game over
        return;
      } else {
        deployItems();
        justDeployed = true; // recheck after deploy
        toDeploy = false; // but no more deploying
        statsCtxActive = true; // enable stats ctx to redraw next items
      }
    }
    
    for (var i = trails.length - 1; i >= 0; i--) { // shared with player - can't use filter() - (trails = trails.filter(function(v, i, a) { return v.update(); });)
      if (!trails[i].update()) { trails.splice(i, 1); }
    }
    
    particles = particles.filter(function(v, i, a) { return v.update(frameTime); });
  }
  
  function draw() {
    if (mainCtxActive) {
      mainCtx.save();
      mainCtx.clearRect(0, 0, w, h);
      trails.map(function(v, i, a) { v.draw(mainCtx); });
      items.process('draw', [mainCtx]);
      particles.map(function(v, i, a) { v.draw(mainCtx); });
      mainCtx.restore();
      if (!eventLocks && !activeItem && !trails.length && !particles.length) { mainCtxActive = false; }
    }
    
    if (bgCtxActive) {
      drawBg(bgCtx);
      bgCtxActive = false;
    }
    
    if (statsCtxActive) {
      drawStats(statsCtx);
      statsCtxActive = false;
    }
  }
  
  function drawStats(ctx) {
    ctx.clearRect(0, 0, w, h);
    stats.draw(ctx);
    controls.draw(ctx);
    nextItems.map(function(o, i, a) { o.draw(ctx, nextItemsPos.x + (i * grid.squareSize), nextItemsPos.y); });
    drawInfo(ctx, info);
  }
  
  function drawBg(ctx) {
    ctx.fillStyle = 'hsla(180, 7%, 80%, 1)';
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = 'hsla(180, 7%, 60%, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
    
    ctx.strokeStyle = 'hsla(175, 5%, 90%, 0.1)';
    ctx.lineWidth = 2;
    
    for (var i = 0; i < grid.h; i++) {
      for (var j = 0; j < grid.w; j++) {
        ctx.fillStyle = 'hsla(175, 5%, RANDOM%, 0.7)'.replace('RANDOM', getRandomInt(55, 65));
        ctx.fillRect(grid.x + (j * grid.squareSize), grid.y + (i * grid.squareSize), grid.squareSize, grid.squareSize);
        ctx.strokeRect(grid.x + (j * grid.squareSize), grid.y + (i * grid.squareSize), grid.squareSize, grid.squareSize);
      }
    }
    
    ctx.strokeStyle = 'hsla(175, 5%, 90%, 0.7)';
    ctx.strokeRect(grid.x, grid.y, grid.x + ((grid.w * grid.squareSize) - grid.x), grid.y + ((grid.h * grid.squareSize) - grid.y));
  }
  
  //--------------------------------------------//
  
  function generateParticles(x, y, sourceImage) {
    var count = getRandomInt(5, 10);
    var vX, vY;
    for (var i = 0; i < count; i++) {
      vX = getRandomInt(-100, 100);
      vY = getRandomInt(-100, 100);
      particles.push(new Particle(x, y, vX, vY, sourceImage));
      //particles.push(new Particle(x, y, vX, vY, mainCanvas));
    }
  }
  
  //--------------------------------------------//
  
  function genNextItems() {
    nextItems.length = 0;
    for (var i = 0; i < nextItemsCount; i++) {
      nextItems.push(genItem());
    }
  }
  
  function genItem() {
    var pos = genItemPos();
    return new Item(grid, imageManager, soundManager, pos.x, pos.y, getRandomInt(1, itemTypeCount));
  }
  
  function genItemPos() {
    var x, y, occupied;
    do {
      x = getRandomInt(1, grid.w);
      y = getRandomInt(1, grid.h);
      occupied = (freeCellsLeft < nextItemsCount) ? false : getItem(x, y, items.getObjects()) || getItem(x, y, nextItems); // a liiitle hack
    } while (occupied);
    return {x: x, y: y};
  }
  
  function deployItems() {
    for (var i = 0; i < nextItems.length; i++) {
      if (getItem(nextItems[i].x, nextItems[i].y, items.getObjects())) { // next item place occupied - need to generate new position
        var pos = genItemPos();
        nextItems[i].x = pos.x;
        nextItems[i].y = pos.y;
        nextItems[i].calculatePixels();
      }
      items.add(nextItems[i]);
      mainCtxActive = true;
    }
    freeCellsLeft -= nextItems.length;
    genNextItems();
  }
  
  function getItem(x, y, itms, pixels) {
    pixels = pixels || false;
    var returnObject = null;
    for (var i = 0; i < itms.length; i++) {
      if (((!pixels) && (itms[i].x == x) && (itms[i].y == y))
       || ((pixels) && (x > itms[i].xPx) && (x < itms[i].xPx + itms[i].w) && (y > itms[i].yPx) && (y < itms[i].yPx + itms[i].h))) {
        returnObject = itms[i];
        break;
      }
    }
    return returnObject;
  }
  
  function setMinRow(r) {
    if (r === undefined) r = defaultMinRow; //minRow = r || defaultMinRow;
    minRow = r;
    controls.setItemText('minRow', minRowPrefix + minRows[minRow]);
  }
  
  //--------------------------------------------//
  
  function checkLines() {
    var toRemove = [];
    
    toRemove.push.apply(toRemove, removeDuplicates(checkStraightLines(grid.w, grid.h, true), toRemove)); // check vertical
    toRemove.push.apply(toRemove, removeDuplicates(checkStraightLines(grid.h, grid.w, false), toRemove)); // check horizontal
    toRemove.push.apply(toRemove, removeDuplicates(checkDiagonals(grid.w, grid.h, true), toRemove)); // check left diagonals
    toRemove.push.apply(toRemove, removeDuplicates(checkDiagonals(grid.w, grid.h, false), toRemove)); // check right diagonals
    
    return toRemove;
  }
  
  function checkStraightLines(axis1, axis2, vertical) {
    var toRemove = [];
    var tArray = [], tItem = null, startAnew = false;
    
    for (var i = 1; i <= axis1; i++) {
      for (var j = 1; j <= axis2; j++) {
        
        tItem = (vertical) ? getItem(i, j, items.getObjects()) : getItem(j, i, items.getObjects());
        if (j == 1) { tArray = [tItem]; startAnew = false; continue; } // no previous item to compare to
        
        if ((tArray[0] && tItem) && (tArray[0].type == tItem.type)) { // check and compare
          tArray.push(tItem);
        } else { // if empty or different types
          startAnew = true;
        }
        
        if ((startAnew || j == axis2) && (tArray.length >= minRows[minRow])) { // check if enough to remove
          toRemove.push.apply(toRemove, tArray);
        }
        
        if (startAnew) { // in case of empty cell or different type start new comparison
          tArray = [tItem];
          startAnew = false;
        }
        
      }
    }
    
    return toRemove;
  }
  
  function checkDiagonals(axis1, axis2, left) {  // insp: http://stackoverflow.com/a/10395074
    var toRemove = [];
    var tArray = [], tItem = null, startAnew = false, first = false;
    
    for (var i = 1; i <= axis1 + axis2; i++) { // diagonal count
      first = true;
      for (var j = 1; j <= axis2; j++) { // row count
        
        var x = (left) ? axis1 - i + j : i - axis1 + (axis2 - j); // diagonal x pos
        
        if (!(x < 1 || x > axis1)) { // if not out of bounds
        
          tItem = getItem(x, j, items.getObjects());
          if (first) { tArray = [tItem]; startAnew = false; first = false; continue; } // no previous item to compare to
          
          if ((tArray[0] && tItem) && (tArray[0].type == tItem.type)) { // check and compare
            tArray.push(tItem);
          } else { // if empty or different types
            startAnew = true;
          }
        
        }
        
        if ((startAnew || j == axis2) && (tArray.length >= minRows[minRow])) { // check if enough to remove
          toRemove.push.apply(toRemove, tArray);
        }
        
        if (startAnew) { // in case of empty cell or different type start new comparison
          tArray = [tItem];
          startAnew = false;
        }
        
      }
    }
    
    return toRemove;
  }
  
  //--------------------------------------------//
  
  function aStar(sX, sY, dX, dY) { // a* pathfinding from start to destination
    var openList = []; // to explore
    var closedList = []; // explored
    var sNode = createNode(sX, sY, -1, 0, 0, 0); // start
    var dNode = createNode(dX, dY, -1, 0, 0, 0); // destination
    var cNode = null; // current node
    var path = []; // final path
    
	// g - movement cost from start to current node
	// h - heuristic cost (straight line distance) from current node to destination
	// f = g + h - cost from start to destination through the current node
    
    openList.push(sNode); // push start node to list
    
    while (openList.length) {
      openList.sort(function(a, b) { return a.f - b.f; }); // sort by cost ascending
      cNode = openList[0];
      
      if (cNode.x == dX && cNode.y == dY) { // reached destination
        path.push(dNode);
        while (cNode.parentIndex != -1) { // walk backwards from destination to start
          cNode = closedList[cNode.parentIndex];
          path.unshift(cNode);
        }
        //console.log(closedList.length);
        return path; // return final result
      }
      
      closedList.push(openList.shift()); // remove first item (cNode) from openList and add to closedList
      
      for (var x = cNode.x - 1; x <= cNode.x + 1; x++) { // explore surrounding nodes
        for (var y = cNode.y - 1; y <= cNode.y + 1; y++) {
          if (x < 1 || x > grid.w || y < 1 || y > grid.h) { continue; } // exlude nodes out of bounds
          if (!((x == cNode.x) != (y == cNode.y))) { continue; } // exclude cNode and diagonal nodes (xor: x or y must be equal to current, but not both)
          if (getItem(x, y, items.getObjects())) { continue; } // exclude already taken grid cells
          
          var nodeFound = false;
          for (var i = 0; i < closedList.length; i++) {
            if (x == closedList[i].x && y == closedList[i].y) { nodeFound = true; break; }
          }
          if (nodeFound) { continue; } // exclude already closed
          
          nodeFound = false;
          for (var i = 0; i < openList.length; i++) {
            if (x == openList[i].x && y == openList[i].y) { nodeFound = true; break; }
          }
          if (nodeFound) { continue; } // exclude already open
          
          // create and push new node for exploration
          var g = cNode.g + 1; // increment is movement cost (distance) from node to node; in case of diagonals needs to be calculated: getD(cNode, {x: x, y: y})
          var h = getD(cNode, dNode);
          var f = g + h;
          var newNode = createNode(x, y, closedList.length - 1, g, h, f);
          openList.push(newNode);
        }
      }
      
    }
    
    return false; // path not found
  }
  
  function getD(a, b) { // calculate distance value between a and b
    var x = a.x - b.x;
    var y = a.y - b.y;
    return Math.pow(x, 2) + Math.pow(y, 2); // straigh line a -> b squared
  }
  
  function createNode(x, y, parentIndex, g, h, f) {
    return { x: x, y: y, parentIndex: parentIndex, g: g, h: h, f: f };
  }
  
  //--------------------------------------------//
  
  var pointerDown;
  var overlayCanvas = null;
  var overlayCtx = null;
  
  function gameOver() {
    pointerDown = false;
    overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'overlayCanvas';
    document.body.appendChild(overlayCanvas);
    overlayCtx = initCanvas('overlayCanvas');
    gameOverDraw();
    gameOverWait();
  }
  
  function gameOverDraw() {
    overlayCtx.fillStyle = 'hsla(210, 8%, 44%, 0.8)';
    overlayCtx.textAlign = 'center';
    overlayCtx.textBaseline = 'middle';
    overlayCtx.fillRect(0, 0, w, h);
    var tX = w / 2; var tY = h / 2;
    overlayCtx.font = '44px lfont';
    overlayCtx.fillStyle = 'hsla(175, 5%, 90%, 0.9)';
    overlayCtx.fillText('Game Over!', tX, tY);
  }
  
  function gameOverWait() {
    var event, waitingOver = false;
    while (event = inputManager.getEvent()) {
      switch (event.type) {
        case 'pointerDown':
          pointerDown = true;
          break;
        case 'pointerUp':
          if (pointerDown) waitingOver = true;
      }
    }
    
    if (waitingOver) {
      overlayCanvas.parentNode.removeChild(overlayCanvas);
      overlayCanvas = null; overlayCtx = null;
      initGame();
      loop();
    } else {
      setTimeout(gameOverWait, 100);
    }
  }
  
  //--------------------------------------------//
  
  function initGame() {
    grid.x = Math.round(((w) - (grid.w * grid.squareSize)) / 2);
    grid.y = Math.round(((w) - (grid.h * grid.squareSize)) / 2) + Math.abs(w - h);
    
    resetCtx(mainCtx);
    resetCtx(bgCtx);
    resetCtx(statsCtx);
    mainCtx.clearRect(0, 0, w, h);
    bgCtx.clearRect(0, 0, w, h);
    statsCtx.clearRect(0, 0, w, h);
    
    items.clear();
    stats.reset();
    setMinRow(minRow);
    
    freeCellsLeft = grid.w * grid.h;
    playing = true;
    
    genNextItems();
    deployItems();
    justDeployed = true;
    toDeploy = false;
    
    bgCtxActive = true;
    statsCtxActive = true;
    eventLocks = 0;
  }
  
  var loadedItems = 0;
  var itemsToLoad = soundManager.loadState.count + imageManager.loadState.count;
  var loaderW = 370, loaderH = 10, loaderX = (w / 2) - (loaderW / 2), loaderY = 200;
  
  function showLoader() {
    loadedItems = soundManager.loadState.loaded + imageManager.loadState.loaded;
    mainCtx.fillStyle = 'hsla(0, 0%, 85%, 1)';
    mainCtx.fillRect(0, 0, w, h);
    mainCtx.lineWidth = 6;
    mainCtx.strokeStyle = 'hsla(0, 0%, 60%, 1)';
    mainCtx.fillStyle = 'hsla(0, 0%, 60%, 1)';
    mainCtx.strokeRect(loaderX - 4, loaderY - 4, loaderW + 8, loaderH + 8);
    mainCtx.fillRect(loaderX, loaderY, Math.round(loaderW / itemsToLoad * loadedItems), loaderH);
    if (!soundManager.loadState.ready || !imageManager.loadState.ready) {
      setTimeout(showLoader, 100);
    } else {
      initGame();
      loop();
    }
  }
  
  function init() {
    document.onselectstart = function() { return false; };
    mainCanvas = document.getElementById('mainCanvas');
    mainCtx = initCanvas('mainCanvas');
    bgCtx = initCanvas('bgCanvas');
    statsCtx = initCanvas('statsCanvas');
    inputManager = new InputManager();
    showLoader();
  }
  
  function initCanvas(canvasId) {
    var canvas = document.getElementById(canvasId);
    var ctx = canvas.getContext('2d');
    canvas.oncontextmenu = function (e) { e.preventDefault(); };
    canvas.width = w * scaleFactor; canvas.height = h * scaleFactor;
    ctx.scale(scaleFactor, scaleFactor);
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '18px lfont';
    resetCtx(ctx);
    return ctx;
  }
  
  function resetCtx(ctx) {
    ctx.lineWidth = 1;
    ctx.fillStyle = 'hsla(0, 0%, 0%, 1)';
    ctx.strokeStyle = 'hsla(0, 0%, 0%, 1)';
  }

  return {
    init: init,
    inputManager: function() { return inputManager; },
    canvas: function() { return mainCanvas; },
    scaleFactor: function() { return scaleFactor; }
  }

})();

//---------------- Init -------------------//

game.init();