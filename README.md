# Car-Racer
 A simple car game

### 1. Car Selection System

The `CarSelection.vue` component lets users choose between different car types:
- Sport Car (Speed Demon): Higher top speed and longer boost duration
- Balanced Car: Better coin collection radius
- Monster Truck: Periodic obstacle immunity

### 2. Power-Up System

The game now features multiple power-ups:
- **Boost**: Temporary speed increase
- **Shield**: Protection from one collision
- **Magnet**: Increased coin collection radius
- **Multiplier**: Double score gain for a limited time

### 3. Environment System

The `EnvironmentManager.js` handles different racing environments:
- Day: Standard sunny environment
- Night: Dark environment with stars and moon
- Sunset: Orange-tinted environment
- Rain: Rainy environment with rain particles
- Snow: Snowy environment with snowflakes
- Desert: Desert environment with cacti and dust

### 4. Mobile Support

The `MobileControls.vue` component provides touch controls:
- Touch buttons for lane changes
- Boost button
- Pause button
- Swipe gestures as an alternative control method

### 5. Visual Effects

The `EffectsManager.js` adds various visual effects:
- Explosion effects during crashes
- Particle effects for coin collection
- Trail effects during boosting
- Shield visuals for protection

## Customization Guide

### Adding New Cars

To add a new car type:

1. Add the car details to the `cars` array in `CarSelection.vue`
2. Create a new car model function in `Car.js`
3. Add new car properties to the `Car` class
4. Add new car assets to the `public` folder
5. Add new car to the `Car` class