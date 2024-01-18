export default function socket(socketIo) {
  let userMap = new Map();

  socketIo.on('connection', (socket) => {
    console.log(socket.id, 'user connected');
    const userdata = {
      id: socket.id,
      nickname: '닉네임',
      x: 1,
      y: 1,
      isSit: false,
    };
    userMap.set(socket.id, userdata);
    console.log([...userMap.values()]);

    socket.on('updateSpace', (data) => {
      socketIo.sockets.emit('updateSpaceUsers', [...userMap.values()]);
    });

    socket.on('disconnect', () => {
      console.log(socket.id, ' user disconnected');
      const userdata = userMap.get(socket.id);
      userMap.delete(socket.id);

      socketIo.sockets.emit('leavSpace', userdata);
    });

    socket.on('joinSpace', (data) => {
      const userdata = userMap.get(socket.id);
      userdata.x = data.x;
      userdata.y = data.y;
      userMap.set(socket.id, userdata);
      socketIo.sockets.emit('joinSpacePlayer', userdata);
    });

    socket.on('move', (data) => {
      const userdata = userMap.get(data.id);
      userdata.x = data.x;
      userdata.y = data.y;
      userMap.set(data.id, userdata);
      socketIo.sockets.emit('movePlayer', userdata);
    });

    socket.on('sit', (data) => {
      const userdata = userMap.get(data.id);
      userdata.isSit = data.isSit;
      userMap.set(data.id, userdata);
      socketIo.sockets.emit('sitPlayer', userdata);
    });

    socket.on('chat', (data) => {
      // id, message
      socketIo.sockets.emit('chatPlayer', {
        id: socket.id,
        message: data.message,
      });
    });
  });
}
