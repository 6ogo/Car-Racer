<!-- src/components/CarSelection.vue -->
<template>
    <div class="car-selection">
        <div class="controls-section">
            <div class="instructions">
                <p>Use ← → to change lanes</p>
                <p>Use ↑ ↓ for minor adjustments</p>
                <p>Press SPACE to pause</p>
            </div>
            <div class="sound-settings">
                <button @click="toggleSound" class="sound-button">
                    {{ soundMuted ? 'Sound: OFF' : 'Sound: ON' }}
                </button>
            </div>
            <div class="high-score">High Score: {{ highScore }}</div>
        </div>
        
        <h2>Select Your Ride</h2>

        <div class="preview-container">
            <!-- 3D model preview -->
            <div class="model-preview" ref="modelPreview"></div>

            <!-- Car name and stats -->
            <div class="car-info">
                <h3>{{ cars[selectedCarIndex].name }}</h3>
                <div class="car-stats">
                    <div class="stat">
                        <span>Speed:</span>
                        <div class="stat-bar">
                            <div class="stat-fill" :style="{ width: cars[selectedCarIndex].speed * 10 + '%' }"></div>
                        </div>
                    </div>
                    <div class="stat">
                        <span>Handling:</span>
                        <div class="stat-bar">
                            <div class="stat-fill" :style="{ width: cars[selectedCarIndex].handling * 10 + '%' }"></div>
                        </div>
                    </div>
                    <div class="stat">
                        <span>Boost:</span>
                        <div class="stat-bar">
                            <div class="stat-fill" :style="{ width: cars[selectedCarIndex].boost * 10 + '%' }"></div>
                        </div>
                    </div>
                </div>
                <p class="car-ability">{{ cars[selectedCarIndex].ability }}</p>
            </div>
        </div>

        <div class="cars-container">
            <div v-for="(car, index) in cars" :key="index" class="car-option"
                :class="{ selected: selectedCarIndex === index }" @click="selectCar(index)">
                <div class="car-thumbnail" :style="{ backgroundColor: car.color }">
                    {{ car.name.charAt(0) }}
                </div>
                <span class="car-name">{{ car.name }}</span>
            </div>
        </div>

        <!-- Color selection -->
        <div class="color-selection">
            <div v-for="(color, index) in carColors" :key="index" class="color-option"
                :class="{ selected: selectedColorIndex === index }" :style="{ backgroundColor: color.hex }"
                @click="selectColor(index)">
            </div>
        </div>

        <button class="start-button" @click="startGame">Start Race!</button>
    </div>
</template>

<script>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import VehicleLoader from './VehicleLoader';

