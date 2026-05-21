const productLabels = {
  almoço: "almoço latino",
  pizza: "pizza cubana",
  "ropa vieja cubana": "ropa vieja cubana",
  sobremesa: "sobremesa caseira",
  "combo familiar": "combo familiar",
};

const objectiveMap = {
  "vender pelo WhatsApp": "converter pedidos imediatos pelo WhatsApp",
  "atrair clientes ao restaurante": "levar mais pessoas para o salão hoje",
  "vender rápido": "girar estoque com decisão rápida",
  "divulgar comida cubana": "fortalecer o posicionamento cubano da casa",
  "divulgar pizza": "aumentar pedidos de pizza no horário de pico",
};

const audienceMap = {
  famílias: "famílias que buscam comida farta e acolhedora",
  trabalhadores: "trabalhadores com pouco tempo e muita fome",
  jovens: "jovens que respondem bem a conteúdo rápido e visual forte",
  "pessoas perto do centro": "público local próximo ao centro de Nova Bassano",
  "clientes de pizza": "público que ama pizza e decide por impulso visual",
  "clientes de comida caseira": "clientes que valorizam sabor caseiro e conforto",
};

const toneMap = {
  urgente: {
    emoji: "🚨",
    opening: "Oferta com tempo curto e alta procura.",
    style: "mensagem curta e agressiva para conversão",
  },
  familiar: {
    emoji: "👨‍👩‍👧‍👦",
    opening: "Comida que junta todo mundo na mesa.",
    style: "mensagem calorosa e próxima",
  },
  alegre: {
    emoji: "🎉",
    opening: "Hoje o clima é de sabor e energia alta.",
    style: "mensagem vibrante e positiva",
  },
  direto: {
    emoji: "🔥",
    opening: "Campanha direta para vender agora.",
    style: "mensagem objetiva com CTA forte",
  },
  caseiro: {
    emoji: "🍲",
    opening: "Sabor de casa com cuidado em cada detalhe.",
    style: "mensagem afetiva e apetitosa",
  },
  elegante: {
    emoji: "✨",
    opening: "Experiência gastronômica com toque premium.",
    style: "mensagem refinada com foco em qualidade",
  },
};

const bestTimeByMoment = {
  manhã: "10h30 - 11h30",
  almoço: "11h30 - 13h30",
  tarde: "16h30 - 18h00",
  noite: "18h30 - 20h30",
};

const formatByChannel = {
  WhatsApp: "Status + mensagem direta no WhatsApp",
  "Instagram Story": "Story vertical 9:16 com texto curto",
  "Instagram Feed": "Feed 4:5 com close apetitoso",
  Facebook: "Post com localização e oferta clara",
  TikTok: "Vídeo curto com gancho visual forte",
  Todos: "Pacote multi-canal com adaptação rápida",
};

const visualStyleByProduct = {
  almoço: "prato completo com vapor e textura realista",
  pizza: "fatia com queijo puxando e corte dinâmico",
  "ropa vieja cubana": "carne desfiada suculenta em close-up",
  sobremesa: "textura cremosa com luz quente suave",
  "combo familiar": "mesa farta com clima familiar",
};

const normalizeTag = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");

const buildHashtags = ({ product, objective, audience }) => {
  return `#SaborLatino #ComidaLatina #NovaBassano #${normalizeTag(product)} #${normalizeTag(
    objective
  )} #${normalizeTag(audience)} #PedidoNoWhatsApp #MarketingGastronomico`;
};

export const buildManualInstagramInsights = ({ instagramMetrics, selectedProduct, channel, moment }) => {
  const fallbackBestHour = bestTimeByMoment[moment] || "18h30 - 20h30";
  const metricHour = instagramMetrics?.bestHourRange || fallbackBestHour;
  const metricTopProduct =
    instagramMetrics?.topDishByOrders || instagramMetrics?.topDish || productLabels[selectedProduct] || "prato do dia";
  const hasManualData = Number(instagramMetrics?.analyzedCount || 0) > 0;

  const productFromMetrics = Object.entries(productLabels).find(([_, label]) =>
    String(metricTopProduct).toLowerCase().includes(label.split(" ")[0])
  );

  return {
    source: hasManualData ? "manual" : "internal_patterns",
    topProduct: productFromMetrics?.[0] || selectedProduct,
    bestFormat: formatByChannel[channel] || formatByChannel.Todos,
    bestHour: metricHour,
    bestVisualStyle:
      visualStyleByProduct[productFromMetrics?.[0] || selectedProduct] || "close com vapor e contraste quente",
  };
};

