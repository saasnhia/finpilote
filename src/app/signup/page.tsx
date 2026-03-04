'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, User, AlertCircle, Loader2, Shield } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const { user, signUpWithEmail, signInWithGoogle } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmSent, setConfirmSent] = useState(false)

  // Read plan/billing from URL
  const [planKey, setPlanKey] = useState<string | null>(null)
  const [billing, setBilling] = useState<string>('monthly')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('plan')
    const b = params.get('billing')
    if (p) setPlanKey(p)
    if (b) setBilling(b)
  }, [])

  // If user is already logged in and a plan was selected, redirect to checkout
  useEffect(() => {
    if (!user) return
    if (planKey) {
      void startCheckout(planKey, billing)
    } else {
      router.push('/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function startCheckout(plan: string, bill: string) {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan, billing: bill }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        // Fallback: go to onboarding if checkout fails
        router.push('/onboarding')
      }
    } catch {
      router.push('/onboarding')
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch {
      setError('Erreur lors de l\'inscription avec Google')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await signUpWithEmail(email, password, fullName || undefined)
      setConfirmSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'inscription'
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('Cet email est déjà utilisé. Essayez de vous connecter.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  // Confirmation email sent
  if (confirmSent) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-md">
          <Link href="/" className="flex items-center justify-center mb-8">
            <Image src="/logo-white.svg" alt="Worthifast" width={180} height={44} priority className="h-10 w-auto" />
          </Link>
          <Card>
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-display font-bold text-navy-900 mb-2">
                Vérifiez votre email
              </h1>
              <p className="text-navy-500 text-sm mb-4">
                Un email de confirmation a été envoyé à <strong className="text-navy-700">{email}</strong>.
              </p>
              <p className="text-navy-400 text-xs">
                Cliquez sur le lien dans l&apos;email pour activer votre compte,
                puis vous serez redirigé vers votre espace.
              </p>
            </div>
          </Card>
          <p className="mt-6 text-center">
            <Link href="/" className="text-sm text-navy-400 hover:text-navy-300">
              &larr; Retour à l&apos;accueil
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8">
          <Image src="/logo-white.svg" alt="Worthifast" width={180} height={44} priority className="h-10 w-auto" />
        </Link>

        <Card className="animate-scale-in">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-display font-bold text-navy-900">
              Créer votre compte
            </h1>
            <p className="mt-2 text-navy-500 text-sm">
              {planKey
                ? 'Inscrivez-vous pour démarrer votre essai gratuit de 30 jours'
                : 'Inscrivez-vous gratuitement et commencez en quelques minutes'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-coral-50 border border-coral-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-coral-600 flex-shrink-0" />
              <p className="text-sm text-coral-700">{error}</p>
            </div>
          )}

          {/* Google signup */}
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={() => void handleGoogleSignup()}
            loading={loading}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            }
          >
            Continuer avec Google
          </Button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-navy-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-navy-400">ou</span>
            </div>
          </div>

          {/* Email signup form */}
          <form onSubmit={(e) => void handleEmailSignup(e)} className="space-y-3">
            <Input
              label="Nom complet"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Marie Dupont"
              icon={<User className="w-5 h-5" />}
              disabled={loading}
            />
            <Input
              label="Email professionnel"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.fr"
              icon={<Mail className="w-5 h-5" />}
              disabled={loading}
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 caractères minimum"
              icon={<Lock className="w-5 h-5" />}
              disabled={loading}
            />
            <Button type="submit" className="w-full" loading={loading}>
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </Button>
          </form>

          {/* RGPD badge */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-navy-400">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Données hébergées en Europe · Conforme RGPD</span>
          </div>
        </Card>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-navy-400">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            Se connecter
          </Link>
        </p>

        <p className="mt-3 text-center">
          <Link href="/" className="text-sm text-navy-400 hover:text-navy-300">
            &larr; Retour à l&apos;accueil
          </Link>
        </p>
      </div>

      {/* Loading overlay when redirecting to Stripe */}
      {user && planKey && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="font-semibold text-navy-900">Redirection vers le paiement...</p>
            <p className="text-sm text-navy-500 mt-1">Vous allez être redirigé vers Stripe</p>
          </div>
        </div>
      )}
    </div>
  )
}
