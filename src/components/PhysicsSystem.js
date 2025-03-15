// src/components/PhysicsSystem.js
import * as THREE from 'three';

// CollisionBox class
class CollisionBox {
  constructor(width, depth, height, offsetX = 0, offsetY = 0, offsetZ = 0) {
    this.width = width;     // x-axis dimension
    this.depth = depth;     // z-axis dimension
    this.height = height;   // y-axis dimension
    this.offsetX = offsetX; // offset from entity position
    this.offsetY = offsetY;
    this.offsetZ = offsetZ;
  }
  
  // Calculate the bounding box based on entity position
  getBoundingBox(position) {
    return {
      xMin: position.x + this.offsetX - this.width / 2,
      xMax: position.x + this.offsetX + this.width / 2,
      yMin: position.y + this.offsetY - this.height / 2,
      yMax: position.y + this.offsetY + this.height / 2,
      zMin: position.z + this.offsetZ - this.depth / 2,
      zMax: position.z + this.offsetZ + this.depth / 2
    };
  }
}

// PhysicsEntity class
class PhysicsEntity {
  constructor(collisionBox, type, mesh) {
    this.collisionBox = collisionBox;
    this.type = type; // e.g., 'player', 'obstacle', 'powerup', 'coin'
    this.mesh = mesh;
    this.position = new THREE.Vector3();
    this.active = true;
    
    // Optional callback when collision occurs
    this.onCollision = null;
  }
  
  update(position) {
    this.position.copy(position);
  }
  
  getBoundingBox() {
    return this.collisionBox.getBoundingBox(this.position);
  }
  
  isColliding(other) {
    const boxA = this.getBoundingBox();
    const boxB = other.getBoundingBox();
    
    // AABB collision detection
    return (
      boxA.xMax > boxB.xMin &&
      boxA.xMin < boxB.xMax &&
      boxA.yMax > boxB.yMin &&
      boxA.yMin < boxB.yMax &&
      boxA.zMax > boxB.zMin &&
      boxA.zMin < boxB.zMax
    );
  }
}

// Main physics system
export default class PhysicsSystem {
  constructor() {
    // Entities indexed by type for efficient collision detection
    this.entities = {
      player: [],
      obstacle: [],
      powerup: [],
      coin: [],
      road: []
    };
    
    // Collision matrix: which types should check against which others
    this.collisionMatrix = {
      player: ['obstacle', 'powerup', 'coin', 'road'],
      obstacle: ['player'],
      powerup: ['player'],
      coin: ['player'],
      road: ['player']
    };
    
    // Collision results from last update
    this.collisionResults = [];
    
    // Debug visualization
    this.debugMode = false;
    this.debugMeshes = [];
  }
  
  // Add an entity to the physics system
  addEntity(entity) {
    if (!this.entities[entity.type]) {
      this.entities[entity.type] = [];
    }
    this.entities[entity.type].push(entity);
    
    // Add debug visualization if enabled
    if (this.debugMode) {
      this.addDebugMesh(entity);
    }
    
    return entity;
  }
  
  // Remove an entity from the physics system
  removeEntity(entity) {
    const typeArray = this.entities[entity.type];
    if (typeArray) {
      const index = typeArray.indexOf(entity);
      if (index !== -1) {
        typeArray.splice(index, 1);
      }
    }
    
    // Remove debug visualization if exists
    if (this.debugMode) {
      this.removeDebugMesh(entity);
    }
  }
  
  // Create and add a player entity
  createPlayerEntity(collisionBox, mesh) {
    const entity = new PhysicsEntity(collisionBox, 'player', mesh);
    return this.addEntity(entity);
  }
  
  // Create and add an obstacle entity
  createObstacleEntity(collisionBox, mesh) {
    const entity = new PhysicsEntity(collisionBox, 'obstacle', mesh);
    return this.addEntity(entity);
  }
  
  // Create and add a power-up entity
  createPowerupEntity(collisionBox, mesh) {
    const entity = new PhysicsEntity(collisionBox, 'powerup', mesh);
    return this.addEntity(entity);
  }
  
  // Create and add a coin entity
  createCoinEntity(collisionBox, mesh) {
    const entity = new PhysicsEntity(collisionBox, 'coin', mesh);
    return this.addEntity(entity);
  }
  
