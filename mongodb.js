import mongoose from 'mongoose';

const connectToDatabase = () => {
  mongoose.connect(`mongodb+srv://studyCampOwner1234:${process.env.ATLASPASSWORD}@studycamp.urrwmga.mongodb.net/study_camp?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'Connection error:'));
  db.once('open', function () {
    console.log('MongoDB connected!',mongoose.connection.db.databaseName);
  });

  return mongoose;
};

export default connectToDatabase;