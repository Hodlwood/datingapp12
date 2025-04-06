// Sound utility for notifications
export class SoundManager {
  private static instance: SoundManager;
  private notificationSound: HTMLAudioElement | null = null;
  private isMuted: boolean = false;

  private constructor() {
    // Only initialize audio element on client side
    if (typeof window !== 'undefined') {
      this.notificationSound = new Audio('/sounds/notification.mp3');
      this.notificationSound.volume = 0.5;
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public playNotification(): void {
    if (!this.isMuted && this.notificationSound) {
      // Reset the audio to start
      this.notificationSound.currentTime = 0;
      this.notificationSound.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
    }
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }
}

export const soundManager = SoundManager.getInstance(); 