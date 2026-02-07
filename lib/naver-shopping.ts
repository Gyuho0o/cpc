export interface NaverShoppingResult {
  success: boolean;
  lowestPrice?: number;
  productName?: string;
  productUrl?: string;
  mallName?: string;
  imageUrl?: string;
  error?: string;
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
    const encodedQuery = encodeURIComponent(productName);
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

    return {
      success: true,
      lowestPrice: parseInt(item.lprice, 10),
      productName: item.title.replace(/<[^>]*>/g, ""), // Remove HTML tags
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
