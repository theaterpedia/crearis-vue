module.exports = {
  apps: [{
    name: 'crearis-vue',
    cwd: '/opt/crearis/live',
    script: './.output/server/index.mjs',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3020,
      SKIP_MIGRATIONS: true,
      DB_USER: 'crearis_admin',
      DB_PASSWORD: 'uiISRqLvsf_Uq3YRH4bPuopYkhpBna3GP0LWLd7dsW6kig0WJrhbUQBQISJidznp',
      DB_NAME: 'crearis_production',
      DB_HOST: 'localhost',
      DB_PORT: '5432'
    },
    error_file: '/opt/crearis/logs/error.log',
    out_file: '/opt/crearis/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
