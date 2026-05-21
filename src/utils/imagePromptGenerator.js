const productDetails = {
  "Almoço latino":
    "prato latino de almoço completo, porção generosa, comida recém-servida, textura visível e apresentação apetitosa",
  "Pizza cubana":
    "pizza cubana artesanal com queijo derretendo, borda dourada, fatia puxando queijo e muito brilho",
  "Ropa vieja cubana":
    "ropa vieja cubana com carne desfiada suculenta, molho intenso, cores quentes e aparência premium",
  "Combo familiar":
    "combo farto para compartilhar, mesa abundante com variedade e sensação de refeição em família",
  Sobremesa: "sobremesa cremosa com acabamento bonito, textura rica e visual irresistível",
  Bebida: "bebida gelada com gotículas, cor vibrante, sensação de frescor e desejo imediato",
  "Restaurante cheio":
    "ambiente com salão movimentado, mesas ocupadas, pratos saindo da cozinha e clima acolhedor",
  "Pessoas comendo felizes":
    "pessoas sorrindo e comendo com prazer, expressão natural de satisfação e ambiente caloroso",
};

const formatDetails = {
  "Instagram Story 9:16": "composição vertical 9:16 com impacto imediato e espaço para texto curto",
  "Instagram Feed 4:5": "composição 4:5 para feed, foco no prato e leitura visual rápida",
  "Facebook Post": "composição equilibrada para post com chamada comercial clara",
  "WhatsApp Status": "composição vertical para status com mensagem direta e visual forte",
  "Banner horizontal": "composição horizontal ampla com destaque para comida e ambiente",
};

const styleDetails = {
  "Hiper-realista":
    "fotografia hiper-realista com alta nitidez, textura detalhada e acabamento publicitário profissional",
  "Comida quente com vapor":
    "comida saindo quente com vapor visível, brilho apetitoso e sensação real de frescor",
  Familiar:
    "estética familiar, acolhedora e próxima, mesa posta e clima de restaurante latino para todos",
  Viral:
    "visual forte para redes sociais, composição chamativa, contraste alto e estilo de alto impacto",
  "Elegante e profissional":
    "direção de arte elegante, limpa e sofisticada, com aparência premium",
  "Caseiro e acolhedor":
    "visual caseiro, aconchegante, tons quentes e sensação de comida feita com carinho",
};

const goalDetails = {
  "Dar fome": "provocar desejo imediato de comer",
  "Vender rápido": "estimular decisão rápida e conversão imediata",
  "Atrair clientes para o restaurante": "mostrar ambiente convidativo e movimentado",
  "Promover prato do dia": "destacar o prato principal com foco comercial",
  "Promover pizza": "valorizar queijo, textura e sabor da pizza",
  "Promover comida cubana": "destacar identidade cubana autêntica e sabor marcante",
};

const styleCameraSuggestion = {
  "Hiper-realista": "close médio em 45 graus com foco seletivo no prato principal",
  "Comida quente com vapor": "close-up extremo lateral para valorizar vapor e textura",
  Familiar: "plano aberto de mesa com prato em primeiro plano e pessoas ao fundo",
  Viral: "ângulo dinâmico levemente inclinado com foco central agressivo",
  "Elegante e profissional": "plano três quartos com composição limpa e simétrica",
  "Caseiro e acolhedor": "ângulo de mesa natural, altura dos olhos, estilo espontâneo",
};

const styleLightingSuggestion = {
  "Hiper-realista": "iluminação quente controlada com key light suave e fill light leve",
  "Comida quente com vapor": "luz lateral quente para destacar vapor e brilho da comida",
  Familiar: "luz ambiente quente de restaurante com sombras suaves",
  Viral: "luz forte com contraste alto e pontos de brilho para chamar atenção",
  "Elegante e profissional": "iluminação refinada com recorte elegante e equilíbrio tonal",
  "Caseiro e acolhedor": "luz dourada suave, sensação de fim de tarde aconchegante",
};

const normalizeTag = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");

