# Lên Kèo — SaaS starter

Web app HTML + JavaScript thuần, chạy không cần build. `src/supabase.js` dùng ESM CDN nên deploy lên Cloudflare Pages/Vercel là chạy ngay.

## 1. Tạo database

Trong Supabase project `cdojcjqryycbouofjvry`, mở **SQL Editor** và chạy toàn bộ [`supabase/migrations/001_multi_tenant.sql`](./supabase/migrations/001_multi_tenant.sql).

> Không chạy lại nếu đã chạy thành công; migration có các lệnh `create table` không có `if not exists` để tránh vô tình ghi đè schema.

## 2. Chạy thử

Mở `index.html` qua một static server (VS Code Live Server hoặc Cloudflare/Vercel Preview), không nên double-click `file://` vì trình duyệt có thể chặn ES modules.

1. Trong Supabase SQL Editor, chạy `001_multi_tenant.sql`, sau đó chạy `002_fix_create_team_rpc.sql` và `003_enforce_free_member_limit.sql`.
2. Đăng ký email và kiểm tra email xác thực nếu Supabase Auth yêu cầu.
3. Đăng nhập, tạo một đội. Đội mặc định là `tra_da`.
4. Bấm **Quỹ đội** hoặc **Chưa vote**: modal paywall hiện ra.
5. Bấm **Tôi đã chuyển khoản**: `teams.is_upgrade_pending` đổi sang `true`.
6. Trong Supabase Table Editor, đổi `tier` của đội thành `bia_hoi`; tải lại app. Hai tính năng được mở.

### Nếu không nhận được email xác thực

Trong Supabase Dashboard, vào **Authentication → Providers → Email** và bảo đảm Email provider đang bật. Vào **Authentication → URL Configuration**, thêm URL Redirect `https://vinhcris.github.io/lenkeo/saas.html` (và domain production sau này). Kiểm tra cả thư mục Spam; email mặc định của Supabase có thể bị nhà cung cấp thư chặn hoặc chậm. Nếu chỉ thử nội bộ, có thể tắt **Confirm email** tạm thời trong Email provider, nhưng phải bật lại trước khi mở bán.

## 3. Duyệt nâng cấp thủ công

Paywall hiển thị thông tin BIDV và nội dung chuyển khoản theo dạng `TENDOI_BIAHOI`. Khi khách nhấn **Tôi đã chuyển khoản**, app chỉ đặt `is_upgrade_pending = true`. Sau khi kiểm tra giao dịch, admin vào bảng `teams` của Supabase để đổi `tier` sang `bia_hoi` hoặc `len_mam`, rồi đổi `is_upgrade_pending` về `false`.

## 4. Lưu ý bảo mật trước khi bán

Hiện owner/admin có quyền cập nhật hàng `teams`, do đó về UI họ có thể gửi yêu cầu nâng cấp. Trước khi public, thay thao tác `update(is_upgrade_pending)` bằng Supabase Edge Function kiểm tra rate limit/CAPTCHA; chỉ admin server-side dùng service key được đổi `tier` sang `bia_hoi` hoặc `len_mam`.

## npm (tùy chọn)

Khi cài Node.js LTS đầy đủ có npm, chạy `npm install`. Nếu chuyển sang Vite/React, đổi import CDN trong `src/supabase.js` thành `import { createClient } from '@supabase/supabase-js'`.
