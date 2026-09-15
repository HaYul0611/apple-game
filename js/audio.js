/* ==========================================================================
   Apple 10 — Web Audio Synth & BGM Audio Engine (사운드 및 배경음악 시스템)
   ========================================================================== */
(function (root) {
  'use strict';

  var rootObj = root || window;
  rootObj.Apple10 = rootObj.Apple10 || {};
  var Config = rootObj.Apple10.Config;

  var audioCtx = null;
  var bgmAudio = null;

  function initBgm(state) {
    if (!bgmAudio) {
      bgmAudio = new Audio();
      bgmAudio.loop = true;
      bgmAudio.volume = 0.35; // 효과음과 명확히 구분되는 부드러운 볼륨
      bgmAudio.preload = 'auto';
      var curTrack = (state && state.bgm) || 'WaltzForWork.mp3';
      if (!Config.BGM_TRACKS[curTrack]) curTrack = 'WaltzForWork.mp3';
      bgmAudio.src = Config.BGM_TRACKS[curTrack].file;
      bgmAudio.load();
    }
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

  function playBgmTrack(trackKey, forcePlay, state, onUpdate, onSave) {
    initBgm(state);
    if (!Config.BGM_TRACKS[trackKey]) trackKey = 'WaltzForWork.mp3';
    if (state) state.bgm = trackKey;
    if (onSave) onSave();
    if (onUpdate) onUpdate();

    if (!state || !state.bgmOn || !state.snd) {
      if (bgmAudio) bgmAudio.pause();
      return;
    }

    var targetSrc = Config.BGM_TRACKS[trackKey].file;
    var curr = bgmAudio.src || '';
    if (!curr.endsWith(targetSrc)) {
      bgmAudio.src = targetSrc;
      bgmAudio.load();
    }

    if (forcePlay || state.phase === 'playing' || state.phase === 'title' || state.phase === 'menu') {
      var p = bgmAudio.play();
      if (p && p.catch) {
        p.catch(function () { /* 브라우저 Autoplay Policy 대응: 첫 상호작용 시 unlockAudio로 자동 재생 */ });
      }
    }
  }

  function stopBgm() {
    if (bgmAudio) {
      bgmAudio.pause();
    }
  }

  function toggleBgm(state, onUpdate, onSave, closeSelects) {
    if (!state) return;
    state.bgmOn = !state.bgmOn;
    if (!state.bgmOn && closeSelects) {
      closeSelects();
    }
    if (onUpdate) onUpdate();
    if (onSave) onSave();

    if (state.bgmOn && state.snd) {
      playBgmTrack(state.bgm, true, state, onUpdate, onSave);
    } else {
      stopBgm();
    }
  }

  function changeBgmTrack(trackKey, state, onUpdate, onSave) {
    if (!Config.BGM_TRACKS[trackKey]) trackKey = 'WaltzForWork.mp3';
    playBgmTrack(trackKey, true, state, onUpdate, onSave);
  }

  // ★ 첫 인터랙션 시 오디오 컨텍스트 및 BGM 사전 언락 (첫 사운드 지연 방지 및 자동 재생)
  function unlockAudio(state, onUpdate) {
    var ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    initBgm(state);
    if (state && state.snd && state.bgmOn && bgmAudio && bgmAudio.paused) {
      var p = bgmAudio.play();
      if (p && p.catch) p.catch(function () { });
    }
  }

  function playTone(freq, duration, type, gainPeak, state) {
    if (state && !state.snd) return;
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

  function sndSuccess(isGold, state) {
    if (isGold) {
      playTone(987, 0.12, 'triangle', 0.14, state);
      setTimeout(function () { playTone(1318, 0.18, 'sine', 0.16, state); }, 70);
    } else {
      playTone(784, 0.08, 'sine', 0.12, state);
      setTimeout(function () { playTone(1046, 0.1, 'sine', 0.12, state); }, 50);
    }
  }

  function sndCombo(combo, state) {
    var pitch = Math.min(1600, 800 + combo * 120);
    playTone(pitch, 0.14, 'triangle', 0.12, state);
  }

  function sndFail(state) {
    playTone(240, 0.14, 'triangle', 0.15, state);
  }

  function sndEnd(win, state) {
    if (win) {
      playTone(523, 0.15, 'triangle', 0.1, state);
      setTimeout(function () { playTone(659, 0.15, 'triangle', 0.1, state); }, 120);
      setTimeout(function () { playTone(784, 0.3, 'triangle', 0.1, state); }, 240);
    } else {
      playTone(330, 0.18, 'sawtooth', 0.12, state);
      setTimeout(function () { playTone(220, 0.35, 'sawtooth', 0.15, state); }, 150);
    }
  }

  var AudioEngine = {
    initBgm: initBgm,
    getAudioCtx: getAudioCtx,
    playBgmTrack: playBgmTrack,
    stopBgm: stopBgm,
    toggleBgm: toggleBgm,
    changeBgmTrack: changeBgmTrack,
    unlockAudio: unlockAudio,
    playTone: playTone,
    sndSuccess: sndSuccess,
    sndCombo: sndCombo,
    sndFail: sndFail,
    sndEnd: sndEnd,
    getBgmAudio: function () { return bgmAudio; }
  };

  rootObj.Apple10.Audio = AudioEngine;
})(typeof window !== 'undefined' ? window : this);
