'use client';

/**
 * The camera inside the voice call, for a photo search (lib/voice/useVoiceCall.ts openCamera). It opens by itself (the
 * shopper only said so), shows the back camera, counts 3-2-1 and takes the picture; "Take now" skips the wait,
 * "Gallery" picks a saved photo (a tap, which a file picker needs), "Cancel" goes back to talking.
 */
import { useEffect, useRef, useState } from 'react';
import { Camera, ImageIcon, X } from 'lucide-react';

const COUNTDOWN = 4; // seconds before the picture is taken by itself (the first one is the camera starting)
const BN = '০১২৩৪৫৬৭৮৯';

export function CallCamera({ onPhoto, onCancel }: { onPhoto: (file: File) => void; onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [left, setLeft] = useState(COUNTDOWN);
  const [noCamera, setNoCamera] = useState(false);
  const doneRef = useRef(false);

  const finish = (file: File) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onPhoto(file);
  };

  /** False while the camera has no picture yet. */
  const snap = (): boolean => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return false;
    const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => b && finish(new File([b], 'camera.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.9);
    return true;
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play().catch(() => undefined);
        }
      })
      .catch(() => setNoCamera(true));
    return () => {
      stopped = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // The countdown, then the picture by itself.
  useEffect(() => {
    if (noCamera) return;
    if (left <= 0) {
      // A slow camera may have no picture yet: keep trying until it has one.
      if (snap()) return;
      const retry = setInterval(() => snap() && clearInterval(retry), 400);
      return () => clearInterval(retry);
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, noCamera]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        {noCamera ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-white/80">
            <Camera size={36} className="text-white/50" />
            <p className="text-[14px]">ক্যামেরা খোলা যায়নি। গ্যালারি থেকে পণ্যের ছবি বেছে দিন।</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-8 rounded-3xl border-2 border-white/60" />
            {left > 0 && left < COUNTDOWN && (
              <span className="absolute inset-0 flex items-center justify-center text-[88px] font-bold text-white/90 drop-shadow-lg">{BN[left]}</span>
            )}
            <p className="absolute inset-x-0 top-4 text-center text-[13px] text-white/85">পণ্যটা ফ্রেমের মধ্যে ধরুন</p>
          </>
        )}
      </div>
      <div className="flex items-center justify-center gap-6 bg-black px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-5 text-white">
        <button type="button" onClick={onCancel} aria-label="Cancel photo" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 hover:bg-white/25">
          <X size={22} />
        </button>
        {!noCamera && (
          <button
            type="button"
            onClick={() => snap()}
            aria-label="Take photo now"
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 hover:bg-white/30"
          >
            <Camera size={24} />
          </button>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Choose from gallery"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
        >
          <ImageIcon size={22} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && finish(e.target.files[0])} />
      </div>
    </div>
  );
}
