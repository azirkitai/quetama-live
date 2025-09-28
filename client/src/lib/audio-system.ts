// Audio System Utility for Clinic Calling System  
// Handles preset audio notifications only

import type { SoundModeType, PresetSoundKeyType } from "@shared/schema";

// Import preset audio files via @assets
import notificationSound from "@assets/notification-sound-3-262896_1759056866786.mp3";
import subwayChime from "@assets/subway-station-chime-100558_1759056866786.mp3";
import headerTone from "@assets/header-39344_1759056866787.mp3";
import airportChime from "@assets/airport-announcement-call-chime-start-and-finish-342984_1759056866787.mp3";
import airportCall from "@assets/airport-call-157168_1759056866787.mp3";

export interface AudioSettings {
  enableSound: boolean;
  volume: number;
  soundMode: SoundModeType; // Will always be 'preset'
  presetKey: PresetSoundKeyType;
}

export interface CallInfo {
  patientName?: string;
  patientNumber: number;
  windowName: string;
}

export class AudioSystem {
  private static instance: AudioSystem;
  private audioContext: AudioContext | null = null;
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  
  // Preset sound mappings using imported MP3 files
  private presetSounds: Record<PresetSoundKeyType, string> = {
    notification_sound: notificationSound,
    subway_chime: subwayChime, 
    header_tone: headerTone,
    airport_chime: airportChime,
    airport_call: airportCall
  };

  private constructor() {}

  public static getInstance(): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem();
    }
    return AudioSystem.instance;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Load and cache audio file
  private async loadAudioFile(url: string): Promise<AudioBuffer> {
    // Check cache first
    if (this.audioBufferCache.has(url)) {
      return this.audioBufferCache.get(url)!;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioContext = this.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Cache the buffer for future use
      this.audioBufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw error;
    }
  }

  // Play audio file from buffer
  private async playAudioFile(url: string, volume: number): Promise<void> {
    try {
      const audioBuffer = await this.loadAudioFile(url);
      const audioContext = this.getAudioContext();
      
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set volume
      gainNode.gain.value = volume / 100;
      
      return new Promise((resolve, reject) => {
        source.onended = () => resolve();
        try {
          source.start();
        } catch (error) {
          reject(new Error('Audio playback failed'));
        }
      });
    } catch (error) {
      console.error('Error playing audio file:', error);
      throw error;
    }
  }


  // Play notification sound using preset audio files
  public async playNotificationSound(settings: AudioSettings): Promise<void> {
    try {
      if (!settings.enableSound) {
        return;
      }

      const presetUrl = this.presetSounds[settings.presetKey];
      if (!presetUrl) {
        console.warn(`Preset sound '${settings.presetKey}' not found`);
        return;
      }

      return await this.playAudioFile(presetUrl, settings.volume);
    } catch (error) {
      console.error('Error playing notification sound:', error);
      throw error;
    }
  }


  // Complete calling sequence - plays preset audio notification only
  public async playCallingSequence(callInfo: CallInfo, settings: AudioSettings): Promise<void> {
    try {
      if (settings.enableSound) {
        await this.playNotificationSound(settings);
      }
    } catch (error) {
      console.error('Error in calling sequence:', error);
      throw error;
    }
  }

  // Get available preset sounds
  public getAvailablePresets(): Array<{key: PresetSoundKeyType, name: string}> {
    return [
      { key: 'notification_sound', name: 'Notification Sound' },
      { key: 'subway_chime', name: 'Subway Station Chime' },
      { key: 'header_tone', name: 'Header Tone' },
      { key: 'airport_chime', name: 'Airport Announcement Chime' },
      { key: 'airport_call', name: 'Airport Call' },
    ];
  }

  // Preload preset sounds for better performance
  public async preloadPresets(): Promise<void> {
    try {
      const preloadPromises = Object.values(this.presetSounds).map(url => 
        this.loadAudioFile(url).catch(error => {
          console.warn(`Failed to preload preset sound ${url}:`, error);
        })
      );
      
      await Promise.allSettled(preloadPromises);
      console.log('Preset sounds preloading completed');
    } catch (error) {
      console.error('Error preloading preset sounds:', error);
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

  // Test individual sound modes for settings UI
  public async playTestSound(settings: AudioSettings): Promise<void> {
    return this.playNotificationSound(settings);
  }
}

// Export singleton instance
export const audioSystem = AudioSystem.getInstance();