import mongoose from 'mongoose';

const connectToDatabase = () => {
  mongoose.connect(
    `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PW}@${process.env.MONGODB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  );

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'Connection error:'));
  db.once('open', function () {
    console.log('MongoDB connected!', mongoose.connection.db.databaseName);
  });

  return mongoose;
};

export default connectToDatabase;
