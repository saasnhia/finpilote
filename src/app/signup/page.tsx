'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const { signInWithGoogle, signUpWithEmail } = useAuth()
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleGoogleSignup = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch (err) {
      setError('Erreur lors de l\'inscription avec Google')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fullName || !email || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await signUpWithEmail(email, password, fullName)
      setSuccess(true)
    } catch (err: unknown) {
      if (err instanceof Error && err.message?.includes('already registered')) {
        setError('Cet email est déjà utilisé')
      } else {
        setError('Erreur lors de l\'inscription')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <Card className="relative max-w-md w-full text-center animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-navy-900 mb-4">
            Vérifiez votre email
          </h1>
          <p className="text-navy-500 mb-6">
            Nous avons envoyé un lien de confirmation à{' '}
            <span className="font-medium text-navy-700">{email}</span>.
            Cliquez dessus pour activer votre compte.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Retour à la connexion
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

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
              Créer un compte
            </h1>
            <p className="mt-2 text-navy-500">
              Commencez à piloter votre rentabilité
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-coral-50 border border-coral-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-coral-600 flex-shrink-0" />
              <p className="text-sm text-coral-700">{error}</p>
            </div>
          )}

          {/* Google Signup */}
          <Button
            variant="outline"
            className="w-full mb-6"
            onClick={handleGoogleSignup}
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

          {/* Email Signup Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <Input
              label="Nom complet"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jean Dupont"
              icon={<User className="w-5 h-5" />}
              disabled={loading}
            />
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
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              disabled={loading}
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              Créer mon compte
            </Button>
          </form>

          {/* Terms */}
          <p className="mt-6 text-xs text-navy-400 text-center">
            En créant un compte, vous acceptez nos{' '}
            <Link href="#" className="text-emerald-600 hover:underline">
              conditions d&apos;utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="#" className="text-emerald-600 hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-navy-500">
            Déjà un compte ?{' '}
            <Link 
              href="/login"
              className="font-medium text-emerald-600 hover:text-emerald-700"
            >
              Se connecter
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
    </div>
  )
}
