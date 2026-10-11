/**
 * AERIS Audio & Haptic Notification Service
 * Generates restrained industrial alert audio via the Web Audio API
 * and mobile vibration feedback when gas thresholds are exceeded.
 */

class AudioAlertService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isAlarmPlaying: boolean = false;
  private intervalId: number | null = null;

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAlarm();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Plays a loud, distinctive 3-pulse industrial gas detector alarm siren
   */
  public playAlarmSiren() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      // 3 rapid emergency pulses (ISO temporal-3 pattern)
      const pulses = [0, 0.16, 0.32];
      pulses.forEach((offset) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        // Piercing dual-frequency harmonic tone
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, now + offset);
        osc.frequency.exponentialRampToValueAtTime(950, now + offset + 0.11);

        gain.gain.setValueAtTime(0.35, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });

      // Mobile Haptic Vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([180, 80, 180, 80, 240]);
      }
    } catch (e) {
      console.warn('Audio alert playback error:', e);
    }
  }

  /**
   * Legacy single beep method
   */
  public playBeep() {
    this.playAlarmSiren();
  }

  public startAlarmLoop() {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;
    this.playAlarmSiren();
    this.intervalId = window.setInterval(() => {
      this.playAlarmSiren();
    }, 800); // Urgent repeating siren every 800ms
  }

  public stopAlarm() {
    this.isAlarmPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Request browser notification permission for background tab alerts
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const res = await Notification.requestPermission();
    return res === 'granted';
  }

  public triggerBrowserNotification(title: string, body: string) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'aeris-gas-alarm',
        });
      } catch {
        // Notification constructor may fail on some mobile platforms
      }
    }
  }
}

export const alertService = new AudioAlertService();
