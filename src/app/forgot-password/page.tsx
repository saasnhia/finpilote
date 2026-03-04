'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button, Card, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError('Veuillez entrer votre adresse email')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const origin = window.location.origin

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSent(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
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
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-display font-bold text-navy-900 mb-2">
                Email envoy&eacute;
              </h1>
              <p className="text-navy-500 text-sm mb-4">
                Si un compte existe avec l&apos;adresse <strong className="text-navy-700">{email}</strong>,
                vous recevrez un lien de r&eacute;initialisation.
              </p>
              <p className="text-navy-400 text-xs">
                V&eacute;rifiez votre bo&icirc;te de r&eacute;ception et vos spams.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold text-navy-900">
                  Mot de passe oubli&eacute; ?
                </h1>
                <p className="mt-2 text-navy-500 text-sm">
                  Entrez votre email pour recevoir un lien de r&eacute;initialisation
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
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  icon={<Mail className="w-5 h-5" />}
                  disabled={loading}
                />

                <Button type="submit" className="w-full" loading={loading}>
                  Envoyer le lien
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
