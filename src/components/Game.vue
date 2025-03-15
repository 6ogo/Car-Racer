<!-- src/components/Game.vue -->
<template>
    <div class="world" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp" @mousemove="handleMouseMove">
        <!-- Car Selection Screen -->
        <car-selection v-if="!gameStarted && !gameOver" @car-selected="onCarSelected" @toggle-sound="toggleSound"
            :high-score="highScore" :sound-muted="audioManager && audioManager.muted"></car-selection>

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

        <three-renderer :obj="renderer" :size="size">
            <three-scene :obj="scene">
                <three-camera :obj="camera" :position="cameraPosition" />
                <three-light :obj="ambientLight" :position="{ x: 0, y: 0, z: 0 }" />
                <three-light :obj="directionalLight" :position="{ x: -100, y: 100, z: 50 }" />
                <three-object3d v-if="highway && highway.mesh" :obj="highway.mesh" :position="ui.highway.position"
                    :rotation="ui.highway.rotation">
                </three-object3d>
                <three-object3d v-if="sky" :obj="sky" :position="ui.sky.position"
                    :rotation="ui.sky.rotation"></three-object3d>
                <three-object3d v-if="car && car.mesh" :obj="car.mesh" :scale="ui.car.scale" :position="ui.car.position"
                    :rotation="ui.car.rotation">
                </three-object3d>
                <three-animation :fn="animate"></three-animation>
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
import MobileControls from './EnhancedMobileControls';
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
                    position: { x: 0, y: 35, z: 0 }, // Initial position adjusted to avoid crashes
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
                    position: { x: 0, y: 80, z: 0 }
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
            scene: null,
            camera: null,
            renderer: null,
            ambientLight: null,
            directionalLight: null,
            cameraPosition: { x: -100, y: 50, z: 0 },
            size: { w: window.innerWidth, h: window.innerHeight },
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
            coinSpawnRate: 0.01, // Reduced from 0.02 to spawn fewer coins
            powerUpSpawnRate: 0.005,
            distanceTraveled: 0,
            keyState: {
                ArrowLeft: false,
                ArrowRight: false,
                ArrowUp: false,
                ArrowDown: false,
                KeyA: false,
                KeyD: false,
                KeyW: false,
                KeyS: false,
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

            cameraPosition: { x: -100, y: 50, z: 0 }, // Behind and above the car
            carPosition: { x: 0, y: 0, z: 0 },       // Example car position

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
            lastUpdateTime: 0,

            // Three.js objects
            scene: null,
            camera: null,
            renderer: null,
            lights: [],
            sky: null,
            car: null,
            carPosition: { x: 0, y: 0, z: 0 },
            speed: 5, // Units per frame            
            highway: null,

            // Animation loop
            animationFrameId: null,
            frame: 0,

            // Collectibles
            collectibles: [],

            // Obstacles
            obstacles: [],

            // Power-ups
            powerUps: [],

            // Shield time
            shieldTime: 0,

            // Multiplier time
            multiplierTime: 0,

            // Magnet time
            magnetTime: 0,
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
            // Calculate boost time left
            const boostTimeLeft = this.boostEndTime - Date.now();
            const boostDuration = this.carBoostDuration;
            return boostTimeLeft / boostDuration * 100;
        },

        shieldTimePercent() {
            // Calculate shield time left
            const shieldTimeLeft = this.shieldEndTime - Date.now();
            const shieldDuration = 5000; // Shield duration
            return shieldTimeLeft / shieldDuration * 100;
        },

        magnetTimePercent() {
            // Calculate magnet time left
            const magnetTimeLeft = this.magnetEndTime - Date.now();
            const magnetDuration = 8000; // Magnet duration
            return magnetTimeLeft / magnetDuration * 100;
        },

        multiplierTimePercent() {
            // Calculate multiplier time left
            const multiplierTimeLeft = this.multiplierEndTime - Date.now();
            const multiplierDuration = 10000; // Multiplier duration
            return multiplierTimeLeft / multiplierDuration * 100;
        }
    },

    created() {
        console.log("Game component created");
        this.init();
    },

    mounted() {
        console.log("Game component mounted");

        // Initialize core components
        // Initialize Three.js objects
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.lights = this.createLights();
        this.sky = this.createSky();
        // Initialize lights
        this.ambientLight = new THREE.AmbientLight(0x404040); // Soft gray light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // White sunlight
        this.directionalLight.castShadow = true; // Enable shadows if desired

        this.updateCamera();
        // Set default car and highway
        this.car = new Car(); // From Car.js
        this.scene.add(this.car.mesh);
        this.highway = new Highway();

        // Initialize audio manager
        this.audioManager = new AudioManager();
        this.audioManager.init();

        // Initialize environment manager
        this.environmentManager = new EnvironmentManager(this.scene);

        // Initialize effects manager
        this.effectsManager = new EffectsManager(this.scene);

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

        // Make sure game area has focus for keyboard controls
        if (this.$el && typeof this.$el.focus === 'function') {
            this.$el.focus();
        }

        // Add resize listener
        window.addEventListener('resize', this.handleResize);

        // Start animation loop
        this.animate();
    },

    beforeDestroy() {
        window.removeEventListener('resize', this.handleResize);
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    },

    methods: {
        init() {
            this.createRenderer();
            this.createScene();
        },

        createRenderer() {
            console.log("Creating renderer");
            const renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });

            renderer.setSize(this.WIDTH, this.HEIGHT);
            renderer.shadowMap.enabled = true;

            return renderer;
        },

        createScene() {
            console.log("Creating scene");
            const scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

            // For threejs-inspector to work in dev mode
            if (process.env.NODE_ENV === 'development') {
                window.THREE = THREE;
                window.scene = scene;
            }

            return scene;
        },

        createCamera() {
            console.log("Creating camera");
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

            // Position camera further back and higher to see more of the map
            camera.position.set(0, 80, 0);

            // Look slightly down and ahead
            camera.lookAt(new THREE.Vector3(100, 0, 0));

            return camera;
        },

        createLights() {
            console.log("Creating lights");
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

        createSky() {
            console.log("Creating sky");
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

        onCarSelected(carData) {
            console.log("Car selected:", carData);
            this.selectedCar = carData;
            this.showCarSelection = false;
            this.showLoading = true;

            // Save car information
            if (carData && carData.modelType) {
                console.log(`Loading car model: ${carData.modelType} with color ${carData.color}`);
                this.loadCarModel(carData.modelType, carData.color, () => {
                    this.showLoading = false;
                    // Give time for the car model to load completely
                    setTimeout(() => {
                        // Initialize the road and ensure the scene is ready before starting the game
                        this.initializeRoad();
                        this.startGame();
                    }, 500);
                });
            } else {
                console.error("Invalid car data received");
                this.showLoading = false;
            }
        },

        loadCarModel(modelType, color, callback) {
            console.log("Loading car model:", modelType);
            if (!modelType) {
                console.error("No model type specified for loading car model");
                return;
            }

            if (!this.vehicleLoader) {
                console.log("Creating vehicle loader");
                this.vehicleLoader = new VehicleLoader();
            }

            this.vehicleLoader.loadVehicle(
                modelType,
                (model) => {
                    console.log("Car model loaded successfully");

                    // Store the car model reference
                    this.carModel = model;

                    // Apply color to the body parts
                    const colorHex = parseInt(color.replace('#', '0x'));

                    // Apply different materials to different parts
                    model.traverse(child => {
                        if (child.isMesh) {
                            const name = child.name.toLowerCase();

                            // Make wheels black
                            if (name.includes('wheel') || name.includes('tire')) {
                                const blackMaterial = new THREE.MeshStandardMaterial({
                                    color: 0x222222,
                                    roughness: 0.7,
                                    metalness: 0.5
                                });
                                child.material = blackMaterial;
                            }
                            // Make windows a translucent blue-black
                            else if (name.includes('window') || name.includes('glass') || name.includes('windshield')) {
                                const glassMaterial = new THREE.MeshPhysicalMaterial({
                                    color: 0x111a2b,
                                    roughness: 0.1,
                                    metalness: 0.9,
                                    transparent: true,
                                    opacity: 0.7,
                                    envMapIntensity: 1
                                });
                                child.material = glassMaterial;
                            }
                            // Apply car color to body parts
                            else {
                                this.vehicleLoader.setVehicleColor(child, colorHex);
                            }
                        }
                    });

                    // Add to scene
                    if (this.scene) {
                        this.scene.add(model);
                        console.log("Car model added to scene");

                        // Position the car correctly
                        model.position.set(0, 35, 0);

                        // Make sure car is visible
                        model.visible = true;

                        // Store in UI object for easier reference
                        if (!this.ui) this.ui = {};
                        this.ui.car = model;
                        console.log("Car model added to scene and UI updated");
                    } else {
                        console.error("Scene not available when adding car model");
                    }

                    if (callback) callback();
                },
                (xhr) => {
                    if (xhr.lengthComputable) {
                        const percentage = (xhr.loaded / xhr.total * 100);
                        console.log(`${percentage.toFixed(0)}% loaded`);
                    } else {
                        console.log(`${xhr.loaded} bytes loaded`);
                    }
                },
                (error) => {
                    console.error("Error loading car model:", error);
                    // Try to load a fallback model
                    if (modelType !== 'sedan') {
                        console.log("Attempting to load fallback model: sedan");
                        this.loadCarModel('sedan', '#f25346', callback);
                    } else if (callback) {
                        callback();
                    }
                }
            );
        },

        initializeRoad() {
            console.log("Initializing road");
            // Create road generator if it doesn't exist
            if (!this.roadGenerator) {
                console.log("Creating new road generator");
                this.roadGenerator = new RoadGenerator(this.scene);
            } else {
                // Check if reset method exists before trying to call it
                if (typeof this.roadGenerator.reset === 'function') {
                    console.log("Resetting existing road generator");
                    this.roadGenerator.reset();
                } else {
                    console.log("Reset method not available, creating new road generator");
                    // Remove old road generator and create a new one
                    if (this.roadGenerator.roadSegments) {
                        this.roadGenerator.roadSegments.forEach(segment => {
                            if (segment.mesh && this.scene) {
                                this.scene.remove(segment.mesh);
                            }
                        });
                    }
                    this.roadGenerator = new RoadGenerator(this.scene);
                }
            }

            // Make sure the initial road segments are generated
            if (!this.roadGenerator.roadSegments || this.roadGenerator.roadSegments.length === 0) {
                console.log("No road segments found, initializing road");
                this.roadGenerator.initRoad();
            }

            console.log(`Road initialized with ${this.roadGenerator.roadSegments.length} segments`);
        },

        startGame() {
            console.log("Starting game");
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

            // Make sure road has been initialized
            this.initializeRoad();

            // Position camera properly for game view
            if (this.camera) {
                console.log("Setting camera position for gameplay");
                // Position behind and above the car
                this.camera.position.set(0, 200, -400);
                this.camera.lookAt(new THREE.Vector3(100, 0, 0));

                if (this.ui && !this.ui.camera) {
                    this.ui.camera = this.camera;
                }
                console.log("Camera positioned at:", this.camera.position);
            }

            // Ensure the car is properly positioned and visible
            if (this.ui && this.ui.car) {
                console.log("Positioning car for gameplay");
                this.ui.car.position.set(0, 35, 0);
                this.ui.car.rotation.set(0, Math.PI / 2, 0); // Facing right (along x-axis)
                this.ui.car.visible = true;

                // Make sure it's added to the scene
                if (this.scene && !this.scene.children.includes(this.ui.car)) {
                    this.scene.add(this.ui.car);
                    console.log("Added car to scene");
                }
            } else if (this.carModel) {
                console.log("Using carModel as ui.car");
                if (!this.ui) this.ui = {};
                this.ui.car = this.carModel;
                this.ui.car.position.set(0, 35, 0);
                this.ui.car.rotation.set(0, Math.PI / 2, 0); // Facing right (along x-axis)
                this.ui.car.visible = true;

                // Make sure it's added to the scene
                if (this.scene && !this.scene.children.includes(this.ui.car)) {
                    this.scene.add(this.ui.car);
                    console.log("Added car to scene");
                }
            } else {
                console.warn("No car model available, using fallback");
                this.loadCarModel('sedan', '#ff0000', () => {
                    if (this.ui && this.ui.car) {
                        this.ui.car.position.set(0, 35, 0);
                        this.ui.car.rotation.set(0, Math.PI / 2, 0);
                        this.ui.car.visible = true;
                        console.log("Fallback car positioned at:", this.ui.car.position);
                    }
                });
            }

            // Perform a debug check of scene objects
            if (this.scene) {
                console.log("Scene contents:", this.scene.children.length, "objects");
                this.scene.children.forEach((child, index) => {
                    console.log(`Object ${index}:`, child.type, child.name || 'unnamed');
                });
            }

            // Reset all game variables
            this.difficultyLevel = 1;
            this.isBoosting = false;
            this.isShielded = false;
            this.hasMagnet = false;
            this.hasMultiplier = false;
            this.scoreMultiplier = 1;
            this.canBoost = true;

            // Set timestamp for game loop
            this.lastUpdateTime = Date.now();
            this.lastObstacleTime = Date.now();
            this.lastCoinTime = Date.now();
            this.lastPowerUpTime = Date.now();

            // Force a render to ensure everything is visible
            if (this.renderer && this.scene && this.camera) {
                console.log("Forcing initial render");
                this.renderer.render(this.scene, this.camera);
            }

            console.log("Game started successfully");
        },

        animate() {
            requestAnimationFrame(this.animate);
            // Update camera to follow car
            this.cameraPosition.x = this.carPosition.x - 100;
            this.cameraPosition.y = 50;
            this.cameraPosition.z = this.carPosition.z;
            this.updateCamera();
            // Render
            this.renderer.render(this.scene, this.camera);
        },
        updateGame(deltaTime) {
            // Update camera position
            this.updateCameraPosition();

            // Update car position
            this.updateCar(deltaTime);

            // Update road
            if (this.roadGenerator) {
                this.roadGenerator.update(this.ui.car.position);
            }

            // Update obstacles, collectibles, etc.
            this.updateObstacles(deltaTime);
            this.updateCollectibles(deltaTime);
            this.updatePowerUps(deltaTime);
            this.updateScore(deltaTime);

            // Animate car wheels if applicable
            if (this.ui && this.ui.car && typeof this.ui.car.animateWheels === 'function') {
                this.ui.car.animateWheels(this.gameSpeed * 0.5);
            }

            // Debug output on occasional frames
            if (this.frame % 300 === 0) {
                console.log("Game speed:", this.gameSpeed);
                console.log("Car position:", this.ui.car?.position);
                console.log("Road segments:", this.roadGenerator?.roadSegments?.length || 0);
            }
        },
        updateCar(delta) {
            if (!this.ui || !this.ui.car) return;
            
            // Move car forward
            this.ui.car.position.x += this.gameSpeed * delta * 100;
            
            // Handle input for lane changes
            if (this.keyState.ArrowLeft || this.keyState.KeyA) {
                // Move left
                this.targetLaneZ = Math.max(this.carLane - 1, -1) * 100;
                this.carLane = Math.max(this.carLane - 1, -1);
            }
            if (this.keyState.ArrowRight || this.keyState.KeyD) {
                // Move right
                this.targetLaneZ = Math.min(this.carLane + 1, 1) * 100;
                this.carLane = Math.min(this.carLane + 1, 1);
            }
            
            // Smoothly interpolate the car's position toward the target lane
            const currentZ = this.ui.car.position.z;
            const targetZ = this.targetLaneZ;
            const moveStep = this.laneChangeSpeed * delta * 60; 
            
            // Calculate new Z position with smooth interpolation
            let newZ;
            if (Math.abs(targetZ - currentZ) > moveStep) {
                newZ = currentZ + (targetZ > currentZ ? moveStep : -moveStep);
            } else {
                newZ = targetZ;
            }
            
            // Update car position
            this.ui.car.position.z = newZ;
            
            // Apply visual tilt when turning
            const tiltAngle = (targetZ - currentZ) * 0.001;
            this.ui.car.rotation.z += (tiltAngle - this.ui.car.rotation.z) * 0.1;
        },
        updateCamera() {
            this.camera.position.set(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z);
            this.camera.lookAt(0, 0, 0); // Adjust to car’s actual position if different
        },
        handleMouseMove(e) {
            // Convert mouse position to normalized coordinates (-1 to 1)
            const tx = -1 + (e.clientX / this.WIDTH) * 2;
            const ty = 1 - (e.clientY / this.HEIGHT) * 2;
            this.ui.mouse = { x: tx, y: ty };
        },

        handleKeyDown(event) {
            if (!this.keyState) this.keyState = {};

            // Prevent scrolling with arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
                event.preventDefault();
            }

            // Update key state
            this.keyState[event.code] = true;

            // Handle pausing with Escape key
            if (event.code === 'Escape') {
                this.togglePause();
            }
        },

        handleKeyUp(event) {
            if (!this.keyState) this.keyState = {};
            this.keyState[event.code] = false;
        },

        activateBoost() {
            if (!this.canBoost || this.isBoosting) return;

            console.log("Activating boost!");
            this.isBoosting = true;
            this.canBoost = false;

            // Play boost sound
            if (this.audioManager) {
                this.audioManager.playSound('boost');
            }

            // Add boost visual effect
            if (this.effectsManager) {
                this.effectsManager.createBoostEffect(this.ui.car.position);
            }

            // Update the boost end time for UI display
            this.boostEndTime = Date.now() + this.carBoostDuration;

            // Boost ends after duration
            setTimeout(() => {
                this.isBoosting = false;
                console.log("Boost ended");

                // Cooldown before next boost
                setTimeout(() => {
                    this.canBoost = true;
                    console.log("Boost ready");
                }, 5000);
            }, this.carBoostDuration);
        },

        // Mobile controls handlers
        onMoveLeft() {
            if (this.carLane > 0) {
                this.carLane--;
                console.log("Moving to lane", this.carLane);
            }
        },

        onMoveRight() {
            if (this.carLane < 2) {
                this.carLane++;
                console.log("Moving to lane", this.carLane);
            }
        },

        onStopMoving() {
            // Nothing to do here for this game
        },

        onActivateBoost() {
            this.activateBoost();
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
            if (this.$el && typeof this.$el.focus === 'function') {
                this.$el.focus();
            }
        },

        goToMainMenu() {
            this.gameStarted = false;
            this.gameOver = false;
            this.gamePaused = false;
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
            if (this.highway) {
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
            }

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
            if (this.$el && typeof this.$el.focus === 'function') {
                this.$el.focus();
            }
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

        updateCollectibles(deltaTime) {
            if (!this.collectibles || !this.ui || !this.ui.car) return;

            // Move existing collectibles
            for (let i = this.collectibles.length - 1; i >= 0; i--) {
                const collectible = this.collectibles[i];
                collectible.position.x -= this.gameSpeed * deltaTime * 100;

                // Check if the collectible is passed (behind the car)
                if (collectible.position.x < this.ui.car.position.x - 200) {
                    // Remove from scene and array
                    if (collectible.mesh && this.scene) {
                        this.scene.remove(collectible.mesh);
                    }
                    this.collectibles.splice(i, 1);
                    continue;
                }

                // Check for collision
                if (this.checkCollision(this.ui.car.position, collectible.position, 30)) {
                    // Collect it
                    this.coins++;
                    this.score += 10 * this.scoreMultiplier;

                    // Play sound effect
                    if (this.soundManager) {
                        this.soundManager.playSound('coin');
                    }

                    // Add visual effect
                    if (this.effectsManager) {
                        this.effectsManager.createCoinEffect(collectible.position);
                    }

                    // Remove from scene and array
                    if (collectible.mesh && this.scene) {
                        this.scene.remove(collectible.mesh);
                    }
                    this.collectibles.splice(i, 1);
                }
            }

            // Spawn new collectibles
            if (Math.random() < 0.02) {
                this.spawnCollectible();
            }
        },

        spawnCollectible() {
            if (!this.scene) return;

            // Create a coin mesh
            const geometry = new THREE.CylinderGeometry(15, 15, 5, 32);
            const material = new THREE.MeshStandardMaterial({
                color: 0xFFD700,
                metalness: 1,
                roughness: 0.3,
                emissive: 0xFFD700,
                emissiveIntensity: 0.2
            });
            const coinMesh = new THREE.Mesh(geometry, material);

            // Set rotation to face forward
            coinMesh.rotation.x = Math.PI / 2;

            // Position in front of car in one of three lanes
            const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
            const z = lane * 100;
            const x = this.ui.car.position.x + 1000 + Math.random() * 500;
            const y = 35;

            coinMesh.position.set(x, y, z);

            // Add to scene
            this.scene.add(coinMesh);

            // Add to collectibles array
            this.collectibles.push({
                mesh: coinMesh,
                position: coinMesh.position,
                type: 'coin'
            });
        },

        updateObstacles(deltaTime) {
            if (!this.obstacles || !this.ui || !this.ui.car) return;

            // Move existing obstacles
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obstacle = this.obstacles[i];
                obstacle.position.x -= this.gameSpeed * deltaTime * 100;

                // Check if the obstacle is passed (behind the car)
                if (obstacle.position.x < this.ui.car.position.x - 200) {
                    // Remove from scene and array
                    if (obstacle.mesh && this.scene) {
                        this.scene.remove(obstacle.mesh);
                    }
                    this.obstacles.splice(i, 1);
                    continue;
                }

                // Check for collision
                if (!this.isShielded && this.checkCollision(this.ui.car.position, obstacle.position, 50)) {
                    // Handle crash
                    this.handleCrash();
                    break;
                }
            }

            // Spawn new obstacles
            if (Math.random() < 0.005 + (this.gameSpeed * 0.001)) {
                this.spawnObstacle();
            }
        },

        spawnObstacle() {
            if (!this.scene) return;

            // Create an obstacle mesh (simple box for now)
            const geometry = new THREE.BoxGeometry(40, 30, 80);
            const material = new THREE.MeshStandardMaterial({
                color: Math.random() > 0.5 ? 0x333333 : 0x990000,
                metalness: 0.5,
                roughness: 0.7,
            });
            const obstacleMesh = new THREE.Mesh(geometry, material);

            // Position in front of car in one of three lanes
            const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
            const z = lane * 100;
            const x = this.ui.car.position.x + 1000 + Math.random() * 500;
            const y = 35;

            obstacleMesh.position.set(x, y, z);

            // Add to scene
            this.scene.add(obstacleMesh);

            // Add to obstacles array
            this.obstacles.push({
                mesh: obstacleMesh,
                position: obstacleMesh.position,
                type: 'car'
            });
        },

        updatePowerUps(deltaTime) {
            // Check if boost is active
            if (this.isBoosting) {
                // Create boost trail effect
                if (this.effectsManager && this.frame % 5 === 0) {
                    this.effectsManager.createBoostTrail(this.ui.car.position);
                }
            }

            // Handle shield timer
            if (this.isShielded) {
                // Count down shield time
                this.shieldTime -= deltaTime;
                if (this.shieldTime <= 0) {
                    this.isShielded = false;
                }
            }

            // Handle multiplier timer
            if (this.hasMultiplier) {
                // Count down multiplier time
                this.multiplierTime -= deltaTime;
                if (this.multiplierTime <= 0) {
                    this.hasMultiplier = false;
                    this.scoreMultiplier = 1;
                }
            }

            // Handle magnet timer
            if (this.hasMagnet) {
                // Count down magnet time
                this.magnetTime -= deltaTime;
                if (this.magnetTime <= 0) {
                    this.hasMagnet = false;
                }

                // Magnet pulls in coins
                if (this.collectibles) {
                    this.collectibles.forEach(collectible => {
                        if (collectible.type === 'coin') {
                            const distance = this.distance(this.ui.car.position, collectible.position);
                            if (distance < 200) {
                                // Pull the coin towards the car
                                const direction = new THREE.Vector3();
                                direction.subVectors(this.ui.car.position, collectible.position);
                                direction.normalize();
                                direction.multiplyScalar(200 * deltaTime);
                                collectible.position.add(direction);
                            }
                        }
                    });
                }
            }

            // Spawn power-ups
            if (Math.random() < 0.001) {
                this.spawnPowerUp();
            }
        },

        spawnPowerUp() {
            if (!this.scene) return;
            const powerUp = this.powerUpPool.createPowerUp('boost', 1, 500); // Lane 1 (middle, 0-based index)
            // Determine power-up type
            const types = ['boost', 'shield', 'magnet', 'multiplier'];
            const type = types[Math.floor(Math.random() * types.length)];
            let color;

            switch (type) {
                case 'boost':
                    color = 0xff5500; // Orange
                    break;
                case 'shield':
                    color = 0x00aaff; // Blue
                    break;
                case 'magnet':
                    color = 0xffaa00; // Amber
                    break;
                case 'multiplier':
                    color = 0x00ff00; // Green
                    break;
            }

            // Create a power-up mesh
            const geometry = new THREE.BoxGeometry(20, 20, 20);
            const material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.8,
                roughness: 0.2,
                emissive: color,
                emissiveIntensity: 0.5
            });
            const powerUpMesh = new THREE.Mesh(geometry, material);

            // Position in front of car in one of three lanes
            const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
            const z = lane * 100;
            const x = this.ui.car.position.x + 1000 + Math.random() * 500;
            const y = 35;

            powerUpMesh.position.set(x, y, z);

            // Add rotation animation
            powerUpMesh.userData.rotationSpeed = 0.02;
            powerUpMesh.userData.animate = true;

            // Add to scene
            this.scene.add(powerUpMesh);

            // Add to collectibles array
            this.collectibles.push({
                mesh: powerUpMesh,
                position: powerUpMesh.position,
                type: type
            });
        },

        updateScore(deltaTime) {
            // Increase score based on distance traveled
            this.score += Math.floor(this.gameSpeed * deltaTime * 10) * this.scoreMultiplier;

            // Update high score if needed
            if (this.score > this.highScore) {
                this.highScore = this.score;
                // Save to local storage
                try {
                    localStorage.setItem('carRacer_highScore', this.highScore);
                } catch (e) {
                    console.error("Could not save high score:", e);
                }
            }
        },

        handleCrash() {
            if (this.isShielded) {
                // Shield absorbs the crash
                this.isShielded = false;
                // Play shield break sound
                if (this.soundManager) {
                    this.soundManager.playSound('shield');
                }
                return;
            }

            // Game over
            this.gameOver = true;

            // Play crash sound
            if (this.soundManager) {
                this.soundManager.playSound('crash');
            }

            // Create explosion effect
            if (this.effectsManager) {
                this.effectsManager.createExplosionEffect(this.ui.car.position);
            }

            console.log("Game over! Final score:", this.score);
        },

        restartGame() {
            // Reset game state
            this.gameOver = false;
            this.score = 0;
            this.startGame();
        },

        exitGame() {
            // Return to car selection
            this.gameStarted = false;
            this.gameOver = false;

            // Clean up
            this.clearGameObjects();
        },

        togglePause() {
            this.gamePaused = !this.gamePaused;
        },

        resumeGame() {
            this.gamePaused = false;
            this.lastUpdateTime = Date.now(); // Reset time to avoid jump
        },

        // Helper functions
        checkCollision(pos1, pos2, threshold) {
            return this.distance(pos1, pos2) < threshold;
        },

        distance(pos1, pos2) {
            return Math.sqrt(
                Math.pow(pos1.x - pos2.x, 2) +
                Math.pow(pos1.y - pos2.y, 2) +
                Math.pow(pos1.z - pos2.z, 2)
            );
        },
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
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
}

.powerup {
    padding: 10px 15px;
    border-radius: 5px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
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