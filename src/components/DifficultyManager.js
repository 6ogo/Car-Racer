// src/components/DifficultyManager.js
export default class DifficultyManager {
    constructor() {
      // Basic difficulty settings
      this.baseSettings = {
        gameSpeed: 2,
        obstacleSpawnRate: 0.01,
        coinSpawnRate: 0.02,
        powerUpSpawnRate: 0.005,
        maxObstaclesOnScreen: 5,
        environmentChangeInterval: 30000, // 30 seconds
        obstacleLaneSwitchProbability: 0,
        obstacleVarietyFactor: 1,
        policeChaseChance: 0,
        policeChaseIntensity: 0.3,
        branchingRoadChance: 0,
        specialEventProbability: 0
      };
      
      // Current difficulty level (1-10)
      this.level = 1;
      
      // Current settings (adjusted based on level and performance)
      this.currentSettings = { ...this.baseSettings };
      
      // Linear thresholds for score-based difficulty increases
      this.basicThresholds = [500, 1000, 2000, 3500, 5000, 7000, 9000, 12000, 15000];
      
      // Player performance tracking
      this.playerMetrics = {
        coinsCollected: 0,
        obstaclesAvoided: 0,
        collisionCount: 0,
        nearMissCount: 0,
        averageSpeed: 0,
        reactionTime: 0,
        laneSwitchCount: 0,
        boostUsageCount: 0,
        timePlayed: 0,
        // Skill metrics (calculated)
        collisionRate: 0,
        nearMissRate: 0,
        coinEfficiency: 0,
        distanceTraveled: 0,
        skillRating: 50 // 0-100 skill rating
      };
      
      // Time tracking
      this.lastUpdateTime = 0;
      this.gameStartTime = 0;
      this.gameTime = 0;
      
      // Game state flags
      this.hasStarted = false;
      this.isPaused = false;
      
      // Difficulty adjustment rate
      this.adaptationRate = 0.1; // How quickly to adapt to player skill (0-1)
      
      // Cooldown to prevent rapid difficulty changes
      this.difficultyChangeCooldown = 5000; // 5 seconds
      this.lastDifficultyChangeTime = 0;
    }
    
    // Initialize the difficulty manager
    start() {
      this.gameStartTime = Date.now();
      this.lastUpdateTime = this.gameStartTime;
      this.hasStarted = true;
      this.level = 1;
      
      // Reset player metrics
      this.resetPlayerMetrics();
      
      // Apply initial settings
      this.updateSettings();
      
      return this.currentSettings;
    }
    
    // Reset player performance metrics
    resetPlayerMetrics() {
      this.playerMetrics = {
        coinsCollected: 0,
        obstaclesAvoided: 0,
        collisionCount: 0,
        nearMissCount: 0,
        averageSpeed: 0,
        reactionTime: 0,
        laneSwitchCount: 0,
        boostUsageCount: 0,
        timePlayed: 0,
        collisionRate: 0,
        nearMissRate: 0,
        coinEfficiency: 0,
        distanceTraveled: 0,
        skillRating: 50
      };
    }
    
    // Update difficulty based on score and player performance
    update(score, currentSpeed, deltaTime) {
      if (!this.hasStarted || this.isPaused) return this.currentSettings;
      
      const now = Date.now();
      
      // Update time tracking
      this.gameTime = now - this.gameStartTime;
      this.playerMetrics.timePlayed = this.gameTime / 1000; // seconds
      
      // Basic score-based difficulty level
      const basicLevel = this.calculateBasicLevel(score);
      
      // Calculate skill-based adjustment
      const skillRating = this.calculateSkillRating();
      this.playerMetrics.skillRating = skillRating;
      
      // Determine if difficulty should change
      if (basicLevel !== this.level && 
          (now - this.lastDifficultyChangeTime) > this.difficultyChangeCooldown) {
        
        this.level = basicLevel;
        this.lastDifficultyChangeTime = now;
        
        // Update game settings based on new level
        this.updateSettings();
        
        // Return true to indicate difficulty changed
        return { ...this.currentSettings, difficultyChanged: true, newLevel: this.level };
      }
      
      // Update player metrics
      this.updatePlayerMetrics(currentSpeed, deltaTime);
      
      return this.currentSettings;
    }
    
