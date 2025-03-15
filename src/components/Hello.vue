// Create src/components/Hello.vue (missing file referenced in router)
// src/components/Hello.vue

<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>
      Welcome to the Car Racer game. Click below to start racing!
    </p>
    <router-link to="/" class="start-button">Start Game</router-link>
  </div>
</template>

<script>
export default {
  name: 'Hello',
  data() {
    return {
      msg: 'Car Racer'
    }
  }
}
</script>

<style scoped>
.hello {
  text-align: center;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(#e4e0ba, #f7d9aa);
}

h1 {
  font-size: 48px;
  margin-bottom: 30px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.start-button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 20px;
  margin-top: 40px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s, transform 0.3s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.start-button:hover {
  background-color: #45a049;
  transform: scale(1.05);
}
</style>