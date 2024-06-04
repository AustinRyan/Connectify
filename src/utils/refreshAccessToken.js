import axios from "axios";
import { signIn } from "next-auth/react";

export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post("/api/auth/refresh", { refreshToken });
    return response.data.accessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    await signIn();
  }
};