    // Calculate the basic difficulty level based on score
    calculateBasicLevel(score) {
      // Find the highest threshold that the score exceeds
      let level = 1;
      for (let i = 0; i < this.basicThresholds.length; i++) {
        if (score >= this.basicThresholds[i]) {
          level = i + 2; // Levels start at 1
        } else {
          break;
        }
      }
      
      return level;
    }
    
    // Update settings based on current difficulty level and player skill
    updateSettings() {
      // Base difficulty determined by level (1-10)
      const levelFactor = (this.level - 1) / 9; // 0 to 1
      
      // Skill-based adjustment (-0.3 to +0.3)
      const skillAdjustment = (this.playerMetrics.skillRating - 50) / 100 * 0.6 - 0.3;
      
      // Combined factor with weighted skill adjustment
      const combinedFactor = Math.max(0, Math.min(1, levelFactor + (skillAdjustment * this.adaptationRate)));
      
      // Adjust the game settings
      this.currentSettings = {
        // Game speed increases with difficulty, slightly adjusted for skill
        gameSpeed: this.interpolate(
          this.baseSettings.gameSpeed, 
          this.baseSettings.gameSpeed * 3, 
          combinedFactor
        ),
        
        // Obstacle spawn rate increases with difficulty
        obstacleSpawnRate: this.interpolate(
          this.baseSettings.obstacleSpawnRate,
          this.baseSettings.obstacleSpawnRate * 4,
          combinedFactor
        ),
        
        // Coin spawn rate increases a bit to compensate for speed
        coinSpawnRate: this.interpolate(
          this.baseSettings.coinSpawnRate,
          this.baseSettings.coinSpawnRate * 2,
          combinedFactor
        ),
        
        // Power-up spawn rate also increases a bit
        powerUpSpawnRate: this.interpolate(
          this.baseSettings.powerUpSpawnRate,
          this.baseSettings.powerUpSpawnRate * 3,
          combinedFactor
        ),
        
        // More obstacles allowed on screen at higher difficulties
        maxObstaclesOnScreen: Math.floor(this.interpolate(
          this.baseSettings.maxObstaclesOnScreen,
          this.baseSettings.maxObstaclesOnScreen * 2,
          combinedFactor
        )),
        
        // Environment changes happen more frequently at higher levels
        environmentChangeInterval: this.interpolate(
          this.baseSettings.environmentChangeInterval,
          this.baseSettings.environmentChangeInterval * 0.5, // 15 seconds at max
          combinedFactor
        ),
        
        // Obstacles start switching lanes at higher difficulties
        obstacleLaneSwitchProbability: this.interpolate(
          0, // Never at level 1
          0.3, // 30% chance at max level
          combinedFactor
        ),
        
        // More variety of obstacles at higher levels
        obstacleVarietyFactor: this.interpolate(
          1, // Basic mix at level 1
          3, // Much more variety at max level
          combinedFactor
        ),
        
        // Police chases become possible at higher levels
        policeChaseChance: this.interpolate(
          0, // No police at level 1
          0.5, // 50% chance at max level
          combinedFactor
        ),
        
        // Police chases become more intense at higher levels
        policeChaseIntensity: this.interpolate(
          0.3, // Mild at first appearance
          0.9, // Very intense at max
          combinedFactor
        ),
        
        // Branching roads start appearing at higher levels
        branchingRoadChance: this.interpolate(
          0, // No branches at level 1
          0.3, // 30% chance at max
          combinedFactor
        ),
        
        // Special events (like traffic jams, construction) increase
        specialEventProbability: this.interpolate(
          0, // No special events at level 1
          0.2, // 20% chance at max level
          combinedFactor
        )
      };
      
      // Debug output of current settings
      console.log(`Difficulty Level: ${this.level}, Skill Rating: ${this.playerMetrics.skillRating.toFixed(1)}`);
      
      return this.currentSettings;
    }
    
    // Helper method for linear interpolation
    interpolate(min, max, factor) {
      return min + (max - min) * factor;
    }
    
