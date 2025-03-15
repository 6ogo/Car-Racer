// src/main.js
import Vue from 'vue'
import App from './App'
import router from './router'

// Import our custom Three.js components
import ThreeComponents from './components/three'
Vue.use(ThreeComponents)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})