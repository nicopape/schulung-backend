module.exports = {
  apps: [
    {
      name: 'schulung-api',
      script: 'dist/server.js',

      // Default-Env (z.B. für 'pm2 start ecosystem.config.js')
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_USER: process.env.DB_USER || 'bummeltech',
        DB_PASS: process.env.DB_PASS || 'Hj/-TPQVDevTbukK/4E9TCJ5pMVCmoE4',
        DB_NAME: process.env.DB_NAME || 'schulung_bummeltech'
      },

      // Production-Env (für 'pm2 start ... --env production')
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_USER: process.env.DB_USER || 'bummeltech',
        DB_PASS: process.env.DB_PASS || 'Hj/-TPQVDevTbukK/4E9TCJ5pMVCmoE4',
        DB_NAME: process.env.DB_NAME || 'schulung_bummeltech'
      }
    }
  ]
}
