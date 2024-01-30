import express from 'express';
import Attendance from '../../schemas/attendance.js';

const router = express.Router();

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

export default router;
