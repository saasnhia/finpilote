import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import PDFParser from 'pdf2json';
import sharp from 'sharp';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { createClient } from '@/lib/supabase/server';
import { queryOllama } from '@/lib/ai/ollama-client';
import { logMetrics, startTimer } from '@/lib/metrics';
import { enrichirFournisseur } from '@/lib/api/api-entreprise';
import type { ExtractedInvoiceData } from '@/types';

// Helper: Extract text from PDF using pdf2json (pure JS, no worker issues)
function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true);

    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      const text = pdfParser.getRawTextContent();
      resolve(text.trim());
    });

    pdfParser.on('pdfParser_dataError', (errData: any) => {
      const msg = errData?.parserError || errData;
      console.error('PDF extraction error:', msg);
      reject(new Error(String(msg)));
    });

    pdfParser.parseBuffer(pdfBuffer);
  });
}

// Helper: Run Tesseract OCR with worker + 30s timeout
const OCR_TIMEOUT_MS = 30_000;

async function extractTextFromImage(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  // Optimize image for OCR (grayscale, resize if too large)
  const optimizedImage = await sharp(imageBuffer)
    .grayscale()
    .resize({ width: 2000, withoutEnlargement: true })
    .toBuffer();

  // Run OCR with explicit timeout
  const ocrPromise = async () => {
    const worker = await createWorker('fra', 1, {
      workerPath: './node_modules/tesseract.js/src/worker-script/node/index.js',
      logger: (m) => console.log('[Tesseract]', m),
    });
    try {
      const { data } = await worker.recognize(optimizedImage);
      return {
        text: data.text,
        confidence: data.confidence / 100,
      };
    } finally {
      await worker.terminate();
    }
  };

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('OCR timeout : extraction abandonnée après 30 secondes.')), OCR_TIMEOUT_MS);
  });

  return Promise.race([ocrPromise(), timeoutPromise]);
}

// Helper: Parse a French number string (e.g. "1 234,56" or "1234.56") to float
function parseFrenchNumber(raw: string): number | null {
  let cleaned = raw.replace(/[\s\u00a0€]/g, '');
  cleaned = cleaned.replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : Math.round(val * 100) / 100;
}

// French month names → month number (1-indexed)
const FRENCH_MONTHS: Record<string, string> = {
  janvier: '01', février: '02', fevrier: '02', mars: '03', avril: '04',
  mai: '05', juin: '06', juillet: '07', août: '08', aout: '08',
  septembre: '09', octobre: '10', novembre: '11', décembre: '12', decembre: '12',
};

// Helper: Decode pdf2json URL-encoded text to readable French
function decodePdfText(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw.replace(/%20/g, ' ').replace(/%C3%A9/g, 'é').replace(/%C3%A8/g, 'è')
      .replace(/%C3%AA/g, 'ê').replace(/%C3%B4/g, 'ô').replace(/%C3%BB/g, 'û')
      .replace(/%C3%A0/g, 'à').replace(/%C3%AE/g, 'î').replace(/%C2%B0/g, '°')
      .replace(/%E2%82%AC/g, '€');
  }
}

