/* ==========================================================================
   Apple 10 — UI Components, DOM Renderer & Modals (화면 UI 및 모달 제어)
   ========================================================================== */
(function (root) {
  'use strict';

  var rootObj = root || window;
  rootObj.Apple10 = rootObj.Apple10 || {};
  var Config = rootObj.Apple10.Config;

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

  function syncCustomSelect(menuEl, valEl, currentVal) {
    var title = Config.BGM_TRACKS[currentVal] ? Config.BGM_TRACKS[currentVal].title : 'Waltz For Work (기본)';
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

  function updateSwitchUI(btn, state) {
    if (!btn) return;
    btn.classList.toggle('on', state);
    btn.setAttribute('aria-checked', state);
    var lbl = btn.querySelector('.switch-label');
    if (lbl) lbl.textContent = state ? 'ON' : 'OFF';
  }

  function updateBgmUI(D, S) {
    if (!D || !S) return;
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
    if (D.bgmTitle && Config.BGM_TRACKS[S.bgm]) D.bgmTitle.textContent = Config.BGM_TRACKS[S.bgm].title;

    syncCustomSelect(D.customBgmMenu, D.customBgmVal, S.bgm);
    syncCustomSelect(D.customMBgmMenu, D.customMBgmVal, S.bgm);
  }

  function renderGrid(D, S) {
    if (!D.grid || !S.grid) return;
    var html = '';
    for (var r = 0; r < Config.ROWS; r++) {
      for (var c = 0; c < Config.COLS; c++) {
        var cell = S.grid[r][c];
        if (!cell || cell.v === 0) {
          html += '<div class="cell empty" data-r="' + r + '" data-c="' + c + '"></div>';
        } else {
          var cls = 'cell';
          if (cell.type === 'gold') cls += ' apple-gold';
          if (cell.type === 'green') cls += ' apple-green';
          html += '<div class="' + cls + '" data-r="' + r + '" data-c="' + c + '" data-n="' + cell.v + '">' +
            Config.getAppleSVG(cell.v, cell.type, cell.hitCount) +
            '</div>';
        }
      }
    }
    D.grid.innerHTML = html;
  }

  function updateHUD(D, S) {
    if (!D || !S) return;
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

    var conf = Config.LEVELS[S.lv] || Config.LEVELS[5];
    D.hLevelTag.textContent = 'Lv.' + S.lv + ' ' + conf.title;

    if (conf.combo && S.comboCount > 1) {
      D.hCombo.hidden = false;
      D.comboVal.textContent = 'x' + Math.min(3, 1 + (S.comboCount - 1) * 0.5).toFixed(1);
    } else {
      D.hCombo.hidden = true;
    }
  }

  function updateLevelTags(lv, D) {
    if (!D) return;
    var conf = Config.LEVELS[lv] || Config.LEVELS[5];
    D.lvNum.textContent = lv;
    D.lvTitle.textContent = '[' + conf.title + ']';
    D.lvTime.textContent = conf.time + '초';
    D.lvHighlightRule.innerHTML = '<span class="rule-icon">' + Config.GOLD_IMG + '</span> <strong>Lv.' + lv + ' 특성:</strong> ' + conf.desc;

    var tags = [];
    tags.push(conf.refill ? '<span class="tag active">' + Config.REFRESH_SVG + ' 무한 리필</span>' : '<span class="tag">🏁 클리어 모드</span>');
    tags.push('<span class="tag">👁 숫자 상시 표시</span>');
    if (conf.goldRate > 0) tags.push('<span class="tag gold">' + Config.GOLD_IMG + ' 황금 사과</span>');
    if (conf.greenRate > 0) tags.push('<span class="tag green">🍏 초록 풋사과</span>');
    if (conf.combo) tags.push('<span class="tag active">🔥 콤보 배수</span>');

    D.lvTags.innerHTML = tags.join('');
  }

  function showScreen(name, D) {
    closeAllCustomSelects();
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
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

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function renderRankTable(ranks, highlightIndex, D) {
    if (!D) return;
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

  function openConfirmModal(onOk, D) {
    if (!D || !D.confirmOv) return;
    closeAllCustomSelects();
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    D.confirmOv.hidden = false;
    if (D.confirmCancelBtn) D.confirmCancelBtn.focus();
    D.confirmOkBtn.onclick = function () {
      D.confirmOv.hidden = true;
      if (typeof onOk === 'function') onOk();
    };
    D.confirmCancelBtn.onclick = function () {
      D.confirmOv.hidden = true;
    };
  }

  function setupTitleHeroApples(D) {
    if (!D || !D.heroApples) return;
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
      html += '<div style="' + pos + '">' + Config.getAppleSVG(it.num, it.type, 0) + '</div>';
    }
    D.heroApples.innerHTML = html;
  }

  var UI = {
    D: D,
    cacheDOM: cacheDOM,
    syncCustomSelect: syncCustomSelect,
    closeAllCustomSelects: closeAllCustomSelects,
    updateSwitchUI: updateSwitchUI,
    updateBgmUI: updateBgmUI,
    renderGrid: renderGrid,
    updateHUD: updateHUD,
    updateLevelTags: updateLevelTags,
    showScreen: showScreen,
    escapeHTML: escapeHTML,
    renderRankTable: renderRankTable,
    openConfirmModal: openConfirmModal,
    setupTitleHeroApples: setupTitleHeroApples
  };

  rootObj.Apple10.UI = UI;
})(typeof window !== 'undefined' ? window : this);
