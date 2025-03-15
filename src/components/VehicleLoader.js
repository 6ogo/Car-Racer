import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export default class VehicleLoader {
    constructor() {
        this.loader = new FBXLoader();
        this.cache = {};
        this.defaultScale = 0.025;
        this.fallbackColors = {
            sports_car: 0xf25346,
            sedan: 0x68c3c0,
            monster_truck: 0x669900,
            pickup: 0xff6633,
            muscle: 0xcc3300,
            roadster: 0xffcc00,
            suv: 0x336699,
            hatchback: 0x99cc33,
            limousine: 0x000000,
            van: 0x6633cc,
        };
    }

    loadVehicle(modelName, onLoad, onProgress, onError) {
        if (this.cache[modelName]) {
            console.log(`Using cached model for ${modelName}`);
            const clonedModel = this.cache[modelName].clone();
            this.prepareForAnimation(clonedModel);
            if (onLoad) setTimeout(() => onLoad(clonedModel), 0);
            return clonedModel;
        }
        const modelPath = `${process.env.BASE_URL}assets/models/vehicles/${modelName}.fbx`;
        console.log(`Loading model from: ${modelPath}`);
        this.loader.load(modelPath, (fbx) => {
            console.log(`Successfully loaded model: ${modelName}`);
            fbx.scale.set(this.defaultScale, this.defaultScale, this.defaultScale);
            const box = new THREE.Box3().setFromObject(fbx);
            const center = box.getCenter(new THREE.Vector3());
            fbx.position.sub(center);
            const size = box.getSize(new THREE.Vector3());
            fbx.position.y = size.y / 2;
            this.applyDefaultMaterials(fbx, modelName);
            this.cache[modelName] = fbx.clone();
            if (onLoad) onLoad(fbx);
        }, onProgress, (error) => {
            console.error(`Error loading model ${modelName}:`, error);
            const fallbackModel = this.createFallbackModel(modelName);
            this.cache[modelName] = fallbackModel.clone();
            if (onLoad) onLoad(fallbackModel);
            if (onError) onError(error);
        });
    }

    createFallbackModel(modelName) {
        console.log(`Creating fallback model for ${modelName}`);
        const fallbackModel = new THREE.Group();
        const fallbackColor = this.fallbackColors[modelName] || 0xcccccc;
        if (modelName.includes('sports') || modelName.includes('roadster')) {
            this.createSportsCar(fallbackModel, fallbackColor);
        } else if (modelName.includes('monster') || modelName.includes('truck')) {
            this.createTruck(fallbackModel, fallbackColor);
        } else if (modelName.includes('police')) {
            this.createPoliceCar(fallbackModel, fallbackColor);
        } else {
            this.createSedan(fallbackModel, fallbackColor);
        }
        this.prepareForAnimation(fallbackModel);
        return fallbackModel;
    }

    createSportsCar(model, color) {
        const bodyMat = new THREE.MeshPhongMaterial({ color, flatShading: true });
        const bodyGeom = new THREE.BoxGeometry(90, 25, 45);
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 12.5;
        body.castShadow = true;
        body.receiveShadow = true;
        model.add(body);
        const roofGeom = new THREE.BoxGeometry(50, 20, 45);
        const roof = new THREE.Mesh(roofGeom, bodyMat);
        roof.position.set(-15, 35, 0);
        roof.castShadow = true;
        roof.receiveShadow = true;
        model.add(roof);
        const windshieldMat = new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
        const windshieldGeom = new THREE.BoxGeometry(3, 18, 35);
        const windshield = new THREE.Mesh(windshieldGeom, windshieldMat);
        windshield.position.set(10, 35, 0);
        model.add(windshield);
        this.addWheelToFallback(model, -25, 5, 25, 12);
        this.addWheelToFallback(model, -25, 5, -25, 12);
        this.addWheelToFallback(model, 25, 5, 25, 12);
        this.addWheelToFallback(model, 25, 5, -25, 12);
        const spoilerGeom = new THREE.BoxGeometry(15, 5, 50);
        const spoiler = new THREE.Mesh(spoilerGeom, bodyMat);
        spoiler.position.set(-40, 40, 0);
        spoiler.castShadow = true;
        spoiler.receiveShadow = true;
        model.add(spoiler);
    }

    createTruck(model, color) {
        const bodyMat = new THREE.MeshPhongMaterial({ color, flatShading: true });
        const bodyGeom = new THREE.BoxGeometry(75, 35, 55);
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 27.5;
        body.castShadow = true;
        body.receiveShadow = true;
        model.add(body);
        const cabinGeom = new THREE.BoxGeometry(35, 25, 45);
        const cabin = new THREE.Mesh(cabinGeom, bodyMat);
        cabin.position.set(-10, 52.5, 0);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        model.add(cabin);
        const windshieldMat = new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
        const windshieldGeom = new THREE.BoxGeometry(3, 20, 35);
        const windshield = new THREE.Mesh(windshieldGeom, windshieldMat);
        windshield.position.set(10, 52.5, 0);
        model.add(windshield);
        this.addWheelToFallback(model, -20, 15, 30, 18);
        this.addWheelToFallback(model, -20, 15, -30, 18);
        this.addWheelToFallback(model, 20, 15, 30, 18);
        this.addWheelToFallback(model, 20, 15, -30, 18);
    }

    createPoliceCar(model, color) {
        this.createSedan(model, 0x2233aa);
        const lightBarGeom = new THREE.BoxGeometry(20, 5, 40);
        const lightBarMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
        const lightBar = new THREE.Mesh(lightBarGeom, lightBarMat);
        lightBar.position.set(-15, 55, 0);
        model.add(lightBar);
        const redLightGeom = new THREE.BoxGeometry(5, 5, 15);
        const redLightMat = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
        const redLight = new THREE.Mesh(redLightGeom, redLightMat);
        redLight.position.set(-15, 60, -10);
        model.add(redLight);
        const blueLightGeom = new THREE.BoxGeometry(5, 5, 15);
        const blueLightMat = new THREE.MeshPhongMaterial({ color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 0.5 });
        const blueLight = new THREE.Mesh(blueLightGeom, blueLightMat);
        blueLight.position.set(-15, 60, 10);
        model.add(blueLight);
    }

    createSedan(model, color) {
        const bodyMat = new THREE.MeshPhongMaterial({ color, flatShading: true });
        const bodyGeom = new THREE.BoxGeometry(80, 30, 50);
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 15;
        body.castShadow = true;
        body.receiveShadow = true;
        model.add(body);
        const roofGeom = new THREE.BoxGeometry(40, 25, 50);
        const roof = new THREE.Mesh(roofGeom, bodyMat);
        roof.position.set(-15, 42.5, 0);
        roof.castShadow = true;
        roof.receiveShadow = true;
        model.add(roof);
        const windshieldMat = new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
        const windshieldGeom = new THREE.BoxGeometry(3, 20, 40);
        const windshield = new THREE.Mesh(windshieldGeom, windshieldMat);
        windshield.position.set(10, 35, 0);
        model.add(windshield);
        this.addWheelToFallback(model, -25, 5, 25);
        this.addWheelToFallback(model, -25, 5, -25);
        this.addWheelToFallback(model, 25, 5, 25);
        this.addWheelToFallback(model, 25, 5, -25);
    }

    addWheelToFallback(parent, x, y, z, size = 10) {
        const wheelGeom = new THREE.CylinderGeometry(size, size, 10, 16);
        wheelGeom.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true });
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(x, y, z);
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        wheel.userData.isWheel = true;
        wheel.name = `wheel_${x < 0 ? 'rear' : 'front'}_${z < 0 ? 'right' : 'left'}`;
        parent.add(wheel);
        return wheel;
    }

    applyDefaultMaterials(model, modelName) {
        const baseColor = this.fallbackColors[modelName] || 0x333333;
        model.traverse((child) => {
            if (child.isMesh) {
                child.userData.originalMaterial = child.material;
                const matName = child.material && child.material.name ? child.material.name.toLowerCase() : '';
                if (matName.includes('body') || child.name.toLowerCase().includes('body')) {
                    child.material = new THREE.MeshPhongMaterial({ color: baseColor, shininess: 30, specular: 0x333333 });
                } else if (matName.includes('window') || matName.includes('glass') || child.name.toLowerCase().includes('window') || child.name.toLowerCase().includes('glass')) {
                    child.material = new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7, shininess: 90, specular: 0xffffff });
                } else if (matName.includes('wheel') || matName.includes('tire') || child.name.toLowerCase().includes('wheel') || child.name.toLowerCase().includes('tire')) {
                    child.material = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 10 });
                    child.userData.isWheel = true;
                } else if (matName.includes('headlight') || child.name.toLowerCase().includes('headlight') || child.name.toLowerCase().includes('light')) {
                    child.material = new THREE.MeshPhongMaterial({ color: 0xffffcc, emissive: 0xffffcc, emissiveIntensity: 0.5 });
                } else {
                    child.material = new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 30 });
                }
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    setVehicleColor(model, color) {
        model.traverse((child) => {
            if (child.isMesh) {
                const matName = child.material ? child.material.name.toLowerCase() : '';
                if (matName.includes('body') || child.name.toLowerCase().includes('body') || (!matName.includes('wheel') && !matName.includes('glass') && !matName.includes('window') && !matName.includes('tire') && !matName.includes('light'))) {
                    child.material.color.setHex(color);
                }
            }
        });
        return model;
    }

    prepareForAnimation(model) {
        const wheels = [];
        model.traverse((child) => {
            if (child.userData.isWheel || child.name.toLowerCase().includes('wheel')) {
                wheels.push(child);
            }
        });
        model.animateWheels = (speed) => {
            wheels.forEach(wheel => {
                const name = wheel.name.toLowerCase();
                let rotationDirection = name.includes('left') ? -1 : 1;
                wheel.rotation.z += speed * 0.1 * rotationDirection;
            });
        };
        return model;
    }

    preloadVehicles(modelNames, onComplete) {
        console.log('Preloading vehicles:', modelNames);
        let loadedCount = 0;
        const totalCount = modelNames.length;
        const checkComplete = () => {
            loadedCount++;
            console.log(`Loaded ${loadedCount} of ${totalCount} vehicles`);
            if (loadedCount >= totalCount && onComplete) onComplete();
        };
        modelNames.forEach(modelName => {
            this.loadVehicle(modelName, () => checkComplete(), undefined, () => checkComplete());
        });
    }
}