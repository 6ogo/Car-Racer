// src/components/pools/PowerUpPool.js
import * as THREE from 'three';
import { Colors } from '../common';
import ObjectPool from '../ObjectPool';

// Base PowerUp class
class PowerUpItem {
  constructor(type) {
    this.mesh = new THREE.Object3D();
    this.type = type;
    this.lane = 0;
    this.active = false;
    this.angle = 0;
    
    // Build the visual representation based on type
    this.buildMesh();
    
    // Reference to the object for the pool
    this.mesh.userData.poolObject = this;
  }

  buildMesh() {
    switch (this.type) {
      case 'boost':
        this.createBoostPowerUp();
        break;
      case 'shield':
        this.createShieldPowerUp();
        break;
      case 'magnet':
        this.createMagnetPowerUp();
        break;
      case 'multiplier':
        this.createMultiplierPowerUp();
        break;
      default:
        this.createBoostPowerUp();
        break;
    }
  }
  
  createBoostPowerUp() {
    // Create the main booster shape - green cube
    const geom = new THREE.BoxGeometry(15, 15, 15);
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.green,
      flatShading: true,
      transparent: true,
      opacity: 0.8
    });
    
    const cube = new THREE.Mesh(geom, mat);
    cube.castShadow = true;
    this.mesh.add(cube);
    
    // Add arrow indicating speed boost
    this.createArrow();
  }
  
  createShieldPowerUp() {
    // Create a protective bubble/shield - blue sphere
    const geom = new THREE.SphereGeometry(15, 16, 16);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x4d88ff, // Light blue
      flatShading: false,
      transparent: true,
      opacity: 0.6
    });
    
    const shield = new THREE.Mesh(geom, mat);
    shield.castShadow = true;
    this.mesh.add(shield);
    
    // Inner shield
    const innerGeom = new THREE.SphereGeometry(10, 16, 16);
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0x0055ff, // Darker blue
      flatShading: false,
      transparent: true,
      opacity: 0.4
    });
    
    const innerShield = new THREE.Mesh(innerGeom, innerMat);
    this.mesh.add(innerShield);
    
    // Shield icon in center
    const iconGeom = new THREE.BoxGeometry(8, 8, 2);
    const iconMat = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true
    });
    
    const icon = new THREE.Mesh(iconGeom, iconMat);
    this.mesh.add(icon);
  }
  
  createMagnetPowerUp() {
    // Create magnet shape - red horseshoe
    const base = new THREE.Object3D();
    this.mesh.add(base);
    
    // Create the magnet body
    const bodyGeom = new THREE.TorusGeometry(10, 5, 16, 32, Math.PI);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0xff3333, // Red
      flatShading: true
    });
    
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.rotation.x = Math.PI / 2;
    body.rotation.z = Math.PI;
    body.position.y = 5;
    base.add(body);
    
    // Create magnet poles
    const poleGeom = new THREE.CylinderGeometry(3, 3, 10, 8);
    const poleMat1 = new THREE.MeshPhongMaterial({
      color: 0xff3333, // Red
      flatShading: true
    });
    
    const poleMat2 = new THREE.MeshPhongMaterial({
      color: 0xcccccc, // Silver
      flatShading: true
    });
    
    const pole1 = new THREE.Mesh(poleGeom, poleMat1);
    pole1.position.set(10, 0, 0);
    base.add(pole1);
    
    const pole2 = new THREE.Mesh(poleGeom, poleMat1);
    pole2.position.set(-10, 0, 0);
    base.add(pole2);
    
    // Metal tips
    const tipGeom = new THREE.CylinderGeometry(3.5, 3.5, 2, 8);
    
    const tip1 = new THREE.Mesh(tipGeom, poleMat2);
    tip1.position.set(10, -6, 0);
    base.add(tip1);
    
    const tip2 = new THREE.Mesh(tipGeom, poleMat2);
    tip2.position.set(-10, -6, 0);
    base.add(tip2);
    
    // Store reference to the base for animation
    this.baseObj = base;
  }
  
  createMultiplierPowerUp() {
    // Create the star shape
    const starShape = new THREE.Shape();
    
    const numPoints = 10;
    const outerRadius = 15;
    const innerRadius = 7;
    
    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / numPoints) * i;
      const x = Math.sin(angle) * radius;
      const y = Math.cos(angle) * radius;
      
      if (i === 0) {
        starShape.moveTo(x, y);
      } else {
        starShape.lineTo(x, y);
      }
    }
    
    starShape.closePath();
    
    const extrudeSettings = {
      depth: 3,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 1,
      bevelThickness: 1
    };
    
    const starGeom = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    const starMat = new THREE.MeshPhongMaterial({
      color: 0xffcc00, // Gold
      flatShading: true,
      specular: 0xffffcc,
      shininess: 100
    });
    
    const star = new THREE.Mesh(starGeom, starMat);
    star.rotation.x = Math.PI / 2;
    this.mesh.add(star);
    
    // Add "x2" text - using a box as placeholder
    const x2Geom = new THREE.BoxGeometry(8, 8, 1);
    const x2Mat = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true
    });
    
    const x2 = new THREE.Mesh(x2Geom, x2Mat);
    x2.position.z = 3;
    this.mesh.add(x2);
  }
  
  createArrow() {
    // Arrow body
    const arrowBodyGeom = new THREE.BoxGeometry(5, 2, 8);
    const arrowMat = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true
    });
    
    const arrowBody = new THREE.Mesh(arrowBodyGeom, arrowMat);
    arrowBody.position.set(0, 8, 0);
    this.mesh.add(arrowBody);
    
    // Arrow head (triangle)
    const arrowHeadGeom = new THREE.ConeGeometry(4, 8, 3);
    arrowHeadGeom.rotateX(Math.PI / 2);
    
    const arrowHead = new THREE.Mesh(arrowHeadGeom, arrowMat);
    arrowHead.position.set(0, 8, 8);
    this.mesh.add(arrowHead);
  }
  
  place(x, y, z, lane) {
    this.mesh.position.set(x, y, z);
    this.lane = lane;
    this.active = true;
    this.angle = 0; // Reset animation angle
  }

  update(speed) {
    if (!this.active) return;
    
    // Move with the road
    this.mesh.position.x -= speed;
    
    // Animation: float up and down
    this.mesh.position.y += Math.sin(this.angle) * 0.1;
    this.angle += 0.1;
    
    // Rotate slightly
    this.mesh.rotation.y += 0.02;
    
    // Type-specific animations
    if (this.type === 'magnet' && this.baseObj) {
      // Special rotation for magnet
      this.baseObj.rotation.y += 0.01;
    } else if (this.type === 'multiplier') {
      // Special rotation for multiplier (star)
      this.mesh.rotation.z += 0.02;
    }
    
    // Check if powerup is off-screen
    if (this.mesh.position.x < -200) {
      this.active = false;
      return true; // Signal to release back to pool
    }
    
    return false;
  }

  reset() {
    this.active = false;
    this.mesh.visible = false;
    this.lane = 0;
    this.angle = 0;
  }

  dispose() {
    // Dispose of all meshes in this power-up
    this.mesh.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  isColliding(carBoundingBox) {
    const powerUpBoundingBox = {
      xMin: this.mesh.position.x - 15,
      xMax: this.mesh.position.x + 15,
      zMin: this.mesh.position.z - 15,
      zMax: this.mesh.position.z + 15
    };

    // AABB collision detection
    return (
      carBoundingBox.xMax > powerUpBoundingBox.xMin &&
      carBoundingBox.xMin < powerUpBoundingBox.xMax &&
      carBoundingBox.zMax > powerUpBoundingBox.zMin &&
      carBoundingBox.zMin < powerUpBoundingBox.zMax
    );
  }
}

