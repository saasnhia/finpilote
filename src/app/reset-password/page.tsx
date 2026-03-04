'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caract\u00e8res')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch {
      setError('Une erreur est survenue. Veuillez r\u00e9essayer.')
    } finally {
      setLoading(false)
    }
  }

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

        <Card className="animate-scale-in">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-display font-bold text-navy-900 mb-2">
                Mot de passe modifi&eacute;
              </h1>
              <p className="text-navy-500 text-sm">
                Vous allez &ecirc;tre redirig&eacute; vers votre dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold text-navy-900">
                  Nouveau mot de passe
                </h1>
                <p className="mt-2 text-navy-500 text-sm">
                  Choisissez un nouveau mot de passe pour votre compte
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-coral-50 border border-coral-200 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-coral-600 flex-shrink-0" />
                  <p className="text-sm text-coral-700">{error}</p>
                </div>
              )}

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 caract\u00e8res minimum"
                  icon={<Lock className="w-5 h-5" />}
                  disabled={loading}
                />
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retapez votre mot de passe"
                  icon={<Lock className="w-5 h-5" />}
                  disabled={loading}
                />

                <Button type="submit" className="w-full" loading={loading}>
                  Modifier le mot de passe
                </Button>
              </form>
            </>
          )}
        </Card>

        <p className="mt-6 text-center text-sm text-navy-400">
          <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            &larr; Retour &agrave; la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
