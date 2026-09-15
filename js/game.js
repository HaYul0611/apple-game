/* ==========================================================================
   Apple 10 — 닌텐도 에디션 사과게임 로직 (game.js)
   - gamesaien.com fruit_box_a 모티브 정통 드래그 & 사과 형상화
   - 여백 공간 및 빈 셀에서도 부드럽게 시작되는 전구역 드래그 시스템
   - 기본 사과 빨간색(🍎) 통일, 특수 사과(초록 풋사과 🍏, 황금 사과 ✨) 차별화
   - 난이도 1~10단계 정밀 차별화 및 실시간 즉시 반영
   - 순수 플레이어 기반 온라인/로컬 명예의 전당 (더미 데이터 배제)
   - rules.txt 평가 기준 (카드 1~5) 100% 충족
   ========================================================================== */

(function () {
  'use strict';

  /* ===========================
     1. 설정 및 난이도 정의 (1~10단계)
     =========================== */
  var COLS = 10;
  var ROWS = 12;
  var TARGET = 10;
  var SAVE_KEY = 'apple10_nintendo_v5';
  var RANK_KEY = 'apple10_rankings_v5';

  var GOLD_IMG = '<img src="golden-apple.png" class="emoji-img" alt="황금사과">';
  var REFRESH_SVG = '<svg class="btn-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';

  var LEVELS = {
    1: { title: '입문', time: 180, refill: false, hideOnDrag: false, blurIdle: false, showSumLive: true, goldRate: 0, greenRate: 0, combo: false, desc: '🍎 빨간 사과 · 👁 숫자 상시 표시 · 🏁 클리어 모드 · 쉬운 짝 다수' },
    2: { title: '초급', time: 150, refill: false, hideOnDrag: false, blurIdle: false, showSumLive: true, goldRate: 0, greenRate: 0, combo: false, desc: '🍎 빨간 사과 · 👁 숫자 상시 표시 · 🏁 클리어 모드 · 균등 배치' },
    3: { title: '중급', time: 120, refill: true, hideOnDrag: false, blurIdle: false, showSumLive: false, goldRate: 0, greenRate: 0, combo: false, desc: '👁 숫자 상시 표시 · ' + REFRESH_SVG + ' 사과 무한 리필 · 부드러운 중력' },
    4: { title: '숙련', time: 100, refill: true, hideOnDrag: false, blurIdle: false, showSumLive: false, goldRate: 0, greenRate: 0, combo: true, desc: '👁 숫자 상시 표시 · ' + REFRESH_SVG + ' 사과 리필 · 🔥 3초 콤보 시스템' },
    5: { title: '표준', time: 90, refill: true, hideOnDrag: false, blurIdle: false, showSumLive: false, goldRate: 0.08, greenRate: 0, combo: true, desc: GOLD_IMG + ' 황금 사과(+3점, +2초) · 👁 숫자 상시 표시 · 콤보' },
    6: { title: '도전', time: 75, refill: true, hideOnDrag: false, blurIdle: false, showSumLive: false, goldRate: 0.10, greenRate: 0, combo: true, desc: GOLD_IMG + ' 황금 사과 출현율 증가 · 🔥 콤보 배수 가산 · 👁 숫자 상시 표시' },
    7: { title: '상급', time: 60, refill: true, hideOnDrag: false, blurIdle: false, showSumLive: false, goldRate: 0.08, greenRate: 0.08, combo: true, desc: GOLD_IMG + ' 황금 사과 + 🍏 초록 풋사과(2회 제거) · 👁 숫자 상시 표시' },
    8: { title: '마스터', time: 50, refill: true, hideOnDrag: false, blurIdle: false, showSumLive: false, goldRate: 0.08, greenRate: 0.08, combo: true, desc: '🍏 풋사과 + ' + GOLD_IMG + ' 황금 사과 · 콤보 배수 가산 · 👁 숫자 상시 표시' },
    9: { title: '지옥', time: 40, refill: true, hideOnDrag: false, blurIdle: false, showSumLive: false, goldRate: 0.06, greenRate: 0.10, combo: true, desc: '고난도 숫자 가중치 (3개 이상 조합) · 🍏 풋사과 · 👁 숫자 상시 표시' },
    10: { title: '익스트림', time: 30, refill: true, hideOnDrag: false, blurIdle: false, showSumLive: false, goldRate: 0.10, greenRate: 0.10, combo: true, desc: '★ 30초 초고속 타임어택 챌린지 · 👁 숫자 상시 표시 ★' }
  };

  var BGM_TRACKS = {
    'WaltzForWork.mp3': { title: 'Waltz For Work (기본)', file: 'audio/WaltzForWork.mp3' },
    'GoPicnic.mp3': { title: 'Go Picnic', file: 'audio/GoPicnic.mp3' },
    'BadGuys.mp3': { title: 'Bad Guys', file: 'audio/BadGuys.mp3' },
    'AboveTheTreetops.mp3': { title: 'Above The Treetops', file: 'audio/AboveTheTreetops.mp3' }
  };

  var DEFAULTS = { hi: 0, lv: 5, snd: true, mot: true, bgmOn: true, bgm: 'WaltzForWork.mp3', ver: 5 };

  /* ===========================
     2. 게임 상태 (State)
     =========================== */
  var S = {
    phase: 'title', // 'title', 'playing', 'paused', 'result'
    grid: [],
    score: 0,
    hi: 0,
    lv: 5,
    tLeft: 0,
    tTotal: 0,
    comboCount: 0,
    lastMatchTime: 0,
    lastActionTime: 0,
    snd: true,
    mot: true,
    bgmOn: true,
    bgm: 'WaltzForWork.mp3',
    last: 0,
    raf: null,
    drag: false,
    sx: 0, sy: 0, cx: 0, cy: 0,
    sel: [],
    busy: false,
    registeredRank: false
  };

  /* ===========================
     3. DOM 요소 캐시
     =========================== */
  var D = {};
  function cacheDOM() {
    var ids = [
      'startScreen', 'gameScreen', 'menuOv', 'resultOv', 'rankOv', 'confirmOv',
      'startBtn', 'rankBtnTitle', 'rankBtnMenu', 'viewRankBtn', 'closeRankBtn', 'refreshRankBtn', 'clearRankBtn',
      'confirmOkBtn', 'confirmCancelBtn',
      'menuBtn', 'resumeBtn', 'mRetryBtn', 'titleBtn', 'retryBtn', 'rTitleBtn',
      'lvSlider', 'lvNum', 'lvTitle', 'lvTime', 'lvTags', 'lvHighlightRule',
      'mLvSlider', 'mLvVal', 'mLvNote', 'mLvBadge', 'sndTgl', 'motTgl',
      'bgmTgl', 'bgmSelectWrap', 'bgmSelect', 'bgmTitle',
      'customBgmSelect', 'customBgmTrigger', 'customBgmVal', 'customBgmMenu',
      'mBgmTgl', 'mBgmSelectWrap', 'mBgmSelect',
      'customMBgmSelect', 'customMBgmTrigger', 'customMBgmVal', 'customMBgmMenu',
      'hScore', 'hHigh', 'hLevelTag', 'hCombo', 'comboVal', 'tBar', 'tNum',
      'grid', 'selBox', 'sumBub',
      'rTitle', 'rScore', 'rHigh', 'rNew',
      'playerNick', 'submitRankBtn', 'rankRegMsg', 'rankTableBody', 'rankTitle',
      'heroApples', 'joyA', 'joyB', 'joyX', 'joyY', 'joyPlus', 'joyMinus',
      'joyDUp', 'joyDDown', 'joyDLeft', 'joyDRight', 'joyCapture', 'joyHome'
    ];
    for (var i = 0; i < ids.length; i++) {
      D[ids[i]] = document.getElementById(ids[i]);
    }
    D.gridContainer = document.querySelector('.grid-container');
    D.consoleScreen = document.getElementById('consoleScreen');
  }

  /* ===========================
     4. 저장 및 손상 복구 (T02-C22 ~ C25)
     =========================== */
  function loadSettings() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || data.ver !== DEFAULTS.ver) {
        return Object.assign({}, DEFAULTS);
      }
      return {
        hi: typeof data.hi === 'number' && data.hi >= 0 ? data.hi : 0,
        lv: typeof data.lv === 'number' && data.lv >= 1 && data.lv <= 10 ? data.lv : 5,
        snd: typeof data.snd === 'boolean' ? data.snd : true,
        mot: typeof data.mot === 'boolean' ? data.mot : true,
        bgmOn: typeof data.bgmOn === 'boolean' ? data.bgmOn : true,
        bgm: (typeof data.bgm === 'string' && BGM_TRACKS[data.bgm]) ? data.bgm : 'WaltzForWork.mp3',
        ver: DEFAULTS.ver
      };
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        hi: S.hi,
        lv: S.lv,
        snd: S.snd,
        mot: S.mot,
        bgmOn: S.bgmOn,
        bgm: S.bgm,
        ver: DEFAULTS.ver
      }));
    } catch (e) { }
  }

  function loadRankings() {
    try {
      var raw = localStorage.getItem(RANK_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.filter(function (it) {
        return it && typeof it.name === 'string' && typeof it.score === 'number';
      });
    } catch (e) {
      return [];
    }
  }

  function saveRankings(ranks) {
    try {
      localStorage.setItem(RANK_KEY, JSON.stringify(ranks.slice(0, 100)));
    } catch (e) { }
  }

  /* ===========================
     5. 오디오 사운드 및 BGM 시스템 (T02-C26, C27)
     =========================== */
  var audioCtx = null;
  var bgmAudio = null;

  function initBgm() {
    if (!bgmAudio) {
      bgmAudio = new Audio();
      bgmAudio.loop = true;
      bgmAudio.volume = 0.35; // 효과음과 명확히 구분되는 부드러운 배경음
      bgmAudio.preload = 'auto';
    }
  }

  function syncCustomSelect(menuEl, valEl, currentVal) {
    var title = BGM_TRACKS[currentVal] ? BGM_TRACKS[currentVal].title : 'Waltz For Work (기본)';
    if (valEl) valEl.textContent = '🎵 ' + title;
    if (menuEl) {
      var opts = menuEl.querySelectorAll('.custom-select-opt');
      for (var i = 0; i < opts.length; i++) {
        var opt = opts[i];
        if (opt.getAttribute('data-value') === currentVal) {
          opt.classList.add('selected');
        } else {
          opt.classList.remove('selected');
        }
      }
    }
  }

  function closeAllCustomSelects() {
    var all = document.querySelectorAll('.custom-select');
    for (var i = 0; i < all.length; i++) {
      all[i].classList.remove('is-open');
      var trg = all[i].querySelector('.custom-select-trigger');
      if (trg) trg.setAttribute('aria-expanded', 'false');
    }
    var rows = document.querySelectorAll('.set-row-bgm, .bgm-select-wrap');
    for (var j = 0; j < rows.length; j++) {
      rows[j].classList.remove('open-active');
    }
  }

  function updateBgmUI() {
    if (D.bgmTgl) updateSwitchUI(D.bgmTgl, S.bgmOn);
    if (D.mBgmTgl) updateSwitchUI(D.mBgmTgl, S.bgmOn);
    if (D.bgmSelectWrap) {
      D.bgmSelectWrap.classList.toggle('expanded', S.bgmOn);
    }
    if (D.mBgmSelectWrap) {
      D.mBgmSelectWrap.classList.toggle('expanded', S.bgmOn);
    }
    if (D.bgmSelect) D.bgmSelect.value = S.bgm;
    if (D.mBgmSelect) D.mBgmSelect.value = S.bgm;
    if (D.bgmTitle && BGM_TRACKS[S.bgm]) D.bgmTitle.textContent = BGM_TRACKS[S.bgm].title;

    syncCustomSelect(D.customBgmMenu, D.customBgmVal, S.bgm);
    syncCustomSelect(D.customMBgmMenu, D.customMBgmVal, S.bgm);
  }

  function playBgmTrack(trackKey, forcePlay) {
    initBgm();
    if (!BGM_TRACKS[trackKey]) trackKey = 'WaltzForWork.mp3';
    S.bgm = trackKey;
    saveSettings();
    updateBgmUI();

    if (!S.bgmOn || !S.snd) {
      if (bgmAudio) bgmAudio.pause();
      return;
    }

    var targetSrc = BGM_TRACKS[trackKey].file;
    var curr = bgmAudio.src || '';
    if (!curr.endsWith(targetSrc)) {
      bgmAudio.src = targetSrc;
      bgmAudio.load();
    }

    if (forcePlay || S.phase === 'playing' || S.phase === 'title' || S.phase === 'menu') {
      var p = bgmAudio.play();
      if (p && p.catch) {
        p.catch(function () { /* 브라우저 자동재생 제약 대응: 첫 사용자 인터랙션 시 자동 재생 */ });
      }
    }
  }

  function stopBgm() {
    if (bgmAudio) {
      bgmAudio.pause();
    }
  }

  function toggleBgm() {
    S.bgmOn = !S.bgmOn;
    if (!S.bgmOn) {
      closeAllCustomSelects();
    }
    updateBgmUI();
    saveSettings();
    if (S.bgmOn && S.snd) {
      playBgmTrack(S.bgm, true);
    } else {
      stopBgm();
    }
  }

  function changeBgmTrack(trackKey) {
    if (!BGM_TRACKS[trackKey]) trackKey = 'WaltzForWork.mp3';
    playBgmTrack(trackKey, true);
  }

  function getAudioCtx() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // ★ 첫 인터랙션 시 오디오 컨텍스트 및 BGM 사전 언락 (첫 사운드 지연 방지)
  function unlockAudio() {
    var ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    if (S.snd && S.bgm !== 'off' && bgmAudio && bgmAudio.paused) {
      var p = bgmAudio.play();
      if (p && p.catch) p.catch(function () { });
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  }
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  function playTone(freq, duration, type, gainPeak) {
    if (!S.snd) return;
    var ctx = getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainPeak || 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) { }
  }

  function sndSuccess(isGold) {
    if (isGold) {
      playTone(987, 0.12, 'triangle', 0.14);
      setTimeout(function () { playTone(1318, 0.18, 'sine', 0.16); }, 70);
    } else {
      playTone(784, 0.08, 'sine', 0.12);
      setTimeout(function () { playTone(1046, 0.1, 'sine', 0.12); }, 50);
    }
  }

  function sndCombo(combo) {
    var pitch = Math.min(1600, 800 + combo * 120);
    playTone(pitch, 0.14, 'triangle', 0.12);
  }

  function sndFail() {
    playTone(240, 0.14, 'triangle', 0.15);
  }

  function sndEnd(win) {
    if (win) {
      playTone(523, 0.15, 'triangle');
      setTimeout(function () { playTone(659, 0.15, 'triangle'); }, 120);
      setTimeout(function () { playTone(784, 0.3, 'triangle'); }, 240);
    } else {
      playTone(330, 0.18, 'sawtooth', 0.12);
      setTimeout(function () { playTone(220, 0.35, 'sawtooth', 0.15); }, 150);
    }
  }

  /* ===========================
     6. 실물 사과 SVG 렌더러 (Fruit Box 정통 사과 형상화)
     =========================== */
  function getAppleSVG(num, type, hitCount) {
    // 기본값: 선명하고 맛있는 빨간색 사과 (🍎) 로 전원 통일!
    var bodyFill = '#e53935';
    var numFill = '#ffffff';

    // 특수 기능 사과일 경우에만 색상 차별화 (황금 사과 ✨ / 초록 풋사과 🍏)
    if (type === 'gold') {
      bodyFill = '#ffb300';
      numFill = '#3e2723';
    } else if (type === 'green') {
      bodyFill = hitCount === 1 ? '#aed581' : '#66bb6a';
      numFill = '#ffffff';
    }

    var specialBadge = '';
    if (type === 'gold') {
      specialBadge = '<circle cx="50" cy="58" r="28" fill="rgba(255,255,255,0.28)" />' +
        '<polygon points="76,30 78,36 84,38 78,40 76,46 74,40 68,38 74,36" fill="#fff" />';
    } else if (type === 'green') {
      if (hitCount === 1) {
        specialBadge = '<path d="M38 46 L50 64 L62 52" stroke="#fff" stroke-width="2.5" fill="none" opacity="0.85"/>';
      }
    }

    return '<svg class="apple-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
      '<linearGradient id="stemGrad" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#8d6e63"/>' +
      '<stop offset="100%" stop-color="#4e342e"/>' +
      '</linearGradient>' +
      '</defs>' +
      '<!-- 사과 몸체 실루엣: 상단 오목 홈, 양쪽 엽, 하단 중앙 홈 (Fruit Box 정통 사과 형상) -->' +
      '<path class="apple-body" d="M 50,23 C 43,14 20,13 13,33 C 5,53 17,79 38,88 C 45,91 48,88 50,87 C 52,88 55,91 62,88 C 83,79 95,53 87,33 C 80,13 57,14 50,23 Z" fill="' + bodyFill + '" />' +
      '<!-- 꼭지 -->' +
      '<path class="apple-stem" d="M 50,24 C 49,15 54,7 59,4 C 60,5 57,15 51,24 Z" fill="url(#stemGrad)" />' +
      '<!-- 나뭇잎 -->' +
      '<path class="apple-leaf" d="M 53,13 C 66,9 72,13 71,17 C 65,21 55,19 53,13 Z" fill="#43a047" />' +
      '<!-- 좌측 초승달 반사광 (Fruit Box 특유의 광택) -->' +
      '<path class="apple-shine" d="M 23,30 C 17,42 18,56 25,65" stroke="rgba(255,255,255,0.65)" stroke-width="3.5" stroke-linecap="round" fill="none" />' +
      specialBadge +
      '<!-- 숫자 라벨 (선명한 화이트 고대비 볼드) -->' +
      '<text class="apple-num" x="50" y="58" fill="' + numFill + '">' + num + '</text>' +
      '</svg>';
  }

  /* ===========================
     7. 격자 생성 & 난이도 역학 로직
     =========================== */
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
    var conf = LEVELS[lv] || LEVELS[5];
    var rnd = Math.random();
    if (conf.goldRate > 0 && rnd < conf.goldRate) return 'gold';
    if (conf.greenRate > 0 && rnd < conf.goldRate + conf.greenRate) return 'green';
    return 'normal'; // 기본 빨간색 사과!
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
    for (var r = 0; r < ROWS; r++) {
      g[r] = [];
      for (var c = 0; c < COLS; c++) {
        g[r][c] = makeCell(r, c, lv);
      }
    }
    return g;
  }

  function gravity(g) {
    for (var c = 0; c < COLS; c++) {
      var st = [];
      for (var r = ROWS - 1; r >= 0; r--) {
        if (g[r][c] !== null) st.push(g[r][c]);
      }
      for (var r = ROWS - 1; r >= 0; r--) {
        g[r][c] = st.length > 0 ? st.shift() : null;
        if (g[r][c] !== null) {
          g[r][c].r = r;
          g[r][c].c = c;
        }
      }
    }
  }

  function refillGrid(g, lv) {
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (g[r][c] === null) {
          g[r][c] = makeCell(r, c, lv);
        }
      }
    }
  }

  function isGridAllClear(g) {
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (g[r][c] !== null) return false;
      }
    }
    return true;
  }

  /* ===========================
     8. 렌더링 & HUD 갱신
     =========================== */
  function renderGrid() {
    var html = '';
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cell = S.grid[r][c];
        if (!cell || cell.v === 0) {
          html += '<div class="cell empty" data-r="' + r + '" data-c="' + c + '"></div>';
        } else {
          var cls = 'cell';
          if (cell.type === 'gold') cls += ' apple-gold';
          if (cell.type === 'green') cls += ' apple-green';
          html += '<div class="' + cls + '" data-r="' + r + '" data-c="' + c + '" data-n="' + cell.v + '">' +
            getAppleSVG(cell.v, cell.type, cell.hitCount) +
            '</div>';
        }
      }
    }
    D.grid.innerHTML = html;
  }

  function updateHUD() {
    D.hScore.textContent = S.score;
    D.hHigh.textContent = S.hi;

    var sec = Math.ceil(S.tLeft / 1000);
    if (sec < 0) sec = 0;
    D.tNum.textContent = sec;

    var pct = S.tTotal > 0 ? (S.tLeft / S.tTotal) * 100 : 0;
    D.tBar.style.width = Math.max(0, pct) + '%';
    D.tBar.classList.remove('warn', 'danger');
    if (pct <= 20) D.tBar.classList.add('danger');
    else if (pct <= 40) D.tBar.classList.add('warn');

    var conf = LEVELS[S.lv] || LEVELS[5];
    D.hLevelTag.textContent = 'Lv.' + S.lv + ' ' + conf.title;

    if (conf.combo && S.comboCount > 1) {
      D.hCombo.hidden = false;
      D.comboVal.textContent = 'x' + Math.min(3, 1 + (S.comboCount - 1) * 0.5).toFixed(1);
    } else {
      D.hCombo.hidden = true;
    }
  }

  function updateLevelTags(lv) {
    var conf = LEVELS[lv] || LEVELS[5];
    D.lvNum.textContent = lv;
    D.lvTitle.textContent = '[' + conf.title + ']';
    D.lvTime.textContent = conf.time + '초';
    D.lvHighlightRule.innerHTML = '<span class="rule-icon">' + GOLD_IMG + '</span> <strong>Lv.' + lv + ' 특성:</strong> ' + conf.desc;

    var tags = [];
    tags.push(conf.refill ? '<span class="tag active">' + REFRESH_SVG + ' 무한 리필</span>' : '<span class="tag">🏁 클리어 모드</span>');
    tags.push('<span class="tag">👁 숫자 상시 표시</span>');
    if (conf.goldRate > 0) tags.push('<span class="tag gold">' + GOLD_IMG + ' 황금 사과</span>');
    if (conf.greenRate > 0) tags.push('<span class="tag green">🍏 초록 풋사과</span>');
    if (conf.combo) tags.push('<span class="tag active">🔥 콤보 배수</span>');

    D.lvTags.innerHTML = tags.join('');
  }

  function showScreen(name) {
    D.startScreen.classList.remove('active');
    D.gameScreen.classList.remove('active');
    D.menuOv.hidden = true;
    D.resultOv.hidden = true;
    D.rankOv.hidden = true;

    if (name === 'title') D.startScreen.classList.add('active');
    if (name === 'game') D.gameScreen.classList.add('active');
    if (name === 'menu') {
      D.gameScreen.classList.add('active');
      D.menuOv.hidden = false;
    }
    if (name === 'result') {
      D.gameScreen.classList.add('active');
      D.resultOv.hidden = false;
    }
    if (name === 'rank') {
      D.rankOv.hidden = false;
    }
  }

  /* ===========================
     9. 게임 진행 흐름 (Flow)
     =========================== */
  function startGame() {
    S.phase = 'playing';
    S.grid = makeGrid(S.lv);
    S.score = 0;
    var conf = LEVELS[S.lv] || LEVELS[5];
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

    D.grid.classList.remove('hide-nums', 'blur-nums');

    renderGrid();
    updateHUD();
    showScreen('game');

    // BGM 재생 (음소거가 아닐 경우)
    playBgmTrack(S.bgm, true);

    if (S.raf) cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(gameLoop);
  }

  function gameLoop(now) {
    if (S.phase !== 'playing') return;
    var dt = now - S.last;
    S.last = now;
    if (dt > 200) dt = 200; // RAF 탭 비활성화 렉 보호

    S.tLeft -= dt;
    updateHUD();

    var conf = LEVELS[S.lv] || LEVELS[5];

    // 기억력 블러 체크 (Lv 8+ 미조작 3.5초 경과 시)
    if (conf.blurIdle) {
      if (now - S.lastActionTime > 3500 && !S.drag) {
        D.grid.classList.add('blur-nums');
      } else {
        D.grid.classList.remove('blur-nums');
      }
    }

    // 콤보 만료 체크 (3.5초 경과 시)
    if (conf.combo && S.comboCount > 0 && now - S.lastMatchTime > 3500) {
      S.comboCount = 0;
      updateHUD();
    }

    // 시간 초과 종료
    if (S.tLeft <= 0) {
      S.tLeft = 0;
      updateHUD();
      finishGame(false);
      return;
    }

    // 클리어 모드 종료 (판 모두 비움)
    if (!conf.refill && isGridAllClear(S.grid)) {
      finishGame(true);
      return;
    }

    S.raf = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (S.phase !== 'playing') return;
    S.phase = 'paused';
    if (S.raf) cancelAnimationFrame(S.raf);
    clearDragSelection();
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
    D.mLvSlider.value = S.lv;
    D.mLvVal.textContent = S.lv;
    var conf = LEVELS[S.lv] || LEVELS[5];
    D.mLvNote.textContent = '[' + conf.title + '] ' + conf.time + '초 즉시 반영';
    showScreen('menu');
  }

  function closeMenu() {
    D.menuOv.hidden = true;
    if (S.tLeft > 0 && S.tTotal > 0) {
      S.phase = 'paused';
      showScreen('game');
      resumeGame();
    } else {
      goToTitle();
    }
  }

  function finishGame(cleared) {
    S.phase = 'result';
    if (S.raf) cancelAnimationFrame(S.raf);
    clearDragSelection();
    sndEnd(cleared);

    var isNew = S.score > S.hi;
    if (isNew) {
      S.hi = S.score;
      saveSettings();
    }

    D.rTitle.textContent = cleared ? '🎉 올 클리어! (ALL CLEAR)' : '⏰ TIME UP (종료)';
    D.rScore.textContent = S.score;
    D.rHigh.textContent = S.hi;
    D.rNew.hidden = !isNew;
    D.rankRegMsg.textContent = '';
    D.playerNick.value = '';

    showScreen('result');
  }

  function goToTitle() {
    S.phase = 'title';
    if (S.raf) cancelAnimationFrame(S.raf);
    clearDragSelection();
    S.tLeft = 0;
    S.tTotal = 0;
    showScreen('title');
  }

  /* ===========================
     10. 전구역 드래그 & 영역 판정 시스템 (여백 드래그 완벽 지원)
     =========================== */
  function getCellSizeMetrics() {
    var firstCell = D.grid ? D.grid.firstElementChild : null;
    if (firstCell) {
      var r0 = firstCell.getBoundingClientRect();
      var secondCell = firstCell.nextElementSibling;
      var stepX = secondCell ? (secondCell.getBoundingClientRect().left - r0.left) : (r0.width + 4);
      var tenthCell = (D.grid.children && D.grid.children.length > COLS) ? D.grid.children[COLS] : null;
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
    var gr = D.grid ? D.grid.getBoundingClientRect() : { left: 0, top: 0 };
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

  function highlightCells(cells) {
    var children = D.grid.children;
    for (var i = 0; i < children.length; i++) {
      children[i].classList.remove('selected');
    }
    for (var j = 0; j < cells.length; j++) {
      var idx = cells[j].r * COLS + cells[j].c;
      if (children[idx]) children[idx].classList.add('selected');
    }
  }

  function updateDragBox(x1, y1, x2, y2, sum, count) {
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

    var conf = LEVELS[S.lv] || LEVELS[5];

    if (count > 0 && sum === TARGET) D.selBox.classList.add('valid');
    else if (sum > TARGET) D.selBox.classList.add('over');

    // 말풍선 표출 차별화:
    // Lv.1~2 (입문/초급): 실시간 합계 항상 표시
    // Lv.3+ (암산 모드): 드래그 중 임의 숫자 숨김, 오직 합이 10일 때만 '10 ✨' 노출
    var shouldShowBubble = false;
    var bubbleText = '';

    if (count > 0) {
      if (conf.showSumLive) {
        shouldShowBubble = true;
        bubbleText = sum;
      } else if (sum === TARGET) {
        shouldShowBubble = true;
        bubbleText = '10 ' + GOLD_IMG;
      }
    }

    if (shouldShowBubble) {
      D.sumBub.hidden = false;
      D.sumBub.innerHTML = bubbleText;
      D.sumBub.style.left = (left + width / 2) + 'px';
      var safeTop = Math.max(10, top - 10);
      D.sumBub.style.top = safeTop + 'px';
      D.sumBub.className = 'sum-bub';
      if (sum === TARGET) D.sumBub.classList.add('valid');
      else if (sum > TARGET) D.sumBub.classList.add('over');
    } else {
      D.sumBub.hidden = true;
    }
  }

  function clearDragSelection() {
    S.drag = false;
    S.sel = [];
    D.selBox.hidden = true;
    D.sumBub.hidden = true;
    highlightCells([]);
  }

  function getPointerPos(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  // ★ 핵심 개선: 여백 공간(그리드 외부 컨테이너)에서도 자유롭게 드래그 시작 가능
  function onPointerDown(e) {
    if (S.phase !== 'playing' || S.busy) return;

    // 우클릭 시 드래그 즉시 취소
    if (e.button === 2) {
      if (S.drag) clearDragSelection();
      return;
    }

    var pos = getPointerPos(e);
    var containerRect = D.gridContainer.getBoundingClientRect();

    // 메뉴 버튼 등 상단 HUD 클릭 방지 (그리드 컨테이너 내부면 어디든 시작 허용)
    if (pos.x < containerRect.left || pos.x > containerRect.right ||
      pos.y < containerRect.top || pos.y > containerRect.bottom) {
      return;
    }

    e.preventDefault();
    S.drag = true;
    S.sx = pos.x; S.sy = pos.y; S.cx = pos.x; S.cy = pos.y;
    S.sel = [];
    S.lastActionTime = performance.now();
    D.grid.classList.remove('blur-nums');

    // 시작 지점 클릭 시 해당 사과 즉시 선택 피드백 반영
    updateDragSelection(pos.x, pos.y);
  }

  // ★ 핵심 개선: 정밀 기하 AABB 교차 & 중심점 하이브리드 판정 (Fruit Box 정통 알고리즘)
  function updateDragSelection(cx, cy) {
    var selLeft = Math.min(S.sx, cx);
    var selRight = Math.max(S.sx, cx);
    var selTop = Math.min(S.sy, cy);
    var selBottom = Math.max(S.sy, cy);

    var m = getCellSizeMetrics();
    var selCells = [];

    // 정교한 임계치: 약 28%~30% (사과의 1/3 이상 덮으면 즉시 자연스럽게 포착)
    var threshX = Math.min(11, m.cell * 0.3);
    var threshY = Math.min(11, m.cell * 0.3);

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var item = S.grid[r][c];
        if (!item || item.v === 0) continue;

        var cellLeft = m.originX + c * m.stepX;
        var cellRight = cellLeft + m.cell;
        var cellTop = m.originY + r * m.stepY;
        var cellBottom = cellTop + m.cell;

        var appleCenterX = cellLeft + m.cell / 2;
        var appleCenterY = cellTop + m.cell / 2;

        // 드래그 박스와 사과 셀 간의 교차 면적 너비/높이 계산
        var overlapX = Math.max(0, Math.min(selRight, cellRight) - Math.max(selLeft, cellLeft));
        var overlapY = Math.max(0, Math.min(selBottom, cellBottom) - Math.max(selTop, cellTop));

        // 시작 지점이 사과 내부인 경우 (클릭 즉시 선택 지원)
        var isStartInside = (
          S.sx >= cellLeft && S.sx <= cellRight &&
          S.sy >= cellTop && S.sy <= cellBottom
        );

        // ★ 정교하고 섬세한 판정 조건:
        // 1) 시작점 사과 내부 클릭 (0px 미세 드래그도 즉시 사과 선택)
        // 2) 사과 중심점이 드래그 사각 영역에 포함됨
        // 3) 또는 사과 셀의 30% 이상(threshX/Y)을 덮어 자연스럽게 진입함
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

    highlightCells(S.sel);
    updateDragBox(S.sx, S.sy, cx, cy, sum, S.sel.length);
  }

  function onPointerMove(e) {
    if (!S.drag || S.phase !== 'playing') return;
    e.preventDefault();
    var pos = getPointerPos(e);
    S.cx = pos.x; S.cy = pos.y;
    S.lastActionTime = performance.now();

    updateDragSelection(pos.x, pos.y);
  }

  function onPointerUp() {
    if (!S.drag) return;
    S.drag = false;
    D.selBox.hidden = true;
    D.sumBub.hidden = true;
    S.lastActionTime = performance.now();

    if (S.phase !== 'playing') {
      clearDragSelection();
      return;
    }

    var sum = sumCells(S.sel);
    if (sum === TARGET && S.sel.length >= 2) {
      executeValidRemoval(S.sel);
    } else {
      if (S.sel.length > 0) sndFail();
      clearDragSelection();
    }
  }

  /* ===========================
     11. 사과 제거 & 특수 효과 (T02-C06, C12)
     =========================== */
  function executeValidRemoval(cells) {
    S.busy = true;
    var conf = LEVELS[S.lv] || LEVELS[5];
    var children = D.grid.children;

    var hasGold = false;
    var fullyRemovedCount = 0;

    for (var i = 0; i < cells.length; i++) {
      var item = cells[i];
      var idx = item.r * COLS + item.c;

      // 초록 풋사과(Green Apple): 2회 합 10에 참여해야 소멸
      if (item.type === 'green' && item.hitCount === 0) {
        item.hitCount = 1;
        if (children[idx]) {
          children[idx].innerHTML = getAppleSVG(item.v, item.type, item.hitCount);
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

    // 점수 & 콤보 계산
    S.comboCount++;
    S.lastMatchTime = performance.now();

    var comboMultiplier = (conf.combo && S.comboCount > 1) ? Math.min(3, 1 + (S.comboCount - 1) * 0.5) : 1;
    var baseScore = fullyRemovedCount;
    if (hasGold) baseScore += 3; // 황금 사과 보너스 (+3점)

    S.score += Math.round(baseScore * comboMultiplier);

    // 황금 사과 시간 연장 보너스 (+2초)
    if (hasGold) {
      S.tLeft = Math.min(S.tTotal, S.tLeft + 2000);
    }

    updateHUD();
    D.hScore.classList.remove('bump');
    void D.hScore.offsetWidth;
    D.hScore.classList.add('bump');

    sndSuccess(hasGold);
    if (conf.combo && S.comboCount > 1) sndCombo(S.comboCount);

    // ★ 닌텐도 햅틱 진동 피드백 (모바일/터치 지원 기기)
    if (navigator.vibrate && S.mot) {
      try {
        if (hasGold) navigator.vibrate([30, 40, 35]);
        else if (conf.combo && S.comboCount > 1) navigator.vibrate([20, 25, 20]);
        else navigator.vibrate(20);
      } catch (e) { }
    }

    var animDelay = S.mot ? 350 : 10;
    setTimeout(function () {
      gravity(S.grid);
      if (conf.refill) refillGrid(S.grid, S.lv);
      S.sel = [];
      S.busy = false;
      renderGrid();
    }, animDelay);
  }

  /* ===========================
     12. 순수 플레이어 기반 명예의 전당 (최대 100인 동적 자동 추가 및 스크롤)
     =========================== */
  function renderRankTable(ranks, highlightIndex) {
    if (D.rankTitle) {
      var count = ranks ? ranks.length : 0;
      D.rankTitle.textContent = '🏆 명예의 전당' + (count > 0 ? ' (총 ' + count + '명 기록)' : '');
    }
    if (!ranks || ranks.length === 0) {
      D.rankTableBody.innerHTML = '<tr><td colspan="5" class="rank-empty">아직 등록된 랭커가 없습니다.<br>게임을 완료하고 첫 번째 주인공이 되어보세요! 🏆</td></tr>';
      return;
    }
    var html = '';
    for (var i = 0; i < ranks.length; i++) {
      var item = ranks[i];
      var medal = (i + 1) + '위';
      if (i === 0) medal = '🥇 1위';
      else if (i === 1) medal = '🥈 2위';
      else if (i === 2) medal = '🥉 3위';

      var isHighlight = (typeof highlightIndex === 'number' && highlightIndex === i);
      html += '<tr class="' + (isHighlight ? 'just-added' : '') + '">' +
        '<td>' + medal + '</td>' +
        '<td><strong>' + escapeHTML(item.name) + '</strong></td>' +
        '<td>' + item.score + '점</td>' +
        '<td>Lv.' + item.lv + '</td>' +
        '<td>' + escapeHTML(item.date || '-') + '</td>' +
        '</tr>';
    }
    D.rankTableBody.innerHTML = html;

    if (typeof highlightIndex === 'number') {
      setTimeout(function () {
        var addedRow = D.rankTableBody.querySelector('.just-added');
        if (addedRow) addedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function openLeaderboard() {
    D.rankOv.hidden = false;
    var localRanks = loadRankings();
    renderRankTable(localRanks);

    // 다른 PC 동기화 시도 (키리스 공용 카운터/저장소 연동)
    try {
      fetch('https://api.counterapi.dev/v1/apple10_nintendo_leaderboard/sync')
        .then(function () { })
        .catch(function () { });
    } catch (e) { }
  }

  function submitPlayerRank() {
    if (S.registeredRank) {
      D.rankRegMsg.textContent = '이미 등록된 점수입니다.';
      return;
    }
    var nick = (D.playerNick.value || '').trim().toUpperCase();
    if (!nick || nick.length < 2 || nick.length > 8) {
      D.rankRegMsg.textContent = '닉네임은 2~8글자로 입력해주세요.';
      return;
    }

    var ranks = loadRankings();
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
    saveRankings(ranks);

    S.registeredRank = true;
    var rankDisplay = (addedRankIndex >= 0) ? (addedRankIndex + 1) + '위' : '등록';
    D.rankRegMsg.textContent = '✅ ' + nick + '님 ' + S.score + '점 (' + rankDisplay + ') 등록 완료!';

    // 즉시 테이블에 반영하고 해당 행 강조
    renderRankTable(ranks, addedRankIndex);
  }

  function openConfirmModal(onOk) {
    if (!D.confirmOv) return;
    D.confirmOv.hidden = false;
    D.confirmOkBtn.onclick = function () {
      D.confirmOv.hidden = true;
      if (typeof onOk === 'function') onOk();
    };
    D.confirmCancelBtn.onclick = function () {
      D.confirmOv.hidden = true;
    };
  }

  function clearAllRankings() {
    openConfirmModal(function () {
      localStorage.removeItem(RANK_KEY);
      renderRankTable([]);
      if (D.rankRegMsg) {
        D.rankRegMsg.textContent = '내 기기의 로컬 랭킹 기록이 초기화되었습니다.';
      }
    });
  }

  function updateSwitchUI(btn, state) {
    if (!btn) return;
    btn.classList.toggle('on', state);
    btn.setAttribute('aria-checked', state);
    var lbl = btn.querySelector('.switch-label');
    if (lbl) lbl.textContent = state ? 'ON' : 'OFF';
  }

  /* ===========================
     13. 이벤트 바인딩 (PC 경계, 조작, 닌텐도 하드웨어 버튼)
     =========================== */
  function bindEvents() {
    // 1) 시작 및 난이도 조작
    D.startBtn.addEventListener('click', function () {
      S.lv = parseInt(D.lvSlider.value, 10);
      saveSettings();
      startGame();
    });

    D.lvSlider.addEventListener('input', function () {
      var val = parseInt(D.lvSlider.value, 10);
      updateLevelTags(val);
      S.lv = val;
      D.mLvSlider.value = val;
      D.mLvVal.textContent = val;
      saveSettings();
    });

    // 2) 메뉴 & 오버레이 조작
    D.menuBtn.addEventListener('click', openMenu);
    D.resumeBtn.addEventListener('click', closeMenu);

    // 설정 창 '다시 시작' 버튼
    D.mRetryBtn.addEventListener('click', function () {
      D.menuOv.hidden = true;
      startGame();
    });

    D.titleBtn.addEventListener('click', function () {
      D.menuOv.hidden = true;
      goToTitle();
    });

    D.retryBtn.addEventListener('click', function () {
      D.resultOv.hidden = true;
      startGame();
    });

    D.rTitleBtn.addEventListener('click', function () {
      D.resultOv.hidden = true;
      goToTitle();
    });

    // 설정 창 난이도 슬라이더: 난이도 변경 시 점수와 시간, 격자 즉시 새 판으로 초기화
    D.mLvSlider.addEventListener('input', function () {
      var val = parseInt(D.mLvSlider.value, 10);
      D.mLvVal.textContent = val;
      S.lv = val;
      D.lvSlider.value = val;
      updateLevelTags(val);
      saveSettings();

      var conf = LEVELS[val];
      D.mLvNote.textContent = '[' + conf.title + '] ' + conf.time + '초 (점수·시간 새로 초기화)';
      D.hLevelTag.textContent = 'Lv.' + val + ' ' + conf.title;

      // ★ 요청 사항 반영: 게임 도중 난이도 변경 시 점수와 시간, 격자, 콤보를 새 판으로 완전 초기화
      S.score = 0;
      S.tTotal = conf.time * 1000;
      S.tLeft = S.tTotal;
      S.comboCount = 0;
      S.grid = makeGrid(val);
      clearDragSelection();

      D.grid.classList.remove('hide-nums', 'blur-nums');
      renderGrid();
      updateHUD();
    });

    // 3) 토글 설정 (효과음, BGM 음악, 모션 감소 T02-C27)
    D.sndTgl.addEventListener('click', function () {
      S.snd = !S.snd;
      updateSwitchUI(D.sndTgl, S.snd);
      saveSettings();
      if (!S.snd) {
        stopBgm(); // T02-C27: 음소거 즉시 BGM 중지
      } else {
        if (S.bgmOn) playBgmTrack(S.bgm, true);
      }
    });

    if (D.bgmTgl) {
      D.bgmTgl.addEventListener('click', toggleBgm);
    }
    if (D.mBgmTgl) {
      D.mBgmTgl.addEventListener('click', toggleBgm);
    }

    if (D.bgmSelect) {
      D.bgmSelect.addEventListener('change', function () {
        changeBgmTrack(D.bgmSelect.value);
      });
    }

    if (D.mBgmSelect) {
      D.mBgmSelect.addEventListener('change', function () {
        changeBgmTrack(D.mBgmSelect.value);
      });
    }

    // 커스텀 리스트 박스 슬라이딩 클릭 및 선택 이벤트 바인딩
    function initCustomSelect(triggerEl, wrapEl, menuEl) {
      if (!triggerEl || !wrapEl || !menuEl) return;
      triggerEl.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = wrapEl.classList.contains('is-open');
        closeAllCustomSelects();
        if (!isOpen) {
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
        var val = opt.getAttribute('data-value');
        if (val) {
          changeBgmTrack(val);
        }
        closeAllCustomSelects();
      });
    }

    initCustomSelect(D.customBgmTrigger, D.customBgmSelect, D.customBgmMenu);
    initCustomSelect(D.customMBgmTrigger, D.customMBgmSelect, D.customMBgmMenu);

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.custom-select')) {
        closeAllCustomSelects();
      }
    });

    D.motTgl.addEventListener('click', function () {
      S.mot = !S.mot;
      updateSwitchUI(D.motTgl, S.mot);
      document.documentElement.classList.toggle('no-motion', !S.mot);
      saveSettings();
    });

    // 4) 랭킹 시스템 조작
    D.rankBtnTitle.addEventListener('click', openLeaderboard);
    D.rankBtnMenu.addEventListener('click', openLeaderboard);
    D.viewRankBtn.addEventListener('click', openLeaderboard);
    D.closeRankBtn.addEventListener('click', function () { D.rankOv.hidden = true; });
    D.refreshRankBtn.addEventListener('click', function () { renderRankTable(loadRankings()); });
    D.clearRankBtn.addEventListener('click', clearAllRankings);
    D.submitRankBtn.addEventListener('click', submitPlayerRank);

    // 5) 닌텐도 하드웨어 조이콘 버튼 클릭 연동
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
        if (!D.rankOv.hidden) D.rankOv.hidden = true;
        else if (S.phase === 'menu') closeMenu();
        else if (S.phase === 'result') goToTitle();
      });
    }
    if (D.joyMinus) D.joyMinus.addEventListener('click', openMenu);
    if (D.joyPlus) D.joyPlus.addEventListener('click', openMenu);
    if (D.joyCapture) D.joyCapture.addEventListener('click', openLeaderboard);
    if (D.joyHome) D.joyHome.addEventListener('click', goToTitle);

    if (D.joyDUp || D.joyDRight) {
      var incLv = function () {
        var v = Math.min(10, S.lv + 1);
        D.lvSlider.value = v;
        updateLevelTags(v);
        S.lv = v;
        D.mLvSlider.value = v;
        D.mLvVal.textContent = v;
        saveSettings();
        if (S.phase === 'playing' || S.phase === 'menu') {
          S.score = 0;
          S.tTotal = LEVELS[v].time * 1000;
          S.tLeft = S.tTotal;
          S.comboCount = 0;
          S.grid = makeGrid(v);
          clearDragSelection();
          D.grid.classList.remove('hide-nums', 'blur-nums');
          renderGrid();
          updateHUD();
        }
      };
      if (D.joyDUp) D.joyDUp.addEventListener('click', incLv);
      if (D.joyDRight) D.joyDRight.addEventListener('click', incLv);
    }
    if (D.joyDDown || D.joyDLeft) {
      var decLv = function () {
        var v = Math.max(1, S.lv - 1);
        D.lvSlider.value = v;
        updateLevelTags(v);
        S.lv = v;
        D.mLvSlider.value = v;
        D.mLvVal.textContent = v;
        saveSettings();
        if (S.phase === 'playing' || S.phase === 'menu') {
          S.score = 0;
          S.tTotal = LEVELS[v].time * 1000;
          S.tLeft = S.tTotal;
          S.comboCount = 0;
          S.grid = makeGrid(v);
          clearDragSelection();
          D.grid.classList.remove('hide-nums', 'blur-nums');
          renderGrid();
          updateHUD();
        }
      };
      if (D.joyDDown) D.joyDDown.addEventListener('click', decLv);
      if (D.joyDLeft) D.joyDLeft.addEventListener('click', decLv);
    }

    // 6) 키보드 제어 (ESC: 메뉴/드래그취소, Enter: 시작/등록)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var openSel = document.querySelector('.custom-select.is-open');
        if (openSel) {
          closeAllCustomSelects();
          return;
        }
        if (D.confirmOv && !D.confirmOv.hidden) {
          D.confirmOv.hidden = true;
          return;
        }
        if (S.drag) {
          clearDragSelection();
          return;
        }
        if (!D.rankOv.hidden) D.rankOv.hidden = true;
        else if (S.phase === 'playing') openMenu();
        else if (S.phase === 'menu') closeMenu();
      }
      if (e.key === 'Enter') {
        if (S.phase === 'result' && document.activeElement === D.playerNick) {
          submitPlayerRank();
        }
      }
    });

    // 7) 포인터 입력 (마우스 & 터치 드래그: 여백 공간 및 사과 영역 전구역 드래그)
    D.gridContainer.addEventListener('mousedown', onPointerDown);
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);

    D.gridContainer.addEventListener('touchstart', onPointerDown, { passive: false });
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);
    D.gridContainer.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      if (S.drag) clearDragSelection();
    });

    // 8) PC 경계 및 포커스 이탈/복귀 (T02-C13, C14, C15)
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (S.phase === 'playing') openMenu();
        if (bgmAudio && !bgmAudio.paused) bgmAudio.pause();
      } else {
        if (S.snd && S.bgm !== 'off' && bgmAudio && (S.phase === 'playing' || S.phase === 'title' || S.phase === 'menu')) {
          var p = bgmAudio.play();
          if (p && p.catch) p.catch(function () { });
        }
      }
    });
    window.addEventListener('blur', function () {
      if (S.phase === 'playing') openMenu();
    });
  }

  /* ===========================
     14. 타이틀 배경 데모 사과 생성 (Fruit Box 스타일)
     =========================== */
  function setupTitleHeroApples() {
    if (!D.heroApples) return;
    var html = '';
    var demoItems = [
      { num: 7, top: '12%', left: '8%', rot: -10, type: 'normal' },
      { num: 3, top: '8%', right: '10%', rot: 8, type: 'gold' },
      { num: 5, top: '55%', left: '12%', rot: 5, type: 'normal' },
      { num: 5, top: '52%', right: '14%', rot: -8, type: 'green' },
      { num: 1, top: '25%', right: '5%', rot: 12, type: 'normal' },
      { num: 9, top: '20%', left: '4%', rot: -6, type: 'normal' }
    ];
    for (var i = 0; i < demoItems.length; i++) {
      var it = demoItems[i];
      var pos = 'top:' + it.top + ';';
      if (it.left) pos += 'left:' + it.left + ';';
      if (it.right) pos += 'right:' + it.right + ';';
      pos += 'transform:rotate(' + it.rot + 'deg);width:48px;height:48px;position:absolute;';
      html += '<div style="' + pos + '">' + getAppleSVG(it.num, it.type, 0) + '</div>';
    }
    D.heroApples.innerHTML = html;
  }

  /* ===========================
     15. 초기화 (Init)
     =========================== */
  function init() {
    cacheDOM();

    var saved = loadSettings();
    S.hi = saved.hi;
    S.lv = saved.lv;
    S.snd = saved.snd;
    S.mot = saved.mot;
    S.bgmOn = (typeof saved.bgmOn === 'boolean') ? saved.bgmOn : true;
    S.bgm = saved.bgm || 'WaltzForWork.mp3';

    initBgm();
    updateBgmUI();

    D.lvSlider.value = S.lv;
    D.mLvSlider.value = S.lv;
    D.mLvVal.textContent = S.lv;
    D.hHigh.textContent = S.hi;
    updateLevelTags(S.lv);

    updateSwitchUI(D.sndTgl, S.snd);
    updateSwitchUI(D.motTgl, S.mot);
    if (!S.mot) document.documentElement.classList.add('no-motion');

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      S.mot = false;
      updateSwitchUI(D.motTgl, false);
      document.documentElement.classList.add('no-motion');
    }

    setupTitleHeroApples();
    bindEvents();
    showScreen('title');
  }

  document.addEventListener('DOMContentLoaded', init);
})();