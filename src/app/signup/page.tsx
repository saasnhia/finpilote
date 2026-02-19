'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'
import { Mail, Phone, Calendar, ChevronRight, Shield, Lock } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Image src="/logo.png" alt="FinSoft" width={40} height={40} />
          <span className="font-display font-bold text-2xl text-white">
            Fin<span className="text-emerald-400">Soft</span>
          </span>
        </Link>

        <Card className="animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-display font-bold text-navy-900">
              Acc&egrave;s sur demande
            </h1>
            <p className="mt-2 text-navy-500">
              FinSoft est un logiciel local payant.
              Contactez-nous pour programmer une d&eacute;mo et recevoir votre licence.
            </p>
          </div>

          {/* Pricing reminder */}
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-sm text-emerald-800 font-medium text-center">
              Licences perp&eacute;tuelles d&egrave;s <span className="font-bold">299&euro;</span> &mdash; installation locale &mdash; RGPD
            </p>
          </div>

          {/* Contact options */}
          <div className="space-y-3 mb-8">
            <a
              href="mailto:saasnhia@gmail.com?subject=Demande%20de%20d%C3%A9mo%20FinSoft"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-navy-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 text-navy-700"
            >
              <Mail className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-navy-400">saasnhia@gmail.com</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-navy-400" />
            </a>

            <a
              href="tel:+33611752632"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-navy-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 text-navy-700"
            >
              <Phone className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">T&eacute;l&eacute;phone</p>
                <p className="text-xs text-navy-400">+33 6 11 75 26 32</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-navy-400" />
            </a>
          </div>

          <Link href="/#tarifs">
            <Button className="w-full" icon={<Calendar className="w-5 h-5" />}>
              Voir les tarifs
            </Button>
          </Link>

          {/* RGPD badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-navy-400">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Installation locale &mdash; vos donn&eacute;es restent chez vous</span>
          </div>
        </Card>

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-navy-400 hover:text-navy-300">
            &larr; Retour &agrave; l&apos;accueil
          </Link>
        </p>

        {/* Existing client login */}
        <p className="mt-3 text-center text-sm text-navy-400">
          D&eacute;j&agrave; client ?{' '}
          <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
