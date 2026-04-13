/** @type {import('next').NextConfig} */
const nextConfig = {
  // [NFR-02] Static Export: build ra file web tĩnh HTML/CSS/JS
  output: 'export',

  // [NFR-02] Tắt Image Optimization cho Static Export (không có server xử lý)
  images: { unoptimized: true },
};

export default nextConfig;
