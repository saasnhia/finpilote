'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signInWithGoogle, signInWithEmail } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirect = searchParams.get('redirect') || '/dashboard'

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch (err) {
      setError('Erreur lors de la connexion avec Google')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await signInWithEmail(email, password)
      router.push(redirect)
    } catch (err) {
      setError('Email ou mot de passe incorrect')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Logo */}
      <Link href="/" className="flex items-center justify-center gap-2 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold">FS</span>
        </div>
        <span className="font-display font-bold text-2xl text-white">
          FinSoft
        </span>
      </Link>

      <Card className="animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-navy-900">
            Bon retour !
          </h1>
          <p className="mt-2 text-navy-500">
            Connectez-vous pour accéder à votre dashboard
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-coral-50 border border-coral-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-coral-600 flex-shrink-0" />
            <p className="text-sm text-coral-700">{error}</p>
          </div>
        )}

        {/* Google Login */}
        <Button
          variant="outline"
          className="w-full mb-6"
          onClick={handleGoogleLogin}
          loading={loading}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          }
        >
          Continuer avec Google
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-navy-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-navy-400">ou</span>
          </div>
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.fr"
            icon={<Mail className="w-5 h-5" />}
            disabled={loading}
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="w-5 h-5" />}
            disabled={loading}
          />

          <div className="flex justify-end">
            <Link 
              href="/forgot-password"
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={loading}
          >
            Se connecter
          </Button>
        </form>

        {/* Access link */}
        <p className="mt-6 text-center text-sm text-navy-500">
          Pas encore de licence ?{' '}
          <Link
            href="/signup"
            className="font-medium text-emerald-600 hover:text-emerald-700"
          >
            Demander une d&eacute;mo
          </Link>
        </p>
      </Card>

      {/* Back to home */}
      <p className="mt-6 text-center">
        <Link 
          href="/"
          className="text-sm text-navy-400 hover:text-navy-300"
        >
          ← Retour à l&apos;accueil
        </Link>
      </p>
    </div>
  )
}

function LoginFormFallback() {
  return (
    <div className="relative w-full max-w-md flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}