export const FIXED_WHATSAPP_DISPLAY = "+55 54 8100-7256";
const FIXED_WHATSAPP_NUMBER = "555481007256";

export const sanitizeWhatsAppNumber = (numberValue) => {
  const digits = String(numberValue || "").replace(/\D/g, "");
  if (!digits) return FIXED_WHATSAPP_NUMBER;
  return digits;
};

export const buildWhatsAppLink = (numberValue, message) => {
  const encoded = encodeURIComponent(message || "Olá! Quero saber as promoções de hoje.");
  const number = sanitizeWhatsAppNumber(numberValue);
  return `https://wa.me/${number}?text=${encoded}`;
};

export const buildFixedWhatsAppLink = (message) => {
  const encoded = encodeURIComponent(message || "Olá! Quero saber as promoções de hoje.");
  return `https://wa.me/${FIXED_WHATSAPP_NUMBER}?text=${encoded}`;
};
