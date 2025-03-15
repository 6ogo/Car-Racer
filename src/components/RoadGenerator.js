// src/components/RoadGenerator.js
import * as THREE from 'three';
import { Colors } from './common';

export default class RoadGenerator {
  constructor(scene) {
    this.scene = scene;
    this.roadSegments = [];
    this.activeRoads = [];
    this.branchingRoads = [];
    this.maxSegments = 20;
    this.segmentLength = 500;
    this.roadWidth = 300;
    this.currentSegmentIndex = 0;
    
    // Road properties
    this.roadTypes = ['straight', 'curve_left', 'curve_right', 'branch_left', 'branch_right', 'branch_both'];
    this.weightedTypes = {
      'branch_both': 0.05,    // 5% chance for both branches
      'branch_left': 0.1,     // 10% chance for left branch
      'branch_right': 0.1,    // 10% chance for right branch
      'curve_left': 0.1,      // 10% chance for left curve
      'curve_right': 0.1,     // 10% chance for right curve
      'straight': 0.55        // 55% chance for straight
    };
    
    // Current active paths
    this.activePaths = [
      { 
        id: 'main',
        segments: [],
        position: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(1, 0, 0),
        turnAngle: 0,
        active: true
      }
    ];
    
    // Track which path the player is on
    this.playerPath = 'main';
    
    // Initialize the first segments
    this.initRoad();
  }
  
  initRoad() {
    // Create initial straight segments
    for (let i = 0; i < 5; i++) {
      this.addStraightSegment('main');
    }
  }
  
  getNextSegmentType(pathId) {
    // Weighted random selection of road types
    const pathIndex = this.activePaths.findIndex(p => p.id === pathId);
    if (pathIndex === -1) return 'straight';
    
    const path = this.activePaths[pathIndex];
    
    // Don't create branches if there are already active branches
    if (this.activePaths.length > 1) {
      // Exclude branch types
      const nonBranchWeights = { ...this.weightedTypes };
      delete nonBranchWeights.branch_both;
      delete nonBranchWeights.branch_left;
      delete nonBranchWeights.branch_right;
      
      // Normalize remaining weights
      const total = Object.values(nonBranchWeights).reduce((sum, w) => sum + w, 0);
      const normalized = {};
      for (const [type, weight] of Object.entries(nonBranchWeights)) {
        normalized[type] = weight / total;
      }
      
      return this.weightedRandomChoice(normalized);
    }
    
    // Regular weighted selection
    return this.weightedRandomChoice(this.weightedTypes);
  }
  
  weightedRandomChoice(weights) {
    const r = Math.random();
    let cumulativeWeight = 0;
    
    for (const [type, weight] of Object.entries(weights)) {
      cumulativeWeight += weight;
      if (r <= cumulativeWeight) {
        return type;
      }
    }
    
    return 'straight'; // Fallback
  }
  
  update(playerPosition) {
    // Check if we need to add more segments
    for (let i = 0; i < this.activePaths.length; i++) {
      const path = this.activePaths[i];
      
      // If the path is inactive, skip it
      if (!path.active) continue;
      
      // Get the position of the last segment in this path
      const lastSegment = path.segments[path.segments.length - 1];
      if (!lastSegment) continue;
      
      // If player is approaching the end of this path, add more segments
      const distanceToEnd = lastSegment.end.distanceTo(playerPosition);
      if (distanceToEnd < this.segmentLength * 2) {
        // Add a new segment
        const segmentType = this.getNextSegmentType(path.id);
        
        switch (segmentType) {
          case 'straight':
            this.addStraightSegment(path.id);
            break;
          case 'curve_left':
            this.addCurveSegment(path.id, 'left');
            break;
          case 'curve_right':
            this.addCurveSegment(path.id, 'right');
            break;
          case 'branch_left':
            this.addBranchSegment(path.id, 'left');
            break;
          case 'branch_right':
            this.addBranchSegment(path.id, 'right');
            break;
          case 'branch_both':
            this.addBranchSegment(path.id, 'both');
            break;
        }
      }
      
      // Check for inactive paths and clean them up if they're far behind
      for (let j = 0; j < this.activePaths.length; j++) {
        const otherPath = this.activePaths[j];
        if (!otherPath.active && otherPath.segments.length > 0) {
          const lastSegment = otherPath.segments[otherPath.segments.length - 1];
          if (lastSegment.end.distanceTo(playerPosition) > this.segmentLength * 5) {
            // Remove this inactive path
            this.removePathSegments(otherPath.id);
            this.activePaths.splice(j, 1);
            j--;
          }
        }
      }
    }
    
    // Detect which path the player is on
    this.detectPlayerPath(playerPosition);
    
    // Clean up old segments
    this.removeOldSegments(playerPosition);
  }
  
