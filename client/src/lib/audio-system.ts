// Audio System Utility for Clinic Calling System  
// Handles preset audio notifications only

import type { SoundModeType, PresetSoundKeyType } from "@shared/schema";

// Import preset audio files via @assets
// Original 5 files
import notificationSound from "@assets/notification-sound-3-262896_1759056866786.mp3";
import subwayChime from "@assets/subway-station-chime-100558_1759056866786.mp3";
import headerTone from "@assets/header-39344_1759056866787.mp3";
import airportChime from "@assets/airport-announcement-call-chime-start-and-finish-342984_1759056866787.mp3";
import airportCall from "@assets/airport-call-157168_1759056866787.mp3";

// New 8 WAV files
import airportDing1569 from "@assets/mixkit-airport-announcement-ding-1569_1759142829288.wav";
import melodicAirportDing1570 from "@assets/mixkit-melodic-airport-announcement-ding-1570_1759142829292.wav";
import flutePhoneAlert2316 from "@assets/mixkit-flute-mobile-phone-notification-alert-2316_1759142829291.wav";
import happyBells937 from "@assets/mixkit-happy-bells-notification-937_1759142829291.wav";
import orchestraTriumphant2285 from "@assets/mixkit-orchestra-triumphant-trumpets-2285_1759142829292.wav";
import orchestraEnding2292 from "@assets/mixkit-orchestra-trumpets-ending-2292_1759142829294.wav";
import softwareRemove2576 from "@assets/mixkit-software-interface-remove-2576_1759142829294.wav";
import trumpetFanfare2293 from "@assets/mixkit-trumpet-fanfare-2293_1759142829294.wav";

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
  
  // Centralized preset definitions
  private static readonly PRESET_DEFS: Array<{key: PresetSoundKeyType, name: string, src: string}> = [
    // Original 5 files
    { key: 'notification_sound', name: 'Notification Sound', src: notificationSound },
    { key: 'subway_chime', name: 'Subway Station Chime', src: subwayChime },
    { key: 'header_tone', name: 'Header Tone', src: headerTone },
    { key: 'airport_chime', name: 'Airport Announcement Chime', src: airportChime },
    { key: 'airport_call', name: 'Airport Call', src: airportCall },
    
    // New 8 WAV files
    { key: 'airport_ding_1569', name: 'Airport Ding (1569)', src: airportDing1569 },
    { key: 'melodic_airport_ding_1570', name: 'Melodic Airport Ding (1570)', src: melodicAirportDing1570 },
    { key: 'flute_phone_alert_2316', name: 'Flute Phone Alert (2316)', src: flutePhoneAlert2316 },
    { key: 'happy_bells_937', name: 'Happy Bells (937)', src: happyBells937 },
    { key: 'orchestra_trumpets_triumphant_2285', name: 'Orchestra Trumpets – Triumphant (2285)', src: orchestraTriumphant2285 },
    { key: 'orchestra_trumpets_ending_2292', name: 'Orchestra Trumpets – Ending (2292)', src: orchestraEnding2292 },
    { key: 'software_remove_2576', name: 'Interface Remove (2576)', src: softwareRemove2576 },
    { key: 'trumpet_fanfare_2293', name: 'Trumpet Fanfare (2293)', src: trumpetFanfare2293 }
  ];

  // Build preset sound mappings from centralized definitions
  private presetSounds: Record<PresetSoundKeyType, string> = Object.fromEntries(
    AudioSystem.PRESET_DEFS.map(def => [def.key, def.src])
  ) as Record<PresetSoundKeyType, string>;

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

  // Get available preset sounds from centralized definitions
  public getAvailablePresets(): Array<{key: PresetSoundKeyType, name: string}> {
    return AudioSystem.PRESET_DEFS.map(({key, name}) => ({key, name}));
  }

  // Preload preset sounds for better performance
  public async preloadPresets(): Promise<void> {
    try {
      const preloadPromises = AudioSystem.PRESET_DEFS.map(def => 
        this.loadAudioFile(def.src).catch(error => {
          console.warn(`Failed to preload preset sound ${def.name}:`, error);
        })
      );
      
      await Promise.allSettled(preloadPromises);
      console.log('Preset sounds preloading completed - 13 total sounds');
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