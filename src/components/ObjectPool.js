// src/components/ObjectPool.js
export default class ObjectPool {
    constructor(objectFactory, initialSize = 20) {
      this.objectFactory = objectFactory;
      this.pool = [];
      this.active = new Set();
      
      // Initialize pool with inactive objects
      this.grow(initialSize);
    }
    
    grow(size) {
      for (let i = 0; i < size; i++) {
        const obj = this.objectFactory();
        obj.visible = false;
        this.pool.push(obj);
      }
    }
    
    get() {
      // If pool is empty, grow it
      if (this.pool.length === 0) {
        this.grow(10);
      }
      
      // Get an object from the pool
      const obj = this.pool.pop();
      obj.visible = true;
      this.active.add(obj);
      return obj;
    }
    
    release(obj) {
      if (this.active.has(obj)) {
        this.active.delete(obj);
        obj.visible = false;
        // Reset object state if needed
        if (typeof obj.reset === 'function') {
          obj.reset();
        }
        this.pool.push(obj);
      }
    }
    
    update(deltaTime) {
      // Update all active objects
      this.active.forEach(obj => {
        if (typeof obj.update === 'function') {
          obj.update(deltaTime);
        }
      });
    }
    
    dispose() {
      // Dispose all objects (pool and active)
      [...this.pool, ...this.active].forEach(obj => {
        if (typeof obj.dispose === 'function') {
          obj.dispose();
        }
      });
      
      this.pool = [];
      this.active.clear();
    }
  }