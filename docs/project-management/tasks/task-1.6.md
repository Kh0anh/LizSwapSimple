# Task 1.6: Khởi tạo shadcn/ui và Tailwind Design Token

- **Người đảm nhận:** **Khanh**
- **Mã Yêu cầu:** `[NFR-02]`, frontend-design.md §1, §5
- **Task phụ thuộc:** Task 1.4
- **Đường dẫn File:** `tailwind.config.ts`, `src/app/globals.css`, `components.json`

## Mô tả chi tiết công việc

1. Init shadcn/ui: `npx shadcn-ui@latest init` — chọn style "Default", cấu hình `components.json` trỏ alias `@/components/ui`.
2. Cấu hình `tailwind.config.ts`:
   - Extend `fontFamily`: `{ mono: ['JetBrains Mono', 'monospace'] }` — đặt làm font default.
   - Extend `colors` sử dụng CSS Variables theo `frontend-design.md §5`:
     ```ts
     colors: {
       background: 'hsl(var(--background))',
       foreground: 'hsl(var(--foreground))',
       primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
       muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
       // ... destructive, accent, card, popover, border, input, ring
     }
     ```
3. Thiết lập `src/app/globals.css` theo `frontend-design.md §2`:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');

   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   @layer base {
     :root {
       --background: 210 40% 98%;        /* slate-50 #f8fafc */
       --foreground: 222.2 47.4% 11.2%;  /* slate-900 #0f172a */
       --primary: 198.6 88.7% 48.4%;     /* sky-500 #0ea5e9 */
       --primary-foreground: 0 0% 100%;  /* white */
       --muted: 210 40% 96.1%;
       --muted-foreground: 215.4 16.3% 46.9%; /* slate-500 */
       --card: 0 0% 100%;                /* white */
       --card-foreground: 222.2 47.4% 11.2%;
       --border: 214.3 31.8% 91.4%;      /* slate-200 */
       --input: 214.3 31.8% 91.4%;
       --ring: 198.6 88.7% 48.4%;        /* sky-500 */
       --destructive: 0 84.2% 60.2%;     /* red-500 */
       --accent: 210 40% 96.1%;
       --radius: 0.75rem;
     }
   }

   body {
     font-family: 'JetBrains Mono', monospace;
   }
   ```

## Đầu ra mong muốn

Tailwind + shadcn/ui hoạt động, mọi component tương lai tự kế thừa Design Token chuẩn, font JetBrains Mono áp dụng toàn cục.
