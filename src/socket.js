import Attendance from '../schemas/attendance.js';
import ConcurrentUser from '../schemas/concurrent-users.js';
import schedule from 'node-schedule';
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

    updateConnectedUsersCount();
    socket.on('disconnect', async () => {
      console.log(socket.id, ' user disconnected');
      const userdata = userMap.get(socket.id);
      connectedUsers = connectedUsers.filter((user) => user !== socket.id);

      if (userdata.spaceId) {
        const now = new Date(); // 현재 UTC 시간
        const koreaTimeNow = new Date(now.getTime() + 9 * 60 * 60000); // 한국 시간으로 변환

        // 사용자의 가장 최근 출석 기록을 찾음
        const lastAttendance = await Attendance.findOne({
          memberId: userdata.memberId,
          spaceId: userdata.spaceId,
        }).sort({ entryTime: -1 });

        if (lastAttendance) {
          const lastExitDate = lastAttendance.exitTime
            ? new Date(lastAttendance.exitTime)
            : null;
          const koreaTimeLastExit = lastExitDate
            ? new Date(lastExitDate.getTime() + 9 * 60 * 60000)
            : null; // 한국 시간으로 변환

          // 퇴실 시간이 같은 날짜에 속하는지 확인
          if (
            !koreaTimeLastExit ||
            (koreaTimeLastExit.getUTCDate() === koreaTimeNow.getUTCDate() &&
              koreaTimeLastExit.getUTCMonth() === koreaTimeNow.getUTCMonth() &&
              koreaTimeLastExit.getUTCFullYear() ===
                koreaTimeNow.getUTCFullYear())
          ) {
            // 동일한 날짜 내에서 연결이 끊긴 경우, 현재 시간을 퇴실 시간으로 설정
            lastAttendance.exitTime = now;
            await lastAttendance.save();
          }
        }

        socketIo.sockets
          .to(`space ${userdata.spaceId}`)
          .emit('leaveSpace', userdata);
      }

      userMap.delete(socket.id);
      updateConnectedUsersCount();
    });

    socket.on('joinSpace', async (data) => {
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

      const now = new Date(); // 현재 UTC 시간

      // 사용자의 가장 최근 출석 기록을 찾음
      const lastAttendance = await Attendance.findOne({
        memberId: userdata.memberId,
        spaceId: userdata.spaceId,
      }).sort({ entryTime: -1 });

      if (lastAttendance) {
        const lastEntryDate = new Date(lastAttendance.entryTime);

        // UTC 기준 날짜가 변경되었는지 확인
        if (
          lastEntryDate.getUTCDate() !== now.getUTCDate() ||
          lastEntryDate.getUTCMonth() !== now.getUTCMonth() ||
          lastEntryDate.getUTCFullYear() !== now.getUTCFullYear()
        ) {
          // 퇴실 시간 업데이트 (전날 23:59:59 UTC)
          lastAttendance.exitTime = new Date(
            Date.UTC(
              lastEntryDate.getUTCFullYear(),
              lastEntryDate.getUTCMonth(),
              lastEntryDate.getUTCDate(),
              23,
              59,
              59,
            ),
          );
          await lastAttendance.save();

          // 새 출석 기록 생성
          const newAttendance = new Attendance({
            spaceId: userdata.spaceId,
            memberId: userdata.memberId,
            nickName: userdata.nickName,
            entryTime: now,
          });
          await newAttendance.save();
        }
      } else {
        // 새 출석 기록 생성
        const newAttendance = new Attendance({
          spaceId: userdata.spaceId,
          memberId: userdata.memberId,
          nickName: userdata.nickName,
          entryTime: now,
        });
        await newAttendance.save();
      }

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
        console.log('room', room);
        if (room !== socket.id && !room.includes('space')) {
          socket.leave(room);
        }
      }
      console.log('socket.rooms: ', socket.rooms);
      socket.join(data.room);
      socketIo.sockets.to(data.room).emit('chatInGroup', {
        message: data.message,
        senderSocketId: data.senderId,
        senderNickName: data.nickName,
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

  // 1분 간격으로 동시접속자 수를 데이터베이스에 저장
  schedule.scheduleJob('*/1 * * * *', function () {
    const concurrentUsersRecord = new ConcurrentUser({
      count: connectedUsers.length, // 직접 connectedUsers 배열의 길이를 사용합니다.
    });
    concurrentUsersRecord
      .save()
      .then(() =>
        console.log(
          `Saved ${connectedUsers.length} concurrent users at ${new Date().toISOString()}`,
        ),
      )
      .catch((err) => console.error(err));
  });

  // 연결된 사용자 수를 업데이트하는 함수
  function updateConnectedUsersCount() {
    // connectedUsers 배열의 길이를 사용하여 현재 연결된 사용자 수를 설정합니다.
    console.log(`Current connected users: ${connectedUsers.length}`);
  }
}
