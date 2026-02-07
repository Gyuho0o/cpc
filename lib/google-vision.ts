export interface OcrResult {
  success: boolean;
  products: ProductInfo[];
  rawText?: string;
  error?: string;
}

export interface ProductInfo {
  name: string;
  price: number;
  rawPrice: string;
}

export async function analyzeImage(base64Image: string): Promise<OcrResult> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

  if (!apiKey || apiKey === "your_google_cloud_api_key_here") {
    return {
      success: false,
      products: [],
      error: "Google Cloud API 키가 설정되지 않았습니다.",
    };
  }

  try {
    // Remove data URL prefix if present
    const imageContent = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageContent,
              },
              features: [
                {
                  type: "TEXT_DETECTION",
                  maxResults: 50,
                },
              ],
              imageContext: {
                languageHints: ["ko", "en"],
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "API 요청 실패");
    }

    const data = await response.json();
    const textAnnotations = data.responses?.[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return {
        success: true,
        products: [],
        rawText: "",
        error: "이미지에서 텍스트를 찾을 수 없습니다.",
      };
    }

    const fullText = textAnnotations[0].description;
    const products = extractProductsFromText(fullText);

    return {
      success: true,
      products,
      rawText: fullText,
    };
  } catch (error) {
    console.error("OCR Error:", error);
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : "OCR 처리 중 오류 발생",
    };
  }
}

function extractProductsFromText(text: string): ProductInfo[] {
  const products: ProductInfo[] = [];
  const lines = text.split("\n");

  // Price patterns for Korean won
  const pricePatterns = [
    /(\d{1,3}(?:,\d{3})+)\s*원/g, // 1,234원
    /(\d{1,3}(?:,\d{3})+)원/g, // 1,234원 (no space)
    /₩\s*(\d{1,3}(?:,\d{3})+)/g, // ₩1,234
    /(\d{4,})\s*원/g, // 1234원 (no comma)
  ];

  // Find all prices in the text
  const priceMatches: { price: number; rawPrice: string; index: number }[] = [];

  for (const pattern of pricePatterns) {
    let match;
    const testText = text;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(testText)) !== null) {
      const priceStr = match[1].replace(/,/g, "");
      const price = parseInt(priceStr, 10);
      if (price >= 100 && price <= 10000000) {
        // Valid price range
        priceMatches.push({
          price,
          rawPrice: match[0],
          index: match.index,
        });
      }
    }
  }

  // For each price, try to find associated product name
  for (const priceMatch of priceMatches) {
    // Look for text before the price (potential product name)
    const textBefore = text.substring(
      Math.max(0, priceMatch.index - 100),
      priceMatch.index
    );
    const linesBefore = textBefore.split("\n");
    const lastLine = linesBefore[linesBefore.length - 1]?.trim();

    // Also check the same line for product name
    const sameLine = lines.find((line) => line.includes(priceMatch.rawPrice));

    let productName = "";

    if (sameLine) {
      // Extract product name from the same line (before the price)
      const priceIndex = sameLine.indexOf(priceMatch.rawPrice);
      productName = sameLine.substring(0, priceIndex).trim();
    }

    if (!productName && lastLine) {
      // Use text from before if same line didn't have name
      productName = lastLine;
    }

    // Clean up product name
    productName = productName
      .replace(/[0-9,]+\s*원/g, "") // Remove other prices
      .replace(/₩[0-9,]+/g, "")
      .replace(/^\s*[-•·]\s*/, "") // Remove bullet points
      .trim();

    if (productName.length >= 2 && productName.length <= 50) {
      // Avoid duplicates
      const isDuplicate = products.some(
        (p) =>
          p.name === productName ||
          (p.price === priceMatch.price && p.name.includes(productName))
      );

      if (!isDuplicate) {
        products.push({
          name: productName,
          price: priceMatch.price,
          rawPrice: priceMatch.rawPrice,
        });
      }
    }
  }

  return products;
}
