interface TrialEndingEmailParams {
  prenom: string
  trialEndDate: string
  planName: string
  priceMonthly: number
  dashboardUrl: string
  settingsUrl: string
}

export function generateTrialEndingEmail(params: TrialEndingEmailParams): { subject: string; html: string; text: string } {
  const { prenom, trialEndDate, planName, priceMonthly, dashboardUrl, settingsUrl } = params
  const greeting = prenom ? `Bonjour ${prenom},` : 'Bonjour,'

  const subject = 'Votre essai Worthifast se termine dans 7 jours'

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
      <div style="background:#22D3A5;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:22px">Worthifast</h1>
      </div>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:32px">
        <h2 style="color:#0f172a;margin-top:0;font-size:20px">Votre essai se termine dans 7 jours</h2>

        <p style="color:#475569;line-height:1.7;font-size:15px">
          ${greeting}
        </p>

        <p style="color:#475569;line-height:1.7;font-size:15px">
          Votre essai gratuit se termine le <strong>${trialEndDate}</strong>.
        </p>

        <p style="color:#475569;line-height:1.7;font-size:15px">
          Sans résiliation, votre abonnement <strong>${planName}</strong> à <strong>${priceMonthly}€/mois HT</strong>
          sera automatiquement activé. Aucune action requise si vous souhaitez continuer.
        </p>

        <div style="margin:28px 0">
          <a href="${dashboardUrl}"
            style="background:#22D3A5;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;margin-right:12px">
            Continuer avec Worthifast
          </a>
        </div>

        <p style="color:#475569;line-height:1.7;font-size:15px">
          Pour résilier avant la fin de l'essai :
          <a href="${settingsUrl}" style="color:#22D3A5;text-decoration:underline">Gérer mon abonnement</a>
        </p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />

        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;line-height:1.6">
          Vous recevez cet email car vous avez créé un compte Worthifast.<br />
          Des questions ? Répondez directement à cet email.
        </p>
      </div>
    </div>
  `

  const text = `${greeting}

Votre essai gratuit se termine le ${trialEndDate}.

Sans résiliation, votre abonnement ${planName} à ${priceMonthly}€/mois HT sera automatiquement activé. Aucune action requise si vous souhaitez continuer.

Continuer : ${dashboardUrl}
Résilier : ${settingsUrl}

— L'équipe Worthifast`

  return { subject, html, text }
}
