// src/components/PoliceChase.js
import * as THREE from 'three';
import VehicleLoader from './VehicleLoader';

export default class PoliceChase {
  constructor(scene, roadGenerator) {
    this.scene = scene;
    this.roadGenerator = roadGenerator;
    this.vehicleLoader = new VehicleLoader();
    
    this.policeVehicles = [];
    this.maxPoliceVehicles = 3;
    this.initialDistance = 300; // Initial spawn distance behind player
    this.minDistance = 100; // Minimum chase distance
    this.playerPosition = new THREE.Vector3();
    
    this.chaseActive = false;
    this.chaseIntensity = 0; // 0-1 scale of chase intensity
    this.lastChaseUpdate = 0;
    this.chaseUpdateInterval = 5000; // 5 seconds between intensity adjustments
    this.chaseStartThreshold = 0.3; // Probability threshold for starting a chase
    this.chaseEndThreshold = 0.2; // Probability threshold for ending a chase
    
    // Police vehicle types (model files)
    this.policeTypes = [
      'police_sedan',
      'police_suv',
      'police_sports',
      'police_muscle'
    ];
    
    // Sirens
    this.sirens = [];
    this.sirenColors = [0xff0000, 0x0000ff]; // Red and blue
    this.sirenFlashRate = 0.5; // Flashes per second
    
    // Sounds
    this.sirenSound = null;
    this.radioChatter = null;
  }
  
  update(playerPosition, playerSpeed, deltaTime) {
    this.playerPosition.copy(playerPosition);
    
    // Update chase state
    this.updateChaseState(playerSpeed);
    
    // Update existing police vehicles
    this.updatePoliceVehicles(playerPosition, playerSpeed, deltaTime);
    
    // Spawn new police vehicles if needed
    this.managePoliceVehicles(playerPosition);
    
    // Update sirens
    this.updateSirens(deltaTime);
  }
  
  updateChaseState(playerSpeed) {
    const now = Date.now();
    
    // Only update chase intensity periodically
    if (now - this.lastChaseUpdate < this.chaseUpdateInterval) {
      return;
    }
    
    this.lastChaseUpdate = now;
    
    // Base chase probability on current speed
    const speedFactor = Math.min(1, playerSpeed / 15) * 0.5;
    
    if (!this.chaseActive) {
      // Chance to start a chase
      const startChance = speedFactor + Math.random() * 0.3;
      if (startChance > this.chaseStartThreshold) {
        this.startChase();
      }
    } else {
      // Chance to end chase
      const endChance = Math.random() * 0.3;
      if (endChance > this.chaseEndThreshold) {
        this.endChase();
      } else {
        // Adjust chase intensity
        this.chaseIntensity = Math.min(1, this.chaseIntensity + 0.1);
      }
    }
  }
  
  startChase() {
    this.chaseActive = true;
    this.chaseIntensity = 0.3;
    console.log('Police chase started!');
    
    // Play siren sound
    if (this.sirenSound) {
      this.sirenSound.play();
    }
    
    // Spawn initial police car
    this.spawnPoliceVehicle();
  }
  
  endChase() {
    this.chaseActive = false;
    this.chaseIntensity = 0;
    console.log('Police chase ended.');
    
    // Stop siren sound
    if (this.sirenSound) {
      this.sirenSound.pause();
    }
    
    // Remove all police vehicles
    this.removeAllPoliceVehicles();
  }
  
  spawnPoliceVehicle() {
    // Don't spawn if at max capacity
    if (this.policeVehicles.length >= this.maxPoliceVehicles) {
      return;
    }
    
    // Select a random police vehicle type
    const randomType = this.policeTypes[Math.floor(Math.random() * this.policeTypes.length)];
    
    // Load the model
    this.vehicleLoader.loadVehicle(
      randomType,
      (model) => {
        // Set up model for chasing
        this.setupPoliceVehicle(model);
      },
      undefined,
      (error) => {
        console.error('Error loading police vehicle:', error);
      }
    );
  }
  
  setupPoliceVehicle(model) {
    // Prepare model for animation
    this.vehicleLoader.prepareForAnimation(model);
    
    // Position behind player
    const spawnPosition = this.playerPosition.clone();
    spawnPosition.x -= this.initialDistance + Math.random() * 100;
    spawnPosition.z += (Math.random() - 0.5) * 100; // Random lane
    
    model.position.copy(spawnPosition);
    
    // Add to scene
    this.scene.add(model);
    
    // Setup sirens
    const sirens = this.createSirens();
    model.add(sirens);
    
    // Add to active police vehicles
    this.policeVehicles.push({
      model: model,
      speed: 0,
      targetSpeed: 0,
      acceleration: 0.1 + Math.random() * 0.1,
      maxSpeed: 8 + Math.random() * 4,
      turnSpeed: 0.05 + Math.random() * 0.05,
      lastLaneChange: 0,
      laneChangeInterval: 2000 + Math.random() * 2000,
      targetLane: 1, // Center lane
      sirens: sirens
    });
  }
  
