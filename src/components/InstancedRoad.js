// src/components/InstancedRoad.js
import * as THREE from 'three';
import { Colors } from './common';

export default class InstancedRoad {
  constructor(scene) {
    this.scene = scene;
    
    // Configuration
    this.laneWidth = 100;
    this.roadWidth = 300;
    this.segmentLength = 500;
    this.numSegments = 6; // Keep more segments loaded for smooth scrolling
    this.totalRoadLength = this.segmentLength * this.numSegments;
    
    // Tracking current position
    this.roadOffset = 0;
    this.segmentUpdateThreshold = this.segmentLength / 2;

    // Create instanced meshes for road components
    this.createRoadBase();
    this.createRoadMarkings();
    this.createRoadSides();
    this.createGuardrails();
    
    // Initialize the road segments
    this.updateRoadSegments();
  }
  
  createRoadBase() {
    // Road base geometry
    const roadGeometry = new THREE.PlaneGeometry(this.segmentLength, this.roadWidth);
    roadGeometry.rotateX(-Math.PI / 2); // Lay flat
    
    // Road material
    const roadMaterial = new THREE.MeshPhongMaterial({
      color: Colors.asphalt,
      flatShading: true
    });
    
    // Create instanced mesh for road segments
    this.roadInstances = new THREE.InstancedMesh(
      roadGeometry,
      roadMaterial,
      this.numSegments
    );
    this.roadInstances.receiveShadow = true;
    
    // Add to scene
    this.scene.add(this.roadInstances);
    
    // Matrix for positioning instances
    this.roadMatrix = new THREE.Matrix4();
  }
  
