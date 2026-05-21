const toneConfig = {
  Urgente: {
    emoji: "🚨",
    opening: "ATENÇÃO: promoção por tempo curto.",
    emotional: "Se deixar para depois, você pode perder.",
    urgency: "Vira o pedido agora para garantir.",
  },
  Familiar: {
    emoji: "👨‍👩‍👧‍👦",
    opening: "Promoção pensada para juntar a família.",
    emotional: "Comida que abraça e rende bons momentos.",
    urgency: "Mesa cheia hoje, aproveite enquanto tem.",
  },
  Alegre: {
    emoji: "🎉",
    opening: "Hoje o clima é de sabor e festa.",
    emotional: "Aquele pedido que já dá água na boca só de imaginar.",
    urgency: "Não espera esfriar, pede agora.",
  },
  Elegante: {
    emoji: "✨",
    opening: "Uma experiência latina com toque especial.",
    emotional: "Sabor marcante, apresentação linda e qualidade em cada detalhe.",
    urgency: "Disponibilidade limitada para hoje.",
  },
  Caseiro: {
    emoji: "🍲",
    opening: "Sabor de comida feita com carinho.",
    emotional: "Temperinho caseiro, porção caprichada e conforto de verdade.",
    urgency: "Produção do dia limitada.",
  },
  "Direto para vender": {
    emoji: "🔥",
    opening: "Oferta forte para vender agora.",
    emotional: "Preço bom, comida quente e entrega rápida.",
    urgency: "Quem pede primeiro, recebe primeiro.",
  },
};

const promotionProfiles = {
  Almoço: {
    sensory: "Prato quentinho, completo e com aquele tempero latino que abre o apetite na hora.",
    desire: "Perfeito para matar a fome do almoço sem perder tempo.",
    scarcity: "Lotes de almoço saem rápido até o fim do horário.",
  },
  Pizza: {
    sensory: "Massa assada na hora, borda dourada e queijo puxando de verdade.",
    desire: "A pizza que faz todo mundo querer mais um pedaço.",
    scarcity: "Quantidade especial de hoje, depois acaba.",
  },
  "Ropa vieja cubana": {
    sensory: "Carne desfiada lentamente, suculenta e com sabor cubano autêntico.",
    desire: "Um prato cheio de personalidade para quem ama comida de verdade.",
    scarcity: "Produção artesanal e limitada no dia.",
  },
  "Combo familiar": {
    sensory: "Combo caprichado, variado e ideal para compartilhar sem faltar nada.",
    desire: "Economia e fartura para todo mundo comer bem.",
    scarcity: "Combos promocionais disponíveis só hoje.",
  },
  Sobremesa: {
    sensory: "Doce cremoso, sabor intenso e final perfeito para qualquer refeição.",
    desire: "Aquele mimo que você merece hoje.",
    scarcity: "Sobremesas do dia em poucas unidades.",
  },
  "Promoção relâmpago": {
    sensory: "Preço especial com sabor completo e qualidade da casa.",
    desire: "Oferta para agir rápido e aproveitar antes de subir.",
    scarcity: "Válida por poucas horas.",
  },
  "Últimas unidades": {
    sensory: "Últimas porções saindo quentes agora.",
    desire: "Quem gosta desse prato precisa correr.",
    scarcity: "Acabando de verdade: restam poucas unidades.",
  },
  "Promoção para hoje": {
    sensory: "Oferta exclusiva do dia com sabor latino marcante.",
    desire: "Chance de comer muito bem pagando menos hoje.",
    scarcity: "Promoção encerra no fim do dia.",
  },
};

const channelHints = {
  WhatsApp: "Mensagem ideal para conversão imediata no WhatsApp.",
  "Instagram Story": "Formato curto com impacto para Story.",
  "Instagram Feed": "Legenda pensada para Feed e engajamento.",
  Facebook: "Texto com apelo familiar e chamada direta.",
  TikTok: "Tom dinâmico para vídeo curto e ação rápida.",
  Todos: "Versão completa para publicar em todos os canais.",
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
  const schedule = settings.openingHours || "Segunda a Domingo, 11h às 23h";
  const whatsapp = settings.whatsappNumber || "+55 54 8100-7256";
  const channelHint = channelHints[channel] || channelHints.Todos;
  const hashtags = makeHashtags(promotionType, restaurantName, highlighted);

  const whatsappText = `${toneData.emoji} ${toneData.opening}
${promotionType} no ${restaurantName}!
${profile.sensory}
${profile.desire}
${profile.scarcity}
${toneData.emotional}
👉 Me chama AGORA no WhatsApp ${whatsapp} com a frase: "Quero ${promotionType}".
${toneData.urgency}`;

  const instagramText = `${toneData.emoji} ${promotionType} | ${restaurantName}
${profile.sensory}
${profile.desire}
⚡ ${profile.scarcity}
${toneData.emotional}
${channelHint}
📲 Peça pelo WhatsApp: ${whatsapp}
${hashtags}`;

  const facebookText = `${restaurantName} em Nova Bassano com promoção de ${promotionType}.
${profile.sensory}
${profile.desire}
${toneData.emoji} ${toneData.opening}
📍 ${address}
🕒 ${schedule}
📲 Faça seu pedido agora no WhatsApp: ${whatsapp}`;

  const storyShortText = `${toneData.emoji} ${promotionType} HOJE!
${profile.desire}
⚡ ${profile.scarcity}
📲 WhatsApp: ${whatsapp}`;

  const videoOverlay = `${promotionType.toUpperCase()} HOJE
${restaurantName}
PEÇA AGORA NO WHATSAPP`;

  const videoScript = `Cena 1 (0-3s): close do ${promotionType} saindo quente, mostrando textura e vapor.
Cena 2 (3-6s): mostrar cliente abrindo o pedido e reagindo com vontade de comer.
Cena 3 (6-10s): texto na tela "Peça agora no WhatsApp ${whatsapp}" + voz "Corre que está acabando!".
Encerramento: logo do ${restaurantName} e chamada "Chama no WhatsApp agora".`;

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