  // Update the physics system
  update() {
    this.collisionResults = [];
    
    // Check collisions based on collision matrix
    for (const [type, checkAgainst] of Object.entries(this.collisionMatrix)) {
      const typeEntities = this.entities[type];
      
      // Skip if no entities of this type
      if (!typeEntities || typeEntities.length === 0) continue;
      
      for (const entity of typeEntities) {
        // Skip inactive entities
        if (!entity.active) continue;
        
        // Check against each type in collision matrix
        for (const otherType of checkAgainst) {
          const otherEntities = this.entities[otherType];
          
          // Skip if no entities of other type
          if (!otherEntities || otherEntities.length === 0) continue;
          
          for (const other of otherEntities) {
            // Skip inactive entities
            if (!other.active) continue;
            
            // Skip self-collision
            if (entity === other) continue;
            
            // Check collision
            if (entity.isColliding(other)) {
              // Record collision
              this.collisionResults.push({
                entityA: entity,
                entityB: other,
                typeA: entity.type,
                typeB: other.type
              });
              
              // Trigger collision callbacks if defined
              if (entity.onCollision) {
                entity.onCollision(other);
              }
              
              if (other.onCollision) {
                other.onCollision(entity);
              }
            }
          }
        }
      }
    }
    
    // Update debug visualization if enabled
    if (this.debugMode) {
      this.updateDebugMeshes();
    }
    
    return this.collisionResults;
  }
  
  // Check if player is colliding with any obstacles
  isPlayerCollidingWithObstacles() {
    return this.collisionResults.some(
      collision => 
        (collision.typeA === 'player' && collision.typeB === 'obstacle') || 
        (collision.typeA === 'obstacle' && collision.typeB === 'player')
    );
  }
  
  // Get all collisions involving player and power-ups
  getPlayerPowerupCollisions() {
    return this.collisionResults.filter(
      collision => 
        (collision.typeA === 'player' && collision.typeB === 'powerup') || 
        (collision.typeA === 'powerup' && collision.typeB === 'player')
    );
  }
  
  // Get all collisions involving player and coins
  getPlayerCoinCollisions() {
    return this.collisionResults.filter(
      collision => 
        (collision.typeA === 'player' && collision.typeB === 'coin') || 
        (collision.typeA === 'coin' && collision.typeB === 'player')
    );
  }
  
  // Enable/disable debug visualization
  setDebugMode(scene, enabled = true) {
    this.debugMode = enabled;
    
    if (enabled) {
      // Create debug meshes for all entities
      for (const typeEntities of Object.values(this.entities)) {
        for (const entity of typeEntities) {
          this.addDebugMesh(entity, scene);
        }
      }
    } else {
      // Remove all debug meshes
      for (const mesh of this.debugMeshes) {
        scene.remove(mesh);
      }
      this.debugMeshes = [];
    }
  }
  
  // Add debug visualization for an entity
  addDebugMesh(entity, scene) {
    if (!this.debugMode || !scene) return;
    
    const box = entity.collisionBox;
    const geometry = new THREE.BoxGeometry(box.width, box.height, box.depth);
    
    // Different colors for different entity types
    let color;
    switch (entity.type) {
      case 'player': color = 0x00ff00; break;
      case 'obstacle': color = 0xff0000; break;
      case 'powerup': color = 0x0000ff; break;
      case 'coin': color = 0xffff00; break;
      default: color = 0x888888;
    }
    
    const material = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    
    const debugMesh = new THREE.Mesh(geometry, material);
    debugMesh.position.set(
      entity.position.x + box.offsetX,
      entity.position.y + box.offsetY,
      entity.position.z + box.offsetZ
    );
    
    // Store reference to entity for updates
    debugMesh.userData.physicsEntity = entity;
    
    scene.add(debugMesh);
    this.debugMeshes.push(debugMesh);
  }
  
  // Remove debug visualization for an entity
  removeDebugMesh(entity) {
    if (!this.debugMode) return;
    
    const index = this.debugMeshes.findIndex(
      mesh => mesh.userData.physicsEntity === entity
    );
    
    if (index !== -1) {
      const mesh = this.debugMeshes[index];
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      
      // Clean up resources
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
      
      this.debugMeshes.splice(index, 1);
    }
  }
  
  // Update positions of debug meshes
  updateDebugMeshes() {
    if (!this.debugMode) return;
    
    for (const debugMesh of this.debugMeshes) {
      const entity = debugMesh.userData.physicsEntity;
      if (entity) {
        const box = entity.collisionBox;
        debugMesh.position.set(
          entity.position.x + box.offsetX,
          entity.position.y + box.offsetY,
          entity.position.z + box.offsetZ
        );
        
        // Update visibility based on entity active state
        debugMesh.visible = entity.active;
      }
    }
  }
  
  // Clear all entities and debug visualization
  reset() {
    for (const type in this.entities) {
      this.entities[type] = [];
    }
    
    this.clearDebugMeshes();
  }
  
  // Clean up resources
  dispose(scene) {
    this.reset();
    this.clearDebugMeshes(scene);
  }
  
  // Clear debug meshes and dispose resources
  clearDebugMeshes(scene) {
    if (scene) {
      for (const mesh of this.debugMeshes) {
        scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      }
    }
    this.debugMeshes = [];
  }
}

// Export CollisionBox for convenience
export { CollisionBox, PhysicsEntity };