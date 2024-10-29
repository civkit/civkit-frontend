module.exports = {
  // ... other config
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.cache = false;
    }
    return config;
  },
};
