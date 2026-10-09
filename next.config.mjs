/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product images are hosted by the retailers. Add each retailer's image
    // host here as you get approved, or Next will refuse to optimise them.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
