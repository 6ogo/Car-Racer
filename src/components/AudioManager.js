// src/components/AudioManager.js
export default class AudioManager {
    constructor() {
      this.sounds = {};
      this.initialized = false;
      this.muted = false;
    }
  
    init() {
      if (this.initialized) return;

      try {
        // Create audio elements
        this.createSound('coin', 'coin.mp3');
        this.createSound('crash', 'crash.mp3');
        this.createSound('boost', 'boost.mp3');
        this.createSound('engine', 'engine.mp3', true); // Loop the engine sound
        
        this.initialized = true;
        console.log("Audio system initialized successfully");
      } catch (error) {
        console.error("Audio initialization error:", error);
      }
    }
  
    createSound(name, src, loop = false) {
      try {
        const audio = new Audio();
        audio.src = `${process.env.BASE_URL}assets/sounds/${src}`;
        audio.loop = loop;
        
        this.sounds[name] = {
          audio: audio,
          playing: false
        };
        console.log(`Sound created: ${name} (${src})`);
      } catch (error) {
        console.error(`Error creating sound ${name}:`, error);
      }
    }
  
    playSound(name) {
      if (!this.initialized) {
        console.log("Initializing audio before playing sound");
        this.init();
      }
      
      if (this.muted) {
        console.log(`Sound ${name} not played (muted)`);
        return;
      }
      
      const sound = this.sounds[name];
      if (!sound) {
        console.error(`Sound ${name} not found`);
        return;
      }
      
      try {
        // If it's already playing, reset it
        if (sound.playing) {
          sound.audio.currentTime = 0;
        } else {
          sound.audio.play()
            .then(() => {
              console.log(`Sound ${name} playing`);
              sound.playing = true;
            })
            .catch(err => {
              console.error(`Error playing sound ${name}:`, err);
            });
          
          // Reset playing state when sound ends (for non-looping sounds)
          if (!sound.audio.loop) {
            sound.audio.onended = () => {
              sound.playing = false;
            };
          }
        }
      } catch (error) {
        console.error(`Error playing sound ${name}:`, error);
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