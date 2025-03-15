<!-- src/components/Game.vue -->
<template>
    <div class="world" @mousemove="handleMouseMove" @keydown="handleKeyDown" @keyup="handleKeyUp" tabindex="0">
      <!-- Start Screen -->
      <div v-if="!gameStarted && !gameOver" class="start-screen">
        <h1>Car Racer</h1>
        <div class="instructions">
          <p>Use ← → to change lanes</p>
          <p>Use ↑ ↓ for minor adjustments</p>
          <p>Press SPACE to pause</p>
        </div>
        <button @click="startGame" class="start-button">Start Game</button>
        
        <div class="high-score">High Score: {{ highScore }}</div>
        
        <div class="sound-settings">
          <button @click="toggleSound" class="sound-button">
            {{ audioManager && audioManager.muted ? 'Sound: OFF' : 'Sound: ON' }}
          </button>
        </div>
      </div>
      
      <!-- Game UI -->
      <div v-if="gameStarted" class="game-ui">
        <div class="score-panel">
          <div class="score">Score: {{ score }}</div>
          <div class="coins">Coins: {{ coins }}</div>
          <div class="high-score">High Score: {{ highScore }}</div>
          
          <!-- Boost indicator -->
          <div class="boost-indicator" :class="{ 'active': isBoosting }">
            BOOST
          </div>
        </div>
        
        <!-- Pause Screen -->
        <div v-if="gamePaused" class="pause-screen">
          <h2>Game Paused</h2>
          <button @click="resumeGame">Resume</button>
          <button @click="restartGame">Restart</button>
        </div>
        
        <!-- Game Over Screen -->
        <div v-if="gameOver" class="game-over">
          <h2>Game Over!</h2>
          <p>Final Score: {{ score }}</p>
          <p v-if="score > highScore" class="new-high-score">New High Score!</p>
          <button @click="restartGame">Play Again</button>
          <button @click="goToMainMenu">Main Menu</button>
        </div>
      </div>
      
      <renderer :obj="renderer" :size="renderSize">
        <scene :obj="scene">
          <camera :obj="camera"
            :position="ui.camera.position"></camera>
    
          <light :obj="lights[0]"></light>
          <light :obj="lights[1]"></light>
          <light :obj="lights[2]"
            :position="ui.light2.position"></light>
    
          <object3d :obj="highway.mesh"
            :position="ui.highway.position"
            :rotation="ui.highway.rotation"></object3d>
          <object3d :obj="sky"
            :position="ui.sky.position"
            :rotation="ui.sky.rotation"></object3d>
          <object3d :obj="car.mesh"
            :scale="ui.car.scale"
            :position="ui.car.position"
            :rotation="ui.car.rotation"></object3d>
          <animation :fn="loop"></animation>
        </scene>
      </renderer>
    </div>
</template>
    
<script>
import * as THREE from 'three';
import Car from './Car';
import Highway from './Highway';
import { Colors } from './common';
import Truck from './Truck';
import Motorbike from './Motorbike';
import AudioManager from './AudioManager'

function normalize(v, vmin, vmax, tmin, tmax) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + (pc * dt);
  return tv;
}
    
