# HCode

<div align="center">
  <img src="public/logo/icons/1024x1024.png" alt="HCode" width="128" height="128" />
</div>
<p align="center">
  <a href="https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=47ag983c-8fcb-4d6d-814b-5395193a712c&amp;qr_code=true">Cộng đồng Feishu</a> ·
  <a href="https://discord.gg/z9aBcQXZQ3">Discord</a>
</p>
<p align="center">
  Tiếng Việt | <a href="README.en.md">English</a>
</p>



HCode là bàn làm việc lập trình với AI, gồm ứng dụng desktop, giao diện trình duyệt và Agent trên terminal. Kho này chứa client, dịch vụ backend, UI dùng chung, cùng mã nguồn Agent CLI và runtime.

## Cập nhật

- 2026-10-10: Cập nhật lên phiên bản HCode v3.15.1.
- 2026-9-23: Cập nhật lên phiên bản HCode v3.14.3.

## Khởi tạo

Chuẩn bị Git, Node.js **24.14.0** và pnpm **10.33.2**; phiên bản lấy theo [mise.toml](mise.toml). Mọi lệnh phát triển và đóng gói dưới đây đều chạy tại thư mục gốc của kho.

```bash
pnpm bootstrap
```

`pnpm bootstrap` cài phụ thuộc workspace, chuẩn bị tài nguyên chạy desktop cục bộ, rồi chạy `build:bootstrap`.

Mã nguồn Agent CLI và runtime nằm tại [apps/zcode-cli/](apps/zcode-cli/), là thư mục thường được clone kèm kho này, không cần kéo riêng hay khởi tạo Git submodule.

Chọn thêm các điểm vào khởi tạo hoặc build khác khi cần:

| Lệnh                           | Mục đích                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `pnpm install`                 | Cài phụ thuộc                                                                     |
| `pnpm prepare:desktop-runtime` | Chuẩn bị tài nguyên chạy desktop, mặc định gồm cả tài nguyên từ xa                |
| `pnpm prepare:remote-assets`   | Chuẩn bị riêng tài nguyên chạy từ xa                                              |
| `pnpm bootstrap:with-remote`   | Khởi tạo phụ thuộc, tài nguyên cục bộ và từ xa, rồi build tuần tự các gói liên quan; bỏ qua bundle ứng dụng desktop |
| `pnpm build`                   | Chạy đệ quy script build của từng gói workspace, gồm cả bước chuẩn bị tài nguyên trong gói |

Mặc định `bootstrap` bỏ qua bước chuẩn bị tài nguyên từ xa, phù hợp cho phát triển desktop cục bộ. Khi dùng workspace từ xa hoặc cần kiểm chứng tài nguyên phát hành từ xa, hãy chạy lệnh chuẩn bị tương ứng.

## Phát triển và chạy

### Bản desktop

```bash
pnpm dev:desktop

# Dùng môi trường test
pnpm dev:desktop:test
```

`pnpm dev:desktop` mặc định tương đương `pnpm dev:desktop:prod`, dùng cấu hình dịch vụ production. Script khởi động sẽ chuẩn bị tài nguyên chạy cục bộ, build Agent desktop, rồi khởi chạy Electron cùng tiến trình theo dõi mã nguồn.

Khi cần thư mục dữ liệu phát triển riêng, đặt biến `ZCODE_DATA_BASE_DIR`. Ví dụ trên macOS / Linux:

```bash
ZCODE_DATA_BASE_DIR="$HOME/.zcode-dev-home" pnpm dev:desktop:test
```

### Tính năng từ xa (SSH/WSL)

Chạy `pnpm bootstrap:with-remote` để chuẩn bị tài nguyên từ xa (mock-cdn), rồi chạy `pnpm dev:desktop`; khi kết nối dự án từ xa, chọn tài nguyên theo kiểu "tải cục bộ rồi upload". Tài nguyên ở chế độ phát triển lấy từ `packages/desktop/mock-cdn` và sản phẩm build cục bộ, được upload qua SFTP lên máy từ xa, không truy cập CDN.

### Bản dòng lệnh HCode