export default {
    name: 'CarSelection',

    props: {
        highScore: {
            type: Number,
            default: 0
        },
        soundMuted: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            selectedCarIndex: 0,
            selectedColorIndex: 0,
            scene: null,
            camera: null,
            renderer: null,
            controls: null,
            currentModel: null,
            vehicleLoader: null,
            animationId: null,

            carColors: [
                { name: 'Red', hex: '#f25346' },
                { name: 'Blue', hex: '#68c3c0' },
                { name: 'Green', hex: '#669900' },
                { name: 'Yellow', hex: '#ffcc00' },
                { name: 'Black', hex: '#333333' },
                { name: 'White', hex: '#ffffff' }
            ],

            cars: [
                {
                    name: 'Sports Car',
                    modelFile: 'sports_car',
                    color: '#f25346',
                    speed: 9,
                    handling: 7,
                    boost: 8,
                    ability: 'Higher top speed and longer boost duration',
                    modelType: 'speedster',
                    boostDuration: 4000, // 4 seconds
                    boostMultiplier: 1.7,
                    turnSpeed: 0.9
                },
                {
                    name: 'Sedan',
                    modelFile: 'sedan',
                    color: '#68c3c0',
                    speed: 7,
                    handling: 8,
                    boost: 7,
                    ability: 'Better coin collection radius',
                    modelType: 'balanced',
                    boostDuration: 3000, // 3 seconds
                    boostMultiplier: 1.5,
                    turnSpeed: 1,
                    coinCollectionRadius: 1.5 // Multiplier for coin collection radius
                },
                {
                    name: 'Monster Truck',
                    modelFile: 'monster_truck',
                    color: '#669900',
                    speed: 6,
                    handling: 9,
                    boost: 7,
                    ability: 'Ignores minor obstacles once every 15 seconds',
                    modelType: 'monster',
                    boostDuration: 3000, // 3 seconds
                    boostMultiplier: 1.4,
                    turnSpeed: 1.2,
                    obstacleImmunity: true,
                    immunityRefreshTime: 15000 // 15 seconds
                },
                {
                    name: 'Pickup Truck',
                    modelFile: 'pickup',
                    color: '#ff6633',
                    speed: 6,
                    handling: 6,
                    boost: 9,
                    ability: 'High boost power and off-road capability',
                    modelType: 'pickup',
                    boostDuration: 5000, // 5 seconds
                    boostMultiplier: 1.8,
                    turnSpeed: 0.8,
                    offRoadBonus: true
                },
                // New vehicles to add
                {
                    name: 'Muscle Car',
                    modelFile: 'muscle',
                    color: '#cc3300',
                    speed: 8,
                    handling: 6,
                    boost: 10,
                    ability: 'Highest boost acceleration of all vehicles',
                    modelType: 'muscle',
                    boostDuration: 3500, // 3.5 seconds
                    boostMultiplier: 1.9,
                    turnSpeed: 0.8
                },
                {
                    name: 'Roadster',
                    modelFile: 'roadster',
                    color: '#ffcc00',
                    speed: 10,
                    handling: 8,
                    boost: 7,
                    ability: 'Highest top speed and excellent handling',
                    modelType: 'roadster',
                    boostDuration: 3000, // 3 seconds
                    boostMultiplier: 1.6,
                    turnSpeed: 1.1
                },
                {
                    name: 'SUV',
                    modelFile: 'suv',
                    color: '#336699',
                    speed: 7,
                    handling: 7,
                    boost: 6,
                    ability: 'Balanced performance on all terrain types',
                    modelType: 'suv',
                    boostDuration: 3000, // 3 seconds
                    boostMultiplier: 1.5,
                    turnSpeed: 0.9,
                    offRoadBonus: true
                },
                {
                    name: 'Hatchback',
                    modelFile: 'hatchback',
                    color: '#99cc33',
                    speed: 6,
                    handling: 10,
                    boost: 5,
                    ability: 'Best handling and tight cornering',
                    modelType: 'hatchback',
                    boostDuration: 2500, // 2.5 seconds
                    boostMultiplier: 1.4,
                    turnSpeed: 1.3
                },
                {
                    name: 'Limousine',
                    modelFile: 'limousine',
                    color: '#000000',
                    speed: 5,
                    handling: 5,
                    boost: 6,
                    ability: 'Extended coin collection width',
                    modelType: 'limousine',
                    boostDuration: 3000, // 3 seconds
                    boostMultiplier: 1.3,
                    turnSpeed: 0.7,
                    coinCollectionRadius: 2.0 // Wider collection area
                },
                {
                    name: 'Van',
                    modelFile: 'van',
                    color: '#6633cc',
                    speed: 5,
                    handling: 6,
                    boost: 8,
                    ability: 'Higher coin value multiplier (1.5x)',
                    modelType: 'van',
                    boostDuration: 3500, // 3.5 seconds
                    boostMultiplier: 1.5,
                    turnSpeed: 0.8,
                    coinValueMultiplier: 1.5
                }
            ]
        };
    },

    mounted() {
        console.log("CarSelection component mounted");
        this.vehicleLoader = new VehicleLoader();
        this.initScene();
        this.loadModel(this.cars[this.selectedCarIndex].modelFile);

        // Handle window resize
        window.addEventListener('resize', this.handleResize);
    },

    beforeDestroy() {
        // Clean up Three.js resources
        window.removeEventListener('resize', this.handleResize);
        this.stopAnimation();

        if (this.renderer) {
            this.renderer.dispose();
        }

        if (this.controls) {
            this.controls.dispose();
        }

        // Remove any models from the scene
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }
    },

    methods: {
        initScene() {
            console.log("Initializing 3D scene");
            // Get the container element
            const container = this.$refs.modelPreview;
            if (!container) {
                console.error("Model preview container not found!");
                return;
            }

            const width = container.clientWidth;
            const height = container.clientHeight || 300;

            // Create the scene with a nicer background
            this.scene = new THREE.Scene();
            
            // Create a nicer background with gradient sky
            const skyGeo = new THREE.SphereGeometry(500, 32, 32);
            const skyMat = new THREE.ShaderMaterial({
                uniforms: {
                    topColor: { value: new THREE.Color(0x0077ff) },
                    bottomColor: { value: new THREE.Color(0xffffff) },
                    offset: { value: 33 },
                    exponent: { value: 0.6 }
                },
                vertexShader: `
                    varying vec3 vWorldPosition;
                    void main() {
                        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                        vWorldPosition = worldPosition.xyz;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 topColor;
                    uniform vec3 bottomColor;
                    uniform float offset;
                    uniform float exponent;
                    varying vec3 vWorldPosition;
                    void main() {
                        float h = normalize(vWorldPosition + offset).y;
                        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                    }
                `,
                side: THREE.BackSide
            });
            const sky = new THREE.Mesh(skyGeo, skyMat);
            this.scene.add(sky);

            // Add lighting for better visuals
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            this.scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
            directionalLight.position.set(1, 1, 0.5);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 1024;
            directionalLight.shadow.mapSize.height = 1024;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            this.scene.add(directionalLight);

            const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
            backLight.position.set(-1, 0.5, -1);
            this.scene.add(backLight);

            // Create camera with better positioning
            this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
            this.camera.position.set(0, 5, 20); // Moved further back and up
            this.camera.lookAt(0, 0, 0);

            // Create renderer with better shadows
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.toneMappingExposure = 1.2;
            container.appendChild(this.renderer.domElement);

            // Add orbit controls with better defaults
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 7;  // Don't allow zooming in too close
            this.controls.maxDistance = 30; // Allow zooming out further
            this.controls.maxPolarAngle = Math.PI / 2;
            
            // Start with a better default view
            this.controls.target.set(0, 2, 0); // Look at a higher point
            this.controls.update();

            // Create a nicer ground
            // Create a textured ground
            const groundSize = 100;
            const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
            
            // Create a canvas for the ground texture
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Fill with base color
            ctx.fillStyle = '#888888';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add a grid pattern
            ctx.strokeStyle = '#777777';
            ctx.lineWidth = 1;
            const gridSize = 32;
            
            for (let i = 0; i <= canvas.width; i += gridSize) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
                ctx.stroke();
            }
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 4);
            
            const groundMaterial = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.9,
                metalness: 0.1
            });
            
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            ground.position.y = 0; // Set at origin height
            this.scene.add(ground);

            // Start animation loop
            this.startAnimation();
            
            console.log("3D scene initialized");
        },

        loadModel(modelFile) {
            console.log(`Loading model: ${modelFile}`);
            // Remove existing model
            if (this.currentModel) {
                this.scene.remove(this.currentModel);
                this.currentModel = null;
            }

            // Load new model
            this.vehicleLoader.loadVehicle(
                modelFile,
                (model) => {
                    this.currentModel = model;

                    // Apply selected color to the main body
                    const colorHex = parseInt(this.carColors[this.selectedColorIndex].hex.replace('#', '0x'));
                    
                    // First pass: Identify wheels and windows to make them black
                    model.traverse(child => {
                        if (child.isMesh) {
                            const name = child.name.toLowerCase();
                            
                            // Make wheels black
                            if (name.includes('wheel') || name.includes('tire')) {
                                // Create a black material for wheels
                                const blackMaterial = new THREE.MeshStandardMaterial({
                                    color: 0x222222,
                                    roughness: 0.7,
                                    metalness: 0.5
                                });
                                
                                child.material = blackMaterial;
                            }
                            // Make windows a translucent blue-black
                            else if (name.includes('window') || name.includes('glass') || name.includes('windshield')) {
                                // Create a glass-like material
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

                    // Prepare for animation - don't animate wheels in preview
                    this.vehicleLoader.prepareForAnimation(model, false);
                    
                    // Center model on ground
                    const box = new THREE.Box3().setFromObject(model);
                    const size = box.getSize(new THREE.Vector3());
                    const center = box.getCenter(new THREE.Vector3());
                    
                    // Reset position to center horizontally but float above ground
                    model.position.x = -center.x;
                    model.position.z = -center.z;
                    model.position.y = 2; // Place car 2 units above ground
                    
                    // Make sure wheels are properly attached
                    model.traverse(child => {
                        if (child.name && child.name.toLowerCase().includes('wheel')) {
                            // Ensure wheels don't rotate on their own in preview
                            if (child.userData) {
                                child.userData.isWheel = false;
                            }
                        }
                    });

                    // Add to scene
                    this.scene.add(model);

                    // Adjust camera based on car size
                    const maxDimension = Math.max(size.x, size.y, size.z);
                    const distance = maxDimension * 3.5; // Scale camera distance by car size
                    this.camera.position.set(0, maxDimension * 0.7, distance);
                    this.controls.target.set(0, maxDimension * 0.3, 0); // Focus on car body
                    this.controls.update();
                    
                    console.log(`Model ${modelFile} loaded successfully with size:`, size);
                },
                (xhr) => {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                (error) => {
                    console.error('Error loading model:', error);
                }
            );
        },

        startAnimation() {
            const animate = () => {
                this.animationId = requestAnimationFrame(animate);

                // Update controls
                if (this.controls) {
                    this.controls.update();
                }

                // Animate the model
                if (this.currentModel && this.currentModel.animateWheels) {
                    this.currentModel.animateWheels(0.1);

                    // Slowly rotate the model for display
                    this.currentModel.rotation.y += 0.002;
                }

                // Render the scene
                if (this.renderer && this.scene && this.camera) {
                    this.renderer.render(this.scene, this.camera);
                }
            };

            animate();
        },

        stopAnimation() {
            if (this.animationId !== null) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        },

        handleResize() {
            const container = this.$refs.modelPreview;
            if (!container) return;
            
            const width = container.clientWidth;
            const height = container.clientHeight || 300;

            // Update camera aspect ratio
            if (this.camera) {
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
            }

            // Update renderer size
            if (this.renderer) {
                this.renderer.setSize(width, height);
            }
        },

        selectCar(index) {
            this.selectedCarIndex = index;
            this.loadModel(this.cars[index].modelFile);
        },

        selectColor(index) {
            this.selectedColorIndex = index;

            if (this.currentModel) {
                const colorHex = parseInt(this.carColors[index].hex.replace('#', '0x'));
                this.vehicleLoader.setVehicleColor(this.currentModel, colorHex);
            }
        },

        toggleSound() {
            this.$emit('toggle-sound');
        },

        startGame() {
            console.log("Start Race button clicked");
            // Combine car data with selected color
            const carData = { ...this.cars[this.selectedCarIndex] };
            carData.color = this.carColors[this.selectedColorIndex].hex;

            // Debug log
            console.log("Emitting car-selected event with data:", carData);

            // Emit the selected car data to the parent component
            this.$emit('car-selected', carData);
            this.$emit('start-game');
        }
    }
};
</script>

<style scoped>
.car-selection {
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
    padding: 20px;
    box-sizing: border-box;
}

.controls-section {
    position: absolute;
    top: 20px;
    left: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
}

.instructions {
    text-align: center;
    font-size: 18px;
    line-height: 1.6;
    margin-bottom: 15px;
}

.sound-settings {
    margin-bottom: 15px;
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

.high-score {
    font-size: 18px;
    font-weight: bold;
    color: gold;
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.preview-container {
    display: flex;
    width: 90%;
    max-width: 1000px;
    margin-bottom: 20px;
}

.model-preview {
    width: 60%;
    height: 300px;
    background: #333;
    border-radius: 10px;
    overflow: hidden;
}

.car-info {
    width: 40%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.cars-container {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 15px;
    width: 90%;
    max-width: 800px;
    margin-bottom: 20px;
}

.car-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s;
    padding: 10px;
    border-radius: 8px;
    border: 2px solid transparent;
    width: 100px;
}

.car-option:hover {
    background: rgba(255, 255, 255, 0.1);
}

.car-option.selected {
    border-color: gold;
    box-shadow: 0 0 10px gold;
}

.car-thumbnail {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
    color: white;
    margin-bottom: 8px;
}

.car-name {
    font-size: 14px;
    text-align: center;
}

.color-selection {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.color-option {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;
}

.color-option:hover {
    transform: scale(1.1);
}

.color-option.selected {
    border-color: white;
    transform: scale(1.2);
}

.car-stats {
    margin: 20px 0;
}

.stat {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.stat span {
    width: 80px;
    text-align: right;
    margin-right: 10px;
}

.stat-bar {
    flex-grow: 1;
    height: 10px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    overflow: hidden;
}

.stat-fill {
    height: 100%;
    background: gold;
}

.car-ability {
    font-style: italic;
    color: #aaa;
}

.start-button {
    margin-top: 20px;
    background-color: #4CAF50;
    border: none;
    color: white;
    padding: 15px 32px;
    text-align: center;
    font-size: 20px;
    cursor: pointer;
    border-radius: 5px;
    transition: all 0.3s;
    z-index: 110;
}

.start-button:hover {
    background-color: #45a049;
    transform: scale(1.05);
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .preview-container {
        flex-direction: column;
    }

    .model-preview,
    .car-info {
        width: 100%;
    }

    .model-preview {
        height: 200px;
    }

    .car-option {
        width: 80px;
    }

    .color-option {
        width: 25px;
        height: 25px;
    }
}
</style>