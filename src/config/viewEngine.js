// src/config/viewEngine.js
import express from 'express'; // Đảm bảo đã import express
import path from 'path'; // Để sử dụng path

// Cấu hình view engine
const configViewEngine = (app) => {
  // Logic cấu hình view engine, ví dụ sử dụng express.static
  const currentDir = path.resolve(); // Lấy đường dẫn hiện tại
  app.use(express.static(path.join(currentDir, 'public')));
  // Các cấu hình khác của view engine nếu có
};

export default configViewEngine;
