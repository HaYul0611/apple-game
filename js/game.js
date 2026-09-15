/* ==========================================================================
   Apple 10 — Main Game Controller & Coordinator (메인 게임 제어 및 이벤트 관리)
   ========================================================================== */
(function (root) {
  'use strict';

  var rootObj = root || window;
  rootObj.Apple10 = rootObj.Apple10 || {};

  var Config = rootObj.Apple10.Config;
  var Storage = rootObj.Apple10.Storage;
  var Audio = rootObj.Apple10.Audio;
  var Grid = rootObj.Apple10.Grid;
  var Drag = rootObj.Apple10.Drag;
  var UI = rootObj.Apple10.UI;
  var D = UI.D;

  /* ===========================
     게임 상태 (State)
     =========================== */
  var S = {
    phase: 'title', // 'title', 'playing', 'paused', 'result', 'menu'
    grid: [],
    score: 0,
    hi: 0,
    lv: 5,
    tLeft: 0,
    tTotal: 0,
    comboCount: 0,
    lastMatchTime: 0,
    lastActionTime: 0,
    drag: false,
    sx: 0, sy: 0, cx: 0, cy: 0,
    sel: [],
    raf: null,
    last: 0,
    snd: true,
    mot: true,
    bgmOn: true,
    bgm: 'WaltzForWork.mp3',
    busy: false,
    registeredRank: false
  };

  /* ===========================
     게임 진행 흐름 (Flow)
     =========================== */
  function startGame() {
    S.phase = 'playing';
    S.grid = Grid.makeGrid(S.lv);
    S.score = 0;
    var conf = Config.LEVELS[S.lv] || Config.LEVELS[5];
    S.tTotal = conf.time * 1000;
    S.tLeft = S.tTotal;
    S.comboCount = 0;
    S.lastMatchTime = 0;
    S.lastActionTime = performance.now();
    S.drag = false;
    S.sel = [];
    S.busy = false;
    S.registeredRank = false;
    S.last = performance.now();

    if (D.grid) D.grid.classList.remove('hide-nums', 'blur-nums');

    UI.renderGrid(D, S);
    UI.updateHUD(D, S);
    UI.showScreen('game', D);

    // BGM 재생
    Audio.playBgmTrack(S.bgm, true, S, function () { UI.updateBgmUI(D, S); }, function () { Storage.saveSettings(S); });

    if (S.raf) cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(gameLoop);
  }

  function gameLoop(now) {
    if (S.phase !== 'playing') return;
    var dt = now - S.last;
    S.last = now;
    if (dt > 200) dt = 200; // RAF 탭 비활성화 렉 보호

    S.tLeft -= dt;
    UI.updateHUD(D, S);

    var conf = Config.LEVELS[S.lv] || Config.LEVELS[5];

    // 기억력 블러 체크 (Lv 8+ 미조작 3.5초 경과 시)
    if (conf.blurIdle) {
      if (now - S.lastActionTime > 3500 && !S.drag) {
        if (D.grid) D.grid.classList.add('blur-nums');
      } else {
        if (D.grid) D.grid.classList.remove('blur-nums');
      }
    }

    // 콤보 만료 체크 (3.5초 경과 시)
    if (conf.combo && S.comboCount > 0 && now - S.lastMatchTime > 3500) {
      S.comboCount = 0;
      UI.updateHUD(D, S);
    }

    // 시간 초과 종료
    if (S.tLeft <= 0) {
      S.tLeft = 0;
      UI.updateHUD(D, S);
      finishGame(false);
      return;
    }

    // 클리어 모드 종료 (판 모두 비움)
    if (!conf.refill && Grid.isGridAllClear(S.grid)) {
      finishGame(true);
      return;
    }

    S.raf = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (S.phase !== 'playing') return;
    S.phase = 'paused';
    if (S.raf) cancelAnimationFrame(S.raf);
    Drag.clearDragSelection(D, S);
  }

  function resumeGame() {
    if (S.phase !== 'paused') return;
    S.phase = 'playing';
    S.last = performance.now();
    S.lastActionTime = performance.now();
    S.raf = requestAnimationFrame(gameLoop);
  }

  function openMenu() {
    if (S.phase === 'playing') pauseGame();
    S.phase = 'menu';
    if (D.mLvSlider) D.mLvSlider.value = S.lv;
    if (D.mLvVal) D.mLvVal.textContent = S.lv;
    var conf = Config.LEVELS[S.lv] || Config.LEVELS[5];
    if (D.mLvNote) D.mLvNote.textContent = '[' + conf.title + '] ' + conf.time + '초 즉시 반영';
    UI.showScreen('menu', D);
  }

  function closeMenu() {
    if (D.menuOv) D.menuOv.hidden = true;
    if (S.tLeft > 0 && S.tTotal > 0) {
      S.phase = 'paused';
      UI.showScreen('game', D);
      resumeGame();
    } else {
      goToTitle();
    }
  }

  function finishGame(cleared) {
    S.phase = 'result';
    if (S.raf) cancelAnimationFrame(S.raf);
    Drag.clearDragSelection(D, S);
    Audio.sndEnd(cleared, S);

    var isNew = S.score > S.hi;
    if (isNew) {
      S.hi = S.score;
      Storage.saveSettings(S);
    }

    if (D.rTitle) D.rTitle.textContent = cleared ? '🎉 올 클리어! (ALL CLEAR)' : '⏰ TIME UP (종료)';
    if (D.rScore) D.rScore.textContent = S.score;
    if (D.rHigh) D.rHigh.textContent = S.hi;
    if (D.rNew) D.rNew.hidden = !isNew;
    if (D.rankRegMsg) D.rankRegMsg.textContent = '';
    if (D.playerNick) D.playerNick.value = '';

    UI.showScreen('result', D);
  }

  function goToTitle() {
    S.phase = 'title';
    if (S.raf) cancelAnimationFrame(S.raf);
    Drag.clearDragSelection(D, S);
    S.tLeft = 0;
    S.tTotal = 0;
    UI.showScreen('title', D);
  }

  /* ===========================
     사과 제거 & 특수 효과 (콤보, 황금/초록 사과)
     =========================== */
  function executeValidRemoval(cells) {
    S.busy = true;
    var conf = Config.LEVELS[S.lv] || Config.LEVELS[5];
    var children = D.grid ? D.grid.children : [];

    var hasGold = false;
    var fullyRemovedCount = 0;

    for (var i = 0; i < cells.length; i++) {
      var item = cells[i];
      var idx = item.r * Config.COLS + item.c;

      if (item.type === 'green' && item.hitCount === 0) {
        item.hitCount = 1;
        if (children[idx]) {
          children[idx].innerHTML = Config.getAppleSVG(item.v, item.type, item.hitCount);
        }
      } else {
        if (item.type === 'gold') hasGold = true;
        if (children[idx]) {
          children[idx].classList.remove('selected');
          children[idx].classList.add('removing');
        }
        S.grid[item.r][item.c] = null;
        fullyRemovedCount++;
      }
    }

    S.comboCount++;
    S.lastMatchTime = performance.now();

    var comboMultiplier = (conf.combo && S.comboCount > 1) ? Math.min(3, 1 + (S.comboCount - 1) * 0.5) : 1;
    var baseScore = fullyRemovedCount;
    if (hasGold) baseScore += 3;

    S.score += Math.round(baseScore * comboMultiplier);

    if (hasGold) {
      S.tLeft = Math.min(S.tTotal, S.tLeft + 2000);
    }

    UI.updateHUD(D, S);
    if (D.hScore) {
      D.hScore.classList.remove('bump');
      void D.hScore.offsetWidth;
      D.hScore.classList.add('bump');
    }

    Audio.sndSuccess(hasGold, S);
    if (conf.combo && S.comboCount > 1) Audio.sndCombo(S.comboCount, S);

    if (navigator.vibrate && S.mot) {
      try {
        if (hasGold) navigator.vibrate([30, 40, 35]);
        else if (conf.combo && S.comboCount > 1) navigator.vibrate([20, 25, 20]);
        else navigator.vibrate(20);
      } catch (e) { }
    }

    var animDelay = S.mot ? 350 : 10;
    setTimeout(function () {
      Grid.gravity(S.grid);
      if (conf.refill) Grid.refillGrid(S.grid, S.lv);
      S.sel = [];
      S.busy = false;
      UI.renderGrid(D, S);
    }, animDelay);
  }

  /* ===========================
     명예의 전당 랭킹 제어
     =========================== */
  function openLeaderboard() {
    UI.closeAllCustomSelects();
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    if (D.rankOv) D.rankOv.hidden = false;
    var localRanks = Storage.loadRankings();
    UI.renderRankTable(localRanks, null, D);
    if (D.closeRankBtn) D.closeRankBtn.focus();

    try {
      fetch('https://api.counterapi.dev/v1/apple10_nintendo_leaderboard/sync')
        .then(function () { })
        .catch(function () { });
    } catch (e) { }
  }

  function submitPlayerRank() {
    if (S.registeredRank) {
      if (D.rankRegMsg) D.rankRegMsg.textContent = '이미 등록된 점수입니다.';
      return;
    }
    var nick = (D.playerNick.value || '').trim().toUpperCase();
    if (!nick || nick.length < 2 || nick.length > 8) {
      if (D.rankRegMsg) D.rankRegMsg.textContent = '닉네임은 2~8글자로 입력해주세요.';
      return;
    }

    var ranks = Storage.loadRankings();
    var today = new Date();
    var dateStr = (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');

    var newEntry = {
      name: nick,
      score: S.score,
      lv: S.lv,
      date: dateStr
    };
    ranks.push(newEntry);

    ranks.sort(function (a, b) { return b.score - a.score; });
    var addedRankIndex = ranks.indexOf(newEntry);
    ranks = ranks.slice(0, 100);
    Storage.saveRankings(ranks);

    S.registeredRank = true;
    var rankDisplay = (addedRankIndex >= 0) ? (addedRankIndex + 1) + '위' : '등록';
    if (D.rankRegMsg) D.rankRegMsg.textContent = '✅ ' + nick + '님 ' + S.score + '점 (' + rankDisplay + ') 등록 완료!';

    UI.renderRankTable(ranks, addedRankIndex, D);
  }

  function clearAllRankings() {
    UI.openConfirmModal(function () {
      localStorage.removeItem(Config.RANK_KEY);
      UI.renderRankTable([], null, D);
      if (D.rankRegMsg) {
        D.rankRegMsg.textContent = '내 기기의 로컬 랭킹 기록이 초기화되었습니다.';
      }
    }, D);
  }

  /* ===========================
     전체 이벤트 바인딩 (Event Bindings)
     =========================== */
  function bindEvents() {
    // 1) 시작 화면 및 기본 설정
    if (D.startBtn) D.startBtn.addEventListener('click', startGame);
    if (D.rankBtnTitle) D.rankBtnTitle.addEventListener('click', openLeaderboard);
    if (D.rankBtnMenu) D.rankBtnMenu.addEventListener('click', openLeaderboard);
    if (D.viewRankBtn) D.viewRankBtn.addEventListener('click', openLeaderboard);

    if (D.lvSlider) {
      D.lvSlider.addEventListener('input', function () {
        var val = parseInt(D.lvSlider.value, 10);
        UI.updateLevelTags(val, D);
        S.lv = val;
        if (D.mLvSlider) D.mLvSlider.value = val;
        if (D.mLvVal) D.mLvVal.textContent = val;
        Storage.saveSettings(S);
      });
    }

    // 2) 메뉴 & 오버레이 조작
    if (D.menuBtn) D.menuBtn.addEventListener('click', openMenu);
    if (D.resumeBtn) D.resumeBtn.addEventListener('click', closeMenu);

    // ★ 모달창 바깥 영역(배경 오버레이) 클릭 시 닫기 (설정창, 랭킹창, 확인창 전체 적용)
    if (D.menuOv) {
      D.menuOv.addEventListener('click', function (e) {
        if (e.target === D.menuOv) {
          closeMenu();
        }
      });
    }
    if (D.rankOv) {
      D.rankOv.addEventListener('click', function (e) {
        if (e.target === D.rankOv) {
          D.rankOv.hidden = true;
        }
      });
    }
    if (D.confirmOv) {
      D.confirmOv.addEventListener('click', function (e) {
        if (e.target === D.confirmOv) {
          D.confirmOv.hidden = true;
        }
      });
    }

    if (D.mRetryBtn) {
      D.mRetryBtn.addEventListener('click', function () {
        D.menuOv.hidden = true;
        startGame();
      });
    }

    if (D.titleBtn) {
      D.titleBtn.addEventListener('click', function () {
        D.menuOv.hidden = true;
        goToTitle();
      });
    }

    if (D.retryBtn) {
      D.retryBtn.addEventListener('click', function () {
        D.resultOv.hidden = true;
        startGame();
      });
    }

    if (D.rTitleBtn) {
      D.rTitleBtn.addEventListener('click', function () {
        D.resultOv.hidden = true;
        goToTitle();
      });
    }

    // 설정 창 난이도 슬라이더
    if (D.mLvSlider) {
      D.mLvSlider.addEventListener('input', function () {
        var val = parseInt(D.mLvSlider.value, 10);
        if (D.mLvVal) D.mLvVal.textContent = val;
        var conf = Config.LEVELS[val] || Config.LEVELS[5];
        if (D.mLvNote) D.mLvNote.textContent = '[' + conf.title + '] ' + conf.time + '초 즉시 반영';
        S.lv = val;
        if (D.lvSlider) D.lvSlider.value = val;
        UI.updateLevelTags(val, D);
        Storage.saveSettings(S);

        if (S.phase === 'playing' || S.phase === 'menu') {
          S.score = 0;
          S.tTotal = conf.time * 1000;
          S.tLeft = S.tTotal;
          S.comboCount = 0;
          S.grid = Grid.makeGrid(val);
          Drag.clearDragSelection(D, S);
          if (D.grid) D.grid.classList.remove('hide-nums', 'blur-nums');
          UI.renderGrid(D, S);
          UI.updateHUD(D, S);
        }
      });
    }

    // 효과음 스위치
    if (D.sndTgl) {
      D.sndTgl.addEventListener('click', function () {
        S.snd = !S.snd;
        UI.updateSwitchUI(D.sndTgl, S.snd);
        Storage.saveSettings(S);
        if (S.snd && S.bgmOn) {
          Audio.playBgmTrack(S.bgm, true, S, function () { UI.updateBgmUI(D, S); }, function () { Storage.saveSettings(S); });
        } else {
          Audio.stopBgm();
        }
      });
    }

    // 배경음악 토글
    var handleBgmToggle = function () {
      Audio.toggleBgm(
        S,
        function () { UI.updateBgmUI(D, S); },
        function () { Storage.saveSettings(S); },
        function () { UI.closeAllCustomSelects(); }
      );
    };
    if (D.bgmTgl) D.bgmTgl.addEventListener('click', handleBgmToggle);
    if (D.mBgmTgl) D.mBgmTgl.addEventListener('click', handleBgmToggle);

    // BGM 셀렉트 박스
    if (D.bgmSelect) {
      D.bgmSelect.addEventListener('change', function () {
        Audio.changeBgmTrack(D.bgmSelect.value, S, function () { UI.updateBgmUI(D, S); }, function () { Storage.saveSettings(S); });
      });
    }
    if (D.mBgmSelect) {
      D.mBgmSelect.addEventListener('change', function () {
        Audio.changeBgmTrack(D.mBgmSelect.value, S, function () { UI.updateBgmUI(D, S); }, function () { Storage.saveSettings(S); });
      });
    }

    // 커스텀 셀렉트 드롭다운
    function initCustomSelect(triggerEl, wrapEl, menuEl) {
      if (!triggerEl || !wrapEl || !menuEl) return;
      triggerEl.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasOpen = wrapEl.classList.contains('is-open');
        UI.closeAllCustomSelects();
        if (!wasOpen) {
          wrapEl.classList.add('is-open');
          triggerEl.setAttribute('aria-expanded', 'true');
          var parentRow = wrapEl.closest('.set-row-bgm, .bgm-select-wrap');
          if (parentRow) parentRow.classList.add('open-active');
        }
      });

      menuEl.addEventListener('click', function (e) {
        var opt = e.target.closest('.custom-select-opt');
        if (!opt) return;
        e.stopPropagation();
        var trackKey = opt.getAttribute('data-value');
        Audio.changeBgmTrack(trackKey, S, function () { UI.updateBgmUI(D, S); }, function () { Storage.saveSettings(S); });
        UI.closeAllCustomSelects();
      });
    }

    initCustomSelect(D.customBgmTrigger, D.customBgmSelect, D.customBgmMenu);
    initCustomSelect(D.customMBgmTrigger, D.customMBgmSelect, D.customMBgmMenu);

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.custom-select')) {
        UI.closeAllCustomSelects();
      }
    });

    // 애니메이션 스위치
    if (D.motTgl) {
      D.motTgl.addEventListener('click', function () {
        S.mot = !S.mot;
        UI.updateSwitchUI(D.motTgl, S.mot);
        document.documentElement.classList.toggle('no-motion', !S.mot);
        Storage.saveSettings(S);
      });
    }

    // 랭킹 및 확인창 버튼
    if (D.submitRankBtn) D.submitRankBtn.addEventListener('click', submitPlayerRank);
    if (D.clearRankBtn) D.clearRankBtn.addEventListener('click', clearAllRankings);
    if (D.closeRankBtn) D.closeRankBtn.addEventListener('click', function () { D.rankOv.hidden = true; });
    if (D.refreshRankBtn) D.refreshRankBtn.addEventListener('click', function () { UI.renderRankTable(Storage.loadRankings(), null, D); });

    // 닌텐도 조이콘 하드웨어 버튼
    if (D.joyA) {
      D.joyA.addEventListener('click', function () {
        if (S.phase === 'title') startGame();
        else if (S.phase === 'result') startGame();
        else if (S.phase === 'menu') {
          D.menuOv.hidden = true;
          startGame();
        }
      });
    }
    if (D.joyB) {
      D.joyB.addEventListener('click', function () {
        if (D.confirmOv && !D.confirmOv.hidden) {
          D.confirmOv.hidden = true;
          return;
        }
        if (D.rankOv && !D.rankOv.hidden) D.rankOv.hidden = true;
        else if (S.phase === 'menu') closeMenu();
        else if (S.phase === 'result') goToTitle();
      });
    }
    if (D.joyMinus) D.joyMinus.addEventListener('click', openMenu);
    if (D.joyPlus) D.joyPlus.addEventListener('click', openMenu);
    if (D.joyCapture) D.joyCapture.addEventListener('click', openLeaderboard);
    if (D.joyHome) D.joyHome.addEventListener('click', goToTitle);

    var incLv = function () {
      var v = Math.min(10, S.lv + 1);
      if (D.lvSlider) D.lvSlider.value = v;
      UI.updateLevelTags(v, D);
      S.lv = v;
      if (D.mLvSlider) D.mLvSlider.value = v;
      if (D.mLvVal) D.mLvVal.textContent = v;
      Storage.saveSettings(S);
      if (S.phase === 'playing' || S.phase === 'menu') {
        S.score = 0;
        S.tTotal = Config.LEVELS[v].time * 1000;
        S.tLeft = S.tTotal;
        S.comboCount = 0;
        S.grid = Grid.makeGrid(v);
        Drag.clearDragSelection(D, S);
        if (D.grid) D.grid.classList.remove('hide-nums', 'blur-nums');
        UI.renderGrid(D, S);
        UI.updateHUD(D, S);
      }
    };
    if (D.joyDUp) D.joyDUp.addEventListener('click', incLv);
    if (D.joyDRight) D.joyDRight.addEventListener('click', incLv);

    var decLv = function () {
      var v = Math.max(1, S.lv - 1);
      if (D.lvSlider) D.lvSlider.value = v;
      UI.updateLevelTags(v, D);
      S.lv = v;
      if (D.mLvSlider) D.mLvSlider.value = v;
      if (D.mLvVal) D.mLvVal.textContent = v;
      Storage.saveSettings(S);
      if (S.phase === 'playing' || S.phase === 'menu') {
        S.score = 0;
        S.tTotal = Config.LEVELS[v].time * 1000;
        S.tLeft = S.tTotal;
        S.comboCount = 0;
        S.grid = Grid.makeGrid(v);
        Drag.clearDragSelection(D, S);
        if (D.grid) D.grid.classList.remove('hide-nums', 'blur-nums');
        UI.renderGrid(D, S);
        UI.updateHUD(D, S);
      }
    };
    if (D.joyDDown) D.joyDDown.addEventListener('click', decLv);
    if (D.joyDLeft) D.joyDLeft.addEventListener('click', decLv);

    // ★ 키보드 제어 (ESC: 열린 모달 닫기 / Enter: 시작 및 등록)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var openSel = document.querySelector('.custom-select.is-open');
        if (openSel) {
          UI.closeAllCustomSelects();
          return;
        }
        if (D.confirmOv && !D.confirmOv.hidden) {
          D.confirmOv.hidden = true;
          return;
        }
        if (D.menuOv && !D.menuOv.hidden) {
          closeMenu();
          return;
        }
        if (D.rankOv && !D.rankOv.hidden) {
          D.rankOv.hidden = true;
          return;
        }
        if (S.drag) {
          Drag.clearDragSelection(D, S);
          return;
        }
        if (S.phase === 'playing') {
          openMenu();
        }
      }
      if (e.key === 'Enter') {
        if (S.phase === 'result' && document.activeElement === D.playerNick) {
          submitPlayerRank();
        }
      }
    });

    // 드래그 제어 (마우스 & 터치)
    if (D.gridContainer) {
      D.gridContainer.addEventListener('mousedown', function (e) { Drag.onPointerDown(e, D, S); });
      D.gridContainer.addEventListener('touchstart', function (e) { Drag.onPointerDown(e, D, S); }, { passive: false });
      D.gridContainer.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        if (S.drag) Drag.clearDragSelection(D, S);
      });
    }

    document.addEventListener('mousemove', function (e) { Drag.onPointerMove(e, D, S); });
    document.addEventListener('mouseup', function () {
      Drag.onPointerUp(D, S, executeValidRemoval, function () { Audio.sndFail(S); });
    });

    document.addEventListener('touchmove', function (e) { Drag.onPointerMove(e, D, S); }, { passive: false });
    document.addEventListener('touchend', function () {
      Drag.onPointerUp(D, S, executeValidRemoval, function () { Audio.sndFail(S); });
    });

    // 탭 전환 및 블러 포커스 처리
    document.addEventListener('visibilitychange', function () {
      var bgm = Audio.getBgmAudio();
      if (document.hidden) {
        if (S.phase === 'playing') openMenu();
        if (bgm && !bgm.paused) bgm.pause();
      } else {
        if (S.snd && S.bgmOn && bgm && (S.phase === 'playing' || S.phase === 'title' || S.phase === 'menu')) {
          var p = bgm.play();
          if (p && p.catch) p.catch(function () { });
        }
      }
    });
    window.addEventListener('blur', function () {
      if (S.phase === 'playing') openMenu();
    });

    // 첫 인터랙션 시 오디오 언락 & BGM 자동 재생 연결
    function handleAudioUnlock() {
      Audio.unlockAudio(S);
      window.removeEventListener('pointerdown', handleAudioUnlock);
      window.removeEventListener('keydown', handleAudioUnlock);
    }
    window.addEventListener('pointerdown', handleAudioUnlock);
    window.addEventListener('keydown', handleAudioUnlock);
  }

  /* ===========================
     초기화 (Init)
     =========================== */
  function init() {
    UI.cacheDOM();

    var saved = Storage.loadSettings();
    S.hi = saved.hi;
    S.lv = saved.lv;
    S.snd = saved.snd;
    S.mot = saved.mot;
    S.bgmOn = (typeof saved.bgmOn === 'boolean') ? saved.bgmOn : true;
    S.bgm = saved.bgm || 'WaltzForWork.mp3';

    Audio.initBgm(S);
    UI.updateBgmUI(D, S);

    // ★ BGM ON 상태 시 초기 자동 재생 시도
    if (S.bgmOn && S.snd) {
      Audio.playBgmTrack(S.bgm, true, S, function () { UI.updateBgmUI(D, S); }, function () { Storage.saveSettings(S); });
    }

    if (D.lvSlider) D.lvSlider.value = S.lv;
    if (D.mLvSlider) D.mLvSlider.value = S.lv;
    if (D.mLvVal) D.mLvVal.textContent = S.lv;
    if (D.hHigh) D.hHigh.textContent = S.hi;
    UI.updateLevelTags(S.lv, D);

    UI.updateSwitchUI(D.sndTgl, S.snd);
    UI.updateSwitchUI(D.motTgl, S.mot);
    if (!S.mot) document.documentElement.classList.add('no-motion');

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      S.mot = false;
      UI.updateSwitchUI(D.motTgl, false);
      document.documentElement.classList.add('no-motion');
    }

    UI.setupTitleHeroApples(D);
    bindEvents();
    UI.showScreen('title', D);
  }

  document.addEventListener('DOMContentLoaded', init);

  rootObj.Apple10.Game = {
    state: S,
    init: init,
    startGame: startGame,
    openMenu: openMenu,
    closeMenu: closeMenu,
    goToTitle: goToTitle
  };
})(typeof window !== 'undefined' ? window : this);