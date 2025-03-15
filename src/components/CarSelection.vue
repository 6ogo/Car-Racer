<!-- src/components/CarSelection.vue -->
<template>
    <div class="car-selection">
        <h2>Select Your Ride</h2>
        <div class="preview-container">
            <div class="model-preview" ref="modelPreview"></div>
            <div class="car-info">
                <h3>{{ cars[selectedCarIndex].name }}</h3>
                <div class="car-stats">
                    <div class="stat"><span>Speed:</span>
                        <div class="stat-bar">
                            <div class="stat-fill" :style="{ width: cars[selectedCarIndex].speed * 10 + '%' }"></div>
                        </div>
                    </div>
                    <div class="stat"><span>Handling:</span>
                        <div class="stat-bar">
                            <div class="stat-fill" :style="{ width: cars[selectedCarIndex].handling * 10 + '%' }"></div>
                        </div>
                    </div>
                    <div class="stat"><span>Boost:</span>
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
                <div class="car-thumbnail" :style="{ backgroundColor: car.color }">{{ car.name.charAt(0) }}</div>
                <span class="car-name">{{ car.name }}</span>
            </div>
        </div>
        <div class="color-selection">
            <div v-for="(color, index) in carColors" :key="index" class="color-option"
                :class="{ selected: selectedColorIndex === index }" :style="{ backgroundColor: color.hex }"
                @click="selectColor(index)"></div>
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
                { name: 'White', hex: '#ffffff' },
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
                    modelType: 'sports',
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
                    modelType: 'sedan',
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
        this.vehicleLoader = new VehicleLoader();
        this.initScene();
        this.loadModel(this.cars[this.selectedCarIndex].modelFile);
        window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.handleResize);
        this.stopAnimation();
        if (this.renderer) this.renderer.dispose();
        if (this.controls) this.controls.dispose();
        if (this.currentModel) this.scene.remove(this.currentModel);
    },
    methods: {
        initScene() {
            const container = this.$refs.modelPreview;
            const width = container.clientWidth;
            const height = container.clientHeight || 300;
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x333333);
            this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            this.scene.add(directionalLight);
            const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
            backLight.position.set(-1, 0.5, -1);
            this.scene.add(backLight);
            this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
            this.camera.position.set(5, 2.5, 5); // Adjusted camera position
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            container.appendChild(this.renderer.domElement);
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 2;
            this.controls.maxDistance = 5;
            this.controls.maxPolarAngle = Math.PI / 2;
            const groundGeometry = new THREE.PlaneGeometry(10, 10);
            const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.8, metalness: 0.2 });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            this.scene.add(ground);
            const gridHelper = new THREE.GridHelper(10, 10, 0x000000, 0x444444);
            this.scene.add(gridHelper);
            this.startAnimation();
        },
        loadModel(modelFile) {
            if (this.currentModel) {
                this.scene.remove(this.currentModel);
                this.currentModel = null;
            }
            this.vehicleLoader.loadVehicle(modelFile, (model) => {
                this.currentModel = model;
                const colorHex = parseInt(this.carColors[this.selectedColorIndex].hex.replace('#', '0x'));
                this.vehicleLoader.setVehicleColor(model, colorHex);
                this.vehicleLoader.prepareForAnimation(model);
                this.scene.add(model);
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                this.controls.target.copy(center);
                this.controls.update();
            }, (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            }, (error) => {
                console.error('Error loading model:', error);
            });
        },
        startAnimation() {
            const animate = () => {
                this.animationId = requestAnimationFrame(animate);
                if (this.controls) this.controls.update();
                if (this.currentModel && this.currentModel.animateWheels) {
                    this.currentModel.animateWheels(0.1);
                    this.currentModel.rotation.y += 0.002;
                }
                this.renderer.render(this.scene, this.camera);
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
            const width = container.clientWidth;
            const height = container.clientHeight || 300;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
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
        startGame() {
            const carData = { ...this.cars[this.selectedCarIndex] };
            carData.color = this.carColors[this.selectedColorIndex].hex;
            this.$emit('car-selected', carData);
        },
    },
};
</script>

<style scoped>
.car-selection {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
    color: white;
}

h2 {
    font-size: 36px;
    margin-bottom: 30px;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
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