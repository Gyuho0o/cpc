"use client";

import { useRef, useState, useCallback } from "react";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  loading?: boolean;
}

export function CameraCapture({ onCapture, loading }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState("");

  const startCamera = useCallback(async () => {
    try {
      setError("");

      // 먼저 권한 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("이 브라우저에서는 카메라를 지원하지 않습니다.");
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      setIsCameraOn(true);

      // 다음 렌더 사이클에서 비디오 연결
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("카메라 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.");
        } else if (err.name === "NotFoundError") {
          setError("카메라를 찾을 수 없습니다.");
        } else {
          setError(`카메라 오류: ${err.message}`);
        }
      } else {
        setError("카메라를 시작할 수 없습니다.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOn(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      onCapture(imageData);
      stopCamera();
    }
  }, [onCapture, stopCamera]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        onCapture(imageData);
      };
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  return (
    <div className="space-y-4">
      {error && (
        <div
          className="px-4 py-3 rounded-2xl text-sm"
          style={{
            background: "rgba(240, 68, 82, 0.1)",
            color: "var(--toss-red)"
          }}
        >
          {error}
        </div>
      )}

      {isCameraOn ? (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
            />
            {/* Camera overlay guide */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white/30 rounded-xl" />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={capturePhoto}
              disabled={loading}
              className="flex-1 h-14 text-lg font-semibold rounded-2xl transition-all active:scale-98"
              style={{
                background: "var(--toss-blue)",
                color: "white"
              }}
            >
              촬영하기
            </button>
            <button
              onClick={stopCamera}
              className="h-14 px-6 font-semibold rounded-2xl transition-all active:scale-98"
              style={{
                background: "var(--toss-gray-100)",
                color: "var(--toss-gray-700)"
              }}
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Main CTA Button */}
          <button
            onClick={startCamera}
            disabled={loading}
            className="w-full h-16 text-lg font-semibold rounded-2xl transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-3"
            style={{
              background: loading ? "var(--toss-gray-300)" : "var(--toss-blue)",
              color: "white"
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                분석 중...
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                가격표 촬영하기
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div
                className="w-full border-t"
                style={{ borderColor: "var(--toss-gray-200)" }}
              />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-4 text-sm"
                style={{
                  background: "var(--toss-gray-50)",
                  color: "var(--toss-gray-400)"
                }}
              >
                또는
              </span>
            </div>
          </div>

          {/* Secondary Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full h-14 text-base font-semibold rounded-2xl transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: "var(--toss-gray-100)",
              color: "var(--toss-gray-700)"
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            갤러리에서 선택
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
