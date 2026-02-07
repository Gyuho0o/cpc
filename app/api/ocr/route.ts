import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/google-vision";
import { analyzeImageWithOpenAI } from "@/lib/openai-vision";

export async function POST(request: NextRequest) {
  // Check authentication
  const authCookie = request.cookies.get("auth");
  if (authCookie?.value !== "true") {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const { image, provider = "openai" } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "이미지가 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    let result;

    if (provider === "openai") {
      result = await analyzeImageWithOpenAI(image);
    } else {
      result = await analyzeImage(image);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("OCR API Error:", error);
    return NextResponse.json(
      { error: "OCR 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
