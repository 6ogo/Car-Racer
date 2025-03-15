// src/components/Car.js
import { Colors } from './common'
import Driver from './Driver'
import * as THREE from 'three'

export default class Car {
  constructor(type = 'balanced') {
    this.mesh = new THREE.Object3D()
    this.mesh.name = 'car'
    this.type = type
    
    // Create car based on type
    switch(type) {
      case 'speedster':
        this.createSpeedster()
        break
      case 'monster':
        this.createMonster()
        break
      case 'balanced':
      default:
        this.createBalanced()
        break
    }
    
    // Add driver
    this.driver = new Driver()
    this.driver.mesh.position.set(-15, 25, 0)
    this.mesh.add(this.driver.mesh)
    
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
  }
  
  // Standard balanced car (original design)
  createBalanced() {
    // Car Body - Updated for BufferGeometry
    const geomBody = new THREE.BoxGeometry(80, 30, 50)
    const matBody = new THREE.MeshPhongMaterial({color: Colors.blue, flatShading: true})

    // NOTE: We can't modify vertices directly in BufferGeometry
    // Instead, we'll create a more complex shape or use other techniques for a sporty look
    
    const body = new THREE.Mesh(geomBody, matBody)
    body.castShadow = true
    body.receiveShadow = true
    body.position.set(0, 0, 0)
    this.mesh.add(body)

    // Car Roof
    const geomRoof = new THREE.BoxGeometry(40, 25, 50)
    const matRoof = new THREE.MeshPhongMaterial({color: Colors.blue, flatShading: true})
    
    const roof = new THREE.Mesh(geomRoof, matRoof)
    roof.position.x = -15
    roof.position.y = 25
    roof.castShadow = true
    roof.receiveShadow = true
    this.mesh.add(roof)

    // Windshield
    const geomWindshield = new THREE.BoxGeometry(3, 20, 40)
    const matWindshield = new THREE.MeshPhongMaterial({color: Colors.blue, transparent: true, opacity: 0.3, flatShading: true})
    const windshield = new THREE.Mesh(geomWindshield, matWindshield)
    windshield.position.set(10, 20, 0)
    windshield.castShadow = true
    windshield.receiveShadow = true
    this.mesh.add(windshield)

    // Wheels
    this.createWheel(-25, -15, 25)
    this.createWheel(-25, -15, -25)
    this.createWheel(25, -15, 25)
    this.createWheel(25, -15, -25)
    
    // Add some aerodynamic shape using additional meshes instead of vertex manipulation
    this.addAerodynamicFeatures(body)
  }
  
  // Add aerodynamic features to simulate the vertex manipulation we previously had
  addAerodynamicFeatures(body) {
    // Front slope
    const frontSlopeGeom = new THREE.BoxGeometry(20, 10, 50)
    const frontSlopeMat = new THREE.MeshPhongMaterial({color: Colors.blue, flatShading: true})
    const frontSlope = new THREE.Mesh(frontSlopeGeom, frontSlopeMat)
    frontSlope.position.set(30, -5, 0)
    frontSlope.rotation.z = Math.PI * 0.1
    body.add(frontSlope)
    
    // Rear slope
    const rearSlopeGeom = new THREE.BoxGeometry(20, 5, 50)
    const rearSlopeMat = new THREE.MeshPhongMaterial({color: Colors.blue, flatShading: true})
    const rearSlope = new THREE.Mesh(rearSlopeGeom, rearSlopeMat)
    rearSlope.position.set(-30, 10, 0)
    rearSlope.rotation.z = -Math.PI * 0.1
    body.add(rearSlope)
  }
  
