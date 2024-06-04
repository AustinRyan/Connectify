const { MongoClient } = require("mongodb");
const axios = require("axios");

const uri = proccess.env.MONGODB_URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fetchUniqueCoverPics(count) {
  const coverPics = [];
  try {
    const response = await axios.get(
      `https://source.unsplash.com/random/800x200?sig=${count}`
    );
    for (let i = 0; i < count; i++) {
      coverPics.push(`https://source.unsplash.com/random/800x200?sig=${i}`);
    }
  } catch (error) {
    console.error("Error fetching cover pictures:", error);
  }
  return coverPics;
}

async function updateCoverPics() {
  try {
    await client.connect();
    const database = client.db("SocialMediaNew");
    const users = database.collection("User");

    // Get the total number of users
    const userCount = await users.countDocuments();

    // Fetch unique cover pictures
    const coverPics = await fetchUniqueCoverPics(userCount);

    // Fetch all users
    const allUsers = await users.find().toArray();

    const updatePromises = allUsers.map((user, index) =>
      users.updateOne(
        { _id: user._id },
        { $set: { coverPic: coverPics[index] } }
      )
    );

    const result = await Promise.all(updatePromises);

    console.log(`${result.length} documents were updated.`);
  } catch (error) {
    console.error("Error updating cover pictures:", error);
  } finally {
    await client.close();
  }
}

updateCoverPics();
