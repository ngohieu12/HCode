# HCode

<div align="center">
  <img src="public/logo/icons/1024x1024.png" alt="HCode" width="128" height="128" />
</div>
<p align="center">
  Tiếng Việt | <a href="README.en.md">English</a>
</p>



HCode là bàn làm việc lập trình với AI dành cho desktop. Kho này chứa ứng dụng desktop, dịch vụ backend, UI dùng chung, cùng mã nguồn Agent CLI và runtime mà Desktop đóng gói và khởi chạy. Kho không phát hành giao diện web, TUI hay gói CLI độc lập.

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

### Phát triển Agent CLI từ mã nguồn

Agent CLI là runtime không giao diện, được Desktop gọi qua `dist/zcode.cjs`:

```bash
pnpm --filter @zcode/cli dev --help
pnpm --filter @zcode/cli dev -p "summarize this repository"

# Build CLI và các phụ thuộc workspace của nó
pnpm --filter @zcode/cli... build
node apps/zcode-cli/packages/cli/dist/zcode.cjs --help
```

### Phát triển UI Plugin

Xem [Hướng dẫn UI Plugin (tiếng Anh)](UI_PLUGIN.en.md) hoặc [bản tiếng Trung](UI_PLUGIN.md); bắt đầu từ ví dụ cộng tác trên canvas với Excalidraw để hiểu cách cài đặt, cập nhật plugin, API trang và điểm vào phối hợp với host.

**Khi gửi PR plugin vào `zcode-plugins`, bắt buộc khai báo trong mẫu PR xem có phải UI Plugin hay không và ghi rõ tên plugin.** Tiêu chí xác định xem tại [Khai báo loại plugin khi gửi PR](UI_PLUGIN.en.md#declare-the-plugin-type-in-pull-requests).

## Cấu hình

Tệp [.env.example](.env.example) ở thư mục gốc cung cấp ví dụ về địa chỉ dịch vụ và cấu hình build; có thể sao chép thành `.env` khi cần, phần ghi đè cục bộ đặt trong `.env.local`. Môi trường phát triển của Desktop được chọn qua `dev:desktop:test` / `dev:desktop:prod`.

| Cấu hình                             | Mục đích                                                              |
| ------------------------------------ | --------------------------------------------------------------------- |
| `ZCODE_DATA_BASE_DIR`                | Thư mục gốc lưu dữ liệu ứng dụng; dữ liệu ghi vào `.zcode/` bên trong |
| `ZCODE_BUILTIN_PROVIDER_CONFIG_FILE` | Đường dẫn tệp cấu hình Provider cục bộ; dùng cấu hình tích hợp khi không đặt |

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

## Cấu trúc kho

| Thư mục                                              | Trách nhiệm                                                |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| `packages/desktop`                                   | Electron Main, Host, Renderer và đóng gói desktop          |
| `packages/server`                                    | Dịch vụ HTTP / WebSocket và kết nối từ xa                  |
| `packages/ui`                                        | Component React dùng chung, hooks và state Zustand         |
| `packages/services`                                  | Dịch vụ nghiệp vụ và lưu trữ                               |
| `packages/shared`, `packages/rpc`, `packages/client` | Giao thức và kiểu dùng chung, framework RPC, SDK client Agent |
| `packages/provider`, `packages/provider-node`        | Năng lực chung của Provider và bản triển khai trên Node    |
| `apps/zcode-cli`                                     | Agent CLI, runtime và công cụ                              |
| `scripts`, `config`, `third-party`                   | Script build và bảo trì, cấu hình tích hợp và tài liệu khai báo bên thứ ba |

## Tuyên bố dự án

Phạm vi tính năng và ưu đãi, quy tắc bảo trì, rủi ro thực thi và dữ liệu, cùng thông tin giấy phép và bản quyền bên thứ ba, xem tại [NOTICE.md](NOTICE.md).
