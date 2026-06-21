import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

const requiredEnvs = ['MONGODB_URI', 'PORT'];

for (const envVar of requiredEnvs) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const config = {
  mongodbUri: process.env.MONGODB_URI,
  port: Number(process.env.PORT),
};

if (Number.isNaN(config.port) || config.port <= 0) {
  throw new Error('PORT environment variable must be a positive number');
}

export default config;
