import express from 'express';
import Attendance from '../../schemas/attendance.js';
import ConcurrentUser from '../../schemas/concurrent-users.js';

const router = express.Router();

// 출석로그
router.get('/attendance/:spaceId', async (req, res) => {
  try {
    const spaceId = req.params.spaceId;
    const attendanceLogs = await Attendance.find({ spaceId: spaceId }).sort({
      entryTime: -1,
    });
    res.json(attendanceLogs);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// 특정 사용자의 출석로그 조회
router.get('/attendance/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const attendanceLogs = await Attendance.find({ memberId: userId }).sort({
      entryTime: -1,
    });
    res.json(attendanceLogs);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// 특정 기간 동안의 동시접속자 기록을 조회하는 라우터
router.get('/concurrent-users', async (req, res) => {
  const { start, end } = req.query;

  try {
    const query = {
      timestamp: {
        $gte: new Date(start),
        $lte: new Date(end),
      },
    };
    const records = await ConcurrentUser.find(query).sort({ timestamp: 1 });
    res.json(records);
  } catch (error) {
    console.error('Error fetching concurrent users:', error); // 로깅 추가
    res.status(500).send(error.toString());
  }
});

// 날짜 목록을 반환하는 라우터
router.get('/get-dates', async (req, res) => {
  try {
    // 'timestamp' 필드의 모든 고유 날짜를 조회합니다.
    const dates = await ConcurrentUser.distinct('timestamp').exec();

    // 날짜를 'YYYY-MM-DD' 형식으로 변환
    const formattedDates = dates.map(
      (date) => date.toISOString().split('T')[0],
    );

    // 중복 제거
    const uniqueDates = [...new Set(formattedDates)];

    res.json(uniqueDates);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

export default router;
