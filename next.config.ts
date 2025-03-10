import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "s3.eu-west-2.amazonaws.com",
      "seller.rest",
      "lh3.googleusercontent.com",
    ],
    /* config options here */
  },
};

export default nextConfig;
