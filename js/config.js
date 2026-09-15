/* ==========================================================================
   Apple 10 — Configuration & Constants (설정 및 상수, 난이도 테이블, 사과 SVG)
   ========================================================================== */
(function (root) {
  'use strict';

  var rootObj = root || window;
  rootObj.Apple10 = rootObj.Apple10 || {};

  var GOLD_IMG = '<img src="golden-apple.png" class="emoji-img" alt="황금사과">';
  var REFRESH_SVG = '<svg class="btn-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';

  var Config = {
    COLS: 10,
    ROWS: 12,
    TARGET: 10,
    SAVE_KEY: 'apple10_nintendo_v5',
    RANK_KEY: 'apple10_rankings_v5',
    GOLD_IMG: GOLD_IMG,
    REFRESH_SVG: REFRESH_SVG,

    LEVELS: {
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
    },

    BGM_TRACKS: {
      'WaltzForWork.mp3': { title: 'Waltz For Work (기본)', file: 'audio/WaltzForWork.mp3' },
      'GoPicnic.mp3': { title: 'Go Picnic', file: 'audio/GoPicnic.mp3' },
      'BadGuys.mp3': { title: 'Bad Guys', file: 'audio/BadGuys.mp3' },
      'AboveTheTreetops.mp3': { title: 'Above The Treetops', file: 'audio/AboveTheTreetops.mp3' }
    },

    DEFAULTS: { hi: 0, lv: 5, snd: true, mot: true, bgmOn: true, bgm: 'WaltzForWork.mp3', ver: 5 },

    getAppleSVG: function (num, type, hitCount) {
      var bodyFill = '#e53935';
      var numFill = '#ffffff';

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
        '<!-- 사과 몸체 실루엣: 상단 오목 홈, 양쪽 엽, 하단 중앙 홈 -->' +
        '<path class="apple-body" d="M 50,23 C 43,14 20,13 13,33 C 5,53 17,79 38,88 C 45,91 48,88 50,87 C 52,88 55,91 62,88 C 83,79 95,53 87,33 C 80,13 57,14 50,23 Z" fill="' + bodyFill + '" />' +
        '<!-- 꼭지 -->' +
        '<path class="apple-stem" d="M 50,24 C 49,15 54,7 59,4 C 60,5 57,15 51,24 Z" fill="url(#stemGrad)" />' +
        '<!-- 나뭇잎 -->' +
        '<path class="apple-leaf" d="M 53,13 C 66,9 72,13 71,17 C 65,21 55,19 53,13 Z" fill="#43a047" />' +
        '<!-- 좌측 초승달 반사광 -->' +
        '<path class="apple-shine" d="M 23,30 C 17,42 18,56 25,65" stroke="rgba(255,255,255,0.65)" stroke-width="3.5" stroke-linecap="round" fill="none" />' +
        specialBadge +
        '<!-- 숫자 라벨 -->' +
        '<text class="apple-num" x="50" y="58" fill="' + numFill + '">' + num + '</text>' +
        '</svg>';
    }
  };

  rootObj.Apple10.Config = Config;
})(typeof window !== 'undefined' ? window : this);
