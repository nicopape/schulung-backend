// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'schulung-api',
      cwd: '/var/www/api/schulung',       // <— hier dein Projekt-Root
      script: 'npm',
      args: 'start',                      // <— ruft "npm start" auf, siehe package.json
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        DB_HOST: 'localhost',
        DB_USER: 'bummeltech',
        DB_PASS: 'Hj/-TPQVDevTbukK/4E9TCJ5pMVCmoE4',
        DB_NAME: 'schulung_bummeltech'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
        DB_HOST: 'localhost',
        DB_USER: 'bummeltech',
        DB_PASS: 'Hj/-TPQVDevTbukK/4E9TCJ5pMVCmoE4',
        DB_NAME: 'schulung_bummeltech'
      }
    }
  ]
}