const buildInspirationAdaptation = (inspiration) => {
  if (!inspiration) {
    return "Sem inspiração selecionada: criar conceito totalmente original para Sabor Latino.";
  }

  return `Baseado na inspiração escolhida, adaptar apenas a estratégia visual:
- Plataforma de referência: ${inspiration.platform}
- Tipo de conteúdo: ${inspiration.contentType}
- Nicho: ${inspiration.niche}
- Elemento visual principal: ${inspiration.visualElement}
- Motivo de desempenho: ${inspiration.whyWorked || "não informado"}
- Ideia para adaptação no Sabor Latino: ${inspiration.adaptationIdea || "não informada"}

Regra obrigatória: NÃO copiar texto original, NÃO copiar imagem original, NÃO reproduzir marca de terceiros. Criar uma peça inédita e própria para Sabor Latino.`;
};

export const generateImagePromptPack = ({
  product,
  format,
  visualStyle,
  goal,
  settings,
  inspiration,
}) => {
  const restaurantName = settings.restaurantName || "Sabor Latino";
  const address = settings.address || "Avenida 23 de Maio, nº 313, Centro, Nova Bassano";
  const whatsapp = settings.whatsappNumber || "+55 54 8100-7256";
  const featured = settings.featuredDish || "Ropa vieja cubana";

  const strategy = buildInspirationAdaptation(inspiration);
  const cameraSuggestion = styleCameraSuggestion[visualStyle] || "close de comida com fundo desfocado";
  const lightingSuggestion =
    styleLightingSuggestion[visualStyle] || "iluminação quente de restaurante para visual apetitoso";
  const impactPhrase = `${product} saindo quente no ${restaurantName}. Peça agora no WhatsApp!`;

  const fullPrompt = `Crie uma imagem publicitária ORIGINAL para o restaurante ${restaurantName}, em Nova Bassano (RS), Brasil.
Produto principal: ${product}.
Objetivo: ${goal} (${goalDetails[goal]}).
Formato: ${format} (${formatDetails[format]}).
Estilo visual: ${visualStyle} (${styleDetails[visualStyle]}).
Direção culinária: ${productDetails[product]}.
Prato de destaque da casa: ${featured}.

Direção de fotografia:
- câmera profissional, alta nitidez, acabamento de campanha gastronômica
- sugestão de ângulo: ${cameraSuggestion}
- sugestão de iluminação: ${lightingSuggestion}
- comida com aparência suculenta, quente e muito apetitosa
- mesa de restaurante latino com cores quentes (laranja, vermelho, dourado)
- ambiente familiar/cubano acolhedor ao fundo, sem poluição visual
- vapor visível quando aplicável
- composição comercial pronta para redes sociais

${strategy}

Entrega esperada: imagem final com visual original, sem copiar conteúdos de terceiros e com foco total em conversão para o Sabor Latino.`;

  const shortOverlayText = `${product.toUpperCase()} HOJE\n${restaurantName}\nWhatsApp: ${whatsapp}`;

  const instagramDescription = `${product} com visual irresistível no ${restaurantName}. ${goalDetails[goal]}.
Sabor latino e cubano de verdade, feito para dar água na boca.
Peça agora no WhatsApp: ${whatsapp}
📍 ${address}`;

  const hashtags = `#${normalizeTag(restaurantName)} #ComidaLatina #ComidaCubana #NovaBassano #Gastronomia #FoodMarketing #${normalizeTag(
    product
  )} #${normalizeTag(goal)} #PedidoNoWhatsApp`;

  const videoIdea = `Vídeo de 8 segundos:
0-2s: close no ${product} saindo quente, com textura e vapor.
2-5s: corte para detalhe de quem prova e reage com satisfação.
5-8s: tela final com frase de impacto e chamada para WhatsApp ${whatsapp}.`;

  return {
    fullPrompt,
    shortOverlayText,
    instagramDescription,
    hashtags,
    videoIdea,
    cameraAngleSuggestion: cameraSuggestion,
    lightingSuggestion,
    impactPhrase,
  };
};