  detectPlayerPath(playerPosition) {
    // Find the closest path to the player
    let closestPath = null;
    let closestDistance = Infinity;
    
    for (let i = 0; i < this.activePaths.length; i++) {
      const path = this.activePaths[i];
      if (path.segments.length === 0) continue;
      
      // Check the distance to each segment in this path
      for (let j = 0; j < path.segments.length; j++) {
        const segment = path.segments[j];
        const distance = this.distanceToSegment(playerPosition, segment);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPath = path.id;
        }
      }
    }
    
    // Update player path if changed
    if (closestPath && this.playerPath !== closestPath) {
      this.playerPath = closestPath;
      console.log('Player now on path:', this.playerPath);
    }
  }
  
  distanceToSegment(point, segment) {
    // Project point onto line segment and find closest point
    const start = segment.start;
    const end = segment.end;
    
    const line = end.clone().sub(start);
    const len = line.length();
    line.normalize();
    
    const pointToStart = point.clone().sub(start);
    const projection = line.dot(pointToStart);
    
    // Clamp projection to segment
    const projectionClamped = Math.max(0, Math.min(len, projection));
    
    // Get closest point on segment
    const closestPoint = start.clone().add(line.multiplyScalar(projectionClamped));
    
    // Return distance to closest point
    return point.distanceTo(closestPoint);
  }
  
  addStraightSegment(pathId) {
    const pathIndex = this.activePaths.findIndex(p => p.id === pathId);
    if (pathIndex === -1) return;
    
    const path = this.activePaths[pathIndex];
    
    // Get the end position of the last segment, or use the path's current position
    const startPos = path.segments.length > 0 
      ? path.segments[path.segments.length - 1].end.clone()
      : path.position.clone();
    
    // Calculate end position based on direction and segment length
    const endPos = startPos.clone().add(
      path.direction.clone().multiplyScalar(this.segmentLength)
    );
    
    // Create the road segment
    const segment = this.createRoadSegment(startPos, endPos, 'straight');
    
    // Add to segment list
    path.segments.push({
      mesh: segment,
      start: startPos,
      end: endPos,
      type: 'straight'
    });
    
    // Update path position
    path.position.copy(endPos);
  }
  
  addCurveSegment(pathId, direction) {
    const pathIndex = this.activePaths.findIndex(p => p.id === pathId);
    if (pathIndex === -1) return;
    
    const path = this.activePaths[pathIndex];
    
    // Get the end position of the last segment
    const startPos = path.segments.length > 0 
      ? path.segments[path.segments.length - 1].end.clone()
      : path.position.clone();
    
    // Calculate turn angle (15-30 degrees)
    const turnAngle = Math.PI / 12 * (1 + Math.random()); // 15-30 degrees
    
    // Apply turn direction
    const turnRadians = direction === 'left' ? turnAngle : -turnAngle;
    
    // Create a rotation matrix
    const rotationMatrix = new THREE.Matrix4().makeRotationY(turnRadians);
    
    // Apply rotation to direction vector
    const newDirection = path.direction.clone().applyMatrix4(rotationMatrix);
    
    // Calculate end position
    const endPos = startPos.clone().add(
      newDirection.clone().multiplyScalar(this.segmentLength)
    );
    
    // Create curved road segment
    const segment = this.createRoadSegment(startPos, endPos, 'curve_' + direction);
    
    // Add to segment list
    path.segments.push({
      mesh: segment,
      start: startPos,
      end: endPos,
      type: 'curve_' + direction
    });
    
    // Update path position and direction
    path.position.copy(endPos);
    path.direction.copy(newDirection);
  }
  
  addBranchSegment(pathId, branchDirection) {
    const pathIndex = this.activePaths.findIndex(p => p.id === pathId);
    if (pathIndex === -1) return;
    
    const path = this.activePaths[pathIndex];
    
    // Get the end position of the last segment
    const startPos = path.segments.length > 0 
      ? path.segments[path.segments.length - 1].end.clone()
      : path.position.clone();
    
    // First add a straight segment to continue main path
    const mainEndPos = startPos.clone().add(
      path.direction.clone().multiplyScalar(this.segmentLength)
    );
    
    // Create the main road segment
    const mainSegment = this.createRoadSegment(startPos, mainEndPos, 'straight');
    
    // Add to segment list
    path.segments.push({
      mesh: mainSegment,
      start: startPos,
      end: mainEndPos,
      type: 'straight'
    });
    
    // Update path position
    path.position.copy(mainEndPos);
    
    // Now add branches if needed
    if (branchDirection === 'left' || branchDirection === 'both') {
      this.createBranchPath(startPos, path.direction, 'left');
    }
    
    if (branchDirection === 'right' || branchDirection === 'both') {
      this.createBranchPath(startPos, path.direction, 'right');
    }
  }
  
  createBranchPath(startPos, direction, branchDirection) {
    // Generate unique ID for new path
    const newPathId = 'branch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    // Calculate branch angle (30-45 degrees)
    const branchAngle = Math.PI / 6 * (1 + Math.random()); // 30-45 degrees
    
    // Apply branch direction
    const branchRadians = branchDirection === 'left' ? branchAngle : -branchAngle;
    
    // Create a rotation matrix
    const rotationMatrix = new THREE.Matrix4().makeRotationY(branchRadians);
    
    // Apply rotation to direction vector
    const newDirection = direction.clone().applyMatrix4(rotationMatrix);
    
    // Calculate end position for the branch
    const endPos = startPos.clone().add(
      newDirection.clone().multiplyScalar(this.segmentLength)
    );
    
    // Create branch road segment
    const segment = this.createRoadSegment(startPos, endPos, 'branch_' + branchDirection);
    
    // Create a new path
    const newPath = {
      id: newPathId,
      segments: [{
        mesh: segment,
        start: startPos,
        end: endPos,
        type: 'branch_' + branchDirection
      }],
      position: endPos.clone(),
      direction: newDirection,
      turnAngle: 0,
      active: true
    };
    
    // Add to active paths
    this.activePaths.push(newPath);
  }
  
  createRoadSegment(start, end, type) {
    // Calculate segment properties
    const direction = end.clone().sub(start).normalize();
    const length = end.distanceTo(start);
    const center = start.clone().add(end).multiplyScalar(0.5);
    
    // Create road mesh
    const roadGeometry = new THREE.BoxGeometry(length, 1, this.roadWidth);
    const roadMaterial = new THREE.MeshPhongMaterial({
      color: Colors.asphalt,
      flatShading: true
    });
    
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.receiveShadow = true;
    
    // Position and rotate road
    road.position.copy(center);
    
    // Align road with direction
    const axis = new THREE.Vector3(0, 1, 0);
    road.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);
    
    // Add to scene
    this.scene.add(road);
    
    // Add road markings based on type
    this.addRoadMarkings(road, length, type);
    
    return road;
  }
  
  addRoadMarkings(road, length, type) {
    // Central white dashed line
    const dashCount = Math.floor(length / 50);
    const dashLength = 20;
    const dashGap = 30;
    
    for (let i = 0; i < dashCount; i++) {
      const dashGeom = new THREE.BoxGeometry(dashLength, 2, 4);
      const dashMat = new THREE.MeshPhongMaterial({
        color: Colors.white,
        flatShading: true
      });
      
      const dash = new THREE.Mesh(dashGeom, dashMat);
      dash.position.set((-length/2) + (i * (dashLength + dashGap)) + dashLength/2, 1, 0);
      dash.receiveShadow = true;
      road.add(dash);
    }
    
    // Side white lines
    const lineGeom = new THREE.BoxGeometry(length, 2, 4);
    const lineMat = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true
    });
    
    const leftLine = new THREE.Mesh(lineGeom, lineMat);
    leftLine.position.set(0, 1, this.roadWidth/2 - 10);
    leftLine.receiveShadow = true;
    road.add(leftLine);
    
    const rightLine = leftLine.clone();
    rightLine.position.z = -this.roadWidth/2 + 10;
    road.add(rightLine);
    
    // Add special markings for branches
    if (type.includes('branch')) {
      const arrowGeom = new THREE.BoxGeometry(20, 2, 15);
      const arrowMat = new THREE.MeshPhongMaterial({
        color: Colors.white,
        flatShading: true
      });
      
      const arrow = new THREE.Mesh(arrowGeom, arrowMat);
      arrow.position.set(-length/4, 1, 0);
      arrow.receiveShadow = true;
      road.add(arrow);
      
      // Angled part of the arrow
      const arrowHead1 = new THREE.BoxGeometry(10, 2, 4);
      const head1 = new THREE.Mesh(arrowHead1, arrowMat);
      head1.position.set(-length/4 - 10, 1, 5);
      head1.rotation.y = Math.PI / 4;
      road.add(head1);
      
      const head2 = new THREE.Mesh(arrowHead1, arrowMat);
      head2.position.set(-length/4 - 10, 1, -5);
      head2.rotation.y = -Math.PI / 4;
      road.add(head2);
    }
  }
  
  removeOldSegments(playerPosition) {
    // Remove road segments too far behind the player
    for (let i = 0; i < this.activePaths.length; i++) {
      const path = this.activePaths[i];
      
      for (let j = 0; j < path.segments.length; j++) {
        const segment = path.segments[j];
        
        if (segment.end.x < playerPosition.x - this.segmentLength * 3) {
          // Remove from scene
          this.scene.remove(segment.mesh);
          
          // Remove from path segments
          path.segments.splice(j, 1);
          j--;
        }
      }
    }
  }
  
  removePathSegments(pathId) {
    const pathIndex = this.activePaths.findIndex(p => p.id === pathId);
    if (pathIndex === -1) return;
    
    const path = this.activePaths[pathIndex];
    
    // Remove all segments in this path
    for (let i = 0; i < path.segments.length; i++) {
      this.scene.remove(path.segments[i].mesh);
    }
    
    // Clear segments array
    path.segments = [];
  }
  
  // Get information about the road ahead for AI navigation
  getRoadAhead(position, distance) {
    // Find current path
    const pathIndex = this.activePaths.findIndex(p => p.id === this.playerPath);
    if (pathIndex === -1) return { path: 'straight', branchesAhead: false };
    
    const path = this.activePaths[pathIndex];
    
    // Find segments ahead of the player
    const segmentsAhead = [];
    for (let i = 0; i < path.segments.length; i++) {
      const segment = path.segments[i];
      if (segment.start.x > position.x && segment.start.x < position.x + distance) {
        segmentsAhead.push(segment);
      }
    }
    
    // Check for branches ahead
    let branchesAhead = false;
    for (let i = 0; i < segmentsAhead.length; i++) {
      if (segmentsAhead[i].type.includes('branch')) {
        branchesAhead = true;
        break;
      }
    }
    
    // Determine dominant path type
    let pathType = 'straight';
    for (let i = 0; i < segmentsAhead.length; i++) {
      if (segmentsAhead[i].type.includes('curve_left')) {
        pathType = 'curve_left';
        break;
      } else if (segmentsAhead[i].type.includes('curve_right')) {
        pathType = 'curve_right';
        break;
      }
    }
    
    return { pathType, branchesAhead };
  }
  
  // Method to get nearest lane position
  getNearestLanePosition(worldPosition) {
    // Find the nearest segment
    let closestSegment = null;
    let closestDistance = Infinity;
    let closestPath = null;
    
    for (let i = 0; i < this.activePaths.length; i++) {
      const path = this.activePaths[i];
      
      for (let j = 0; j < path.segments.length; j++) {
        const segment = path.segments[j];
        const distance = this.distanceToSegment(worldPosition, segment);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSegment = segment;
          closestPath = path;
        }
      }
    }
    
    if (!closestSegment || !closestPath) return null;
    
    // Calculate the direction of the segment
    const segmentDirection = closestSegment.end.clone().sub(closestSegment.start).normalize();
    
    // Calculate the right vector (perpendicular to direction)
    const rightVector = new THREE.Vector3(0, 1, 0).cross(segmentDirection).normalize();
    
    // Calculate the 3 lane positions
    const laneWidth = this.roadWidth / 3;
    const lanes = [];
    
    for (let i = -1; i <= 1; i++) {
      // Calculate lane center
      const laneOffset = rightVector.clone().multiplyScalar(i * laneWidth);
      
      // Project player position onto segment line
      const segVec = closestSegment.end.clone().sub(closestSegment.start);
      const playerVec = worldPosition.clone().sub(closestSegment.start);
      const projection = playerVec.dot(segVec) / segVec.length();
      const t = Math.max(0, Math.min(1, projection / segVec.length()));
      
      // Get position along segment
      const posOnSegment = closestSegment.start.clone().add(segVec.multiplyScalar(t));
      
      // Add lane offset
      const lanePosition = posOnSegment.clone().add(laneOffset);
      
      lanes.push({
        position: lanePosition,
        laneIndex: i + 1, // 0, 1, 2 from left to right
        distance: lanePosition.distanceTo(worldPosition)
      });
    }
    
    // Sort by distance
    lanes.sort((a, b) => a.distance - b.distance);
    
    return lanes[0]; // Return closest lane
  }
  
  // Get possible paths at a branch
  getBranchOptions(position) {
    // Find branches near the position
    const branches = [];
    
    for (let i = 0; i < this.activePaths.length; i++) {
      const path = this.activePaths[i];
      
      for (let j = 0; j < path.segments.length; j++) {
        const segment = path.segments[j];
        
        // Check if this is a branch point
        if (segment.type.includes('branch') && segment.start.distanceTo(position) < this.segmentLength * 0.8) {
          // Find connected paths
          const connectedPaths = [];
          
          for (let k = 0; k < this.activePaths.length; k++) {
            const otherPath = this.activePaths[k];
            
            // Skip the current path
            if (otherPath.id === path.id) continue;
            
            // Check if paths connect
            if (otherPath.segments.length > 0 && 
                otherPath.segments[0].start.distanceTo(segment.start) < 10) {
              connectedPaths.push(otherPath.id);
            }
          }
          
          branches.push({
            position: segment.start,
            mainPath: path.id,
            connectedPaths: connectedPaths,
            type: segment.type
          });
        }
      }
    }
    
    return branches;
  }
}