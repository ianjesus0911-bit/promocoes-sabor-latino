const productDetails = {
  "Almoço latino":
    "prato latino completo, porção generosa, arroz, feijão, proteína suculenta e aparência caseira",
  "Pizza cubana":
    "pizza cubana artesanal com queijo derretendo, borda dourada e corte apetitoso",
  "Ropa vieja cubana":
    "carne desfiada suculenta com molho brilhante, identidade cubana e visual marcante",
  "Combo familiar":
    "mesa farta com variedade de pratos, clima de partilha e sensação de abundância",
  Sobremesa: "sobremesa cremosa com textura rica, acabamento bonito e toque caseiro",
  Bebida: "bebida gelada com gotas de condensação e sensação de frescor imediato",
  "Restaurante cheio":
    "salão movimentado, pratos saindo da cozinha, clientes felizes e atmosfera acolhedora",
  "Pessoas comendo felizes":
    "famílias e amigos sorrindo, comida bem servida e momento de satisfação real",
};

const formatDetails = {
  "Instagram Story 9:16": "composição vertical 9:16, impacto rápido e foco no centro da cena",
  "Instagram Feed 4:5": "composição 4:5 com destaque principal no prato e leitura visual clara",
  "Facebook Post": "composição equilibrada para público local com boa legibilidade de cena",
  "WhatsApp Status": "formato vertical direto, visual limpo e foco em chamada rápida",
  "Banner horizontal": "composição horizontal ampla com profundidade e contexto de restaurante",
};

const styleDetails = {
  "Hiper-realista":
    "fotografia hiper-realista, nitidez alta, textura detalhada e acabamento publicitário",
  "Comida quente com vapor":
    "comida saindo quente, vapor visível, brilho apetitoso e sensação de frescor",
  Familiar:
    "visual de restaurante familiar, acolhedor, mesa compartilhada e emoções autênticas",
  Viral: "estilo de alto impacto para redes sociais, contraste forte e enquadramento chamativo",
  "Elegante e profissional":
    "direção de arte elegante, limpa e sofisticada, com aparência premium",
  "Caseiro e acolhedor":
    "estética caseira, tons quentes e sensação de comida feita com carinho",
};

const goalDetails = {
  "Dar fome": "despertar fome imediatamente",
  "Vender rápido": "estimular decisão de compra no mesmo momento",
  "Atrair clientes para o restaurante": "mostrar ambiente convidativo e confiança local",
  "Promover prato do dia": "destacar prato principal com urgência suave",
  "Promover pizza": "valorizar queijo, crocância e calor da pizza",
  "Promover comida cubana": "fortalecer identidade cubana com autenticidade",
};

const styleCameraSuggestion = {
  "Hiper-realista": "close de 45 graus com foco seletivo no prato principal",
  "Comida quente com vapor": "close lateral extremo para destacar vapor e textura",
  Familiar: "plano aberto de mesa com pessoas ao fundo e prato em destaque",
  Viral: "ângulo dinâmico levemente inclinado com foco central forte",
  "Elegante e profissional": "plano três quartos com composição limpa e simétrica",
  "Caseiro e acolhedor": "ângulo de mesa natural, na altura dos olhos",
};

const styleLightingSuggestion = {
  "Hiper-realista": "luz quente controlada com softbox e preenchimento suave",
  "Comida quente com vapor": "luz lateral quente para valorizar vapor e brilho",
  Familiar: "luz ambiente quente de restaurante com sombras suaves",
  Viral: "luz de contraste mais alto para chamar atenção no feed",
  "Elegante e profissional": "luz refinada com recorte delicado e equilíbrio tonal",
  "Caseiro e acolhedor": "luz dourada suave, estilo fim de tarde acolhedor",
};

const styleBackgroundSuggestion = {
  "Hiper-realista": "fundo levemente desfocado de restaurante latino elegante",
  "Comida quente com vapor": "fundo quente com cozinha ao longe desfocada",
  Familiar: "fundo de mesa de madeira com ambiente familiar",
  Viral: "fundo com contraste quente e composição limpa para destaque do prato",
  "Elegante e profissional": "fundo minimalista sofisticado em tons quentes",
  "Caseiro e acolhedor": "fundo de mesa posta com textura caseira e calor visual",
};

const formatCompositionSuggestion = {
  "Instagram Story 9:16": "composição vertical centralizada com leitura instantânea",
  "Instagram Feed 4:5": "composição equilibrada com prato ocupando 70% da cena",
  "Facebook Post": "composição horizontal curta com contexto do restaurante",
  "WhatsApp Status": "composição vertical simples com foco em um único prato",
  "Banner horizontal": "composição panorâmica com prato em primeiro plano",
};

const goalEmotionSuggestion = {
  "Dar fome": "desejo imediato de comer",
  "Vender rápido": "sensação de oportunidade agora",
  "Atrair clientes para o restaurante": "acolhimento e vontade de visitar",
  "Promover prato do dia": "curiosidade e urgência suave",
  "Promover pizza": "vontade intensa de pedir pizza",
  "Promover comida cubana": "curiosidade por sabor autêntico cubano",
};

