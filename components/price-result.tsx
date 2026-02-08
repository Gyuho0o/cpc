"use client";

import { useState, useEffect } from "react";
import { formatPriceComparison, extractQuantity, simplifyProductName } from "@/lib/naver-shopping";

interface ProductInfo {
  name: string;
  price: number;
  rawPrice: string;
}

interface NaverResult {
  success: boolean;
  lowestPrice?: number;
  quantity?: number;
  unitPrice?: number;
  productName?: string;
  productUrl?: string;
  mallName?: string;
  imageUrl?: string;
  error?: string;
}

interface PriceResultProps {
  products: ProductInfo[];
  onReset: () => void;
}

interface ComparisonState {
  [key: string]: {
    loading: boolean;
    result?: NaverResult;
  };
}

export function PriceResult({ products, onReset }: PriceResultProps) {
  const [comparisons, setComparisons] = useState<ComparisonState>({});

  // Auto-compare on load
  useEffect(() => {
    products.forEach((product, index) => {
      comparePrice(product, index);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comparePrice = async (product: ProductInfo, index: number) => {
    const key = `${index}-${product.name}`;
    setComparisons((prev) => ({
      ...prev,
      [key]: { loading: true },
    }));

    try {
      const response = await fetch("/api/price-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: product.name }),
      });

      const result: NaverResult = await response.json();

      setComparisons((prev) => ({
        ...prev,
        [key]: { loading: false, result },
      }));
    } catch {
      setComparisons((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          result: {
            success: false,
            error: "비교 실패",
          },
        },
      }));
    }
  };

  if (products.length === 0) {
    return (
      <div className="toss-card p-8 text-center">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: "var(--toss-gray-100)" }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: "var(--toss-gray-400)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3
          className="text-lg font-bold mb-2"
          style={{ color: "var(--toss-gray-900)" }}
        >
          상품을 찾지 못했어요
        </h3>
        <p
          className="text-sm mb-6"
          style={{ color: "var(--toss-gray-500)" }}
        >
          가격표가 잘 보이도록 다시 촬영해주세요
        </p>
        <button
          onClick={onReset}
          className="h-12 px-6 font-semibold rounded-xl transition-all active:scale-98"
          style={{
            background: "var(--toss-blue)",
            color: "white"
          }}
        >
          다시 촬영하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--toss-gray-900)" }}
        >
          인식된 상품 {products.length}개
        </h2>
        <button
          onClick={onReset}
          className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all active:scale-98"
          style={{
            background: "var(--toss-gray-100)",
            color: "var(--toss-gray-600)"
          }}
        >
          다시 촬영
        </button>
      </div>

      {/* Product Cards */}
      {products.map((product, index) => {
        const key = `${index}-${product.name}`;
        const comparison = comparisons[key];

        return (
          <div key={key} className="toss-card overflow-hidden">
            {/* Product Info */}
            <div className="p-5">
              <p
                className="text-sm mb-1"
                style={{ color: "var(--toss-gray-500)" }}
              >
                마트 가격
              </p>
              <h3
                className="text-base font-medium mb-2"
                style={{ color: "var(--toss-gray-800)" }}
              >
                {product.name}
              </h3>
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--toss-blue)" }}
              >
                {product.price.toLocaleString()}
                <span className="text-lg font-medium ml-0.5">원</span>
              </p>
            </div>

            {/* Comparison Result */}
            <div
              className="p-5 border-t"
              style={{ borderColor: "var(--toss-gray-100)" }}
            >
              {comparison?.loading ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <svg className="animate-spin h-5 w-5" style={{ color: "var(--toss-blue)" }} viewBox="0 0 24 24">
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
                  <span style={{ color: "var(--toss-gray-500)" }}>
                    온라인 최저가 검색 중...
                  </span>
                </div>
              ) : comparison?.result?.unitPrice ? (
                (() => {
                  const martQty = extractQuantity(product.name);
                  const martUnitPrice = Math.round(product.price / martQty);
                  const onlineUnitPrice = comparison.result.unitPrice;

                  return (
                    <>
                      {/* 단가 비교 */}
                      <div
                        className="p-3 rounded-xl mb-3"
                        style={{ background: "var(--toss-gray-50)" }}
                      >
                        <p
                          className="text-xs mb-2 font-medium"
                          style={{ color: "var(--toss-gray-500)" }}
                        >
                          개당 단가 비교
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="text-center flex-1">
                            <p className="text-xs" style={{ color: "var(--toss-gray-500)" }}>마트</p>
                            <p className="font-bold" style={{ color: "var(--toss-blue)" }}>
                              {martUnitPrice.toLocaleString()}원
                            </p>
                            {martQty > 1 && (
                              <p className="text-xs" style={{ color: "var(--toss-gray-400)" }}>
                                ({martQty}개입)
                              </p>
                            )}
                          </div>
                          <div
                            className="text-lg font-bold px-3"
                            style={{ color: "var(--toss-gray-300)" }}
                          >
                            vs
                          </div>
                          <div className="text-center flex-1">
                            <p className="text-xs" style={{ color: "var(--toss-gray-500)" }}>온라인</p>
                            <p className="font-bold" style={{ color: "var(--toss-gray-900)" }}>
                              {onlineUnitPrice.toLocaleString()}원
                            </p>
                            {comparison.result.quantity && comparison.result.quantity > 1 && (
                              <p className="text-xs" style={{ color: "var(--toss-gray-400)" }}>
                                ({comparison.result.quantity}개입)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <PriceDifferenceDisplay
                        martPrice={martUnitPrice}
                        onlinePrice={onlineUnitPrice}
                      />
                      {/* 가격 차이가 너무 크면 경고 표시 */}
                      {onlineUnitPrice < martUnitPrice * 0.5 && (
                        <p
                          className="text-xs mt-2 text-center"
                          style={{ color: "var(--toss-gray-500)" }}
                        >
                          ⚠️ 온라인 가격은 대량 구매(박스) 기준일 수 있습니다
                        </p>
                      )}
                  {comparison.result.productUrl && (
                    <a
                      href={comparison.result.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-12 mt-3 font-medium rounded-xl transition-all active:scale-98"
                      style={{
                        background: "var(--toss-gray-100)",
                        color: "var(--toss-gray-700)"
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      상품 보러가기
                    </a>
                  )}
                  <a
                    href={`https://www.coupang.com/np/search?q=${encodeURIComponent(simplifyProductName(product.name))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-12 mt-2 font-medium rounded-xl transition-all active:scale-98"
                    style={{
                      background: "var(--toss-gray-100)",
                      color: "var(--toss-gray-700)"
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    쿠팡에서 검색
                  </a>
                    </>
                  );
                })()
              ) : (
                <div className="py-2">
                  <p
                    className="text-sm mb-3 text-center"
                    style={{ color: "var(--toss-gray-500)" }}
                  >
                    {comparison?.result?.error || "온라인 가격을 찾을 수 없어요"}
                  </p>
                  <a
                    href={`https://www.coupang.com/np/search?q=${encodeURIComponent(simplifyProductName(product.name))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-12 font-medium rounded-xl transition-all active:scale-98"
                    style={{
                      background: "var(--toss-gray-100)",
                      color: "var(--toss-gray-700)"
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    쿠팡에서 검색
                  </a>
                  <button
                    onClick={() => comparePrice(product, index)}
                    className="w-full h-12 mt-2 font-medium rounded-xl transition-all active:scale-98"
                    style={{
                      background: "var(--toss-gray-100)",
                      color: "var(--toss-gray-700)"
                    }}
                  >
                    다시 검색
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PriceDifferenceDisplay({
  martPrice,
  onlinePrice,
}: {
  martPrice: number;
  onlinePrice: number;
}) {
  const { message, color, percentDiff, isMartCheaper } = formatPriceComparison(martPrice, onlinePrice);

  const styles = {
    green: {
      background: "rgba(0, 200, 83, 0.1)",
      color: "var(--toss-green)",
    },
    red: {
      background: "rgba(240, 68, 82, 0.1)",
      color: "var(--toss-red)",
    },
    gray: {
      background: "var(--toss-gray-100)",
      color: "var(--toss-gray-600)",
    },
  };

  const currentStyle = styles[color as keyof typeof styles];

  return (
    <div
      className="p-4 rounded-xl text-center"
      style={currentStyle}
    >
      <p className="font-bold text-lg">{message}</p>
      {percentDiff > 0 && (
        <p className="text-sm mt-1 opacity-80">
          {isMartCheaper ? "마트" : "온라인"}가 {percentDiff}% 저렴
        </p>
      )}
    </div>
  );
}
