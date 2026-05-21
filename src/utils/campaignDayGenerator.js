const productProfile = {
  almoço: {
    label: "almoço",
    highlight: "almoço latino completo e quentinho",
    imageHint: "prato farto com vapor subindo, arroz soltinho e proteína suculenta",
  },
  pizza: {
    label: "pizza",
    highlight: "pizza cubana com queijo puxando",
    imageHint: "fatia de pizza com queijo derretendo e borda dourada em close-up",
  },
  "ropa vieja cubana": {
    label: "ropa vieja cubana",
    highlight: "ropa vieja cubana desfiada e muito saborosa",
    imageHint: "carne desfiada suculenta, molho brilhante e mesa latina acolhedora",
  },
  sobremesa: {
    label: "sobremesa",
    highlight: "sobremesa caseira cremosa",
    imageHint: "sobremesa cremosa com acabamento bonito e brilho apetitoso",
  },
  "combo familiar": {
    label: "combo familiar",
    highlight: "combo familiar abundante para compartilhar",
    imageHint: "mesa cheia, porções grandes e clima de família feliz",
  },
};

const objectiveProfile = {
  "vender pelo WhatsApp": {
    trigger: "chamada direta para pedido imediato no WhatsApp",
    action: "Me chama agora no WhatsApp para garantir seu pedido.",
    channelFocus: "foco total em conversão rápida",
  },
  "atrair pessoas ao restaurante": {
    trigger: "convite forte para vir ao restaurante hoje",
    action: "Vem para o Sabor Latino e aproveita a experiência completa.",
    channelFocus: "foco em tráfego para salão",
  },
  "vender últimas unidades": {
    trigger: "escassez real com urgência",
    action: "Corre porque as últimas unidades estão saindo agora.",
    channelFocus: "foco em urgência e decisão imediata",
  },
  "divulgar prato do dia": {
    trigger: "destaque do prato principal do dia",
    action: "Hoje o prato do dia está imperdível. Peça enquanto está disponível.",
    channelFocus: "foco em destaque diário da cozinha",
  },
};

const toneProfile = {
  urgente: {
    emoji: "🚨",
    opening: "Atenção: oportunidade de hoje por tempo limitado.",
    texture: "Mensagem curta, quente e com senso de urgência.",
  },
  familiar: {
    emoji: "👨‍👩‍👧‍👦",
    opening: "Sabor que reúne todo mundo em volta da mesa.",
    texture: "Mensagem acolhedora, próxima e convidativa.",
  },
  alegre: {
    emoji: "🎉",
    opening: "Hoje é dia de comer bem e sorrir em cada garfada.",
    texture: "Mensagem vibrante, energética e positiva.",
  },
  "direto para vender": {
    emoji: "🔥",
    opening: "Oferta pronta para converter agora.",
    texture: "Mensagem objetiva com CTA forte.",
  },
  caseiro: {
    emoji: "🍲",
    opening: "Comida com cara de casa e sabor de carinho.",
    texture: "Mensagem quente, afetiva e apetitosa.",
  },
};

const momentRecommendation = {
  manhã: {
    bestPostingTime: "10h30 - 11h30",
    videoHook: "abrir o apetite antes do almoço",
  },
  almoço: {
    bestPostingTime: "11h30 - 13h30",
    videoHook: "urgência para quem está decidindo o almoço",
  },
  tarde: {
    bestPostingTime: "16h30 - 18h00",
    videoHook: "preparar o público para o jantar",
  },
  noite: {
    bestPostingTime: "18h30 - 20h30",
    videoHook: "capturar o pico de fome da noite",
  },
};

const objectiveFormatRecommendation = {
  "vender pelo WhatsApp": "Status do WhatsApp + Instagram Story vertical (9:16)",
  "atrair pessoas ao restaurante": "Instagram Feed 4:5 + Facebook com localização",
  "vender últimas unidades": "Story/Reel curto com texto urgente",
  "divulgar prato do dia": "Feed 4:5 com legenda detalhada",
};

const productImageRecommendation = {
  almoço: "close-up de prato completo com vapor e cores quentes",
  pizza: "close da fatia com queijo puxando e mão servindo",
  "ropa vieja cubana": "close da carne desfiada brilhante com fundo latino",
  sobremesa: "macro da textura cremosa com luz quente suave",
  "combo familiar": "mesa abundante com clima familiar e rostos felizes",
};