const normalizeTag = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");

const buildInspirationAdaptation = (inspiration) => {
  if (!inspiration) {
    return "Sem inspiração selecionada: criar conceito visual totalmente original para o Sabor Latino.";
  }

  return `Referência estratégica da inspiração:
- Plataforma: ${inspiration.platform}
- Tipo: ${inspiration.contentType}
- Nicho: ${inspiration.niche}
- Elemento visual: ${inspiration.visualElement}
- Por que funcionou: ${inspiration.whyWorked || "não informado"}
- Ideia adaptável: ${inspiration.adaptationIdea || "não informada"}

Regra obrigatória: usar apenas estratégia (gancho, ritmo, enquadramento e elemento visual). Nunca copiar texto, imagem, identidade ou composição exata.`;
};

export const generateImagePromptPack = ({ product, format, visualStyle, goal, settings, inspiration }) => {
  const restaurantName = settings.restaurantName || "Sabor Latino";
  const address = settings.address || "Avenida 23 de Maio, nº 313, Centro, Nova Bassano";
  const whatsapp = settings.whatsappNumber || "+55 54 8100-7256";
  const featured = settings.featuredDish || "Ropa vieja cubana";

  const productDetail = productDetails[product] || "prato latino quente e apetitoso";
  const formatDetail = formatDetails[format] || "formato para redes sociais";
  const styleDetail = styleDetails[visualStyle] || "estética gastronômica profissional";
  const goalDetail = goalDetails[goal] || "gerar desejo e conversão";
  const cameraSuggestion = styleCameraSuggestion[visualStyle] || "close no prato com fundo desfocado";
  const lightingSuggestion = styleLightingSuggestion[visualStyle] || "luz quente suave";
  const backgroundSuggestion = styleBackgroundSuggestion[visualStyle] || "fundo de restaurante latino acolhedor";
  const compositionSuggestion = formatCompositionSuggestion[format] || "composição limpa e focada no prato";
  const emotionSuggestion = goalEmotionSuggestion[goal] || "desejo de pedir agora";
  const visualElement = inspiration?.visualElement || "close-up apetitoso";
  const adaptationNote = buildInspirationAdaptation(inspiration);

  const fullPrompt = `Crie uma imagem promocional ORIGINAL para o restaurante ${restaurantName}, em Nova Bassano (RS), Brasil.

Produto: ${product}.
Formato: ${format} (${formatDetail}).
Estilo visual: ${visualStyle} (${styleDetail}).
Objetivo: ${goal} (${goalDetail}).
Elemento visual principal: ${visualElement}.

Direção criativa obrigatória:
- comida cubana/latina com aparência quente, saborosa e caseira
- detalhes do prato: ${productDetail}
- iluminação: ${lightingSuggestion}
- fundo: ${backgroundSuggestion}
- composição: ${compositionSuggestion}
- sugestão de câmera: ${cameraSuggestion}
- emoção desejada: ${emotionSuggestion}
- incluir contexto local de restaurante familiar latino
- prato destaque da casa: ${featured}

Restrições obrigatórias:
- sem texto na imagem
- sem marca d'água
- não copiar imagem de terceiros
- não reproduzir identidade visual de outras marcas

${adaptationNote}

Entrega: imagem publicitária original, nítida, apetitosa e pronta para redes sociais do Sabor Latino.`;

  const shortPrompt = `Imagem original de ${product}, estilo ${visualStyle}, formato ${format}, comida cubana/latina quente com ${visualElement}, luz quente, fundo de restaurante familiar, sem texto e sem marca d'água.`;

  const captionIdea = `Hoje no ${restaurantName} tem ${product} com cara de comida feita com carinho.
Se bateu vontade, chama no WhatsApp ${whatsapp}.`;

  const storyText = `${product} saindo quente agora.
Peça no WhatsApp ${whatsapp}.`;

  const hashtags = `#${normalizeTag(restaurantName)} #NovaBassano #ComidaCubana #ComidaLatina #PedidoNoWhatsApp`;

  const videoIdea = `Vídeo de 8 segundos:
0-2s: gancho com ${visualElement} e comida saindo quente.
2-5s: close de textura e vapor do ${product}.
5-8s: chamada final para pedir no WhatsApp ${whatsapp}.`;

  const instagramDescription = `${captionIdea}
📍 ${address}`;
  const shortOverlayText = `${product} hoje no ${restaurantName}`;
  const impactPhrase = `${product} quente, pedido no WhatsApp`;

  return {
    fullPrompt,
    shortPrompt,
    captionIdea,
    storyText,
    hashtags,
    videoIdea,
    cameraAngleSuggestion: cameraSuggestion,
    lightingSuggestion,
    instagramDescription,
    shortOverlayText,
    impactPhrase,
  };
};
