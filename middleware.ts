import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Tarkista basic auth kaikille suojatuille reiteille
  const basicAuth = checkBasicAuth(request);
  if (basicAuth) return basicAuth;

  // Tarkista ympäristö
  const isProduction = process.env.NEXT_PUBLIC_ENV === "production";

  // Salli vain Basic Auth production ympäristössä webscrapers-reitille
  if (request.nextUrl.pathname.startsWith("/api/webscrapers") && isProduction) {
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

  // CSRF-tarkistus POST-pyynnöille
  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // Salli Kubernetes CronJobin kutsut (ei origin headeria)
    if (!origin && request.nextUrl.pathname.startsWith("/api/cron")) {
      return NextResponse.next();
    }

    if (origin && host && new URL(origin).host !== host) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Invalid origin",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  }

  return NextResponse.next();
}

function checkBasicAuth(request: NextRequest) {
  // Tarkista onko reitti suojattu
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/api/cron");

  if (!isProtectedRoute) return null;

  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Unauthorized",
      }),
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Area"',
          "Content-Type": "application/json",
        },
      },
    );
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "utf-8",
  );
  const [username, password] = credentials.split(":");

  if (
    username !== process.env.SCRAPER_USERNAME ||
    password !== process.env.SCRAPER_PASSWORD
  ) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Unauthorized",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  return null;
}

export const config = {
  matcher: ["/api/webscrapers/:path*", "/api/cron/:path*"],
};

// if (request.method === "POST") {
//   // Skip CSRF check for cron jobs
//   const isCronJob = request.headers.get('x-vercel-cron') === process.env.CRON_SECRET;

//   if (!isCronJob) {
//     // Regular CSRF check for non-cron requests
//     const origin = request.headers.get("origin");
//     const host = request.headers.get("host");

//     if (origin && host && new URL(origin).host !== host) {
//       return new NextResponse(JSON.stringify({ error: "Invalid origin" }), {
//         status: 403,
//       });
//     }
//   }
// }
