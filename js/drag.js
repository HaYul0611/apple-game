/* ==========================================================================
   Apple 10 — Drag & Geometric Selection Engine (사과 영역 드래그 엔진)
   ========================================================================== */
(function (root) {
  'use strict';

  var rootObj = root || window;
  rootObj.Apple10 = rootObj.Apple10 || {};
  var Config = rootObj.Apple10.Config;

  function getCellSizeMetrics(gridEl) {
    var firstCell = gridEl ? gridEl.firstElementChild : null;
    if (firstCell) {
      var r0 = firstCell.getBoundingClientRect();
      var secondCell = firstCell.nextElementSibling;
      var stepX = secondCell ? (secondCell.getBoundingClientRect().left - r0.left) : (r0.width + 4);
      var tenthCell = (gridEl.children && gridEl.children.length > Config.COLS) ? gridEl.children[Config.COLS] : null;
      var stepY = tenthCell ? (tenthCell.getBoundingClientRect().top - r0.top) : (r0.height + 4);
      return {
        cell: r0.width,
        step: stepX,
        stepX: stepX,
        stepY: stepY,
        originX: r0.left,
        originY: r0.top
      };
    }
    var cs = getComputedStyle(document.documentElement);
    var cell = parseFloat(cs.getPropertyValue('--cell')) || 38;
    var gap = parseFloat(cs.getPropertyValue('--gap')) || 4;
    var gr = gridEl ? gridEl.getBoundingClientRect() : { left: 0, top: 0 };
    return {
      cell: cell,
      step: cell + gap,
      stepX: cell + gap,
      stepY: cell + gap,
      originX: gr.left,
      originY: gr.top
    };
  }

  function sumCells(cells) {
    var s = 0;
    for (var i = 0; i < cells.length; i++) s += cells[i].v;
    return s;
  }

  function highlightCells(cells, gridEl) {
    if (!gridEl) return;
    var children = gridEl.children;
    for (var i = 0; i < children.length; i++) {
      children[i].classList.remove('selected');
    }
    for (var j = 0; j < cells.length; j++) {
      var idx = cells[j].r * Config.COLS + cells[j].c;
      if (children[idx]) children[idx].classList.add('selected');
    }
  }

  function updateDragBox(x1, y1, x2, y2, sum, count, D, S) {
    if (!D || !D.gridContainer || !D.selBox || !D.sumBub) return;
    var containerRect = D.gridContainer.getBoundingClientRect();
    var left = Math.min(x1, x2) - containerRect.left;
    var top = Math.min(y1, y2) - containerRect.top;
    var width = Math.abs(x2 - x1);
    var height = Math.abs(y2 - y1);

    D.selBox.hidden = false;
    D.selBox.style.left = left + 'px';
    D.selBox.style.top = top + 'px';
    D.selBox.style.width = width + 'px';
    D.selBox.style.height = height + 'px';
    D.selBox.className = 'sel-box';

    var conf = Config.LEVELS[S.lv] || Config.LEVELS[5];

    if (count > 0 && sum === Config.TARGET) D.selBox.classList.add('valid');
    else if (sum > Config.TARGET) D.selBox.classList.add('over');

    var shouldShowBubble = false;
    var bubbleText = '';

    if (count > 0) {
      if (conf.showSumLive) {
        shouldShowBubble = true;
        bubbleText = sum;
      } else if (sum === Config.TARGET) {
        shouldShowBubble = true;
        bubbleText = '10 ' + Config.GOLD_IMG;
      }
    }

    if (shouldShowBubble) {
      D.sumBub.hidden = false;
      D.sumBub.innerHTML = bubbleText;
      D.sumBub.style.left = (left + width / 2) + 'px';
      if (top < 46) {
        D.sumBub.style.top = (top + height + 10) + 'px';
        D.sumBub.style.transform = 'translate(-50%, 0)';
      } else {
        D.sumBub.style.top = (top - 8) + 'px';
        D.sumBub.style.transform = 'translate(-50%, -100%)';
      }
      D.sumBub.className = 'sum-bub';
      if (sum === Config.TARGET) D.sumBub.classList.add('valid');
      else if (sum > Config.TARGET) D.sumBub.classList.add('over');
    } else {
      D.sumBub.hidden = true;
    }
  }

  function clearDragSelection(D, S) {
    if (S) {
      S.drag = false;
      S.sel = [];
    }
    if (D) {
      if (D.selBox) D.selBox.hidden = true;
      if (D.sumBub) D.sumBub.hidden = true;
      if (D.grid) highlightCells([], D.grid);
    }
  }

  function getPointerPos(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function onPointerDown(e, D, S) {
    if (!S || S.phase !== 'playing' || S.busy) return;

    if (e.button === 2) {
      if (S.drag) clearDragSelection(D, S);
      return;
    }

    var pos = getPointerPos(e);
    var containerRect = D.gridContainer.getBoundingClientRect();

    if (pos.x < containerRect.left || pos.x > containerRect.right ||
      pos.y < containerRect.top || pos.y > containerRect.bottom) {
      return;
    }

    e.preventDefault();
    S.drag = true;
    S.sx = pos.x; S.sy = pos.y; S.cx = pos.x; S.cy = pos.y;
    S.sel = [];
    S.lastActionTime = performance.now();
    if (D.grid) D.grid.classList.remove('blur-nums');

    updateDragSelection(pos.x, pos.y, D, S);
  }

  function updateDragSelection(cx, cy, D, S) {
    if (!S || !S.grid) return;
    var selLeft = Math.min(S.sx, cx);
    var selRight = Math.max(S.sx, cx);
    var selTop = Math.min(S.sy, cy);
    var selBottom = Math.max(S.sy, cy);

    var m = getCellSizeMetrics(D.grid);
    var selCells = [];

    var threshX = Math.min(11, m.cell * 0.3);
    var threshY = Math.min(11, m.cell * 0.3);

    for (var r = 0; r < Config.ROWS; r++) {
      for (var c = 0; c < Config.COLS; c++) {
        var item = S.grid[r][c];
        if (!item || item.v === 0) continue;

        var cellLeft = m.originX + c * m.stepX;
        var cellRight = cellLeft + m.cell;
        var cellTop = m.originY + r * m.stepY;
        var cellBottom = cellTop + m.cell;

        var appleCenterX = cellLeft + m.cell / 2;
        var appleCenterY = cellTop + m.cell / 2;

        var overlapX = Math.max(0, Math.min(selRight, cellRight) - Math.max(selLeft, cellLeft));
        var overlapY = Math.max(0, Math.min(selBottom, cellBottom) - Math.max(selTop, cellTop));

        var isStartInside = (
          S.sx >= cellLeft && S.sx <= cellRight &&
          S.sy >= cellTop && S.sy <= cellBottom
        );

        var isHit = (
          (isStartInside && overlapX > 0 && overlapY > 0) ||
          (appleCenterX >= selLeft && appleCenterX <= selRight &&
            appleCenterY >= selTop && appleCenterY <= selBottom) ||
          (overlapX >= threshX && overlapY >= threshY)
        );

        if (isHit) {
          selCells.push(item);
        }
      }
    }

    S.sel = selCells;
    var sum = sumCells(S.sel);

    highlightCells(S.sel, D.grid);
    updateDragBox(S.sx, S.sy, cx, cy, sum, S.sel.length, D, S);
  }

  function onPointerMove(e, D, S) {
    if (!S || !S.drag || S.phase !== 'playing') return;
    e.preventDefault();
    var pos = getPointerPos(e);
    S.cx = pos.x; S.cy = pos.y;
    S.lastActionTime = performance.now();

    updateDragSelection(pos.x, pos.y, D, S);
  }

  function onPointerUp(D, S, onValidRemoval, onFail) {
    if (!S || !S.drag) return;
    S.drag = false;
    if (D.selBox) D.selBox.hidden = true;
    if (D.sumBub) D.sumBub.hidden = true;
    S.lastActionTime = performance.now();

    if (S.phase !== 'playing') {
      clearDragSelection(D, S);
      return;
    }

    var sum = sumCells(S.sel);
    if (sum === Config.TARGET && S.sel.length >= 2) {
      if (onValidRemoval) onValidRemoval(S.sel);
    } else {
      if (S.sel.length > 0 && onFail) onFail();
      clearDragSelection(D, S);
    }
  }

  var Drag = {
    getCellSizeMetrics: getCellSizeMetrics,
    sumCells: sumCells,
    highlightCells: highlightCells,
    updateDragBox: updateDragBox,
    clearDragSelection: clearDragSelection,
    getPointerPos: getPointerPos,
    onPointerDown: onPointerDown,
    updateDragSelection: updateDragSelection,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp
  };

  rootObj.Apple10.Drag = Drag;
})(typeof window !== 'undefined' ? window : this);
