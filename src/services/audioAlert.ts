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
   * Plays a single restrained, double-beep industrial alert tone
   */
  public playBeep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      
      // Beep 1
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5 note
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Beep 2
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.18);
      gain2.gain.setValueAtTime(0.08, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.3);

      // Mobile Haptic Vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([120, 60, 120]);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  public startAlarmLoop() {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;
    this.playBeep();
    this.intervalId = window.setInterval(() => {
      this.playBeep();
    }, 1500);
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
