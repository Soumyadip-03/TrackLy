/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configure experimental features (helps with OneDrive/Windows issues)
  experimental: {
    // Use modern features
    forceSwcTransforms: true,
    isrFlushToDisk: false,
    disableOptimizedLoading: false,
  },
  
  // Increase timeout for builds
  staticPageGenerationTimeout: 180,
  
  // Configure webpack for better compatibility
  webpack: (config, { isServer }) => {
    // Fix for OneDrive/Windows path issues
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: /node_modules/,
    };
    
    return config;
  },
  
  // Disable image optimization if causing issues
  // images: {
  //   disableStaticImages: true,
  // },
  
  // Add any additional configuration here
};

module.exports = nextConfig;
