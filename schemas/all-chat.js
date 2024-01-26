import mongoose from 'mongoose'
import {Schema} from 'mongoose'

const allChatSchema = new Schema({
  //이건 닉네임을 들고오네 근데 ID도 들고와보자.
  member_id: {
    required: true,
    type: Number,
  },
  nick_name: {
    required: true,
    type: String,
  },
  message: {
    required: true,
    type: String,
  },
  space_id: {
    required: true,
    type: Number,
  }
}, { timestamps: true })

allChatSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export default mongoose.model('AllChat', allChatSchema)