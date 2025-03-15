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
            <button @click="showCarSelection" class="start-button">Start Game</button>

            <div class="high-score">High Score: {{ highScore }}</div>

            <div class="sound-settings">
                <button @click="toggleSound" class="sound-button">
                    {{ audioManager && audioManager.muted ? 'Sound: OFF' : 'Sound: ON' }}
                </button>
            </div>
        </div>

        <!-- Car Selection Screen -->
        <car-selection v-if="showingCarSelection" @car-selected="onCarSelected">
        </car-selection>

        <!-- Game UI -->
        <div v-if="gameStarted" class="game-ui">
            <div class="score-panel">
                <div class="score">Score: {{ score }}</div>
                <div class="coins">Coins: {{ coins }}</div>
                <div class="high-score">High Score: {{ highScore }}</div>

                <!-- Active power-ups -->
                <div class="powerups">
                    <div v-if="isBoosting" class="powerup boost-active">
                        BOOST
                        <div class="timer" :style="{ width: boostTimePercent + '%' }"></div>
                    </div>
                    <div v-if="isShielded" class="powerup shield-active">
                        SHIELD
                        <div class="timer" :style="{ width: shieldTimePercent + '%' }"></div>
                    </div>
                    <div v-if="hasMagnet" class="powerup magnet-active">
                        MAGNET
                        <div class="timer" :style="{ width: magnetTimePercent + '%' }"></div>
                    </div>
                    <div v-if="hasMultiplier" class="powerup multiplier-active">
                        x{{ scoreMultiplier }}
                        <div class="timer" :style="{ width: multiplierTimePercent + '%' }"></div>
                    </div>
                </div>

                <!-- Environment switcher -->
                <div class="environment-switcher">
                    <div class="current-env">{{ currentEnvironment }}</div>
                </div>
            </div>

            <!-- Pause Screen -->
            <div v-if="gamePaused" class="pause-screen">
                <h2>Game Paused</h2>
                <button @click="resumeGame">Resume</button>
                <button @click="restartGame">Restart</button>
                <button @click="goToMainMenu">Main Menu</button>
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

        <!-- Mobile Controls -->
        <mobile-controls v-if="gameStarted && !gameOver && !gamePaused" :paused="gamePaused" :boost-available="canBoost"
            @move-left="onMoveLeft" @move-right="onMoveRight" @stop-moving="onStopMoving"
            @activate-boost="onActivateBoost" @toggle-pause="pauseGame">
        </mobile-controls>

        <three-renderer :obj="renderer" :size="renderSize">
            <three-scene :obj="scene">
                <three-camera :obj="camera" :position="ui.camera.position"></three-camera>

                <three-light :obj="lights[0]"></three-light>
                <three-light :obj="lights[1]"></three-light>
                <three-light :obj="lights[2]" :position="ui.light2.position"></three-light>

                <three-object3d :obj="highway.mesh" :position="ui.highway.position" :rotation="ui.highway.rotation">
                </three-object3d>
                <three-object3d :obj="sky" :position="ui.sky.position" :rotation="ui.sky.rotation"></three-object3d>
                <three-object3d :obj="car.mesh" :scale="ui.car.scale" :position="ui.car.position"
                    :rotation="ui.car.rotation">
                </three-object3d>
                <three-animation :fn="loop"></three-animation>
            </three-scene>
        </three-renderer>
    </div>
</template>

<script>
// Add error handling
window.addEventListener('error', function (e) {
    console.error('Global error caught:', e.error);
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', function (e) {
    console.error('Unhandled promise rejection:', e.reason);
});


