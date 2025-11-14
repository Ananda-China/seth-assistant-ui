/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  // 生成唯一的构建ID，确保每次部署都会更新客户端缓存
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  // 添加缓存控制头
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;


