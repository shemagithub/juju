const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function setupProxy(app) {
  const target = String(process.env.REACT_APP_API_URL || 'http://localhost:4000').replace(/\/$/, '')

  app.use(
    ['/api', '/uploads', '/health'],
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: true,
    }),
  )
}
