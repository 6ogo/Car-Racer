<!-- src/components/EnhancedMobileControls.vue -->
<template>
    <div class="mobile-controls" v-if="isMobileDevice">
      <!-- Top area for swipe controls -->
      <div class="swipe-area" 
        @touchstart="handleTouchStart" 
        @touchmove="handleTouchMove" 
        @touchend="handleTouchEnd">
        <!-- Swipe indicator arrows -->
        <div class="swipe-indicators" v-if="showSwipeIndicators">
          <div class="swipe-arrow left" :class="{ active: swipeDirection === 'left' }">
            <span>←</span>
          </div>
          <div class="swipe-arrow right" :class="{ active: swipeDirection === 'right' }">
            <span>→</span>
          </div>
          <div class="swipe-arrow up" :class="{ active: swipeDirection === 'up' }">
            <span>↑</span>
          </div>
        </div>
        
        <!-- Touch feedback indicator -->
        <div class="touch-indicator" v-if="showTouchIndicator" 
          :style="{ left: touchX + 'px', top: touchY + 'px' }">
        </div>
      </div>
      
      <!-- Lane change buttons -->
      <div class="lane-controls">
        <button class="control-button left-button" 
          @touchstart="moveLeft" 
          @touchend="stopMoving">
          <span class="arrow">←</span>
        </button>
        <button class="control-button right-button" 
          @touchstart="moveRight" 
          @touchend="stopMoving">
          <span class="arrow">→</span>
        </button>
      </div>
      
      <!-- Power-ups area -->
      <div class="powerups-area">
        <!-- Boost button -->
        <button class="boost-button" 
          @touchstart="activateBoost" 
          :class="{ 'disabled': !boostAvailable, 'active': isBoostActive }">
          <div class="boost-icon">🔥</div>
          <div class="boost-label">BOOST</div>
          <div class="cooldown-overlay" v-if="!boostAvailable" 
            :style="{ height: (100 - boostCooldownPercent) + '%' }"></div>
        </button>
        
        <!-- Shield button (conditionally shown) -->
        <button v-if="hasShield" class="shield-button" 
          @touchstart="activateShield" 
          :class="{ 'active': isShieldActive }">
          <div class="shield-icon">🛡️</div>
          <div class="boost-label">SHIELD</div>
        </button>
      </div>
      
      <!-- Game controls -->
      <div class="game-controls">
        <!-- Pause button -->
        <button class="control-button pause-button" @touchstart="togglePause">
          <span v-if="!paused">❚❚</span>
          <span v-else>▶</span>
        </button>
        
        <!-- Sound toggle button -->
        <button class="control-button sound-button" @touchstart="toggleSound">
          <span v-if="!soundMuted">🔊</span>
          <span v-else>🔇</span>
        </button>
      </div>
      
      <!-- Tutorial overlay for new users -->
      <div class="tutorial-overlay" v-if="showTutorial" @touchstart="dismissTutorial">
        <div class="tutorial-content">
          <h3>How to Play</h3>
          <div class="tutorial-item">
            <div class="tutorial-icon">👆</div>
            <div class="tutorial-text">Swipe left or right to change lanes</div>
          </div>
          <div class="tutorial-item">
            <div class="tutorial-icon">👆👆</div>
            <div class="tutorial-text">Double tap to activate boost</div>
          </div>
          <div class="tutorial-item">
            <div class="tutorial-icon">🔥</div>
            <div class="tutorial-text">Tap the boost button for speed burst</div>
          </div>
          <div class="tutorial-dismiss">Tap to continue</div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'EnhancedMobileControls',
    
    props: {
      paused: {
        type: Boolean,
        default: false
      },
      boostAvailable: {
        type: Boolean,
        default: true
      },
      boostCooldownPercent: {
        type: Number,
        default: 100
      },
      isBoostActive: {
        type: Boolean,
        default: false
      },
      hasShield: {
        type: Boolean,
        default: false
      },
      isShieldActive: {
        type: Boolean,
        default: false
      },
      soundMuted: {
        type: Boolean,
        default: false
      }
    },
    
    data() {
      return {
        isMobileDevice: false,
        touchStartX: 0,
        touchStartY: 0,
        touchX: 0,
        touchY: 0,
        swipeThreshold: 50,
        tapThreshold: 10,
        doubleTapThreshold: 300,
        lastTapTime: 0,
        swipeDirection: null,
        showSwipeIndicators: false,
        showTouchIndicator: false,
        touchIndicatorTimer: null,
        showTutorial: false
      }
    },
    
    mounted() {
      // Detect if user is on mobile
      this.checkMobile();
      
      // Check if this is the first time using the app
      this.checkFirstTimeUser();
      
      // Add resize listener to recheck mobile status
      window.addEventListener('resize', this.checkMobile);
      
      // Handle orientation change
      window.addEventListener('orientationchange', this.handleOrientationChange);
    },
    
    beforeDestroy() {
      // Clean up event listeners
      window.removeEventListener('resize', this.checkMobile);
      window.removeEventListener('orientationchange', this.handleOrientationChange);
      
      // Clear any pending timers
      if (this.touchIndicatorTimer) {
        clearTimeout(this.touchIndicatorTimer);
      }
    },
    
    methods: {
      checkMobile() {
        // More comprehensive mobile detection
        this.isMobileDevice = 
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
          (window.innerWidth <= 768) ||
          ('ontouchstart' in window);
        
        // Force landscape orientation for better gameplay
        if (this.isMobileDevice && window.innerHeight > window.innerWidth) {
          this.suggestLandscapeMode();
        }
      },
      
      checkFirstTimeUser() {
        // Check if tutorial has been shown before
        const tutorialShown = localStorage.getItem('mobile-tutorial-shown');
        
        if (!tutorialShown && this.isMobileDevice) {
          this.showTutorial = true;
          
          // Mark tutorial as shown
          localStorage.setItem('mobile-tutorial-shown', 'true');
        }
      },
      
      dismissTutorial() {
        this.showTutorial = false;
      },
      
      suggestLandscapeMode() {
        // Show a message suggesting to rotate the device
        // This could be implemented as a modal or overlay
        console.log('Please rotate your device to landscape mode for better gameplay');
      },
      
      handleOrientationChange() {
        // Handle device orientation change
        if (window.innerHeight > window.innerWidth) {
          this.suggestLandscapeMode();
        }
      },
      
      handleTouchStart(e) {
        // Record start position for swipe detection
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchX = this.touchStartX;
        this.touchY = this.touchStartY;
        
        // Show touch indicator
        this.showTouchIndicator = true;
        
        // Check for double tap
        const now = Date.now();
        const timeSinceLastTap = now - this.lastTapTime;
        
        if (timeSinceLastTap < this.doubleTapThreshold) {
          // Double tap detected
          this.activateBoost();
        }
        
        this.lastTapTime = now;
        
        // Reset swipe direction
        this.swipeDirection = null;
        this.showSwipeIndicators = true;
      },
      
      handleTouchMove(e) {
        if (this.paused) return;
        
        // Prevent default behavior (scrolling) when game is active
        e.preventDefault();
        
        // Update current touch position
        this.touchX = e.touches[0].clientX;
        this.touchY = e.touches[0].clientY;
        
        // Calculate distance moved
        const deltaX = this.touchX - this.touchStartX;
        const deltaY = this.touchY - this.touchStartY;
        
        // Determine swipe direction if moved enough
        if (Math.abs(deltaX) > this.tapThreshold || Math.abs(deltaY) > this.tapThreshold) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            this.swipeDirection = deltaX > 0 ? 'right' : 'left';
          } else {
            // Vertical swipe
            this.swipeDirection = deltaY > 0 ? 'down' : 'up';
          }
        } else {
          this.swipeDirection = null;
        }
      },
      
      handleTouchEnd(e) {
        if (this.paused) return;
        
        // Calculate final swipe distance
        const deltaX = this.touchX - this.touchStartX;
        const deltaY = this.touchY - this.touchStartY;
        
        // Hide touch indicator after a delay
        if (this.touchIndicatorTimer) {
          clearTimeout(this.touchIndicatorTimer);
        }
        
        this.touchIndicatorTimer = setTimeout(() => {
          this.showTouchIndicator = false;
        }, 300);
        
        // Hide swipe indicators
        this.showSwipeIndicators = false;
        
        // Check if it's a tap (minimal movement)
        const isTap = Math.abs(deltaX) < this.tapThreshold && Math.abs(deltaY) < this.tapThreshold;
        
        if (isTap) {
          // It's a tap, no action needed here
          return;
        }
        
        // Check if it's a horizontal swipe (more horizontal than vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
          if (deltaX > 0) {
            // Swipe right
            this.moveRight();
          } else {
            // Swipe left
            this.moveLeft();
          }
        }
        
        // Check if it's a vertical swipe (more vertical than horizontal)
        else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > this.swipeThreshold) {
          if (deltaY < 0) {
            // Swipe up - boost
            this.activateBoost();
          }
        }
      },
      
      moveLeft() {
        this.$emit('move-left');
      },
      
      moveRight() {
        this.$emit('move-right');
      },
      
      stopMoving() {
        this.$emit('stop-moving');
      },
      
      activateBoost() {
        if (this.boostAvailable) {
          this.$emit('activate-boost');
          
          // Add haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
        }
      },
      
      activateShield() {
        if (this.hasShield && !this.isShieldActive) {
          this.$emit('activate-shield');
          
          // Add haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
          }
        }
      },
      
      togglePause() {
        this.$emit('toggle-pause');
        
        // Add haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      },
      
      toggleSound() {
        this.$emit('toggle-sound');
      }
    }
  }
  </script>
  
  <style scoped>
  .mobile-controls {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
    pointer-events: none; /* Allow clicks to pass through the container */
  }
  
  .swipe-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: auto; /* Enable touch events */
  }
  
  .lane-controls {
    position: absolute;
    bottom: 30px;
    left: 20px;
    display: flex;
    gap: 15px;
    pointer-events: auto; /* Enable clicks on this element */
  }
  
  .control-button {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    font-size: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s, background-color 0.2s;
    -webkit-tap-highlight-color: transparent; /* Remove tap highlight on mobile */
  }
  
  .control-button:active {
    transform: scale(0.95);
    background-color: rgba(0, 0, 0, 0.7);
  }
  
  .powerups-area {
    position: absolute;
    bottom: 30px;
    right: 20px;
    display: flex;
    gap: 15px;
    pointer-events: auto; /* Enable clicks on this element */
  }
  
  .boost-button, .shield-button {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: none;
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s, background-color 0.2s;
    position: relative;
    overflow: hidden;
    pointer-events: auto; /* Enable clicks on this element */
    -webkit-tap-highlight-color: transparent;
  }
  
  .boost-button {
    background-color: #ff6600;
    background-image: linear-gradient(to bottom, #ff8800, #ff3300);
  }
  
  .shield-button {
    background-color: #0088ff;
    background-image: linear-gradient(to bottom, #00aaff, #0055ff);
  }
  
  .boost-button:active, .shield-button:active {
    transform: scale(0.95);
  }
  
  .boost-button.disabled {
    background-color: #999;
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .boost-button.active {
    animation: pulse 0.8s infinite alternate;
  }
  
  .shield-button.active {
    animation: glow 1.5s infinite alternate;
  }
  
  .boost-icon, .shield-icon {
    font-size: 24px;
    margin-bottom: 4px;
  }
  
  .boost-label {
    font-size: 12px;
    font-weight: bold;
  }
  
  .cooldown-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    transition: height 0.1s linear;
    pointer-events: none;
  }
  
  .game-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    pointer-events: auto; /* Enable clicks on this element */
  }
  
  .pause-button, .sound-button {
    width: 50px;
    height: 50px;
    font-size: 18px;
  }
  
  .touch-indicator {
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.8);
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: fade-out 0.5s forwards;
  }
  
  .swipe-indicators {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 200px;
    pointer-events: none;
  }
  
  .swipe-arrow {
    position: absolute;
    width: 60px;
    height: 60px;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: rgba(255, 255, 255, 0.7);
    font-size: 30px;
    opacity: 0.7;
    transition: transform 0.2s, opacity 0.2s, background-color 0.2s;
  }
  
  .swipe-arrow.active {
    background-color: rgba(255, 165, 0, 0.7);
    color: white;
    opacity: 1;
    transform: scale(1.2);
  }
  
  .swipe-arrow.left {
    left: 0;
    top: 50%;
    transform: translateY(-50%);
  }
  
  .swipe-arrow.right {
    right: 0;
    top: 50%;
    transform: translateY(-50%);
  }
  
  .swipe-arrow.up {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .tutorial-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: auto;
    z-index: 150;
  }
  
  .tutorial-content {
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 15px;
    padding: 20px;
    width: 80%;
    max-width: 400px;
    text-align: center;
    color: #333;
  }
  
  .tutorial-content h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #ff6600;
    font-size: 24px;
  }
  
  .tutorial-item {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .tutorial-icon {
    font-size: 28px;
    margin-right: 15px;
    width: 40px;
  }
  
  .tutorial-text {
    text-align: left;
    font-size: 16px;
  }
  
  .tutorial-dismiss {
    margin-top: 20px;
    color: #0088ff;
    font-weight: bold;
  }
  
  /* Animations */
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.1); opacity: 0.9; }
  }
  
  @keyframes glow {
    0% { box-shadow: 0 0 5px 0 rgba(0, 136, 255, 0.7); }
    100% { box-shadow: 0 0 20px 5px rgba(0, 136, 255, 0.9); }
  }
  
  @keyframes fade-out {
    0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
  }
  
  /* Responsive adjustments */
  @media (max-height: 500px) and (orientation: landscape) {
    .lane-controls {
      bottom: 15px;
    }
    
    .control-button {
      width: 50px;
      height: 50px;
      font-size: 20px;
    }
    
    .powerups-area {
      bottom: 15px;
    }
    
    .boost-button, .shield-button {
      width: 60px;
      height: 60px;
    }
    
    .boost-icon, .shield-icon {
      font-size: 20px;
      margin-bottom: 2px;
    }
    
    .boost-label {
      font-size: 10px;
    }
    
    .game-controls {
      top: 10px;
      right: 10px;
    }
    
    .pause-button, .sound-button {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }
  }
  
  /* Very small screens */
  @media (max-width: 320px) {
    .lane-controls {
      left: 10px;
      gap: 10px;
    }
    
    .control-button {
      width: 50px;
      height: 50px;
    }
    
    .powerups-area {
      right: 10px;
      gap: 10px;
    }
    
    .boost-button, .shield-button {
      width: 60px;
      height: 60px;
    }
  }
  </style>