import * as THREE from 'three';
import Car from './Car';
import Highway from './Highway';
import { Colors } from './common';
import Truck from './Truck';
import Motorbike from './Motorbike';
import AudioManager from './AudioManager';
import PowerUp from './PowerUp';
import EnvironmentManager from './EnvironmentManager';
import EffectsManager from './EffectsManager';
import CarSelection from './CarSelection';
import MobileControls from './MobileControls';
import RoadGenerator from './RoadGenerator';
import PoliceChase from './PoliceChase';
import VehicleLoader from './VehicleLoader';

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

    components: {
        CarSelection,
        MobileControls
    },

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
            environmentManager: null,
            effectsManager: null,
            score: 0,
            coins: 0,
            gameSpeed: 2,
            gameOver: false,
            gameStarted: false,
            gamePaused: false,
            showingCarSelection: false,
            obstacleSpawnRate: 0.01,
            coinSpawnRate: 0.02,
            powerUpSpawnRate: 0.005,
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
            lastPowerUpTime: 0,
            lastEnvironmentChangeTime: 0,
            highScore: localStorage.getItem('carRacerHighScore') || 0,
            difficultyLevel: 1,
            difficultyThresholds: [500, 1000, 2000, 3500, 5000],

            // Car properties from selection
            selectedCar: null,
            carType: 'balanced',
            carBoostDuration: 3000,
            carBoostMultiplier: 1.5,
            carTurnSpeed: 1,
            carCoinRadius: 1,
            carImmuneToObstacles: false,
            immunityRefreshTime: 15000,
            lastImmunityTime: 0,

            // Power-up states
            isBoosting: false,
            boostEndTime: 0,
            isShielded: false,
            shieldEndTime: 0,
            hasMagnet: false,
            magnetEndTime: 0,
            hasMultiplier: false,
            multiplierEndTime: 0,
            scoreMultiplier: 1,
            canBoost: true,
            immunityActive: false,

            // Environment
            currentEnvironment: 'Day',
            environments: ['Day', 'Night', 'Sunset', 'Rain', 'Snow', 'Desert'],
            environmentDuration: 30000, // 30 seconds per environment
            environmentThemeMappings: {
                'Day': 'day',
                'Night': 'night',
                'Sunset': 'sunset',
                'Rain': 'rain',
                'Snow': 'snow',
                'Desert': 'desert'
            },
            roadGenerator: null,
            policeChase: null,
            vehicleLoader: null,

            // For FBX models
            carModel: null,

            // For branching roads
            currentRoadPath: 'main',

            // For police chase
            policeChaseActive: false,
            wantedLevel: 0,

            // Last timestamp for delta time calculation
            lastUpdateTime: 0
        };
    },


    computed: {
        renderSize() {
            return {
                w: this.WIDTH,
                h: this.HEIGHT
            };
        },

        // Power-up timers for UI
        boostTimePercent() {
            if (!this.isBoosting) return 0;
            const total = this.carBoostDuration;
            const remaining = this.boostEndTime - Date.now();
            return (remaining / total) * 100;
        },

        shieldTimePercent() {
            if (!this.isShielded) return 0;
            const total = 5000; // Shield duration
            const remaining = this.shieldEndTime - Date.now();
            return (remaining / total) * 100;
        },

        magnetTimePercent() {
            if (!this.hasMagnet) return 0;
            const total = 8000; // Magnet duration
            const remaining = this.magnetEndTime - Date.now();
            return (remaining / total) * 100;
        },

        multiplierTimePercent() {
            if (!this.hasMultiplier) return 0;
            const total = 10000; // Multiplier duration
            const remaining = this.multiplierEndTime - Date.now();
            return (remaining / total) * 100;
        }
    },

    created() {
        // Initialize with safe defaults first
        this.car = { mesh: new THREE.Object3D(), driver: { updateHairs: () => { } } };
        this.highway = { mesh: new THREE.Object3D() };

        this.init();
        this.animate();
        this.renderer = this.createRenderer();
        this.scene = this.createScene();
        this.camera = this.createCamera();
        this.lights = this.createLights();

        // Initialize audio manager
        this.audioManager = new AudioManager();
        this.audioManager.init();

        // Initialize environment manager
        this.environmentManager = new EnvironmentManager(this.scene);

        // Initialize effects manager
        this.effectsManager = new EffectsManager(this.scene);

        this.sky = this.createSky();

        // Set default car initially
        this.car = new Car('balanced');
        this.highway = new Highway();

        // Set starting timestamp
        this.lastObstacleTime = Date.now();
        this.lastCoinTime = Date.now();
        this.lastPowerUpTime = Date.now();
        this.lastEnvironmentChangeTime = Date.now();

        // Load high score from localStorage
        const savedHighScore = localStorage.getItem('carRacerHighScore');
        if (savedHighScore) {
            this.highScore = parseInt(savedHighScore);
        };

        // Initialize vehicle loader
        this.vehicleLoader = new VehicleLoader();

        // Initialize the road generator after the scene is created
        this.roadGenerator = new RoadGenerator(this.scene);

        // Initialize police chase system
        this.policeChase = new PoliceChase(this.scene, this.roadGenerator);

        // Set audio for police chase
        const sirenAudio = new Audio('/assets/sounds/police_siren.mp3');
        const chatterAudio = new Audio('/assets/sounds/radio_chatter.mp3');
        this.policeChase.setSirenSound(sirenAudio);
        this.policeChase.setRadioChatter(chatterAudio);

        // Set current timestamp
        this.lastUpdateTime = Date.now();

        // Initialize the real objects after scene is set up
        this.initializeGameObjects();

    },
    // Add error handlers to component lifecycle hooks
    errorCaptured(err, vm, info) {
        console.error('Component error caught:', err);
        console.log('Error info:', info);
        console.log('Component with error:', vm);
        return false; // prevent propagation
    },



    // Fix the focus issue
    mounted() {
        // Check if the element can be focused first
        if (this.$el && typeof this.$el.focus === 'function') {
            this.$el.focus();
        }

        // Add resize listener
        window.addEventListener('resize', this.handleResize);

        // Preload vehicle models
        this.preloadVehicles();

        // Debugging logs
        console.log('Game component mounted');
        console.log('THREE.js version:', THREE.REVISION);

        // Verify critical objects
        if (!this.scene) console.error('Scene is undefined');
        if (!this.camera) console.error('Camera is undefined');
        if (!this.renderer) console.error('Renderer is undefined');
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

            // Position the camera
            this.camera.position.z = 200;
            this.camera.position.y = 100;
        },
        initializeGameObjects() {
            try {
                // Initialize objects once scene is ready
                if (this.scene) {
                    this.sky = this.createSky();
                    this.car = new Car('balanced');
                    this.highway = new Highway();
                }
            } catch (error) {
                console.error('Error initializing game objects:', error);
                // Fallback to empty objects if initialization fails
                if (!this.car || !this.car.mesh) {
                    this.car = { mesh: new THREE.Object3D(), driver: { updateHairs: () => { } } };
                }
                if (!this.highway || !this.highway.mesh) {
                    this.highway = { mesh: new THREE.Object3D() };
                }
            }
        },

        animate() {
            requestAnimationFrame(this.animate);
            this.renderer.render(this.scene, this.camera);
        },

        showCarSelection() {
            this.showingCarSelection = true;
        },

        onCarSelected(carData) {
            // Store selected car data
            this.selectedCar = carData;
            this.carType = carData.modelType;
            this.carBoostDuration = carData.boostDuration;
            this.carBoostMultiplier = carData.boostMultiplier;
            this.carTurnSpeed = carData.turnSpeed;

            // Set special abilities
            this.carCoinRadius = carData.coinCollectionRadius || 1;
            this.carImmuneToObstacles = !!carData.obstacleImmunity;
            this.immunityRefreshTime = carData.immunityRefreshTime || 15000;

            // Load the FBX model
            this.loadCarModel(carData.modelFile, carData.color);

            // Hide selection screen and start the game
            this.showingCarSelection = false;
            this.startGame();
        },

        loadCarModel(modelFile, colorHex) {
            // Remove existing model if any
            if (this.carModel) {
                this.scene.remove(this.carModel);
                this.carModel = null;
            }

            // Convert hex color string to integer
            const colorInt = parseInt(colorHex.replace('#', '0x'));

            // Load the car model
            this.vehicleLoader.loadVehicle(
                modelFile,
                (model) => {
                    // Store reference to model
                    this.carModel = model;

                    // Apply color
                    this.vehicleLoader.setVehicleColor(model, colorInt);

                    // Prepare for animation
                    this.vehicleLoader.prepareForAnimation(model);

                    // Position at origin
                    model.position.set(0, 30, 0);

                    // Add to scene
                    this.scene.add(model);

                    // Replace car.mesh with this model in UI references
                    this.car.mesh = model;
                },
                (xhr) => {
                    console.log(`${xhr.loaded / xhr.total * 100}% loaded`);
                },
                (error) => {
                    console.error('Error loading car model:', error);

                    // Fallback to geometric car if model fails to load
                    this.car = new Car(this.carType);
                }
            );
        },


        loop() {
            // Skip if game is over or paused
            if (this.gameOver || this.gamePaused || !this.gameStarted) return;

            // Guard against null car or driver
            if (this.car && this.car.driver && typeof this.car.driver.updateHairs === 'function') {
                this.car.driver.updateHairs();
            }

            // Calculate delta time for time-based updates
            const now = Date.now();
            const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
            this.lastUpdateTime = now;

            // Update sky rotation
            this.ui.sky.rotation.z += 0.001;

            // Update game speed (gradually increase)
            this.gameSpeed += 0.0005;

            // Increase score based on distance traveled
            this.distanceTraveled += this.gameSpeed;
            const baseScore = Math.floor(this.distanceTraveled / 10);
            this.score = baseScore * this.scoreMultiplier;

            // Check for difficulty progression
            this.updateDifficulty();

            // Update highway (move road, obstacles, coins)
            this.highway.update(this.gameSpeed);

            // Update environment (change based on time)
            this.updateEnvironment();

            // Handle lane changes
            this.updateCarPosition();

            // Update camera for dynamic feel
            this.updateCamera();

            // Update visual effects
            this.effectsManager.update();

            // Update environment effects (rain, snow, etc.)
            this.environmentManager.update();
            // Update road generation
            this.roadGenerator.update(this.ui.car.position);

            // Update police chase system
            this.policeChase.update(this.ui.car.position, this.gameSpeed, deltaTime);

            // Update police chase UI info
            this.policeChaseActive = this.policeChase.isChaseActive();
            if (this.policeChaseActive) {
                this.wantedLevel = Math.ceil(this.policeChase.getChaseIntensity() * 5);
            } else {
                this.wantedLevel = 0;
            }

            // Animate car wheels if using FBX model
            if (this.carModel && this.carModel.animateWheels) {
                this.carModel.animateWheels(this.gameSpeed);
            }

            // Check for collisions
            if (this.highway.checkCollisions(this.ui.car.position)) {
                // Check if shield or immunity is active
                if (this.isShielded) {
                    // Shield absorbs the hit
                    this.audioManager.play('boost'); // Play shield hit sound
                    this.isShielded = false;
                    this.shieldEndTime = 0;

                    // Create shield break effect
                    const position = new THREE.Vector3();
                    position.copy(this.ui.car.position);
                    this.effectsManager.createExplosion(position, 0x4d88ff, 30, 1.5);
                }
                else if (this.immunityActive) {
                    // Monster truck immunity absorbs hit
                    this.audioManager.play('boost');
                    this.immunityActive = false;

                    // Create effect
                    const position = new THREE.Vector3();
                    position.copy(this.ui.car.position);
                    this.effectsManager.createExplosion(position, 0x669900, 20, 1);
                }
                else {
                    // Game over
                    this.audioManager.play('crash');

                    // Create explosion effect
                    const position = new THREE.Vector3();
                    position.copy(this.ui.car.position);
                    this.effectsManager.createExplosion(position, 0xff0000, 50, 2);

                    this.endGame();
                }
            }

            // Check for power-up pickups
            const powerUpType = this.highway.checkPowerUpCollisions(this.ui.car.position);
            if (powerUpType) {
                this.audioManager.play('boost');
                this.activatePowerUp(powerUpType);
            }

            // Check for booster pickups
            if (this.highway.checkBoosterCollisions(this.ui.car.position)) {
                this.audioManager.play('boost');
                this.activateBoost();
            }

            const coinResult = this.highway.checkCoinCollections(
                this.ui.car.position,
                this.carCoinRadius,
                this.selectedCar && this.selectedCar.coinValueMultiplier ? this.selectedCar.coinValueMultiplier : 1
            );

            if (coinResult.count > 0) {
                this.audioManager.play('coin');
                this.coins += coinResult.value; // Use value which might be multiplied

                // Add bonus score for coins
                this.score += coinResult.value * 5 * this.scoreMultiplier;

                // Create coin collection effect for each coin
                for (let i = 0; i < coinResult.count; i++) {
                    // Random position around the car
                    const position = new THREE.Vector3();
                    position.copy(this.ui.car.position);
                    position.x += (Math.random() - 0.5) * 20;
                    position.y += (Math.random() - 0.5) * 20;
                    position.z += (Math.random() - 0.5) * 20;

                    this.effectsManager.createCoinCollectEffect(position);
                }
            }


            // Randomly spawn obstacles
            this.spawnObstacles();

            // Randomly spawn coins
            this.spawnCoins();

            // Randomly spawn power-ups
            this.spawnPowerUps();

            // Update power-up states
            this.updatePowerUpStates();

            // Check monster truck's obstacle immunity
            if (this.carImmuneToObstacles && !this.immunityActive) {
                const now = Date.now();
                if (now - this.lastImmunityTime > this.immunityRefreshTime) {
                    this.immunityActive = true;
                    this.lastImmunityTime = now;

                    // Visual indicator
                    const position = new THREE.Vector3();
                    position.copy(this.ui.car.position);
                    this.effectsManager.createShieldEffect(this.car.mesh, 0x669900);
                }
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
                this.ui.car.position.z += diff * this.laneChangeSpeed * this.carTurnSpeed;

                // Tilt the car during lane change
                this.ui.car.rotation.z = -diff * 0.002;
            } else {
                this.ui.car.rotation.z = 0;
            }

            // Get information about the nearest lane
            const laneInfo = this.roadGenerator.getNearestLanePosition(this.ui.car.position);

            if (laneInfo) {
                // Apply slight auto-correction to follow road
                const laneZ = laneInfo.position.z;
                const diff = laneZ - this.ui.car.position.z;

                // Only auto-correct if not actively changing lanes
                if (Math.abs(this.targetLaneZ - this.ui.car.position.z) < 5) {
                    this.ui.car.position.z += diff * 0.02;
                }

                // Update car rotation to follow road curve
                const roadAhead = this.roadGenerator.getRoadAhead(this.ui.car.position, 100);
                if (roadAhead.pathType === 'curve_left') {
                    this.ui.car.rotation.y = Math.max(-0.1, this.ui.car.rotation.y - 0.001);
                } else if (roadAhead.pathType === 'curve_right') {
                    this.ui.car.rotation.y = Math.min(0.1, this.ui.car.rotation.y + 0.001);
                } else {
                    // Gradually return to straight
                    this.ui.car.rotation.y *= 0.98;
                }
            }


            // Add mouse control for finer movements within lane
            const targetY = normalize(this.ui.mouse.y, -0.75, 0.75, 25, 50);
            this.car.mesh.position.y += (targetY - this.car.mesh.position.y) * 0.1;

            // Add subtle car movement for realism
            this.ui.car.position.y = 30 + Math.sin(this.distanceTraveled * 0.02) * 0.5;

            // If boosting, add trail effect
            if (this.isBoosting) {
                this.effectsManager.createTrail(this.car.mesh, 0xff6600, 20, 0.8);
            }
        },
        preloadVehicles() {
            if (!this.vehicleLoader) {
                this.vehicleLoader = new VehicleLoader();
            }

            // Get loading screen elements
            const loadingBar = document.getElementById('loading-bar');
            const loadingText = document.getElementById('loading-text');

            // Update loading text
            if (loadingText) {
                loadingText.textContent = 'Loading vehicles...';
            }

            // Get all model files from car options
            const modelFiles = this.cars.map(car => car.modelFile);

            // Add preloading logic
            this.vehicleLoader.preloadVehicles(
                modelFiles,
                () => {
                    console.log('All vehicles preloaded successfully');

                    // Update loading text
                    if (loadingText) {
                        loadingText.textContent = 'Ready!';
                    }

                    // Update loading bar
                    if (loadingBar) {
                        loadingBar.style.width = '100%';
                    }

                    // Hide loading screen after a short delay
                    setTimeout(() => {
                        const loadingScreen = document.getElementById('loading-screen');
                        if (loadingScreen) {
                            loadingScreen.style.opacity = '0';
                            setTimeout(() => {
                                loadingScreen.style.display = 'none';
                            }, 500);
                        }
                    }, 500);
                }
            );
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

        updateEnvironment() {
            const now = Date.now();

            // Check if it's time to change the environment
            if (now - this.lastEnvironmentChangeTime > this.environmentDuration) {
                // Get the next environment in the cycle
                const currentIndex = this.environments.indexOf(this.currentEnvironment);
                const nextIndex = (currentIndex + 1) % this.environments.length;
                const nextEnvironment = this.environments[nextIndex];

                // Update the environment
                this.setEnvironment(nextEnvironment);

                // Reset the timer
                this.lastEnvironmentChangeTime = now;
            }
        },

        setEnvironment(environment) {
            if (!this.environments.includes(environment)) return;

            // Set the current environment
            this.currentEnvironment = environment;

            // Map to theme name in environment manager
            const themeName = this.environmentThemeMappings[environment];
            this.environmentManager.setTheme(themeName.toLowerCase());
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

        spawnPowerUps() {
            const now = Date.now();

            if (now - this.lastPowerUpTime > 5000 && Math.random() < this.powerUpSpawnRate) {
                // Determine which lane to spawn in (0, 1, 2)
                const lane = Math.floor(Math.random() * 3);

                // Determine what type of power-up to spawn
                const types = ['boost', 'shield', 'magnet', 'multiplier'];
                const randomType = types[Math.floor(Math.random() * types.length)];

                // Create the power-up at a distance in front of the player
                this.highway.createPowerUp(randomType, lane, 1000);
                this.lastPowerUpTime = now;
            }
        },

        activatePowerUp(type) {
            const now = Date.now();

            switch (type) {
                case 'boost':
                    this.activateBoost();
                    break;
                case 'shield':
                    this.isShielded = true;
                    this.shieldEndTime = now + 5000; // 5 seconds
                    this.effectsManager.createShieldEffect(this.car.mesh);
                    break;
                case 'magnet':
                    this.hasMagnet = true;
                    this.magnetEndTime = now + 8000; // 8 seconds
                    // Visual effect
                    break;
                case 'multiplier':
                    this.hasMultiplier = true;
                    this.scoreMultiplier = 2;
                    this.multiplierEndTime = now + 10000; // 10 seconds
                    // Visual effect
                    break;
            }
        },

        activateBoost() {
            if (!this.canBoost) return;

            const now = Date.now();

            // Activate boost
            this.isBoosting = true;
            this.boostEndTime = now + this.carBoostDuration;

            // Temporarily increase the game speed
            this.gameSpeed *= this.carBoostMultiplier;

            // Visual boost effect
            this.ui.car.scale = 0.3; // Slightly bigger car during boost
            this.effectsManager.createBoostEffect(this.car.mesh);

            // Play boost sound
            this.audioManager.play('boost');

            // Engine sound effect louder during boost
            this.audioManager.setVolume('engine', 0.8);

            // Set cooldown
            this.canBoost = false;
            setTimeout(() => {
                this.canBoost = true;
            }, this.carBoostDuration + 2000); // 2 second cooldown after boost ends
        },

        updatePowerUpStates() {
            const now = Date.now();

            // Check boost state
            if (this.isBoosting && now > this.boostEndTime) {
                this.isBoosting = false;
                this.gameSpeed /= this.carBoostMultiplier;
                this.ui.car.scale = 0.25; // Return to original size
                this.audioManager.setVolume('engine', 0.5);
            }

            // Check shield state
            if (this.isShielded && now > this.shieldEndTime) {
                this.isShielded = false;
            }

            // Check magnet state
            if (this.hasMagnet && now > this.magnetEndTime) {
                this.hasMagnet = false;
            }

            // Check multiplier state
            if (this.hasMultiplier && now > this.multiplierEndTime) {
                this.hasMultiplier = false;
                this.scoreMultiplier = 1;
            }
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
                this.showCarSelection();
            }

            // Restart with R key when game over
            if (e.code === 'KeyR' && this.gameOver) {
                this.restartGame();
            }

            // Activate boost with Shift
            if (e.code === 'ShiftLeft' && this.gameStarted && !this.gamePaused && !this.gameOver) {
                this.activateBoost();
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

        // Mobile controls handlers
        onMoveLeft() {
            if (this.carLane > 0) {
                this.carLane--;
                this.targetLaneZ = (this.carLane - 1) * 100;
            }
        },

        onMoveRight() {
            if (this.carLane < 2) {
                this.carLane++;
                this.targetLaneZ = (this.carLane - 1) * 100;
            }
        },

        onStopMoving() {
            // Nothing to do here for this game
        },

        onActivateBoost() {
            this.activateBoost();
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

            // Reset power-up states
            this.isBoosting = false;
            this.isShielded = false;
            this.hasMagnet = false;
            this.hasMultiplier = false;
            this.scoreMultiplier = 1;
            this.canBoost = true;

            // Set initial environment
            this.setEnvironment('Day');
            this.lastEnvironmentChangeTime = Date.now();

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
            this.showingCarSelection = false;
            this.audioManager.stop('engine');
        },

        restartGame() {
            // Reset car to selected type
            if (this.selectedCar) {
                this.car = new Car(this.carType);
            } else {
                this.car = new Car('balanced');
            }

            // Reset game state
            this.gameOver = false;
            this.score = 0;
            this.coins = 0;
            this.gameSpeed = 2;
            this.distanceTraveled = 0;
            this.difficultyLevel = 1;

            // Reset power-up states
            this.isBoosting = false;
            this.isShielded = false;
            this.hasMagnet = false;
            this.hasMultiplier = false;
            this.scoreMultiplier = 1;
            this.canBoost = true;

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

            this.highway.powerUps.forEach(powerUp => {
                this.highway.mesh.remove(powerUp.mesh);
            });
            this.highway.powerUps = [];

            // Reset timestamps
            this.lastObstacleTime = Date.now();
            this.lastCoinTime = Date.now();
            this.lastPowerUpTime = Date.now();
            this.lastEnvironmentChangeTime = Date.now();

            // Reset to day environment
            this.setEnvironment('Day');

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
    outline: none;
    /* Remove outline when focused */
    font-family: 'Arial', sans-serif;
}

.score-panel {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 10;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.score,
.coins,
.high-score {
    font-size: 24px;
    margin-bottom: 10px;
}

/* Power-up indicators */
.powerups {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
}

.powerup {
    padding: 8px 15px;
    border-radius: 20px;
    font-weight: bold;
    position: relative;
    overflow: hidden;
    min-width: 100px;
    text-align: center;
}

.timer {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background-color: white;
    transition: width 0.1s linear;
}

.boost-active {
    background-color: #ff6600;
    color: white;
    animation: pulse 0.5s infinite alternate;
}

.shield-active {
    background-color: #4d88ff;
    color: white;
}

.magnet-active {
    background-color: #ff3333;
    color: white;
}

.multiplier-active {
    background-color: #ffcc00;
    color: black;
}

/* Environment display */
.environment-switcher {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 5px 15px;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    color: white;
    font-weight: bold;
}

.current-env {
    text-transform: uppercase;
    letter-spacing: 1px;
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
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
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

/* Animations */
@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }

    100% {
        transform: scale(1);
    }
}

/* Mobile Responsive Adjustments */
@media (max-width: 768px) {
    .score-panel {
        font-size: 14px;
    }

    .score,
    .coins,
    .high-score {
        font-size: 18px;
        margin-bottom: 5px;
    }

    .powerups {
        top: 10px;
        right: 10px;
    }

    .powerup {
        padding: 5px 10px;
        min-width: 80px;
        font-size: 14px;
    }

    .environment-switcher {
        font-size: 14px;
        padding: 3px 10px;
    }

    .start-screen h1 {
        font-size: 36px;
    }

    .instructions {
        font-size: 16px;
        padding: 0 20px;
    }

    .pause-screen,
    .game-over {
        width: 80%;
        padding: 20px;
    }

    .pause-screen h2,
    .game-over h2 {
        font-size: 28px;
    }

    .pause-screen button,
    .game-over button {
        padding: 12px 24px;
        font-size: 14px;
        margin: 10px 5px;
    }
}
</style>