import mongoose from "mongoose";

const getMongoUri = () => {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  if (process.env.MONGO_URL && process.env.DB_NAME) {
    return `${process.env.MONGO_URL}${process.env.DB_NAME}`;
  }

  return "";
};

const fixIndexes = async () => {
  // Step 1: Drop old non-sparse index
  try {
    await mongoose.connection.collection("users").dropIndex("referralCode_1");
    console.log("✅ Old referralCode index dropped");
  } catch (e) {
    // Already dropped or doesn't exist
  }

  // Step 2: Re-create with sparse:true so null values are allowed
  try {
    await mongoose.connection
      .collection("users")
      .createIndex(
        { referralCode: 1 },
        { unique: true, sparse: true, background: true },
      );
    console.log("✅ referralCode sparse index created");
  } catch (e) {
    console.log("createIndex error:", e.message);
  }
};

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Database Connected");
    });

    const mongoUri = getMongoUri();

    if (
      !mongoUri.startsWith("mongodb://") &&
      !mongoUri.startsWith("mongodb+srv://")
    ) {
      throw new Error(
        "Invalid MongoDB connection string. Set MONGO_URI or MONGO_URL + DB_NAME in .env",
      );
    }

    await mongoose.connect(mongoUri);
    await fixIndexes();
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

export default connectDB;