export default {
  name: 'Game',

  data() {
    return {
      ui: {
        mouse: { x: 0, y: 0 },
        car: {
          scale: 0.25,
          position: { x: 0, y: 30, z: 0 },
          rotation: { z: 0 }
        },
        highway: {
          position: { y: -5 },
          rotation: { z: 0 }
        },
        sky: {
          position: { y: -600 },
          rotation: { z: 0 }
        },
        light2: {
          position: { x: 150, y: 350, z: 350 }
        },
        camera: {
          position: { x: -150, y: 100, z: 0 }
        },
        truck: {
          position: { x: 100, y: 30, z: 0 },
          rotation: { z: 0 }
        },
        motorbike: {
          position: { x: -100, y: 30, z: 0 },
          rotation: { z: 0 }
        }
      },
      WIDTH: window.innerWidth,
      HEIGHT: window.innerHeight,
      audioManager: null,
      score: 0,
      coins: 0,
      gameSpeed: 2,
      gameOver: false,
      gameStarted: false,
      gamePaused: false,
      obstacleSpawnRate: 0.01,
      coinSpawnRate: 0.02,
      boosterSpawnRate: 0.005,
      distanceTraveled: 0,
      keyState: {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        ArrowDown: false,
        Space: false
      },
      carLane: 1, // 0, 1, 2 for left, center, right
      laneChangeSpeed: 0.1, // speed of lane change
      targetLaneZ: 0, // target Z position for current lane
      lastObstacleTime: 0,
      lastCoinTime: 0,
      lastBoosterTime: 0,
      highScore: localStorage.getItem('carRacerHighScore') || 0,
      isBoosting: false,
      boostEndTime: 0,
      difficultyLevel: 1,
      difficultyThresholds: [500, 1000, 2000, 3500, 5000]
    };
  },

  computed: {
    renderSize() {
      return {
        w: this.WIDTH,
        h: this.HEIGHT
      };
    }
  },

  created() {
    this.init();
    this.animate();
    this.renderer = this.createRenderer();
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.lights = this.createLights();
    
    // Initialize audio manager
    this.audioManager = new AudioManager();
    this.audioManager.init();
    
    this.sky = this.createSky();
    this.car = new Car();
    this.highway = new Highway();
    
    // Set starting timestamp
    this.lastObstacleTime = Date.now();
    this.lastCoinTime = Date.now();
    this.lastBoosterTime = Date.now();
    
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('carRacerHighScore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore);
    }
  },
  
  mounted() {
    // Focus the div for keyboard controls
    this.$el.focus();
    
    // Add resize listener
    window.addEventListener('resize', this.handleResize);
  },
  
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },

  methods: {
    init() {
      // Set up the scene
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(this.renderer.domElement);

      // Add lighting (example)
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(0, 100, 100);
      this.scene.add(light);

      // Add the truck
      const truck = new Truck();
      truck.mesh.position.set(100, 0, 0); // Position it on the right
      this.scene.add(truck.mesh);

      // Add the motorbike
      const motorbike = new Motorbike();
      motorbike.mesh.position.set(-100, 0, 0); // Position it on the left
      this.scene.add(motorbike.mesh);

      // Position the camera
      this.camera.position.z = 200;
      this.camera.position.y = 100;
    },
    
    animate() {
      requestAnimationFrame(this.animate);
      this.renderer.render(this.scene, this.camera);
    },
    
    loop() {
      // Skip if game is over or paused
      if (this.gameOver || this.gamePaused || !this.gameStarted) return;
      
      // Update the driver's hair animation
      this.car.driver.updateHairs();
      
      // Update sky rotation
      this.ui.sky.rotation.z += 0.001;
      
      // Update game speed (gradually increase)
      this.gameSpeed += 0.0005;
      
      // Increase score based on distance traveled
      this.distanceTraveled += this.gameSpeed;
      this.score = Math.floor(this.distanceTraveled / 10);
      
      // Check for difficulty progression
      this.updateDifficulty();
      
      // Update highway (move road, obstacles, coins)
      this.highway.update(this.gameSpeed);
      
      // Handle lane changes
      this.updateCarPosition();
      
      // Update camera for dynamic feel
      this.updateCamera();
      
      // Check for collisions
      if (this.highway.checkCollisions(this.ui.car.position)) {
        this.audioManager.play('crash');
        this.endGame();
      }
      
      // Check for booster pickups
      if (this.highway.checkBoosterCollisions(this.ui.car.position)) {
        this.audioManager.play('boost');
        this.applyBoostEffect();
      }
      
      // Check for coin collections
      const coinsCollected = this.highway.checkCoinCollections(this.ui.car.position);
      if (coinsCollected > 0) {
        this.audioManager.play('coin');
        this.coins += coinsCollected;
        // Add bonus score for coins
        this.score += coinsCollected * 5;
      }
      
      // Randomly spawn obstacles
      this.spawnObstacles();
      
      // Randomly spawn coins
      this.spawnCoins();
      
      // Randomly spawn boosters (less frequently than coins)
      this.spawnBoosters();
      
      // Update boost state
      this.updateBoostState();
    },
    
    updateDifficulty() {
      // Check if we've crossed a difficulty threshold
      for (let i = 0; i < this.difficultyThresholds.length; i++) {
        if (this.score >= this.difficultyThresholds[i] && this.difficultyLevel === i + 1) {
          this.difficultyLevel++;
          // Increase obstacle spawn rate with each level
          this.obstacleSpawnRate += 0.002;
          // Slightly decrease coin spawn rate to balance difficulty
          this.coinSpawnRate -= 0.001;
          // Ensure coin spawn rate doesn't go too low
          this.coinSpawnRate = Math.max(0.005, this.coinSpawnRate);
          break;
        }
      }
    },
    
    updateBoostState() {
      // Check if boost has expired
      if (this.isBoosting && Date.now() > this.boostEndTime) {
        this.isBoosting = false;
        this.ui.car.scale = 0.25; // Return to original size
        this.audioManager.setVolume('engine', 0.5);
      }
    },

    spawnObstacles() {
      const now = Date.now();
      // Adjust spawn rate based on game speed for increasing difficulty
      const adjustedSpawnRate = this.obstacleSpawnRate * (2 / (1 + Math.exp(this.gameSpeed / 10)));
      
      if (now - this.lastObstacleTime > 2000 && Math.random() < adjustedSpawnRate) {
        // Determine which lane to spawn in (0, 1, 2)
        const lane = Math.floor(Math.random() * 3);
        
        // Determine what type of obstacle
        const types = ['car', 'truck', 'motorbike'];
        const weights = [0.5, 0.3, 0.2]; // Car most common, motorbike least common
        
        // Weighted random selection of obstacle type
        let random = Math.random();
        let type;
        let cumulativeWeight = 0;
        
        for (let i = 0; i < weights.length; i++) {
          cumulativeWeight += weights[i];
          if (random < cumulativeWeight) {
            type = types[i];
            break;
          }
        }
        
        // Create the obstacle at a distance in front of the player
        this.highway.createObstacle(type, lane, 1000);
        this.lastObstacleTime = now;
      }
    },
    
    spawnCoins() {
      const now = Date.now();
      // Adjust spawn rate based on game speed
      const adjustedSpawnRate = this.coinSpawnRate * (2 / (1 + Math.exp(this.gameSpeed / 15)));
      
      if (now - this.lastCoinTime > 1000 && Math.random() < adjustedSpawnRate) {
        // Determine which lane to spawn in (0, 1, 2)
        const lane = Math.floor(Math.random() * 3);
        
        // Sometimes spawn a series of coins in the same lane
        const coinCount = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 3 : 1;
        
        for (let i = 0; i < coinCount; i++) {
          // Create the coin at a distance in front of the player, spaced apart if multiple
          this.highway.createCoin(1000 + (i * 50), lane);
        }
        
        this.lastCoinTime = now;
      }
    },
    
    spawnBoosters() {
      const now = Date.now();
      // Boosters are more rare than coins
      const boosterSpawnRate = this.coinSpawnRate * 0.3;
      
      if (now - this.lastBoosterTime > 5000 && Math.random() < boosterSpawnRate) {
        // Determine which lane to spawn in (0, 1, 2)
        const lane = Math.floor(Math.random() * 3);
        
        // Create the booster at a distance in front of the player
        this.highway.createBooster(1000, lane);
        this.lastBoosterTime = now;
      }
    },
    
    applyBoostEffect() {
      // Temporarily increase the game speed
      const originalSpeed = this.gameSpeed;
      this.gameSpeed *= 1.5;
      
      // Visual boost effect - could add motion blur, particle effects, etc.
      // For now, just add a simple animation to the car
      this.ui.car.scale = 0.3; // Slightly bigger car during boost
      
      // Play boost sound
      this.audioManager.play('boost');
      
      // Engine sound effect louder during boost
      this.audioManager.setVolume('engine', 0.8);
      
      // Return to normal after 3 seconds
      setTimeout(() => {
        this.gameSpeed = originalSpeed + 0.5; // Return to slightly faster than original
        this.ui.car.scale = 0.25; // Return to original size
        this.audioManager.setVolume('engine', 0.5);
      }, 3000);
    },

    createSky() {
      const mesh = new THREE.Object3D();
      mesh.name = 'sky';
      
      // Create the sky color
      const skyGeom = new THREE.SphereGeometry(1000, 25, 25);
      const skyMat = new THREE.MeshPhongMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide
      });
      
      const sky = new THREE.Mesh(skyGeom, skyMat);
      mesh.add(sky);
      
      // Add clouds
      const nClouds = 20;
      const stepAngle = Math.PI * 2 / nClouds;
      
      for (let i = 0; i < nClouds; i++) {
        const cloud = this.createCloud();
        
        const angle = stepAngle * i;
        const height = 750 + Math.random() * 200;
        
        cloud.position.y = Math.sin(angle) * height;
        cloud.position.x = Math.cos(angle) * height;
        cloud.position.z = -400 - Math.random() * 400;
        cloud.rotation.z = angle + Math.PI / 2;
        
        const scale = 1 + Math.random() * 2;
        cloud.scale.set(scale, scale, scale);
        
        mesh.add(cloud);
      }
      
      return mesh;
    },
    
    createCloud() {
      const mesh = new THREE.Object3D();
      mesh.name = 'cloud';
      
      const geom = new THREE.BoxGeometry(20, 20, 20);
      const mat = new THREE.MeshPhongMaterial({
        color: Colors.white
      });
      
      // Create cloud with random number of blocks
      const nBlocs = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < nBlocs; i++) {
        const m = new THREE.Mesh(geom.clone(), mat);
        m.position.x = i * 15;
        m.position.y = Math.random() * 10;
        m.position.z = Math.random() * 10;
        m.rotation.z = Math.random() * Math.PI * 2;
        m.rotation.y = Math.random() * Math.PI * 2;
        
        const s = 0.1 + Math.random() * 0.9;
        m.scale.set(s, s, s);
        
        m.castShadow = true;
        m.receiveShadow = true;
        
        mesh.add(m);
      }
      
      return mesh;
    },
    
    createLights() {
      // Ambient light for overall illumination
      const ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);
      
      // Hemisphere light for sky/ground color gradient
      const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
      
      // Directional light for shadows
      const shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
      shadowLight.position.set(150, 350, 350);
      shadowLight.castShadow = true;
      
      // Shadow properties
      shadowLight.shadow.camera.left = -400;
      shadowLight.shadow.camera.right = 400;
      shadowLight.shadow.camera.top = 400;
      shadowLight.shadow.camera.bottom = -400;
      shadowLight.shadow.camera.near = 1;
      shadowLight.shadow.camera.far = 1000;
      shadowLight.shadow.mapSize.width = 2048;
      shadowLight.shadow.mapSize.height = 2048;
      
      return [hemisphereLight, ambientLight, shadowLight];
    },
    
    createCamera() {
      const aspectRatio = this.WIDTH / this.HEIGHT;
      const fieldOfView = 60;
      const nearPlane = 1;
      const farPlane = 10000;
      
      const camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
      );
      
      return camera;
    },
    
    createScene() {
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
      
      // For threejs-inspector to work in dev mode
      if (process.env.NODE_ENV === 'development') {
        window.THREE = THREE;
        window.scene = scene;
      }
      
      return scene;
    },
    
    createRenderer() {
      const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true 
      });
      
      renderer.setSize(this.WIDTH, this.HEIGHT);
      renderer.shadowMap.enabled = true;
      
      return renderer;
    },
    
    updateCarPosition() {
      // Handle lane changes
      if (this.keyState.ArrowLeft && this.carLane > 0) {
        this.carLane--;
        this.targetLaneZ = (this.carLane - 1) * 100;
        this.keyState.ArrowLeft = false; // prevent continuous lane changes
      } 
      else if (this.keyState.ArrowRight && this.carLane < 2) {
        this.carLane++;
        this.targetLaneZ = (this.carLane - 1) * 100;
        this.keyState.ArrowRight = false; // prevent continuous lane changes
      }
      
      // Smoothly move car towards target lane
      const diff = this.targetLaneZ - this.ui.car.position.z;
      if (Math.abs(diff) > 1) {
        this.ui.car.position.z += diff * this.laneChangeSpeed;
        
        // Tilt the car during lane change
        this.ui.car.rotation.z = -diff * 0.002;
      } else {
        this.ui.car.rotation.z = 0;
      }
      
      // Add mouse control for finer movements within lane
      const targetY = normalize(this.ui.mouse.y, -0.75, 0.75, 25, 50);
      this.car.mesh.position.y += (targetY - this.car.mesh.position.y) * 0.1;
      
      // Add subtle car movement for realism
      this.ui.car.position.y = 30 + Math.sin(this.distanceTraveled * 0.02) * 0.5;
    },
    
    updateCamera() {
      // Update camera position based on mouse movement
      const targetFOV = normalize(this.ui.mouse.x, -1, 1, 40, 60);
      this.camera.fov += (targetFOV - this.camera.fov) * 0.05;
      this.camera.updateProjectionMatrix();
      
      // Adjust camera position slightly based on mouse for more dynamic feel
      const targetCameraX = -150 + this.ui.mouse.x * 10;
      this.ui.camera.position.x += (targetCameraX - this.ui.camera.position.x) * 0.02;
    },
    
    handleMouseMove(e) {
      // Convert mouse position to normalized coordinates (-1 to 1)
      const tx = -1 + (e.clientX / this.WIDTH) * 2;
      const ty = 1 - (e.clientY / this.HEIGHT) * 2;
      this.ui.mouse = { x: tx, y: ty };
    },
    
    handleKeyDown(e) {
      // Track key state
      if (e.code in this.keyState) {
        this.keyState[e.code] = true;
      }
      
      // Handle pause toggle with Space key
      if (e.code === 'Space' && this.gameStarted) {
        e.preventDefault(); // Prevent scrolling
        this.pauseGame();
      }
      
      // Start game with Enter key on start screen
      if (e.code === 'Enter' && !this.gameStarted && !this.gameOver) {
        this.startGame();
      }
      
      // Restart with R key when game over
      if (e.code === 'KeyR' && this.gameOver) {
        this.restartGame();
      }
    },
    
    handleKeyUp(e) {
      // Track key state
      if (e.code in this.keyState) {
        this.keyState[e.code] = false;
      }
    },
    
    handleResize() {
      // Update size values
      this.WIDTH = window.innerWidth;
      this.HEIGHT = window.innerHeight;
      
      // Update camera aspect ratio
      this.camera.aspect = this.WIDTH / this.HEIGHT;
      this.camera.updateProjectionMatrix();
      
      // Update renderer size
      this.renderer.setSize(this.WIDTH, this.HEIGHT);
    },
    
    endGame() {
      this.gameOver = true;
      // Add any game over logic here (sounds, effects, etc.)
    },
    startGame() {
      this.gameStarted = true;
      this.gameOver = false;
      this.gamePaused = false;
      
      // Initialize or reset game state
      this.score = 0;
      this.coins = 0;
      this.gameSpeed = 2;
      this.distanceTraveled = 0;
      this.carLane = 1;
      this.targetLaneZ = 0;
      this.ui.car.position.z = 0;
      this.difficultyLevel = 1;
      
      // Initialize the audio
      if (!this.audioManager.initialized) {
        this.audioManager.init();
      }
      
      // Start background music/engine sound
      this.audioManager.play('engine');
      this.audioManager.setVolume('engine', 0.5);
      
      // Make sure game area has focus for keyboard controls
      this.$el.focus();
    },
    
    pauseGame() {
      if (this.gameStarted && !this.gameOver) {
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
          // Pause engine sound
          this.audioManager.stop('engine');
        } else {
          // Resume engine sound
          this.audioManager.play('engine');
        }
      }
    },
    
    resumeGame() {
      this.gamePaused = false;
      this.audioManager.play('engine');
      this.$el.focus();
    },
    
    goToMainMenu() {
      this.gameStarted = false;
      this.gameOver = false;
      this.gamePaused = false;
      this.audioManager.stop('engine');
    },
    
    restartGame() {
      // Reset game state
      this.gameOver = false;
      this.score = 0;
      this.coins = 0;
      this.gameSpeed = 2;
      this.distanceTraveled = 0;
      this.difficultyLevel = 1;
      
      // Reset car position
      this.carLane = 1;
      this.targetLaneZ = 0;
      this.ui.car.position.z = 0;
      
      // Reset obstacles and coins
      this.highway.obstacles.forEach(obstacle => {
        this.highway.mesh.remove(obstacle.mesh);
      });
      this.highway.obstacles = [];
      
      this.highway.coins.forEach(coin => {
        this.highway.mesh.remove(coin.mesh);
      });
      this.highway.coins = [];
      
      this.highway.boosters.forEach(booster => {
        this.highway.mesh.remove(booster.mesh);
      });
      this.highway.boosters = [];
      
      // Reset timestamps
      this.lastObstacleTime = Date.now();
      this.lastCoinTime = Date.now();
      this.lastBoosterTime = Date.now();
      
      // Play engine sound
      this.audioManager.play('engine');
      
      // Focus the game area
      this.$el.focus();
    },
    
    endGame() {
      this.gameOver = true;
      this.audioManager.stop('engine');
      this.audioManager.play('crash');
      
      // Update high score if needed
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('carRacerHighScore', this.score);
      }
    },
    
    toggleSound() {
      if (this.audioManager) {
        const muted = this.audioManager.toggleMute();
        if (!muted && this.gameStarted && !this.gamePaused) {
          this.audioManager.play('engine');
        }
      }
    },

    restartGame() {
      // Reset game state
      this.gameOver = false;
      this.score = 0;
      this.coins = 0;
      this.gameSpeed = 2;
      this.distanceTraveled = 0;
      
      // Reset car position
      this.carLane = 1;
      this.targetLaneZ = 0;
      this.ui.car.position.z = 0;
      
      // Reset obstacle and coin arrays
      this.highway.obstacles.forEach(obstacle => {
        this.highway.mesh.remove(obstacle.mesh);
      });
      this.highway.obstacles = [];
      
      this.highway.coins.forEach(coin => {
        this.highway.mesh.remove(coin.mesh);
      });
      this.highway.coins = [];
      
      // Reset timestamps
      this.lastObstacleTime = Date.now();
      this.lastCoinTime = Date.now();
      
      // Focus the game area
      this.$el.focus();
    }
  }
};
</script>