export const generateIntelligentCampaignPack = ({
  product,
  objective,
  audience,
  moment,
  mainChannel,
  tone,
  settings,
  instagramInsights,
}) => {
  const restaurantName = settings.restaurantName || "Sabor Latino";
  const whatsapp = settings.whatsappNumber || "+55 54 8100-7256";
  const address = settings.address || "Avenida 23 de Maio, nº 313, Centro, Nova Bassano";

  const productLabel = productLabels[product] || product;
  const objectiveLabel = objectiveMap[objective] || objective;
  const audienceLabel = audienceMap[audience] || audience;
  const toneData = toneMap[tone] || toneMap.direto;
  const fallbackHour = bestTimeByMoment[moment] || "18h30 - 20h30";
  const insights = instagramInsights || {
    source: "internal_patterns",
    topProduct: product,
    bestFormat: formatByChannel[mainChannel] || formatByChannel.Todos,
    bestHour: fallbackHour,
    bestVisualStyle: visualStyleByProduct[product] || "close com vapor",
  };

  const bestProductLabel = productLabels[insights.topProduct] || insights.topProduct;
  const hashtags = buildHashtags({ product, objective, audience });
  const finalWhatsAppCTA = `👉 Peça agora no WhatsApp ${whatsapp} com a frase: "Quero ${productLabel} da campanha inteligente!"`;
  const sourceNotice =
    insights.source === "manual"
      ? "Recomendação baseada em dados manuais do Instagram oficial."
      : "Recomendação baseada em padrões internos enquanto você registra novas publicações.";

  const strategyRecommended = [
    `${toneData.emoji} Estratégia inteligente para ${restaurantName}`,
    `Produto principal selecionado: ${productLabel}.`,
    `Objetivo da campanha: ${objectiveLabel}.`,
    `Público-alvo: ${audienceLabel}.`,
    `Momento ideal: ${moment}.`,
    `Canal principal: ${mainChannel}.`,
    `Produto com melhor rendimento no Instagram: ${bestProductLabel}.`,
    `Melhor formato recomendado: ${insights.bestFormat}.`,
    `Melhor horário sugerido: ${insights.bestHour}.`,
    `Melhor estilo visual: ${insights.bestVisualStyle}.`,
    sourceNotice,
  ].join("\n");

  const whatsappText = `${toneData.emoji} ${toneData.opening}
${productLabel} em destaque no ${restaurantName}.
Campanha focada em ${objectiveLabel}.
Ideal para ${audienceLabel}.
Hoje no período da ${moment}, vamos acelerar pedidos.
${finalWhatsAppCTA}`;

  const instagramStoryText = `${toneData.emoji} ${productLabel.toUpperCase()} HOJE
${objectiveLabel}
Para ${audienceLabel}
Poste entre ${insights.bestHour}
Chame no WhatsApp: ${whatsapp}`;

  const instagramFeedCaption = `${toneData.emoji} Campanha Inteligente | ${restaurantName}
Destaque: ${productLabel}
Objetivo: ${objective}
Público: ${audience}
Melhor janela: ${insights.bestHour}
Formato forte: ${insights.bestFormat}
${toneData.style}
${finalWhatsAppCTA}
${hashtags}`;

  const facebookText = `${restaurantName} apresenta a Campanha Inteligente do dia.
Produto foco: ${productLabel}.
Objetivo: ${objectiveLabel}.
Público priorizado: ${audienceLabel}.
📍 ${address}
🕒 Melhor horário para post: ${insights.bestHour}
📲 WhatsApp: ${whatsapp}`;

  const tiktokText = `${toneData.emoji} ${productLabel} no ponto certo!
Vídeo rápido para ${audienceLabel}.
Gancho em 2 segundos + close com vapor.
CTA final: chama no WhatsApp ${whatsapp}.`;

  const imageImpactPhrase = `${productLabel.toUpperCase()} AGORA • SABOR LATINO`;

  const imagePrompt = `Crie imagem promocional original para ${restaurantName}, comida latina/cubana, foco em ${productLabel}.
Objetivo: ${objectiveLabel}.
Público principal: ${audienceLabel}.
Momento do dia: ${moment}.
Tom: ${tone} (${toneData.style}).
Formato recomendado: ${insights.bestFormat}.
Estilo visual recomendado: ${insights.bestVisualStyle}.
Incluir cores quentes, aparência suculenta, vapor visível e CTA para WhatsApp ${whatsapp}.
Não copiar conteúdos de terceiros.`;

  const videoScript = `Roteiro de 8 segundos:
0-2s: close extremo de ${productLabel} com vapor.
2-5s: mostrar textura + reação de desejo.
5-8s: texto "${imageImpactPhrase}" + CTA "${finalWhatsAppCTA}".
Publicar em: ${insights.bestHour}.`;

  return {
    strategyRecommended,
    whatsappText,
    instagramStoryText,
    instagramFeedCaption,
    facebookText,
    tiktokText,
    imageImpactPhrase,
    imagePrompt,
    videoScript,
    hashtags,
    bestTimeSuggested: insights.bestHour,
    finalWhatsAppCTA,
    bestFormatSuggested: insights.bestFormat,
    bestVisualStyleSuggested: insights.bestVisualStyle,
    bestProductFromData: bestProductLabel,
    recommendationSourceNotice: sourceNotice,
  };
};
