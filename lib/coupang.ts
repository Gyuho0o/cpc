export interface CoupangResult {
  success: boolean;
  searchUrl: string;
  price?: number;
  productName?: string;
  productUrl?: string;
  error?: string;
}

export function generateCoupangSearchUrl(productName: string): string {
  const encodedName = encodeURIComponent(productName);
  return `https://www.coupang.com/np/search?component=&q=${encodedName}&channel=user`;
}

export async function fetchCoupangPrice(
  productName: string
): Promise<CoupangResult> {
  const searchUrl = generateCoupangSearchUrl(productName);

  try {
    // Attempt to fetch Coupang search page
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Cache-Control": "max-age=0",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return {
        success: false,
        searchUrl,
        error: `쿠팡 요청 실패: ${response.status}`,
      };
    }

    const html = await response.text();

    // Try to extract first product price from HTML
    const priceResult = extractPriceFromHtml(html);

    if (priceResult) {
      return {
        success: true,
        searchUrl,
        price: priceResult.price,
        productName: priceResult.name,
        productUrl: priceResult.url,
      };
    }

    // If parsing fails, return search URL only
    return {
      success: true,
      searchUrl,
      error: "가격 파싱 실패 - 직접 확인 필요",
    };
  } catch (error) {
    console.error("Coupang fetch error:", error);
    return {
      success: false,
      searchUrl,
      error: "쿠팡 검색 중 오류 발생",
    };
  }
}

function extractPriceFromHtml(
  html: string
): { price: number; name: string; url: string } | null {
  try {
    // Look for price patterns in Coupang HTML
    // Pattern 1: data-product-price attribute
    const priceAttrMatch = html.match(/data-product-price="(\d+)"/);

    // Pattern 2: price-value class
    const priceClassMatch = html.match(
      /<strong[^>]*class="[^"]*price-value[^"]*"[^>]*>[\s\S]*?(\d{1,3}(?:,\d{3})+)[\s\S]*?<\/strong>/
    );

    // Pattern 3: sale-price span
    const salePriceMatch = html.match(
      /<em[^>]*class="[^"]*sale[^"]*"[^>]*>[\s\S]*?(\d{1,3}(?:,\d{3})+)[\s\S]*?<\/em>/
    );

    let price: number | null = null;

    if (priceAttrMatch) {
      price = parseInt(priceAttrMatch[1], 10);
    } else if (priceClassMatch) {
      price = parseInt(priceClassMatch[1].replace(/,/g, ""), 10);
    } else if (salePriceMatch) {
      price = parseInt(salePriceMatch[1].replace(/,/g, ""), 10);
    }

    // Extract product name
    const nameMatch = html.match(
      /<div[^>]*class="[^"]*name[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/
    );
    const name = nameMatch ? nameMatch[1].trim() : "";

    // Extract product URL
    const urlMatch = html.match(
      /<a[^>]*href="(\/vp\/products\/\d+[^"]*)"[^>]*>/
    );
    const url = urlMatch ? `https://www.coupang.com${urlMatch[1]}` : "";

    if (price && price > 0) {
      return { price, name, url };
    }

    return null;
  } catch {
    return null;
  }
}

export function formatPriceDifference(
  offlinePrice: number,
  coupangPrice: number
): {
  difference: number;
  isCheaper: boolean;
  message: string;
  color: string;
} {
  const difference = offlinePrice - coupangPrice;
  const isCheaper = difference < 0;
  const absDiff = Math.abs(difference);

  let message: string;
  let color: string;

  if (difference < 0) {
    message = `마트가 ${absDiff.toLocaleString()}원 저렴합니다!`;
    color = "green";
  } else if (difference > 0) {
    message = `쿠팡이 ${absDiff.toLocaleString()}원 저렴합니다!`;
    color = "red";
  } else {
    message = "가격이 동일합니다";
    color = "gray";
  }

  return { difference, isCheaper, message, color };
}
