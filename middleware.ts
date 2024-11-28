import { NextResponse } from "next/server";

export function middleware() {
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

  return NextResponse.next();
}

// Matcher vain tavaratrading-reiteille
export const config = {
  matcher: "/api/tavaratrading/:path*",
};
