# Task 1.5: Cấu hình Docker & Docker Compose

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** `[NFR-02]` (Deploy dễ), project-structure.md §3
- **Task phụ thuộc:** Task 1.4
- **Đường dẫn File:** `Dockerfile`, `docker-compose.yml`

## Mô tả chi tiết công việc

1. Tạo `Dockerfile` multi-stage:
   - **Stage 1 (Builder):** `FROM node:20-alpine AS builder` → `npm ci` → `npm run build` → build Next.js static export sang `/app/out`.
   - **Stage 2 (Runner):** `FROM nginx:alpine` hoặc `FROM node:20-alpine` → Copy `out/` → Serve tại port `3000`.
2. Tạo `docker-compose.yml`:
   ```yaml
   services:
     frontend:
       build: .
       ports:
         - "3000:3000"
       env_file:
         - .env
   ```
3. Đảm bảo `.dockerignore` loại bỏ `node_modules/`, `.git/`, `contracts/`, `docs/`.

## Đầu ra mong muốn

`docker compose up --build` thành công, truy cập `localhost:3000` từ container.
