const toneConfig = {
  Urgente: {
    emoji: "🚨",
    opening: "Atenção: ação de hoje por tempo curto.",
    emotional: "Se deixar para depois, pode acabar.",
    urgency: "Chama agora para garantir.",
  },
  Familiar: {
    emoji: "👨‍👩‍👧‍👦",
    opening: "Uma promoção pensada para reunir a família.",
    emotional: "Comida que acolhe e deixa a mesa cheia.",
    urgency: "Passa aqui hoje e aproveita com quem você gosta.",
  },
  Alegre: {
    emoji: "🎉",
    opening: "Hoje é dia de comer bem e sem complicação.",
    emotional: "Sabor que dá vontade no primeiro olhar.",
    urgency: "Pede agora enquanto está saindo quentinho.",
  },
  Elegante: {
    emoji: "✨",
    opening: "Uma proposta latina com toque especial da casa.",
    emotional: "Prato bonito, bem servido e feito com cuidado.",
    urgency: "Produção limitada para hoje.",
  },
  Caseiro: {
    emoji: "🍲",
    opening: "Comida com gosto de casa e carinho.",
    emotional: "Tempero no ponto e porção caprichada.",
    urgency: "A cozinha está a todo vapor agora.",
  },
  "Direto para vender": {
    emoji: "🔥",
    opening: "Oferta pronta para gerar pedido agora.",
    emotional: "Comida quente, atendimento rápido e pedido fácil.",
    urgency: "Quem chama primeiro, recebe primeiro.",
  },
};

const promotionProfiles = {
  Almoço: {
    sensory: "Prato completo, quentinho e com sabor latino de verdade.",
    desire: "Ideal para matar a fome do almoço sem perder tempo.",
    scarcity: "As porções de almoço saem rápido no horário.",
  },
  Pizza: {
    sensory: "Massa assada na hora, borda dourada e queijo puxando.",
    desire: "A pizza que chama a família para a mesa.",
    scarcity: "Produção do dia limitada para manter qualidade.",
  },
  "Ropa vieja cubana": {
    sensory: "Carne desfiada suculenta com tempero cubano caseiro.",
    desire: "Prato típico para quem ama comida de verdade.",
    scarcity: "Ropa vieja feita em lote do dia.",
  },
  "Combo familiar": {
    sensory: "Combo bem servido para compartilhar sem faltar nada.",
    desire: "Ótimo para almoço ou jantar em família.",
    scarcity: "Quantidade de combos limitada no dia.",
  },
  Sobremesa: {
    sensory: "Sobremesa cremosa com finalização caprichada.",
    desire: "Um doce para fechar a refeição com vontade de repetir.",
    scarcity: "Últimas unidades do preparo de hoje.",
  },
  "Promoção relâmpago": {
    sensory: "Condição especial com o mesmo sabor da casa.",
    desire: "Boa oportunidade para pedir agora e aproveitar.",
    scarcity: "Válida por poucas horas.",
  },
  "Últimas unidades": {
    sensory: "Últimas porções saindo quentes agora.",
    desire: "Quem gosta desse prato precisa correr.",
    scarcity: "Acabando de verdade: restam poucas unidades.",
  },
  "Promoção para hoje": {
    sensory: "Oferta do dia com sabor latino marcante.",
    desire: "Perfeita para quem quer comer bem hoje.",
    scarcity: "Encerra no fim do dia.",
  },
};

const channelHints = {
  WhatsApp: "Mensagem pronta para conversão imediata no WhatsApp.",
  "Instagram Story": "Formato curto e direto para Story.",
  "Instagram Feed": "Legenda pensada para Feed e engajamento.",
  Facebook: "Texto claro, familiar e com chamada para ação.",
  TikTok: "Tom dinâmico para vídeo curto com gancho forte.",
  Todos: "Versão completa para usar em todos os canais.",
};

const normalizeTag = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");

const makeHashtags = (promotionType, restaurantName, highlightedDish) => {
  const typeTag = normalizeTag(promotionType);
  const restaurantTag = normalizeTag(restaurantName);
  const dishTag = normalizeTag(highlightedDish);

  return `#${restaurantTag} #ComidaLatina #ComidaCubana #NovaBassano #Delivery #${typeTag} #${dishTag} #PedidoNoWhatsApp`;
};

export const generatePromotionPack = ({ promotionType, channel, tone, settings }) => {
  const toneData = toneConfig[tone] || toneConfig["Direto para vender"];
  const profile = promotionProfiles[promotionType] || promotionProfiles["Promoção para hoje"];

  const restaurantName = settings.restaurantName || "Sabor Latino";
  const highlighted = settings.featuredDish || "Ropa vieja cubana";
  const address = settings.address || "Avenida 23 de Maio, nº 313, Centro, Nova Bassano";
  const schedule = settings.openingHours || "Terça a domingo, 11h às 23h";
  const whatsapp = settings.whatsappNumber || "+55 54 8100-7256";
  const channelHint = channelHints[channel] || channelHints.Todos;
  const hashtags = makeHashtags(promotionType, restaurantName, highlighted);

  const whatsappText = `${toneData.emoji} ${toneData.opening}
${promotionType} no ${restaurantName}.
${profile.sensory}
${profile.desire}
${profile.scarcity}
👉 Me chama no WhatsApp ${whatsapp} com a frase: "Quero ${promotionType}".
${toneData.urgency}`;

  const instagramText = `${toneData.emoji} ${promotionType} | ${restaurantName}
${profile.sensory}
${profile.desire}
⚡ ${profile.scarcity}
${channelHint}
📲 Peça pelo WhatsApp: ${whatsapp}
${hashtags}`;

  const facebookText = `${restaurantName} em Nova Bassano com promoção de ${promotionType}.
${profile.sensory}
${profile.desire}
${toneData.emoji} ${toneData.opening}
📍 ${address}
🕒 ${schedule}
📲 Faça seu pedido no WhatsApp: ${whatsapp}`;

  const storyShortText = `${toneData.emoji} ${promotionType} hoje
${profile.desire}
📲 WhatsApp: ${whatsapp}`;

  const videoOverlay = `${promotionType.toUpperCase()} HOJE
${restaurantName}
PEÇA NO WHATSAPP`;

  const videoScript = `Cena 1 (0-3s): close do ${promotionType} saindo quente com vapor.
Cena 2 (3-6s): mostrar textura e montagem do prato.
Cena 3 (6-10s): texto na tela "Peça no WhatsApp ${whatsapp}" e chamada final da marca.
Encerramento: logo do ${restaurantName} e CTA curto para pedido.`;

  return {
    whatsappText,
    instagramText,
    facebookText,
    storyShortText,
    videoOverlay,
    videoScript,
    hashtags,
  };
};
