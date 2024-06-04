import dotenv from "dotenv";

dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["randomuser.me", "source.unsplash.com", "images.unsplash.com"],
  },

  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;
