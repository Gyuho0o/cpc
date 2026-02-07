export interface NaverShoppingResult {
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

// 검색어 정제: 용량, 수량 등 불필요한 정보 제거
export function simplifyProductName(name: string): string {
  return name
    // 용량 패턴 제거: 113G, 500ml, 1.5L 등
    .replace(/\d+(\.\d+)?\s*(g|kg|ml|l|리터|그램|킬로그램|밀리리터)\b/gi, "")
    // 수량 패턴 제거: *4, x6, 3개입 등
    .replace(/[*xX×]\s*\d+/g, "")
    .replace(/\d+\s*(개입|입|팩|봉|병|캔|ea)/gi, "")
    // 연속 공백 정리
    .replace(/\s+/g, " ")
    .trim();
}

// 상품명에서 수량 추출
export function extractQuantity(name: string): number {
  // *4, x6, ×3 패턴
  const multiplyMatch = name.match(/[*xX×]\s*(\d+)/);
  if (multiplyMatch) {
    return parseInt(multiplyMatch[1], 10);
  }

  // 4개입, 6입, 3팩 패턴
  const packMatch = name.match(/(\d+)\s*(개입|입|팩|봉|병|캔|ea)/i);
  if (packMatch) {
    return parseInt(packMatch[1], 10);
  }

  return 1;
}

// 네이버 상품명에서 수량 추출 (더 넓은 패턴)
export function extractQuantityFromNaverTitle(title: string): number {
  // 4개, 6개입, 3팩 등
  const packMatch = title.match(/(\d+)\s*(개입|개|입|팩|봉|병|캔|세트|박스)/i);
  if (packMatch) {
    const qty = parseInt(packMatch[1], 10);
    if (qty > 0 && qty <= 100) return qty;
  }

  // *4, x6 패턴
  const multiplyMatch = title.match(/[*xX×]\s*(\d+)/);
  if (multiplyMatch) {
    return parseInt(multiplyMatch[1], 10);
  }

  return 1;
}

export async function searchNaverShopping(
  productName: string
): Promise<NaverShoppingResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      success: false,
      error: "네이버 API 키가 설정되지 않았습니다.",
    };
  }

  try {
    const simplifiedName = simplifyProductName(productName);
    const encodedQuery = encodeURIComponent(simplifiedName);
    const response = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodedQuery}&display=5&sort=asc`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Naver API Error:", errorText);
      return {
        success: false,
        error: `네이버 API 요청 실패: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        error: "검색 결과가 없습니다.",
      };
    }

    // Get the lowest price item
    const item = data.items[0];
    const title = item.title.replace(/<[^>]*>/g, ""); // Remove HTML tags
    const price = parseInt(item.lprice, 10);
    const quantity = extractQuantityFromNaverTitle(title);
    const unitPrice = Math.round(price / quantity);

    return {
      success: true,
      lowestPrice: price,
      quantity,
      unitPrice,
      productName: title,
      productUrl: item.link,
      mallName: item.mallName,
      imageUrl: item.image,
    };
  } catch (error) {
    console.error("Naver Shopping Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "네이버 쇼핑 검색 중 오류 발생",
    };
  }
}

export function formatPriceComparison(
  martPrice: number,
  onlinePrice: number
): {
  difference: number;
  percentDiff: number;
  isMartCheaper: boolean;
  message: string;
  color: string;
} {
  const difference = martPrice - onlinePrice;
  const percentDiff = Math.round((Math.abs(difference) / onlinePrice) * 100);
  const isMartCheaper = difference < 0;
  const absDiff = Math.abs(difference);

  let message: string;
  let color: string;

  if (difference < 0) {
    message = `마트가 ${absDiff.toLocaleString()}원 저렴해요!`;
    color = "green";
  } else if (difference > 0) {
    message = `온라인이 ${absDiff.toLocaleString()}원 저렴해요`;
    color = "red";
  } else {
    message = "가격이 동일해요";
    color = "gray";
  }

  return { difference, percentDiff, isMartCheaper, message, color };
}
