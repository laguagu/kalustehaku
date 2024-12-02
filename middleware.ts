import { NextResponse } from "next/server";

export function middleware(request: Request) {
  // Tarkistetaan ympäristö ENV-muuttujalla NODE_ENV sijaan
  const isProduction = process.env.NEXT_PUBLIC_ENV === "production";

  if (isProduction) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "API access is blocked in production environment",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
  if (request.method === "POST") {
    // 1. CSRF-tarkistus
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host && new URL(origin).host !== host) {
      return new NextResponse(JSON.stringify({ error: "Invalid origin" }), {
        status: 403,
      });
    }
  }

  return NextResponse.next();
}

// Matcher vain tavaratrading-reiteille
export const config = {
  matcher: "/api/webscrapers/:path*",
};
