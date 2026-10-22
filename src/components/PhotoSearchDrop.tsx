'use client';

import { useEffect, useRef, useState } from 'react';
import { imageFromClipboard, usePhotoSearch } from '@/lib/photoSearch';

/**
 * Drop a picture anywhere on the store, or press Ctrl+V / Cmd+V with a copied picture anywhere on the page, to search
 * by it (lib/photoSearch.ts). A paste into a text field is left to that field (the search box and the AI chat box
 * handle a pasted picture themselves; a checkout or review field is never interrupted). Shared by every template, which passes its
 * own words; the overlay is plain inline styles so it fits any look. Only file drags with an image react: dragging text
 * or links does nothing. A drop on a file box of its own (a review photo, a form upload) or inside an element marked
 * `data-photo-drop-ignore` is left to that element. Also stops the browser from opening a dropped picture in the tab.
 */
export function PhotoSearchDrop({ subdomain, label = 'Drop the photo to find similar products' }: { subdomain: string; label?: string }) {
  const search = usePhotoSearch((s) => s.search);
  const [over, setOver] = useState(false);
  const depth = useRef(0);

  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const ownTarget = (e: DragEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      return !!el?.closest('input[type="file"], [data-photo-drop-ignore]');
    };
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e) || ownTarget(e)) return;
      depth.current++;
      setOver(true);
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e) || ownTarget(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setOver(false);
    };
    const onDrop = (e: DragEvent) => {
      depth.current = 0;
      setOver(false);
      if (!hasFiles(e) || ownTarget(e)) return;
      e.preventDefault();
      const file = Array.from(e.dataTransfer?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (file) void search(subdomain, file);
    };
    const onPaste = (e: ClipboardEvent) => {
      if (e.defaultPrevented) return; // a field already took it (the chat box sends it to the chat)
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-photo-drop-ignore]')) return;
      const file = imageFromClipboard(e);
      if (!file) return;
      e.preventDefault();
      void search(subdomain, file);
    };
    window.addEventListener('paste', onPaste);
    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragover', onOver);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [search, subdomain]);

  if (!over) return null;
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        pointerEvents: 'none',
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          border: '3px dashed #fff',
          borderRadius: 16,
          padding: '28px 32px',
          color: '#fff',
          fontSize: 18,
          fontWeight: 600,
          textAlign: 'center',
          maxWidth: 420,
        }}
      >
        {label}
      </div>
    </div>
  );
}