// Helper: Extract structured invoice data using local regex parser
function extractInvoiceFieldsLocal(text: string): ExtractedInvoiceData {
  // Decode pdf2json URL-encoded output
  const decoded = decodePdfText(text);

  console.log('[EXTRACTION] Texte brut (1500 premiers chars):', decoded.substring(0, 1500));

  const result: ExtractedInvoiceData = {
    montant_ht: null,
    tva: null,
    montant_ttc: null,
    date_facture: null,
    numero_facture: null,
    nom_fournisseur: null,
    confidence_score: 0,
    extraction_notes: '',
  };

  const notes: string[] = [];

  // --- Numéro de facture ---
  // Words to reject as invoice numbers
  const REJECT_WORDS = /^(commande|devis|bon|client|compte|page|tel|fax|code|date)$/i;

  const invoicePatterns: { re: RegExp; name: string; lastMatch?: boolean }[] = [
    // PRIORITY 1: Direct "FACT-xxx" or "FAC-xxx" format anywhere in text
    { re: /\b(FACT-[\w\-]+)/i, name: 'FACT-format' },
    // PRIORITY 2: "Facture N° xxx" (explicit facture keyword)
    { re: /facture\s+n[°o]\s*:?\s*([\w\-\/\.]{3,})/i, name: 'facture-n' },
    // PRIORITY 3: "N° facture : xxx"
    { re: /n[°o]\s*(?:de\s+)?facture\s*:?\s*([\w\-\/\.]{3,})/i, name: 'n-facture' },
    // PRIORITY 4: "Numéro de facture : xxx"
    { re: /num[ée]ro\s*(?:de\s+)?facture\s*:?\s*([\w\-\/\.]{3,})/i, name: 'numero-facture' },
    // PRIORITY 5: "Réf. : xxx"
    { re: /r[ée]f(?:[ée]rence)?\.?\s*:?\s*([\w\-\/\.]{3,})/i, name: 'reference' },
    // PRIORITY 6: Generic "N° xxx" but EXCLUDE known non-invoice words
    { re: /n[°o]\s*:?\s*([\w\-\/\.]{3,})/gi, name: 'n-generic-last', lastMatch: true },
  ];

  for (const { re, name, lastMatch } of invoicePatterns) {
    if (lastMatch) {
      // Find ALL matches, filter out rejected words, take the last valid one
      let allMatch: RegExpExecArray | null;
      let lastValid = '';
      const regex = new RegExp(re.source, re.flags);
      while ((allMatch = regex.exec(decoded)) !== null) {
        const candidate = allMatch[1].trim();
        if (!REJECT_WORDS.test(candidate)) {
          lastValid = candidate;
        }
      }
      if (lastValid) {
        result.numero_facture = lastValid;
        console.log(`[EXTRACTION] Numéro trouvé par ${name}: ${result.numero_facture}`);
        break;
      }
    } else {
      const match = decoded.match(re);
      if (match && match[1] && !REJECT_WORDS.test(match[1].trim())) {
        result.numero_facture = match[1].trim();
        console.log(`[EXTRACTION] Numéro trouvé par ${name}: ${result.numero_facture}`);
        break;
      }
    }
  }
  if (!result.numero_facture) {
    console.log('[EXTRACTION] Aucun numéro de facture trouvé');
  }

  // --- Montants (HT, TTC, TVA) ---
  // Amount pattern: at least 2 digits, optional spaces/dots/commas, optional decimals
  // e.g. "937,00" "1 077,55" "1234.56" — NOT a lone "1"
  const AMT = '(\\d[\\d\\s\\u00a0]*[,.]\\d{1,2}|\\d{2,}[\\d\\s\\u00a0]*)';

  // HT: "Total HT : 937,00 €" or "Montant HT : 937.00€"
  const htRegex = new RegExp('(?:total|montant|sous[\\s-]?total|net)\\s*HT\\s*:?\\s*' + AMT + '\\s*€?', 'gi');
  let m = htRegex.exec(decoded);
  if (m) {
    result.montant_ht = parseFrenchNumber(m[1]);
    console.log('[EXTRACTION] Montant HT trouvé:', m[1], '=>', result.montant_ht);
  }

  // TTC: "Total TTC : 1 077,55 €"
  const ttcRegex = new RegExp('(?:total|montant|net\\s+[àa]\\s+payer|sous[\\s-]?total)\\s*TTC\\s*:?\\s*' + AMT + '\\s*€?', 'gi');
  m = ttcRegex.exec(decoded);
  if (m) {
    result.montant_ttc = parseFrenchNumber(m[1]);
    console.log('[EXTRACTION] Montant TTC trouvé:', m[1], '=>', result.montant_ttc);
  }

  // TVA with percentage: "TVA 20% : 187,40 €"
  const tvaWithPctRegex = new RegExp('TVA\\s*(?:\\d+[\\s,]*\\d*\\s*%)\\s*:?\\s*' + AMT + '\\s*€?', 'gi');
  m = tvaWithPctRegex.exec(decoded);
  if (m) {
    result.tva = parseFrenchNumber(m[1]);
    console.log('[EXTRACTION] Montant TVA (avec %) trouvé:', m[1], '=>', result.tva);
  }

  // TVA without percentage: "Montant TVA : 187,40 €"
  if (result.tva === null) {
    const tvaPlainRegex = new RegExp('(?:total|montant)\\s*(?:de\\s+la\\s+)?TVA\\s*:?\\s*' + AMT + '\\s*€?', 'gi');
    m = tvaPlainRegex.exec(decoded);
    if (m) {
      result.tva = parseFrenchNumber(m[1]);
      console.log('[EXTRACTION] Montant TVA (sans %) trouvé:', m[1], '=>', result.tva);
    }
  }

  // Fallback: "937,00 € HT" or "1 077,55 € TTC"
  if (result.montant_ht === null) {
    const amtHt = decoded.match(new RegExp(AMT + '\\s*€?\\s*HT', 'i'));
    if (amtHt) {
      result.montant_ht = parseFrenchNumber(amtHt[1]);
      console.log('[EXTRACTION] Montant HT (fallback):', amtHt[1], '=>', result.montant_ht);
    }
  }
  if (result.montant_ttc === null) {
    const amtTtc = decoded.match(new RegExp(AMT + '\\s*€?\\s*TTC', 'i'));
    if (amtTtc) {
      result.montant_ttc = parseFrenchNumber(amtTtc[1]);
      console.log('[EXTRACTION] Montant TTC (fallback):', amtTtc[1], '=>', result.montant_ttc);
    }
  }

  // Last resort: standalone "Total : 1234,56 €" → assume TTC
  if (result.montant_ttc === null && result.montant_ht === null) {
    const totalFallback = decoded.match(new RegExp('(?:total|net\\s+[àa]\\s+payer)\\s*:?\\s*' + AMT + '\\s*€?', 'i'));
    if (totalFallback) {
      result.montant_ttc = parseFrenchNumber(totalFallback[1]);
      notes.push('Total interprété comme TTC.');
    }
  }

  // --- Auto-calculate missing amounts ---
  if (result.montant_ht !== null && result.tva !== null && result.montant_ttc === null) {
    result.montant_ttc = Math.round((result.montant_ht + result.tva) * 100) / 100;
    notes.push('TTC calculé (HT + TVA).');
  } else if (result.montant_ht !== null && result.montant_ttc !== null && result.tva === null) {
    result.tva = Math.round((result.montant_ttc - result.montant_ht) * 100) / 100;
    notes.push('TVA calculée (TTC - HT).');
  } else if (result.montant_ttc !== null && result.montant_ht === null) {
    // Extract TVA rate if mentioned
    const rateMatch = decoded.match(/TVA\s*(\d+[\s,]*\d*)\s*%/i);
    const rate = rateMatch ? (parseFrenchNumber(rateMatch[1]) || 20) / 100 : 0.20;
    result.montant_ht = Math.round((result.montant_ttc / (1 + rate)) * 100) / 100;
    result.tva = Math.round((result.montant_ttc - result.montant_ht) * 100) / 100;
    notes.push(`HT/TVA estimés à ${rate * 100}% depuis le TTC.`);
  } else if (result.montant_ht !== null && result.montant_ttc === null && result.tva === null) {
    const rateMatch = decoded.match(/TVA\s*(\d+[\s,]*\d*)\s*%/i);
    const rate = rateMatch ? (parseFrenchNumber(rateMatch[1]) || 20) / 100 : 0.20;
    result.tva = Math.round((result.montant_ht * rate) * 100) / 100;
    result.montant_ttc = Math.round((result.montant_ht + result.tva) * 100) / 100;
    notes.push(`TVA/TTC estimés à ${rate * 100}% depuis le HT.`);
  }

  // Consistency check
  if (result.montant_ht !== null && result.tva !== null && result.montant_ttc !== null) {
    const expectedTtc = Math.round((result.montant_ht + result.tva) * 100) / 100;
    if (Math.abs(expectedTtc - result.montant_ttc) > 0.10) {
      notes.push(`Incohérence: HT(${result.montant_ht}) + TVA(${result.tva}) = ${expectedTtc} ≠ TTC(${result.montant_ttc}).`);
    }
  }

  console.log('[EXTRACTION] Montants finaux: HT=', result.montant_ht, 'TVA=', result.tva, 'TTC=', result.montant_ttc);

  // --- Date de facture ---
  // Textual French dates: "10 février 2026", "1er mars 2025"
  const textDateRegex = /(?:date\s*[:\s]*)?(\d{1,2})\s*(?:er)?\s+(janvier|f[ée]vrier|fevrier|mars|avril|mai|juin|juillet|ao[uû]t|aout|septembre|octobre|novembre|d[ée]cembre|decembre)\s+(\d{4})/i;
  const textDateMatch = decoded.match(textDateRegex);
  if (textDateMatch) {
    const day = textDateMatch[1].padStart(2, '0');
    const monthName = textDateMatch[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const year = textDateMatch[3];
    const month = FRENCH_MONTHS[monthName];
    if (month) {
      result.date_facture = `${year}-${month}-${day}`;
    }
  }

  // Numeric date patterns (fallback)
  if (!result.date_facture) {
    const numDatePatterns = [
      /(?:date\s+(?:de\s+)?(?:facture|facturation|[ée]mission))\s*[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
      /(?:date|le|du|[ée]mis(?:e)?)\s*[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
      /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
      /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})(?!\d)/,
    ];

    for (const pattern of numDatePatterns) {
      const match = decoded.match(pattern);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        let year = match[3];
        if (year.length === 2) year = '20' + year;

        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
          result.date_facture = `${year}-${month}-${day}`;
          break;
        }
      }
    }
  }

  console.log('[EXTRACTION] Date trouvée:', result.date_facture);

  // --- Nom fournisseur ---
  // Strategy 1: line before SIREN/SIRET/RCS
  const sirenIdx = decoded.search(/\b(SIREN|SIRET|RCS|APE|NAF)\b/i);
  if (sirenIdx > 0) {
    const before = decoded.substring(0, sirenIdx);
    const beforeLines = before.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    if (beforeLines.length > 0) {
      const candidate = beforeLines[beforeLines.length - 1];
      if (candidate.length >= 3 && candidate.length <= 100 && !/^\d/.test(candidate)) {
        result.nom_fournisseur = candidate;
      }
    }
  }

  // Strategy 2: line containing SARL, SAS, SA, EURL, etc.
  if (!result.nom_fournisseur) {
    const companyMatch = decoded.match(/^(.{3,80}\b(?:SARL|SAS|SA|EURL|SCI|SASU|EI|AUTO[\s-]?ENTREPRENEUR)\b.{0,20})$/im);
    if (companyMatch) {
      result.nom_fournisseur = companyMatch[1].trim();
    }
  }

  // Strategy 3: first significant line (heuristic fallback)
  if (!result.nom_fournisseur) {
    const lines = decoded.split('\n').map(l => l.trim()).filter(l => l.length > 3);
    const skipRe = /^(\d|total|montant|tva|ht|ttc|n[°o]|date|page|siret|siren|tel|fax|mail|email|www|http|adresse|bp\s|facture|invoice|devis|avoir|bon de)/i;
    for (const line of lines) {
      if (!skipRe.test(line) && line.length <= 80) {
        result.nom_fournisseur = line.substring(0, 100);
        break;
      }
    }
  }

  console.log('[EXTRACTION] Fournisseur trouvé:', result.nom_fournisseur);

  // --- Confidence score ---
  let foundFields = 0;
  if (result.montant_ttc !== null) foundFields++;
  if (result.montant_ht !== null) foundFields++;
  if (result.tva !== null) foundFields++;
  if (result.date_facture !== null) foundFields++;
  if (result.numero_facture !== null) foundFields++;
  if (result.nom_fournisseur !== null) foundFields++;

  result.confidence_score = Math.round((foundFields / 6) * 100) / 100;

  if (decoded.length < 50) {
    result.confidence_score = Math.max(0, result.confidence_score - 0.2);
    notes.push('Texte très court, extraction peu fiable.');
  }

  if (result.confidence_score < 0.5) {
    notes.push('Extraction partielle. Vérification manuelle recommandée.');
  }

  result.extraction_notes = notes.join(' ');

  console.log('[EXTRACTION] Score de confiance:', result.confidence_score);

  return result;
}

