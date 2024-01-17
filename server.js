import express from 'express';
import { createServer } from 'node:http';
import { configDotenv } from 'dotenv';
import { Server } from 'socket.io';
import cors from 'cors';
import socket from './src/socket.js';

configDotenv();

const app = express();
const server = createServer(app);

app.use(
  cors({
    origin: process.env.CLIENT,
    credentials: true,
  }),
);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT,
    credentials: true,
  },
});

socket(io);

server.listen(process.env.PORT, () => {
  console.log(`run`);
});
