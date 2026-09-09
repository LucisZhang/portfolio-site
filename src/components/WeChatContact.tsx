"use client";

import { useEffect, useRef, useState } from "react";
import ContactIcon from "@/components/ContactIcon";
import { useI18n } from "@/lib/i18n";

const wechatId = "ZJ_Lucis";

// Fix (perf/home-trim): this component was the ONLY reason next/image's
// client runtime shipped on the homepage (verified: no other component
// reachable from "/" imports next/image). A next/dynamic() split was tried
// first, but it adds a chunk-id registration to the shared webpack runtime
// (l.u in every route's webpack-*.js) that costs every route a fixed few
// bytes -- enough to tip /artifact over its zero-headroom routeOwnCeiling
// pin (see task-home-trim-report.md). A plain <img> for this one
// already-click-gated QR code removes the next/image dependency outright
// instead of deferring it, with no such side effect: same src, alt,
// width/height (no layout shift), same modal behavior. The only thing lost
// is next/image's automatic AVIF/WebP negotiation for this one asset.
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
        <ContactIcon kind="wechat" />
        <span className="home-locale-en">WeChat</span>
        <span className="home-locale-zh" lang="zh">微信</span>
      </button>
      {open ? (
        <div className="wechat-modal" role="dialog" aria-modal="true" aria-labelledby="wechat-title" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div className="wechat-card">
            <button ref={closeRef} type="button" className="wechat-close" onClick={close} aria-label={locale === "en" ? "Close WeChat QR code" : "关闭微信二维码"}>{locale === "en" ? "Close" : "关闭"}</button>
            <p className="eyebrow">WeChat</p>
            <h2 id="wechat-title">{locale === "en" ? "Add me on WeChat" : "添加我的微信"}</h2>
            {/* eslint-disable-next-line @next/next/no-img-element -- see file header: next/image removed on purpose */}
            <img
              src={locale === "en" ? "/contact/wechat-en.jpg" : "/contact/wechat-zh.jpg"}
              alt={locale === "en" ? "WeChat QR code for Lucis" : "Lucis 的微信二维码"}
              width={888}
              height={locale === "en" ? 1191 : 1131}
            />
            <div className="wechat-id-row"><span>{locale === "en" ? "WeChat ID" : "微信号"}: <strong>{wechatId}</strong></span><button type="button" onClick={() => void copyId()}>{copied ? (locale === "en" ? "Copied" : "已复制") : (locale === "en" ? "Copy" : "复制")}</button></div>
          </div>
        </div>
      ) : null}
    </>
  );
}