  createSirens() {
    const sirenGroup = new THREE.Object3D();
    
    // Create siren lights
    const sirenGeometry = new THREE.BoxGeometry(5, 2, 10);
    const leftSirenMaterial = new THREE.MeshPhongMaterial({
      color: this.sirenColors[0],
      emissive: this.sirenColors[0],
      emissiveIntensity: 0.7
    });
    
    const rightSirenMaterial = new THREE.MeshPhongMaterial({
      color: this.sirenColors[1],
      emissive: this.sirenColors[1],
      emissiveIntensity: 0.7
    });
    
    // Left siren
    const leftSiren = new THREE.Mesh(sirenGeometry, leftSirenMaterial);
    leftSiren.position.set(0, 15, -5);
    sirenGroup.add(leftSiren);
    
    // Right siren
    const rightSiren = new THREE.Mesh(sirenGeometry, rightSirenMaterial);
    rightSiren.position.set(0, 15, 5);
    sirenGroup.add(rightSiren);
    
    // Store siren references for flashing
    this.sirens.push({
      leftLight: leftSiren,
      rightLight: rightSiren,
      phase: Math.random() * Math.PI * 2, // Random starting phase
    });
    
    return sirenGroup;
  }
  
  updateSirens(deltaTime) {
    if (!this.chaseActive) return;
    
    // Update siren lights (flashing effect)
    for (let i = 0; i < this.sirens.length; i++) {
      const siren = this.sirens[i];
      
      // Update phase
      siren.phase += deltaTime * this.sirenFlashRate * Math.PI * 2;
      
      // Left light (red) flashes
      const leftBrightness = Math.max(0, Math.sin(siren.phase));
      siren.leftLight.material.emissiveIntensity = leftBrightness;
      
      // Right light (blue) flashes in opposition
      const rightBrightness = Math.max(0, Math.sin(siren.phase + Math.PI));
      siren.rightLight.material.emissiveIntensity = rightBrightness;
    }
  }
  
  updatePoliceVehicles(playerPosition, playerSpeed, deltaTime) {
    if (!this.chaseActive) return;
    
    const now = Date.now();
    
    for (let i = 0; i < this.policeVehicles.length; i++) {
      const police = this.policeVehicles[i];
      const distanceToPlayer = police.model.position.distanceTo(playerPosition);
      
      // Adjust target speed based on distance to player
      if (distanceToPlayer > this.minDistance + 100) {
        // Catch up if too far behind
        police.targetSpeed = playerSpeed * (1 + this.chaseIntensity * 0.3);
      } else if (distanceToPlayer < this.minDistance) {
        // Slow down if too close
        police.targetSpeed = playerSpeed * 0.8;
      } else {
        // Match player speed with some variations
        police.targetSpeed = playerSpeed * (0.9 + this.chaseIntensity * 0.2);
      }
      
      // Clamp to max speed
      police.targetSpeed = Math.min(police.targetSpeed, police.maxSpeed);
      
      // Accelerate/decelerate towards target speed
      if (police.speed < police.targetSpeed) {
        police.speed += police.acceleration * deltaTime;
        if (police.speed > police.targetSpeed) {
          police.speed = police.targetSpeed;
        }
      } else if (police.speed > police.targetSpeed) {
        police.speed -= police.acceleration * 2 * deltaTime; // Brake faster than accelerate
        if (police.speed < police.targetSpeed) {
          police.speed = police.targetSpeed;
        }
      }
      
      // Move forward
      const forwardDir = new THREE.Vector3(1, 0, 0).applyQuaternion(police.model.quaternion);
      police.model.position.add(forwardDir.multiplyScalar(police.speed * deltaTime));
      
      // Rotate wheels
      if (police.model.animateWheels) {
        police.model.animateWheels(police.speed);
      }
      
      // Lane changes and steering
      this.updatePoliceVehicleSteering(police, playerPosition, now);
      
      // Remove if too far behind
      if (police.model.position.x < playerPosition.x - 500) {
        this.removePoliceVehicle(i);
        i--;
        continue;
      }
    }
  }
  
  updatePoliceVehicleSteering(police, playerPosition, now) {
    // Check if it's time to consider a lane change
    if (now - police.lastLaneChange > police.laneChangeInterval) {
      police.lastLaneChange = now;
      
      // Get info about the current road
      const roadInfo = this.roadGenerator.getRoadAhead(police.model.position, 200);
      
      // Decide on a new target lane
      this.decidePoliceTargetLane(police, playerPosition, roadInfo);
    }
    
    // Get the nearest lane position
    const laneInfo = this.roadGenerator.getNearestLanePosition(police.model.position);
    
    if (laneInfo) {
      // Get the target lane position
      const targetLane = this.getTargetLanePosition(police, laneInfo);
      
      if (targetLane) {
        // Calculate steering direction to the target lane
        const toTarget = new THREE.Vector3().subVectors(targetLane.position, police.model.position);
        
        // Project to horizontal plane
        toTarget.y = 0;
        
        // Current forward direction
        const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(police.model.quaternion);
        forward.y = 0;
        forward.normalize();
        
        // Calculate steering angle
        const angle = Math.atan2(toTarget.z, toTarget.x) - Math.atan2(forward.z, forward.x);
        
        // Normalize angle to [-PI, PI]
        let steeringAngle = angle;
        while (steeringAngle > Math.PI) steeringAngle -= Math.PI * 2;
        while (steeringAngle < -Math.PI) steeringAngle += Math.PI * 2;
        
        // Apply steering
        const turnAmount = Math.min(Math.abs(steeringAngle), police.turnSpeed) * Math.sign(steeringAngle);
        police.model.rotation.y += turnAmount;
        
        // Tilt the vehicle when turning
        police.model.rotation.z = -turnAmount * 5;
      }
    }
  }
  
