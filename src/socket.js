export default function socket(socketIo) {
  let userMap = new Map();

  socketIo.on('connection', (socket) => {
    console.log(socket.id, 'user connected');
    const userdata = {
      id: socket.id,
      spaceId: 0,
      nickName: '닉네임',
      x: 1,
      y: 1,
      isSit: false,
    };
    userMap.set(socket.id, userdata);
    console.log([...userMap.values()]);

    socket.on('disconnect', () => {
      console.log(socket.id, ' user disconnected');
      const userdata = userMap.get(socket.id);
      userMap.delete(socket.id);

      if (userdata.spaceId) {
        socketIo.sockets
          .to(`space ${userdata.spaceId}`)
          .emit('leaveSpace', userdata);
      }
    });

    socket.on('joinSpace', (data) => {
      const userdata = userMap.get(socket.id);
      userdata.nickName = data.nickName;
      userdata.spaceId = data.spaceId;
      userdata.x = data.x;
      userdata.y = data.y;
      userMap.set(socket.id, userdata);
      socket.join(`space ${data.spaceId}`);
      socketIo.sockets.emit('joinSpacePlayer', userdata);
      socket.emit('spaceUsers', [...userMap.values()]);
    });

    socket.on('move', (data) => {
      const userdata = userMap.get(data.id);
      userdata.x = data.x;
      userdata.y = data.y;
      userMap.set(data.id, userdata);
      socketIo.sockets
        .to(`space ${userdata.spaceId}`)
        .emit('movePlayer', userdata);
    });

    socket.on('sit', (data) => {
      const userdata = userMap.get(data.id);
      userdata.isSit = data.isSit;
      userMap.set(data.id, userdata);
      socketIo.sockets
        .to(`space ${userdata.spaceId}`)
        .emit('sitPlayer', userdata);
    });

    socket.on('chat', (data) => {
      // id, message
      socketIo.sockets.to(`space ${userdata.spaceId}`).emit('chatPlayer', {
        id: socket.id,
        nickName: data.nickName,
        message: data.message,
      });
    });

    // wecRTC
    // room
    socket.on('join', (roomId) => {
      let rooms = socketIo.sockets.adapter.rooms;
      console.log(rooms);

      let room = rooms.get(roomId);
      console.log(room);
      if (room === undefined) {
        socket.join(roomId);
        socket.emit('Room created', roomId);
      } else {
        socket.join(roomId);
        socket.emit('Room joined', roomId);
      }
      console.log(rooms);
    });

    // signaling server (stun / trun)
    socket.on('ready', (roomId) => {
      console.log('Ready');
      socket.broadcast.to(roomId).emit('ready');
    });

    socket.on('candidate', (candidate, roomId) => {
      console.log('Candidate');
      console.log(candidate);
      socket.broadcast.to(roomId).emit('candidate', candidate);
    });

    socket.on('offer', (offer, roomId) => {
      console.log('Offer');
      console.log(offer);
      socket.broadcast.to(roomId).emit('offer', offer);
    });

    socket.on('answer', (answer, roomId) => {
      console.log('Answer');
      socket.broadcast.to(roomId).emit('answer', answer);
    });
  });
}
