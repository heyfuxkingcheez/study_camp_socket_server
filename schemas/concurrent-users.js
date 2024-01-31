import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const concurrentUsersSchema = new Schema({
  count: { type: Number, required: true }, // 동시접속자 수
  timestamp: { type: Date, default: Date.now }, // 기록 시간
});

export default mongoose.model('ConcurrentUser', concurrentUsersSchema);
