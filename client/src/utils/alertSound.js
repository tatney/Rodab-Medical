/* Premium two-tone ambulance siren synthesized with WebAudio.
 * Two triangle oscillators alternate between a low and high tone with smooth
 * crossfades (no clicks), plus a low sine sub-layer for weight, run through a
 * gentle lowpass filter. Repeats until stop() is called, or plays a fixed
 * number of cycles when loop is false.
 */

const TONE = {
  low: 660,
  high: 1040,
  sub: 330,
  holdMs: 620,
  fade: 0.12,
  level: 0.2,
  cyclesOnce: 8,
};

export function startPremiumAlert({ loop = true } = {}) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  const state = {
    cancelled: false,
    toneIndex: 0,
    timer: null,
  };

  const oscLow = ctx.createOscillator();
  const oscHigh = ctx.createOscillator();
  const sub = ctx.createOscillator();
  oscLow.type = 'triangle';
  oscHigh.type = 'triangle';
  sub.type = 'sine';
  oscLow.frequency.value = TONE.low;
  oscHigh.frequency.value = TONE.high;
  sub.frequency.value = TONE.sub;

  const gainLow = ctx.createGain();
  const gainHigh = ctx.createGain();
  const subGain = ctx.createGain();
  gainLow.gain.value = 0;
  gainHigh.gain.value = 0;
  subGain.gain.value = 0.5;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2200;
  filter.Q.value = 0.7;

  const master = ctx.createGain();
  master.gain.value = 0;

  oscLow.connect(gainLow);
  oscHigh.connect(gainHigh);
  sub.connect(subGain);
  gainLow.connect(filter);
  gainHigh.connect(filter);
  subGain.connect(filter);
  filter.connect(master);
  master.connect(ctx.destination);

  const teardown = (fade) => {
    if (state.cancelled) return;
    state.cancelled = true;
    clearTimeout(state.timer);
    try {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
      master.gain.linearRampToValueAtTime(0, t + fade);
    } catch {}
    setTimeout(() => {
      try { oscLow.stop(); } catch {}
      try { oscHigh.stop(); } catch {}
      try { sub.stop(); } catch {}
      try { ctx.close(); } catch {}
    }, (fade + 0.25) * 1000);
  };

  const schedule = () => {
    if (state.cancelled || ctx.state === 'closed') return;
    const t = ctx.currentTime + 0.03;
    const on = state.toneIndex % 2 === 0 ? gainLow : gainHigh;
    const off = state.toneIndex % 2 === 0 ? gainHigh : gainLow;
    on.gain.cancelScheduledValues(t);
    on.gain.setValueAtTime(Math.max(on.gain.value, 0.0001), t);
    on.gain.linearRampToValueAtTime(1, t + TONE.fade);
    off.gain.cancelScheduledValues(t);
    off.gain.setValueAtTime(Math.max(off.gain.value, 0.0001), t);
    off.gain.linearRampToValueAtTime(0, t + TONE.fade);
    state.toneIndex += 1;
    if (state.cancelled) return;
    const repeat = loop || state.toneIndex < TONE.cyclesOnce;
    if (repeat) {
      state.timer = setTimeout(schedule, Math.max(TONE.holdMs - TONE.fade * 1000, 100));
    } else {
      state.timer = setTimeout(() => teardown(0.9), 300);
    }
  };

  const start = () => {
    const t = ctx.currentTime;
    oscLow.start(t);
    oscHigh.start(t);
    sub.start(t);
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(0, t);
    master.gain.linearRampToValueAtTime(TONE.level, t + 0.25);
    schedule();
  };

  return {
    ctx,
    get suspended() {
      return ctx.state === 'suspended';
    },
    resume: () => ctx.resume(),
    start,
    stop: () => teardown(0.15),
  };
}