  createRoadMarkings() {
    // Create a single lane divider marking
    const dividerGeometry = new THREE.PlaneGeometry(40, 4);
    dividerGeometry.rotateX(-Math.PI / 2); // Lay flat
    
    const dividerMaterial = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true
    });
    
    // Calculate number of dividers per segment
    // Each divider is 40 units long with 60 unit gaps
    const dividersPerSegment = Math.floor(this.segmentLength / 100);
    const totalDividers = dividersPerSegment * this.numSegments;
    
    // Central dash line
    this.centerDividers = new THREE.InstancedMesh(
      dividerGeometry,
      dividerMaterial,
      totalDividers
    );
    this.centerDividers.position.y = 0.5; // Slightly above road to prevent z-fighting
    this.scene.add(this.centerDividers);
    
    // Continuous side lines
    const sideLineGeometry = new THREE.PlaneGeometry(this.segmentLength, 4);
    sideLineGeometry.rotateX(-Math.PI / 2); // Lay flat
    
    this.leftSideLine = new THREE.InstancedMesh(
      sideLineGeometry,
      dividerMaterial,
      this.numSegments
    );
    this.leftSideLine.position.y = 0.5;
    this.scene.add(this.leftSideLine);
    
    this.rightSideLine = new THREE.InstancedMesh(
      sideLineGeometry,
      dividerMaterial,
      this.numSegments
    );
    this.rightSideLine.position.y = 0.5;
    this.scene.add(this.rightSideLine);
    
    // Matrix for transformations
    this.dividerMatrix = new THREE.Matrix4();
  }
  
  createRoadSides() {
    // Side curb geometry
    const curbGeometry = new THREE.BoxGeometry(this.segmentLength, 10, 20);
    
    const curbMaterial = new THREE.MeshPhongMaterial({
      color: Colors.gray,
      flatShading: true
    });
    
    // Create instanced mesh for curbs (left and right sides)
    this.leftCurb = new THREE.InstancedMesh(
      curbGeometry,
      curbMaterial,
      this.numSegments
    );
    this.leftCurb.receiveShadow = true;
    this.scene.add(this.leftCurb);
    
    this.rightCurb = new THREE.InstancedMesh(
      curbGeometry,
      curbMaterial,
      this.numSegments
    );
    this.rightCurb.receiveShadow = true;
    this.scene.add(this.rightCurb);
    
    // Matrix for transformations
    this.curbMatrix = new THREE.Matrix4();
  }
  
  createGuardrails() {
    // Post geometry (vertical)
    const postGeometry = new THREE.CylinderGeometry(3, 3, 40, 8);
    
    const postMaterial = new THREE.MeshPhongMaterial({
      color: Colors.lightGray,
      flatShading: true
    });
    
    // Calculate posts per segment
    const postsPerSegment = Math.floor(this.segmentLength / 50);
    const totalPosts = postsPerSegment * this.numSegments;
    
    // Create instanced meshes for posts (both sides)
    this.leftPosts = new THREE.InstancedMesh(
      postGeometry,
      postMaterial,
      totalPosts
    );
    this.leftPosts.castShadow = true;
    this.leftPosts.receiveShadow = true;
    this.scene.add(this.leftPosts);
    
    this.rightPosts = new THREE.InstancedMesh(
      postGeometry,
      postMaterial,
      totalPosts
    );
    this.rightPosts.castShadow = true;
    this.rightPosts.receiveShadow = true;
    this.scene.add(this.rightPosts);
    
    // Rail geometry (horizontal)
    const railGeometry = new THREE.BoxGeometry(50, 5, 2);
    
    const railMaterial = new THREE.MeshPhongMaterial({
      color: Colors.lightGray,
      flatShading: true
    });
    
    // Create instanced meshes for rails
    this.leftRails = new THREE.InstancedMesh(
      railGeometry,
      railMaterial,
      totalPosts
    );
    this.leftRails.receiveShadow = true;
    this.scene.add(this.leftRails);
    
    this.rightRails = new THREE.InstancedMesh(
      railGeometry,
      railMaterial,
      totalPosts
    );
    this.rightRails.receiveShadow = true;
    this.scene.add(this.rightRails);
    
    // Matrix for transformations
    this.postMatrix = new THREE.Matrix4();
    this.railMatrix = new THREE.Matrix4();
  }
  
  updateRoadSegments() {
    // Update main road segments
    for (let i = 0; i < this.numSegments; i++) {
      const x = i * this.segmentLength - this.roadOffset;
      
      // Position road segment
      this.roadMatrix.makeTranslation(x + this.segmentLength/2, -10, 0);
      this.roadInstances.setMatrixAt(i, this.roadMatrix);
      
      // Position side curbs
      this.curbMatrix.makeTranslation(x + this.segmentLength/2, -5, this.roadWidth/2 + 10);
      this.leftCurb.setMatrixAt(i, this.curbMatrix);
      
      this.curbMatrix.makeTranslation(x + this.segmentLength/2, -5, -this.roadWidth/2 - 10);
      this.rightCurb.setMatrixAt(i, this.curbMatrix);
      
      // Position side lines
      this.dividerMatrix.makeTranslation(x + this.segmentLength/2, 0, this.roadWidth/2 - 10);
      this.leftSideLine.setMatrixAt(i, this.dividerMatrix);
      
      this.dividerMatrix.makeTranslation(x + this.segmentLength/2, 0, -this.roadWidth/2 + 10);
      this.rightSideLine.setMatrixAt(i, this.dividerMatrix);
    }
    
    // Update center dividers (dashed lines)
    const dividerSpacing = 100; // 40 units of line, 60 units of gap
    let dividerIndex = 0;
    
    for (let segIndex = 0; segIndex < this.numSegments; segIndex++) {
      const segmentX = segIndex * this.segmentLength - this.roadOffset;
      const dividersInSegment = Math.floor(this.segmentLength / dividerSpacing);
      
      for (let i = 0; i < dividersInSegment; i++) {
        const x = segmentX + (i * dividerSpacing) + 20; // +20 to center the divider
        
        this.dividerMatrix.makeTranslation(x, 0, 0);
        this.centerDividers.setMatrixAt(dividerIndex++, this.dividerMatrix);
      }
    }
    
    // Update guardrails
    const postSpacing = 50;
    let postIndex = 0;
    
    for (let segIndex = 0; segIndex < this.numSegments; segIndex++) {
      const segmentX = segIndex * this.segmentLength - this.roadOffset;
      const postsInSegment = Math.floor(this.segmentLength / postSpacing);
      
      for (let i = 0; i < postsInSegment; i++) {
        const x = segmentX + (i * postSpacing);
        
        // Left side posts
        this.postMatrix.makeTranslation(x, 10, this.roadWidth/2 + 10);
        this.leftPosts.setMatrixAt(postIndex, this.postMatrix);
        
        // Right side posts
        this.postMatrix.makeTranslation(x, 10, -this.roadWidth/2 - 10);
        this.rightPosts.setMatrixAt(postIndex, this.postMatrix);
        
        // Left side rails
        this.railMatrix.makeTranslation(x + 25, 20, this.roadWidth/2 + 10);
        this.leftRails.setMatrixAt(postIndex, this.railMatrix);
        
        // Right side rails
        this.railMatrix.makeTranslation(x + 25, 20, -this.roadWidth/2 - 10);
        this.rightRails.setMatrixAt(postIndex, this.railMatrix);
        
        postIndex++;
      }
    }
    
    // Update the instance matrices
    this.roadInstances.instanceMatrix.needsUpdate = true;
    this.leftCurb.instanceMatrix.needsUpdate = true;
    this.rightCurb.instanceMatrix.needsUpdate = true;
    this.centerDividers.instanceMatrix.needsUpdate = true;
    this.leftSideLine.instanceMatrix.needsUpdate = true;
    this.rightSideLine.instanceMatrix.needsUpdate = true;
    this.leftPosts.instanceMatrix.needsUpdate = true;
    this.rightPosts.instanceMatrix.needsUpdate = true;
    this.leftRails.instanceMatrix.needsUpdate = true;
    this.rightRails.instanceMatrix.needsUpdate = true;
  }
  
  update(speed) {
    // Move road forward
    this.roadOffset += speed;
    
    // When we've moved forward by one segment length, reset position
    // This creates an infinite scrolling effect
    if (this.roadOffset >= this.segmentLength) {
      this.roadOffset -= this.segmentLength;
    }
    
    // Update instance positions at regular intervals
    // This is more efficient than updating every frame
    if (this.roadOffset % this.segmentUpdateThreshold < speed) {
      this.updateRoadSegments();
    }
  }
  
  getLanePosition(lane) {
    // Convert lane index (0, 1, 2) to world Z position
    return (lane - 1) * this.laneWidth;
  }
  
  getNearestLanePosition(worldPosition) {
    // Calculate lane based on Z position
    const lane = Math.round(worldPosition.z / this.laneWidth) + 1;
    return Math.max(0, Math.min(2, lane)); // Clamp to valid lane indices
  }
  
  dispose() {
    // Dispose geometries and materials
    this.disposeInstancedMesh(this.roadInstances);
    this.disposeInstancedMesh(this.leftCurb);
    this.disposeInstancedMesh(this.rightCurb);
    this.disposeInstancedMesh(this.centerDividers);
    this.disposeInstancedMesh(this.leftSideLine);
    this.disposeInstancedMesh(this.rightSideLine);
    this.disposeInstancedMesh(this.leftPosts);
    this.disposeInstancedMesh(this.rightPosts);
    this.disposeInstancedMesh(this.leftRails);
    this.disposeInstancedMesh(this.rightRails);
  }
  
  disposeInstancedMesh(instancedMesh) {
    if (instancedMesh) {
      if (instancedMesh.geometry) instancedMesh.geometry.dispose();
      if (instancedMesh.material) instancedMesh.material.dispose();
      this.scene.remove(instancedMesh);
    }
  }
}