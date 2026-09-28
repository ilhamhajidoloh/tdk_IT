import Link from "next/link";
import { ShieldCheck } from "lucide-react";

/** Shared footer rendered by the root layout for every route and user role. */
export default function AppFooter() {
  return (
    <footer className="shrink-0 border-t border-border bg-card py-5 text-center text-xs text-muted-foreground">
      <p>&copy; {new Date().getFullYear()} TDK IT Multi-School Platform</p>
      <Link
        href="/privacy-policy"
        className="mt-3 inline-flex items-center rounded-xl border border-primary/25 bg-primary/5 px-3.5 py-2 font-bold text-primary transition-colors hover:bg-primary/10"
      >
        <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        นโยบายความเป็นส่วนตัว
      </Link>
    </footer>
  );
}
