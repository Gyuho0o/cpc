"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordForm } from "@/components/password-form";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          router.push("/compare");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
      });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <PasswordForm
      onSuccess={() => {
        router.push("/compare");
      }}
    />
  );
}