// Helper: Extract invoice fields using local Ollama AI (fallback for low-confidence regex)
async function extractWithLocalAI(text: string): Promise<ExtractedInvoiceData | null> {
  const prompt = `Tu es un expert-comptable français. Extrais les données de cette facture.

Format JSON strict (pas de commentaire, pas de markdown) :
{
  "montant_ht": number | null,
  "tva": number | null,
  "montant_ttc": number | null,
  "date_facture": "YYYY-MM-DD" | null,
  "numero_facture": string | null,
  "nom_fournisseur": string | null,
  "confidence_score": 0.XX,
  "extraction_notes": string
}

Règles :
- Si TVA = 20%, calcule automatiquement HT ou TTC si manquant
- Date au format ISO (YYYY-MM-DD)
- confidence_score entre 0 et 1
- extraction_notes : notes ou avertissements

Texte du document :
${text.substring(0, 4000)}

JSON uniquement :`;

  const response = await queryOllama(prompt, {
    temperature: 0.1,
    maxTokens: 512,
    stop: ['\n\n'],
  });

  if (!response) return null;

  try {
    // Try to extract JSON from the response (handle potential wrapping text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      montant_ht: typeof parsed.montant_ht === 'number' ? parsed.montant_ht : null,
      tva: typeof parsed.tva === 'number' ? parsed.tva : null,
      montant_ttc: typeof parsed.montant_ttc === 'number' ? parsed.montant_ttc : null,
      date_facture: typeof parsed.date_facture === 'string' ? parsed.date_facture : null,
      numero_facture: typeof parsed.numero_facture === 'string' ? parsed.numero_facture : null,
      nom_fournisseur: typeof parsed.nom_fournisseur === 'string' ? parsed.nom_fournisseur : null,
      confidence_score: typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 0.7,
      extraction_notes: (parsed.extraction_notes || '') + ' [IA locale]',
    };
  } catch {
    console.error('[API] Failed to parse Ollama response');
    return null;
  }
}

