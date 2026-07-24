"use client";

import { Check, Copy, Phone, X } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { siteIdentity } from "@/lib/site-config";

function shouldUseDesktopDialog() {
  return window.innerWidth > 640 && navigator.maxTouchPoints === 0;
}

export default function PhoneContact() {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLAnchorElement>(null);

  function close() {
    setOpen(false);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  }

  function openForDesktop(event: MouseEvent<HTMLAnchorElement>) {
    if (!shouldUseDesktopDialog()) return;
    event.preventDefault();
    setOpen(true);
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

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(siteIdentity.profiles.phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch { /* The visible number remains selectable when clipboard access is denied. */ }
  }

  return (
    <>
      <a ref={openerRef} href={siteIdentity.profiles.phoneHref} onClick={openForDesktop}>
        <Phone aria-hidden="true" /><span>{locale === "en" ? "Phone" : "电话"}</span>
      </a>
      {open ? (
        <div className="wechat-modal" role="dialog" aria-modal="true" aria-labelledby="phone-title" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div className="wechat-card">
            <button ref={closeRef} type="button" className="wechat-close" onClick={close} aria-label={locale === "en" ? "Close phone number" : "关闭电话号码"}><X aria-hidden="true" /></button>
            <p className="eyebrow">{locale === "en" ? "Phone" : "电话"}</p>
            <h2 id="phone-title">{locale === "en" ? "Contact by phone" : "电话联系"}</h2>
            <div className="wechat-id-row"><span><strong>{siteIdentity.profiles.phone}</strong></span><button type="button" onClick={() => void copyNumber()}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? (locale === "en" ? "Copied" : "已复制") : (locale === "en" ? "Copy number" : "复制号码")}</button></div>
          </div>
        </div>
      ) : null}
    </>
  );
}
