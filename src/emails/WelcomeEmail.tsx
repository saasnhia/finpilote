/**
 * WelcomeEmail — Générateur d'email de bienvenue FinSoft
 * Retourne { subject, html, text } — pas de dépendance @react-email
 */

interface WelcomeEmailParams {
  prenom?: string
  email: string
}

interface WelcomeEmailResult {
  subject: string
  html: string
  text: string
}

export function generateWelcomeEmail(params: WelcomeEmailParams): WelcomeEmailResult {
  const name = params.prenom || params.email.split('@')[0]
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://finpilote.vercel.app'

  const subject = `Bienvenue sur FinSoft 🎉 — votre essai de 30 jours commence`

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue sur FinSoft</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">

    <!-- Header -->
    <div style="background:#0F172A;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center">
      <div style="display:inline-flex;align-items:center;gap:8px">
        <div style="width:36px;height:36px;background:#22D3A5;border-radius:10px;display:inline-flex;align-items:center;justify-content:center">
          <span style="color:#0F172A;font-size:18px;font-weight:900">F</span>
        </div>
        <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px">Fin<span style="color:#22D3A5">Soft</span></span>
      </div>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:40px">

      <!-- Welcome -->
      <h1 style="color:#0F172A;font-size:24px;font-weight:700;margin:0 0 8px">
        Bienvenue, ${name} ! 👋
      </h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px">
        Votre compte FinSoft est prêt. Vous disposez de <strong>30 jours d'essai gratuit</strong>
        pour découvrir toutes les fonctionnalités.
      </p>

      <!-- Trial badge -->
      <div style="background:#f0fdf9;border:1px solid #bbf7e0;border-radius:12px;padding:16px 20px;margin:0 0 32px">
        <p style="color:#065f46;font-size:14px;font-weight:600;margin:0 0 4px">✅ Essai gratuit de 30 jours activé</p>
        <p style="color:#047857;font-size:13px;margin:0">Aucune carte bancaire requise — annulable à tout moment.</p>
      </div>

      <!-- Checklist premiers pas -->
      <h2 style="color:#0F172A;font-size:16px;font-weight:600;margin:0 0 16px">
        3 premières étapes recommandées
      </h2>

      <table style="width:100%;border-collapse:collapse;margin:0 0 32px">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:top">
            <div style="display:inline-flex;align-items:center;gap:12px">
              <div style="width:32px;height:32px;background:#22D3A5;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
                <span style="color:#fff;font-size:14px;font-weight:700">1</span>
              </div>
              <div>
                <p style="color:#0F172A;font-size:14px;font-weight:600;margin:0 0 2px">Importer votre premier relevé bancaire</p>
                <p style="color:#64748b;font-size:13px;margin:0">CSV, OFX ou connexion directe GoCardless</p>
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:top">
            <div style="display:inline-flex;align-items:center;gap:12px">
              <div style="width:32px;height:32px;background:#22D3A5;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
                <span style="color:#fff;font-size:14px;font-weight:700">2</span>
              </div>
              <div>
                <p style="color:#0F172A;font-size:14px;font-weight:600;margin:0 0 2px">Créer votre première facture client</p>
                <p style="color:#64748b;font-size:13px;margin:0">Numérotation automatique, PDF généré instantanément</p>
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;vertical-align:top">
            <div style="display:inline-flex;align-items:center;gap:12px">
              <div style="width:32px;height:32px;background:#22D3A5;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
                <span style="color:#fff;font-size:14px;font-weight:700">3</span>
              </div>
              <div>
                <p style="color:#0F172A;font-size:14px;font-weight:600;margin:0 0 2px">Configurer votre déclaration TVA</p>
                <p style="color:#64748b;font-size:13px;margin:0">CA3 pré-remplie, prête à déposer sur impots.gouv.fr</p>
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <div style="text-align:center;margin:0 0 32px">
        <a href="${dashboardUrl}/dashboard"
          style="background:#22D3A5;color:#0F172A;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
          Accéder à mon tableau de bord →
        </a>
      </div>

      <!-- Separator -->
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 24px" />

      <!-- Support -->
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;text-align:center">
        Une question ? Répondez directement à cet email.<br />
        Notre équipe vous répond sous 24h (jours ouvrés).<br />
        <br />
        <span style="font-size:11px">FinSoft — Comptabilité intelligente hébergée en France 🇫🇷</span>
      </p>
    </div>

    <!-- Footer -->
    <p style="color:#cbd5e1;font-size:11px;text-align:center;margin:16px 0 40px">
      Vous recevez cet email car vous venez de créer un compte FinSoft avec ${params.email}.<br />
      © ${new Date().getFullYear()} FinSoft — IAE Dijon, Dijon, France
    </p>
  </div>
</body>
</html>
  `.trim()

  const text = `
Bienvenue sur FinSoft, ${name} !

Votre compte est prêt. Vous disposez de 30 jours d'essai gratuit.

3 premières étapes recommandées :
1. Importer votre premier relevé bancaire
2. Créer votre première facture client
3. Configurer votre déclaration TVA

Accédez à votre tableau de bord : ${dashboardUrl}/dashboard

Des questions ? Répondez à cet email — nous répondons sous 24h.

© ${new Date().getFullYear()} FinSoft — Hébergé en France 🇫🇷
  `.trim()

  return { subject, html, text }
}
