# Lên Kèo — SaaS starter

Web app HTML + JavaScript thuần, chạy không cần build. `src/supabase.js` dùng ESM CDN nên deploy lên Cloudflare Pages/Vercel là chạy ngay.

## 1. Tạo database

Trong Supabase project `cdojcjqryycbouofjvry`, mở **SQL Editor** và chạy toàn bộ [`supabase/migrations/001_multi_tenant.sql`](./supabase/migrations/001_multi_tenant.sql).

> Không chạy lại nếu đã chạy thành công; migration có các lệnh `create table` không có `if not exists` để tránh vô tình ghi đè schema.

## 2. Chạy thử

Mở `index.html` qua một static server (VS Code Live Server hoặc Cloudflare/Vercel Preview), không nên double-click `file://` vì trình duyệt có thể chặn ES modules.

1. Đăng ký email và kiểm tra email xác thực nếu Supabase Auth yêu cầu.
2. Đăng nhập, tạo một đội. Đội mặc định là `tra_da`.
3. Bấm **Quỹ đội** hoặc **Chưa vote**: modal paywall hiện ra.
4. Bấm **Tôi đã chuyển khoản**: `teams.is_upgrade_pending` đổi sang `true`.
5. Trong Supabase Table Editor, đổi `tier` của đội thành `bia_hoi`; tải lại app. Hai tính năng được mở.

## 3. QR thanh toán

Thay `PAYMENT_QR_URL = ''` trong `src/config.js` bằng URL VietQR của tài khoản nhận tiền thật. Đồng thời đổi nội dung chuyển khoản trong `src/app.js` nếu cần.

## 4. Lưu ý bảo mật trước khi bán

Hiện owner/admin có quyền cập nhật hàng `teams`, do đó về UI họ có thể gửi yêu cầu nâng cấp. Trước khi public, thay thao tác `update(is_upgrade_pending)` bằng Supabase Edge Function kiểm tra rate limit/CAPTCHA; chỉ admin server-side dùng service key được đổi `tier` sang `bia_hoi` hoặc `len_mam`.

## npm (tùy chọn)

Khi cài Node.js LTS đầy đủ có npm, chạy `npm install`. Nếu chuyển sang Vite/React, đổi import CDN trong `src/supabase.js` thành `import { createClient } from '@supabase/supabase-js'`.
