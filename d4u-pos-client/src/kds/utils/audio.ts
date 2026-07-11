// Web Audio API Synthesizer Helper
// Avoids external assets, generates pure gourmet electronic sounds for the kitchen

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      // @ts-ignore
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    } catch (e) {
      console.warn('Web Audio API not supported in this browser', e);
    }
  }
  return audioCtx;
}

// Resume context if suspended (browser security autoplays)
async function resumeContext(ctx: AudioContext): Promise<boolean> {
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

interface SoundOptions {
  frequency: number;
  type?: OscillatorType;
  duration?: number;
  gainStart?: number;
  gainEnd?: number;
}

export async function playTone(settingsVolume: number, tones: SoundOptions[]) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const isResumed = await resumeContext(ctx);
  if (!isResumed) return;

  const masterVolume = settingsVolume / 100;
  if (masterVolume <= 0) return;

  const now = ctx.currentTime;
  let accumulatedTime = 0;

  tones.forEach((tone) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = tone.type || 'sine';
    osc.frequency.setValueAtTime(tone.frequency, now + accumulatedTime);

    const dur = tone.duration || 0.15;
    const startVol = (tone.gainStart !== undefined ? tone.gainStart : 0.5) * masterVolume;
    const endVol = (tone.gainEnd !== undefined ? tone.gainEnd : 0.01) * masterVolume;

    gainNode.gain.setValueAtTime(startVol, now + accumulatedTime);
    gainNode.gain.exponentialRampToValueAtTime(endVol, now + accumulatedTime + dur);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now + accumulatedTime);
    osc.stop(now + accumulatedTime + dur);

    accumulatedTime += dur * 0.8; // overlap slightly for mellower sound
  });
}

// Sound presets
export function playNewOrderAlert(settingsVolume: number) {
  // A clean, beautiful high-contrast kitchen order bell
  playTone(settingsVolume, [
    { frequency: 523.25, type: 'triangle', duration: 0.15, gainStart: 0.6 }, // C5
    { frequency: 659.25, type: 'sine', duration: 0.15, gainStart: 0.5 },    // E5
    { frequency: 783.99, type: 'sine', duration: 0.15, gainStart: 0.5 },    // G5
    { frequency: 1046.5, type: 'sine', duration: 0.35, gainStart: 0.7, gainEnd: 0.001 },   // C6
  ]);
}

export function playReadyAlert(settingsVolume: number) {
  // A pleasant double chime for "Completed"
  playTone(settingsVolume, [
    { frequency: 587.33, type: 'sine', duration: 0.15, gainStart: 0.5 }, // D5
    { frequency: 880.00, type: 'sine', duration: 0.35, gainStart: 0.6, gainEnd: 0.001 }, // A5
  ]);
}

export function playTimerTick(settingsVolume: number) {
  // Tiny wooden kitchen tick
  playTone(settingsVolume * 0.2, [
    { frequency: 1200, type: 'triangle', duration: 0.02, gainStart: 0.1, gainEnd: 0.001 }
  ]);
}

export function playUrgentAlert(settingsVolume: number) {
  // Double alert strike for urgent timers
  playTone(settingsVolume, [
    { frequency: 440, type: 'sawtooth', duration: 0.12, gainStart: 0.3 },
    { frequency: 0, type: 'sine', duration: 0.05, gainStart: 0 },
    { frequency: 440, type: 'sawtooth', duration: 0.12, gainStart: 0.3 }
  ]);
}

export function playEmergencyAlert(settingsVolume: number) {
  // Descending alarm siren sweep
  playTone(settingsVolume, [
    { frequency: 600, type: 'sawtooth', duration: 0.2, gainStart: 0.5, gainEnd: 0.1 },
    { frequency: 400, type: 'sawtooth', duration: 0.2, gainStart: 0.4, gainEnd: 0.1 },
    { frequency: 200, type: 'sawtooth', duration: 0.3, gainStart: 0.3, gainEnd: 0.001 }
  ]);
}
