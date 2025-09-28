// Audio System Utility for Clinic Calling System
// Handles both sound effects and Text-to-Speech functionality

export interface AudioSettings {
  enableSound: boolean;
  soundType: string;
  enableTTS: boolean;
  ttsLanguage: string;
  volume: number;
}

export interface CallInfo {
  patientName?: string;
  patientNumber: number;
  windowName: string;
}

export class AudioSystem {
  private static instance: AudioSystem;
  private audioContext: AudioContext | null = null;

  private constructor() {}

  public static getInstance(): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem();
    }
    return AudioSystem.instance;
  }

  // Generate different types of notification sounds
  private generateSound(type: string, volume: number = 50): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Different frequencies for different sound types
        const soundFrequencies: Record<string, number[]> = {
          beep: [800],
          chime: [523, 659, 784],
          bell: [440, 554, 659],
          notification: [880, 1108],
          ding: [1200],
          tone: [600],
          buzzer: [150, 300],
          whistle: [2000, 1500]
        };

        const frequencies = soundFrequencies[type] || [800];
        let currentTime = this.audioContext.currentTime;
        
        frequencies.forEach((freq) => {
          const oscillator = this.audioContext!.createOscillator();
          const gainNode = this.audioContext!.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext!.destination);
          
          oscillator.frequency.setValueAtTime(freq, currentTime);
          gainNode.gain.setValueAtTime(0, currentTime);
          gainNode.gain.linearRampToValueAtTime(volume / 100, currentTime + 0.1);
          gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.4);
          
          oscillator.start(currentTime);
          oscillator.stop(currentTime + 0.4);
          
          currentTime += 0.5;
        });

        setTimeout(() => {
          this.audioContext?.close();
          this.audioContext = null;
          resolve();
        }, frequencies.length * 500 + 100);

      } catch (error) {
        reject(error);
      }
    });
  }

  // Play notification sound
  public async playNotificationSound(soundType: string, volume: number): Promise<void> {
    if (soundType === 'custom') {
      // For now, fall back to a default sound when custom is selected
      // This prevents errors while custom audio upload feature is being developed
      console.warn('Custom audio selected but not yet uploaded. Using default beep sound.');
      return this.generateSound('beep', volume);
    }
    
    return this.generateSound(soundType, volume);
  }

  // Text-to-Speech functionality
  public async playTTS(callInfo: CallInfo, language: string, volume: number): Promise<void> {
    if (!('speechSynthesis' in window)) {
      throw new Error('Text-to-Speech not supported in this browser');
    }

    const synth = window.speechSynthesis;
    
    // Stop any ongoing speech
    synth.cancel();

    // Build the TTS message
    const patientName = callInfo.patientName || `Nombor ${callInfo.patientNumber}`;
    const windowName = callInfo.windowName;
    
    const textToSpeak = language === "en" 
      ? `${patientName} PROCEED TO ${windowName}`
      : `${patientName} SILA KE ${windowName}`;

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Set language
      utterance.lang = language === "en" ? "en-US" : "ms-MY";
      
      // Set volume
      utterance.volume = volume / 100;
      
      // Set rate and pitch for better clarity
      utterance.rate = 0.8;
      utterance.pitch = 1.0;

      // Try to find appropriate voice
      const voices = synth.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith(language === "en" ? "en" : "ms")
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`TTS Error: ${event.error}`));

      synth.speak(utterance);
    });
  }

  // Complete calling sequence - plays both sound and TTS
  public async playCallingSequence(callInfo: CallInfo, settings: AudioSettings): Promise<void> {
    try {
      // Step 1: Play notification sound if enabled (includes custom with fallback)
      if (settings.enableSound) {
        await this.playNotificationSound(settings.soundType, settings.volume);
        
        // Small delay between sound and speech
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 2: Play TTS if enabled
      if (settings.enableTTS) {
        await this.playTTS(callInfo, settings.ttsLanguage, settings.volume);
      }

    } catch (error) {
      console.error('Error in calling sequence:', error);
      throw error;
    }
  }

  // Test function for settings preview
  public async playTestSequence(settings: AudioSettings): Promise<void> {
    const testCallInfo: CallInfo = {
      patientName: "Ahmad Bin Ali",
      patientNumber: 123,
      windowName: "Kaunter 1"
    };

    return this.playCallingSequence(testCallInfo, settings);
  }
}

// Export singleton instance
export const audioSystem = AudioSystem.getInstance();