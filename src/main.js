// src/main.js
import Vue from 'vue'
import App from './App'
import router from './router'

import VueThreejs from 'vue-threejs'
Vue.use(VueThreejs)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})