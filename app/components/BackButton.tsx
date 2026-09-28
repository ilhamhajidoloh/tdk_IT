"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      กลับหน้าก่อนหน้า
    </button>
  );
}
