// Audio System Utility for Clinic Calling System
// Handles both sound effects and Text-to-Speech functionality

import type { SoundModeType } from "@shared/schema";

export interface AudioSettings {
  enableSound: boolean;
  enableTTS: boolean;
  volume: number;
  ttsLanguage: string;
  // Enhanced sound system fields
  soundMode: SoundModeType;
  soundType: string; // For synth mode
  presetKey?: string; // For preset mode
  customAudioId?: string; // For file mode
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
  private presetSounds: Map<string, string> = new Map();

  private constructor() {
    this.initializePresetSounds();
  }

  public static getInstance(): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem();
    }
    return AudioSystem.instance;
  }

  private initializePresetSounds() {
    // Professional announcement preset sounds (URLs will be set when backend provides them)
    this.presetSounds.set('announcement1', '/api/audio/presets/announcement1.mp3');
    this.presetSounds.set('announcement2', '/api/audio/presets/announcement2.mp3');
    this.presetSounds.set('announcement3', '/api/audio/presets/announcement3.mp3');
    this.presetSounds.set('hospital_chime', '/api/audio/presets/hospital_chime.mp3');
    this.presetSounds.set('professional_ding', '/api/audio/presets/professional_ding.mp3');
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

  // Play notification sound based on settings mode
  public async playNotificationSound(settings: AudioSettings): Promise<void> {
    try {
      switch (settings.soundMode) {
        case 'synth':
          return await this.generateSound(settings.soundType, settings.volume);
          
        case 'preset':
          if (settings.presetKey && this.presetSounds.has(settings.presetKey)) {
            const presetUrl = this.presetSounds.get(settings.presetKey)!;
            return await this.playAudioFile(presetUrl, settings.volume);
          } else {
            console.warn('Preset not found, falling back to beep');
            return await this.generateSound('beep', settings.volume);
          }
          
        case 'file':
          if (settings.customAudioId) {
            // Custom audio file URL would come from media API
            const customUrl = `/api/media/${settings.customAudioId}/file`;
            return await this.playAudioFile(customUrl, settings.volume);
          } else {
            console.warn('Custom audio not specified, falling back to beep');
            return await this.generateSound('beep', settings.volume);
          }
          
        default:
          console.warn('Unknown sound mode, falling back to beep');
          return await this.generateSound('beep', settings.volume);
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
      // Always fall back to basic beep on error
      return await this.generateSound('beep', settings.volume);
    }
  }

  // Legacy method for backward compatibility
  public async playNotificationSoundLegacy(soundType: string, volume: number): Promise<void> {
    return this.generateSound(soundType, volume);
  }

  // ElevenLabs TTS functionality
  public async playTTS(callInfo: CallInfo, language: string, volume: number): Promise<void> {
    // Build the TTS message with proper punctuation for natural pauses
    const patientName = callInfo.patientName || (language === "en" ? `Number ${callInfo.patientNumber}` : `Nombor ${callInfo.patientNumber}`);
    const windowName = callInfo.windowName;
    
    const textToSpeak = language === "en" 
      ? `Calling for ${patientName}. Please proceed to ${windowName}.`
      : `Panggilan untuk ${patientName}. Sila ke ${windowName}.`;

    try {
      // Try ElevenLabs TTS first with language parameter
      const ttsUrl = `/api/tts?text=${encodeURIComponent(textToSpeak)}&language=${language}`;
      const response = await fetch(ttsUrl);
      
      if (response.ok && response.headers.get('content-type')?.includes('audio/mpeg')) {
        // Success - play ElevenLabs audio
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Set volume
        audio.volume = volume / 100;
        
        return new Promise((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audio.onerror = () => {
            console.warn('Audio playback error, falling back to browser TTS');
            URL.revokeObjectURL(audioUrl);
            // Fallback to browser TTS when audio playback fails
            this.playBrowserTTS(callInfo, language, volume).then(resolve).catch(reject);
          };
          
          // Play audio with user gesture handling
          audio.play().catch(error => {
            console.warn('Audio autoplay blocked, falling back to browser TTS:', error);
            URL.revokeObjectURL(audioUrl);
            // Fallback to browser TTS when autoplay is blocked
            this.playBrowserTTS(callInfo, language, volume).then(resolve).catch(reject);
          });
        });
      } else {
        // ElevenLabs not available or failed, fall back to browser TTS
        const responseData = await response.json().catch(() => ({}));
        if (responseData.fallback) {
          console.warn('Falling back to browser TTS:', responseData.message);
          return this.playBrowserTTS(callInfo, language, volume);
        } else {
          throw new Error('TTS service unavailable');
        }
      }
    } catch (error) {
      console.warn('ElevenLabs TTS failed, falling back to browser TTS:', error);
      return this.playBrowserTTS(callInfo, language, volume);
    }
  }

  // Fallback browser TTS (original implementation)
  private async playBrowserTTS(callInfo: CallInfo, language: string, volume: number): Promise<void> {
    if (!('speechSynthesis' in window)) {
      throw new Error('Text-to-Speech not supported in this browser');
    }

    const synth = window.speechSynthesis;
    
    // Stop any ongoing speech
    synth.cancel();

    // Build the TTS message with consistent bilingual format
    const patientName = callInfo.patientName || (language === "en" ? `Number ${callInfo.patientNumber}` : `Nombor ${callInfo.patientNumber}`);
    const windowName = callInfo.windowName;
    
    const textToSpeak = language === "en" 
      ? `Calling for ${patientName}. Please proceed to ${windowName}.`
      : `Panggilan untuk ${patientName}. Sila ke ${windowName}.`;

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
      // Step 1: Play notification sound if enabled (supports all modes: synth/preset/file)
      if (settings.enableSound) {
        await this.playNotificationSound(settings);
        
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

  // Get available preset sounds
  public getAvailablePresets(): Array<{key: string, name: string}> {
    return [
      { key: 'announcement1', name: 'Professional Announcement 1' },
      { key: 'announcement2', name: 'Professional Announcement 2' },
      { key: 'announcement3', name: 'Professional Announcement 3' },
      { key: 'hospital_chime', name: 'Hospital Chime' },
      { key: 'professional_ding', name: 'Professional Ding' },
    ];
  }

  // Preload preset sounds for better performance
  public async preloadPresets(): Promise<void> {
    try {
      const preloadPromises = Array.from(this.presetSounds.values()).map(url => 
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