// src/components/pools/CoinPool.js
import * as THREE from 'three';
import { Colors } from '../common';
import ObjectPool from '../ObjectPool';

// Create a Coin class that handles its own state
class Coin {
  constructor() {
    // Create a coin mesh
    const geom = new THREE.CylinderGeometry(15, 15, 5, 16);
    geom.rotateX(Math.PI / 2);

    const mat = new THREE.MeshPhongMaterial({
      color: Colors.yellow,
      flatShading: true,
      metalness: 0.8,
      roughness: 0.1
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;

    // Add coin details - cross indentation
    const indentGeom = new THREE.BoxGeometry(4, 30, 10);
    const indentMat = new THREE.MeshPhongMaterial({
      color: Colors.yellow,
      flatShading: true
    });

    const indentH = new THREE.Mesh(indentGeom, indentMat);
    indentH.position.set(0, 0, 0);
    this.mesh.add(indentH);

    const indentV = indentH.clone();
    indentV.rotation.z = Math.PI / 2;
    this.mesh.add(indentV);

    // Data for updating
    this.rotationSpeed = 0.05;
    this.lane = 0;
    this.active = false;
    
    // Reference to the object for the pool
    this.mesh.userData.poolObject = this;
  }

  place(x, y, z, lane) {
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.z = Math.random() * Math.PI * 2;
    this.lane = lane;
    this.active = true;
  }

  update(speed) {
    if (!this.active) return;

    // Rotate coin
    this.mesh.rotation.z += this.rotationSpeed;
    
    // Move with the road
    this.mesh.position.x -= speed;
    
    // Check if coin is off-screen
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
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    
    // Dispose indent geometries and materials
    this.mesh.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  isColliding(carBoundingBox) {
    const coinBoundingBox = {
      xMin: this.mesh.position.x - 15,
      xMax: this.mesh.position.x + 15,
      zMin: this.mesh.position.z - 15,
      zMax: this.mesh.position.z + 15
    };

    // AABB collision detection
    return (
      carBoundingBox.xMax > coinBoundingBox.xMin &&
      carBoundingBox.xMin < coinBoundingBox.xMax &&
      carBoundingBox.zMax > coinBoundingBox.zMin &&
      carBoundingBox.zMin < coinBoundingBox.zMax
    );
  }
}

export default class CoinPool {
  constructor(scene, initialSize = 30) {
    this.scene = scene;
    
    // Create the object pool
    this.pool = new ObjectPool(() => {
      const coin = new Coin();
      this.scene.add(coin.mesh);
      return coin;
    }, initialSize);
  }

  createCoin(distance, lane) {
    const posZ = lane * 100 - 100; // Convert lane to Z position
    
    // Get a coin from the pool
    const coin = this.pool.get();
    coin.place(distance, 40, posZ, lane);
    coin.mesh.visible = true;
    
    return coin;
  }

  update(gameSpeed) {
    // Update all active coins and collect those that need to be released
    const toRelease = [];
    
    this.pool.active.forEach(coin => {
      if (coin.update(gameSpeed)) {
        toRelease.push(coin);
      }
    });
    
    // Release coins that are off-screen
    toRelease.forEach(coin => this.pool.release(coin));
  }

  checkCollisions(carPosition, radiusMultiplier = 1, valueMultiplier = 1) {
    const carBoundingBox = {
      xMin: carPosition.x - (40 * radiusMultiplier),
      xMax: carPosition.x + (40 * radiusMultiplier),
      zMin: carPosition.z - (25 * radiusMultiplier),
      zMax: carPosition.z + (25 * radiusMultiplier)
    };
  
    let collectedCoins = [];
    let totalValue = 0;
  
    // Check all active coins for collisions
    this.pool.active.forEach(coin => {
      if (coin.isColliding(carBoundingBox)) {
        collectedCoins.push(coin);
        
        // Apply value multiplier if provided
        if (valueMultiplier > 1) {
          totalValue += valueMultiplier;
        }
      }
    });
  
    // Release collected coins back to the pool
    collectedCoins.forEach(coin => this.pool.release(coin));
  
    // Return object with count and value
    return {
      count: collectedCoins.length,
      value: totalValue > 0 ? totalValue : collectedCoins.length,
      coins: collectedCoins
    };
  }

  dispose() {
    this.pool.dispose();
  }
}