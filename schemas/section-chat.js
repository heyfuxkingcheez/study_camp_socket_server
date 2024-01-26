import mongoose from 'mongoose'
import {Schema} from 'mongoose'

const UserSchema = new Schema({})

export default mongoose.model('users', UserSchema)