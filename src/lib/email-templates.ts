import type { TypeRappel } from '@/types'

interface TemplateData {
  nom_client: string
  nom_entreprise: string
  numero_facture: string
  montant_ttc: string
  montant_restant: string
  date_echeance: string
  jours_retard: number
  objet?: string
}

interface EmailTemplate {
  sujet: string
  contenu: string
  html: string
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function baseHtml(body: string, accentColor: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:${accentColor};padding:24px 32px;">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">FinSoft</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Rappel de paiement</p>
  </td></tr>
  <tr><td style="padding:32px;">${body}</td></tr>
  <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
      Cet email a été envoyé automatiquement via FinSoft. En cas de question, contactez directement l'émetteur de la facture.
    </p>
  </td></tr>
</table>
</body></html>`
}

export function generateEmailTemplate(
  type: TypeRappel,
  data: TemplateData
): EmailTemplate {
  const dateFormatted = formatDate(data.date_echeance)
  const objetLine = data.objet ? ` (${data.objet})` : ''

  switch (type) {
    case 'rappel_7j': {
      const sujet = `Rappel : Facture ${data.numero_facture} en attente de règlement`
      const contenu = `Bonjour ${data.nom_client},

Nous nous permettons de vous rappeler que la facture ${data.numero_facture}${objetLine} d'un montant de ${data.montant_restant} € est arrivée à échéance le ${dateFormatted}.

Sauf erreur ou omission de notre part, ce règlement ne nous est pas encore parvenu. Nous vous remercions de bien vouloir procéder au paiement dans les meilleurs délais.

Si le règlement a déjà été effectué, merci de ne pas tenir compte de ce message.

Cordialement,
${data.nom_entreprise}`

      const html = baseHtml(`
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Bonjour <strong>${data.nom_client}</strong>,</p>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
          Nous nous permettons de vous rappeler que la facture ci-dessous est arrivée à échéance :
        </p>
        <table style="width:100%;background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #e5e7eb;" cellpadding="8">
          <tr><td style="color:#6b7280;font-size:13px;width:140px;">Facture n°</td><td style="color:#111827;font-size:14px;font-weight:600;">${data.numero_facture}</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Montant dû</td><td style="color:#111827;font-size:14px;font-weight:600;">${data.montant_restant} €</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Échéance</td><td style="color:#dc2626;font-size:14px;font-weight:600;">${dateFormatted}</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Retard</td><td style="color:#f59e0b;font-size:14px;font-weight:600;">${data.jours_retard} jours</td></tr>
        </table>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
          Nous vous remercions de bien vouloir procéder au règlement dans les meilleurs délais.
        </p>
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-style:italic;">Si le paiement a déjà été effectué, merci de ne pas tenir compte de ce message.</p>
        <p style="margin:24px 0 0;color:#374151;font-size:14px;">Cordialement,<br><strong>${data.nom_entreprise}</strong></p>
      `, '#f59e0b')

      return { sujet, contenu, html }
    }

    case 'rappel_15j': {
      const sujet = `Second rappel : Facture ${data.numero_facture} – ${data.jours_retard} jours de retard`
      const contenu = `Bonjour ${data.nom_client},

Malgré notre précédent rappel, nous constatons que la facture ${data.numero_facture}${objetLine} d'un montant de ${data.montant_restant} € reste impayée.

L'échéance était fixée au ${dateFormatted}, soit un retard de ${data.jours_retard} jours.

Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais afin d'éviter toute procédure de recouvrement.

Cordialement,
${data.nom_entreprise}`

      const html = baseHtml(`
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Bonjour <strong>${data.nom_client}</strong>,</p>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
          Malgré notre précédent rappel, nous constatons que la facture ci-dessous reste impayée :
        </p>
        <table style="width:100%;background:#fef3c7;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #f59e0b;" cellpadding="8">
          <tr><td style="color:#6b7280;font-size:13px;width:140px;">Facture n°</td><td style="color:#111827;font-size:14px;font-weight:600;">${data.numero_facture}</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Montant dû</td><td style="color:#111827;font-size:16px;font-weight:700;">${data.montant_restant} €</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Échéance</td><td style="color:#dc2626;font-size:14px;font-weight:600;">${dateFormatted}</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Retard</td><td style="color:#dc2626;font-size:14px;font-weight:700;">${data.jours_retard} jours</td></tr>
        </table>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
          Nous vous prions de bien vouloir <strong>régulariser cette situation dans les plus brefs délais</strong> afin d'éviter toute procédure de recouvrement.
        </p>
        <p style="margin:24px 0 0;color:#374151;font-size:14px;">Cordialement,<br><strong>${data.nom_entreprise}</strong></p>
      `, '#ea580c')

      return { sujet, contenu, html }
    }

    case 'rappel_30j': {
      const sujet = `URGENT : Facture ${data.numero_facture} impayée – ${data.jours_retard} jours de retard`
      const contenu = `Bonjour ${data.nom_client},

Nous vous informons que, malgré nos relances précédentes, la facture ${data.numero_facture}${objetLine} d'un montant de ${data.montant_restant} € demeure impayée depuis ${data.jours_retard} jours.

L'échéance était fixée au ${dateFormatted}.

Sans règlement de votre part sous 8 jours, nous nous verrons contraints d'engager une procédure de recouvrement, incluant l'application des pénalités de retard prévues par la loi (article L441-10 du Code de commerce).

Nous vous invitons à régulariser cette situation dans les meilleurs délais.

Cordialement,
${data.nom_entreprise}`

      const html = baseHtml(`
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Bonjour <strong>${data.nom_client}</strong>,</p>
        <div style="background:#fef2f2;border:1px solid #dc2626;border-radius:8px;padding:12px 16px;margin:0 0 20px;">
          <p style="margin:0;color:#991b1b;font-size:13px;font-weight:600;">&#9888; Dernier rappel avant procédure de recouvrement</p>
        </div>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
          Malgré nos relances précédentes, la facture ci-dessous demeure impayée :
        </p>
        <table style="width:100%;background:#fef2f2;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #fca5a5;" cellpadding="8">
          <tr><td style="color:#6b7280;font-size:13px;width:140px;">Facture n°</td><td style="color:#111827;font-size:14px;font-weight:600;">${data.numero_facture}</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Montant dû</td><td style="color:#dc2626;font-size:18px;font-weight:700;">${data.montant_restant} €</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Échéance</td><td style="color:#dc2626;font-size:14px;font-weight:600;">${dateFormatted}</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Retard</td><td style="color:#dc2626;font-size:14px;font-weight:700;">${data.jours_retard} jours</td></tr>
        </table>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
          Sans règlement de votre part sous <strong>8 jours</strong>, nous serons contraints d'engager une procédure de recouvrement, incluant l'application des pénalités de retard (art. L441-10 du Code de commerce).
        </p>
        <p style="margin:24px 0 0;color:#374151;font-size:14px;">Cordialement,<br><strong>${data.nom_entreprise}</strong></p>
      `, '#dc2626')

      return { sujet, contenu, html }
    }

    case 'mise_en_demeure': {
      const sujet = `Mise en demeure : Facture ${data.numero_facture} – Recouvrement imminent`
      const contenu = `Madame, Monsieur,

Par la présente, nous vous mettons en demeure de régler la somme de ${data.montant_restant} € correspondant à la facture ${data.numero_facture}${objetLine}, arrivée à échéance le ${dateFormatted}, soit un retard de ${data.jours_retard} jours.

Conformément aux dispositions de l'article L441-10 du Code de commerce, des pénalités de retard ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 € sont exigibles de plein droit.

À défaut de règlement intégral dans un délai de 8 jours à compter de la réception de la présente, nous transmettrons le dossier à notre service contentieux pour recouvrement judiciaire.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

${data.nom_entreprise}`

      const html = baseHtml(`
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Madame, Monsieur,</p>
        <div style="background:#450a0a;border-radius:8px;padding:16px;margin:0 0 20px;">
          <p style="margin:0;color:#fecaca;font-size:14px;font-weight:700;">MISE EN DEMEURE</p>
          <p style="margin:4px 0 0;color:#fca5a5;font-size:12px;">Lettre recommandée avec accusé de réception conseillée</p>
        </div>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
          Par la présente, nous vous mettons en demeure de régler la somme de <strong style="color:#dc2626;font-size:16px;">${data.montant_restant} €</strong> correspondant à :
        </p>
        <table style="width:100%;background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #e5e7eb;" cellpadding="8">
          <tr><td style="color:#6b7280;font-size:13px;width:140px;">Facture n°</td><td style="color:#111827;font-size:14px;font-weight:600;">${data.numero_facture}</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Montant dû</td><td style="color:#dc2626;font-size:16px;font-weight:700;">${data.montant_restant} €</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Échéance</td><td style="color:#111827;font-size:14px;">${dateFormatted}</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Retard</td><td style="color:#dc2626;font-size:14px;font-weight:700;">${data.jours_retard} jours</td></tr>
        </table>
        <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">
          Conformément à l'article L441-10 du Code de commerce :
        </p>
        <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:13px;line-height:1.8;">
          <li>Des pénalités de retard sont exigibles de plein droit</li>
          <li>Une indemnité forfaitaire pour frais de recouvrement de <strong>40 €</strong> est due</li>
        </ul>
        <p style="margin:0 0 16px;color:#991b1b;font-size:14px;font-weight:600;line-height:1.6;">
          À défaut de règlement intégral dans un délai de 8 jours, le dossier sera transmis à notre service contentieux pour recouvrement judiciaire.
        </p>
        <p style="margin:24px 0 0;color:#374151;font-size:14px;">Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.<br><br><strong>${data.nom_entreprise}</strong></p>
      `, '#450a0a')

      return { sujet, contenu, html }
    }

    case 'manuel':
    default: {
      const sujet = `Rappel de paiement : Facture ${data.numero_facture}`
      const contenu = `Bonjour ${data.nom_client},

Nous souhaitons vous rappeler que la facture ${data.numero_facture}${objetLine} d'un montant de ${data.montant_restant} € est en attente de règlement depuis le ${dateFormatted}.

Merci de procéder au paiement dans les meilleurs délais.

Cordialement,
${data.nom_entreprise}`

      const html = baseHtml(`
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Bonjour <strong>${data.nom_client}</strong>,</p>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
          Nous souhaitons vous rappeler que la facture suivante est en attente de règlement :
        </p>
        <table style="width:100%;background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #e5e7eb;" cellpadding="8">
          <tr><td style="color:#6b7280;font-size:13px;width:140px;">Facture n°</td><td style="color:#111827;font-size:14px;font-weight:600;">${data.numero_facture}</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Montant dû</td><td style="color:#111827;font-size:14px;font-weight:600;">${data.montant_restant} €</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;">Échéance</td><td style="color:#111827;font-size:14px;">${dateFormatted}</td></tr>
        </table>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;">Merci de procéder au paiement dans les meilleurs délais.</p>
        <p style="margin:24px 0 0;color:#374151;font-size:14px;">Cordialement,<br><strong>${data.nom_entreprise}</strong></p>
      `, '#27AE60')

      return { sujet, contenu, html }
    }
  }
}

/**
 * Détermine automatiquement le type de rappel en fonction du nombre de jours de retard
 */
export function getAutoRappelType(joursRetard: number): TypeRappel {
  if (joursRetard > 30) return 'mise_en_demeure'
  if (joursRetard > 15) return 'rappel_30j'
  if (joursRetard > 7) return 'rappel_15j'
  return 'rappel_7j'
}
