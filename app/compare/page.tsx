"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "@/components/camera-capture";
import { PriceResult } from "@/components/price-result";
import { canUseOcr, incrementUsage, getUsageStats } from "@/lib/usage-limit";

interface ProductInfo {
  name: string;
  price: number;
  rawPrice: string;
}

interface OcrResult {
  success: boolean;
  products: ProductInfo[];
  rawText?: string;
  error?: string;
}

export default function ComparePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductInfo[] | null>(null);
  const [error, setError] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [usageWarning, setUsageWarning] = useState("");
  const [usageBlocked, setUsageBlocked] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push("/");
        } else {
          setChecking(false);
          const usage = canUseOcr();
          if (!usage.allowed) {
            setUsageBlocked(true);
            setError(usage.message || "사용량 초과");
          } else if (usage.message) {
            setUsageWarning(usage.message);
          }
        }
      })
      .catch(() => {
        router.push("/");
      });
  }, [router]);

  const handleCapture = async (imageData: string) => {
    const usage = canUseOcr();
    if (!usage.allowed) {
      setUsageBlocked(true);
      setError(usage.message || "이번 달 사용량을 초과했습니다.");
      return;
    }

    setLoading(true);
    setError("");
    setCapturedImage(imageData);

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const result: OcrResult = await response.json();

      if (result.success) {
        incrementUsage();
        const newUsage = canUseOcr();
        if (newUsage.message) {
          setUsageWarning(newUsage.message);
        }
        setProducts(result.products);
        if (result.products.length === 0) {
          setError(result.error || "상품 가격을 인식하지 못했습니다.");
        }
      } else {
        setError(result.error || "OCR 처리에 실패했습니다.");
      }
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setProducts(null);
    setCapturedImage(null);
    setError("");
  };

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--toss-gray-50)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8" style={{ color: "var(--toss-blue)" }} viewBox="0 0 24 24">
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
          <span style={{ color: "var(--toss-gray-500)" }}>로딩 중...</span>
        </div>
      </div>
    );
  }

  const stats = getUsageStats();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--toss-gray-50)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10"
        style={{ background: "white" }}
      >
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--toss-gray-900)" }}
          >
            마트 가격 비교
          </h1>
          <div className="flex items-center gap-2">
            <div
              className="text-sm font-medium px-3 py-1 rounded-full"
              style={{
                background: stats.percentage > 80 ? "rgba(240, 68, 82, 0.1)" : "var(--toss-gray-100)",
                color: stats.percentage > 80 ? "var(--toss-red)" : "var(--toss-gray-600)"
              }}
            >
              {stats.remaining}회 남음
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1" style={{ background: "var(--toss-gray-100)" }}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.min(stats.percentage, 100)}%`,
              background: stats.percentage > 80
                ? "var(--toss-red)"
                : stats.percentage > 50
                ? "#FFB800"
                : "var(--toss-green)"
            }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-6">
        {/* Usage warning */}
        {usageWarning && !usageBlocked && (
          <div
            className="mb-4 px-4 py-3 rounded-2xl text-sm"
            style={{
              background: "rgba(255, 184, 0, 0.1)",
              color: "#B88600"
            }}
          >
            {usageWarning}
          </div>
        )}

        {/* Usage blocked */}
        {usageBlocked ? (
          <div className="toss-card p-8 text-center">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: "rgba(240, 68, 82, 0.1)" }}
            >
              <svg
                className="w-10 h-10"
                style={{ color: "var(--toss-red)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: "var(--toss-gray-900)" }}
            >
              이번 달 사용량을 모두 썼어요
            </h2>
            <p
              className="text-sm mb-2"
              style={{ color: "var(--toss-gray-500)" }}
            >
              무료 사용량 {stats.limit}회를 모두 사용했습니다.
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--toss-gray-400)" }}
            >
              다음 달 1일에 초기화됩니다.
            </p>
          </div>
        ) : products === null ? (
          <div className="space-y-6">
            {/* Instructions Card */}
            <div className="toss-card p-5">
              <h2
                className="font-bold mb-4"
                style={{ color: "var(--toss-gray-900)" }}
              >
                이렇게 사용하세요
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ background: "var(--toss-blue)", color: "white" }}
                  >
                    1
                  </div>
                  <div>
                    <p
                      className="font-medium"
                      style={{ color: "var(--toss-gray-800)" }}
                    >
                      가격표 촬영
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--toss-gray-500)" }}
                    >
                      마트에서 가격표를 촬영하세요
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ background: "var(--toss-blue)", color: "white" }}
                  >
                    2
                  </div>
                  <div>
                    <p
                      className="font-medium"
                      style={{ color: "var(--toss-gray-800)" }}
                    >
                      AI 자동 인식
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--toss-gray-500)" }}
                    >
                      상품명과 가격을 자동으로 인식해요
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ background: "var(--toss-blue)", color: "white" }}
                  >
                    3
                  </div>
                  <div>
                    <p
                      className="font-medium"
                      style={{ color: "var(--toss-gray-800)" }}
                    >
                      쿠팡 가격 비교
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--toss-gray-500)" }}
                    >
                      쿠팡보다 저렴한지 바로 확인하세요
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Camera Capture */}
            <CameraCapture onCapture={handleCapture} loading={loading} />

            {/* Preview captured image */}
            {capturedImage && loading && (
              <div className="toss-card overflow-hidden">
                <img
                  src={capturedImage}
                  alt="촬영된 이미지"
                  className="w-full h-auto opacity-50"
                />
                <div
                  className="p-4 text-center text-sm"
                  style={{ color: "var(--toss-gray-500)" }}
                >
                  이미지 분석 중...
                </div>
              </div>
            )}

            {/* Error message */}
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
          </div>
        ) : (
          <PriceResult products={products} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer
        className="py-4 text-center safe-area-bottom"
        style={{ background: "white" }}
      >
        <p
          className="text-xs"
          style={{ color: "var(--toss-gray-400)" }}
        >
          개인용 가격 비교 서비스
        </p>
      </footer>
    </div>
  );
}
