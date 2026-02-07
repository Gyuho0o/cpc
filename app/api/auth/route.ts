import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.APP_PASSWORD || "1234";

    if (password === correctPassword) {
      const response = NextResponse.json({ success: true });

      // Set a simple auth cookie (expires in 24 hours)
      response.cookies.set("auth", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "비밀번호가 틀렸습니다." },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "요청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authCookie = request.cookies.get("auth");

  return NextResponse.json({
    authenticated: authCookie?.value === "true",
  });
}
