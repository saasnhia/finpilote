import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import Anthropic from '@anthropic-ai/sdk';
import { convert } from 'pdf-poppler';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { createClient } from '@/lib/supabase/server';
import type { ExtractedInvoiceData } from '@/types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Helper: Convert PDF to image
async function pdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'finpilote-'));
  const pdfPath = path.join(tmpDir, 'invoice.pdf');
  const imgPath = path.join(tmpDir, 'invoice-1.png');

  try {
    await fs.writeFile(pdfPath, pdfBuffer);

    // Convert first page only to PNG
    await convert(pdfPath, {
      format: 'png',
      out_dir: tmpDir,
      out_prefix: 'invoice',
      page: 1, // First page only
    });

    const imageBuffer = await fs.readFile(imgPath);
    return imageBuffer;
  } finally {
    // Cleanup temp files
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

// Helper: Run Tesseract OCR
async function extractTextFromImage(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  // Optimize image for OCR (grayscale, resize if too large)
  const optimizedImage = await sharp(imageBuffer)
    .grayscale()
    .resize({ width: 2000, withoutEnlargement: true })
    .toBuffer();

  // Run Tesseract with French language
  const { data } = await Tesseract.recognize(optimizedImage, 'fra', {
    logger: (m) => console.log('[Tesseract]', m),
  });

  return {
    text: data.text,
    confidence: data.confidence / 100, // Convert 0-100 to 0-1
  };
}

// Helper: Extract structured data using Claude API
async function extractInvoiceFields(ocrText: string): Promise<ExtractedInvoiceData> {
  const prompt = `Tu es un assistant comptable expert en France. Analyse le texte OCR suivant extrait d'une facture française et extrais les informations suivantes selon le Plan Comptable Général (PCG).

Texte de la facture:
${ocrText}

Extrais les informations suivantes (retourne null si non trouvé):
- montant_ht: Montant hors taxes (nombre décimal)
- tva: Montant de la TVA (nombre décimal)
- montant_ttc: Montant TTC total (nombre décimal)
- date_facture: Date de la facture au format ISO (YYYY-MM-DD)
- numero_facture: Numéro de facture (texte)
- nom_fournisseur: Nom du fournisseur/émetteur (texte)

Réponds UNIQUEMENT avec un objet JSON valide dans ce format exact:
{
  "montant_ht": 1234.56 ou null,
  "tva": 123.45 ou null,
  "montant_ttc": 1358.01 ou null,
  "date_facture": "2024-01-15" ou null,
  "numero_facture": "FAC-2024-001" ou null,
  "nom_fournisseur": "Entreprise ABC" ou null,
  "confidence_score": 0.85,
  "extraction_notes": "Notes ou avertissements ici"
}

IMPORTANT:
- Retourne UNIQUEMENT du JSON valide, aucun texte supplémentaire
- confidence_score doit être entre 0 et 1
- Si un montant est incohérent (par exemple montant_ht + tva != montant_ttc), note-le dans extraction_notes
- Si tu as des doutes, indique-le dans extraction_notes et réduis confidence_score`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-20250514', // Haiku for cost efficiency
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Parse Claude's response
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const extracted = JSON.parse(responseText);
    return extracted;
  } catch (e) {
    throw new Error(`Failed to parse Claude response: ${responseText}`);
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

    // Validate file type
    const fileName = file.name.toLowerCase();
    const fileType = fileName.endsWith('.pdf')
      ? 'pdf'
      : fileName.match(/\.(jpg|jpeg|png)$/)
      ? (fileName.split('.').pop()! as 'jpg' | 'jpeg' | 'png')
      : null;

    if (!fileType) {
      return NextResponse.json({
        error: 'Format de fichier non supporté. Utilisez PDF, JPG, JPEG ou PNG.'
      }, { status: 400 });
    }

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({
        error: 'Fichier trop volumineux. Taille maximale: 2MB.'
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

    // Step 1: Convert PDF to image if needed
    let imageBuffer: Buffer;
    if (fileType === 'pdf') {
      console.log('[API] Converting PDF to image...');
      imageBuffer = await pdfToImage(buffer);
    } else {
      imageBuffer = buffer;
    }

    // Step 2: Run OCR
    console.log('[API] Running OCR...');
    const ocrResult = await extractTextFromImage(imageBuffer);
    console.log('[API] OCR confidence:', ocrResult.confidence);

    // Step 3: Extract structured data with Claude
    console.log('[API] Extracting fields with Claude...');
    const extractedData = await extractInvoiceFields(ocrResult.text);
    console.log('[API] Claude confidence:', extractedData.confidence_score);

    // Step 4: Store in Supabase
    console.log('[API] Storing in database...');
    const { data: facture, error: dbError } = await supabase
      .from('factures')
      .insert({
        user_id,
        file_name: file.name,
        file_type: fileType,
        file_size_bytes: file.size,
        montant_ht: extractedData.montant_ht,
        tva: extractedData.tva,
        montant_ttc: extractedData.montant_ttc,
        date_facture: extractedData.date_facture,
        numero_facture: extractedData.numero_facture,
        nom_fournisseur: extractedData.nom_fournisseur,
        raw_ocr_text: ocrResult.text,
        ai_confidence_score: extractedData.confidence_score,
        ai_extraction_notes: extractedData.extraction_notes,
        validation_status: extractedData.confidence_score >= 0.7 ? 'validated' : 'manual_review',
        user_edited_fields: [],
      })
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
