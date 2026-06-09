import QRCode from "qrcode";

/**
 * Generate a data URL for a ticket QR code.
 * Uses navy (#08283B) modules on white (#FFFFFF) background.
 * Size 240px, high error correction (H).
 */
export async function generateTicketQR(ticketId: string): Promise<string> {
  return QRCode.toDataURL(ticketId, {
    errorCorrectionLevel: "H",
    margin: 2,
    color: {
      dark:  "#08283B",
      light: "#FFFFFF",
    },
    width: 240,
  });
}
