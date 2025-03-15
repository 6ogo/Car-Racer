// src/main.js
import Vue from 'vue'
import App from './App'
import router from './router'

// Remove VueThreejs - we'll use direct Three.js integration
// import VueThreejs from 'vue-threejs'
// Vue.use(VueThreejs)

// Simple component registration for Three.js elements
// These are minimal wrappers that won't cause initialization errors
Vue.component('renderer', {
  props: ['obj', 'size'],
  template: '<div ref="container"><slot></slot></div>',
  mounted() {
    if (this.obj && this.$refs.container) {
      this.$refs.container.appendChild(this.obj.domElement);
      if (this.size) {
        this.obj.setSize(this.size.w, this.size.h);
      }
    }
  }
});

Vue.component('scene', {
  props: ['obj'],
  template: '<div style="display:none"><slot></slot></div>',
  provide() {
    return {
      scene: this.obj
    }
  }
});

Vue.component('camera', {
  props: ['obj', 'position'],
  template: '<div style="display:none"></div>',
  inject: ['scene'],
  watch: {
    position: {
      handler(newVal) {
        if (this.obj && newVal) {
          this.obj.position.set(newVal.x || 0, newVal.y || 0, newVal.z || 0);
        }
      },
      deep: true
    }
  },
  mounted() {
    if (this.obj && this.position) {
      this.obj.position.set(this.position.x || 0, this.position.y || 0, this.position.z || 0);
    }
  }
});

Vue.component('object3d', {
  props: ['obj', 'position', 'rotation', 'scale'],
  template: '<div style="display:none"><slot></slot></div>',
  inject: ['scene'],
  mounted() {
    if (this.scene && this.obj) {
      this.scene.add(this.obj);
      this.updateTransform();
    }
  },
  beforeDestroy() {
    if (this.scene && this.obj) {
      this.scene.remove(this.obj);
    }
  },
  watch: {
    position: {
      handler() { this.updateTransform(); },
      deep: true
    },
    rotation: {
      handler() { this.updateTransform(); },
      deep: true
    },
    scale: {
      handler() { this.updateTransform(); },
      deep: true
    }
  },
  methods: {
    updateTransform() {
      if (!this.obj) return;
      
      if (this.position) {
        this.obj.position.set(
          this.position.x || 0,
          this.position.y || 0,
          this.position.z || 0
        );
      }
      
      if (this.rotation) {
        this.obj.rotation.set(
          this.rotation.x || 0,
          this.rotation.y || 0,
          this.rotation.z || 0
        );
      }
      
      if (this.scale) {
        if (typeof this.scale === 'number') {
          this.obj.scale.set(this.scale, this.scale, this.scale);
        } else {
          this.obj.scale.set(
            this.scale.x || 1,
            this.scale.y || 1,
            this.scale.z || 1
          );
        }
      }
    }
  }
});

Vue.component('light', {
  props: ['obj', 'position'],
  template: '<div style="display:none"></div>',
  inject: ['scene'],
  mounted() {
    if (this.scene && this.obj) {
      this.scene.add(this.obj);
      this.updatePosition();
    }
  },
  beforeDestroy() {
    if (this.scene && this.obj) {
      this.scene.remove(this.obj);
    }
  },
  watch: {
    position: {
      handler() { this.updatePosition(); },
      deep: true
    }
  },
  methods: {
    updatePosition() {
      if (!this.obj || !this.position) return;
      
      this.obj.position.set(
        this.position.x || 0,
        this.position.y || 0,
        this.position.z || 0
      );
    }
  }
});

Vue.component('animation', {
  props: ['fn'],
  template: '<div style="display:none"></div>',
  data() {
    return {
      animationId: null
    };
  },
  mounted() {
    this.animate();
  },
  beforeDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  },
  methods: {
    animate() {
      if (this.fn) {
        this.fn();
      }
      this.animationId = requestAnimationFrame(this.animate);
    }
  }
});

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})