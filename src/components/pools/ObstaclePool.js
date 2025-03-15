// src/components/pools/ObstaclePool.js
import * as THREE from 'three';
import { Colors } from '../common';
import ObjectPool from '../ObjectPool';
import Truck from '../Truck';
import Motorbike from '../Motorbike';

// Base class for obstacles
class Obstacle {
  constructor(type) {
    this.mesh = new THREE.Object3D();
    this.type = type;
    this.lane = 0;
    this.active = false;
    
    // Reference to the object for the pool
    this.mesh.userData.poolObject = this;
  }

  place(x, y, z, lane) {
    this.mesh.position.set(x, y, z);
    this.lane = lane;
    this.active = true;
  }

  update(speed) {
    if (!this.active) return;
    
    // Move with the road
    this.mesh.position.x -= speed;
    
    // Check if obstacle is off-screen
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
    // Base disposal - override in derived classes
  }

  getBoundingBox() {
    // Abstract method - override in derived classes
    return {
      xMin: this.mesh.position.x - 30,
      xMax: this.mesh.position.x + 30,
      zMin: this.mesh.position.z - 20,
      zMax: this.mesh.position.z + 20
    };
  }

  isColliding(carBoundingBox) {
    const obstacleBoundingBox = this.getBoundingBox();

    // AABB collision detection
    return (
      carBoundingBox.xMax > obstacleBoundingBox.xMin &&
      carBoundingBox.xMin < obstacleBoundingBox.xMax &&
      carBoundingBox.zMax > obstacleBoundingBox.zMin &&
      carBoundingBox.zMin < obstacleBoundingBox.zMax
    );
  }
}

// Car obstacle
class CarObstacle extends Obstacle {
  constructor() {
    super('car');
    
    // Simple car obstacle
    const geom = new THREE.BoxGeometry(60, 25, 40);

    // Random color for variety
    const colors = [Colors.red, Colors.blue, Colors.green, Colors.yellow, Colors.gray];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const mat = new THREE.MeshPhongMaterial({
      color: randomColor,
      flatShading: true
    });

    this.bodyMesh = new THREE.Mesh(geom, mat);
    this.mesh.add(this.bodyMesh);

    // Add wheels
    this.addWheels(-20, -12.5, 20);
    this.addWheels(-20, -12.5, -20);
    this.addWheels(20, -12.5, 20);
    this.addWheels(20, -12.5, -20);
    
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  addWheels(x, y, z) {
    const wheelGeom = new THREE.CylinderGeometry(8, 8, 8, 16);
    wheelGeom.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
      flatShading: true
    });

    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.position.set(x, y, z);
    this.mesh.add(wheel);

    return wheel;
  }

  dispose() {
    // Dispose of body mesh geometry and material
    if (this.bodyMesh.geometry) this.bodyMesh.geometry.dispose();
    if (this.bodyMesh.material) this.bodyMesh.material.dispose();
    
    // Dispose of wheel geometries and materials
    this.mesh.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  getBoundingBox() {
    return {
      xMin: this.mesh.position.x - 30,
      xMax: this.mesh.position.x + 30,
      zMin: this.mesh.position.z - 20,
      zMax: this.mesh.position.z + 20
    };
  }
}

// Truck obstacle
class TruckObstacle extends Obstacle {
  constructor() {
    super('truck');
    
    // Create a new truck and add it to our mesh
    const truck = new Truck();
    this.mesh.add(truck.mesh);
    
    this.truckMesh = truck.mesh;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  dispose() {
    // Dispose all meshes in the truck
    this.mesh.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      }
    });
  }

  getBoundingBox() {
    return {
      xMin: this.mesh.position.x - 50,
      xMax: this.mesh.position.x + 50,
      zMin: this.mesh.position.z - 15,
      zMax: this.mesh.position.z + 15
    };
  }
}

// Motorbike obstacle
class MotorbikeObstacle extends Obstacle {
  constructor() {
    super('motorbike');
    
    // Create a new motorbike and add it to our mesh
    const motorbike = new Motorbike();
    this.mesh.add(motorbike.mesh);
    
    this.motorbikeMesh = motorbike.mesh;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  dispose() {
    // Dispose all meshes in the motorbike
    this.mesh.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      }
    });
  }

  getBoundingBox() {
    return {
      xMin: this.mesh.position.x - 25,
      xMax: this.mesh.position.x + 25,
      zMin: this.mesh.position.z - 10,
      zMax: this.mesh.position.z + 10
    };
  }
}

export default class ObstaclePool {
  constructor(scene, initialSize = 20) {
    this.scene = scene;
    
    // Create separate pools for different obstacle types
    this.carPool = new ObjectPool(() => {
      const obstacle = new CarObstacle();
      this.scene.add(obstacle.mesh);
      return obstacle;
    }, Math.floor(initialSize * 0.5));
    
    this.truckPool = new ObjectPool(() => {
      const obstacle = new TruckObstacle();
      this.scene.add(obstacle.mesh);
      return obstacle;
    }, Math.floor(initialSize * 0.3));
    
    this.motorbikePool = new ObjectPool(() => {
      const obstacle = new MotorbikeObstacle();
      this.scene.add(obstacle.mesh);
      return obstacle;
    }, Math.floor(initialSize * 0.2));
  }

  createObstacle(type, lane, distance) {
    const posZ = lane * 100 - 100; // Convert lane to Z position
    
    let obstacle;
    
    // Get obstacle from the appropriate pool
    switch (type) {
      case 'truck':
        obstacle = this.truckPool.get();
        break;
      case 'motorbike':
        obstacle = this.motorbikePool.get();
        break;
      case 'car':
      default:
        obstacle = this.carPool.get();
        break;
    }
    
    // Place and activate the obstacle
    obstacle.place(distance, 30, posZ, lane);
    obstacle.mesh.visible = true;
    
    return obstacle;
  }

  update(gameSpeed) {
    // Update all active obstacles and collect those that need to be released
    const updatePool = (pool) => {
      const toRelease = [];
      
      pool.active.forEach(obstacle => {
        if (obstacle.update(gameSpeed)) {
          toRelease.push(obstacle);
        }
      });
      
      // Release obstacles that are off-screen
      toRelease.forEach(obstacle => pool.release(obstacle));
    };
    
    // Update each pool
    updatePool(this.carPool);
    updatePool(this.truckPool);
    updatePool(this.motorbikePool);
  }

  checkCollisions(carPosition) {
    const carBoundingBox = {
      xMin: carPosition.x - 40,
      xMax: carPosition.x + 40,
      zMin: carPosition.z - 25,
      zMax: carPosition.z + 25
    };
    
    // Check collisions in each pool
    const checkPool = (pool) => {
      for (const obstacle of pool.active) {
        if (obstacle.isColliding(carBoundingBox)) {
          return true;
        }
      }
      return false;
    };
    
    // Return true if collision detected in any pool
    return checkPool(this.carPool) || 
           checkPool(this.truckPool) || 
           checkPool(this.motorbikePool);
  }

  dispose() {
    this.carPool.dispose();
    this.truckPool.dispose();
    this.motorbikePool.dispose();
  }
  
  getActiveObstacleCount() {
    return this.carPool.active.size + 
           this.truckPool.active.size + 
           this.motorbikePool.active.size;
  }
}