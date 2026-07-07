import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import serverless from 'serverless-http';
import { connectDB } from './src/config/database.js';
import app from './src/app.js';

let isConnected = false;

const connectIfNeeded = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

const handler = serverless(app);

export const main = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectIfNeeded();
  return handler(event, context);
};
