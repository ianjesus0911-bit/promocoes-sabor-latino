export const FIXED_WHATSAPP_DISPLAY = "+55 54 8100-7256";
const FIXED_WHATSAPP_NUMBER = "555481007256";

export const buildFixedWhatsAppLink = (message) => {
  const encoded = encodeURIComponent(message || "Olá! Quero saber as promoções de hoje.");
  return `https://wa.me/${FIXED_WHATSAPP_NUMBER}?text=${encoded}`;
};
