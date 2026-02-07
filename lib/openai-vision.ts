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

export async function analyzeImageWithOpenAI(base64Image: string): Promise<OcrResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      products: [],
      error: "OpenAI API 키가 설정되지 않았습니다.",
    };
  }

  try {
    // Ensure proper data URL format
    let imageUrl = base64Image;
    if (!imageUrl.startsWith("data:")) {
      imageUrl = `data:image/jpeg;base64,${base64Image}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `이 이미지는 마트 가격표입니다. 이미지에서 상품명과 가격을 추출해주세요.

반드시 아래 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요:
{
  "products": [
    {"name": "상품명", "price": 숫자, "rawPrice": "원본가격문자열"}
  ]
}

규칙:
- price는 숫자만 (예: 5290)
- rawPrice는 원본 그대로 (예: "5,290원")
- 상품명이 불분명하면 가격표에 보이는 텍스트를 사용
- 가격을 찾을 수 없으면 빈 배열 반환`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        success: true,
        products: [],
        error: "응답에서 내용을 찾을 수 없습니다.",
      };
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: true,
        products: [],
        rawText: content,
        error: "JSON 파싱 실패",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const products: ProductInfo[] = (parsed.products || []).map((p: { name?: string; price?: number; rawPrice?: string }) => ({
      name: p.name || "",
      price: typeof p.price === "number" ? p.price : parseInt(String(p.price).replace(/,/g, ""), 10) || 0,
      rawPrice: p.rawPrice || `${p.price}원`,
    }));

    return {
      success: true,
      products,
      rawText: content,
    };
  } catch (error) {
    console.error("OpenAI Vision Error:", error);
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : "OpenAI 처리 중 오류 발생",
    };
  }
}
