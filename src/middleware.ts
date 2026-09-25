import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Hôte qui doit afficher une page publiée (sous-domaine ou domaine perso), sinon null. */
function publishedHost(request: NextRequest): string | null {
  const host = (request.headers.get("host") || "").toLowerCase().replace(/:\d+$/, "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!host || !appUrl) return null;
  const appHost = new URL(appUrl).hostname;
  const pages = process.env.NEXT_PUBLIC_PAGES_DOMAIN;
  if (host === appHost || host === pages || host === `www.${pages}` || host === "localhost" || host === "127.0.0.1") return null;
  if (host.endsWith(".vercel.app")) return null; // déploiements de prévisualisation
  if (pages && host.endsWith(`.${pages}`)) return host.split(".")[0] === "app" ? null : host;
  return host; // domaine personnalisé d'un client
}

export async function middleware(request: NextRequest) {
  const pageHost = publishedHost(request);
  if (pageHost) {
    const url = request.nextUrl.clone();
    url.pathname = `/serve/${encodeURIComponent(pageHost)}`;
    return NextResponse.rewrite(url);
  }

  const path = request.nextUrl.pathname;
  const needsSession =
    path.startsWith("/studio") || path.startsWith("/connexion") || path.startsWith("/auth") || (path.startsWith("/api") && !path.startsWith("/api/webhooks"));
  let response = NextResponse.next({ request });
  if (!needsSession || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return response;

  // Rafraîchit la session Supabase et protège le studio.
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && path.startsWith("/studio")) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
