# [NFR-02] Dockerfile multi-stage build cho LizSwapSimple Frontend
# Đảm bảo build Next.js static export và serve qua nginx:alpine (lightweight)
#
# ─────────────────────────────────────────
# STAGE 1: Builder — Build Next.js Static Export
# ─────────────────────────────────────────
FROM node:20-alpine AS builder

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Copy file khai báo dependency trước (tận dụng Docker layer cache)
COPY package.json package-lock.json ./

# Cài đặt dependencies (ci = clean install, nhanh hơn npm install)
RUN npm ci

# [NFR-03] Truyen bien moi truong NEXT_PUBLIC_* vao buoc build static.
ARG NEXT_PUBLIC_CHAIN_ID
ARG NEXT_PUBLIC_RPC_URL
ARG NEXT_PUBLIC_ROUTER_ADDRESS
ARG NEXT_PUBLIC_FACTORY_ADDRESS
ARG NEXT_PUBLIC_ALLOW_DEPLOYED_FALLBACK

ENV NEXT_PUBLIC_CHAIN_ID=$NEXT_PUBLIC_CHAIN_ID
ENV NEXT_PUBLIC_RPC_URL=$NEXT_PUBLIC_RPC_URL
ENV NEXT_PUBLIC_ROUTER_ADDRESS=$NEXT_PUBLIC_ROUTER_ADDRESS
ENV NEXT_PUBLIC_FACTORY_ADDRESS=$NEXT_PUBLIC_FACTORY_ADDRESS
ENV NEXT_PUBLIC_ALLOW_DEPLOYED_FALLBACK=$NEXT_PUBLIC_ALLOW_DEPLOYED_FALLBACK

# Copy toàn bộ mã nguồn dự án vào container
COPY . .

# [NFR-02] Build Next.js ra thư mục /app/out (static export)
# next.config.js đã cấu hình output: 'export'
RUN npm run build

# ─────────────────────────────────────────
# STAGE 2: Runner — Serve static files qua nginx:alpine
# ─────────────────────────────────────────
FROM nginx:alpine AS runner

# Copy file cấu hình nginx tùy chỉnh (hỗ trợ SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy thư mục output tĩnh từ Stage builder sang nginx public root
COPY --from=builder /app/out /usr/share/nginx/html

# Expose port 80 (docker-compose sẽ map sang port 3000 của host)
EXPOSE 80

# Command mặc định khởi động nginx ở foreground mode
CMD ["nginx", "-g", "daemon off;"]