    // Update player metrics
    updatePlayerMetrics(currentSpeed, deltaTime) {
      // Update distance traveled
      const distance = currentSpeed * deltaTime;
      this.playerMetrics.distanceTraveled += distance;
      
      // Rolling average for speed
      const newSpeedWeight = 0.1;
      this.playerMetrics.averageSpeed = 
        this.playerMetrics.averageSpeed * (1 - newSpeedWeight) + 
        currentSpeed * newSpeedWeight;
      
      // Update collision and near miss rates
      if (this.playerMetrics.obstaclesAvoided + this.playerMetrics.collisionCount > 0) {
        this.playerMetrics.collisionRate = 
          this.playerMetrics.collisionCount / 
          (this.playerMetrics.obstaclesAvoided + this.playerMetrics.collisionCount);
      }
      
      if (this.playerMetrics.obstaclesAvoided > 0) {
        this.playerMetrics.nearMissRate = 
          this.playerMetrics.nearMissCount / this.playerMetrics.obstaclesAvoided;
      }
      
      // Calculate coin efficiency
      // Higher means better at collecting coins relative to distance traveled
      const distanceInKm = this.playerMetrics.distanceTraveled / 1000;
      if (distanceInKm > 0) {
        this.playerMetrics.coinEfficiency = 
          this.playerMetrics.coinsCollected / distanceInKm;
      }
    }
    
    // Calculate overall skill rating (0-100)
    calculateSkillRating() {
      // No meaningful calculation possible with insufficient data
      if (this.playerMetrics.timePlayed < 5) { // Less than 5 seconds
        return 50; // Default middle value
      }
      
      // Component scores
      const avoidanceScore = Math.max(0, 100 - (this.playerMetrics.collisionRate * 200));
      
      const reactionScore = this.playerMetrics.nearMissRate > 0 ? 
        Math.min(100, 50 + (this.playerMetrics.nearMissRate * 100)) : 50;
      
      const collectionScore = Math.min(100, this.playerMetrics.coinEfficiency * 2);
      
      const controlScore = Math.min(100, 
        (this.playerMetrics.laneSwitchCount / Math.max(5, this.playerMetrics.timePlayed)) * 20
      );
      
      const advancedScore = Math.min(100, 
        (this.playerMetrics.boostUsageCount / Math.max(10, this.playerMetrics.timePlayed)) * 50
      );
      
      // Weighted combination
      const skillRating = (
        avoidanceScore * 0.35 + 
        reactionScore * 0.15 + 
        collectionScore * 0.2 + 
        controlScore * 0.2 + 
        advancedScore * 0.1
      );
      
      return skillRating;
    }
    
    // Record a collision event
    recordCollision() {
      this.playerMetrics.collisionCount++;
    }
    
    // Record a near miss event (passing close to an obstacle)
    recordNearMiss() {
      this.playerMetrics.nearMissCount++;
    }
    
    // Record a successfully avoided obstacle
    recordObstacleAvoided() {
      this.playerMetrics.obstaclesAvoided++;
    }
    
    // Record collecting a coin
    recordCoinCollected() {
      this.playerMetrics.coinsCollected++;
    }
    
    // Record use of boost
    recordBoostUsage() {
      this.playerMetrics.boostUsageCount++;
    }
    
    // Record lane change
    recordLaneSwitch() {
      this.playerMetrics.laneSwitchCount++;
    }
    
    // Record reaction time (time to respond to an event)
    recordReactionTime(time) {
      // Simple moving average
      if (this.playerMetrics.reactionTime === 0) {
        this.playerMetrics.reactionTime = time;
      } else {
        this.playerMetrics.reactionTime = 
          this.playerMetrics.reactionTime * 0.8 + time * 0.2;
      }
    }
    
    // Pause the difficulty manager
    pause() {
      this.isPaused = true;
    }
    
    // Resume the difficulty manager
    resume() {
      this.isPaused = false;
      this.lastUpdateTime = Date.now();
    }
    
    // Get current difficulty level
    getLevel() {
      return this.level;
    }
    
    // Get player skill rating
    getSkillRating() {
      return this.playerMetrics.skillRating;
    }
    
    // Get player metrics
    getMetrics() {
      return { ...this.playerMetrics };
    }
    
    // Adjust difficulty sensitivity
    setAdaptationRate(rate) {
      this.adaptationRate = Math.max(0, Math.min(1, rate));
    }
  }