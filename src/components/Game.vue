<!-- src/components/Game.vue - Optimized version -->
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

            <!-- Performance mode toggle -->
            <div class="performance-settings">
                <button @click="togglePerformanceMode" class="performance-button">
                    Performance Mode: {{ performanceMode ? 'ON' : 'OFF' }}
                </button>
            </div>
        </div>

        <!-- Car Selection Screen -->
        <car-selection v-if="showingCarSelection" @car-selected="onCarSelected"></car-selection>

        <!-- Game UI -->
        <div v-if="gameStarted" class="game-ui">
            <div class="score-panel">
                <div class="score">Score: {{ score }}</div>
                <div class="coins">Coins: {{ coins }}</div>
                <div class="high-score">High Score: {{ highScore }}</div>
                <div class="difficulty-level">Level: {{ difficultyManager.getLevel() }}</div>

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

                <!-- Environment display -->
                <div class="environment-switcher">
                    <div class="current-env">{{ currentEnvironment }}</div>
                </div>

                <!-- Wanted level (police chase) -->
                <div v-if="policeChaseActive" class="wanted-level">
                    <div class="wanted-stars">
                        <span v-for="n in 5" :key="n" :class="{ active: n <= wantedLevel }">★</span>
                    </div>
                </div>
            </div>

            <!-- Pause Screen -->
            <div v-if="gamePaused" class="pause-screen">
                <h2>Game Paused</h2>
                <button @click="resumeGame">Resume</button>
                <button @click="restartGame">Restart</button>
                <button @click="goToMainMenu">Main Menu</button>

                <!-- Additional settings in pause menu -->
                <div class="pause-settings">
                    <div class="setting-row">
                        <label>Performance Mode</label>
                        <button @click="togglePerformanceMode">{{ performanceMode ? 'ON' : 'OFF' }}</button>
                    </div>
                    <div class="setting-row">
                        <label>Sound</label>
                        <button @click="toggleSound">{{ audioManager && audioManager.muted ? 'OFF' : 'ON' }}</button>
                    </div>
                    <div class="setting-row">
                        <label>Particle Effects</label>
                        <button @click="toggleParticleEffects">{{ particlesEnabled ? 'ON' : 'OFF' }}</button>
                    </div>
                </div>
            </div>

            <!-- Game Over Screen -->
            <div v-if="gameOver" class="game-over">
                <h2>Game Over!</h2>
                <p>Final Score: {{ score }}</p>
                <p v-if="score > highScore" class="new-high-score">New High Score!</p>

                <!-- Show player stats -->
                <div class="player-stats">
                    <p>Distance Traveled: {{ Math.floor(playerMetrics.distanceTraveled) }}m</p>
                    <p>Coins Collected: {{ playerMetrics.coinsCollected }}</p>
                    <p>Obstacles Avoided: {{ playerMetrics.obstaclesAvoided }}</p>
                    <p>Skill Rating: {{ Math.floor(playerMetrics.skillRating) }}/100</p>
                </div>

                <button @click="restartGame">Play Again</button>
                <button @click="goToMainMenu">Main Menu</button>
            </div>
        </div>

        <!-- Enhanced Mobile Controls -->
        <enhanced-mobile-controls v-if="gameStarted && !gameOver && !gamePaused" :paused="gamePaused"
            :boost-available="canBoost" :boost-cooldown-percent="boostCooldownPercent" :is-boost-active="isBoosting"
            :has-shield="isShielded" :is-shield-active="isShieldActive"
            :sound-muted="audioManager && audioManager.muted" @move-left="onMoveLeft" @move-right="onMoveRight"
            @stop-moving="onStopMoving" @activate-boost="onActivateBoost" @activate-shield="onActivateShield"
            @toggle-pause="pauseGame" @toggle-sound="toggleSound">
        </enhanced-mobile-controls>

        <!-- Three.js Canvas -->
        <div ref="threeContainer" class="three-container"></div>

        <!-- FPS Counter (only visible in development mode) -->
        <div v-if="showFpsCounter" class="fps-counter">{{ fps }} FPS</div>
    </div>
</template>

<script>
// Import core dependencies
import * as THREE from 'three';

// Import game components
import Car from './Car';
import Highway from './Highway';
import { Colors } from './common';
import AudioManager from './AudioManager';
import EnvironmentManager from './EnvironmentManager';
import CarSelection from './CarSelection';

// Import optimized components
import EnhancedMobileControls from './EnhancedMobileControls';
import AssetLoader from './AssetLoader';
import ResourceManager from './ResourceManager';
import ParticleSystem from './ParticleSystem';
import PhysicsSystem from './PhysicsSystem';
import { CollisionBox } from './PhysicsSystem';
import DifficultyManager from './DifficultyManager';
import InstancedRoad from './InstancedRoad';

// Import object pools
import CoinPool from './pools/CoinPool';
import ObstaclePool from './pools/ObstaclePool';
import PowerUpPool from './pools/PowerUpPool';

