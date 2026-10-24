/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product images are hosted by the retailers. Add each retailer's image
    // host here as you get approved, or Next will refuse to optimise them.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // One address for the whole site. Without this, Google indexes some pages
  // at www.mattertheedit.com and others at mattertheedit.com and treats them
  // as two sites competing with each other.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.mattertheedit.com' }],
        destination: 'https://mattertheedit.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
