# Privacy and data boundary / 隐私与数据边界

Privacy Preflight performs its default text, image, and PDF processing on this Mac through a worker bound to `127.0.0.1`. Submitted raw text, images, PDFs, OCR output, and redaction history are not stored by default. Local profile rules and provider settings may be stored under `~/Library/Application Support/Privacy Preflight`; configured API keys use macOS Keychain when available. The app provides local-data diagnostics and clear controls.

Privacy Preflight 默认通过仅绑定 `127.0.0.1` 的本地 worker，在这台 Mac 上完成文本、图片和 PDF 处理。默认不保存提交的原始文本、图片、PDF、OCR 结果或脱敏历史。个人规则和模型提供商设置可能保存在 `~/Library/Application Support/Privacy Preflight`；配置的 API 密钥会在可用时存入 macOS 钥匙串。应用提供本地数据诊断与清理入口。

Optional model-provider and OpenAI-compatible gateway features are disabled by default. If enabled, redacted content may be sent to the configured upstream. Sending raw text to a non-local provider requires a separate explicit opt-in. Provider behavior and retention are governed by that provider, not this local app.

可选模型提供商与 OpenAI 兼容网关默认关闭。启用后，脱敏后的内容可能发送给所配置的上游；向非本地提供商发送原文还需要单独明确开启。上游的处理与保留规则由该提供商决定，不由本地应用控制。

The app is a review aid, not a guarantee that every sensitive item will be detected. Always inspect the selected regions and exported artifact before sharing.

本应用是人工复核辅助工具，并不保证识别所有敏感信息。分享前请始终检查所选区域及导出文件。
