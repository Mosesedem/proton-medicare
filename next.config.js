/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "cdn.iconscout.com",
      "v2.protonmedicare.com",
      "skydd.ng",
      "cdn.jsdelivr.net",
    ], // Add this line
  },
};

module.exports = nextConfig;