<style scoped>
.world {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(#e4e0ba, #f7d9aa);
  outline: none; /* Remove outline when focused */
  font-family: 'Arial', sans-serif;
}

.score-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.score, .coins, .high-score {
  font-size: 24px;
  margin-bottom: 10px;
}

/* Start Screen */
.start-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
  color: white;
}

.start-screen h1 {
  font-size: 48px;
  margin-bottom: 30px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
  animation: pulse 2s infinite;
}

.instructions {
  margin-bottom: 30px;
  text-align: center;
  font-size: 18px;
  line-height: 1.6;
  max-width: 500px;
}

.start-button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 20px;
  margin: 20px 0;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s, transform 0.3s;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.start-button:hover {
  background-color: #45a049;
  transform: scale(1.05);
}

.sound-settings {
  margin-top: 20px;
}

.sound-button {
  background-color: #5555ff;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.sound-button:hover {
  background-color: #4444cc;
}

/* Pause Screen */
.pause-screen {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  color: white;
  z-index: 100;
}

.pause-screen h2 {
  font-size: 36px;
  margin-bottom: 20px;
}

.pause-screen button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 20px 8px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.pause-screen button:hover {
  background-color: #45a049;
}

/* Game Over Screen */
.game-over {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  color: white;
  z-index: 100;
}

.game-over h2 {
  font-size: 36px;
  margin-bottom: 20px;
  color: #ff5555;
}

.game-over button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 20px 8px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.game-over button:hover {
  background-color: #45a049;
}

.new-high-score {
  color: gold;
  font-size: 24px;
  font-weight: bold;
  margin: 15px 0;
  animation: pulse 1s infinite;
}

/* Boost Indicator */
.boost-indicator {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #aaa;
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
  transition: all 0.3s;
}

.boost-indicator.active {
  background-color: #ff6600;
  color: white;
  animation: pulse 0.5s infinite;
  box-shadow: 0 0 15px #ff9900;
}

/* Animations */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>