// /var/www/api/schulung/api/certificates/create.ts
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { OkPacket, RowDataPacket } from 'mysql2';
import mariadbPool from '../../mariadb';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const CERT_DIR = path.resolve(__dirname, '../../public/certs');
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

export default async function createCertificateHandler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const { user_id, training_id } = req.body;
  if (!user_id || !training_id) {
    return res.status(400).json({ message: 'user_id und training_id erforderlich' });
  }

  try {
    // --- 1) Display-Name auslesen
    const [userRows] = await mariadbPool.query<RowDataPacket[]>(
      'SELECT display_name FROM users WHERE id = ?',
      [user_id]
    );
    const displayName = userRows[0]?.display_name?.toString() || user_id;

    // --- 2) Metadaten
    const id = uuidv4();
    const issuedAt = new Date();
    const validUntil = new Date(issuedAt);
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    // --- 3) Pfade & URL
    const filename = `${id}.pdf`;
    const filepath = path.join(CERT_DIR, filename);
    const certificateUrl = `https://schulung.bummeltech.de/certs/${filename}`;

    // --- 4) PDF anlegen (Querformat, A4)
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Weißer Hintergrund
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#fff');

    // Außenrahmen
    doc
      .lineWidth(3)
      .strokeColor('#2c3e50')
      .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
      .stroke();

    // --- 5) Logo oben rechts
    const logoPath = path.resolve(__dirname, '../../public/logo.png');
    if (fs.existsSync(logoPath)) {
      const logoSize = 100;
      doc.image(
        logoPath,
        doc.page.width - 50 - logoSize,
        50,
        { width: logoSize }
      );
    }

    // --- 6) Wappen links mittig
    const wappenPath = path.resolve(__dirname, '../../public/wappen.png');
    if (fs.existsSync(wappenPath)) {
      const wappenSize = 120;
      const wappenY = (doc.page.height - wappenSize) / 2;
      doc.image(
        wappenPath,
        50,
        wappenY,
        { width: wappenSize }
      );
    }

    // --- 7) Siegel rechts mittig
    const siegelPath = path.resolve(__dirname, '../../public/swappen.png');
    if (fs.existsSync(siegelPath)) {
      const siegelSize = 100;
      const siegelY = (doc.page.height - siegelSize) / 2;
      doc.image(
        siegelPath,
        doc.page.width - 50 - siegelSize,
        siegelY,
        { width: siegelSize }
      );
    }

    // --- 8) Titel (Deutsch)
    doc
      .fillColor('#2c3e50')
      .font('Helvetica-Bold')
      .fontSize(36)
      .text('ZERTIFIKAT', { align: 'center' })
      .moveDown(0.2)
      .fontSize(28)
      .text('Abschluss Bestätigung', { align: 'center' });

    // --- 9) Untertitel
    doc
      .moveDown(1)
      .font('Helvetica-Oblique')
      .fontSize(18)
      .fillColor('#7f8c8d')
      .text('Dieses Zertifikat belegt das Teilnehmer/innen', {
        align: 'center'
      });

    // --- 10) Empfängername
    doc
      .moveDown(0.5)
      .font('Helvetica-Bold')
      .fontSize(42)
      .fillColor('#e74c3c')
      .text(displayName.toUpperCase(), {
        align: 'center',
        characterSpacing: 1
      });

    // --- 11) Beschreibung (zentriert, mittig unter Name)
    const descWidth = 600;
    const descX = (doc.page.width - descWidth) / 2;
    doc
      .moveDown(0.5)
      .font('Helvetica')
      .fontSize(16)
      .fillColor('#34495e')
      .text(
        `Für den erfolgreichen Abschluss des Trainings „${training_id.replace(/-/g, ' ')}“.`,
        descX,      // x-Offset für exakte Zentrierung
        undefined,  // y-Wert übernimmt current text position
        {
          width: descWidth,
          align: 'center',
          lineGap: 6
        }
      );

    // --- 12) Auszeichnung
    doc
      .moveDown(1)
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor('#2c3e50')
      .text('AUSZEICHNUNG', { align: 'center' });

    // --- 13) Fußbereich: Datum & Unterschrift
    const footerY = doc.page.height - 100;
    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor('#2c3e50')
      .text(`Ausgestellt: ${issuedAt.toLocaleDateString('de-DE')}`, 70, footerY)
      .text(`Gültig bis: ${validUntil.toLocaleDateString('de-DE')}`, 70, footerY + 20);

    // Unterschriftslinie
    const sigX = doc.page.width - 300;
    doc
      .moveTo(sigX, footerY)
      .lineTo(sigX + 200, footerY)
      .stroke('#2c3e50');

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('Nico Pape', sigX, footerY + 10, { align: 'center' })
      .moveDown(0.2)
      .font('Helvetica-Oblique')
      .fontSize(12)
      .text('CEO, BummelTech', sigX, footerY + 30, { align: 'center' });

    // --- 14) PDF schließen und speichern
    doc.end();
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });

    // --- 15) In die Datenbank eintragen
    const sql = `
      INSERT INTO certificates
        (id, user_id, training_id, issued_at, valid_until, certificate_url)
      VALUES (?, ?, ?, ?, ?, ?)`;
    await mariadbPool.query<OkPacket>(sql, [
      id,
      user_id,
      training_id,
      issuedAt,
      validUntil,
      certificateUrl,
    ]);

    // --- 16) Antwort
    return res.status(201).json({
      success: true,
      id,
      training_id,
      issued_at: issuedAt,
      valid_until: validUntil,
      certificate_url: certificateUrl,
    });
  } catch (err) {
    console.error('Fehler beim Erstellen des Zertifikats:', err);
    return res.status(500).json({
      message: 'Zertifikat konnte nicht erstellt werden',
    });
  }
}
