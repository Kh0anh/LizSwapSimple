<div align="center">
  <h1>🦎 LizSwapSimple</h1>
  <p><strong>A Minimalist Decentralized Exchange (DEX) Prototype on Binance Smart Chain</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Solidity-%5E0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity" />
    <img src="https://img.shields.io/badge/Next.js-Static_Export-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/Hardhat-Ethereum_Tooling-blue?style=for-the-badge&logo=ethereum&logoColor=white" alt="Hardhat" />
    <img src="https://img.shields.io/badge/BSC-Binance_Smart_Chain-F3BA2F?style=for-the-badge&logo=binance&logoColor=white" alt="BSC" />
  </p>
</div>

---

## 📖 Giới Thiệu

**LizSwapSimple** 🦎 là đồ án môn học Công nghệ Chuỗi khối (Blockchain Technology) tại Trường Đại học Nam Cần Thơ. Dự án mô phỏng một Sàn giao dịch phi tập trung (DEX) trực quan dựa trên giao thức tạo lập thị trường tự động (AMM).

Mục tiêu của dự án là thiết kế và phát triển một nguyên mẫu DEX có khả năng hoạt động thực tế với các chức năng trọng tâm nhất, chạy trên nền tảng mạng tương thích EVM **Binance Smart Chain (BSC)**. Hệ thống bao gồm các hợp đồng thông minh (Smart Contracts) cốt lõi thiết kế qua Hardhat và một ứng dụng Frontend tĩnh tốc độ cao bằng Next.js.

---

## ⚡ Các Tính Năng Cốt Lõi

- **🔄 Hoán Đổi (Swap)**: Giao dịch qua lại giữa các cặp Token tiền điện tử dựa theo công thức hằng số bảo toàn thanh khoản ($x \times y = k$).
- **💧 Cung Cấp Thanh Khoản (Add Liquidity)**: Nạp một cặp Token bất kỳ vào Pool thanh khoản của giao thức và nhận lại biên nhận (LP Token) tương ứng để sinh lợi nhuận phí.
- **🔥 Rút Thanh Khoản (Remove Liquidity)**: Hoàn trả (đốt/burn) LP Token để rút lại số dư tài sản đóng góp tương ứng tỷ trọng ở thời điểm hiện tại.

---

## 🚀 Hướng Dẫn Triển Khai (Deployment Guide)

Luồng triển khai của hệ thống được thiết kế tối ưu hóa tính độc lập thông qua Docker đóng gói hoặc chạy local với Node.js.

### 🛠️ Bước 1: Thiết lập Thông số Môi Trường

Khởi tạo cấu hình trỏ tới Blockchain Network thông qua biến môi trường:

```bash
cp .env.example .env
```

Mở file `.env` mới sinh ra và cập nhật các thông số cần thiết:
- `NEXT_PUBLIC_RPC_URL`: Điền Endpoint (RPC) kết nối đến Binance Smart Chain (áp dụng cho Mainnet hoặc Testnet) để hệ tĩnh có thể đọc dữ liệu Web3.
- `NEXT_PUBLIC_ROUTER_ADDRESS`: Địa chỉ triển khai Smart Contract của Router ngoại vi.
- `NEXT_PUBLIC_FACTORY_ADDRESS`: Địa chỉ triển khai Smart Contract của Factory tạo Pool.

### ⛓️ Bước 2: Triển Khai Smart Contract (Dành cho Developer)

Cài đặt packages và chạy lệnh triển khai Hardhat (lưu ý bạn cần cấu hình Private Key của ví vào biến môi trường `.env` theo chuẩn Hardhat trước tiên):

```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network bscTestnet
```

> **Mẹo:** Nếu bạn chỉ chạy test trên môi trường Hardhat Local, hãy mở thêm 1 tab terminal khác và chạy `npx hardhat node`. Cuối cùng, vui lòng sao chép lại Address hiển thị sau lệnh deploy để thay vào file `.env` ở Bước 1.

### 🐳 Bước 3: Khởi Chạy Frontend Web Bằng Docker

Chỉ định chạy 1 dòng command Compose dưới đây để giao engine tự động build bộ file tĩnh Next.js và chạy Frontend Container:

```bash
docker compose up -d --build
```
Truy cập và sử dụng dịch vụ DEX thông qua trình duyệt tại: **[http://localhost](http://localhost)** (host port `80`, có thể đổi qua biến `HTTP_PORT` trong `.env`).

### 🔐 Bước 4 (Tùy chọn): Bật HTTPS với SSL trên cổng 443

Để bật SSL nhanh bằng Nginx, chuẩn bị thư mục chứng chỉ:

```text
ssl/
├── fullchain.pem
└── privkey.pem
```

Sau đó chạy compose với file override SSL:

```bash
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d --build
```

Khi đó ứng dụng sẽ chạy qua HTTPS tại: **[https://localhost](https://localhost)** (host port `443`, có thể đổi qua biến `HTTPS_PORT`).

---

## 📚 Tài Liệu Kỹ Thuật (Architecture Docs)

Dự án có đi kèm với bộ đặc tả yêu cầu siêu chi tiết. Tra cứu tại thư mục `docs/`:

- 📋 **[Đặc Tả Yêu Cầu Phần Mềm (SRS)](docs/srs.md)**
- 🏗️ **[Kiến Trúc Hệ Thống (Mô Hình C4)](docs/architecture.md)**
- 🗄️ **[Cấu Trúc Thư Mục (Project Structure)](docs/architecture/project-structure.md)**
- 💻 **[Ngăn Xếp Công Nghệ (Tech Stack)](docs/architecture/techstack.md)**
- 🎨 **[Giao Diện Cảm Quan UI/UX (Frontend Design)](docs/architecture/frontend-design.md)**

---

## 👥 Nhóm Phát Triển

| Thành viên | GitHub |
| :--- | :--- |
| **Trần Nguyễn Chí Khanh** | [@Kh0anh](https://github.com/Kh0anh) |
| **Võ Nguyễn Gia Huy** | [@studywithhuyne](https://github.com/studywithhuyne) |
| **Lâm Hòa Hộp** | [@lhh224](https://github.com/lhh224) |
