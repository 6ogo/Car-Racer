// src/components/AudioManager.js
export default class AudioManager {
    constructor() {
      this.sounds = {};
      this.initialized = false;
      this.muted = false;
    }
  
    init() {
      if (this.initialized) return;
  
      // Create audio elements
      this.createSound('coin', 'coin.mp3');
      this.createSound('crash', 'crash.mp3');
      this.createSound('boost', 'boost.mp3');
      this.createSound('engine', 'engine.mp3', true); // Loop the engine sound
      
      this.initialized = true;
    }
  
    createSound(name, src, loop = false) {
      const audio = new Audio();
      audio.src = `/static/sounds/${src}`; // Adjust path as needed
      audio.loop = loop;
      
      this.sounds[name] = {
        audio: audio,
        playing: false
      };
    }
  
    play(name) {
      if (!this.initialized || this.muted) return;
      
      const sound = this.sounds[name];
      if (!sound) return;
      
      // If it's already playing, reset it
      if (sound.playing) {
        sound.audio.currentTime = 0;
      } else {
        sound.audio.play();
        sound.playing = true;
        
        // Reset playing state when sound ends (for non-looping sounds)
        if (!sound.audio.loop) {
          sound.audio.onended = () => {
            sound.playing = false;
          };
        }
      }
    }
  
    stop(name) {
      if (!this.initialized) return;
      
      const sound = this.sounds[name];
      if (!sound) return;
      
      sound.audio.pause();
      sound.audio.currentTime = 0;
      sound.playing = false;
    }
  
    toggleMute() {
      this.muted = !this.muted;
      
      // Mute/unmute all sounds
      Object.values(this.sounds).forEach(sound => {
        sound.audio.muted = this.muted;
      });
      
      return this.muted;
    }
    
    // Adjust volume of a specific sound
    setVolume(name, volume) {
      if (!this.initialized) return;
      
      const sound = this.sounds[name];
      if (!sound) return;
      
      // Volume should be between 0 and 1
      sound.audio.volume = Math.max(0, Math.min(volume, 1));
    }
  }