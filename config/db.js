const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Connect without useNewUrlParser and useUnifiedTopology since they are defaults in driver v4
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
