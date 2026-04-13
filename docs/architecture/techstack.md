# Ngăn Xếp Công Nghệ (Tech Stack)

> **Phiên bản:** v1 | **Ngày tạo:** 9 tháng 4 năm 2026 | **Tác giả:** Khanh

Tài liệu này xác định các công nghệ bắt buộc và tiêu chuẩn để thực hiện dự án **LizSwapSimple**, đảm bảo sự đồng bộ và tránh sai lệch cấu trúc giữa thiết kế và lập trình.

## 1. Mảng Smart Contract (Hợp Đồng Thông Minh)

Lõi vận hành thuật toán tạo lập thị trường AMM thay thế hoàn toàn cho máy chủ Backend.

*   **Ngôn Ngữ Lập Trình**: `Solidity` (Sử dụng phiên bản từ `^0.8.20` trở lên để đảm bảo an toàn với `SafeMath` mặc định và khả năng biên dịch tối ưu mới nhất).
*   **Môi Trường Phát Triển & Triển Khai**: `Hardhat` (Khung làm việc mạnh mẽ hỗ trợ test nội bộ `npx hardhat node` và viết deployment scripts nhanh bằng Typescript).
*   **Thư Viện Chuẩn & Bảo Mật**: `@openzeppelin/contracts` 
    *   Tái sử dụng chuẩn `ERC20` cho việc sinh/bơm LP Token.
    *   Sử dụng Module `ReentrancyGuard` để chống lỗi gửi tiền lặp vòng tấn công hệ thống thanh khoản.
    *   **Lưu ý**: Khác với Uniswap V2 gốc (code bằng tay mọi thứ), dự án này kế thừa OpenZeppelin để đáp ứng chuẩn an toàn bảo mật mới.

## 2. Mảng Dapp Frontend (Giao Diện Khách Hàng)

Tương tác trực tiếp với người dùng và chuỗi khối.

*   **Framework Lõi**: `Next.js` (Sử dụng tính năng Static Export để build ra file web tĩnh `HTML/CSS/JS`, giúp chạy nhẹ nhàng và độc lập mà không cần server render SSR phức tạp).
*   **Thư Viện Web3 & Tương Tác Chuỗi**: `ethers.js` (Phiên bản v6) - Có nhiệm vụ gọi RPC truy vấn số dư và gửi transaction với hệ thống Smart Contract.
*   **Kết Nối Ví**: Yêu cầu hỗ trợ `MetaMask` (EIP-1193 qua biến `window.ethereum`).
*   **Thiết Kế UI/UX**: Sử dụng `Tailwind CSS` kết hợp với hệ thống component của `shadcn/ui`. Shadcn/ui cung cấp giao diện đẹp, hiện đại, dễ bảo trì cho các tác vụ phức tạp của DEX (Modal, Toast UI cho trạng thái Transaction, Tooltip).

## 3. Mảng Infrastructure (Hạ Tầng Mạng Và Đóng Gói)

Luồng vận hành chuẩn hóa cấu trúc deploy.

*   **Mạng Chuỗi Khối (Target Network)**: `Binance Smart Chain`
    *   *Giai đoạn Code*: Dùng Local Hardhat Network.
    *   *Giai đoạn Test*: Dùng BSC Testnet.
    *   *Giai đoạn Đẩy*: Dùng BSC Mainnet (Thông qua điểm truy cập RPC cấu hình bằng `.env`).
*   **Đóng Gói Ứng Dụng (Containerization)**: `Docker` (Dockerfile Alpine/Node) kèm cấu hình `docker-compose.yml`. Mọi thứ sẽ được build sẵn mà không cần môi trường local phải có chung version Node.js, chỉ cần mở Docker Compose lên là Frontend sẽ phục vụ tại port `3000`.
