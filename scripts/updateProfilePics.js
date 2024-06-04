const { MongoClient } = require("mongodb");
const axios = require("axios");

const uri = proccess.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fetchUniqueProfilePics(count) {
  const profilePics = [];
  try {
    const response = await axios.get(
      `https://randomuser.me/api/?results=${count}&inc=picture`
    );
    response.data.results.forEach((user) => {
      profilePics.push(user.picture.large);
    });
  } catch (error) {
    console.error("Error fetching profile pictures:", error);
  }
  return profilePics;
}

async function updateProfilePics() {
  try {
    await client.connect();
    const database = client.db("SocialMediaNew");
    const users = database.collection("User");

    // Get the total number of users
    const userCount = await users.countDocuments();

    // Fetch unique profile pictures
    const profilePics = await fetchUniqueProfilePics(userCount);

    // Fetch all users
    const allUsers = await users.find().toArray();

    const updatePromises = allUsers.map((user, index) =>
      users.updateOne(
        { _id: user._id },
        { $set: { profilePic: profilePics[index] } }
      )
    );

    const result = await Promise.all(updatePromises);

    console.log(`${result.length} documents were updated.`);
  } catch (error) {
    console.error("Error updating profile pictures:", error);
  } finally {
    await client.close();
  }
}

updateProfilePics();
