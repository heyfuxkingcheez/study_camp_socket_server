import AllChat from '../schemas/all-chat.js';
import DirectMessage from '../schemas/direct-message.js';
import { configDotenv } from 'dotenv';
import jwt from 'jsonwebtoken';
configDotenv();

export default function socket(socketIo) {
  let userMap = new Map();

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
    console.log([...userMap.values()]);

    socket.on('disconnect', () => {
      console.log(socket.id, ' user disconnected');
      const userdata = userMap.get(socket.id);

      if (userdata.spaceId) {
        socketIo.sockets
          .to(`space ${userdata.spaceId}`)
          .emit('leaveSpace', userdata);
      }
      userMap.delete(socket.id);
    });

    socket.on('joinSpace', (data) => {
      //JWT토큰을 해석해서 member_id를 넣어라.
      //이건 좀 생각해봐야겠다.
      //엑세스 토큰 받음
      //accessToken의 sub값이 userId값이다.
      //여기서 conflict났다.
      console.log('joinSpace:', data);
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
      //유저 맵 출력해서 값 확인
      console.log('usermap in allchat:', userMap.get(data.id));
      AllChat.create({
        nick_name: data.nickName,
        message: data.message,
        member_id: userMap.get(data.id).memberId,
        //#TODO {isTrusted: true}가 뜬다 일단 미뤄두자 이거 생각한다고 몇시간을쓰냐
        space_id: 9,
      });
    });
    //특정 플레이어에게 메세지를 보내야한다.
    socket.on('directMessageToPlayer', (data) => {
      socketIo.sockets.to(data.getterId).emit('directMessage', {
        senderId: data.senderId,
        message: data.message,
      });
      console.log('DMDATA=>', data);
      console.log('userMap in DMChat:', userMap);
      //userMap에서 이름을 가져와보자.
      //일단 테스트용도
      //출력이되는지좀 보자.
      //1번 게더 닉과 센더 닉이 없다.
      DirectMessage.create({
        sender_id: userMap.get(data.senderId).memberId,
        getter_id: userMap.get(data.getterId).memberId,
        message: data.message,
        getter_nick: data.getterNickName,
        sender_nick: data.senderNickName,
      });
    });

    socket.on('groupChat', (data) => {
      for (let room of socket.rooms) {
        //모든 Room을 끊는다. 이건 매우 위험한 짓이다. 하지만 이렇게 해야 한다.
        //나중에 문제가 되면 if문에 조건을 더 걸자.
        //실행가능하길 빌자
        console.log("room", room);
        if (room !== socket.id && !room.includes("space")) {
          socket.leave(room);
        }
      }
      console.log("socket.rooms: " ,socket.rooms)
      socket.join(data.room);
      socketIo.sockets.to(data.room).emit('chatInGroup', {
        message: data.message,
        senderSocketId: data.senderId,
        senderNickName: data.nickName,
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
