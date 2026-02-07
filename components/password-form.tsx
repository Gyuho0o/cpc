"use client";

import { useState } from "react";

interface PasswordFormProps {
  onSuccess: () => void;
}

export function PasswordForm({ onSuccess }: PasswordFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || "비밀번호가 틀렸습니다.");
      }
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col toss-bg">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo/Title Area */}
        <div className="mb-12 text-center">
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: "var(--toss-blue)" }}
          >
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--toss-gray-900)" }}
          >
            마트 가격 비교
          </h1>
          <p style={{ color: "var(--toss-gray-500)" }}>
            쿠팡보다 저렴한지 바로 확인하세요
          </p>
        </div>

        {/* Password Input Card */}
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit}>
            <div className="toss-card p-6 mb-4">
              <label
                className="block text-sm font-medium mb-3"
                style={{ color: "var(--toss-gray-700)" }}
              >
                비밀번호
              </label>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-4 text-lg rounded-xl border-2 transition-colors focus:outline-none"
                style={{
                  borderColor: error ? "var(--toss-red)" : "var(--toss-gray-200)",
                  background: "var(--toss-gray-50)"
                }}
                onFocus={(e) => {
                  if (!error) e.target.style.borderColor = "var(--toss-blue)";
                }}
                onBlur={(e) => {
                  if (!error) e.target.style.borderColor = "var(--toss-gray-200)";
                }}
                autoFocus
              />
              {error && (
                <p
                  className="mt-3 text-sm"
                  style={{ color: "var(--toss-red)" }}
                >
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full h-14 text-lg font-semibold rounded-2xl transition-all disabled:opacity-50"
              style={{
                background: loading || !password ? "var(--toss-gray-300)" : "var(--toss-blue)",
                color: "white"
              }}
            >
              {loading ? "확인 중..." : "입장하기"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p
          className="text-sm"
          style={{ color: "var(--toss-gray-400)" }}
        >
          개인용 가격 비교 서비스
        </p>
      </div>
    </div>
  );
}
