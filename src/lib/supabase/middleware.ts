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
  '/cgu',
  '/confidentialite',
  '/politique-confidentialite',
  '/mentions-legales',
  '/securite',
  '/cabinet',
  '/about',
]

/**
 * Préfixes publics — pas de check auth/subscription.
 * Inclut /auth/ (callback OAuth + magic link), /portail/ (portail client public),
 * et les API publiques.
 */
const PUBLIC_PREFIXES = [
  '/auth/',             // /auth/callback, /auth/login, /auth/register, /auth/forgot-password
  '/portail/',          // /portail/[token] — portail client accessible sans compte
  '/legal/',            // /legal/cgv, /legal/cgu, /legal/politique-confidentialite
  '/api/auth/',
  '/api/health',
  '/api/contact',
  '/api/webhooks/',
  '/api/stripe/',          // /api/stripe/checkout, /api/stripe/webhook, /api/stripe/portal
  '/api/onboarding/',
]

/**
 * Routes accessibles après auth+subscription MAIS sans onboarding obligatoire.
 * Évite la boucle de redirection /onboarding → /onboarding.
 */
const SKIP_ONBOARDING_PATHS = ['/onboarding']

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return true
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

      let isActive =
        profile?.subscription_status === 'active' ||
        profile?.subscription_status === 'trial'

      // Fallback: si user_profiles.subscription_status est désynchronisé,
      // vérifier directement la table subscriptions (gère le race condition
      // webhook + données historiques jamais synchronisées)
      if (!isActive) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .maybeSingle()

        if (sub) {
          isActive = true
          // Auto-sync: corriger user_profiles pour les prochaines requêtes
          const syncStatus = sub.status === 'trialing' ? 'trial' : 'active'
          void supabase
            .from('user_profiles')
            .update({ subscription_status: syncStatus })
            .eq('id', user.id)
            .then(() => { /* fire-and-forget */ })
        }
      }

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
