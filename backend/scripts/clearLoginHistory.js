const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/config.env') });

const clearLoginHistory = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('../models/User');
    const users = await User.find({});

    for (const user of users) {
      const userDbName = `trackly_user_${user._id}`;
      const userConn = mongoose.createConnection(`${process.env.MONGODB_URI.substring(0, process.env.MONGODB_URI.lastIndexOf('/') + 1)}${userDbName}`);
      
      await new Promise((resolve) => userConn.once('connected', resolve));
      
      const UserInfo = userConn.model('UserInfo', new mongoose.Schema({
        mainUserId: mongoose.Schema.Types.ObjectId,
        loginHistory: Array,
        emailHistory: Array,
        accountActivity: Array
      }));

      await UserInfo.updateOne(
        { mainUserId: user._id },
        { $set: { loginHistory: [], emailHistory: [], accountActivity: [] } }
      );

      console.log(`Cleared history for user: ${user.email}`);
      await userConn.close();
    }

    console.log('All login histories cleared!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

clearLoginHistory();
