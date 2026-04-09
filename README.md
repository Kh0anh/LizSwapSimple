# LizSwapSimple

## 📖 Giới Thiệu
LizSwapSimple là đồ án môn học Công nghệ Chuỗi khối (Blockchain Technology) tại Trường Đại học Nam Cần Thơ. Dự án mô phỏng một Sàn giao dịch phi tập trung (DEX) dựa trên giao thức tạo lập thị trường tự động (AMM).

Mục tiêu của dự án là thiết kế và phát triển một nguyên mẫu DEX có khả năng hoạt động thực tế với các chức năng trọng tâm nhất, chạy trên nền tảng mạng Binance Smart Chain (BSC). Dự án bao gồm các hợp đồng thông minh (Smart Contracts) cốt lõi thiết kế qua Hardhat và một ứng dụng Frontend tĩnh trực quan bằng Next.js.

### 👥 Nhóm Phát Triển
| Thành viên | GitHub |
| --- | --- |
| Trần Nguyễn Chí Khanh | [@Kh0anh](https://github.com/Kh0anh) |
| Võ Nguyễn Gia Huy | [@studywithhuyne](https://github.com/studywithhuyne) |
| Lâm Hòa Hộp | [@lhh224](https://github.com/lhh224) |

---

## ⚡ Các Tính Năng Cốt Lõi
- **Hoán Đổi (Swap)**: Giao dịch qua lại giữa các cặp Token tiền điện tử dựa theo công thức hằng số bảo toàn thanh khoản ($x \times y = k$).
- **Cung Cấp Thanh Khoản (Add Liquidity)**: Nạp một cặp Token bất kỳ vào Pool thanh khoản của giao thức và nhận lại biên nhận (LP Token) tương ứng để sinh lợi nhuận phí.
- **Rút Thanh Khoản (Remove Liquidity)**: Hoàn trả (đốt/burn) LP Token để rút lại số tài sản đóng góp tương ứng.

## 🚀 Hướng Dẫn Triển Khai (Deployment Guide)

Luồng triển khai của hệ thống được thiết kế tối ưu thông qua tính năng đóng gói môi trường của Docker hoặc triển khai local với Node.js.

### Bước 1: Thiết lập Thông số Môi Trường
Khởi tạo cấu hình trỏ tới Blockchain Network thông qua biến môi trường:
```bash
cp .env.example .env
```
Mở file `.env` mới sinh ra và cập nhật các thông số cần thiết:
- `NEXT_PUBLIC_RPC_URL`: Điền Endpoint (RPC) kết nối đến Binance Smart Chain (áp dụng cho Mainnet hoặc Testnet) để hệ tĩnh có thể đọc dữ liệu Web3.
- `NEXT_PUBLIC_ROUTER_ADDRESS`: Địa chỉ triển khai Smart Contract của Router.
- `NEXT_PUBLIC_FACTORY_ADDRESS`: Địa chỉ triển khai Smart Contract của Factory.

### Bước 2: Triển Khai Smart Contract (Dành cho Developer)
Cài đặt packages và chạy lệnh triển khai Hardhat (lưu ý bạn cần cài đặt Private key của ví vào `.env` config của hardhat trước):
```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network bscTestnet
```
Nếu bạn chỉ chạy test môi trường Hardhat Local, mở thêm 1 tab terminal khác chạy `npx hardhat node`. Cuối cùng, vui lòng sao chép lại Address hiển thị sau lệnh deploy để thay vào file `.env` ở Bước 1.

### Bước 3: Khởi Chạy Frontend Web Bằng Docker Compose
Chỉ định 1 dòng command Compose dưới đây để tự build file tĩnh Next.js và khởi chạy:
```bash
docker-compose up -d --build
```
Truy cập và giao dịch DEX trực tiếp thông qua trình duyệt tại: `http://localhost:3000`

## 📚 Tài Liệu Kỹ Thuật Đi Kèm

Tra cứu chi tiết về kiến trúc (Architecture C4) và bộ đặc tả yêu cầu (SRS) tại thư mục `docs/`:
- [Đặc Tả Yêu Cầu Phần Mềm (SRS)](docs/srs.md)
- [Kiến Trúc Hệ Thống (C4 Model)](docs/architecture.md)
