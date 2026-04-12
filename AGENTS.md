# AI Agent Context & Strict Guidelines cho LizSwapSimple

## 🚨 MỆNH LỆNH BẮT BUỘC DÀNH CHO AI AGENT (MANDATORY INSTRUCTION)
**DỪNG LẠI! Trước khi thực thi bất cứ yêu cầu nào (dù là tạo code, sửa code hay chạy lệnh máy tính), bạn BẮT BUỘC PHẢI sử dụng công cụ đọc nội dung các file tài liệu thiết kế của dự án.** 

Mọi quy chuẩn về kiến trúc, biến môi trường hay thiết kế đều đã được chốt cố định. Bất kì mã nguồn nào được sinh ra mà không tuân thủ các tài liệu này đều bị tính là vi phạm nguyên tắc lõi.

### Danh mục File Tài liệu Bắt Buộc Đọc:
Bạn phải tìm hiểu kỹ bối cảnh bằng cách đọc các file lưu trong thư mục `docs/` sau:
1. `docs/srs.md` - Đích thị cấu trúc, số lượng API, và mã luồng định danh Use Cases & Yêu cầu (`[UC]`, `[FR]`, `[NFR]`). Tuyệt đối không vẽ thêm tính năng ngoài luồng này.
2. `docs/architecture/techstack.md` - Danh sách gói thư viện bắt buộc. Không tự ý dùng chuẩn cũ hay công nghệ ngoài luồng (Phải dùng Solidity `0.8.20+`, `ethers.js v6`, `Hardhat`, `shadcn/ui`, `Next.js` Web tĩnh).
3. `docs/architecture/project-structure.md` - Sơ đồ chi tiết thiết kế thư mục. Mọi component code hay file config cấu hình PHẢI nằm đúng vị trí trong cây thư mục được chỉ định ở đây.
4. `docs/architecture/c4-context.md`, `c4-container.md`, `c4-component.md` - Thiết kế giới hạn Module và cách chúng gọi nhau.
5. `docs/architecture/frontend-design.md` - Quy chuẩn thiết kế UI/UX giao diện (Light Mode mặc định, màu Xanh Nước Biển Sáng, sử dụng duy nhất font JetBrains Mono). Agent phải đọc file này để đồng nhất màu sắc và custom component khi code Frontend.
6. `docs/project-management/master-plan.md` - Bảng điều khiển dự án (Master Plan). Phải đọc file này để xem lộ trình các Phase. Các chi tiết task mã nguồn nằm trong thư mục `docs/project-management/tasks/*.md`, Agent cần dò map số WBS ID bên trong Master Plan để mở/đọc task tương ứng trước khi tiến hành code.

---

## 📖 Tổng quan nhanh về Dự án
**LizSwapSimple** là một mô hình nguyên mẫu DEX (Decentralized Exchange) chạy trên hệ sinh thái Binance Smart Chain, cắt gọn dựa trên tinh hoa của thuật toán AMM Uniswap V2 định hướng cho giới học thuật (Trường ĐH Nam Cần Thơ).

### Ba Quy Tắc Code Xương Sống:
1. **Serverless Static-Only**: Hệ thống hoạt động theo tiêu chí `[NFR-01]` và `[NFR-02]`. Thiết kế Next.js bắt buộc phải hỗ trợ build ra trang tĩnh hoàn toàn với Node hoặc Nginx trên Docker. Cấm sáng tạo thêm Backend, cấm tạo Database. Mọi luồng truy xuất dữ liệu là call RPC đến thẳng mạng lưới blockchain.
2. **Standard Upgrades (Nâng cấp chuẩn)**: Bản thân lõi Uniswap V2 sử dụng Solidity `< 0.6`. Tuy nhiên, mọi mã nguồn viết ra cho Smart Contract của LizSwapSimple phải được dịch và biên soạn lại bảo mật bằng **Solidity >= 0.8.20**, có tích hợp **OpenZeppelin** (ví dụ Module `ReentrancyGuard`, `ERC20`).
3. **Truy Xét Tag Code**: Trong quá trình giải thích về luồng code UI hay Smart Contract cho lập trình viên, agent được yêu cầu phải chú thích rõ đoạn code đó đang giải quyết cho `[UC-XX]` hay `[FR-XX]` nào theo tài liệu `srs.md`.

*Agent: Hãy xác nhận lại với người dùng rằng bạn đã nắm và scan đọc đủ các tài liệu trước khi bước vào quy trình bắt đầu generate mã nguồn Phase 1.*
