<!-- src/components/Game.vue -->
<template>
    <div class="world" @mousemove="handleMouseMove" @keydown="handleKeyDown" @keyup="handleKeyUp" tabindex="0">
      <div class="score-panel">
        <div class="score">Score: {{ score }}</div>
        <div class="coins">Coins: {{ coins }}</div>
        <div v-if="gameOver" class="game-over">
          <h2>Game Over!</h2>
          <p>Final Score: {{ score }}</p>
          <button @click="restartGame">Play Again</button>
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
      obstacleSpawnRate: 0.01,
      coinSpawnRate: 0.02,
      distanceTraveled: 0,
      keyState: {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        ArrowDown: false
      },
      carLane: 1, // 0, 1, 2 for left, center, right
      laneChangeSpeed: 0.1, // speed of lane change
      targetLaneZ: 0, // target Z position for current lane
      lastObstacleTime: 0,
      lastCoinTime: 0
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
    this.audioManager = new AudioManager()

    this.sky = this.createSky();
    this.car = new Car();
    this.highway = new Highway();
    
    // Set starting timestamp
    this.lastObstacleTime = Date.now();
    this.lastCoinTime = Date.now();
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
      if (this.gameOver) return;
      
      // Update the driver's hair animation
      this.car.driver.updateHairs();
      
      // Update sky rotation
      this.ui.sky.rotation.z += 0.001;
      
      // Update game speed (gradually increase)
      this.gameSpeed += 0.0005;
      
      // Increase score based on distance traveled
      this.distanceTraveled += this.gameSpeed;
      this.score = Math.floor(this.distanceTraveled / 10);
      
      // Update highway (move road, obstacles, coins)
      this.highway.update(this.gameSpeed);
      
      // Handle lane changes
      this.updateCarPosition();
      
      // Check for collisions
      if (this.highway.checkCollisions(this.ui.car.position)) {
        this.endGame();
      }
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
}

.score-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  color: white;
  font-family: 'Arial', sans-serif;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.score, .coins {
  font-size: 24px;
  margin-bottom: 10px;
}

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
  margin: 20px 2px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.game-over button:hover {
  background-color: #45a049;
}
</style>