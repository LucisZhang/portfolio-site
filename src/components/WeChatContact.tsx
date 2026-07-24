"use client";

import Image from "next/image";
import { Check, Copy, MessageCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

const wechatId = "ZJ_Lucis";

export default function WeChatContact() {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  }

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(wechatId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch { /* The visible ID remains selectable when clipboard access is denied. */ }
  }

  return (
    <>
      <button ref={openerRef} type="button" className="identity-contact-button" onClick={() => setOpen(true)}>
        <MessageCircle aria-hidden="true" /><span>WeChat</span>
      </button>
      {open ? (
        <div className="wechat-modal" role="dialog" aria-modal="true" aria-labelledby="wechat-title" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div className="wechat-card">
            <button ref={closeRef} type="button" className="wechat-close" onClick={close} aria-label={locale === "en" ? "Close WeChat QR code" : "关闭微信二维码"}><X aria-hidden="true" /></button>
            <p className="eyebrow">WeChat</p>
            <h2 id="wechat-title">{locale === "en" ? "Add me on WeChat" : "添加我的微信"}</h2>
            <Image
              src={locale === "en" ? "/contact/wechat-en.jpg" : "/contact/wechat-zh.jpg"}
              alt={locale === "en" ? "WeChat QR code for Lucis" : "Lucis 的微信二维码"}
              width={888}
              height={locale === "en" ? 1191 : 1131}
              priority
            />
            <div className="wechat-id-row"><span>{locale === "en" ? "WeChat ID" : "微信号"}: <strong>{wechatId}</strong></span><button type="button" onClick={() => void copyId()}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? (locale === "en" ? "Copied" : "已复制") : (locale === "en" ? "Copy" : "复制")}</button></div>
          </div>
        </div>
      ) : null}
    </>
  );
}
