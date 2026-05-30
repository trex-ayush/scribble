import dns from 'node:dns';
// Force a public DNS resolver so MongoDB Atlas SRV/TXT lookups succeed even when
// the local/ISP resolver refuses them (the cause of querySrv ECONNREFUSED).
dns.setServers(['1.1.1.1', '8.8.8.8']);

import 'dotenv/config';
import app from './src/app.js';
import { connectDB } from './src/config/database.js';
import { env } from './src/config/env.js';

const start = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
