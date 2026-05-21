/**
 * PM2 — proje kokunden: pm2 start deploy/ecosystem.config.cjs
 * veya backend icinden: pm2 start ../deploy/ecosystem.config.cjs
 */
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend');

module.exports = {
    apps: [
        {
            name: 'tekno',
            cwd: backendDir,
            script: 'server.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '600M',
            env: {
                NODE_ENV: 'production',
            },
            error_file: path.join(backendDir, 'logs', 'pm2-error.log'),
            out_file: path.join(backendDir, 'logs', 'pm2-out.log'),
            merge_logs: true,
            time: true,
        },
    ],
};