Gói phát hành dòng lệnh gồm TUI và Agent, dùng thống nhất lệnh `zcode`: không có tham số thì vào TUI; các tham số khác được chuyển cho Agent CLI hiện có. Không cần Electron.

```bash
# Mặc định vào giao diện tương tác trên terminal
zcode

# Xem tham số CLI
zcode --help
```

Cách build xem ở mục đóng gói bên dưới. `pnpm build:zcode` chỉ tạo gói phát hành, không thay thế lệnh `zcode` đang có trong `PATH`. Nếu lệnh vẫn trỏ tới bản cài cũ hoặc thư mục mã nguồn khác, trên macOS / Linux dùng `command -v zcode`, trên Windows dùng `where.exe zcode` để kiểm tra.

### Phát triển từ mã nguồn CLI

Khi phát triển trực tiếp TUI hoặc Agent, chạy điểm vào mã nguồn:

```bash
pnpm --filter @zcode/cli dev --help
pnpm --filter @zcode/cli dev

# Build CLI và các phụ thuộc workspace của nó
pnpm --filter @zcode/cli... build
node apps/zcode-cli/packages/cli/dist/zcode.cjs --help
```

Điểm vào này chạy trực tiếp Agent CLI. Muốn kiểm chứng lệnh `zcode` thống nhất, dùng `bin/zcode.mjs` sau khi giải nén ở phần dưới.

### Phát triển UI Plugin

Xem [Hướng dẫn UI Plugin (tiếng Anh)](UI_PLUGIN.en.md) hoặc [bản tiếng Trung](UI_PLUGIN.md); bắt đầu từ ví dụ cộng tác trên canvas với Excalidraw để hiểu cách cài đặt, cập nhật plugin, API trang và điểm vào phối hợp với host.

