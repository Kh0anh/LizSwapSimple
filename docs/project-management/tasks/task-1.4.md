# Task 1.4: Khởi tạo Next.js App Structure

- **Người đảm nhận:** **Hộp**
- **Mã Yêu cầu:** `[NFR-02]` (Frontend Tĩnh), project-structure.md §2
- **Task phụ thuộc:** Task 1.1
- **Đường dẫn File:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/pool/page.tsx`, `next.config.mjs`

## Mô tả chi tiết công việc

1. Khởi tạo Next.js App Router structure trong thư mục `src/`:
   - `src/app/layout.tsx` — Root layout (placeholder, sẽ hoàn thiện Phase 3).
   - `src/app/page.tsx` — Trang Swap Home (placeholder).
   - `src/app/pool/page.tsx` — Trang Pool (placeholder).
2. Cấu hình `next.config.mjs`:
   - Bật `output: 'export'` để build Static HTML theo `[NFR-02]`.
   - `images: { unoptimized: true }` (cần cho static export).
3. Tạo cây thư mục theo `project-structure.md`:
   ```
   src/
   ├── app/
   │   ├── layout.tsx
   │   ├── page.tsx
   │   ├── globals.css
   │   └── pool/
   │       └── page.tsx
   ├── components/
   │   ├── ui/            # (Trống, sẽ thêm shadcn/ui components)
   │   └── web3/          # (Trống, sẽ thêm WalletConnectButton)
   ├── hooks/             # (Trống, sẽ thêm useWeb3.ts)
   └── services/
       └── contracts/     # (Trống, sẽ chứa ABI JSON files)
   ```
4. Init Tailwind CSS: `npx tailwindcss init -p`, cấu hình `tailwind.config.ts` content paths.

## Đầu ra mong muốn

`npm run dev` khởi thành công, truy cập `localhost:3000` và `/pool` hiển thị placeholder page.