export default {
    name: 'Game',

    components: {
        CarSelection,
        EnhancedMobileControls
    },

    data() {
        return {
            // Core game state
            gameStarted: false,
            gameOver: false,
            gamePaused: false,
            showingCarSelection: false,
            score: 0,
            coins: 0,
            highScore: 0,

            // Three.js core objects
            scene: null,
            camera: null,
            renderer: null,
            clock: null,

            // Game components
            car: null,
            carModel: null,
            audioManager: null,
            environmentManager: null,
            assetLoader: null,
            resourceManager: null,
            particleSystem: null,
            physicsSystem: null,
            difficultyManager: null,

            // Optimized road using instanced meshes
            instancedRoad: null,

            // Object pools
            coinPool: null,
            obstaclePool: null,
            powerUpPool: null,

            // Game settings
            WIDTH: window.innerWidth,
            HEIGHT: window.innerHeight,
            gameSpeed: 2,
            lastUpdateTime: 0,

            // Player state
            carLane: 1, // 0, 1, 2 for left, center, right
            laneChangeSpeed: 0.1, // speed of lane change
            targetLaneZ: 0, // target Z position for current lane
            playerMetrics: {},

            // Input state
            keyState: {
                ArrowLeft: false,
                ArrowRight: false,
                ArrowUp: false,
                ArrowDown: false,
                Space: false
            },
            mouse: { x: 0, y: 0 },

            // Environment state
            currentEnvironment: 'Day',
            environments: ['Day', 'Night', 'Sunset', 'Rain', 'Snow', 'Desert'],
            lastEnvironmentChangeTime: 0,
            environmentDuration: 30000, // 30 seconds per environment

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
            boostCooldownPercent: 100,
            isShieldActive: false,

            // Police chase state
            policeChaseActive: false,
            wantedLevel: 0,

            // Performance monitoring
            fps: 0,
            frameCount: 0,
            lastFpsUpdate: 0,
            showFpsCounter: process.env.NODE_ENV === 'development',

            // Performance mode
            performanceMode: false,
            particlesEnabled: true,

            // Animation frame request ID for cancellation
            animationFrameId: null
        };
    },

    computed: {
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
        // Load high score from localStorage
        const savedHighScore = localStorage.getItem('carRacerHighScore');
        if (savedHighScore) {
            this.highScore = parseInt(savedHighScore);
        }

        // Create resource manager
        this.resourceManager = new ResourceManager();

        // Create clock for timing
        this.clock = new THREE.Clock();

        // Initialize difficulty manager
        this.difficultyManager = new DifficultyManager();

        // Check performance mode preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.performanceMode = localStorage.getItem('performanceMode') === 'true' || prefersReducedMotion;
        this.particlesEnabled = localStorage.getItem('particlesEnabled') !== 'false';
    },

    mounted() {
        // Initialize the core Three.js components
        this.initThreeJs();

        // Initialize audio manager
        this.audioManager = new AudioManager();
        this.audioManager.init();

        // Initialize asset loader
        this.assetLoader = AssetLoader.getInstance();

        // Initialize physics system
        this.physicsSystem = new PhysicsSystem();

        // Initialize pools after scene is created
        this.coinPool = new CoinPool(this.scene);
        this.obstaclePool = new ObstaclePool(this.scene);
        this.powerUpPool = new PowerUpPool(this.scene);

        // Track game objects for cleanup
        this.trackResourcesForCleanup();

        // Make div focusable for keyboard controls
        if (this.$el && typeof this.$el.focus === 'function') {
            this.$el.focus();
        }

        // Add window event listeners
        this.addWindowEventListeners();

        // Set current timestamp for delta time calculation
        this.lastUpdateTime = Date.now();

        // Initialize FPS counter
        this.lastFpsUpdate = Date.now();
    },

    beforeDestroy() {
        // Cancel animation frame to stop the game loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // Remove window event listeners
        this.removeWindowEventListeners();

        // Dispose of all resources
        this.cleanupResources();
    },

    methods: {
        // Initialize Three.js
        initThreeJs() {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.FogExp2(0xf7d9aa, 0.002);

            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                60,
                this.WIDTH / this.HEIGHT,
                1,
                10000
            );
            this.camera.position.set(-150, 100, 0);
            this.camera.lookAt(0, 0, 0);

            // Create renderer
            this.renderer = new THREE.WebGLRenderer({
                antialias: !this.performanceMode,
                powerPreference: 'high-performance',
                alpha: true
            });
            this.renderer.setSize(this.WIDTH, this.HEIGHT);
            this.renderer.setPixelRatio(window.devicePixelRatio > 1 && !this.performanceMode ? 2 : 1);
            this.renderer.shadowMap.enabled = !this.performanceMode;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Add renderer to DOM
            const container = this.$refs.threeContainer;
            container.appendChild(this.renderer.domElement);

            // Create lights
            this.addLights();

            // Initialize environment manager
            this.environmentManager = new EnvironmentManager(this.scene);

            // Initialize particle system
            this.particleSystem = new ParticleSystem(this.scene);

            // Initialize instanced road
            this.instancedRoad = new InstancedRoad(this.scene);

            // Track core Three.js objects for cleanup
            this.resourceManager.trackRenderer(this.renderer);
            this.resourceManager.setScene(this.scene);
        },

        // Add lights to the scene
        addLights() {
            // Ambient light for overall illumination
            const ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);
            this.scene.add(ambientLight);

            // Hemisphere light for sky/ground color gradient
            const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
            this.scene.add(hemisphereLight);

            // Directional light for shadows
            const shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
            shadowLight.position.set(150, 350, 350);

            // Only enable shadows in normal mode (not performance mode)
            if (!this.performanceMode) {
                shadowLight.castShadow = true;
                shadowLight.shadow.camera.left = -400;
                shadowLight.shadow.camera.right = 400;
                shadowLight.shadow.camera.top = 400;
                shadowLight.shadow.camera.bottom = -400;
                shadowLight.shadow.camera.near = 1;
                shadowLight.shadow.camera.far = 1000;
                shadowLight.shadow.mapSize.width = 2048;
                shadowLight.shadow.mapSize.height = 2048;
            }

            this.scene.add(shadowLight);

            // Track lights for cleanup
            this.resourceManager.trackMesh(ambientLight);
            this.resourceManager.trackMesh(hemisphereLight);
            this.resourceManager.trackMesh(shadowLight);
        },

        // Add window event listeners
        addWindowEventListeners() {
            window.addEventListener('resize', this.handleResize);

            // Listen for visibility change to pause the game when tab is not active
            document.addEventListener('visibilitychange', this.handleVisibilityChange);

            // Listen for device orientation change on mobile
            window.addEventListener('orientationchange', this.handleOrientationChange);

            // Track listeners for cleanup
            this.resourceManager.trackEventListener(window, 'resize', this.handleResize);
            this.resourceManager.trackEventListener(document, 'visibilitychange', this.handleVisibilityChange);
            this.resourceManager.trackEventListener(window, 'orientationchange', this.handleOrientationChange);
        },

        // Remove window event listeners
        removeWindowEventListeners() {
            window.removeEventListener('resize', this.handleResize);
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            window.removeEventListener('orientationchange', this.handleOrientationChange);
        },

        // Track resources for cleanup
        trackResourcesForCleanup() {
            // Track primary game systems
            this.resourceManager.trackCustom(this.audioManager, (resource) => {
                if (resource) {
                    Object.values(resource.sounds).forEach(sound => {
                        if (sound.audio) {
                            sound.audio.pause();
                            sound.audio.src = '';
                        }
                    });
                }
            });

            this.resourceManager.trackCustom(this.environmentManager, (resource) => {
                if (resource && resource.dispose) resource.dispose();
            });

            this.resourceManager.trackCustom(this.particleSystem, (resource) => {
                if (resource && resource.dispose) resource.dispose();
            });

            // Track object pools
            this.resourceManager.trackPool(this.coinPool);
            this.resourceManager.trackPool(this.obstaclePool);
            this.resourceManager.trackPool(this.powerUpPool);

            // Track the instanced road
            this.resourceManager.trackCustom(this.instancedRoad, (resource) => {
                if (resource && resource.dispose) resource.dispose();
            });

            // Track physics system
            this.resourceManager.trackCustom(this.physicsSystem, (resource) => {
                if (resource && resource.dispose) resource.dispose(this.scene);
            });
        },

        // Clean up all resources
        cleanupResources() {
            // Cancel any pending animation frame
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }

            // Dispose of all tracked resources
            this.resourceManager.disposeAll();

            console.log('All game resources cleaned up');
        },

        // Main game loop
        gameLoop() {
            // Request next frame first to ensure smooth animation
            this.animationFrameId = requestAnimationFrame(this.gameLoop);

            // Skip if game is over or paused
            if (this.gameOver || this.gamePaused || !this.gameStarted) return;

            // Calculate delta time for time-based updates
            const now = Date.now();
            const deltaTime = Math.min(0.1, (now - this.lastUpdateTime) / 1000); // Cap at 100ms to prevent large jumps
            this.lastUpdateTime = now;

            // Update FPS counter
            this.updateFpsCounter();

            // Update difficulty level and game settings
            const difficultySettings = this.difficultyManager.update(this.score, this.gameSpeed, deltaTime);
            this.gameSpeed = difficultySettings.gameSpeed;

            // Update environment based on time and difficulty
            this.updateEnvironment(difficultySettings.environmentChangeInterval);

            // Update player car position
            this.updateCarPosition(deltaTime);

            // Update physics system
            this.updatePhysics();

            // Update object pools
            this.updatePools();

            // Spawn new game objects
            this.spawnGameObjects(difficultySettings);

            // Update power-up states
            this.updatePowerUpStates();

            // Update camera
            this.updateCamera(deltaTime);

            // Update instanced road
            this.instancedRoad.update(this.gameSpeed * deltaTime * 60);

            // Update particle effects
            if (this.particlesEnabled) {
                this.particleSystem.update();
            }

            // Update environment effects
            this.environmentManager.update();

            // Render the scene
            this.renderer.render(this.scene, this.camera);
        },

        // Update FPS counter
        updateFpsCounter() {
            this.frameCount++;

            const now = Date.now();
            const elapsed = now - this.lastFpsUpdate;

            if (elapsed >= 1000) { // Update every second
                this.fps = Math.round((this.frameCount * 1000) / elapsed);
                this.frameCount = 0;
                this.lastFpsUpdate = now;
            }
        },

        // Update car position based on input
        updateCarPosition(deltaTime) {
            // Handle lane changes
            if (this.keyState.ArrowLeft && this.carLane > 0) {
                this.carLane--;
                this.targetLaneZ = (this.carLane - 1) * 100;
                this.keyState.ArrowLeft = false; // prevent continuous lane changes

                // Record lane switch for difficulty adjustment
                this.difficultyManager.recordLaneSwitch();
            }
            else if (this.keyState.ArrowRight && this.carLane < 2) {
                this.carLane++;
                this.targetLaneZ = (this.carLane - 1) * 100;
                this.keyState.ArrowRight = false; // prevent continuous lane changes

                // Record lane switch for difficulty adjustment
                this.difficultyManager.recordLaneSwitch();
            }

            // Get the current car physics entity
            const playerEntity = this.physicsSystem.entities.player[0];
            if (!playerEntity) return;

            // Smoothly move car towards target lane
            const diff = this.targetLaneZ - playerEntity.position.z;
            if (Math.abs(diff) > 1) {
                const moveAmount = diff * this.laneChangeSpeed * this.carTurnSpeed * deltaTime * 60;
                playerEntity.position.z += moveAmount;

                // Tilt the car during lane change
                if (this.car && this.car.mesh) {
                    this.car.mesh.rotation.z = -diff * 0.002;
                }
            } else {
                if (this.car && this.car.mesh) {
                    this.car.mesh.rotation.z = 0;
                }
            }

            // Add subtle car movement for realism
            if (this.car && this.car.mesh) {
                this.car.mesh.position.y = 30 + Math.sin(this.difficultyManager.playerMetrics.distanceTraveled * 0.02) * 0.5;
            }

            // Update player physics entity position
            if (this.car && this.car.mesh) {
                playerEntity.update(this.car.mesh.position);
            }

            // Update car animation if it has an update method
            if (this.car && this.car.driver && typeof this.car.driver.updateHairs === 'function') {
                this.car.driver.updateHairs();
            }

            // If boosting, add trail effect
            if (this.isBoosting && this.particlesEnabled) {
                // Create boost trail particles
                const position = new THREE.Vector3();
                if (this.car && this.car.mesh) {
                    position.copy(this.car.mesh.position);
                    position.x -= 40; // Behind car
                }

                if (!this.boostEffect) {
                    this.boostEffect = this.particleSystem.createBoostEffect(position);
                } else {
                    // Update existing boost effect position
                    this.boostEffect.setPosition(position);
                }
            } else if (this.boostEffect) {
                // Stop boost effect
                this.boostEffect.stop();
                this.boostEffect = null;
            }
        },

        // Update physics system
        updatePhysics() {
            // Run physics update to detect collisions
            this.physicsSystem.update();

            // Check for collisions
            if (this.physicsSystem.isPlayerCollidingWithObstacles()) {
                // Check if shield or immunity is active
                if (this.isShielded) {
                    // Shield absorbs the hit
                    this.audioManager.play('boost'); // Play shield hit sound
                    this.isShielded = false;
                    this.shieldEndTime = 0;
                    this.isShieldActive = false;

                    // Create shield break effect
                    if (this.car && this.car.mesh && this.particlesEnabled) {
                        const position = new THREE.Vector3();
                        position.copy(this.car.mesh.position);
                        this.particleSystem.createExplosion(position, {
                            particleColor: new THREE.Color(0x4d88ff), // Blue
                            particleCount: 50
                        });
                    }
                } else {
                    // Game over
                    this.audioManager.play('crash');

                    // Create explosion effect
                    if (this.car && this.car.mesh && this.particlesEnabled) {
                        const position = new THREE.Vector3();
                        position.copy(this.car.mesh.position);
                        this.particleSystem.createExplosion(position);
                    }

                    // Record collision
                    this.difficultyManager.recordCollision();

                    this.endGame();
                }
            }

            // Check for near misses
            // TODO: Implement near miss detection for advanced difficulty adjustment

            // Get power-up collisions
            const powerUpCollisions = this.physicsSystem.getPlayerPowerupCollisions();
            if (powerUpCollisions.length > 0) {
                // Get the first power-up collision
                const powerUpEntity = powerUpCollisions[0].entityA.type === 'powerup' ?
                    powerUpCollisions[0].entityA : powerUpCollisions[0].entityB;

                // Get the power-up type from user data
                const powerUpType = powerUpEntity.mesh.userData.type;

                // Activate the power-up
                this.activatePowerUp(powerUpType);

                // Play sound
                this.audioManager.play('boost');

                // Remove the power-up entity
                this.physicsSystem.removeEntity(powerUpEntity);
            }

            // Get coin collisions
            const coinCollisions = this.physicsSystem.getPlayerCoinCollisions();
            if (coinCollisions.length > 0) {
                // Update coin count
                this.coins += coinCollisions.length;

                // Record coins for difficulty system
                for (let i = 0; i < coinCollisions.length; i++) {
                    this.difficultyManager.recordCoinCollected();
                }

                // Play coin sound
                this.audioManager.play('coin');

                // Create coin collection effects
                if (this.particlesEnabled) {
                    coinCollisions.forEach(collision => {
                        const coinEntity = collision.entityA.type === 'coin' ?
                            collision.entityA : collision.entityB;

                        // Create effect at coin position
                        const position = new THREE.Vector3();
                        position.copy(coinEntity.position);
                        this.particleSystem.createCoinEffect(position);

                        // Remove the coin entity
                        this.physicsSystem.removeEntity(coinEntity);
                    });
                }

                // Add bonus score for coins
                this.score += coinCollisions.length * 5 * this.scoreMultiplier;
            }
        },

        // Update object pools
        updatePools() {
            // Update active objects in pools
            this.coinPool.update(this.gameSpeed);
            this.obstaclePool.update(this.gameSpeed);
            this.powerUpPool.update(this.gameSpeed);
        },

        // Spawn new game objects based on difficulty
        spawnGameObjects(difficultySettings) {
            const now = Date.now();

            // Spawn obstacles
            if (this.obstaclePool.getActiveObstacleCount() < difficultySettings.maxObstaclesOnScreen &&
                Math.random() < difficultySettings.obstacleSpawnRate) {

                // Determine which lane to spawn in (0, 1, 2)
                const lane = Math.floor(Math.random() * 3);

                // Weighted random selection of obstacle type
                const typeRand = Math.random();
                let type;

                if (typeRand < 0.6) {
                    type = 'car'; // 60% chance
                } else if (typeRand < 0.9) {
                    type = 'truck'; // 30% chance
                } else {
                    type = 'motorbike'; // 10% chance
                }

                // Create the obstacle
                const obstacle = this.obstaclePool.createObstacle(type, lane, 1000);

                // Add to physics system
                if (obstacle && obstacle.mesh) {
                    const boundingBox = new CollisionBox(
                        type === 'truck' ? 100 : (type === 'motorbike' ? 50 : 60), // width
                        type === 'truck' ? 30 : (type === 'motorbike' ? 20 : 40), // depth
                        type === 'truck' ? 40 : (type === 'motorbike' ? 30 : 25) // height
                    );

                    this.physicsSystem.createObstacleEntity(boundingBox, obstacle.mesh);
                }

                // Record obstacle spawn for difficulty adjustment
                this.difficultyManager.recordObstacleAvoided();
            }

            // Spawn coins
            if (Math.random() < difficultySettings.coinSpawnRate) {
                // Determine which lane to spawn in (0, 1, 2)
                const lane = Math.floor(Math.random() * 3);

                // Sometimes spawn a series of coins in the same lane
                const coinCount = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 3 : 1;

                for (let i = 0; i < coinCount; i++) {
                    // Create the coin
                    const coin = this.coinPool.createCoin(1000 + (i * 50), lane);

                    // Add to physics system
                    if (coin && coin.mesh) {
                        const boundingBox = new CollisionBox(30, 30, 10);
                        this.physicsSystem.createCoinEntity(boundingBox, coin.mesh);
                    }
                }
            }

            // Spawn power-ups
            if (Math.random() < difficultySettings.powerUpSpawnRate) {
                // Determine which lane to spawn in (0, 1, 2)
                const lane = Math.floor(Math.random() * 3);

                // Determine what type of power-up to spawn
                const types = ['boost', 'shield', 'magnet', 'multiplier'];
                const randomType = types[Math.floor(Math.random() * types.length)];

                // Create the power-up
                const powerUp = this.powerUpPool.createPowerUp(randomType, lane, 1000);

                // Add to physics system
                if (powerUp && powerUp.mesh) {
                    const boundingBox = new CollisionBox(30, 30, 30);
                    const entity = this.physicsSystem.createPowerupEntity(boundingBox, powerUp.mesh);

                    // Store the power-up type in the mesh's userData
                    powerUp.mesh.userData.type = randomType;

                    // Store reference in entity
                    if (entity) {
                        entity.powerUpType = randomType;
                    }
                }
            }

            // Handle police chases based on difficulty
            // TODO: Implement police chase system based on difficultySettings.policeChaseChance
        },

        // Update power-up states
        updatePowerUpStates() {
            const now = Date.now();

            // Check boost state
            if (this.isBoosting && now > this.boostEndTime) {
                this.isBoosting = false;
                this.gameSpeed /= this.carBoostMultiplier;

                // Stop boost particle effect
                if (this.boostEffect) {
                    this.boostEffect.stop();
                    this.boostEffect = null;
                }

                // Update audio
                this.audioManager.setVolume('engine', 0.5);
            }

            // Update boost cooldown percentage
            if (!this.canBoost) {
                const cooldownTime = this.carBoostDuration + 2000; // 2s cooldown after boost
                const elapsedTime = now - (this.boostEndTime - this.carBoostDuration);
                this.boostCooldownPercent = Math.min(100, (elapsedTime / cooldownTime) * 100);

                // Reset cooldown when complete
                if (this.boostCooldownPercent >= 100) {
                    this.canBoost = true;
                }
            } else {
                this.boostCooldownPercent = 100;
            }

            // Check shield state
            if (this.isShielded && now > this.shieldEndTime) {
                this.isShielded = false;
                this.isShieldActive = false;
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

        // Update camera position
        updateCamera(deltaTime) {
            // Update camera position based on mouse movement
            const targetFOV = 40 + (this.mouse.x + 1) * 10; // 40-60 FOV range
            this.camera.fov += (targetFOV - this.camera.fov) * 0.05;
            this.camera.updateProjectionMatrix();

            // Adjust camera position slightly based on mouse for more dynamic feel
            const targetCameraX = -150 + this.mouse.x * 10;
            this.camera.position.x += (targetCameraX - this.camera.position.x) * 0.02;

            // Camera shaking during boost
            if (this.isBoosting && !this.performanceMode) {
                const shakeAmount = 0.3;
                this.camera.position.y += (Math.random() - 0.5) * shakeAmount;
                this.camera.position.z += (Math.random() - 0.5) * shakeAmount;
            }
        },

        // Update environment based on time
        updateEnvironment(changeInterval) {
            const now = Date.now();

            // Check if it's time to change the environment
            if (now - this.lastEnvironmentChangeTime > changeInterval) {
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

        // Set the environment
        setEnvironment(environment) {
            if (!this.environments.includes(environment)) return;

            // Set the current environment
            this.currentEnvironment = environment;

            // Map to theme name in environment manager
            const environmentMap = {
                'Day': 'day',
                'Night': 'night',
                'Sunset': 'sunset',
                'Rain': 'rain',
                'Snow': 'snow',
                'Desert': 'desert'
            };

            const themeName = environmentMap[environment];
            this.environmentManager.setTheme(themeName);

            // Create weather particle effects if enabled
            if (this.particlesEnabled && !this.performanceMode) {
                // Clear any existing weather effects
                if (this.weatherEffect) {
                    this.weatherEffect.stop();
                    this.weatherEffect = null;
                }

                // Add new weather effects
                if (environment === 'Rain') {
                    this.weatherEffect = this.particleSystem.createRainEffect(this.camera.position);
                } else if (environment === 'Snow') {
                    this.weatherEffect = this.particleSystem.createSnowEffect(this.camera.position);
                }
            }
        },

        // Activate a power-up
        activatePowerUp(type) {
            const now = Date.now();

            switch (type) {
                case 'boost':
                    this.activateBoost();
                    break;
                case 'shield':
                    this.isShielded = true;
                    this.isShieldActive = true;
                    this.shieldEndTime = now + 5000; // 5 seconds

                    // Visual shield effect
                    if (this.car && this.car.mesh && this.particlesEnabled) {
                        this.particleSystem.createShieldEffect(this.car.mesh.position);
                    }
                    break;
                case 'magnet':
                    this.hasMagnet = true;
                    this.magnetEndTime = now + 8000; // 8 seconds
                    // Visual effect for magnet
                    break;
                case 'multiplier':
                    this.hasMultiplier = true;
                    this.scoreMultiplier = 2;
                    this.multiplierEndTime = now + 10000; // 10 seconds
                    // Visual effect for multiplier
                    break;
            }
        },

        // Activate boost
        activateBoost() {
            if (!this.canBoost) return;

            const now = Date.now();

            // Activate boost
            this.isBoosting = true;
            this.boostEndTime = now + this.carBoostDuration;

            // Temporarily increase the game speed
            this.gameSpeed *= this.carBoostMultiplier;

            // Record boost usage for difficulty adjustment
            this.difficultyManager.recordBoostUsage();

            // Play boost sound
            this.audioManager.play('boost');

            // Engine sound effect louder during boost
            this.audioManager.setVolume('engine', 0.8);

            // Set cooldown
            this.canBoost = false;
            this.boostCooldownPercent = 0;

            // Create boost effect
            if (this.car && this.car.mesh && this.particlesEnabled) {
                const position = new THREE.Vector3();
                position.copy(this.car.mesh.position);
                position.x -= 40; // Behind car

                this.boostEffect = this.particleSystem.createBoostEffect(position);
            }
        },

        // Handle shield activation
        onActivateShield() {
            // This would be triggered by the mobile controls
            // No implementation needed if shields are automatically activated on pickup
        },

        // Setup player car after selection
        setupPlayerCar() {
            // Create car instance
            this.car = new Car(this.carType);
            this.scene.add(this.car.mesh);

            // Add car to physics system
            const playerBox = new CollisionBox(80, 50, 30);
            const playerEntity = this.physicsSystem.createPlayerEntity(playerBox, this.car.mesh);

            // Set initial position
            this.car.mesh.position.set(0, 30, 0);
            playerEntity.update(this.car.mesh.position);

            // Track for cleanup
            this.resourceManager.trackMesh(this.car.mesh);
        },

        // Handle mouse movement
        handleMouseMove(e) {
            // Convert mouse position to normalized coordinates (-1 to 1)
            const tx = -1 + (e.clientX / this.WIDTH) * 2;
            const ty = 1 - (e.clientY / this.HEIGHT) * 2;
            this.mouse = { x: tx, y: ty };
        },

        // Handle keyboard input
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

        // Handle key release
        handleKeyUp(e) {
            // Track key state
            if (e.code in this.keyState) {
                this.keyState[e.code] = false;
            }
        },

        // Handle window resize
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

        // Handle visibility change (pause when tab is inactive)
        handleVisibilityChange() {
            if (document.hidden && this.gameStarted && !this.gameOver) {
                this.pauseGame();
            }
        },

        // Handle orientation change
        handleOrientationChange() {
            // Pause game during orientation change on mobile
            if (this.gameStarted && !this.gameOver) {
                this.pauseGame();
            }

            // Resize after orientation change
            setTimeout(this.handleResize, 300);
        },

        // Mobile controls handlers
        onMoveLeft() {
            if (this.carLane > 0) {
                this.carLane--;
                this.targetLaneZ = (this.carLane - 1) * 100;

                // Record lane switch for difficulty adjustment
                this.difficultyManager.recordLaneSwitch();
            }
        },

        onMoveRight() {
            if (this.carLane < 2) {
                this.carLane++;
                this.targetLaneZ = (this.carLane - 1) * 100;

                // Record lane switch for difficulty adjustment
                this.difficultyManager.recordLaneSwitch();
            }
        },

        onStopMoving() {
            // Nothing to do here for this game
        },

        onActivateBoost() {
            this.activateBoost();
        },

        // Show car selection screen
        showCarSelection() {
            this.showingCarSelection = true;
        },

        // Handle car selection
        onCarSelected(carData) {
            console.log("onCarSelected called with data:", carData);

            // Store car data
            this.selectedCar = carData;
            this.carType = carData.modelType;
            this.carBoostDuration = carData.boostDuration;
            this.carBoostMultiplier = carData.boostMultiplier;
            this.carTurnSpeed = carData.turnSpeed;
            this.carCoinRadius = carData.coinCollectionRadius || 1;

            // Important: Hide the car selection screen first
            this.showingCarSelection = false;

            // Add a small delay before starting the game to ensure UI updates
            setTimeout(() => {
                // Start the game
                this.startGame();

                // Debug logging for state after starting
                console.log("Game started. Game state:", {
                    gameStarted: this.gameStarted,
                    gameOver: this.gameOver,
                    gamePaused: this.gamePaused,
                    showingCarSelection: this.showingCarSelection
                });
            }, 50);
        },

        // Start the game
        startGame() {
            this.gameStarted = true;
            this.gameOver = false;
            this.gamePaused = false;

            // Initialize or reset game state
            this.score = 0;
            this.coins = 0;
            this.gameSpeed = 2;
            this.carLane = 1;
            this.targetLaneZ = 0;

            // Reset power-up states
            this.isBoosting = false;
            this.isShielded = false;
            this.hasMagnet = false;
            this.hasMultiplier = false;
            this.scoreMultiplier = 1;
            this.canBoost = true;
            this.boostCooldownPercent = 100;

            // Reset environment
            this.setEnvironment('Day');
            this.lastEnvironmentChangeTime = Date.now();

            // Setup player car
            this.setupPlayerCar();

            // Start difficulty manager
            this.difficultyManager.start();
            this.playerMetrics = this.difficultyManager.getMetrics();

            // Initialize the audio
            if (!this.audioManager.initialized) {
                this.audioManager.init();
            }

            // Start background music/engine sound
            this.audioManager.play('engine');
            this.audioManager.setVolume('engine', 0.5);

            // Start animation loop
            this.lastUpdateTime = Date.now();
            if (!this.animationFrameId) {
                this.animationFrameId = requestAnimationFrame(this.gameLoop);
            }

            // Make sure game area has focus for keyboard controls
            if (this.$el && typeof this.$el.focus === 'function') {
                this.$el.focus();
            }
        },

        // Pause the game
        pauseGame() {
            if (this.gameStarted && !this.gameOver) {
                this.gamePaused = !this.gamePaused;

                if (this.gamePaused) {
                    // Pause engine sound
                    this.audioManager.stop('engine');

                    // Pause difficulty manager
                    this.difficultyManager.pause();
                } else {
                    // Resume engine sound
                    this.audioManager.play('engine');

                    // Resume difficulty manager
                    this.difficultyManager.resume();

                    // Update last update time to prevent large delta
                    this.lastUpdateTime = Date.now();

                    this.$el.focus();
                }
            }
        },

        // Resume game
        resumeGame() {
            this.gamePaused = false;
            this.audioManager.play('engine');
            this.difficultyManager.resume();
            this.lastUpdateTime = Date.now();
            this.$el.focus();
        },

        // Return to main menu
        goToMainMenu() {
            this.gameStarted = false;
            this.gameOver = false;
            this.gamePaused = false;
            this.showingCarSelection = false;

            // Stop audio
            this.audioManager.stop('engine');

            // Clean up game objects
            this.cleanupGameObjects();
        },

        // Restart the game
        restartGame() {
            // Clean up existing game objects
            this.cleanupGameObjects();

            // Start fresh
            this.startGame();
        },

        // Clean up game objects for restart/menu
        cleanupGameObjects() {
            // Clear physics entities
            if (this.physicsSystem) {
                this.physicsSystem.reset();
            }

            // Clear particles
            if (this.particleSystem) {
                this.particleSystem.clearAll();
            }

            // Clear all object pools
            if (this.coinPool) this.coinPool.dispose();
            if (this.obstaclePool) this.obstaclePool.dispose();
            if (this.powerUpPool) this.powerUpPool.dispose();

            // Remove car from scene
            if (this.car && this.car.mesh) {
                this.scene.remove(this.car.mesh);
                this.car = null;
            }

            // Clear boost effect
            if (this.boostEffect) {
                this.boostEffect.stop();
                this.boostEffect = null;
            }

            // Clear weather effect
            if (this.weatherEffect) {
                this.weatherEffect.stop();
                this.weatherEffect = null;
            }
        },

        // End the game
        endGame() {
            this.gameOver = true;

            // Stop engine sound
            this.audioManager.stop('engine');

            // Play crash sound
            this.audioManager.play('crash');

            // Get final player metrics
            this.playerMetrics = this.difficultyManager.getMetrics();

            // Update high score if needed
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('carRacerHighScore', this.score);
            }
        },

        // Toggle sound
        toggleSound() {
            if (this.audioManager) {
                const muted = this.audioManager.toggleMute();
                if (!muted && this.gameStarted && !this.gamePaused) {
                    this.audioManager.play('engine');
                }
            }
        },

        // Toggle performance mode
        togglePerformanceMode() {
            this.performanceMode = !this.performanceMode;
            localStorage.setItem('performanceMode', this.performanceMode);

            // Apply performance settings
            if (this.renderer) {
                this.renderer.setPixelRatio(window.devicePixelRatio > 1 && !this.performanceMode ? 2 : 1);
                this.renderer.shadowMap.enabled = !this.performanceMode;
            }

            // Require restart for full effect
            if (this.gameStarted) {
                alert('Performance settings will fully apply after restarting the game.');
            }
        },

        // Toggle particle effects
        toggleParticleEffects() {
            this.particlesEnabled = !this.particlesEnabled;
            localStorage.setItem('particlesEnabled', this.particlesEnabled);

            // Clear all particles if disabled
            if (!this.particlesEnabled && this.particleSystem) {
                this.particleSystem.clearAll();

                // Clear effect references
                this.boostEffect = null;
                this.weatherEffect = null;
            }
        }
    }
};
</script>

<style>
.world {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: linear-gradient(#e4e0ba, #f7d9aa);
    outline: none;
    font-family: 'Arial', sans-serif;
}

.three-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
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
.high-score,
.difficulty-level {
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

/* Wanted level (police chase) */
.wanted-level {
    position: absolute;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    padding: 5px 15px;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 20px;
}

.wanted-stars {
    display: flex;
    gap: 8px;
}

.wanted-stars span {
    font-size: 24px;
    color: rgba(255, 255, 255, 0.3);
}

.wanted-stars span.active {
    color: #ffcc00;
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

.start-button,
.performance-button {
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

.start-button:hover,
.performance-button:hover {
    background-color: #45a049;
    transform: scale(1.05);
}

.sound-settings,
.performance-settings {
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

.performance-button {
    background-color: #ff5555;
    font-size: 16px;
    padding: 10px 20px;
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

.pause-settings {
    margin-top: 30px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 20px;
}

.setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.setting-row label {
    font-size: 16px;
}

.setting-row button {
    background-color: #555;
    margin: 0;
    padding: 8px 15px;
    font-size: 14px;
}

.setting-row button:hover {
    background-color: #666;
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

.player-stats {
    margin: 20px 0;
    padding: 15px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    text-align: left;
}

.player-stats p {
    margin: 8px 0;
}

/* FPS Counter */
.fps-counter {
    position: fixed;
    bottom: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 14px;
    font-family: monospace;
    z-index: 100;
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
    .high-score,
    .difficulty-level {
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

    .setting-row {
        flex-direction: column;
        gap: 10px;
    }
}

/* Landscape orientation fixes for mobile */
@media (max-height: 500px) and (orientation: landscape) {
    .start-screen h1 {
        font-size: 28px;
        margin-bottom: 15px;
    }

    .instructions {
        font-size: 14px;
        margin-bottom: 15px;
    }

    .start-button,
    .performance-button {
        padding: 10px 25px;
        font-size: 16px;
        margin: 10px 0;
    }

    .powerups {
        top: 5px;
        right: 5px;
    }

    .powerup {
        font-size: 12px;
        padding: 5px 10px;
        min-width: 70px;
    }

    .pause-screen,
    .game-over {
        padding: 15px;
    }

    .pause-screen h2,
    .game-over h2 {
        font-size: 24px;
        margin-bottom: 10px;
    }

    .pause-screen button,
    .game-over button {
        padding: 8px 20px;
        font-size: 14px;
        margin: 10px 5px;
    }
}
</style>