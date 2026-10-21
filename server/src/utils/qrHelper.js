import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Generate a unique ticket code like "CP-2026-A8F93B"
 */
export const generateTicketCode = () => {
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  const year = new Date().getFullYear();
  return `CP-${year}-${randomHex}`;
};

/**
 * Generate a unique certificate verification code like "CERT-2026-X7K2-9LP4"
 */
export const generateCertificateCode = () => {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const year = new Date().getFullYear();
  return `CERT-${year}-${part1}-${part2}`;
};

/**
 * Generate a QR code base64 Data URL
 */
export const generateQRCodeDataUrl = async (payload) => {
  try {
    const stringPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const dataUrl = await QRCode.toDataURL(stringPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#1e1b4b', // deep indigo
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    return null;
  }
};
