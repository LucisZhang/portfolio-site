# Privacy Preflight 0.1.0 for macOS

This preview is a standalone **Apple silicon (arm64)** build for **macOS 14 or later**. It embeds CPython 3.12.13, its local worker, and a compiled macOS Vision OCR helper. No Homebrew, system Python, Swift toolchain, Tesseract installation, or network service is required for default text/image/PDF redaction after download.

此预览版是适用于 **Apple 芯片（arm64）**、**macOS 14 及以上版本**的独立构建。应用内置 CPython 3.12.13、本地 worker 与已编译的 macOS Vision OCR helper；下载完成后，默认文本、图片与 PDF 脱敏无需 Homebrew、系统 Python、Swift 工具链、Tesseract 或网络服务。

## Integrity

Verify the SHA-256 value published next to the download before opening the archive. The exact release hash is generated after packaging and is not hard-coded in this source snapshot.

打开压缩包前，请先核对下载页面公布的 SHA-256。最终哈希在打包后生成，因此不写死在此源码快照中。

## Open this unnotarized preview

This build is ad-hoc signed, not Developer ID signed, and not notarized by Apple. Gatekeeper may block the first launch.

1. Move `Privacy Preflight.app` to Applications.
2. Control-click the app and choose **Open**, then confirm **Open**.
3. On macOS Sequoia, if the app is still blocked, open **System Settings > Privacy & Security**, scroll to **Security**, click **Open Anyway**, then confirm **Open**.

此构建仅使用 ad-hoc 签名，未使用 Developer ID 签名，也未经过 Apple 公证。Gatekeeper 可能阻止首次启动。

1. 将 `Privacy Preflight.app` 移到“应用程序”。
2. 按住 Control 键点按应用，选择“打开”，再确认“打开”。
3. 若在 macOS Sequoia 中仍被拦截，请打开“系统设置 > 隐私与安全性”，滚动到“安全性”，点按“仍要打开”，再确认“打开”。

Do not disable Gatekeeper globally. If the app came from anywhere other than the documented download, do not override the warning.

请勿全局关闭 Gatekeeper。若应用并非来自文档所列下载地址，请勿绕过安全警告。

## Boundaries

- The worker binds only to `127.0.0.1` by default.
- Raw submitted documents are not stored in history by default.
- PDF output is rebuilt as image-only pages with opaque redaction pixels; it is not legal-grade redaction.
- OCR quality varies. Review every proposed region and the exported output before sharing it.
- Optional external model-provider and gateway features remain disabled by default. Enabling them changes the data boundary; read `PRIVACY.md` first.

## Source and notices

The matching source snapshot, exact dependency lock, SPDX 2.3 SBOM, CPython license, and third-party notices are distributed alongside the app archive. This release replaces the prior PyMuPDF implementation with pypdfium2/PDFium for rendering, pypdf for structure inspection, Pillow for pixel burn-in, and ReportLab for deterministic image-only PDF output. PyMuPDF/fitz is not installed or bundled in this release.

对应的源码快照、精确依赖锁、SPDX 2.3 SBOM、CPython 许可文件与第三方许可说明均和应用压缩包一同提供。本版本已用 pypdfium2/PDFium、pypdf、Pillow 与 ReportLab 替换旧的 PyMuPDF 实现；发布包不安装也不包含 PyMuPDF/fitz。
