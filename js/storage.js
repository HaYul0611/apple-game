/* ==========================================================================
   Apple 10 — LocalStorage Storage & Persistence (설정 및 랭킹 영구 저장)
   ========================================================================== */
(function (root) {
  'use strict';

  var rootObj = root || window;
  rootObj.Apple10 = rootObj.Apple10 || {};
  var Config = rootObj.Apple10.Config;

  var Storage = {
    loadSettings: function () {
      try {
        var raw = localStorage.getItem(Config.SAVE_KEY);
        if (!raw) return Object.assign({}, Config.DEFAULTS);
        var data = JSON.parse(raw);
        if (!data || typeof data !== 'object' || data.ver !== Config.DEFAULTS.ver) {
          return Object.assign({}, Config.DEFAULTS);
        }
        return {
          hi: typeof data.hi === 'number' && data.hi >= 0 ? data.hi : 0,
          lv: typeof data.lv === 'number' && data.lv >= 1 && data.lv <= 10 ? data.lv : 5,
          snd: typeof data.snd === 'boolean' ? data.snd : true,
          mot: typeof data.mot === 'boolean' ? data.mot : true,
          bgmOn: typeof data.bgmOn === 'boolean' ? data.bgmOn : true,
          bgm: (typeof data.bgm === 'string' && Config.BGM_TRACKS[data.bgm]) ? data.bgm : 'WaltzForWork.mp3',
          ver: Config.DEFAULTS.ver
        };
      } catch (e) {
        return Object.assign({}, Config.DEFAULTS);
      }
    },

    saveSettings: function (S) {
      try {
        localStorage.setItem(Config.SAVE_KEY, JSON.stringify({
          hi: S.hi,
          lv: S.lv,
          snd: S.snd,
          mot: S.mot,
          bgmOn: S.bgmOn,
          bgm: S.bgm,
          ver: Config.DEFAULTS.ver
        }));
      } catch (e) { }
    },

    loadRankings: function () {
      try {
        var raw = localStorage.getItem(Config.RANK_KEY);
        if (!raw) return [];
        var arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr.filter(function (it) {
          return it && typeof it.name === 'string' && typeof it.score === 'number';
        });
      } catch (e) {
        return [];
      }
    },

    saveRankings: function (ranks) {
      try {
        localStorage.setItem(Config.RANK_KEY, JSON.stringify(ranks.slice(0, 100)));
      } catch (e) { }
    }
  };

  rootObj.Apple10.Storage = Storage;
})(typeof window !== 'undefined' ? window : this);