**Khi gửi PR plugin vào `zcode-plugins`, bắt buộc khai báo trong mẫu PR xem có phải UI Plugin hay không và ghi rõ tên plugin.** Tiêu chí xác định xem tại [Khai báo loại plugin khi gửi PR](UI_PLUGIN.en.md#declare-the-plugin-type-in-pull-requests).

## Cấu hình

Tệp [.env.example](.env.example) ở thư mục gốc cung cấp ví dụ về địa chỉ dịch vụ và cấu hình build; có thể sao chép thành `.env` khi cần, phần ghi đè cục bộ đặt trong `.env.local`. Môi trường phát triển của Desktop được chọn qua `dev:desktop:test` / `dev:desktop:prod`.

| Cấu hình                             | Mục đích                                                              |
| ------------------------------------ | --------------------------------------------------------------------- |
| `ZCODE_DATA_BASE_DIR`                | Thư mục gốc lưu dữ liệu ứng dụng; dữ liệu ghi vào `.zcode/` bên trong |
| `ZCODE_SERVER_WORKSPACE`             | Đường dẫn workspace của backend Web                                   |
| `ZCODE_BUILTIN_PROVIDER_CONFIG_FILE` | Đường dẫn tệp cấu hình Provider cục bộ; dùng cấu hình tích hợp khi không đặt |
| `ZCODE_DIST_BASE_URL`                | Địa chỉ gốc tải xuống mà script cài đặt dòng lệnh sử dụng             |

Các biến runtime có thể đặt tường minh trong môi trường của lệnh khởi chạy. Cấu hình mặc định đi kèm client xem tại [config/README.md](config/README.md).

## Đóng gói

Quy trình tạo khai báo bên thứ ba, kiểm chứng phát hành và vị trí khai báo trong sản phẩm phát hành xem tại [third-party/README.md](third-party/README.md).

### Bản desktop

```bash
pnpm bundle:desktop

# Chỉ định nền tảng và kiến trúc CPU
pnpm bundle:desktop -- --os win --arch x64

pnpm bundle:desktop -- --help
```

Mặc định đích là macOS arm64, thư mục đầu ra mặc định là `packages/desktop/dist/`. `--os` hỗ trợ `mac`, `win`, `linux`; `--arch` hỗ trợ `x64`, `arm64`; đóng gói và ký thực tế cần công cụ, cấu hình tương ứng của nền tảng đích.

Cài đặt: nhấp đúp để mở tệp DMG, kéo HCode vào "Applications". Bản build cục bộ chưa ký; lần mở đầu tiên nếu bị macOS chặn, chạy:

```bash
sudo xattr -rd com.apple.quarantine /Applications/HCode.app
```

### Bản dòng lệnh HCode

Điểm vào build là `pnpm build:zcode`. Script lần lượt build CLI/TUI và Agent, thu thập thư viện native, worker cùng phụ thuộc runtime của TUI, rồi lắp gói phát hành; chạy gói phát hành vẫn cần Node.js, phiên bản lấy theo `mise.toml`.

Trước khi đóng gói phải đặt địa chỉ gốc tải xuống `ZCODE_DIST_BASE_URL` (có thể đặt trong `.env`, `.env.local` hoặc biến môi trường), cũng có thể truyền qua `--base-url`. Địa chỉ dưới đây chỉ là ví dụ, khi phát hành hãy thay bằng địa chỉ lưu trữ thực tế:

```bash
pnpm build:zcode --base-url https://downloads.example.com/zcode/

# Khi đã cấu hình ZCODE_DIST_BASE_URL
pnpm build:zcode

# Chỉ đóng gói lại, tái sử dụng sản phẩm build Agent đã có
pnpm build:zcode --skip-build

# Xem phiên bản, thư mục đầu ra và các tham số tùy chọn khác
pnpm build:zcode --help
```

Phiên bản mặc định lấy từ `package.json` ở thư mục gốc, thư mục đầu ra là `dist/zcode/`:

- `releases/<version>/zcode-<version>.tar.gz`: gói chạy.
- `releases/<version>/sha256.txt`: mã kiểm tra.
- `latest.json`, `install.sh`: chỉ mục phiên bản và script cài đặt.

Có thể upload toàn bộ thư mục lên địa chỉ gốc tải xuống đã cấu hình. Script cài đặt tải gói chạy từ địa chỉ đó, mặc định cài vào `~/.zcode/runtime` và tạo lệnh `zcode` trong `~/.local/bin`. Thư mục cài đặt có thể đổi bằng `ZCODE_DIST_HOME`, thư mục lệnh đổi bằng `ZCODE_DIST_BIN_DIR`.

Người dùng Lite cũ cần chuyển sang lệnh build, biến môi trường và script cài đặt mới ở trên. Bản cài mới không xoá thư mục Lite cũ, cũng không di chuyển hay xoá dữ liệu phiên đã có.

Khi cần gỡ lỗi cục bộ gói đóng gói, có thể giải nén chạy trực tiếp, không cần upload hay cài đặt:

```bash
zcode_version=$(node -p "require('./dist/zcode/latest.json').version")
mkdir -p dist/zcode/debug
tar -xzf "dist/zcode/releases/$zcode_version/zcode-$zcode_version.tar.gz" \
  -C dist/zcode/debug
# Mặc định khởi chạy TUI
node dist/zcode/debug/zcode/bin/zcode.mjs
```

## Cấu trúc kho

| Thư mục                                              | Trách nhiệm                                                |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| `packages/desktop`                                   | Electron Main, Host, Renderer và đóng gói desktop          |
| `packages/server`                                    | Dịch vụ HTTP / WebSocket và kết nối từ xa                  |
| `packages/ui`                                        | Component React dùng chung, hooks và state Zustand         |
| `packages/services`                                  | Dịch vụ nghiệp vụ và lưu trữ                               |
| `packages/shared`, `packages/rpc`, `packages/client` | Giao thức và kiểu dùng chung, framework RPC, SDK client Agent |
| `packages/provider`, `packages/provider-node`        | Năng lực chung của Provider và bản triển khai trên Node    |
| `apps/zcode-cli`                                     | Agent CLI, TUI, runtime và công cụ                         |
| `scripts`, `config`, `third-party`                   | Script build và bảo trì, cấu hình tích hợp và tài liệu khai báo bên thứ ba |

## Tuyên bố dự án

Phạm vi tính năng và ưu đãi, quy tắc bảo trì, rủi ro thực thi và dữ liệu, cùng thông tin giấy phép và bản quyền bên thứ ba, xem tại [NOTICE.md](NOTICE.md).