  // Sleek, faster car
  createSpeedster() {
    // Car Body - more streamlined
    const geomBody = new THREE.BoxGeometry(90, 25, 45)
    const matBody = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true})

    const body = new THREE.Mesh(geomBody, matBody)
    body.castShadow = true
    body.receiveShadow = true
    this.mesh.add(body)

    // Sleek Low Roof
    const geomRoof = new THREE.BoxGeometry(50, 20, 45)
    const matRoof = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true})
    
    const roof = new THREE.Mesh(geomRoof, matRoof)
    roof.position.x = -15
    roof.position.y = 20
    roof.castShadow = true
    roof.receiveShadow = true
    this.mesh.add(roof)

    // Wider Windshield
    const geomWindshield = new THREE.BoxGeometry(3, 18, 35)
    const matWindshield = new THREE.MeshPhongMaterial({color: Colors.blue, transparent: true, opacity: 0.3, flatShading: true})
    const windshield = new THREE.Mesh(geomWindshield, matWindshield)
    windshield.position.set(10, 18, 0)
    windshield.castShadow = true
    windshield.receiveShadow = true
    this.mesh.add(windshield)
    
    // Spoiler
    const geomSpoiler = new THREE.BoxGeometry(15, 5, 50)
    const matSpoiler = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true})
    const spoiler = new THREE.Mesh(geomSpoiler, matSpoiler)
    spoiler.position.set(-40, 30, 0)
    spoiler.castShadow = true
    spoiler.receiveShadow = true
    this.mesh.add(spoiler)
    
    // Support for spoiler
    const geomSupport1 = new THREE.BoxGeometry(5, 15, 2)
    const matSupport = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true})
    const support1 = new THREE.Mesh(geomSupport1, matSupport)
    support1.position.set(-40, 20, 20)
    this.mesh.add(support1)
    
    const support2 = new THREE.Mesh(geomSupport1, matSupport)
    support2.position.set(-40, 20, -20)
    this.mesh.add(support2)

    // Wheels - slightly larger in front for speed
    this.createWheel(-25, -12, 25, 12)
    this.createWheel(-25, -12, -25, 12)
    this.createWheel(25, -12, 25, 13)
    this.createWheel(25, -12, -25, 13)
    
    // Add aerodynamic shape
    this.addSpeedsterAerodynamics(body)
  }
  
  addSpeedsterAerodynamics(body) {
    // Front slope for aerodynamic look
    const frontGeom = new THREE.BoxGeometry(20, 15, 45)
    const frontMat = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true})
    const front = new THREE.Mesh(frontGeom, frontMat)
    front.position.set(40, -5, 0)
    front.rotation.z = Math.PI * 0.15
    body.add(front)
    
    // Side curves
    const sideGeom = new THREE.BoxGeometry(70, 10, 5)
    const sideMat = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true})
    
    const leftSide = new THREE.Mesh(sideGeom, sideMat)
    leftSide.position.set(0, -5, 25)
    leftSide.rotation.x = Math.PI * 0.1
    body.add(leftSide)
    
    const rightSide = new THREE.Mesh(sideGeom, sideMat)
    rightSide.position.set(0, -5, -25)
    rightSide.rotation.x = -Math.PI * 0.1
    body.add(rightSide)
  }
  
  // Off-road monster truck
  createMonster() {
    // Taller, boxier body
    const geomBody = new THREE.BoxGeometry(75, 35, 55)
    const matBody = new THREE.MeshPhongMaterial({color: Colors.green, flatShading: true})

    const body = new THREE.Mesh(geomBody, matBody)
    body.position.y = 10 // Higher off ground
    body.castShadow = true
    body.receiveShadow = true
    this.mesh.add(body)

    // Smaller Cabin/Roof
    const geomRoof = new THREE.BoxGeometry(35, 25, 45)
    const matRoof = new THREE.MeshPhongMaterial({color: Colors.green, flatShading: true})
    
    const roof = new THREE.Mesh(geomRoof, matRoof)
    roof.position.x = -10
    roof.position.y = 45
    roof.castShadow = true
    roof.receiveShadow = true
    this.mesh.add(roof)

    // Wider Windshield
    const geomWindshield = new THREE.BoxGeometry(3, 20, 35)
    const matWindshield = new THREE.MeshPhongMaterial({color: Colors.blue, transparent: true, opacity: 0.3, flatShading: true})
    const windshield = new THREE.Mesh(geomWindshield, matWindshield)
    windshield.position.set(10, 40, 0)
    windshield.castShadow = true
    windshield.receiveShadow = true
    this.mesh.add(windshield)
    
    // Bull bar
    const geomBullBar = new THREE.BoxGeometry(5, 25, 65)
    const matBullBar = new THREE.MeshPhongMaterial({color: Colors.brownDark, flatShading: true})
    const bullBar = new THREE.Mesh(geomBullBar, matBullBar)
    bullBar.position.set(40, 20, 0)
    bullBar.castShadow = true
    bullBar.receiveShadow = true
    this.mesh.add(bullBar)
    
    // Roof lights
    const lightGeom = new THREE.CylinderGeometry(3, 3, 5, 8)
    const lightMat = new THREE.MeshPhongMaterial({color: Colors.yellow, flatShading: true})
    
    for (let i = 0; i < 4; i++) {
      const light = new THREE.Mesh(lightGeom, lightMat)
      light.position.set(-10, 60, -15 + (i * 10))
      light.rotation.x = Math.PI / 2
      this.mesh.add(light)
    }
    
    // Extra large wheels
    this.createWheel(-20, 0, 30, 18)
    this.createWheel(-20, 0, -30, 18)
    this.createWheel(20, 0, 30, 18)
    this.createWheel(20, 0, -30, 18)
    
    // Suspension parts
    const suspGeom = new THREE.BoxGeometry(5, 20, 5)
    const suspMat = new THREE.MeshPhongMaterial({color: Colors.brownDark, flatShading: true})
    
    const positions = [
      [-20, -10, 30],
      [-20, -10, -30],
      [20, -10, 30],
      [20, -10, -30]
    ]
    
    positions.forEach(pos => {
      const susp = new THREE.Mesh(suspGeom, suspMat)
      susp.position.set(pos[0], pos[1], pos[2])
      this.mesh.add(susp)
    })
  }

  createWheel(x, y, z, size = 10) {
    const wheelGeometry = new THREE.CylinderGeometry(size, size, 10, 16)
    wheelGeometry.rotateZ(Math.PI / 2)
    const wheelMaterial = new THREE.MeshPhongMaterial({color: Colors.brownDark, flatShading: true})
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
    wheel.position.set(x, y, z)
    wheel.castShadow = true
    wheel.receiveShadow = true
    this.mesh.add(wheel)

    // Hubcap
    const hubcapGeometry = new THREE.CircleGeometry(size * 0.6, 8)
    const hubcapMaterial = new THREE.MeshPhongMaterial({color: Colors.white, flatShading: true})
    const hubcap = new THREE.Mesh(hubcapGeometry, hubcapMaterial)
    hubcap.position.set(5, 0, 0)
    hubcap.rotation.y = Math.PI / 2
    wheel.add(hubcap)

    return wheel
  }
}