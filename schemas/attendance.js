import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const attendanceSchema = new Schema({
  spaceId: { type: Number, required: true },
  memberId: { type: Number, required: true },
  // role: { type: Number, required: true },
  nickName: { type: String, required: true },
  entryTime: { type: Date, default: Date.now },
  exitTime: { type: Date },
  // createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Attendance', attendanceSchema);
