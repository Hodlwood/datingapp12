/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
    domains: [
      'lh3.googleusercontent.com',  // Google Auth profile images
      'firebasestorage.googleapis.com',  // Firebase Storage images
      'storage.googleapis.com',
      'loveentrepreneurs-7c8a9.firebasestorage.app'
    ],
  },
  webpack: (config, { isServer }) => {
    // Add a rule to handle the undici module
    config.module.rules.push({
      test: /\.js$/,
      include: [
        /node_modules\/undici/,
        /node_modules\/@firebase\/storage/,
        /node_modules\/firebase/
      ],
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    });
    return config;
  }
};

module.exports = nextConfig 