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
    // Car Body
    const geomBody = new THREE.BoxGeometry(80, 30, 50, 1, 1, 1)
    const matBody = new THREE.MeshPhongMaterial({color: Colors.blue, flatShading: true})

    // Modify the vertices to create a sporty car shape
    geomBody.vertices[4].y -= 10
    geomBody.vertices[4].z += 20
    geomBody.vertices[5].y -= 10
    geomBody.vertices[5].z -= 20
    geomBody.vertices[6].y += 10
    geomBody.vertices[6].z += 20
    geomBody.vertices[7].y += 10
    geomBody.vertices[7].z -= 20

    const body = new THREE.Mesh(geomBody, matBody)
    body.castShadow = true
    body.receiveShadow = true
    this.mesh.add(body)

    // Car Roof
    const geomRoof = new THREE.BoxGeometry(40, 25, 50, 1, 1, 1)
    const matRoof = new THREE.MeshPhongMaterial({color: Colors.blue, flatShading: true})
    
    const roof = new THREE.Mesh(geomRoof, matRoof)
    roof.position.x = -15
    roof.position.y = 25
    roof.castShadow = true
    roof.receiveShadow = true
    this.mesh.add(roof)

    // Windshield
    const geomWindshield = new THREE.BoxGeometry(3, 20, 40, 1, 1, 1)
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
  }
  
  // Sleek, faster car
  createSpeedster() {
    // Car Body - more streamlined
    const geomBody = new THREE.BoxGeometry(90, 25, 45, 1, 1, 1)
    const matBody = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true})

    // Modify the vertices to create an aerodynamic shape
    geomBody.vertices[4].y -= 8
    geomBody.vertices[4].z += 15
    geomBody.vertices[5].y -= 8
    geomBody.vertices[5].z -= 15
    geomBody.vertices[6].y += 8
    geomBody.vertices[6].z += 15
    geomBody.vertices[7].y += 8
    geomBody.vertices[7].z -= 15
    
    // Front vertices - more pointy
    geomBody.vertices[0].y -= 5
    geomBody.vertices[1].y -= 5
    geomBody.vertices[2].y += 5
    geomBody.vertices[3].y += 5

    const body = new THREE.Mesh(geomBody, matBody)
    body.castShadow = true
    body.receiveShadow = true
    this.mesh.add(body)

    // Sleek Low Roof
    const geomRoof = new THREE.BoxGeometry(50, 20, 45, 1, 1, 1)
    const matRoof = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true})
    
    // Make roof more aerodynamic
    const roof = new THREE.Mesh(geomRoof, matRoof)
    roof.position.x = -15
    roof.position.y = 20
    roof.castShadow = true
    roof.receiveShadow = true
    this.mesh.add(roof)

    // Wider Windshield
    const geomWindshield = new THREE.BoxGeometry(3, 18, 35, 1, 1, 1)
    const matWindshield = new THREE.MeshPhongMaterial({color: Colors.blue, transparent: true, opacity: 0.3, flatShading: true})
    const windshield = new THREE.Mesh(geomWindshield, matWindshield)
    windshield.position.set(10, 18, 0)
    windshield.castShadow = true
    windshield.receiveShadow = true
    this.mesh.add(windshield)
    
    // Spoiler
    const geomSpoiler = new THREE.BoxGeometry(15, 5, 50, 1, 1, 1)
    const matSpoiler = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true})
    const spoiler = new THREE.Mesh(geomSpoiler, matSpoiler)
    spoiler.position.set(-40, 30, 0)
    spoiler.castShadow = true
    spoiler.receiveShadow = true
    this.mesh.add(spoiler)
    
    // Support for spoiler
    const geomSupport1 = new THREE.BoxGeometry(5, 15, 2, 1, 1, 1)
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
  }
  
  // Off-road monster truck
  createMonster() {
    // Taller, boxier body
    const geomBody = new THREE.BoxGeometry(75, 35, 55, 1, 1, 1)
    const matBody = new THREE.MeshPhongMaterial({color: Colors.green, flatShading: true})

    const body = new THREE.Mesh(geomBody, matBody)
    body.position.y = 10 // Higher off ground
    body.castShadow = true
    body.receiveShadow = true
    this.mesh.add(body)

    // Smaller Cabin/Roof
    const geomRoof = new THREE.BoxGeometry(35, 25, 45, 1, 1, 1)
    const matRoof = new THREE.MeshPhongMaterial({color: Colors.green, flatShading: true})
    
    const roof = new THREE.Mesh(geomRoof, matRoof)
    roof.position.x = -10
    roof.position.y = 45
    roof.castShadow = true
    roof.receiveShadow = true
    this.mesh.add(roof)

    // Wider Windshield
    const geomWindshield = new THREE.BoxGeometry(3, 20, 35, 1, 1, 1)
    const matWindshield = new THREE.MeshPhongMaterial({color: Colors.blue, transparent: true, opacity: 0.3, flatShading: true})
    const windshield = new THREE.Mesh(geomWindshield, matWindshield)
    windshield.position.set(10, 40, 0)
    windshield.castShadow = true
    windshield.receiveShadow = true
    this.mesh.add(windshield)
    
    // Bull bar
    const geomBullBar = new THREE.BoxGeometry(5, 25, 65, 1, 1, 1)
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
    const suspGeom = new THREE.BoxGeometry(5, 20, 5, 1, 1, 1)
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