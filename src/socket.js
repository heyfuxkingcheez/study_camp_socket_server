import AllChat from '../schemas/all-chat.js';
import DirectMessage from '../schemas/direct-message.js';
import { configDotenv } from 'dotenv';
import jwt from 'jsonwebtoken';
configDotenv();

export default function socket(socketIo) {
  let userMap = new Map();
  let connectedUsers = [];

  socketIo.on('connection', (socket) => {
    socket.join('outLayer');
    console.log(socket.id, 'user connected');
    //유저데이터에 memberId를 추가했다.
    const userdata = {
      id: socket.id,
      spaceId: 0,
      nickName: '닉네임',
      memberId: 0,
      x: 1,
      y: 1,
      skin: 0,
      face: 0,
      hair: 0,
      hair_color: 0,
      clothes: 0,
      clothes_color: 0,
      isSit: false,
      memberId: 0,
    };
    userMap.set(socket.id, userdata);
    connectedUsers.push(socket.id);
    console.log([...userMap.values()]);

    socket.on('disconnect', () => {
      console.log(socket.id, ' user disconnected');
      const userdata = userMap.get(socket.id);
      connectedUsers = connectedUsers.filter((user) => user !== socket.id);

      if (userdata.spaceId) {
        socketIo.sockets
          .to(`space ${userdata.spaceId}`)
          .emit('leaveSpace', userdata);
      }
      userMap.delete(socket.id);

      socketIo.sockets
        .to(`space ${userdata.spaceId}`)
        .emit('disconnected', socket.id);
    });

    socket.on('joinSpace', (data) => {
      //JWT토큰을 해석해서 member_id를 넣어라.
      //이건 좀 생각해봐야겠다.
      //엑세스 토큰 받음
      //accessToken의 sub값이 userId값이다.
      //여기서 conflict났다.
      console.log('joinSpace:', data);
      console.log('데이타 받음', data);
      const userdata = userMap.get(socket.id);
      userdata.nickName = data.nickName;
      userdata.spaceId = data.spaceId;
      userdata.memberId = data.memberId;
      userdata.x = data.x;
      userdata.y = data.y;
      //userdata.memberId = jwt.decode(data.accessToken).sub;
      userdata.skin = data.skin;
      userdata.face = data.face;
      userdata.hair = data.hair;
      userdata.hair_color = data.hair_color;
      userdata.clothes = data.clothes;
      userdata.clothes_color = data.clothes_color;
      userMap.set(socket.id, userdata);
      socket.join(`space ${data.spaceId}`);
      socketIo.sockets
        .to(`space ${data.spaceId}`)
        .emit('joinSpacePlayer', userdata);
      const spaceUsers = [...userMap.values()].filter(
        (user) => user.spaceId === data.spaceId,
      );
      socket.emit('spaceUsers', spaceUsers);
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

    socket.on('updateSkin', (data) => {
      const userdata = userMap.get(data.id);
      userdata.skin = data.skin;
      userdata.face = data.face;
      userdata.hair = data.hair;
      userdata.hair_color = data.hair_color;
      userdata.clothes = data.clothes;
      userdata.clothes_color = data.clothes_color;
      userMap.set(data.id, userdata);
      socketIo.sockets
        .to(`space ${userdata.spaceId}`)
        .emit('updateSkinPlayer', userdata);
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
    socket.on('requestUserList', () => {
      console.log(`requestUserList : 웹브라우저에서 보내는 메시지는 없음`);
      socket.emit('update-user-list', { userIds: connectedUsers });
      socket.broadcast.emit('update-user-list', { userIds: connectedUsers });
      console.log(
        `update-user-list 나를 제외한 유저들에게 업데이트된 유저 리스트 담아서 보냄`,
      );
    });

    socket.on('mediaOffer', (data) => {
      console.log('mediaOffer : 웹브라우저에서 내가 만든 offer 메시지 받음');
      socket.to(data.to).emit('mediaOffer', {
        from: data.from,
        offer: data.offer,
      });
      console.log('mediaOffer : 다른 유저에게 offer 메시지 웹브라우저로 보냄');
    });

    socket.on('mediaAnswer', (data) => {
      console.log('mediaAnswer : 웹브라우저에서 내가 만든 answer 메시지 받음');
      socket.to(data.to).emit('mediaAnswer', {
        from: data.from,
        answer: data.answer,
      });
      console.log('mediaAnswer 다른 유저에게 answer 메시지 웹브라우저로 보냄');
    });

    socket.on('iceCandidate', (data) => {
      console.log(
        'iceCandidate : 웹브라우저에서 내가 만든 SDP ice candidate 받음',
      );
      socket.to(data.to).emit('remotePeerIceCandidate', {
        from: data.from,
        candidate: data.candidate,
      });
      console.log('remotePeerIceCandidate : 다른 유저한테 candidate 보냄');
    });
  });
}