// Main POST handler
export async function POST(req: NextRequest) {
  try {
    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    // Detect file type from extension
    const fileName = file.name.toLowerCase();
    const ext = fileName.split('.').pop() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp'];
    const fileType = ext === 'pdf'
      ? 'pdf'
      : imageExts.includes(ext)
      ? (ext as 'jpg' | 'jpeg' | 'png')
      : ext; // xlsx, xls, doc, docx, csv, txt, etc.

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        error: 'Fichier trop volumineux. Taille maximale : 10 Mo.'
      }, { status: 400 });
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const user_id = user.id;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Step 1 & 2: Extract text based on file type
    const textExts = ['csv', 'txt'];
    const excelExts = ['xlsx', 'xls'];
    const docExts = ['doc', 'docx'];

    let ocrResult: { text: string; confidence: number };

    if (textExts.includes(ext)) {
      // CSV/TXT: read directly as text
      console.log('[API] Reading text file directly...');
      const text = buffer.toString('utf-8');
      ocrResult = { text, confidence: 1.0 };
    } else if (excelExts.includes(ext)) {
      // Excel: extract text via xlsx library
      console.log('[API] Extracting text from Excel...');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheets = workbook.SheetNames.map(name => {
        const sheet = workbook.Sheets[name];
        return `--- ${name} ---\n${XLSX.utils.sheet_to_csv(sheet)}`;
      });
      ocrResult = { text: sheets.join('\n\n'), confidence: 1.0 };
    } else if (docExts.includes(ext)) {
      // Word: extract text via mammoth
      console.log('[API] Extracting text from Word document...');
      const result = await mammoth.extractRawText({ buffer });
      ocrResult = { text: result.value, confidence: 0.95 };
    } else if (fileType === 'pdf') {
      // PDF: extract text directly with pdfjs-dist
      console.log('[API] Extracting text from PDF...');
      const pdfText = await extractTextFromPdf(buffer);
      if (pdfText.length > 20) {
        // Text-based PDF: use extracted text directly
        ocrResult = { text: pdfText, confidence: 0.95 };
      } else {
        // Scanned PDF with no selectable text: cannot OCR a PDF directly
        console.log('[API] PDF scanné sans texte sélectionnable.');
        return NextResponse.json(
          { error: 'PDF scanné détecté. Veuillez convertir en image (JPG/PNG) pour utiliser l\'OCR.' },
          { status: 400 }
        );
      }
    } else {
      // Image: OCR pipeline
      console.log('[API] Running OCR on image...');
      ocrResult = await extractTextFromImage(buffer);
    }
    console.log('[API] Text extraction confidence:', ocrResult.confidence);

    // Step 3: Extract structured data — hybrid (regex first, Ollama fallback)
    const elapsed = startTimer();
    let extractionMethod: 'regex' | 'ai_local' | 'hybrid' = 'regex';

    console.log('[API] Extracting fields with local parser...');
    let extractedData = extractInvoiceFieldsLocal(ocrResult.text);
    console.log('[API] Regex confidence:', extractedData.confidence_score);

    // If regex confidence is low, try local AI
    if (extractedData.confidence_score < 0.7) {
      console.log('[API] Low confidence — trying local AI...');
      const aiResult = await extractWithLocalAI(ocrResult.text);
      if (aiResult && aiResult.confidence_score > extractedData.confidence_score) {
        console.log('[API] AI confidence:', aiResult.confidence_score, '(using AI result)');
        extractedData = aiResult;
        extractionMethod = 'ai_local';
      } else {
        console.log('[API] AI unavailable or lower confidence — keeping regex result');
        extractionMethod = 'hybrid';
      }
    }

    // Log performance metrics (non-blocking)
    const extractionTime = elapsed();
    logMetrics({
      user_id: user_id,
      extraction_time_ms: extractionTime,
      confidence_score: extractedData.confidence_score,
      method: extractionMethod,
      success: true,
      file_type: fileType,
      file_size_bytes: file.size,
    }).catch(() => {}); // silent

    // Step 3b: Enrichir via API Entreprise si SIREN detecte
    let tvaIntracom: string | null = null;
    const sirenMatch = ocrResult.text.match(/SIREN\s*:?\s*(\d{9})/i)
      || ocrResult.text.match(/\bSIRET\s*:?\s*(\d{9})\d{5}\b/i)
      || ocrResult.text.match(/\b(\d{9})\s*(?:RCS|APE|NAF)\b/i);

    if (sirenMatch) {
      const siren = sirenMatch[1];
      console.log('[FACTURE UPLOAD] SIREN detecte:', siren);

      try {
        const entrepriseInfo = await enrichirFournisseur(siren);

        // Enrichir les donnees extraites si pas deja presentes
        if (!extractedData.nom_fournisseur || extractedData.nom_fournisseur.length < 3) {
          extractedData.nom_fournisseur = entrepriseInfo.denomination;
          console.log('[FACTURE UPLOAD] Fournisseur enrichi:', entrepriseInfo.denomination);
        }

        tvaIntracom = entrepriseInfo.tva_intracom;
        if (tvaIntracom) {
          console.log('[FACTURE UPLOAD] TVA intracom:', tvaIntracom);
        }
      } catch (error) {
        console.warn('[FACTURE UPLOAD] Impossible d\'enrichir le fournisseur:', error);
      }
    }

    // Step 4: Store in Supabase
    const insertData = {
      user_id,
      fichier_url: file.name,
      numero_facture: extractedData.numero_facture ?? null,
      date_facture: extractedData.date_facture ?? null,
      fournisseur: extractedData.nom_fournisseur ?? null,
      montant_ht: extractedData.montant_ht ?? null,
      montant_tva: extractedData.tva ?? null,
      montant_ttc: extractedData.montant_ttc ?? null,
      statut: 'en_attente',
      ocr_raw_text: ocrResult.text,
      ocr_confidence: extractedData.confidence_score,
    };
    console.log('[API] Données avant insertion DB:', JSON.stringify(insertData, null, 2));
    const { data: facture, error: dbError } = await supabase
      .from('factures')
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      console.error('[API] Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Step 5: Return response
    return NextResponse.json({
      success: true,
      facture,
      warnings: extractedData.confidence_score < 0.7
        ? ['Confiance faible. Veuillez vérifier les données extraites.']
        : [],
    });

  } catch (error: any) {
    console.error('[API] Error processing invoice:', error);
    return NextResponse.json({
      error: error.message || 'Erreur lors du traitement de la facture.'
    }, { status: 500 });
  }
}
