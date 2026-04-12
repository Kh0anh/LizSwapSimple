# Task 5.2: Docker Production Build & Verify

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** `[NFR-02]`
- **Task phụ thuộc:** Task 5.1
- **Đường dẫn File:** `Dockerfile`, `docker-compose.yml`

## Mô tả chi tiết công việc

1. Chạy `docker compose up --build`.
2. Verify Next.js static output serve thành công tại `localhost:3000`.
3. Verify `.env` variables inject đúng (contract addresses, RPC URL).
4. Test connect MetaMask + Swap trên Docker container.
5. Kiểm tra container size (target < 100MB cho alpine image).

## Đầu ra mong muốn

Docker image build thành công, app chạy hoàn chỉnh trong container.