export default class PowerUpPool {
  constructor(scene, initialSize = 20) {
    this.scene = scene;
    
    // Create power-up factory function
    const createPowerUp = (type) => {
      const powerUp = new PowerUpItem(type);
      this.scene.add(powerUp.mesh);
      return powerUp;
    };
    
    // Create pools for each power-up type
    this.boostPool = new ObjectPool(() => createPowerUp('boost'), Math.floor(initialSize * 0.25));
    this.shieldPool = new ObjectPool(() => createPowerUp('shield'), Math.floor(initialSize * 0.25));
    this.magnetPool = new ObjectPool(() => createPowerUp('magnet'), Math.floor(initialSize * 0.25));
    this.multiplierPool = new ObjectPool(() => createPowerUp('multiplier'), Math.floor(initialSize * 0.25));
  }

  createPowerUp(type, lane, distance) {
    const posZ = lane * 100 - 100; // Convert lane to Z position
    
    let powerUp;
    
    // Get power-up from the appropriate pool
    switch (type) {
      case 'shield':
        powerUp = this.shieldPool.get();
        break;
      case 'magnet':
        powerUp = this.magnetPool.get();
        break;
      case 'multiplier':
        powerUp = this.multiplierPool.get();
        break;
      case 'boost':
      default:
        powerUp = this.boostPool.get();
        break;
    }
    
    // Place and activate the power-up
    powerUp.place(distance, 40, posZ, lane);
    powerUp.mesh.visible = true;
    
    return powerUp;
  }

  update(gameSpeed) {
    // Update all active power-ups and collect those that need to be released
    const updatePool = (pool) => {
      const toRelease = [];
      
      pool.active.forEach(powerUp => {
        if (powerUp.update(gameSpeed)) {
          toRelease.push(powerUp);
        }
      });
      
      // Release power-ups that are off-screen
      toRelease.forEach(powerUp => pool.release(powerUp));
    };
    
    // Update each pool
    updatePool(this.boostPool);
    updatePool(this.shieldPool);
    updatePool(this.magnetPool);
    updatePool(this.multiplierPool);
  }

  checkCollisions(carPosition) {
    const carBoundingBox = {
      xMin: carPosition.x - 40,
      xMax: carPosition.x + 40,
      zMin: carPosition.z - 25,
      zMax: carPosition.z + 25
    };
    
    // Check all pools for collisions
    const pools = [
      { pool: this.boostPool, type: 'boost' },
      { pool: this.shieldPool, type: 'shield' },
      { pool: this.magnetPool, type: 'magnet' },
      { pool: this.multiplierPool, type: 'multiplier' }
    ];
    
    for (const { pool, type } of pools) {
      for (const powerUp of pool.active) {
        if (powerUp.isColliding(carBoundingBox)) {
          // Release the power-up back to pool
          pool.release(powerUp);
          
          // Return the type of power-up collected
          return type;
        }
      }
    }
    
    return null;
  }

  dispose() {
    this.boostPool.dispose();
    this.shieldPool.dispose();
    this.magnetPool.dispose();
    this.multiplierPool.dispose();
  }
  
  getActivePowerUpCount() {
    return this.boostPool.active.size + 
           this.shieldPool.active.size + 
           this.magnetPool.active.size + 
           this.multiplierPool.active.size;
  }
}