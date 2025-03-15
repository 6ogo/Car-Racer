// src/components/Highway.js
import { Colors } from './common'
import * as THREE from 'three'
import Motorbike from './Motorbike'
import Truck from './Truck'
import Booster from './Booster'
import PowerUp from './PowerUp'

export default class Highway {
  constructor() {
    this.mesh = new THREE.Object3D()
    this.mesh.name = 'highway'
    this.boosters = []
    this.lastBoosterUpdate = 0

    // Create the highway base
    const geom = new THREE.BoxGeometry(2000, 20, 300, 40, 1, 1)
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.asphalt,
      flatShading: true
    })

    const road = new THREE.Mesh(geom, mat)
    road.receiveShadow = true
    this.mesh.add(road)

    // Add road markings
    this.addRoadMarkings()

    // Create the sides of the highway
    this.createSide(-160)
    this.createSide(160)

    // Create array to store obstacles (other cars, trucks, motorbikes)
    this.obstacles = []

    // Create array to store coins
    this.coins = []
    
    // Create array to store power-ups
    this.powerUps = []

    // Segments tracking for endless scrolling
    this.segments = []
    this.segmentSize = 500
    this.nSegments = 4 // number of segments to keep loaded
    this.currentSegmentIndex = 0

    // Add initial segments
    for (let i = 0; i < this.nSegments; i++) {
      this.addSegment(i * this.segmentSize)
    }
  }

  createBooster(distance, lane) {
    const posZ = lane * 100 - 100  // Same lane positioning as obstacles

    const booster = new Booster()
    booster.mesh.position.set(distance, 40, posZ)
    booster.mesh.castShadow = true

    this.mesh.add(booster.mesh)

    this.boosters.push({
      mesh: booster.mesh,
      booster: booster,  // Keep reference to the actual booster object
      lane: lane
    })

    return booster
  }
  
  createPowerUp(type, lane, distance) {
    const posZ = lane * 100 - 100  // Same lane positioning as obstacles

    const powerUp = new PowerUp(type)
    powerUp.mesh.position.set(distance, 40, posZ)
    powerUp.mesh.castShadow = true

    this.mesh.add(powerUp.mesh)

    this.powerUps.push({
      mesh: powerUp.mesh,
      powerUp: powerUp,  // Keep reference to the actual powerUp object
      type: type,
      lane: lane
    })

    return powerUp
  }

  addRoadMarkings() {
    // Central white dashed line
    for (let i = 0; i < 20; i++) {
      const dashGeom = new THREE.BoxGeometry(40, 22, 4, 1, 1, 1)
      const dashMat = new THREE.MeshPhongMaterial({
        color: Colors.white,
        flatShading: true
      })

      const dash = new THREE.Mesh(dashGeom, dashMat)
      dash.position.x = i * 100 - 950
      dash.position.y = 1
      dash.receiveShadow = true
      this.mesh.add(dash)
    }

    // Side white lines
    const leftLineGeom = new THREE.BoxGeometry(2000, 22, 4, 1, 1, 1)
    const leftLineMat = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true
    })

    const leftLine = new THREE.Mesh(leftLineGeom, leftLineMat)
    leftLine.position.z = 150
    leftLine.position.y = 1
    leftLine.receiveShadow = true
    this.mesh.add(leftLine)

    const rightLine = leftLine.clone()
    rightLine.position.z = -150
    this.mesh.add(rightLine)
  }

  createSide(posZ) {
    const sideGeom = new THREE.BoxGeometry(2000, 40, 20, 1, 1, 1)
    const sideMat = new THREE.MeshPhongMaterial({
      color: Colors.gray,
      flatShading: true
    })

    const side = new THREE.Mesh(sideGeom, sideMat)
    side.position.y = 0
    side.position.z = posZ
    side.receiveShadow = true
    this.mesh.add(side)

    // Add guardrails
    for (let i = 0; i < 40; i++) {
      const postGeom = new THREE.CylinderGeometry(3, 3, 40, 8)
      const postMat = new THREE.MeshPhongMaterial({
        color: Colors.lightGray,
        flatShading: true
      })

      const post = new THREE.Mesh(postGeom, postMat)
      post.position.set(i * 50 - 975, 10, posZ)
      post.receiveShadow = true
      post.castShadow = true
      this.mesh.add(post)

      const railGeom = new THREE.BoxGeometry(50, 5, 2, 1, 1, 1)
      const railMat = new THREE.MeshPhongMaterial({
        color: Colors.lightGray,
        flatShading: true
      })

      const rail = new THREE.Mesh(railGeom, railMat)
      rail.position.set(i * 50 - 950, 20, posZ)
      rail.receiveShadow = true
      this.mesh.add(rail)
    }
  }

  addSegment(posX) {
    const segment = {
      position: posX
    }

    this.segments.push(segment)
  }

  // Create an obstacle
  createObstacle(type, lane, distance) {
    let obstacle
    const posZ = lane * 100 - 100  // 3 lanes: -100, 0, 100

    if (type === 'car') {
      // Simple car obstacle
      const geom = new THREE.BoxGeometry(60, 25, 40, 1, 1, 1)

      // Random color for variety
      const colors = [Colors.red, Colors.blue, Colors.green, Colors.yellow, Colors.gray]
      const randomColor = colors[Math.floor(Math.random() * colors.length)]

      const mat = new THREE.MeshPhongMaterial({
        color: randomColor,
        flatShading: true
      })

      obstacle = new THREE.Mesh(geom, mat)

      // Add wheels
      this.addWheels(obstacle, -20, -12.5, 20)
      this.addWheels(obstacle, -20, -12.5, -20)
      this.addWheels(obstacle, 20, -12.5, 20)
      this.addWheels(obstacle, 20, -12.5, -20)
    }
    else if (type === 'truck') {
      // Use the new Truck class
      const truck = new Truck()
      obstacle = truck.mesh
    }
    else if (type === 'motorbike') {
      // Use the new Motorbike class
      const motorbike = new Motorbike()
      obstacle = motorbike.mesh
    }

    obstacle.position.set(distance, 30, posZ)
    obstacle.castShadow = true
    obstacle.receiveShadow = true

    this.mesh.add(obstacle)

    this.obstacles.push({
      mesh: obstacle,
      type: type,
      lane: lane
    })

    return obstacle
  }

  addWheels(parent, x, y, z) {
    const wheelGeom = new THREE.CylinderGeometry(8, 8, 8, 16)
    wheelGeom.rotateZ(Math.PI / 2)
    const wheelMat = new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
      flatShading: true
    })

    const wheel = new THREE.Mesh(wheelGeom, wheelMat)
    wheel.position.set(x, y, z)
    parent.add(wheel)

    return wheel
  }

  createCoin(distance, lane) {
    const posZ = lane * 100 - 100  // Same lane positioning as obstacles

    // Create a coin mesh
    const geom = new THREE.CylinderGeometry(15, 15, 5, 16)
    geom.rotateX(Math.PI / 2)

    const mat = new THREE.MeshPhongMaterial({
      color: Colors.yellow,
      flatShading: true,
      metalness: 0.8,
      roughness: 0.1
    })

    const coin = new THREE.Mesh(geom, mat)

    // Add coin details - cross indentation
    const indentGeom = new THREE.BoxGeometry(4, 30, 10, 1, 1, 1)
    const indentMat = new THREE.MeshPhongMaterial({
      color: Colors.yellow,
      flatShading: true
    })

    const indentH = new THREE.Mesh(indentGeom, indentMat)
    indentH.position.set(0, 0, 0)
    coin.add(indentH)

    const indentV = indentH.clone()
    indentV.rotation.z = Math.PI / 2
    coin.add(indentV)

    coin.position.set(distance, 40, posZ)
    coin.castShadow = true

    // Add rotation animation
    coin.rotation.z = Math.random() * Math.PI * 2

    this.mesh.add(coin)

    this.coins.push({
      mesh: coin,
      lane: lane,
      angle: coin.rotation.z
    })

    return coin
  }

  // Update highway for scrolling and animations
  update(speed) {
    // Update coin rotations
    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i]
      coin.mesh.rotation.z += 0.05
      coin.mesh.position.x -= speed

      // Remove coins that are behind the player
      if (coin.mesh.position.x < -200) {
        this.mesh.remove(coin.mesh)
        this.coins.splice(i, 1)
        i--
      }
    }

    // Update obstacle positions
    for (let i = 0; i < this.obstacles.length; i++) {
      const obstacle = this.obstacles[i]
      obstacle.mesh.position.x -= speed

      // Remove obstacles that are behind the player
      if (obstacle.mesh.position.x < -200) {
        this.mesh.remove(obstacle.mesh)
        this.obstacles.splice(i, 1)
        i--
      }
    }
    
    // Update power-up positions and animations
    for (let i = 0; i < this.powerUps.length; i++) {
      const powerUp = this.powerUps[i]
      powerUp.mesh.position.x -= speed
      
      // Update animation
      powerUp.powerUp.update()

      // Remove power-ups that are behind the player
      if (powerUp.mesh.position.x < -200) {
        this.mesh.remove(powerUp.mesh)
        this.powerUps.splice(i, 1)
        i--
      }
    }
    
    const now = Date.now()

    // Update booster positions
    for (let i = 0; i < this.boosters.length; i++) {
      const booster = this.boosters[i]
      booster.mesh.position.x -= speed
      
      // Update animation
      booster.booster.update()

      // Remove boosters that are behind the player
      if (booster.mesh.position.x < -200) {
        this.mesh.remove(booster.mesh)
        this.boosters.splice(i, 1)
        i--
      }
    }

    // Update segments for endless scrolling
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i]
      segment.position -= speed

      // If segment is past the player, recycle it to the end
      if (segment.position < -this.segmentSize) {
        // Move this segment to the end
        segment.position = this.segments[this.segments.length - 1].position + this.segmentSize

        // Adjust segment order
        this.segments.splice(i, 1)
        this.segments.push(segment)
        i--

        // Increment segment counter
        this.currentSegmentIndex++
      }
    }
  }

  // Check if player car collides with obstacles
  checkCollisions(carPosition) {
    const carBoundingBox = {
      xMin: carPosition.x - 40,
      xMax: carPosition.x + 40,
      zMin: carPosition.z - 25,
      zMax: carPosition.z + 25
    }

    for (let i = 0; i < this.obstacles.length; i++) {
      const obstacle = this.obstacles[i]

      // Set bounding box based on vehicle type
      let obstacleBoundingBox = {}

      if (obstacle.type === 'truck') {
        obstacleBoundingBox = {
          xMin: obstacle.mesh.position.x - 50,
          xMax: obstacle.mesh.position.x + 50,
          zMin: obstacle.mesh.position.z - 15,
          zMax: obstacle.mesh.position.z + 15
        }
      }
      else if (obstacle.type === 'motorbike') {
        obstacleBoundingBox = {
          xMin: obstacle.mesh.position.x - 25,
          xMax: obstacle.mesh.position.x + 25,
          zMin: obstacle.mesh.position.z - 10,
          zMax: obstacle.mesh.position.z + 10
        }
      }
      else { // car default
        obstacleBoundingBox = {
          xMin: obstacle.mesh.position.x - 30,
          xMax: obstacle.mesh.position.x + 30,
          zMin: obstacle.mesh.position.z - 20,
          zMax: obstacle.mesh.position.z + 20
        }
      }

      // Simple AABB collision detection
      if (carBoundingBox.xMax > obstacleBoundingBox.xMin &&
        carBoundingBox.xMin < obstacleBoundingBox.xMax &&
        carBoundingBox.zMax > obstacleBoundingBox.zMin &&
        carBoundingBox.zMin < obstacleBoundingBox.zMax) {
        return true
      }
    }
    
    return false;
  }

  // Check if player car collides with boosters
  checkBoosterCollisions(carPosition) {
    const carBoundingBox = {
      xMin: carPosition.x - 40,
      xMax: carPosition.x + 40,
      zMin: carPosition.z - 25,
      zMax: carPosition.z + 25
    }

    for (let i = 0; i < this.boosters.length; i++) {
      const booster = this.boosters[i]
      const boosterBoundingBox = {
        xMin: booster.mesh.position.x - 15,
        xMax: booster.mesh.position.x + 15,
        zMin: booster.mesh.position.z - 15,
        zMax: booster.mesh.position.z + 15
      }

      // Simple AABB collision detection
      if (carBoundingBox.xMax > boosterBoundingBox.xMin &&
        carBoundingBox.xMin < boosterBoundingBox.xMax &&
        carBoundingBox.zMax > boosterBoundingBox.zMin &&
        carBoundingBox.zMin < boosterBoundingBox.zMax) {

        // Remove the booster
        this.mesh.remove(booster.mesh)
        this.boosters.splice(i, 1)

        // Return true to indicate a booster was collected
        return true
      }
    }

    return false
  }
  
  // Check if player car collides with power-ups
  checkPowerUpCollisions(carPosition) {
    const carBoundingBox = {
      xMin: carPosition.x - 40,
      xMax: carPosition.x + 40,
      zMin: carPosition.z - 25,
      zMax: carPosition.z + 25
    }

    for (let i = 0; i < this.powerUps.length; i++) {
      const powerUp = this.powerUps[i]
      const powerUpBoundingBox = {
        xMin: powerUp.mesh.position.x - 15,
        xMax: powerUp.mesh.position.x + 15,
        zMin: powerUp.mesh.position.z - 15,
        zMax: powerUp.mesh.position.z + 15
      }

      // Simple AABB collision detection
      if (carBoundingBox.xMax > powerUpBoundingBox.xMin &&
        carBoundingBox.xMin < powerUpBoundingBox.xMax &&
        carBoundingBox.zMax > powerUpBoundingBox.zMin &&
        carBoundingBox.zMin < powerUpBoundingBox.zMax) {

        // Get the type before removing
        const type = powerUp.type
        
        // Remove the power-up
        this.mesh.remove(powerUp.mesh)
        this.powerUps.splice(i, 1)

        // Return the type of power-up collected
        return type
      }
    }

    return null
  }

  // Check if player car collects coins, with optional radius multiplier for magnet power-up
  checkCoinCollections(carPosition, radiusMultiplier = 1, valueMultiplier = 1) {
    const carBoundingBox = {
      xMin: carPosition.x - (40 * radiusMultiplier),
      xMax: carPosition.x + (40 * radiusMultiplier),
      zMin: carPosition.z - (25 * radiusMultiplier),
      zMax: carPosition.z + (25 * radiusMultiplier)
    };
  
    let collectedCoins = [];
    let totalValue = 0;
  
    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i];
      const coinBoundingBox = {
        xMin: coin.mesh.position.x - 15,
        xMax: coin.mesh.position.x + 15,
        zMin: coin.mesh.position.z - 15,
        zMax: coin.mesh.position.z + 15
      };
  
      // Simple AABB collision detection
      if (carBoundingBox.xMax > coinBoundingBox.xMin &&
        carBoundingBox.xMin < coinBoundingBox.xMax &&
        carBoundingBox.zMax > coinBoundingBox.zMin &&
        carBoundingBox.zMin < coinBoundingBox.zMax) {
  
        // Mark this coin for collection
        collectedCoins.push(i);
        
        // Apply value multiplier if provided
        if (valueMultiplier > 1) {
          totalValue += valueMultiplier;
        }
      }
    }
  
    // Remove collected coins (from end to beginning to avoid index issues)
    for (let i = collectedCoins.length - 1; i >= 0; i--) {
      const index = collectedCoins[i];
      const coin = this.coins[index];
      this.mesh.remove(coin.mesh);
      this.coins.splice(index, 1);
    }
  
    // Return object with count and value
    return {
      count: collectedCoins.length,
      value: totalValue > 0 ? totalValue : collectedCoins.length
    };
  }
}