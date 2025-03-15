<!-- src/components/MobileControls.vue -->
<template>
    <div class="mobile-controls" v-if="isMobile">
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
      
      <!-- Boost button -->
      <button class="boost-button" 
        @touchstart="activateBoost" 
        :class="{ 'disabled': !boostAvailable }">
        BOOST
      </button>
      
      <!-- Pause button -->
      <button class="pause-button" @touchstart="togglePause">
        <span v-if="!paused">❚❚</span>
        <span v-else>▶</span>
      </button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'MobileControls',
    
    props: {
      paused: {
        type: Boolean,
        default: false
      },
      boostAvailable: {
        type: Boolean,
        default: true
      }
    },
    
    data() {
      return {
        isMobile: false,
        touchStartX: 0,
        touchStartY: 0,
        swipeThreshold: 50
      }
    },
    
    mounted() {
      // Detect if user is on mobile
      this.checkMobile()
      
      // Add event listeners for swipe gestures
      document.addEventListener('touchstart', this.handleTouchStart)
      document.addEventListener('touchmove', this.handleTouchMove)
      document.addEventListener('touchend', this.handleTouchEnd)
      
      // Add resize listener to recheck mobile status
      window.addEventListener('resize', this.checkMobile)
    },
    
    beforeDestroy() {
      // Clean up event listeners
      document.removeEventListener('touchstart', this.handleTouchStart)
      document.removeEventListener('touchmove', this.handleTouchMove)
      document.removeEventListener('touchend', this.handleTouchEnd)
      window.removeEventListener('resize', this.checkMobile)
    },
    
    methods: {
      checkMobile() {
        // Simple check for mobile devices - can be expanded
        this.isMobile = window.innerWidth <= 768 || 
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      },
      
      moveLeft() {
        this.$emit('move-left')
      },
      
      moveRight() {
        this.$emit('move-right')
      },
      
      stopMoving() {
        this.$emit('stop-moving')
      },
      
      activateBoost() {
        if (this.boostAvailable) {
          this.$emit('activate-boost')
        }
      },
      
      togglePause() {
        this.$emit('toggle-pause')
      },
      
      handleTouchStart(e) {
        // Store initial touch position for swipe detection
        this.touchStartX = e.touches[0].clientX
        this.touchStartY = e.touches[0].clientY
      },
      
      handleTouchMove(e) {
        // Prevent default behavior (scrolling) when game is active
        if (!this.paused) {
          e.preventDefault()
        }
      },
      
      handleTouchEnd(e) {
        if (this.paused) return
        
        // Calculate swipe distance
        const touchEndX = e.changedTouches[0].clientX
        const touchEndY = e.changedTouches[0].clientY
        const deltaX = touchEndX - this.touchStartX
        const deltaY = touchEndY - this.touchStartY
        
        // Check if it's a horizontal swipe (more horizontal than vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
          if (deltaX > 0) {
            // Swipe right
            this.moveRight()
          } else {
            // Swipe left
            this.moveLeft()
          }
        }
        
        // Check if it's a vertical swipe (more vertical than horizontal)
        else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > this.swipeThreshold) {
          if (deltaY < 0) {
            // Swipe up - boost
            this.activateBoost()
          }
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .mobile-controls {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    z-index: 100;
    pointer-events: none; /* Allow clicks to pass through the container */
  }
  
  .lane-controls {
    display: flex;
    gap: 20px;
    pointer-events: auto; /* Enable clicks on this element */
  }
  
  .control-button {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.5);
    border: none;
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
  
  .boost-button {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background-color: #ff6600;
    border: none;
    color: white;
    font-weight: bold;
    font-size: 18px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s, background-color 0.2s;
    pointer-events: auto; /* Enable clicks on this element */
    -webkit-tap-highlight-color: transparent;
  }
  
  .boost-button:active {
    transform: scale(0.95);
    background-color: #ff8533;
  }
  
  .boost-button.disabled {
    background-color: #999;
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .pause-button {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.5);
    border: none;
    color: white;
    font-size: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    position: absolute;
    top: -80px;
    right: 20px;
    pointer-events: auto; /* Enable clicks on this element */
    -webkit-tap-highlight-color: transparent;
  }
  
  .arrow {
    font-size: 30px;
    line-height: 1;
  }
  
  /* Responsive adjustments */
  @media (max-width: 480px) {
    .control-button {
      width: 60px;
      height: 60px;
    }
    
    .boost-button {
      width: 80px;
      height: 80px;
    }
    
    .pause-button {
      width: 45px;
      height: 45px;
      top: -70px;
    }
  }
  </style>