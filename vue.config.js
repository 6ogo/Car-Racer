module.exports = {
    publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
    assetsDir: 'assets',
    productionSourceMap: false,
    lintOnSave: false, // Disable linting during build
    configureWebpack: {
      performance: {
        hints: false
      }
    }
  }