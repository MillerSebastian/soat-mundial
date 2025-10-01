const crypto = require("crypto");

/**
 * Cliente PayZen simplificado
 * - Si no hay credenciales en variables de entorno, simula el pago
 * - Si hay credenciales, prepara estructura para integración real
 */
class PayZenClient {
  constructor() {
    this.shopId = process.env.PAYZEN_SHOP_ID;
    this.certificate = process.env.PAYZEN_CERTIFICATE;
    this.environment = process.env.PAYZEN_ENVIRONMENT || "sandbox";
    this.baseUrl = this.environment === "production"
      ? "https://secure.payzen.lat/vads-payment/"
      : "https://secure.payzen.lat/vads-payment/"; // Sandbox/Prod comparten host con parámetros
  }

  hasCredentials() {
    return Boolean(this.shopId && this.certificate);
  }

  /**
   * Simulación/placeholder de creación de pago.
   * En una integración real, aquí se llamarían a los endpoints/formularios de PayZen
   * firmando los parámetros con el certificado.
   */
  async createPayment({ amount, currency = "COP", cardNumber, expiryDate, cvv, cardholderName, email, phone, metadata = {} }) {
    if (!amount || !cardNumber || !expiryDate || !cvv || !cardholderName) {
      throw new Error("Parámetros de pago incompletos");
    }

    if (!this.hasCredentials()) {
      // Modo simulado
      await new Promise((r) => setTimeout(r, 1200));
      return {
        simulated: true,
        success: true,
        gateway: "payzen",
        environment: this.environment,
        transactionId: `SIM-${Date.now()}`,
        amount,
        currency,
        card: {
          brand: this.detectBrand(cardNumber),
          last4: cardNumber.slice(-4),
        },
        message: "Pago simulado exitosamente (sin credenciales PayZen)",
        metadata,
      };
    }

    // Estructura para integración real (placeholder)
    const signature = this.signParams({
      vads_amount: amount,
      vads_currency: currency,
      vads_site_id: this.shopId,
      vads_ctx_mode: this.environment === "production" ? "PRODUCTION" : "TEST",
      vads_trans_date: this.formatTransDate(new Date()),
      // ... agregar parámetros requeridos por PayZen
    });

    // Aquí normalmente harías POST o redirección a formulario de PayZen
    await new Promise((r) => setTimeout(r, 1200));

    return {
      simulated: true,
      success: true,
      gateway: "payzen",
      environment: this.environment,
      transactionId: `PZ-${Date.now()}`,
      amount,
      currency,
      card: {
        brand: this.detectBrand(cardNumber),
        last4: cardNumber.slice(-4),
      },
      message: "Pago simulado PayZen (estructura lista para integrar en producción)",
      signature,
    };
  }

  detectBrand(cardNumber) {
    const sanitized = (cardNumber || "").replace(/\s|-/g, "");
    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(sanitized)) return "visa";
    if (/^5[1-5][0-9]{14}$/.test(sanitized)) return "mastercard";
    if (/^3[47][0-9]{13}$/.test(sanitized)) return "amex";
    return "unknown";
  }

  formatTransDate(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return (
      date.getUTCFullYear().toString() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds())
    );
  }

  signParams(params) {
    const ordered = Object.keys(params)
      .sort()
      .map((k) => `${params[k]}`)
      .join("+");

    const toSign = ordered + "+" + this.certificate;
    return crypto.createHash("sha256").update(toSign, "utf8").digest("hex");
  }
}

module.exports = new PayZenClient(); 