  decidePoliceTargetLane(police, playerPosition, roadInfo) {
    // Base decision on player's lane and road ahead
    
    // Get player's lane
    const playerLaneInfo = this.roadGenerator.getNearestLanePosition(playerPosition);
    
    if (playerLaneInfo) {
      // 70% chance to target player's lane
      if (Math.random() < 0.7) {
        police.targetLane = playerLaneInfo.laneIndex;
      } else {
        // Otherwise pick a random lane
        police.targetLane = Math.floor(Math.random() * 3);
      }
      
      // If a curve is coming up, adjust for racing line
      if (roadInfo.pathType === 'curve_left') {
        // Prefer inside of curve (right lane)
        if (Math.random() < 0.6) police.targetLane = 2;
      } else if (roadInfo.pathType === 'curve_right') {
        // Prefer inside of curve (left lane)
        if (Math.random() < 0.6) police.targetLane = 0;
      }
      
      // If branches ahead, sometimes follow player
      if (roadInfo.branchesAhead && Math.random() < 0.8) {
        police.targetLane = playerLaneInfo.laneIndex;
      }
    }
  }
  
  getTargetLanePosition(police, currentLaneInfo) {
    // Get all lanes
    const allLanes = this.roadGenerator.getNearestLanePosition(police.model.position);
    
    // Calculate the lane index offset (0 to 2)
    const targetLaneIndex = police.targetLane;
    
    // Find the target lane
    const nearbyLanes = [];
    for (let i = 0; i < 3; i++) {
      const lanePos = this.roadGenerator.getNearestLanePosition(police.model.position);
      if (lanePos) {
        nearbyLanes.push(lanePos);
      }
    }
    
    // Sort by lane index
    nearbyLanes.sort((a, b) => a.laneIndex - b.laneIndex);
    
    // Return the target lane or the closest one
    if (targetLaneIndex >= 0 && targetLaneIndex < nearbyLanes.length) {
      return nearbyLanes[targetLaneIndex];
    } else if (nearbyLanes.length > 0) {
      return nearbyLanes[0];
    }
    
    return null;
  }
  
  managePoliceVehicles(playerPosition) {
    if (!this.chaseActive) return;
    
    // Spawn new police vehicles based on intensity and current count
    const targetCount = Math.floor(this.chaseIntensity * this.maxPoliceVehicles) + 1;
    
    if (this.policeVehicles.length < targetCount && Math.random() < 0.02) {
      this.spawnPoliceVehicle();
    }
  }
  
  removePoliceVehicle(index) {
    if (index < 0 || index >= this.policeVehicles.length) return;
    
    // Remove from scene
    this.scene.remove(this.policeVehicles[index].model);
    
    // Remove from sirens array
    const sirenIndex = this.sirens.findIndex(s => 
      s.leftLight === this.policeVehicles[index].sirens.children[0] ||
      s.rightLight === this.policeVehicles[index].sirens.children[1]
    );
    
    if (sirenIndex !== -1) {
      this.sirens.splice(sirenIndex, 1);
    }
    
    // Remove from array
    this.policeVehicles.splice(index, 1);
  }
  
  removeAllPoliceVehicles() {
    while (this.policeVehicles.length > 0) {
      this.removePoliceVehicle(0);
    }
  }
  
  setSirenSound(audioElement) {
    this.sirenSound = audioElement;
    this.sirenSound.loop = true;
    this.sirenSound.volume = 0.5;
  }
  
  setRadioChatter(audioElement) {
    this.radioChatter = audioElement;
    this.radioChatter.loop = true;
    this.radioChatter.volume = 0.3;
  }
  
  isChaseActive() {
    return this.chaseActive;
  }
  
  getChaseIntensity() {
    return this.chaseIntensity;
  }
  
  getPoliceDistance() {
    if (this.policeVehicles.length === 0) return Infinity;
    
    // Find closest police vehicle
    let closestDistance = Infinity;
    
    for (let i = 0; i < this.policeVehicles.length; i++) {
      const distance = this.policeVehicles[i].model.position.distanceTo(this.playerPosition);
      if (distance < closestDistance) {
        closestDistance = distance;
      }
    }
    
    return closestDistance;
  }
}