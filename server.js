import express from 'express';
import { createServer } from 'node:http';
import { configDotenv } from 'dotenv';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import { Server } from 'socket.io';
import cors from 'cors';
import socket from './src/socket.js';
import connectToDatabase from './mongodb.js';
configDotenv();
connectToDatabase();

const app = express();
app.use(express.json());
const server = createServer(app);

app.use(
  cors({
    origin: process.env.CLIENT,
    credentials: true,
  }),
);

// 출석 관련 라우트 추가
app.use(attendanceRoutes);

app.use(express.static('back-office'));

const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT],
    credentials: true,
  },
});

socket(io);

server.listen(process.env.PORT, () => {
  console.log(`run`);
});
