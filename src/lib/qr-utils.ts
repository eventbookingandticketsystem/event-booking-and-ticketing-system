import QRCode from "qrcode";

/**
 * Generate a data URL for a ticket QR code.
 * Encodes the qrPayload string (format: "ticketRef:eventId:userId")
 * that the scan API parses — NOT the DB document id.
 */
export async function generateTicketQR(qrPayload: string): Promise<string> {
  return QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: "H",
    margin: 2,
    color: {
      dark:  "#08283B",
      light: "#FFFFFF",
    },
    width: 240,
  });
}
