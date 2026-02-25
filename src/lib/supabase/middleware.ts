import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Routes publiques — ni auth ni subscription requises */
const PUBLIC_PATHS = [
  '/',
  '/pricing',
  '/login',
  '/signup',
  '/faq',
  '/cgv',
  '/confidentialite',
  '/mentions-legales',
  '/cabinet',
]

/** Préfixes d'API publics — pas de check subscription */
const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/health',
  '/api/contact',
  '/api/webhooks/',
  '/api/stripe/webhook',
]

/**
 * Routes accessibles après auth+subscription MAIS sans onboarding obligatoire.
 * Évite la boucle de redirection /onboarding → /onboarding.
 */
const SKIP_ONBOARDING_PATHS = ['/onboarding']

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))) return true
  return false
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Ne pas exécuter de code entre createServerClient et getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── 1. Route protégée sans session → /login ──────────────────────────────
  if (!isPublicRoute(pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // ── 2. Route protégée + session → vérification subscription + onboarding ─
  if (!isPublicRoute(pathname) && user) {
    const bypassCheck = process.env.BYPASS_SUBSCRIPTION_CHECK === 'true'

    if (!bypassCheck) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_status, onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()

      const isActive =
        profile?.subscription_status === 'active' ||
        profile?.subscription_status === 'trial'

      if (!isActive) {
        const url = request.nextUrl.clone()
        url.pathname = '/pricing'
        url.searchParams.set('message', 'subscription_required')
        return NextResponse.redirect(url)
      }

      // ── 2b. Onboarding non complété → /onboarding ───────────────────────
      const skipOnboarding = SKIP_ONBOARDING_PATHS.some(p => pathname.startsWith(p))
      if (!skipOnboarding && profile?.onboarding_completed === false) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }
  }

  // ── 3. Utilisateur connecté sur /login ou /signup → /dashboard ───────────
  const authPaths = ['/login', '/signup']
  if (authPaths.includes(pathname) && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
