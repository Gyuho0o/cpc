// Monthly usage limit for Google Vision API
// Free tier: 1,000 requests/month
const MONTHLY_LIMIT = 900; // Leave some buffer

interface UsageData {
  count: number;
  month: string; // Format: "2024-01"
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getUsageCount(): UsageData {
  if (typeof window === "undefined") {
    return { count: 0, month: getCurrentMonth() };
  }

  try {
    const stored = localStorage.getItem("ocr_usage");
    if (!stored) {
      return { count: 0, month: getCurrentMonth() };
    }

    const data: UsageData = JSON.parse(stored);

    // Reset if new month
    if (data.month !== getCurrentMonth()) {
      return { count: 0, month: getCurrentMonth() };
    }

    return data;
  } catch {
    return { count: 0, month: getCurrentMonth() };
  }
}

export function incrementUsage(): UsageData {
  const current = getUsageCount();
  const updated: UsageData = {
    count: current.count + 1,
    month: getCurrentMonth(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("ocr_usage", JSON.stringify(updated));
  }

  return updated;
}

export function canUseOcr(): { allowed: boolean; remaining: number; message?: string } {
  const usage = getUsageCount();
  const remaining = MONTHLY_LIMIT - usage.count;

  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      message: `이번 달 무료 사용량(${MONTHLY_LIMIT}회)을 모두 사용했습니다. 다음 달에 초기화됩니다.`,
    };
  }

  if (remaining <= 100) {
    return {
      allowed: true,
      remaining,
      message: `이번 달 남은 사용량: ${remaining}회`,
    };
  }

  return { allowed: true, remaining };
}

export function getUsageStats(): {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
} {
  const usage = getUsageCount();
  const remaining = Math.max(0, MONTHLY_LIMIT - usage.count);
  const percentage = Math.round((usage.count / MONTHLY_LIMIT) * 100);

  return {
    used: usage.count,
    limit: MONTHLY_LIMIT,
    remaining,
    percentage,
  };
}
