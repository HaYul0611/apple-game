/* ==========================================================================
   Apple 10 — Grid Dynamics & Apple Puzzle Algorithms (사과 격자 로직)
   ========================================================================== */
(function (root) {
  'use strict';

  var rootObj = root || window;
  rootObj.Apple10 = rootObj.Apple10 || {};
  var Config = rootObj.Apple10.Config;

  function generateAppleNumber(lv) {
    if (lv === 1) {
      var pool = [1, 9, 2, 8, 3, 7, 4, 6, 5, 5];
      return pool[Math.floor(Math.random() * pool.length)];
    }
    if (lv >= 9 && Math.random() < 0.45) {
      return Math.floor(Math.random() * 4) + 6; // 6, 7, 8, 9 (3개 이상 조합 유도)
    }
    return Math.floor(Math.random() * 9) + 1;
  }

  function generateAppleType(lv) {
    var conf = Config.LEVELS[lv] || Config.LEVELS[5];
    var rnd = Math.random();
    if (conf.goldRate > 0 && rnd < conf.goldRate) return 'gold';
    if (conf.greenRate > 0 && rnd < conf.goldRate + conf.greenRate) return 'green';
    return 'normal'; // 기본 빨간색 사과
  }

  function makeCell(r, c, lv) {
    var num = generateAppleNumber(lv);
    var type = generateAppleType(lv);
    return {
      r: r, c: c, v: num, type: type, hitCount: 0
    };
  }

  function makeGrid(lv) {
    var g = [];
    for (var r = 0; r < Config.ROWS; r++) {
      g[r] = [];
      for (var c = 0; c < Config.COLS; c++) {
        g[r][c] = makeCell(r, c, lv);
      }
    }
    return g;
  }

  function gravity(g) {
    for (var c = 0; c < Config.COLS; c++) {
      var st = [];
      for (var r = Config.ROWS - 1; r >= 0; r--) {
        if (g[r][c] !== null) st.push(g[r][c]);
      }
      for (var r = Config.ROWS - 1; r >= 0; r--) {
        g[r][c] = st.length > 0 ? st.shift() : null;
        if (g[r][c] !== null) {
          g[r][c].r = r;
          g[r][c].c = c;
        }
      }
    }
  }

  function refillGrid(g, lv) {
    for (var r = 0; r < Config.ROWS; r++) {
      for (var c = 0; c < Config.COLS; c++) {
        if (g[r][c] === null) {
          g[r][c] = makeCell(r, c, lv);
        }
      }
    }
  }

  function isGridAllClear(g) {
    for (var r = 0; r < Config.ROWS; r++) {
      for (var c = 0; c < Config.COLS; c++) {
        if (g[r][c] !== null) return false;
      }
    }
    return true;
  }

  var Grid = {
    generateAppleNumber: generateAppleNumber,
    generateAppleType: generateAppleType,
    makeCell: makeCell,
    makeGrid: makeGrid,
    gravity: gravity,
    refillGrid: refillGrid,
    isGridAllClear: isGridAllClear
  };

  rootObj.Apple10.Grid = Grid;
})(typeof window !== 'undefined' ? window : this);
