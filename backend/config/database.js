// MongoDB подключение
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("MONGODB_URI:", process.env.MONGODB_URI);
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB подключен: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Ошибка подключения MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
