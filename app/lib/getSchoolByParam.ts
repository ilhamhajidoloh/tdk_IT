import { NextRequest } from "next/server";

/**
 * Extracts school subdomain parameter from request URL query string or host header.
 * Defaults to 'main' if no parameter/subdomain is provided.
 */
export function getSchoolFromUrl(req: NextRequest | Request): string {
  const url = new URL(req.url);
  const schoolParam = url.searchParams.get("school") || url.searchParams.get("subdomain");
  if (schoolParam && schoolParam.trim() !== "") {
    return schoolParam.trim().toLowerCase();
  }

  const host = req.headers.get("host") || "";
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1") && !host.includes("vercel.app")) {
    const parts = host.split(".");
    if (parts.length > 2 && parts[0] && parts[0] !== "www") {
      return parts[0].toLowerCase();
    }
  }

  return "main";
}
