// pages/api/auth/signup.js
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import axios from "axios";

const prisma = new PrismaClient();

async function fetchRandomProfilePic() {
  try {
    const response = await axios.get("https://randomuser.me/api/?inc=picture");
    return response.data.results[0].picture.large;
  } catch (error) {
    console.error("Error fetching random profile picture:", error);
    // Fallback to a default profile picture if fetching fails
    return "https://randomuser.me/api/portraits/lego/0.jpg";
  }
}

async function fetchRandomCoverPic() {
  try {
    // Fetching a random cover picture from Unsplash
    const response = await axios.get(
      "https://source.unsplash.com/random/800x200"
    );
    return response.request.res.responseUrl; // Unsplash returns the image URL in the response
  } catch (error) {
    console.error("Error fetching random cover picture:", error);
    // Fallback to a default cover picture if fetching fails
    return "https://via.placeholder.com/800x200.png?text=Default+Cover+Picture";
  }
}

export default async (req, res) => {
  if (req.method === "POST") {
    const { email, password, name, username } = req.body;

    try {
      // Check if user already exists by email
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUserByEmail) {
        res.status(400).json({ error: "User already exists" });
        return;
      }

      // Check if username already exists
      const existingUserByUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUserByUsername) {
        res.status(400).json({ error: "Username already taken" });
        return;
      }

      // Fetch a random profile picture and cover picture
      const profilePic = await fetchRandomProfilePic();
      const coverPic = await fetchRandomCoverPic();

      // Hash password
      const hashedPassword = await hash(password, 10);

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          username,
          profilePic, // Add the profile picture to the user data
          coverPic, // Add the cover picture to the user data
        },
      });

      res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};