const buildHashtags = (product, objective) => {
  const productTag = product.replace(/\s+/g, "");
  const objectiveTag = objective
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");

  return `#SaborLatino #ComidaLatina #NovaBassano #${productTag} #${objectiveTag} #PedidoNoWhatsApp #FoodMarketing`;
};

export const generateCampaignDayPack = ({
  product,
  objective,
  moment,
  tone,
  availableQuantity,
  deadline,
  settings,
}) => {
  const productData = productProfile[product] || productProfile.almoço;
  const objectiveData = objectiveProfile[objective] || objectiveProfile["vender pelo WhatsApp"];
  const toneData = toneProfile[tone] || toneProfile["direto para vender"];
  const momentData = momentRecommendation[moment] || momentRecommendation.almoço;

  const restaurantName = settings.restaurantName || "Sabor Latino";
  const whatsapp = settings.whatsappNumber || "+55 54 8100-7256";
  const address = settings.address || "Avenida 23 de Maio, nº 313, Centro, Nova Bassano";

  const qtyLine = availableQuantity ? `Quantidade disponível: ${availableQuantity}.` : "";
  const deadlineLine = deadline ? `Horário limite: ${deadline}.` : "";
  const hashtags = buildHashtags(productData.label, objective);
  const finalWhatsappCall = `👉 Chame agora no WhatsApp ${whatsapp} com a frase: "Quero ${productData.label} de hoje!"`;

  const whatsappText = `${toneData.emoji} ${toneData.opening}
Hoje no ${restaurantName}: ${productData.highlight}.
${objectiveData.trigger}.
${qtyLine}
${deadlineLine}
${objectiveData.action}
${finalWhatsappCall}`.trim();

  const statusWhatsAppText = `${toneData.emoji} ${productData.label.toUpperCase()} HOJE
${objectiveData.channelFocus}
${qtyLine}
${deadlineLine}
WhatsApp: ${whatsapp}`.trim();

  const instagramStoryText = `${toneData.emoji} ${productData.label.toUpperCase()} AGORA
${objectiveData.trigger}
${qtyLine}
${deadlineLine}
Peça no WhatsApp: ${whatsapp}`.trim();

  const instagramFeedCaption = `${toneData.emoji} Campanha do dia no ${restaurantName}
Destaque: ${productData.highlight}
Objetivo: ${objective}
Momento ideal: ${moment}
${qtyLine}
${deadlineLine}
${toneData.texture}
${objectiveData.action}
${finalWhatsappCall}
${hashtags}`.trim();

  const facebookText = `${restaurantName} | Campanha do dia
Hoje vamos focar em ${productData.label}.
${objectiveData.trigger}
${qtyLine}
${deadlineLine}
📍 ${address}
📲 WhatsApp: ${whatsapp}`;

  const imageShortPhrase = `${productData.label.toUpperCase()} HOJE • PEÇA AGORA`;

  const imagePrompt = `Crie imagem promocional original para ${restaurantName}, estilo restaurante latino/cubano, cores quentes, visual apetitoso.
Produto principal: ${productData.highlight}.
Objetivo da campanha: ${objective} (${objectiveData.channelFocus}).
Momento do dia: ${moment}.
Tom de comunicação: ${tone}.
Direção visual: ${productData.imageHint}.
Incluir sensação de comida quente, ambiente acolhedor e chamada visual para WhatsApp ${whatsapp}.
Formato recomendado: ${objectiveFormatRecommendation[objective] || "Instagram Story 9:16"}.
Não copiar conteúdo de terceiros.`;

  const videoIdea = `Vídeo de 8 segundos:
0-2s: close em ${productData.label} com vapor e textura.
2-5s: cena rápida de preparo/serviço + reação de fome.
5-8s: texto na tela "${imageShortPhrase}" e CTA para WhatsApp ${whatsapp}.
Gancho: ${momentData.videoHook}.`;

  return {
    whatsappText,
    statusWhatsAppText,
    instagramStoryText,
    instagramFeedCaption,
    facebookText,
    imageShortPhrase,
    imagePrompt,
    videoIdea,
    hashtags,
    finalWhatsappCall,
    recommendations: {
      bestPostingTime: momentData.bestPostingTime,
      bestFormat: objectiveFormatRecommendation[objective] || "Instagram Story 9:16",
      bestImageType: productImageRecommendation[product] || "close com vapor e apelo apetitoso",
    },
  };
};
