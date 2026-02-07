import { NextRequest, NextResponse } from "next/server";
import { searchNaverShopping } from "@/lib/naver-shopping";

export async function POST(request: NextRequest) {
  // Check authentication
  const authCookie = request.cookies.get("auth");
  if (authCookie?.value !== "true") {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const { productName } = await request.json();

    if (!productName) {
      return NextResponse.json(
        { error: "상품명이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    const result = await searchNaverShopping(productName);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Price Compare API Error:", error);
    return NextResponse.json(
      { error: "가격 비교 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
