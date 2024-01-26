import mongoose from 'mongoose';
import { Schema } from 'mongoose';


//#TODO 다이렉트 메세지는 24시간 지나면 삭제하는 이유가 있나?
const DirectMessageSchema = new Schema(
  {
    //이건 소켓 ID이고 실제 ID를 가져와야 하는데
    //닉네임도 들고와야 하고
    sender_id: {
      required: true,
      type: Number,
    },
    getter_id: {
      required: true,
      type: Number,
    },
    message: {
      required: true,
      type: String,
    },
    sender_nick: {
      required: true,
      type: String,
    },
    getter_nick: {
      required: true,
      type: String,
    }
  },
  //{ timestamps: true },
);

// DirectMessageSchema.index(
//   { createdAt: 1 },
//   { expireAfterSeconds: 24 * 60 * 60 },
// );

export default mongoose.model('DirectMessage', DirectMessageSchema);
