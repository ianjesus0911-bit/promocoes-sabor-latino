import { useEffect, useMemo, useState } from "react";
import {
  channels,
  fixedWhatsAppNumber,
  imageFormats,
  imageGoals,
  imageProducts,
  imageStyles,
  initialSettings,
  inspirationContentTypes,
  inspirationNiches,
  inspirationPlatforms,
  inspirationVisualElements,
  promotionTypes,
  quickActions,
  tones,
} from "./data/mockData";
import { usePersistentState } from "./hooks/usePersistentState";
import { generateCampaignDayPack, generateCampaignWeekPlanningPack } from "./utils/campaignDayGenerator";
import { generateImagePromptPack } from "./utils/imagePromptGenerator";
import {
  buildManualInstagramInsights,
  generateIntelligentCampaignPack,
} from "./utils/intelligentCampaignGenerator";
import { generatePromotionPack } from "./utils/promoGenerator";
import { buildFixedWhatsAppLink, buildWhatsAppLink, FIXED_WHATSAPP_DISPLAY } from "./utils/whatsapp";

const sections = [
  { id: "inicio", label: "Início" },
  { id: "campanha_inteligente", label: "Campanha Inteligente" },
  { id: "criador", label: "Criador" },
  { id: "gerador", label: "Gerador" },
  { id: "campanha_dia", label: "Campanha do Dia" },
  { id: "instagram_oficial", label: "Instagram Manual" },
  { id: "insp_imagens", label: "Inspirações & Imagens" },
  { id: "historico", label: "Histórico" },
  { id: "favoritas", label: "Favoritas" },
  { id: "rapidas", label: "Rápidas" },
  { id: "config", label: "Configurações" },
];

const defaultBuilder = {
  promotionType: "Almoço",
  channel: "Todos",
  tone: "Direto para vender",
};

const defaultImageBuilder = {
  product: "Almoço latino",
  format: "Instagram Story 9:16",
  visualStyle: "Hiper-realista",
  goal: "Dar fome",
  useSavedInspiration: "nao",
  selectedInspirationId: "",
};

const defaultInspirationForm = {
  link: "",
  platform: "Instagram",
  contentType: "Reel",
  niche: "comida latina",
  visualElement: "close-up",
  views: "",
  likes: "",
  comments: "",
  shares: "",
  saves: "",
  whyWorked: "",
  adaptationIdea: "",
};

const campaignProducts = ["almoço", "pizza", "ropa vieja cubana", "sobremesa", "combo familiar"];

const campaignObjectives = [
  "vender pelo WhatsApp",
  "atrair pessoas ao restaurante",
  "vender últimas unidades",
  "divulgar prato do dia",
  "atrair famílias",
  "promover comida cubana",
  "organizar campanhas de terça a domingo",
];

const campaignMoments = ["manhã", "almoço", "almoço familiar", "tarde", "noite"];

const campaignTones = ["urgente", "familiar", "alegre", "direto para vender", "caseiro", "emocional"];

const campaignDayTypes = ["venda do dia", "planejamento da semana"];

const defaultCampaignDayBuilder = {
  campaignType: "venda do dia",
  product: "almoço",
  objective: "vender pelo WhatsApp",
  moment: "almoço",
  tone: "direto para vender",
  availableQuantity: "",
  deadline: "",
};

const weekPlannerDays = [
  { id: "segunda", label: "Segunda", shortLabel: "Seg", jsDay: 1, status: "Fechado" },
  { id: "terca", label: "Terça", shortLabel: "Ter", jsDay: 2, status: "Aberto" },
  { id: "quarta", label: "Quarta", shortLabel: "Qua", jsDay: 3, status: "Aberto" },
  { id: "quinta", label: "Quinta", shortLabel: "Qui", jsDay: 4, status: "Aberto" },
  { id: "sexta", label: "Sexta", shortLabel: "Sex", jsDay: 5, status: "Aberto" },
  { id: "sabado", label: "Sábado", shortLabel: "Sáb", jsDay: 6, status: "Aberto" },
  { id: "domingo", label: "Domingo", shortLabel: "Dom", jsDay: 0, status: "Aberto" },
];

const mondayPlanningRecommendations = [
  "Dia ideal para planejar as campanhas da semana.",
  "Prepare os posts de terça a domingo.",
  "Revise quais pratos tiveram melhor resultado.",
  "Organize as promoções da semana.",
];

const weekDayShortRecommendations = {
  segunda: "Fechado. Bom dia para planejar a semana.",
  terca: "Boa para divulgar almoço rápido e caseiro.",
  quarta: "Bom dia para reforçar almoço e pedidos no WhatsApp.",
  quinta: "Ótimo dia para aquecer o fim de semana com ofertas.",
  sexta: "Bom dia para começar a vender pizza à noite.",
  sabado: "Ideal para campanha familiar ou pizza.",
  domingo: "Perfeito para comida cubana e almoço em família.",
};

const getCurrentWeekPlannerDayId = () => {
  const todayJsDay = new Date().getDay();
  return weekPlannerDays.find((day) => day.jsDay === todayJsDay)?.id || "terca";
};

const getCampaignDayDefaultsByWeekDay = (weekDayId, currentMoment = "almoço") => {
  if (weekDayId === "segunda") {
    return {
      campaignType: "planejamento da semana",
      product: "almoço",
      objective: "organizar campanhas de terça a domingo",
      moment: "manhã",
      tone: "caseiro",
    };
  }

  if (weekDayId === "terca" || weekDayId === "quarta" || weekDayId === "quinta") {
    return {
      campaignType: "venda do dia",
      product: "almoço",
      objective: weekDayId === "quinta" ? "atrair pessoas ao restaurante" : "vender pelo WhatsApp",
      moment: "almoço",
      tone: weekDayId === "quarta" ? "direto para vender" : "caseiro",
    };
  }

  if (weekDayId === "sexta") {
    const isNight = currentMoment === "noite";
    return {
      campaignType: "venda do dia",
      product: isNight ? "pizza" : "almoço",
      objective: "vender pelo WhatsApp",
      moment: isNight ? "noite" : "almoço",
      tone: isNight ? "alegre" : "direto para vender",
    };
  }

  if (weekDayId === "sabado") {
    return {
      campaignType: "venda do dia",
      product: "pizza",
      objective: "atrair pessoas ao restaurante",
      moment: "noite",
      tone: "alegre",
    };
  }

  return {
    campaignType: "venda do dia",
    product: "ropa vieja cubana",
    objective: "atrair famílias",
    moment: "almoço familiar",
    tone: "emocional",
  };
};

const outputFields = [
  { key: "whatsappText", title: "Texto para WhatsApp" },
  { key: "instagramText", title: "Texto para Instagram" },
  { key: "facebookText", title: "Texto para Facebook" },
  { key: "storyShortText", title: "Texto curto para Story" },
  { key: "videoOverlay", title: "Frase chamativa para vídeo" },
  { key: "videoScript", title: "Roteiro de vídeo (8 a 10 segundos)" },
  { key: "hashtags", title: "Hashtags" },
];

const quickOutputFields = [
  { key: "whatsappText", title: "Mensagem para WhatsApp" },
  { key: "instagramStoryText", title: "Texto para Story de Instagram" },
  { key: "facebookText", title: "Texto para Facebook" },
  { key: "imagePhrase", title: "Frase para imagem" },
  { key: "hashtags", title: "Hashtags" },
  { key: "ctaWhatsapp", title: "CTA para WhatsApp" },
];

const quickActionConfigs = {
  qa1: {
    product: "almoço",
    objective: "vender pelo WhatsApp",
    audience: "trabalhadores",
    moment: "almoço",
    tone: "direto",
    mainChannel: "WhatsApp",
    instruction:
      "Foco em almoço de hoje. Mensagem curta e direta para vender pelo WhatsApp.",
  },
  qa2: {
    product: "pizza",
    objective: "vender pelo WhatsApp",
    audience: "clientes de pizza",
    moment: "noite",
    tone: "alegre",
    mainChannel: "Todos",
    instruction:
      "Foco em pizza cubana à noite, queijo puxando, comida quente e pedido no WhatsApp.",
  },
  qa3: {
    product: "ropa vieja cubana",
    objective: "divulgar comida cubana",
    audience: "famílias",
    moment: "almoço",
    tone: "caseiro",
    mainChannel: "Instagram Feed",
    instruction:
      "Foco em prato típico cubano, sabor caseiro, Sabor Latino e Nova Bassano.",
  },
  qa4: {
    product: "combo familiar",
    objective: "vender rápido",
    audience: "clientes locais",
    moment: "noite",
    tone: "urgente",
    mainChannel: "WhatsApp",
    instruction:
      "Urgência realista: últimas unidades, saindo agora, reserve pelo WhatsApp. Não inventar desconto.",
  },
  qa5: {
    product: "almoço",
    objective: "atrair clientes ao restaurante",
    audience: "famílias",
    moment: "noite",
    tone: "familiar",
    mainChannel: "Facebook",
    instruction:
      "Foco em levar pessoas ao local. Mencionar Sabor Latino e Nova Bassano com tom próximo.",
  },
  qa6: {
    product: "ropa vieja cubana",
    objective: "divulgar comida cubana",
    audience: "famílias",
    moment: "almoço",
    tone: "familiar",
    mainChannel: "Instagram Feed",
    instruction:
      "Post de domingo com almoço em família e comida cubana. Restaurante abre de terça a domingo e fecha na segunda.",
  },
  qa7: {
    product: "almoço",
    objective: "vender pelo WhatsApp",
    audience: "clientes locais",
    moment: "almoço",
    tone: "direto",
    mainChannel: "WhatsApp",
    instruction:
      "Criar mensagem curta para Status do WhatsApp, no máximo 2 linhas, natural e com chamada clara para pedir ou visitar.",
  },
};

const historyResultChannels = ["WhatsApp", "Instagram Story", "Instagram Feed", "Facebook", "TikTok"];

const defaultHistoryResultForm = {
  publishedAt: "",
  channelUsed: "WhatsApp",
  productPromoted: "",
  views: "",
  likes: "",
  comments: "",
  shares: "",
  saves: "",
  whatsappClicks: "",
  ordersGenerated: "",
  soldApprox: "",
  notes: "",
};

const channelFormatSuggestion = {
  WhatsApp: "Status + mensagem direta no WhatsApp",
  "Instagram Story": "Story vertical 9:16 com texto curto",
  "Instagram Feed": "Feed 4:5 com close apetitoso",
  Facebook: "Post local com chamada para família",
  TikTok: "Vídeo curto com gancho nos primeiros segundos",
};

const productVisualSuggestion = {
  almoço: "prato completo com vapor e cara de comida caseira",
  pizza: "fatia com queijo puxando e forno ao fundo",
  "ropa vieja cubana": "carne desfiada brilhante com toque artesanal",
  sobremesa: "textura cremosa em close com luz quente",
  "combo familiar": "mesa farta com clima de família",
};

const imageOutputFields = [
  { key: "fullPrompt", title: "Prompt completo para imagem" },
  { key: "shortPrompt", title: "Prompt curto" },
  { key: "captionIdea", title: "Ideia de legenda" },
  { key: "storyText", title: "Texto para story" },
  { key: "hashtags", title: "Hashtags" },
  { key: "videoIdea", title: "Ideia de vídeo curto de 8 segundos" },
];

const inspirationAdaptationOutputFields = [
  { key: "gancho", title: "Gancho (2 segundos)" },
  { key: "texto_plataforma", title: "Texto para plataforma" },
  { key: "whatsapp", title: "Texto curto para WhatsApp" },
  { key: "frase_imagem", title: "Frase para imagem/story" },
  { key: "prompt_imagem", title: "Prompt de imagem profissional" },
  { key: "roteiro_video", title: "Roteiro de vídeo (8 segundos)" },
  { key: "hashtags", title: "Hashtags" },
  { key: "recomendacao_adaptacao", title: "Recomendação de adaptação sem copiar" },
  { key: "cta_whatsapp", title: "CTA para WhatsApp" },
];

const campaignDayOutputFields = [
  { key: "whatsappText", title: "Texto para WhatsApp" },
  { key: "statusWhatsAppText", title: "Texto para Status do WhatsApp" },
  { key: "instagramStoryText", title: "Texto para Instagram Story" },
  { key: "instagramFeedCaption", title: "Legenda para Instagram Feed" },
  { key: "facebookText", title: "Texto para Facebook" },
  { key: "imageShortPhrase", title: "Frase curta para colocar na imagem" },
  { key: "imagePrompt", title: "Prompt de imagem" },
  { key: "videoIdea", title: "Ideia de vídeo de 8 segundos" },
  { key: "hashtags", title: "Hashtags" },
  { key: "finalWhatsappCall", title: "Chamada final para WhatsApp" },
];

const intelligentCampaignProducts = ["almoço", "pizza", "ropa vieja cubana", "sobremesa", "combo familiar"];

const intelligentCampaignObjectives = [
  "vender pelo WhatsApp",
  "atrair clientes ao restaurante",
  "vender rápido",
  "divulgar comida cubana",
  "divulgar pizza",
];

const intelligentCampaignAudiences = [
  "famílias",
  "trabalhadores",
  "jovens",
  "pessoas perto do centro",
  "clientes de pizza",
  "clientes de comida caseira",
];

const intelligentCampaignMoments = ["manhã", "almoço", "tarde", "noite"];

const intelligentCampaignChannels = ["WhatsApp", "Instagram Story", "Instagram Feed", "Facebook", "TikTok", "Todos"];

const intelligentCampaignTones = ["urgente", "familiar", "alegre", "direto", "caseiro", "elegante"];

const defaultIntelligentCampaignBuilder = {
  product: "almoço",
  objective: "vender pelo WhatsApp",
  audience: "famílias",
  moment: "almoço",
  mainChannel: "Todos",
  tone: "direto",
};

const intelligentCampaignOutputFields = [
  { key: "strategyRecommended", title: "Estratégia recomendada" },
  { key: "whatsappText", title: "Texto para WhatsApp" },
  { key: "instagramStoryText", title: "Texto para Instagram Story" },
  { key: "instagramFeedCaption", title: "Legenda para Instagram Feed" },
  { key: "facebookText", title: "Texto para Facebook" },
  { key: "tiktokText", title: "Texto para TikTok" },
  { key: "imageImpactPhrase", title: "Frase de impacto para imagem" },
  { key: "imagePrompt", title: "Prompt completo de imagem" },
  { key: "videoScript", title: "Roteiro de vídeo de 8 segundos" },
  { key: "hashtags", title: "Hashtags" },
  { key: "bestTimeSuggested", title: "Melhor horário sugerido" },
  { key: "finalWhatsAppCTA", title: "CTA final para WhatsApp" },
];

const defaultInstagramPosts = [
  {
    id: "ig-1",
    date: "2026-05-18T19:20",
    link: "https://www.instagram.com/p/exemplo1/",
    type: "Reel",
    dish: "Pizza cubana",
    views: 18600,
    likes: 1420,
    comments: 178,
    saves: 256,
    shares: 192,
    estimatedOrders: 54,
    notes: "Close com queijo puxando e CTA no final.",
    performance: "alto",
  },
  {
    id: "ig-2",
    date: "2026-05-17T12:25",
    link: "https://www.instagram.com/p/exemplo2/",
    type: "Feed",
    dish: "Almoço latino",
    views: 7900,
    likes: 620,
    comments: 72,
    saves: 104,
    shares: 67,
    estimatedOrders: 39,
    notes: "Foto farta, bom resultado no horário de almoço.",
    performance: "alto",
  },
  {
    id: "ig-3",
    date: "2026-05-16T18:45",
    link: "https://www.instagram.com/p/exemplo3/",
    type: "Story",
    dish: "Ropa vieja cubana",
    views: 5400,
    likes: 290,
    comments: 25,
    saves: 58,
    shares: 30,
    estimatedOrders: 26,
    notes: "Boa retenção, mas CTA discreto.",
    performance: "médio",
  },
  {
    id: "ig-4",
    date: "2026-05-15T20:10",
    link: "https://www.instagram.com/p/exemplo4/",
    type: "Reel",
    dish: "Combo familiar",
    views: 13300,
    likes: 980,
    comments: 121,
    saves: 168,
    shares: 147,
    estimatedOrders: 41,
    notes: "Vídeo com mesa cheia funcionou muito bem.",
    performance: "alto",
  },
  {
    id: "ig-5",
    date: "2026-05-14T15:35",
    link: "https://www.instagram.com/p/exemplo5/",
    type: "Feed",
    dish: "Sobremesa",
    views: 4200,
    likes: 260,
    comments: 19,
    saves: 34,
    shares: 17,
    estimatedOrders: 11,
    notes: "Bom para branding, menor conversão em pedidos.",
    performance: "baixo",
  },
  {
    id: "ig-6",
    date: "2026-05-13T18:30",
    link: "https://www.instagram.com/p/exemplo6/",
    type: "Reel",
    dish: "Ropa vieja cubana",
    views: 11200,
    likes: 860,
    comments: 109,
    saves: 136,
    shares: 125,
    estimatedOrders: 37,
    notes: "Vapor e corte da carne aumentaram engajamento.",
    performance: "alto",
  },
];

const instagramManualContentTypes = ["Reel", "Story", "Feed"];

const defaultInstagramManualForm = {
  date: "",
  link: "",
  type: "Reel",
  dish: "",
  views: "",
  likes: "",
  comments: "",
  shares: "",
  saves: "",
  orders: "",
  notes: "",
};

const instagramGeneratedFields = [
  { key: "whatsappText", title: "Texto para WhatsApp" },
  { key: "instagramText", title: "Texto para Instagram" },
  { key: "storyText", title: "Frase para Story" },
  { key: "imagePrompt", title: "Prompt de imagem" },
  { key: "videoIdea", title: "Ideia de vídeo curto" },
];

const forbiddenInstagramPathKeywords = new Set([
  "reel",
  "reels",
  "p",
  "stories",
  "tv",
  "explore",
  "accounts",
  "direct",
  "hashtags",
  "locations",
]);

const normalizeInstagramOfficialInput = (rawValue) => {
  const value = String(rawValue || "").trim();
  if (!value) {
    return { error: "Informe o Instagram oficial do restaurante." };
  }

  let normalizedValue = value;
  if (/^(instagram\.com|www\.instagram\.com)\//i.test(normalizedValue)) {
    normalizedValue = `https://${normalizedValue}`;
  }

  const isUrlValue = /^https?:\/\//i.test(normalizedValue);
  let username = normalizedValue;

  if (isUrlValue) {
    let parsedUrl;
    try {
      parsedUrl = new URL(normalizedValue);
    } catch (error) {
      return { error: "Link inválido. Use @usuario, usuario ou link do perfil do Instagram." };
    }

    const host = parsedUrl.hostname.toLowerCase();
    if (host !== "instagram.com" && host !== "www.instagram.com") {
      return { error: "Use apenas links de instagram.com para o perfil oficial." };
    }

    if (parsedUrl.search || parsedUrl.hash) {
      return { error: "Remova parâmetros do link. Use apenas o endereço limpo do perfil." };
    }

    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    if (!segments.length) {
      return { error: "Link incompleto. Informe o usuário do perfil do Instagram." };
    }

    const hasForbiddenSegment = segments.some((segment) => forbiddenInstagramPathKeywords.has(segment.toLowerCase()));
    if (hasForbiddenSegment || segments.length !== 1) {
      return { error: "Use apenas link do perfil. Links de reel, post e stories não são aceitos." };
    }

    username = segments[0];
  } else {
    username = normalizedValue.replace(/^@+/, "").trim();
    if (username.includes("/") || username.includes("?") || username.includes("#")) {
      return { error: "Use @usuario, usuario ou link direto do perfil do Instagram." };
    }
  }

  if (!username) {
    return { error: "Informe um usuário válido do Instagram." };
  }

  if (forbiddenInstagramPathKeywords.has(username.toLowerCase())) {
    return { error: "Esse valor não parece um usuário de perfil. Informe apenas o @usuario oficial." };
  }

  if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) {
    return { error: "Usuário inválido. Use apenas letras, números, ponto ou sublinhado." };
  }

  return { value: `@${username.toLowerCase()}` };
};

function App() {
  const [activeSection, setActiveSection] = useState("inicio");
  const [settings, setSettings] = usePersistentState("promocoes.settings", initialSettings);
  const [builder, setBuilder] = usePersistentState("promocoes.builder", defaultBuilder);
  const [generated, setGenerated] = usePersistentState("promocoes.generated", null);
  const [favoritePromotions, setFavoritePromotions] = usePersistentState("promocoes.favorites", []);
  const [historyItems, setHistoryItems] = usePersistentState("promocoes.historico", []);
  const [historyResults, setHistoryResults] = usePersistentState("promocoes.historico.resultados", []);
  const [imageBuilder, setImageBuilder] = usePersistentState("promocoes.imageBuilder", defaultImageBuilder);
  const [imageGenerated, setImageGenerated] = usePersistentState("promocoes.imageGenerated", null);
  const [inspirations, setInspirations] = usePersistentState("promocoes.inspiracoes", []);
  const [intelligentCampaignBuilder, setIntelligentCampaignBuilder] = usePersistentState(
    "promocoes.campanhaInteligente.builder",
    defaultIntelligentCampaignBuilder
  );
  const [intelligentCampaignGenerated, setIntelligentCampaignGenerated] = usePersistentState(
    "promocoes.campanhaInteligente.generated",
    null
  );
  const [campaignDayBuilder, setCampaignDayBuilder] = usePersistentState(
    "promocoes.campanhaDia.builder",
    defaultCampaignDayBuilder
  );
  const [campaignDayGenerated, setCampaignDayGenerated] = usePersistentState("promocoes.campanhaDia.generated", null);
  const [campaignDayWeeklyHistory, setCampaignDayWeeklyHistory] = usePersistentState(
    "promocoes.campanhaDia.weeklyHistory",
    []
  );
  const [instagramPosts, setInstagramPosts] = usePersistentState("promocoes.instagramOfficial.posts", defaultInstagramPosts);
  const [instagramGenerated, setInstagramGenerated] = usePersistentState("promocoes.instagramOfficial.generated", null);

  const [inspirationForm, setInspirationForm] = useState(defaultInspirationForm);
  const [instagramManualForm, setInstagramManualForm] = useState(defaultInstagramManualForm);
  const [campaignDaySelectedWeekDay, setCampaignDaySelectedWeekDay] = useState(() => getCurrentWeekPlannerDayId());
  const [campaignDayViewedRecord, setCampaignDayViewedRecord] = useState(null);
  const [copiedKey, setCopiedKey] = useState("");
  const [favoriteFeedback, setFavoriteFeedback] = useState("");
  const [imageCopyFeedback, setImageCopyFeedback] = useState("");
  const [inspirationFeedback, setInspirationFeedback] = useState("");
  const [intelligentCampaignFeedback, setIntelligentCampaignFeedback] = useState("");
  const [intelligentCampaignLoading, setIntelligentCampaignLoading] = useState(false);
  const [campaignDayFeedback, setCampaignDayFeedback] = useState("");
  const [quickGenerated, setQuickGenerated] = useState(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState("");
  const [inspirationAdaptation, setInspirationAdaptation] = useState(null);
  const [inspirationAdaptationLoading, setInspirationAdaptationLoading] = useState(false);
  const [inspirationAdaptationFeedback, setInspirationAdaptationFeedback] = useState("");
  const [historyResultEditingId, setHistoryResultEditingId] = useState("");
  const [historyResultForm, setHistoryResultForm] = useState(defaultHistoryResultForm);
  const [historyResultFeedback, setHistoryResultFeedback] = useState("");
  const [instagramFeedback, setInstagramFeedback] = useState("");
  const [instagramManualFeedback, setInstagramManualFeedback] = useState("");
  const [instagramProfileInput, setInstagramProfileInput] = useState(
    settings.instagramOfficial || "@saborlatinobassano"
  );
  const [instagramProfileError, setInstagramProfileError] = useState("");

  useEffect(() => {
    if (settings.instagramOfficial === undefined) {
      setSettings((current) => ({
        ...current,
        instagramOfficial: "@saborlatinobassano",
      }));
      return;
    }

    if (String(settings.instagramOfficial).toLowerCase() === "@saborlatino") {
      setSettings((current) => ({
        ...current,
        instagramOfficial: "@saborlatinobassano",
      }));
      return;
    }

    const parsed = normalizeInstagramOfficialInput(settings.instagramOfficial || "");
    if (parsed.value && parsed.value !== settings.instagramOfficial) {
      setSettings((current) => ({
        ...current,
        instagramOfficial: parsed.value,
      }));
      return;
    }

    setInstagramProfileInput(settings.instagramOfficial || "");
    if (parsed.error) {
      setInstagramProfileError(parsed.error);
      return;
    }

    setInstagramProfileError("");
  }, [settings.instagramOfficial, setSettings]);

  const openingMessage = useMemo(() => {
    return `Olá! Quero ver as promoções de hoje do ${settings.restaurantName}.`;
  }, [settings.restaurantName]);

  const normalizedOfficialInstagram =
    normalizeInstagramOfficialInput(settings.instagramOfficial || "@saborlatinobassano").value ||
    "@saborlatinobassano";
  const officialInstagramUsername = normalizedOfficialInstagram.replace(/^@/, "");
  const officialInstagramUrl = `https://www.instagram.com/${officialInstagramUsername}/`;

  const selectedCampaignWeekDayConfig =
    weekPlannerDays.find((day) => day.id === campaignDaySelectedWeekDay) || weekPlannerDays[1];
  const isCampaignDayClosed = selectedCampaignWeekDayConfig.id === "segunda";
  const campaignDayShortRecommendation =
    weekDayShortRecommendations[selectedCampaignWeekDayConfig.id] || "Ajuste a campanha e gere seu conteúdo.";

  const latestCampaignByWeekDay = useMemo(() => {
    if (!Array.isArray(campaignDayWeeklyHistory)) return {};
    const map = {};
    for (const item of campaignDayWeeklyHistory) {
      if (!item?.weekDayId) continue;
      if (!map[item.weekDayId]) {
        map[item.weekDayId] = item;
      }
    }
    return map;
  }, [campaignDayWeeklyHistory]);

  useEffect(() => {
    setCampaignDayBuilder((current) => ({
      ...current,
      ...getCampaignDayDefaultsByWeekDay(
        campaignDaySelectedWeekDay,
        campaignDaySelectedWeekDay === "sexta" ? "almoço" : current.moment
      ),
    }));
  }, [campaignDaySelectedWeekDay, setCampaignDayBuilder]);

  useEffect(() => {
    setCampaignDayViewedRecord(latestCampaignByWeekDay[campaignDaySelectedWeekDay] || null);
  }, [campaignDaySelectedWeekDay, latestCampaignByWeekDay]);

  const parseInstagramPostDate = (value) => {
    const parsed = new Date(String(value || "").replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const formatInstagramPostDate = (value) => {
    const parsed = parseInstagramPostDate(value);
    if (!parsed) return "Data não informada";
    return parsed.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  };

  const selectedInspiration = useMemo(() => {
    return inspirations.find((item) => item.id === imageBuilder.selectedInspirationId) || null;
  }, [imageBuilder.selectedInspirationId, inspirations]);

  const inspirationAnalysis = useMemo(() => {
    if (inspirations.length < 2) {
      return {
        hasEnoughData: false,
        count: inspirations.length,
      };
    }

    const countBy = (items, pick) =>
      items.reduce((acc, item) => {
        const key = pick(item) || "não informado";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

    const topKey = (map) =>
      Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => key)[0] || "não informado";

    const topPlatform = topKey(countBy(inspirations, (item) => item.platform));
    const topContentType = topKey(countBy(inspirations, (item) => item.contentType));
    const topVisualElement = topKey(countBy(inspirations, (item) => item.visualElement));

    const inspirationWithMostViews =
      [...inspirations].sort((a, b) => (b.metrics?.views || 0) - (a.metrics?.views || 0))[0] || null;
    const inspirationWithMostSaves =
      [...inspirations].sort((a, b) => (b.metrics?.saves || 0) - (a.metrics?.saves || 0))[0] || null;

    const bestForToday =
      [...inspirations]
        .map((item) => {
          const score =
            (item.metrics?.views || 0) * 0.02 +
            (item.metrics?.likes || 0) * 0.6 +
            (item.metrics?.shares || 0) * 1.2 +
            (item.metrics?.saves || 0) * 1.4 +
            (item.adaptationIdea ? 180 : 0);
          return { ...item, score };
        })
        .sort((a, b) => b.score - a.score)[0] || null;

    const bestIdeaForToday = bestForToday
      ? `${bestForToday.platform} • ${bestForToday.contentType}: ${
          bestForToday.adaptationIdea || bestForToday.whyWorked || "usar gancho visual curto e CTA direto"
        }`
      : "Sem dados";

    return {
      hasEnoughData: true,
      count: inspirations.length,
      topPlatform,
      topContentType,
      topVisualElement,
      inspirationWithMostViews,
      inspirationWithMostSaves,
      bestIdeaForToday,
    };
  }, [inspirations]);

  const instagramPostsList = useMemo(() => {
    if (!Array.isArray(instagramPosts)) return [];
    return instagramPosts.map((post) => ({
      ...post,
      type: post.type || "Feed",
      dish: post.dish || "Prato latino",
      date: post.date || "",
      link: post.link || "",
      notes: post.notes || "",
      views: Number(post.views) || 0,
      likes: Number(post.likes) || 0,
      comments: Number(post.comments) || 0,
      saves: Number(post.saves) || 0,
      shares: Number(post.shares) || 0,
      estimatedOrders: Number(post.estimatedOrders ?? post.ordersGenerated) || 0,
    }));
  }, [instagramPosts]);

  const calculateInstagramScore = (post) => {
    return (
      post.views * 0.04 +
      post.likes * 1.1 +
      post.comments * 2.3 +
      post.saves * 2.2 +
      post.shares * 2.4 +
      post.estimatedOrders * 5
    );
  };

  const instagramMetrics = useMemo(() => {
    const posts = instagramPostsList;
    if (!posts.length) {
      return {
        analyzedCount: 0,
        topPerformancePost: null,
        topContentType: "Reel",
        topDishByOrders: "Ropa vieja cubana",
        bestObservedHourRange: "18h - 20h",
        recommendationToday:
          "Registre publicações manuais para receber recomendações mais precisas do que publicar hoje.",
        topDish: "Ropa vieja cubana",
        bestDay: "quinta-feira",
        bestHourRange: "18h - 20h",
      };
    }

    const scoredPosts = posts.map((post) => ({
      ...post,
      score: calculateInstagramScore(post),
    }));

    const topPerformancePost = [...scoredPosts].sort((a, b) => b.score - a.score)[0] || null;

    const byDish = posts.reduce((acc, post) => {
      const score = calculateInstagramScore(post);
      if (!acc[post.dish]) {
        acc[post.dish] = { total: 0, count: 0 };
      }
      acc[post.dish].total += score;
      acc[post.dish].count += 1;
      return acc;
    }, {});

    const byDishOrders = posts.reduce((acc, post) => {
      acc[post.dish] = (acc[post.dish] || 0) + (Number(post.estimatedOrders) || 0);
      return acc;
    }, {});

    const topDishByOrders =
      Object.entries(byDishOrders)
        .sort((a, b) => b[1] - a[1])
        .map(([dish]) => dish)[0] || "Ropa vieja cubana";

    const topDish =
      Object.entries(byDish)
        .sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count)
        .map(([dish]) => dish)[0] || "Ropa vieja cubana";

    const byWeekDay = scoredPosts.reduce((acc, post) => {
      const date = parseInstagramPostDate(post.date);
      if (!date) return acc;
      const weekDay = date.toLocaleDateString("pt-BR", { weekday: "long" });
      if (!acc[weekDay]) {
        acc[weekDay] = { total: 0, count: 0 };
      }
      acc[weekDay].total += post.score;
      acc[weekDay].count += 1;
      return acc;
    }, {});

    const bestDay =
      Object.entries(byWeekDay)
        .sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count)
        .map(([day]) => day)[0] || "quinta-feira";

    const byHour = scoredPosts.reduce((acc, post) => {
      const date = parseInstagramPostDate(post.date);
      if (!date) return acc;
      const hour = Number(date.getHours());
      if (!acc[hour]) {
        acc[hour] = { total: 0, count: 0 };
      }
      acc[hour].total += post.score;
      acc[hour].count += 1;
      return acc;
    }, {});

    const bestHour =
      Object.entries(byHour)
        .sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count)
        .map(([hour]) => Number(hour))[0] ?? 19;

    const bestHourRange = `${String(bestHour).padStart(2, "0")}h - ${String((bestHour + 2) % 24).padStart(2, "0")}h`;

    const byContentType = scoredPosts.reduce((acc, post) => {
      if (!acc[post.type]) {
        acc[post.type] = { total: 0, count: 0 };
      }
      acc[post.type].total += post.score;
      acc[post.type].count += 1;
      return acc;
    }, {});

    const topContentType =
      Object.entries(byContentType)
        .sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count)
        .map(([contentType]) => contentType)[0] || "Reel";

    const recommendationToday = `Hoje vale focar em ${topContentType} com ${topDishByOrders}, publicar entre ${bestHourRange} e CTA forte para WhatsApp.`;

    return {
      analyzedCount: posts.length,
      topPerformancePost,
      topContentType,
      topDishByOrders,
      bestObservedHourRange: bestHourRange,
      recommendationToday,
      topDish,
      bestDay,
      bestHourRange,
    };
  }, [instagramPostsList]);

  const instagramRecommendations = useMemo(() => {
    const topDishLower = instagramMetrics.topDishByOrders.toLowerCase();
    return [
      `Hoje vale promover ${topDishLower} porque esse prato gerou mais pedidos nas análises manuais.`,
      `Formato com melhor desempenho: ${instagramMetrics.topContentType}.`,
      `Melhor horário observado: ${instagramMetrics.bestObservedHourRange}.`,
      instagramMetrics.recommendationToday,
    ];
  }, [
    instagramMetrics.bestObservedHourRange,
    instagramMetrics.recommendationToday,
    instagramMetrics.topContentType,
    instagramMetrics.topDishByOrders,
  ]);

  const mapProductToCampaignKey = (value) => {
    const text = String(value || "").toLowerCase();
    if (text.includes("pizza")) return "pizza";
    if (text.includes("ropa")) return "ropa vieja cubana";
    if (text.includes("sobremesa") || text.includes("doce")) return "sobremesa";
    if (text.includes("combo")) return "combo familiar";
    return "almoço";
  };

  const parseHistoryResultDate = (value) => {
    const parsed = new Date(String(value || "").replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const historyResultByCampaignId = useMemo(() => {
    const map = {};
    if (!Array.isArray(historyResults)) return map;
    for (const row of historyResults) {
      if (!row?.campaignId) continue;
      map[row.campaignId] = row;
    }
    return map;
  }, [historyResults]);

  const historyResultsList = useMemo(() => {
    if (!Array.isArray(historyResults)) return [];
    return historyResults.map((row) => ({
      ...row,
      publishedAt: row.publishedAt || "",
      channelUsed: row.channelUsed || "WhatsApp",
      productPromoted: row.productPromoted || "",
      views: Number(row.views) || 0,
      likes: Number(row.likes) || 0,
      comments: Number(row.comments) || 0,
      shares: Number(row.shares) || 0,
      saves: Number(row.saves) || 0,
      whatsappClicks: Number(row.whatsappClicks) || 0,
      ordersGenerated: Number(row.ordersGenerated) || 0,
      soldApprox: Number(row.soldApprox) || 0,
      notes: row.notes || "",
    }));
  }, [historyResults]);

  const historyResultsSummary = useMemo(() => {
    const rows = historyResultsList;
    if (!rows.length) {
      return {
        totalOrders: 0,
        totalSoldApprox: 0,
        publishedCampaigns: 0,
        bestChannel: "WhatsApp",
        bestCampaignOfWeek: "Sem dados ainda",
        topProductBySales: "Ropa vieja cubana",
        topChannelByOrders: "WhatsApp",
        bestHourObserved: "18h - 20h",
        topTextType: "direto para vender",
        recommendationNext:
          "Registre resultados no Histórico para receber recomendações mais precisas para a próxima campanha.",
        hasData: false,
      };
    }

    const totalOrders = rows.reduce((sum, row) => sum + row.ordersGenerated, 0);
    const totalSoldApprox = rows.reduce((sum, row) => sum + row.soldApprox, 0);

    const byChannel = rows.reduce((acc, row) => {
      acc[row.channelUsed] = (acc[row.channelUsed] || 0) + row.ordersGenerated;
      return acc;
    }, {});

    const byProductOrders = rows.reduce((acc, row) => {
      const key = row.productPromoted || "Produto não informado";
      acc[key] = (acc[key] || 0) + row.ordersGenerated;
      return acc;
    }, {});

    const byProductSold = rows.reduce((acc, row) => {
      const key = row.productPromoted || "Produto não informado";
      acc[key] = (acc[key] || 0) + row.soldApprox;
      return acc;
    }, {});

    const bestChannel =
      Object.entries(byChannel)
        .sort((a, b) => b[1] - a[1])
        .map(([channel]) => channel)[0] || "WhatsApp";

    const topProductBySales =
      Object.entries(byProductSold)
        .sort((a, b) => b[1] - a[1])
        .map(([product]) => product)[0] ||
      Object.entries(byProductOrders)
        .sort((a, b) => b[1] - a[1])
        .map(([product]) => product)[0] ||
      "Ropa vieja cubana";

    const hourScores = rows.reduce((acc, row) => {
      const date = parseHistoryResultDate(row.publishedAt);
      if (!date) return acc;
      const hour = date.getHours();
      if (!acc[hour]) acc[hour] = 0;
      acc[hour] += row.ordersGenerated * 5 + row.whatsappClicks * 1.5 + row.views * 0.02;
      return acc;
    }, {});

    const bestHour =
      Object.entries(hourScores)
        .sort((a, b) => b[1] - a[1])
        .map(([hour]) => Number(hour))[0] ?? 19;
    const bestHourObserved = `${String(bestHour).padStart(2, "0")}h - ${String((bestHour + 2) % 24).padStart(2, "0")}h`;

    const historyById = rows.reduce((acc, row) => {
      if (row.campaignId) acc[row.campaignId] = row;
      return acc;
    }, {});

    const textTypeScores = historyItems.reduce((acc, item) => {
      const result = historyById[item.id];
      if (!result) return acc;
      const textType = String(item.tone || "direto para vender").toLowerCase();
      const score = result.ordersGenerated * 5 + result.whatsappClicks * 2 + result.shares;
      acc[textType] = (acc[textType] || 0) + score;
      return acc;
    }, {});

    const topTextType =
      Object.entries(textTypeScores)
        .sort((a, b) => b[1] - a[1])
        .map(([textType]) => textType)[0] || "direto para vender";

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);

    const weekRows = rows.filter((row) => {
      const date = parseHistoryResultDate(row.publishedAt);
      return date && date >= weekStart && date <= now;
    });

    const rankedRows = (weekRows.length ? weekRows : rows).map((row) => {
      const campaign = historyItems.find((item) => item.id === row.campaignId);
      const score = row.ordersGenerated * 6 + row.soldApprox * 0.05 + row.whatsappClicks * 1.7 + row.shares;
      return {
        ...row,
        score,
        label: campaign?.promotionType || row.campaignLabel || "Campanha registrada",
      };
    });

    const bestCampaignOfWeek =
      rankedRows.sort((a, b) => b.score - a.score).map((row) => row.label)[0] || "Sem dados ainda";

    const recommendationNext = `Próxima campanha: foque em ${topProductBySales} no canal ${bestChannel}, entre ${bestHourObserved}, com tom ${topTextType}.`;

    return {
      totalOrders,
      totalSoldApprox,
      publishedCampaigns: rows.length,
      bestChannel,
      bestCampaignOfWeek,
      topProductBySales,
      topChannelByOrders: bestChannel,
      bestHourObserved,
      topTextType,
      recommendationNext,
      hasData: true,
    };
  }, [historyItems, historyResultsList]);

  const createHistoryRecord = (payload) => ({
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toLocaleString("pt-BR"),
    promotionType: payload.promotionType || "",
    channel: payload.channel || "",
    tone: payload.tone || "",
    whatsappText: payload.whatsappText || "",
    instagramText: payload.instagramText || "",
    facebookText: payload.facebookText || "",
    hashtags: payload.hashtags || "",
    videoScript: payload.videoScript || "",
    imagePrompt: payload.imagePrompt || "",
    isFavorite: false,
  });

  const toTwoLines = (text) => {
    const clean = String(text || "").replace(/\r/g, "").trim();
    if (!clean) return "";
    const lines = clean.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length <= 2) return lines.join("\n");
    return `${lines[0]}\n${lines[1]}`;
  };

  const getLocalDateTimeInputValue = (dateValue = new Date()) => {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const inferProductFromHistoryItem = (item) => {
    const source = `${item?.promotionType || ""} ${item?.whatsappText || ""}`.toLowerCase();
    if (source.includes("pizza")) return "pizza cubana";
    if (source.includes("ropa")) return "ropa vieja cubana";
    if (source.includes("sobremesa") || source.includes("doce")) return "sobremesa";
    if (source.includes("combo")) return "combo familiar";
    return "almoço";
  };

  const formatCurrencyBRL = (value) => {
    const numeric = Number(value) || 0;
    return numeric.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const startHistoryResultRegistration = (item) => {
    const existing = historyResultByCampaignId[item.id];
    if (existing) {
      setHistoryResultForm({
        publishedAt: existing.publishedAt || "",
        channelUsed: existing.channelUsed || "WhatsApp",
        productPromoted: existing.productPromoted || inferProductFromHistoryItem(item),
        views: String(existing.views ?? ""),
        likes: String(existing.likes ?? ""),
        comments: String(existing.comments ?? ""),
        shares: String(existing.shares ?? ""),
        saves: String(existing.saves ?? ""),
        whatsappClicks: String(existing.whatsappClicks ?? ""),
        ordersGenerated: String(existing.ordersGenerated ?? ""),
        soldApprox: String(existing.soldApprox ?? ""),
        notes: existing.notes || "",
      });
      setHistoryResultEditingId(item.id);
      return;
    }

    setHistoryResultForm({
      ...defaultHistoryResultForm,
      publishedAt: getLocalDateTimeInputValue(),
      channelUsed: historyResultChannels.includes(item.channel) ? item.channel : "WhatsApp",
      productPromoted: inferProductFromHistoryItem(item),
    });
    setHistoryResultEditingId(item.id);
  };

  const updateHistoryResultFormField = (field, value) => {
    setHistoryResultForm((current) => ({ ...current, [field]: value }));
  };

  const cancelHistoryResultRegistration = () => {
    setHistoryResultEditingId("");
    setHistoryResultForm(defaultHistoryResultForm);
  };

  const saveHistoryResultRegistration = () => {
    if (!historyResultEditingId) return;
    const campaign = historyItems.find((item) => item.id === historyResultEditingId);
    const existing = historyResultByCampaignId[historyResultEditingId];

    const record = {
      id: existing?.id || `hist-res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      campaignId: historyResultEditingId,
      campaignLabel: campaign?.promotionType || existing?.campaignLabel || "Campanha registrada",
      publishedAt: historyResultForm.publishedAt || getLocalDateTimeInputValue(),
      channelUsed: historyResultForm.channelUsed || "WhatsApp",
      productPromoted: historyResultForm.productPromoted || inferProductFromHistoryItem(campaign),
      views: Number(historyResultForm.views) || 0,
      likes: Number(historyResultForm.likes) || 0,
      comments: Number(historyResultForm.comments) || 0,
      shares: Number(historyResultForm.shares) || 0,
      saves: Number(historyResultForm.saves) || 0,
      whatsappClicks: Number(historyResultForm.whatsappClicks) || 0,
      ordersGenerated: Number(historyResultForm.ordersGenerated) || 0,
      soldApprox: Number(historyResultForm.soldApprox) || 0,
      notes: String(historyResultForm.notes || "").trim(),
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    setHistoryResults((current) => [record, ...current.filter((item) => item.campaignId !== historyResultEditingId)]);
    setHistoryResultEditingId("");
    setHistoryResultForm(defaultHistoryResultForm);
    setHistoryResultFeedback("Resultado registrado com sucesso.");
    setTimeout(() => setHistoryResultFeedback(""), 1800);
  };

  const buildQuickFallbackPack = (action) => {
    const restaurantName = settings.restaurantName || "Sabor Latino";
    const whatsapp = settings.whatsappNumber || FIXED_WHATSAPP_DISPLAY;
    const baseData = {
      hashtags: "#SaborLatino #NovaBassano #PedidoNoWhatsApp #ComidaLatina #ComidaCubana",
      ctaWhatsapp: `Chama no WhatsApp ${whatsapp} e faz seu pedido agora.`,
    };

    if (action.id === "qa1") {
      return {
        ...baseData,
        whatsappText: `Almoço quentinho saindo agora no ${restaurantName} 🍛
Quer comer bem hoje? Chama no WhatsApp ${whatsapp} e já separa seu pedido.`,
        instagramStoryText: "Almoço caseiro, quente e pronto agora.",
        facebookText: `Hora de almoço em Nova Bassano com comida bem feita no ${restaurantName}. Passe aqui ou peça no WhatsApp ${whatsapp}.`,
        imagePhrase: "Almoço de hoje saindo agora",
      };
    }

    if (action.id === "qa2") {
      return {
        ...baseData,
        whatsappText: `Pizza cubana quentinha no forno agora 🍕
Queijo puxando e sabor forte da casa. Chama no WhatsApp ${whatsapp} para pedir.`,
        instagramStoryText: "Noite de pizza cubana quentinha.",
        facebookText: `Hoje é dia de pizza cubana no ${restaurantName}, em Nova Bassano. Pedido rápido no WhatsApp ${whatsapp}.`,
        imagePhrase: "Pizza cubana quente e queijo puxando",
      };
    }

    if (action.id === "qa3") {
      return {
        ...baseData,
        whatsappText: `Hoje tem ropa vieja cubana de verdade no ${restaurantName}.
Sabor caseiro, carne desfiada no ponto e prato quentinho. Peça no WhatsApp ${whatsapp}.`,
        instagramStoryText: "Ropa vieja cubana, sabor de casa.",
        facebookText: `Nova Bassano já conhece: a ropa vieja cubana do ${restaurantName} é feita com cuidado e sabor marcante. Chama no WhatsApp ${whatsapp}.`,
        imagePhrase: "Ropa vieja cubana da casa",
      };
    }

    if (action.id === "qa4") {
      return {
        ...baseData,
        whatsappText: `Últimas unidades saindo agora no ${restaurantName} 🚨
Se você quer garantir o seu, reserve no WhatsApp ${whatsapp}.`,
        instagramStoryText: "Últimas unidades. Saindo agora.",
        facebookText: `Promoção de última hora em Nova Bassano: últimas unidades disponíveis agora. Reserve pelo WhatsApp ${whatsapp}.`,
        imagePhrase: "Últimas unidades saindo agora",
      };
    }

    if (action.id === "qa5") {
      return {
        ...baseData,
        whatsappText: `Vem pro ${restaurantName} hoje com a família.
Mesa pronta, comida cubana e latina bem servida em Nova Bassano. Chama no WhatsApp ${whatsapp}.`,
        instagramStoryText: "Hoje é dia de vir ao Sabor Latino.",
        facebookText: `Família reunida e comida boa em Nova Bassano: te esperamos no ${restaurantName}. Se preferir, peça no WhatsApp ${whatsapp}.`,
        imagePhrase: "Hoje tem mesa pronta no Sabor Latino",
      };
    }

    if (action.id === "qa6") {
      return {
        ...baseData,
        whatsappText: `Domingo é dia de almoço em família no ${restaurantName}.
Comida cubana e latina feita com carinho. Estamos abertos de terça a domingo. Reserve no WhatsApp ${whatsapp}.`,
        instagramStoryText: "Domingo de almoço cubano em família.",
        facebookText: `Domingo combina com mesa cheia no ${restaurantName}. Estamos em Nova Bassano, abertos de terça a domingo. Chama no WhatsApp ${whatsapp}.`,
        imagePhrase: "Domingo com comida cubana em família",
      };
    }

    return {
      ...baseData,
      whatsappText: toTwoLines(
        `Saindo pedido quentinho agora no ${restaurantName}.
Chama no WhatsApp ${whatsapp} e peça o seu.`
      ),
      instagramStoryText: "Chama no WhatsApp e pede agora.",
      facebookText: `Pedido rápido no ${restaurantName}, em Nova Bassano. Chama no WhatsApp ${whatsapp}.`,
      imagePhrase: "Pedido rápido pelo WhatsApp",
    };
  };

  const generateNow = (payload = builder) => {
    const pack = generatePromotionPack({
      promotionType: payload.promotionType,
      channel: payload.channel,
      tone: payload.tone,
      settings,
    });

    setBuilder(payload);
    setGenerated({
      ...pack,
      meta: {
        promotionType: payload.promotionType,
        channel: payload.channel,
        tone: payload.tone,
      },
    });
    setHistoryItems((current) => [
      createHistoryRecord({
        promotionType: payload.promotionType,
        channel: payload.channel,
        tone: payload.tone,
        whatsappText: pack.whatsappText,
        instagramText: pack.instagramText,
        facebookText: pack.facebookText,
        hashtags: pack.hashtags,
        videoScript: pack.videoScript,
        imagePrompt: "",
      }),
      ...current,
    ]);
    setActiveSection("gerador");
  };

  const generateImageNow = (payload = imageBuilder) => {
    const inspirationToUse =
      payload.useSavedInspiration === "sim"
        ? inspirations.find((item) => item.id === payload.selectedInspirationId) || null
        : null;

    const pack = generateImagePromptPack({
      product: payload.product,
      format: payload.format,
      visualStyle: payload.visualStyle,
      goal: payload.goal,
      settings,
      inspiration: inspirationToUse,
    });

    setImageBuilder(payload);
    setImageGenerated(pack);
    setHistoryItems((current) => {
      if (!current.length) {
        return [
          createHistoryRecord({
            promotionType: builder.promotionType,
            channel: builder.channel,
            tone: builder.tone,
            whatsappText: generated?.whatsappText || "",
            instagramText: generated?.instagramText || "",
            facebookText: generated?.facebookText || "",
            hashtags: generated?.hashtags || "",
            videoScript: generated?.videoScript || "",
            imagePrompt: pack.fullPrompt,
          }),
        ];
      }

      const [latest, ...rest] = current;
      return [{ ...latest, imagePrompt: pack.fullPrompt }, ...rest];
    });
  };

  const generateCampaignDayNow = async (payload = campaignDayBuilder, { forcePlanning = false } = {}) => {
    const isPlanningDay = isCampaignDayClosed || forcePlanning || payload.campaignType === "planejamento da semana";

    const basePack = isPlanningDay
      ? generateCampaignWeekPlanningPack({ settings })
      : generateCampaignDayPack({
          product: payload.product,
          objective: payload.objective,
          moment: payload.moment,
          tone: payload.tone,
          availableQuantity: payload.availableQuantity,
          deadline: payload.deadline,
          settings,
        });

    let finalPack = basePack;
    let generationMessage = isPlanningDay
      ? "Planejamento da semana gerado com sucesso!"
      : "Campanha do dia gerada com sucesso!";

    try {
      const response = await fetch("/.netlify/functions/generate-campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form: {
            product: payload.product,
            objective: isPlanningDay ? "organizar campanhas de terça a domingo" : payload.objective,
            audience: isPlanningDay ? "equipe do restaurante" : payload.objective === "atrair famílias" ? "famílias" : "clientes locais",
            moment: payload.moment,
            tone: payload.tone,
            dayOfWeek: selectedCampaignWeekDayConfig.label,
            campaignType: isPlanningDay ? "planejamento da semana" : "venda do dia",
          },
          settings: {
            restaurantName: settings.restaurantName,
            whatsappNumber: settings.whatsappNumber,
            address: settings.address,
            featuredDish: settings.featuredDish,
            openingHours: settings.openingHours,
          },
          insights: {
            dayStatus: isCampaignDayClosed ? "Fechado" : "Aberto",
            dayRecommendation: campaignDayShortRecommendation,
            weeklyPlanningTips: mondayPlanningRecommendations.join(" "),
            bestHour: basePack.recommendations?.bestPostingTime || "19h - 21h",
            bestVisualStyle: basePack.recommendations?.bestImageType || "close apetitoso com vapor",
          },
          metrics: {
            selectedWeekDayId: selectedCampaignWeekDayConfig.id,
            selectedWeekDayLabel: selectedCampaignWeekDayConfig.label,
            isClosedDay: isCampaignDayClosed,
            campaignObjective: payload.objective,
          },
        }),
      });

      const aiPayload = await response.json().catch(() => ({}));
      const requiredKeys = [
        "whatsapp",
        "instagram_feed",
        "instagram_story",
        "facebook",
        "tiktok",
        "frase_imagem",
        "prompt_imagem",
        "roteiro_video",
        "hashtags",
        "horario_sugerido",
        "cta_whatsapp",
      ];

      if (!response.ok) {
        const message =
          typeof aiPayload?.error === "string"
            ? aiPayload.error
            : "Não foi possível gerar conteúdo com IA neste momento.";
        throw new Error(message);
      }

      const validPayload = requiredKeys.every((key) => typeof aiPayload?.[key] === "string");
      if (!validPayload) {
        throw new Error("Resposta da IA fora do formato esperado.");
      }

      const safeWhatsApp = isWeakWhatsAppText(aiPayload.whatsapp) ? basePack.whatsappText : aiPayload.whatsapp;
      const safeStory = clampStoryToEightWords(aiPayload.instagram_story, basePack.instagramStoryText);
      const safeHashtags = normalizeHashtagsToFive(aiPayload.hashtags, basePack.hashtags);

      const shouldKeepPlanningFallback =
        isPlanningDay &&
        (hasDirectSalesIntent(safeWhatsApp) ||
          hasDirectSalesIntent(aiPayload.instagram_feed) ||
          hasDirectSalesIntent(aiPayload.instagram_story));

      finalPack = {
        ...basePack,
        whatsappText: shouldKeepPlanningFallback ? basePack.whatsappText : safeWhatsApp,
        statusWhatsAppText: shouldKeepPlanningFallback
          ? basePack.statusWhatsAppText
          : `${safeStory}\n${aiPayload.cta_whatsapp || basePack.finalWhatsappCall}`.trim(),
        instagramStoryText: shouldKeepPlanningFallback ? basePack.instagramStoryText : safeStory,
        instagramFeedCaption: shouldKeepPlanningFallback
          ? basePack.instagramFeedCaption
          : String(aiPayload.instagram_feed || "").trim() || basePack.instagramFeedCaption,
        facebookText: shouldKeepPlanningFallback
          ? basePack.facebookText
          : String(aiPayload.facebook || "").trim() || basePack.facebookText,
        imageShortPhrase: shouldKeepPlanningFallback
          ? basePack.imageShortPhrase
          : String(aiPayload.frase_imagem || "").trim() || basePack.imageShortPhrase,
        imagePrompt: shouldKeepPlanningFallback
          ? basePack.imagePrompt
          : String(aiPayload.prompt_imagem || "").trim() || basePack.imagePrompt,
        videoIdea: shouldKeepPlanningFallback
          ? basePack.videoIdea
          : String(aiPayload.roteiro_video || "").trim() || basePack.videoIdea,
        hashtags: shouldKeepPlanningFallback ? basePack.hashtags : safeHashtags,
        finalWhatsappCall: shouldKeepPlanningFallback
          ? basePack.finalWhatsappCall
          : String(aiPayload.cta_whatsapp || "").trim() || basePack.finalWhatsappCall,
        recommendations: {
          ...basePack.recommendations,
          bestPostingTime:
            String(aiPayload.horario_sugerido || "").trim() || basePack.recommendations?.bestPostingTime || "19h - 21h",
        },
      };

      generationMessage = isPlanningDay
        ? "Planejamento da semana gerado com IA com sucesso!"
        : "Campanha do dia gerada com IA com sucesso!";
    } catch (error) {
      console.warn("Falha ao gerar campanha do dia com IA, usando fallback local:", error);
      generationMessage = isPlanningDay
        ? "Planejamento da semana gerado com fallback local."
        : "Campanha do dia gerada com fallback local.";
    }

    setCampaignDayBuilder(payload);
    setCampaignDayGenerated(finalPack);

    const now = new Date();
    const formattedDate = now.toLocaleString("pt-BR");
    const fullCampaignText = campaignDayOutputFields
      .map((field) => `${field.title}\n${finalPack[field.key] || ""}`)
      .join("\n\n------------------------------\n\n");

    const weeklyRecord = {
      id: `campaign-day-${selectedCampaignWeekDayConfig.id}-${now.getTime()}`,
      weekDayId: selectedCampaignWeekDayConfig.id,
      weekDayLabel: selectedCampaignWeekDayConfig.label,
      generatedAt: formattedDate,
      dateISO: now.toISOString(),
      date: now.toLocaleDateString("pt-BR"),
      dayStatus: isCampaignDayClosed ? "Fechado" : "Aberto",
      campaignType: isPlanningDay ? "Planejamento da semana" : "Venda do dia",
      product: payload.product,
      objective: isPlanningDay ? "organizar campanhas de terça a domingo" : payload.objective,
      moment: payload.moment,
      tone: payload.tone,
      whatsappText: finalPack.whatsappText,
      instagramText: finalPack.instagramFeedCaption,
      imagePhrase: finalPack.imageShortPhrase,
      imagePrompt: finalPack.imagePrompt,
      videoScript: finalPack.videoIdea,
      hashtags: finalPack.hashtags,
      suggestedTime: finalPack.recommendations?.bestPostingTime || "",
      fullCampaignText,
      pack: finalPack,
      stateOfDay: isCampaignDayClosed ? "Fechado" : "Aberto",
      channelContext: selectedCampaignWeekDayConfig.label,
    };

    const updatedExistingDay = campaignDayWeeklyHistory.some(
      (item) => item.weekDayId === selectedCampaignWeekDayConfig.id
    );
    setCampaignDayWeeklyHistory((current) => {
      const filtered = current.filter((item) => item.weekDayId !== selectedCampaignWeekDayConfig.id);
      return [weeklyRecord, ...filtered];
    });
    setCampaignDayViewedRecord(weeklyRecord);

    setHistoryItems((current) => [
      createHistoryRecord({
        promotionType: isPlanningDay ? "Planejamento da Semana" : `Campanha do Dia: ${payload.product}`,
        channel: payload.objective,
        tone: payload.tone,
        whatsappText: finalPack.whatsappText,
        instagramText: finalPack.instagramFeedCaption,
        facebookText: finalPack.facebookText,
        hashtags: finalPack.hashtags,
        videoScript: finalPack.videoIdea,
        imagePrompt: finalPack.imagePrompt,
      }),
      ...current,
    ]);

    const updateMessage = updatedExistingDay ? "Campanha atualizada para este dia." : generationMessage;
    setCampaignDayFeedback(updateMessage);
    setTimeout(() => setCampaignDayFeedback(""), 2400);
  };

  const isWeakWhatsAppText = (value) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) return true;

    const compact = text.replace(/\s+/g, "");
    if (/^[+()\d.\-]+$/.test(compact)) return true;

    const words = text.split(/\s+/).filter(Boolean);
    const hasSalesVerb = /(pe[çc]a|chame|mande|fale|garanta|aproveite|reserve|chama|pedir)/i.test(text);
    const hasPhone = /\d{8,}/.test(text);

    if (words.length < 8) return true;
    if (hasPhone && !hasSalesVerb) return true;
    return false;
  };

  const hasDirectSalesIntent = (value) => {
    const text = String(value || "").toLowerCase();
    return /(pe[çc]a|pedido|compre|garanta|últimas unidades|venha hoje)/i.test(text);
  };

  const clampStoryToEightWords = (value, fallback) => {
    const source = String(value || fallback || "").replace(/\s+/g, " ").trim();
    if (!source) return String(fallback || "").trim();
    const words = source.split(" ").filter(Boolean);
    if (words.length <= 8) return source;
    return words.slice(0, 8).join(" ").replace(/[.,;:!?]+$/g, "");
  };

  const normalizeHashtagsToFive = (value, fallback) => {
    const source = String(value || "").trim();
    const fallbackSource = String(fallback || "").trim();
    const extract = (text) => {
      const tags = text.match(/#[A-Za-zÀ-ÿ0-9_]+/g) || [];
      const unique = [];
      const seen = new Set();
      for (const tag of tags) {
        const key = tag.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(tag);
      }
      return unique;
    };

    let tags = extract(source);
    if (!tags.length) tags = extract(fallbackSource);
    if (!tags.some((tag) => tag.toLowerCase() === "#saborlatino")) tags.unshift("#SaborLatino");
    if (!tags.some((tag) => tag.toLowerCase() === "#novabassano")) tags.splice(1, 0, "#NovaBassano");

    const uniqueFinal = [];
    const seenFinal = new Set();
    for (const tag of tags) {
      const normalized = tag.startsWith("#") ? tag : `#${tag}`;
      const key = normalized.toLowerCase();
      if (seenFinal.has(key)) continue;
      seenFinal.add(key);
      uniqueFinal.push(normalized);
    }
    return uniqueFinal.slice(0, 5).join(" ");
  };

  const generateIntelligentCampaignNow = async (payload = intelligentCampaignBuilder) => {
    setIntelligentCampaignLoading(true);
    try {
      const instagramBaseInsights = buildManualInstagramInsights({
        instagramMetrics,
        selectedProduct: payload.product,
        channel: payload.mainChannel,
        moment: payload.moment,
      });

      const historyInsights = historyResultsSummary.hasData
        ? {
            source: "manual",
            topProduct: mapProductToCampaignKey(historyResultsSummary.topProductBySales),
            bestFormat: channelFormatSuggestion[historyResultsSummary.topChannelByOrders] || instagramBaseInsights.bestFormat,
            bestHour: historyResultsSummary.bestHourObserved || instagramBaseInsights.bestHour,
            bestVisualStyle:
              productVisualSuggestion[mapProductToCampaignKey(historyResultsSummary.topProductBySales)] ||
              instagramBaseInsights.bestVisualStyle,
          }
        : null;

      const manualInsights = historyInsights || instagramBaseInsights;

      let localPack = generateIntelligentCampaignPack({
        product: payload.product,
        objective: payload.objective,
        audience: payload.audience,
        moment: payload.moment,
        mainChannel: payload.mainChannel,
        tone: payload.tone,
        settings,
        instagramInsights: manualInsights,
      });

      if (historyResultsSummary.hasData) {
        localPack = {
          ...localPack,
          recommendationSourceNotice:
            "Recomendação baseada em resultados manuais do Histórico e desempenho real das campanhas.",
        };
      }

      let finalPack = localPack;
      let feedbackMessage = "Campanha inteligente gerada com sucesso!";

      try {
        const serverResponse = await fetch("/.netlify/functions/generate-campaign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            form: payload,
            settings: {
              restaurantName: settings.restaurantName,
              whatsappNumber: settings.whatsappNumber,
              address: settings.address,
              featuredDish: settings.featuredDish,
              openingHours: settings.openingHours,
            },
            insights: manualInsights,
            metrics: {
              analyzedCount: instagramMetrics.analyzedCount,
              topContentType: instagramMetrics.topContentType,
              topDishByOrders: instagramMetrics.topDishByOrders,
              bestObservedHourRange: instagramMetrics.bestObservedHourRange,
              recommendationToday: instagramMetrics.recommendationToday,
              historyResultsCount: historyResultsSummary.publishedCampaigns,
              historyTopProduct: historyResultsSummary.topProductBySales,
              historyTopChannel: historyResultsSummary.topChannelByOrders,
              historyBestHour: historyResultsSummary.bestHourObserved,
              historyTopTextType: historyResultsSummary.topTextType,
              historyRecommendation: historyResultsSummary.recommendationNext,
            },
          }),
        });

        const aiPayload = await serverResponse.json().catch(() => ({}));
        const requiredAiKeys = [
          "whatsapp",
          "instagram_feed",
          "instagram_story",
          "facebook",
          "tiktok",
          "frase_imagem",
          "prompt_imagem",
          "roteiro_video",
          "hashtags",
          "horario_sugerido",
          "cta_whatsapp",
        ];

        if (!serverResponse.ok) {
          const message =
            typeof aiPayload?.error === "string"
              ? aiPayload.error
              : "Não foi possível gerar conteúdo com IA neste momento.";
          throw new Error(message);
        }

        const validAiPayload = requiredAiKeys.every((key) => typeof aiPayload?.[key] === "string");
        if (!validAiPayload) {
          throw new Error("Resposta da IA veio fora do formato esperado.");
        }

        const aiWhatsAppText = String(aiPayload.whatsapp || "").trim();
        const finalWhatsAppText = isWeakWhatsAppText(aiWhatsAppText) ? localPack.whatsappText : aiWhatsAppText;
        const finalInstagramStory = clampStoryToEightWords(aiPayload.instagram_story, localPack.instagramStoryText);
        const finalHashtags = normalizeHashtagsToFive(aiPayload.hashtags, localPack.hashtags);
        const safeInstagramFeed = String(aiPayload.instagram_feed || "").trim() || localPack.instagramFeedCaption;
        const safeFacebook = String(aiPayload.facebook || "").trim() || localPack.facebookText;
        const safeTikTok = String(aiPayload.tiktok || "").trim() || localPack.tiktokText;
        const safeImpactPhrase = String(aiPayload.frase_imagem || "").trim() || localPack.imageImpactPhrase;
        const safePromptImage = String(aiPayload.prompt_imagem || "").trim() || localPack.imagePrompt;
        const safeVideoScript = String(aiPayload.roteiro_video || "").trim() || localPack.videoScript;
        const safeBestHour = String(aiPayload.horario_sugerido || "").trim() || localPack.bestTimeSuggested;
        const safeCta = String(aiPayload.cta_whatsapp || "").trim() || localPack.finalWhatsAppCTA;

        finalPack = {
          ...localPack,
          strategyRecommended: `${localPack.strategyRecommended}\nConteúdo textual otimizado por IA para ampliar conversão agora.`,
          whatsappText: finalWhatsAppText,
          instagramStoryText: finalInstagramStory,
          instagramFeedCaption: safeInstagramFeed,
          facebookText: safeFacebook,
          tiktokText: safeTikTok,
          imageImpactPhrase: safeImpactPhrase,
          imagePrompt: safePromptImage,
          videoScript: safeVideoScript,
          hashtags: finalHashtags,
          bestTimeSuggested: safeBestHour,
          finalWhatsAppCTA: safeCta,
          recommendationSourceNotice: `${localPack.recommendationSourceNotice} Conteúdo gerado por IA via Netlify Functions.`,
        };
        feedbackMessage =
          finalWhatsAppText === aiWhatsAppText
            ? "Campanha inteligente gerada com IA com sucesso!"
            : "Campanha gerada com IA. O texto de WhatsApp foi reforçado automaticamente para manter alta conversão.";
      } catch (error) {
        const details = error instanceof Error ? error.message : "Falha ao gerar com IA.";
        console.warn("Falha na geração inteligente via IA:", details);
        feedbackMessage = "IA indisponível no momento. Usamos o gerador local como respaldo para você continuar vendendo.";
      }

      setIntelligentCampaignBuilder(payload);
      setIntelligentCampaignGenerated(finalPack);
      setHistoryItems((current) => [
        createHistoryRecord({
          promotionType: `Campanha Inteligente: ${payload.product}`,
          channel: payload.mainChannel,
          tone: payload.tone,
          whatsappText: finalPack.whatsappText,
          instagramText: finalPack.instagramFeedCaption,
          facebookText: finalPack.facebookText,
          hashtags: finalPack.hashtags,
          videoScript: finalPack.videoScript,
          imagePrompt: finalPack.imagePrompt,
        }),
        ...current,
      ]);
      setIntelligentCampaignFeedback(feedbackMessage);
      setTimeout(() => setIntelligentCampaignFeedback(""), 1800);
    } finally {
      setIntelligentCampaignLoading(false);
    }
  };

  const runQuickAction = async (action) => {
    setQuickLoading(true);
    setQuickFeedback("Gerando promoção...");
    setQuickGenerated(null);

    const config = quickActionConfigs[action.id] || quickActionConfigs.qa1;
    const fallbackPack = buildQuickFallbackPack(action);
    const shouldUseTwoLineStatus = action.id === "qa7";

    let finalPack = fallbackPack;
    let usedFallback = false;
    let timeoutId;

    const applyStatusRule = (textValue) => {
      const clean = String(textValue || "").trim();
      if (!shouldUseTwoLineStatus) return clean;
      return toTwoLines(clean);
    };

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch("/.netlify/functions/generate-campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          form: {
            product: config.product,
            objective: config.objective,
            audience: config.audience,
            moment: config.moment,
            tone: config.tone,
            mainChannel: config.mainChannel,
            quickAction: action.label,
          },
          settings: {
            restaurantName: settings.restaurantName,
            whatsappNumber: settings.whatsappNumber,
            address: settings.address,
            featuredDish: settings.featuredDish,
            openingHours: settings.openingHours,
          },
          insights: {
            quickActionId: action.id,
            quickActionLabel: action.label,
            recommendation: config.instruction,
            weeklyContext:
              "Sabor Latino abre de terça a domingo e fica fechado às segundas-feiras.",
          },
        }),
      });

      const aiPayload = await response.json().catch(() => ({}));
      const requiredKeys = [
        "whatsapp",
        "instagram_feed",
        "instagram_story",
        "facebook",
        "tiktok",
        "frase_imagem",
        "prompt_imagem",
        "roteiro_video",
        "hashtags",
        "horario_sugerido",
        "cta_whatsapp",
      ];

      if (!response.ok) {
        const message =
          typeof aiPayload?.error === "string"
            ? aiPayload.error
            : "Não foi possível gerar a promoção com IA.";
        throw new Error(message);
      }

      const validPayload = requiredKeys.every((key) => typeof aiPayload?.[key] === "string");
      if (!validPayload) {
        throw new Error("Resposta da IA fora do formato esperado.");
      }

      const safeWhatsApp = isWeakWhatsAppText(aiPayload.whatsapp)
        ? fallbackPack.whatsappText
        : String(aiPayload.whatsapp || "").trim();
      const safeStory = applyStatusRule(
        shouldUseTwoLineStatus
          ? String(aiPayload.instagram_story || "").trim()
          : clampStoryToEightWords(aiPayload.instagram_story, fallbackPack.instagramStoryText)
      );

      finalPack = {
        whatsappText: safeWhatsApp,
        instagramStoryText: safeStory || fallbackPack.instagramStoryText,
        facebookText: String(aiPayload.facebook || "").trim() || fallbackPack.facebookText,
        imagePhrase: String(aiPayload.frase_imagem || "").trim() || fallbackPack.imagePhrase,
        hashtags: normalizeHashtagsToFive(aiPayload.hashtags, fallbackPack.hashtags),
        ctaWhatsapp: String(aiPayload.cta_whatsapp || "").trim() || fallbackPack.ctaWhatsapp,
      };
    } catch (error) {
      usedFallback = true;
      finalPack = fallbackPack;
      console.warn("Falha na geração de promoção rápida com IA:", error);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setQuickLoading(false);
    }

    setQuickGenerated({
      ...finalPack,
      actionId: action.id,
      actionLabel: action.label,
      createdAt: new Date().toLocaleString("pt-BR"),
    });

    setHistoryItems((current) => [
      createHistoryRecord({
        promotionType: `Rápida: ${action.label}`,
        channel: action.channel,
        tone: action.tone,
        whatsappText: finalPack.whatsappText,
        instagramText: finalPack.instagramStoryText,
        facebookText: finalPack.facebookText,
        hashtags: finalPack.hashtags,
        videoScript: "",
        imagePrompt: "",
      }),
      ...current,
    ]);

    setQuickFeedback(
      usedFallback
        ? "Não foi possível usar IA agora. Geramos uma versão rápida para você."
        : "Promoção gerada com IA com sucesso!"
    );
  };

  const copyText = async (key, value) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const helperInput = document.createElement("textarea");
        helperInput.value = value;
        document.body.appendChild(helperInput);
        helperInput.select();
        document.execCommand("copy");
        document.body.removeChild(helperInput);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 1400);
    } catch (error) {
      console.error("Erro ao copiar texto:", error);
    }
  };

  const buildAllTexts = (content) => {
    return outputFields
      .map((field) => `${field.title}\n${content[field.key]}`)
      .join("\n\n------------------------------\n\n");
  };

  const buildAllQuickTexts = (content) => {
    return quickOutputFields
      .map((field) => `${field.title}\n${content[field.key] || ""}`)
      .join("\n\n------------------------------\n\n");
  };

  const buildAllImageTexts = (content) => {
    return imageOutputFields
      .map((field) => `${field.title}\n${content[field.key]}`)
      .join("\n\n------------------------------\n\n");
  };

  const buildAllInspirationAdaptationTexts = (content) => {
    return inspirationAdaptationOutputFields
      .map((field) => `${field.title}\n${content[field.key] || ""}`)
      .join("\n\n------------------------------\n\n");
  };

  const buildAllCampaignDayTexts = (content) => {
    return campaignDayOutputFields
      .map((field) => `${field.title}\n${content[field.key] || ""}`)
      .join("\n\n------------------------------\n\n");
  };

  const buildAllIntelligentCampaignTexts = (content) => {
    return intelligentCampaignOutputFields
      .map((field) => `${field.title}\n${content[field.key] || ""}`)
      .join("\n\n------------------------------\n\n");
  };

  const copyAllTexts = () => {
    if (!generated) return;
    copyText("all_texts", buildAllTexts(generated));
  };

  const copyFavoriteWhatsApp = (favorite) => {
    copyText(`favorite_whatsapp_${favorite.id}`, favorite.content.whatsappText || "");
  };

  const copyFavoriteInstagram = (favorite) => {
    copyText(`favorite_instagram_${favorite.id}`, favorite.content.instagramText || "");
  };

  const copyFavoriteAll = (favorite) => {
    copyText(`favorite_all_${favorite.id}`, buildAllTexts(favorite.content));
  };

  const copyAllImageTexts = async () => {
    if (!imageGenerated) return;
    await copyText("all_images", buildAllImageTexts(imageGenerated));
    setImageCopyFeedback("Conteúdo copiado com sucesso!");
    setTimeout(() => setImageCopyFeedback(""), 1800);
  };

  const copyAllInspirationAdaptationTexts = () => {
    if (!inspirationAdaptation) return;
    copyText("all_inspiration_adaptation", buildAllInspirationAdaptationTexts(inspirationAdaptation));
  };

  const copyAllCampaignDayTexts = () => {
    if (!campaignDayGenerated) return;
    copyText("all_campaign_day", buildAllCampaignDayTexts(campaignDayGenerated));
  };

  const copyAllQuickTexts = () => {
    if (!quickGenerated) return;
    copyText("all_quick_texts", buildAllQuickTexts(quickGenerated));
  };

  const copyAllIntelligentCampaignTexts = () => {
    if (!intelligentCampaignGenerated) return;
    copyText("all_intelligent_campaign", buildAllIntelligentCampaignTexts(intelligentCampaignGenerated));
  };

  const openWhatsAppWithGenerated = () => {
    if (!generated) return;
    window.open(buildFixedWhatsAppLink(generated.whatsappText), "_blank", "noreferrer");
  };

  const openWhatsAppWithIntelligentCampaign = () => {
    if (!intelligentCampaignGenerated) return;
    window.open(buildFixedWhatsAppLink(intelligentCampaignGenerated.whatsappText), "_blank", "noreferrer");
  };

  const openWhatsAppWithQuickGenerated = () => {
    if (!quickGenerated) return;
    const message = `${quickGenerated.whatsappText}\n${quickGenerated.ctaWhatsapp || ""}`.trim();
    window.open(buildWhatsAppLink(settings.whatsappNumber, message), "_blank", "noreferrer");
  };

  const openWhatsAppWithInspirationAdaptation = () => {
    if (!inspirationAdaptation) return;
    const message = `${inspirationAdaptation.whatsapp}\n${inspirationAdaptation.cta_whatsapp || ""}`.trim();
    window.open(buildWhatsAppLink(settings.whatsappNumber, message), "_blank", "noreferrer");
  };

  const saveGeneratedAsFavorite = () => {
    if (!generated) return;

    const favorite = {
      id: `fav-${Date.now()}`,
      createdAt: new Date().toLocaleString("pt-BR"),
      meta: generated.meta,
      content: generated,
    };

    setFavoritePromotions((current) => [favorite, ...current]);
    setFavoriteFeedback("Promoção favorita salva.");
    setTimeout(() => setFavoriteFeedback(""), 1500);
  };

  const saveIntelligentCampaignAsFavorite = () => {
    if (!intelligentCampaignGenerated) return;

    const favorite = {
      id: `fav-intelligent-${Date.now()}`,
      createdAt: new Date().toLocaleString("pt-BR"),
      meta: {
        promotionType: `Campanha Inteligente: ${intelligentCampaignBuilder.product}`,
        channel: intelligentCampaignBuilder.mainChannel,
        tone: intelligentCampaignBuilder.tone,
      },
      content: {
        whatsappText: intelligentCampaignGenerated.whatsappText,
        instagramText: intelligentCampaignGenerated.instagramFeedCaption,
        facebookText: intelligentCampaignGenerated.facebookText,
        storyShortText: intelligentCampaignGenerated.instagramStoryText,
        videoOverlay: intelligentCampaignGenerated.imageImpactPhrase,
        videoScript: intelligentCampaignGenerated.videoScript,
        hashtags: intelligentCampaignGenerated.hashtags,
      },
    };

    setFavoritePromotions((current) => [favorite, ...current]);
    setFavoriteFeedback("Campanha inteligente salva como favorita.");
    setTimeout(() => setFavoriteFeedback(""), 1500);
  };

  const deleteFavorite = (favoriteId) => {
    setFavoritePromotions((current) => current.filter((item) => item.id !== favoriteId));
    if (favoriteId.startsWith("hist-fav-")) {
      const historyId = favoriteId.replace("hist-fav-", "");
      setHistoryItems((current) =>
        current.map((item) =>
          item.id === historyId
            ? {
                ...item,
                isFavorite: false,
              }
            : item
        )
      );
    }
  };

  const buildHistoryCopy = (item) => {
    const result = historyResultByCampaignId[item.id];
    const resultBlock = result
      ? [
          "",
          "Resultado registrado:",
          `Data da publicação: ${result.publishedAt ? formatInstagramPostDate(result.publishedAt) : "não informada"}`,
          `Canal usado: ${result.channelUsed || "não informado"}`,
          `Produto promovido: ${result.productPromoted || "não informado"}`,
          `Visualizações: ${Number(result.views) || 0}`,
          `Curtidas: ${Number(result.likes) || 0}`,
          `Comentários: ${Number(result.comments) || 0}`,
          `Compartilhamentos: ${Number(result.shares) || 0}`,
          `Salvamentos: ${Number(result.saves) || 0}`,
          `Cliques no WhatsApp: ${Number(result.whatsappClicks) || 0}`,
          `Pedidos gerados: ${Number(result.ordersGenerated) || 0}`,
          `Valor vendido aproximado: ${formatCurrencyBRL(result.soldApprox)}`,
          `Observações: ${result.notes || "sem observações"}`,
        ]
      : ["", "Resultado registrado: ainda não informado."];

    return [
      `Data e hora: ${item.createdAt}`,
      `Tipo de promoção: ${item.promotionType}`,
      `Canal: ${item.channel}`,
      `Tom: ${item.tone}`,
      "",
      "Texto WhatsApp:",
      item.whatsappText,
      "",
      "Texto Instagram:",
      item.instagramText,
      "",
      "Texto Facebook:",
      item.facebookText,
      "",
      "Hashtags:",
      item.hashtags,
      "",
      "Roteiro de vídeo:",
      item.videoScript,
      "",
      "Prompt de imagem:",
      item.imagePrompt || "Não gerado",
      ...resultBlock,
    ].join("\n");
  };

  const copyHistoryItem = async (item) => {
    await copyText(`history_${item.id}`, buildHistoryCopy(item));
  };

  const deleteHistoryItem = (historyId) => {
    setHistoryItems((current) => current.filter((item) => item.id !== historyId));
    setHistoryResults((current) => current.filter((item) => item.campaignId !== historyId));
    if (historyResultEditingId === historyId) {
      cancelHistoryResultRegistration();
    }
  };

  const toggleHistoryFavorite = (historyId) => {
    const historyItem = historyItems.find((item) => item.id === historyId);
    if (historyItem) {
      const favoriteFromHistory = {
        id: `hist-fav-${historyItem.id}`,
        createdAt: historyItem.createdAt,
        meta: {
          promotionType: historyItem.promotionType || "Promoção",
          channel: historyItem.channel || "Todos",
          tone: historyItem.tone || "Direto para vender",
        },
        content: {
          whatsappText: historyItem.whatsappText || "",
          instagramText: historyItem.instagramText || "",
          facebookText: historyItem.facebookText || "",
          storyShortText: "",
          videoOverlay: "",
          videoScript: historyItem.videoScript || "",
          hashtags: historyItem.hashtags || "",
        },
      };

      setFavoritePromotions((current) => {
        const alreadyExists = current.some((favorite) => favorite.id === favoriteFromHistory.id);
        if (alreadyExists) {
          return current.filter((favorite) => favorite.id !== favoriteFromHistory.id);
        }
        return [favoriteFromHistory, ...current];
      });
    }

    setHistoryItems((current) =>
      current.map((item) =>
        item.id === historyId
          ? {
              ...item,
              isFavorite: !item.isFavorite,
            }
          : item
      )
    );
  };

  const updateBuilderField = (field, value) => {
    setBuilder((current) => ({ ...current, [field]: value }));
  };

  const handleSelectCampaignWeekDay = (weekDayId) => {
    setCampaignDaySelectedWeekDay(weekDayId);
    setCampaignDayViewedRecord(latestCampaignByWeekDay[weekDayId] || null);
  };

  const handleViewSavedCampaign = (weekDayId) => {
    const savedCampaign = latestCampaignByWeekDay[weekDayId];
    if (!savedCampaign) return;

    setCampaignDayViewedRecord(savedCampaign);
    setCampaignDayFeedback(`Última campanha de ${savedCampaign.weekDayLabel} carregada.`);
    setTimeout(() => setCampaignDayFeedback(""), 1800);
  };

  const updateCampaignDayBuilderField = (field, value) => {
    setCampaignDayBuilder((current) => {
      const next = { ...current, [field]: value };

      if (field === "campaignType" && value === "planejamento da semana") {
        next.objective = "organizar campanhas de terça a domingo";
        next.moment = "manhã";
        next.tone = "caseiro";
      }

      if (field === "moment" && campaignDaySelectedWeekDay === "sexta") {
        const fridayDefaults = getCampaignDayDefaultsByWeekDay("sexta", value);
        next.product = fridayDefaults.product;
        next.moment = fridayDefaults.moment;
        next.tone = fridayDefaults.tone;
        next.objective = fridayDefaults.objective;
      }

      return next;
    });
  };

  const updateIntelligentCampaignBuilderField = (field, value) => {
    setIntelligentCampaignBuilder((current) => ({ ...current, [field]: value }));
  };

  const updateImageBuilderField = (field, value) => {
    setImageBuilder((current) => {
      const next = { ...current, [field]: value };
      if (field === "useSavedInspiration" && value === "nao") {
        next.selectedInspirationId = "";
      }
      return next;
    });
  };

  const updateInspirationField = (field, value) => {
    setInspirationForm((current) => ({ ...current, [field]: value }));
  };

  const inferImageProductFromInspiration = (inspiration) => {
    const text = `${inspiration?.niche || ""} ${inspiration?.visualElement || ""}`.toLowerCase();
    if (text.includes("pizza")) return "Pizza cubana";
    if (text.includes("cubana")) return "Ropa vieja cubana";
    if (text.includes("sobremesa")) return "Sobremesa";
    if (text.includes("bebida")) return "Bebida";
    if (text.includes("restaurante cheio")) return "Restaurante cheio";
    if (text.includes("pessoa comendo")) return "Pessoas comendo felizes";
    if (text.includes("familiar")) return "Combo familiar";
    return "Almoço latino";
  };

  const inferImageFormatFromInspiration = (inspiration) => {
    const platform = String(inspiration?.platform || "").toLowerCase();
    const contentType = String(inspiration?.contentType || "").toLowerCase();
    if (platform.includes("tiktok") || contentType.includes("reel") || contentType.includes("story")) {
      return "Instagram Story 9:16";
    }
    if (platform.includes("facebook")) return "Facebook Post";
    if (contentType.includes("feed") || contentType.includes("foto")) return "Instagram Feed 4:5";
    return "Instagram Story 9:16";
  };

  const inferImageStyleFromInspiration = (inspiration) => {
    const text = `${inspiration?.visualElement || ""} ${inspiration?.whyWorked || ""}`.toLowerCase();
    if (text.includes("vapor")) return "Comida quente com vapor";
    if (text.includes("queijo") || text.includes("close")) return "Hiper-realista";
    if (text.includes("restaurante cheio") || text.includes("pessoa comendo")) return "Familiar";
    if (text.includes("viral")) return "Viral";
    if (text.includes("elegante")) return "Elegante e profissional";
    return "Caseiro e acolhedor";
  };

  const inferImageGoalFromInspiration = (inspiration) => {
    const text = `${inspiration?.niche || ""} ${inspiration?.adaptationIdea || ""}`.toLowerCase();
    if (text.includes("pizza")) return "Promover pizza";
    if (text.includes("cubana")) return "Promover comida cubana";
    if (text.includes("restaurante")) return "Atrair clientes para o restaurante";
    if (text.includes("prato do dia")) return "Promover prato do dia";
    if (text.includes("vender")) return "Vender rápido";
    return "Dar fome";
  };

  const applyInspirationToImageBuilder = (inspiration) => {
    setImageBuilder((current) => ({
      ...current,
      product: inferImageProductFromInspiration(inspiration),
      format: inferImageFormatFromInspiration(inspiration),
      visualStyle: inferImageStyleFromInspiration(inspiration),
      goal: inferImageGoalFromInspiration(inspiration),
      useSavedInspiration: "sim",
      selectedInspirationId: inspiration.id || "",
    }));
  };

  const buildInspirationFromForm = () => ({
    id: `insp-form-${Date.now()}`,
    createdAt: new Date().toLocaleString("pt-BR"),
    link: inspirationForm.link,
    platform: inspirationForm.platform,
    contentType: inspirationForm.contentType,
    niche: inspirationForm.niche,
    visualElement: inspirationForm.visualElement,
    metrics: {
      views: Number(inspirationForm.views) || 0,
      likes: Number(inspirationForm.likes) || 0,
      comments: Number(inspirationForm.comments) || 0,
      shares: Number(inspirationForm.shares) || 0,
      saves: Number(inspirationForm.saves) || 0,
    },
    whyWorked: inspirationForm.whyWorked,
    adaptationIdea: inspirationForm.adaptationIdea,
  });

  const buildInspirationAdaptationFallback = (inspiration) => {
    const whatsapp = settings.whatsappNumber || FIXED_WHATSAPP_DISPLAY;
    const product = inferImageProductFromInspiration(inspiration);
    const platform = inspiration?.platform || "Instagram";
    const visualElement = inspiration?.visualElement || "close-up";

    return {
      gancho: `Nova Bassano, olha isso saindo quente agora.`,
      texto_plataforma: `${platform}: ${product} com foco em ${visualElement}. Mostre o prato em 2 segundos e finalize com convite para pedir no WhatsApp.`,
      whatsapp: `Hoje no Sabor Latino tem ${product} saindo quentinho. Me chama no WhatsApp ${whatsapp} para pedir agora.`,
      frase_imagem: `${product} quente, pedido no WhatsApp.`,
      prompt_imagem: `Imagem publicitária original de ${product}, comida cubana/latina, close apetitoso, vapor visível, luz quente, mesa de restaurante familiar, Nova Bassano, composição limpa, sem texto na imagem, sem marca d'água, sem copiar imagens de terceiros.`,
      roteiro_video: `Cena 1 (0-2s): close forte do ${product} com ${visualElement}. Cena 2 (2-6s): mostrar textura e vapor. Cena 3 (6-8s): CTA curto para pedir no WhatsApp ${whatsapp}.`,
      hashtags: "#SaborLatino #NovaBassano #ComidaCubana #ComidaLatina #PedidoNoWhatsApp",
      recomendacao_adaptacao:
        "Use apenas a estrutura da inspiração (gancho, ritmo e elemento visual), mas grave cena e texto totalmente originais do Sabor Latino.",
      cta_whatsapp: `Chame no WhatsApp ${whatsapp} e faça seu pedido agora.`,
    };
  };

  const normalizeInspirationAdaptationPayload = (payload, fallback) => {
    const requiredKeys = [
      "gancho",
      "texto_plataforma",
      "whatsapp",
      "frase_imagem",
      "prompt_imagem",
      "roteiro_video",
      "hashtags",
      "recomendacao_adaptacao",
      "cta_whatsapp",
    ];

    const normalized = {};
    for (const key of requiredKeys) {
      const value = typeof payload?.[key] === "string" ? payload[key].trim() : "";
      normalized[key] = value || fallback[key];
    }
    return normalized;
  };

  const adaptInspirationWithAI = async (inspiration, loadingMessage) => {
    setInspirationAdaptationLoading(true);
    setInspirationAdaptationFeedback(loadingMessage);
    const fallback = buildInspirationAdaptationFallback(inspiration);

    let finalAdaptation = fallback;
    let usedFallback = false;
    let timeoutId;

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch("/.netlify/functions/adapt-inspiration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          inspiration,
          settings: {
            restaurantName: settings.restaurantName,
            whatsappNumber: settings.whatsappNumber,
            address: settings.address,
            featuredDish: settings.featuredDish,
            openingHours: settings.openingHours,
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Falha ao adaptar inspiração.");
      }

      finalAdaptation = normalizeInspirationAdaptationPayload(payload, fallback);
    } catch (error) {
      usedFallback = true;
      finalAdaptation = fallback;
      console.warn("Falha ao adaptar inspiração com IA:", error);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setInspirationAdaptationLoading(false);
    }

    setInspirationAdaptation({
      ...finalAdaptation,
      inspirationId: inspiration.id || "",
      generatedAt: new Date().toLocaleString("pt-BR"),
    });
    setInspirationAdaptationFeedback(
      usedFallback
        ? "Não foi possível usar IA agora. Criamos uma adaptação rápida para você."
        : "Adaptação criada com sucesso para o Sabor Latino."
    );
  };

  const adaptCurrentInspirationForm = async () => {
    const draftInspiration = buildInspirationFromForm();
    if (!draftInspiration.link.trim()) {
      setInspirationAdaptationFeedback("Informe o link da publicação antes de adaptar.");
      setTimeout(() => setInspirationAdaptationFeedback(""), 2200);
      return;
    }
    await adaptInspirationWithAI(draftInspiration, "Adaptando para Sabor Latino...");
  };

  const adaptSavedInspiration = async (inspiration) => {
    setInspirationForm({
      link: inspiration.link || "",
      platform: inspiration.platform || "Instagram",
      contentType: inspiration.contentType || "Reel",
      niche: inspiration.niche || "comida latina",
      visualElement: inspiration.visualElement || "close-up",
      views: String(inspiration.metrics?.views || ""),
      likes: String(inspiration.metrics?.likes || ""),
      comments: String(inspiration.metrics?.comments || ""),
      shares: String(inspiration.metrics?.shares || ""),
      saves: String(inspiration.metrics?.saves || ""),
      whyWorked: inspiration.whyWorked || "",
      adaptationIdea: inspiration.adaptationIdea || "",
    });
    await adaptInspirationWithAI(inspiration, "Adaptando inspiração para Sabor Latino...");
  };

  const saveInspiration = (event) => {
    event.preventDefault();

    const newInspiration = {
      id: `insp-${Date.now()}`,
      createdAt: new Date().toLocaleString("pt-BR"),
      link: inspirationForm.link,
      platform: inspirationForm.platform,
      contentType: inspirationForm.contentType,
      niche: inspirationForm.niche,
      visualElement: inspirationForm.visualElement,
      metrics: {
        views: Number(inspirationForm.views) || 0,
        likes: Number(inspirationForm.likes) || 0,
        comments: Number(inspirationForm.comments) || 0,
        shares: Number(inspirationForm.shares) || 0,
        saves: Number(inspirationForm.saves) || 0,
      },
      whyWorked: inspirationForm.whyWorked,
      adaptationIdea: inspirationForm.adaptationIdea,
    };

    setInspirations((current) => [newInspiration, ...current]);
    setInspirationForm(defaultInspirationForm);
    setInspirationFeedback("Inspiração salva com sucesso!");
    setTimeout(() => setInspirationFeedback(""), 1800);
  };

  const useInspirationInGenerator = (inspiration) => {
    applyInspirationToImageBuilder(inspiration);
    setActiveSection("insp_imagens");
  };

  const copyInspirationIdea = (inspiration) => {
    const content = [
      `${inspiration.platform} • ${inspiration.contentType}`,
      `Nicho: ${inspiration.niche}`,
      `Elemento visual: ${inspiration.visualElement}`,
      `Visualizações: ${inspiration.metrics?.views || 0}`,
      `Curtidas: ${inspiration.metrics?.likes || 0}`,
      `Salvamentos: ${inspiration.metrics?.saves || 0}`,
      `Por que funcionou: ${inspiration.whyWorked || "não informado"}`,
      `Ideia para Sabor Latino: ${inspiration.adaptationIdea || "não informada"}`,
    ].join("\n");
    copyText(`inspiration_copy_${inspiration.id}`, content);
  };

  const deleteInspiration = (inspirationId) => {
    setInspirations((current) => current.filter((item) => item.id !== inspirationId));
    setImageBuilder((current) =>
      current.selectedInspirationId === inspirationId
        ? { ...current, selectedInspirationId: "", useSavedInspiration: "nao" }
        : current
    );
  };

  const updateSettingsField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const saveInstagramOfficialSetting = () => {
    const parsed = normalizeInstagramOfficialInput(instagramProfileInput);
    if (parsed.error) {
      setInstagramProfileError(parsed.error);
      return false;
    }

    setSettings((current) => ({
      ...current,
      instagramOfficial: parsed.value,
    }));
    setInstagramProfileInput(parsed.value);
    setInstagramProfileError("");
    return true;
  };

  const handleInstagramOfficialBlur = () => {
    saveInstagramOfficialSetting();
  };

  const handleInstagramOfficialKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveInstagramOfficialSetting();
    }
  };

  const updateInstagramManualField = (field, value) => {
    setInstagramManualForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveInstagramManualPost = (event) => {
    event.preventDefault();

    if (!instagramManualForm.date || !instagramManualForm.type || !instagramManualForm.dish.trim()) {
      setInstagramManualFeedback("Preencha Data, Tipo de conteúdo e Prato mostrado.");
      setTimeout(() => setInstagramManualFeedback(""), 2000);
      return;
    }

    if (instagramManualForm.link) {
      try {
        const parsed = new URL(instagramManualForm.link);
        if (!/^https?:$/.test(parsed.protocol)) {
          throw new Error("Link inválido");
        }
      } catch (error) {
        setInstagramManualFeedback("Link da publicação inválido. Use um URL completo começando com http.");
        setTimeout(() => setInstagramManualFeedback(""), 2200);
        return;
      }
    }

    const newPost = {
      id: `ig-manual-${Date.now()}`,
      date: instagramManualForm.date,
      link: instagramManualForm.link.trim(),
      type: instagramManualForm.type,
      dish: instagramManualForm.dish.trim(),
      views: Number(instagramManualForm.views) || 0,
      likes: Number(instagramManualForm.likes) || 0,
      comments: Number(instagramManualForm.comments) || 0,
      shares: Number(instagramManualForm.shares) || 0,
      saves: Number(instagramManualForm.saves) || 0,
      estimatedOrders: Number(instagramManualForm.orders) || 0,
      notes: instagramManualForm.notes.trim(),
    };

    setInstagramPosts((current) => [newPost, ...current]);
    setInstagramManualForm(defaultInstagramManualForm);
    setInstagramManualFeedback("Publicação manual salva com sucesso!");
    setTimeout(() => setInstagramManualFeedback(""), 1800);
  };

  const removeInstagramManualPost = (postId) => {
    setInstagramPosts((current) => current.filter((post) => post.id !== postId));
  };

  const copyAllInstagramOfficial = () => {
    if (!instagramGenerated) return;
    const content = instagramGeneratedFields
      .map((field) => `${field.title}\n${instagramGenerated[field.key] || ""}`)
      .join("\n\n------------------------------\n\n");
    copyText("instagram_official_all", content);
  };

  const generateFromInstagramOfficial = () => {
    const topDish = instagramMetrics.topDishByOrders || instagramMetrics.topDish || "Ropa vieja cubana";

    const promotionTypeMap = {
      "Pizza cubana": "Pizza",
      "Almoço latino": "Almoço",
      "Ropa vieja cubana": "Ropa vieja cubana",
      "Combo familiar": "Combo familiar",
      Sobremesa: "Sobremesa",
    };

    const imageProductMap = {
      Pizza: "Pizza cubana",
      Almoço: "Almoço latino",
      "Ropa vieja cubana": "Ropa vieja cubana",
      "Combo familiar": "Combo familiar",
      Sobremesa: "Sobremesa",
    };

    const selectedPromotionType = promotionTypeMap[topDish] || "Promoção para hoje";

    const promotionPack = generatePromotionPack({
      promotionType: selectedPromotionType,
      channel: "Instagram Feed",
      tone: "Direto para vender",
      settings,
    });

    const imagePack = generateImagePromptPack({
      product: imageProductMap[selectedPromotionType] || "Ropa vieja cubana",
      format: "Instagram Feed 4:5",
      visualStyle: "Comida quente com vapor",
      goal: "Vender rápido",
      settings,
      inspiration: null,
    });

    const generatedPack = {
      whatsappText: promotionPack.whatsappText,
      instagramText: promotionPack.instagramText,
      storyText: promotionPack.storyShortText,
      imagePrompt: imagePack.fullPrompt,
      videoIdea: imagePack.videoIdea,
    };

    setInstagramGenerated(generatedPack);
    setHistoryItems((current) => [
      createHistoryRecord({
        promotionType: selectedPromotionType,
        channel: "Instagram Oficial",
        tone: "Direto para vender",
        whatsappText: promotionPack.whatsappText,
        instagramText: promotionPack.instagramText,
        facebookText: promotionPack.facebookText,
        hashtags: promotionPack.hashtags,
        videoScript: imagePack.videoIdea,
        imagePrompt: imagePack.fullPrompt,
      }),
      ...current,
    ]);

    setInstagramFeedback("Promoção gerada com sucesso com base na análise manual do Instagram.");
    setTimeout(() => setInstagramFeedback(""), 1800);
  };

  const performanceClassName = (value) => {
    if (value === "médio") return "medio";
    return value;
  };

  const shouldGeneratePlanningWeek =
    isCampaignDayClosed || campaignDayBuilder.campaignType === "planejamento da semana";

  return (
    <div className="app-shell">
      <header className="hero">
        <h1>Promoções Sabor Latino</h1>
        <p>Ferramenta rápida para criar campanhas diárias e vender mais.</p>
      </header>

      <nav className="tab-row">
        {sections.map((section) => (
          <button
            className={activeSection === section.id ? "tab-btn active" : "tab-btn"}
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            type="button"
          >
            {section.label}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {activeSection === "inicio" ? (
          <section className="card">
            <h2>Início</h2>
            <p className="muted">Pronto para criar promoções em segundos.</p>

            <div className="info-stack">
              <div className="info-item">
                <span>Nome do restaurante</span>
                <strong>{settings.restaurantName}</strong>
              </div>
              <div className="info-item">
                <span>WhatsApp</span>
                <strong>{settings.whatsappNumber}</strong>
              </div>
              <div className="info-item">
                <span>Endereço</span>
                <strong>{settings.address}</strong>
              </div>
              <div className="info-item">
                <span>Localização</span>
                <strong>Nova Bassano, Rio Grande do Sul, Brasil</strong>
              </div>
            </div>

            <div className="grid-two">
              <button className="primary-btn" onClick={() => setActiveSection("criador")} type="button">
                Criar promoção agora
              </button>
              <a className="whatsapp-btn" href={buildFixedWhatsAppLink(openingMessage)} rel="noreferrer" target="_blank">
                Abrir WhatsApp
              </a>
            </div>

            <p className="hint">Botão do WhatsApp fixo em {FIXED_WHATSAPP_DISPLAY}.</p>
          </section>
        ) : null}

        {activeSection === "campanha_inteligente" ? (
          <section className="card">
            <h2>Campanha Inteligente</h2>
            <p className="muted">Campanha completa com estratégia, conteúdo e recomendação orientada por dados.</p>
            {historyResultsSummary.hasData ? (
              <p className="hint">
                Usando resultados manuais do Histórico: melhor canal {historyResultsSummary.topChannelByOrders}, melhor
                horário {historyResultsSummary.bestHourObserved} e produto destaque {historyResultsSummary.topProductBySales}.
              </p>
            ) : null}

            <div className="form-grid">
              <label>
                Produto principal
                <select
                  onChange={(event) => updateIntelligentCampaignBuilderField("product", event.target.value)}
                  value={intelligentCampaignBuilder.product}
                >
                  {intelligentCampaignProducts.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Objetivo
                <select
                  onChange={(event) => updateIntelligentCampaignBuilderField("objective", event.target.value)}
                  value={intelligentCampaignBuilder.objective}
                >
                  {intelligentCampaignObjectives.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Público
                <select
                  onChange={(event) => updateIntelligentCampaignBuilderField("audience", event.target.value)}
                  value={intelligentCampaignBuilder.audience}
                >
                  {intelligentCampaignAudiences.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Momento
                <select
                  onChange={(event) => updateIntelligentCampaignBuilderField("moment", event.target.value)}
                  value={intelligentCampaignBuilder.moment}
                >
                  {intelligentCampaignMoments.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Canal principal
                <select
                  onChange={(event) => updateIntelligentCampaignBuilderField("mainChannel", event.target.value)}
                  value={intelligentCampaignBuilder.mainChannel}
                >
                  {intelligentCampaignChannels.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Tom
                <select
                  onChange={(event) => updateIntelligentCampaignBuilderField("tone", event.target.value)}
                  value={intelligentCampaignBuilder.tone}
                >
                  {intelligentCampaignTones.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <button
              className="primary-btn full-width"
              onClick={() => generateIntelligentCampaignNow(intelligentCampaignBuilder)}
              type="button"
            >
              {intelligentCampaignLoading ? "Gerando campanha..." : "Gerar campanha inteligente"}
            </button>
            {intelligentCampaignFeedback ? <p className="hint">{intelligentCampaignFeedback}</p> : null}

            {intelligentCampaignGenerated ? (
              <>
                <div className="subcard">
                  <h3>Recomendação orientada por dados</h3>
                  <div className="campaign-recommendation-grid">
                    <article className="campaign-recommendation-card">
                      <span>Produto com melhor rendimento</span>
                      <strong>{intelligentCampaignGenerated.bestProductFromData}</strong>
                    </article>
                    <article className="campaign-recommendation-card">
                      <span>Melhor formato</span>
                      <strong>{intelligentCampaignGenerated.bestFormatSuggested}</strong>
                    </article>
                    <article className="campaign-recommendation-card">
                      <span>Melhor horário</span>
                      <strong>{intelligentCampaignGenerated.bestTimeSuggested}</strong>
                    </article>
                    <article className="campaign-recommendation-card full-width">
                      <span>Melhor estilo visual</span>
                      <strong>{intelligentCampaignGenerated.bestVisualStyleSuggested}</strong>
                    </article>
                  </div>
                  <p className="hint">{intelligentCampaignGenerated.recommendationSourceNotice}</p>
                </div>

                <div className="smart-actions-grid">
                  <button
                    className="secondary-btn"
                    onClick={() => copyText("smart_whatsapp", intelligentCampaignGenerated.whatsappText)}
                    type="button"
                  >
                    {copiedKey === "smart_whatsapp" ? "Copiado!" : "Copiar WhatsApp"}
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => copyText("smart_instagram", intelligentCampaignGenerated.instagramFeedCaption)}
                    type="button"
                  >
                    {copiedKey === "smart_instagram" ? "Copiado!" : "Copiar Instagram"}
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => copyText("smart_image_prompt", intelligentCampaignGenerated.imagePrompt)}
                    type="button"
                  >
                    {copiedKey === "smart_image_prompt" ? "Copiado!" : "Copiar Prompt de Imagem"}
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => copyText("smart_video_script", intelligentCampaignGenerated.videoScript)}
                    type="button"
                  >
                    {copiedKey === "smart_video_script" ? "Copiado!" : "Copiar Roteiro"}
                  </button>
                  <button className="secondary-btn" onClick={copyAllIntelligentCampaignTexts} type="button">
                    {copiedKey === "all_intelligent_campaign" ? "Tudo copiado!" : "Copiar Campanha Completa"}
                  </button>
                  <button className="whatsapp-btn" onClick={openWhatsAppWithIntelligentCampaign} type="button">
                    Enviar no WhatsApp
                  </button>
                </div>

                <div className="grid-two">
                  <button className="primary-btn" onClick={saveIntelligentCampaignAsFavorite} type="button">
                    Marcar como favorita
                  </button>
                </div>
                {favoriteFeedback ? <p className="hint">{favoriteFeedback}</p> : null}

                <div className="outputs-grid">
                  {intelligentCampaignOutputFields.map((field) => (
                    <article className="output-card" key={field.key}>
                      <h3>{field.title}</h3>
                      <p>{intelligentCampaignGenerated[field.key]}</p>
                      <button
                        className="secondary-btn"
                        onClick={() => copyText(`smart_${field.key}`, intelligentCampaignGenerated[field.key])}
                        type="button"
                      >
                        {copiedKey === `smart_${field.key}` ? "Copiado!" : "Copiar"}
                      </button>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className="empty-state">Defina os dados acima e toque em "Gerar campanha inteligente".</p>
            )}
          </section>
        ) : null}

        {activeSection === "criador" ? (
          <section className="card">
            <h2>Criador de promoções</h2>
            <p className="muted">Escolha o que vender e o estilo da mensagem.</p>

            <div className="form-grid">
              <label>
                Tipo de promoção
                <select
                  onChange={(event) => updateBuilderField("promotionType", event.target.value)}
                  value={builder.promotionType}
                >
                  {promotionTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Canal
                <select onChange={(event) => updateBuilderField("channel", event.target.value)} value={builder.channel}>
                  {channels.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="full-width">
                Tom da mensagem
                <select onChange={(event) => updateBuilderField("tone", event.target.value)} value={builder.tone}>
                  {tones.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <button className="primary-btn full-width" onClick={() => generateNow(builder)} type="button">
              Gerar textos promocionais
            </button>
          </section>
        ) : null}

        {activeSection === "gerador" ? (
          <section className="card">
            <h2>Gerador de textos</h2>
            <p className="muted">Copie e publique rápido em cada canal.</p>

            {generated ? (
              <>
                <div className="meta-chip-row">
                  <span className="meta-chip">{generated.meta.promotionType}</span>
                  <span className="meta-chip">{generated.meta.channel}</span>
                  <span className="meta-chip">{generated.meta.tone}</span>
                </div>

                <div className="grid-two">
                  <button className="primary-btn" onClick={saveGeneratedAsFavorite} type="button">
                    Salvar promoção favorita
                  </button>
                  <button className="secondary-btn" onClick={() => setActiveSection("favoritas")} type="button">
                    Ver promoções favoritas
                  </button>
                </div>
                <div className="grid-two">
                  <button className="secondary-btn" onClick={copyAllTexts} type="button">
                    {copiedKey === "all_texts" ? "Tudo copiado!" : "Copiar todos os textos"}
                  </button>
                  <button className="whatsapp-btn" onClick={openWhatsAppWithGenerated} type="button">
                    Abrir WhatsApp com texto
                  </button>
                </div>
                {favoriteFeedback ? <p className="hint">{favoriteFeedback}</p> : null}

                <div className="outputs-grid">
                  {outputFields.map((field) => (
                    <article className="output-card" key={field.key}>
                      <h3>{field.title}</h3>
                      <p>{generated[field.key]}</p>
                      <button
                        className="secondary-btn"
                        onClick={() => copyText(field.key, generated[field.key])}
                        type="button"
                      >
                        {copiedKey === field.key ? "Copiado!" : "Copiar"}
                      </button>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className="empty-state">Escolha as opções no Criador e toque em "Gerar textos promocionais".</p>
            )}
          </section>
        ) : null}

        {activeSection === "campanha_dia" ? (
          <section className="card">
            <h2>Campanha do Dia</h2>
            <p className="muted">Crie uma campanha diária completa para vender mais com um único fluxo.</p>

            <div className="subcard">
              <h3>Planejador semanal inteligente</h3>
              <label className="week-day-select-label">
                Dia da semana
                <select
                  onChange={(event) => handleSelectCampaignWeekDay(event.target.value)}
                  value={campaignDaySelectedWeekDay}
                >
                  {weekPlannerDays.map((day) => (
                    <option key={day.id} value={day.id}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </label>

              <p className="mini-calendar-title">Mini calendário semanal</p>
              <div className="week-mini-calendar">
                {weekPlannerDays.map((day) => {
                  const hasCampaign = Boolean(latestCampaignByWeekDay[day.id]);
                  const isSelected = day.id === campaignDaySelectedWeekDay;
                  return (
                    <article
                      className={`week-day-card${isSelected ? " selected" : ""}${day.id === "segunda" ? " closed-day" : ""}`}
                      key={day.id}
                    >
                      <button className="week-day-select-btn" onClick={() => handleSelectCampaignWeekDay(day.id)} type="button">
                        {day.shortLabel}
                      </button>
                      <strong>{day.label}</strong>
                      {day.id === "segunda" ? <span className="week-day-status">Fechado</span> : null}
                      {hasCampaign ? <span className="week-day-marker" /> : null}
                      {hasCampaign ? (
                        <button className="week-day-view-btn" onClick={() => handleViewSavedCampaign(day.id)} type="button">
                          Ver campanha
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              <p className="hint">{campaignDayShortRecommendation}</p>
              {isCampaignDayClosed ? <p className="input-error">Fechado às segundas-feiras.</p> : null}
              {isCampaignDayClosed ? (
                <div className="recommendation-list">
                  {mondayPlanningRecommendations.map((tip, index) => (
                    <p key={`monday-tip-${index}`}>• {tip}</p>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="form-grid">
              <label className="full-width">
                Tipo da campanha
                <select
                  disabled={isCampaignDayClosed}
                  onChange={(event) => updateCampaignDayBuilderField("campaignType", event.target.value)}
                  value={campaignDayBuilder.campaignType}
                >
                  {campaignDayTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Produto principal
                <select
                  disabled={isCampaignDayClosed}
                  onChange={(event) => updateCampaignDayBuilderField("product", event.target.value)}
                  value={campaignDayBuilder.product}
                >
                  {campaignProducts.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Objetivo
                <select
                  disabled={isCampaignDayClosed}
                  onChange={(event) => updateCampaignDayBuilderField("objective", event.target.value)}
                  value={campaignDayBuilder.objective}
                >
                  {campaignObjectives.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Momento do dia
                <select
                  disabled={isCampaignDayClosed}
                  onChange={(event) => updateCampaignDayBuilderField("moment", event.target.value)}
                  value={campaignDayBuilder.moment}
                >
                  {campaignMoments.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Tom
                <select
                  disabled={isCampaignDayClosed}
                  onChange={(event) => updateCampaignDayBuilderField("tone", event.target.value)}
                  value={campaignDayBuilder.tone}
                >
                  {campaignTones.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Quantidade disponível (opcional)
                <input
                  disabled={isCampaignDayClosed}
                  onChange={(event) => updateCampaignDayBuilderField("availableQuantity", event.target.value)}
                  placeholder="Ex: 25 porções"
                  type="text"
                  value={campaignDayBuilder.availableQuantity}
                />
              </label>

              <label>
                Horário limite (opcional)
                <input
                  disabled={isCampaignDayClosed}
                  onChange={(event) => updateCampaignDayBuilderField("deadline", event.target.value)}
                  placeholder="Ex: 20h30"
                  type="text"
                  value={campaignDayBuilder.deadline}
                />
              </label>
            </div>

            {shouldGeneratePlanningWeek ? (
              <button
                className="primary-btn full-width"
                onClick={() =>
                  generateCampaignDayNow(
                    {
                      ...campaignDayBuilder,
                      campaignType: "planejamento da semana",
                      objective: "organizar campanhas de terça a domingo",
                      moment: "manhã",
                      tone: "caseiro",
                    },
                    { forcePlanning: true }
                  )
                }
                type="button"
              >
                Gerar planejamento da semana
              </button>
            ) : (
              <button className="primary-btn full-width" onClick={() => generateCampaignDayNow(campaignDayBuilder)} type="button">
                Gerar campanha do dia
              </button>
            )}
            {campaignDayFeedback ? <p className="hint">{campaignDayFeedback}</p> : null}

            {campaignDayViewedRecord ? (
              <div className="subcard">
                <h3>Campanha salva para {campaignDayViewedRecord.weekDayLabel}</h3>
                <p className="muted">
                  {campaignDayViewedRecord.generatedAt} • {campaignDayViewedRecord.dayStatus} •{" "}
                  {campaignDayViewedRecord.campaignType}
                </p>
                <div className="info-stack">
                  <div className="info-item">
                    <span>WhatsApp</span>
                    <strong>{campaignDayViewedRecord.whatsappText}</strong>
                  </div>
                  <div className="info-item">
                    <span>Instagram</span>
                    <strong>{campaignDayViewedRecord.instagramText}</strong>
                  </div>
                </div>
                <div className="smart-actions-grid">
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      copyText(`weekly_whatsapp_${campaignDayViewedRecord.id}`, campaignDayViewedRecord.whatsappText || "")
                    }
                    type="button"
                  >
                    {copiedKey === `weekly_whatsapp_${campaignDayViewedRecord.id}` ? "Copiado!" : "Copiar WhatsApp"}
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      copyText(`weekly_instagram_${campaignDayViewedRecord.id}`, campaignDayViewedRecord.instagramText || "")
                    }
                    type="button"
                  >
                    {copiedKey === `weekly_instagram_${campaignDayViewedRecord.id}` ? "Copiado!" : "Copiar Instagram"}
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      copyText(`weekly_prompt_${campaignDayViewedRecord.id}`, campaignDayViewedRecord.imagePrompt || "")
                    }
                    type="button"
                  >
                    {copiedKey === `weekly_prompt_${campaignDayViewedRecord.id}` ? "Copiado!" : "Copiar prompt de imagem"}
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      copyText(`weekly_full_${campaignDayViewedRecord.id}`, campaignDayViewedRecord.fullCampaignText || "")
                    }
                    type="button"
                  >
                    {copiedKey === `weekly_full_${campaignDayViewedRecord.id}` ? "Copiado!" : "Copiar campanha completa"}
                  </button>
                </div>
              </div>
            ) : null}

            {campaignDayGenerated ? (
              <>
                <div className="subcard">
                  <h3>Recomendações da campanha</h3>
                  <div className="campaign-recommendation-grid">
                    <article className="campaign-recommendation-card">
                      <span>Melhor horário para postar</span>
                      <strong>{campaignDayGenerated.recommendations?.bestPostingTime}</strong>
                    </article>
                    <article className="campaign-recommendation-card">
                      <span>Melhor formato</span>
                      <strong>{campaignDayGenerated.recommendations?.bestFormat}</strong>
                    </article>
                    <article className="campaign-recommendation-card">
                      <span>Melhor tipo de imagem</span>
                      <strong>{campaignDayGenerated.recommendations?.bestImageType}</strong>
                    </article>
                  </div>
                </div>

                <div className="grid-two">
                  <button className="secondary-btn" onClick={copyAllCampaignDayTexts} type="button">
                    {copiedKey === "all_campaign_day" ? "Campanha copiada!" : "Copiar campanha completa"}
                  </button>
                </div>

                <div className="outputs-grid">
                  {campaignDayOutputFields.map((field) => (
                    <article className="output-card" key={field.key}>
                      <h3>{field.title}</h3>
                      <p>{campaignDayGenerated[field.key]}</p>
                      <button
                        className="secondary-btn"
                        onClick={() => copyText(`campaign_day_${field.key}`, campaignDayGenerated[field.key])}
                        type="button"
                      >
                        {copiedKey === `campaign_day_${field.key}` ? "Copiado!" : "Copiar"}
                      </button>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className="empty-state">Escolha os dados da campanha e toque em "Gerar campanha do dia".</p>
            )}
          </section>
        ) : null}

        {activeSection === "instagram_oficial" ? (
          <section className="card">
            <h2>Instagram Oficial e Análise Manual</h2>

            <div className="subcard">
              <h3>Instagram oficial configurado</h3>
              <div className="info-stack">
                <div className="info-item">
                  <strong>{normalizedOfficialInstagram}</strong>
                </div>
              </div>
              <div className="grid-two">
                <a className="secondary-btn" href={officialInstagramUrl} rel="noreferrer" target="_blank">
                  Abrir Instagram
                </a>
              </div>
              <p className="muted">
                Este módulo usa o perfil oficial do restaurante e dados inseridos manualmente para ajudar a analisar
                publicações e criar campanhas melhores.
              </p>
            </div>

            <div className="subcard">
              <h3>Análise manual do Instagram</h3>
              <form className="form-grid" onSubmit={saveInstagramManualPost}>
                <label>
                  Data
                  <input
                    onChange={(event) => updateInstagramManualField("date", event.target.value)}
                    required
                    type="datetime-local"
                    value={instagramManualForm.date}
                  />
                </label>

                <label>
                  Link da publicação
                  <input
                    onChange={(event) => updateInstagramManualField("link", event.target.value)}
                    placeholder="https://www.instagram.com/..."
                    type="url"
                    value={instagramManualForm.link}
                  />
                </label>

                <label>
                  Tipo de conteúdo
                  <select
                    onChange={(event) => updateInstagramManualField("type", event.target.value)}
                    value={instagramManualForm.type}
                  >
                    {instagramManualContentTypes.map((contentType) => (
                      <option key={contentType}>{contentType}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Prato mostrado
                  <input
                    onChange={(event) => updateInstagramManualField("dish", event.target.value)}
                    placeholder="Ex.: Ropa vieja cubana"
                    required
                    type="text"
                    value={instagramManualForm.dish}
                  />
                </label>

                <label>
                  Visualizações
                  <input
                    min="0"
                    onChange={(event) => updateInstagramManualField("views", event.target.value)}
                    type="number"
                    value={instagramManualForm.views}
                  />
                </label>

                <label>
                  Curtidas
                  <input
                    min="0"
                    onChange={(event) => updateInstagramManualField("likes", event.target.value)}
                    type="number"
                    value={instagramManualForm.likes}
                  />
                </label>

                <label>
                  Comentários
                  <input
                    min="0"
                    onChange={(event) => updateInstagramManualField("comments", event.target.value)}
                    type="number"
                    value={instagramManualForm.comments}
                  />
                </label>

                <label>
                  Compartilhamentos
                  <input
                    min="0"
                    onChange={(event) => updateInstagramManualField("shares", event.target.value)}
                    type="number"
                    value={instagramManualForm.shares}
                  />
                </label>

                <label>
                  Salvamentos
                  <input
                    min="0"
                    onChange={(event) => updateInstagramManualField("saves", event.target.value)}
                    type="number"
                    value={instagramManualForm.saves}
                  />
                </label>

                <label>
                  Pedidos gerados
                  <input
                    min="0"
                    onChange={(event) => updateInstagramManualField("orders", event.target.value)}
                    type="number"
                    value={instagramManualForm.orders}
                  />
                </label>

                <label className="full-width">
                  Observações
                  <textarea
                    onChange={(event) => updateInstagramManualField("notes", event.target.value)}
                    placeholder="O que funcionou nessa publicação?"
                    rows={3}
                    value={instagramManualForm.notes}
                  />
                </label>

                <button className="primary-btn full-width" type="submit">
                  Salvar publicação manual
                </button>
              </form>
              {instagramManualFeedback ? <p className="hint">{instagramManualFeedback}</p> : null}
            </div>

            <div className="subcard">
              <h3>Resultados da análise manual</h3>
              <div className="instagram-metrics-grid">
                <article className="metric-card">
                  <span>Publicação com melhor desempenho</span>
                  <strong>
                    {instagramMetrics.topPerformancePost
                      ? `${instagramMetrics.topPerformancePost.type} • ${instagramMetrics.topPerformancePost.dish}`
                      : "Sem dados"}
                  </strong>
                </article>
                <article className="metric-card">
                  <span>Tipo de conteúdo que mais funcionou</span>
                  <strong>{instagramMetrics.topContentType}</strong>
                </article>
                <article className="metric-card">
                  <span>Prato que mais gerou pedidos</span>
                  <strong>{instagramMetrics.topDishByOrders}</strong>
                </article>
                <article className="metric-card">
                  <span>Melhor horário observado</span>
                  <strong>{instagramMetrics.bestObservedHourRange}</strong>
                </article>
                <article className="metric-card">
                  <span>Recomendação do que publicar hoje</span>
                  <strong>{instagramMetrics.recommendationToday}</strong>
                </article>
              </div>
            </div>

            <div className="subcard">
              <h3>Publicações registradas manualmente</h3>
              <div className="table-wrap">
                <table className="instagram-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Link da publicação</th>
                      <th>Tipo</th>
                      <th>Prato mostrado</th>
                      <th>Visualizações</th>
                      <th>Curtidas</th>
                      <th>Comentários</th>
                      <th>Compartilhamentos</th>
                      <th>Salvamentos</th>
                      <th>Pedidos gerados</th>
                      <th>Observações</th>
                      <th>Rendimento</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instagramPostsList.map((post) => {
                      const postPerformance =
                        post.performance ||
                        (calculateInstagramScore(post) >= 4500
                          ? "alto"
                          : calculateInstagramScore(post) >= 1800
                            ? "médio"
                            : "baixo");

                      return (
                      <tr key={post.id}>
                        <td>{formatInstagramPostDate(post.date)}</td>
                        <td>
                          {post.link ? (
                            <a href={post.link} rel="noreferrer" target="_blank">
                              Ver
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{post.type}</td>
                        <td>{post.dish}</td>
                        <td>{post.views}</td>
                        <td>{post.likes}</td>
                        <td>{post.comments}</td>
                        <td>{post.shares}</td>
                        <td>{post.saves}</td>
                        <td>{post.estimatedOrders}</td>
                        <td>{post.notes || "-"}</td>
                        <td>
                          <span className={`performance-pill ${performanceClassName(postPerformance)}`}>
                            {postPerformance}
                          </span>
                        </td>
                        <td>
                          <button className="secondary-btn" onClick={() => removeInstagramManualPost(post.id)} type="button">
                            Excluir
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="subcard">
              <h3>Recomendações práticas</h3>
              <div className="recommendation-list">
                {instagramRecommendations.map((recommendation, index) => (
                  <p key={`recommendation-${index}`}>• {recommendation}</p>
                ))}
              </div>
            </div>

            <button className="primary-btn full-width" onClick={generateFromInstagramOfficial} type="button">
              Gerar campanha com base na análise manual
            </button>
            {instagramFeedback ? <p className="hint">{instagramFeedback}</p> : null}

            {instagramGenerated ? (
              <>
                <div className="grid-two">
                  <button className="secondary-btn" onClick={copyAllInstagramOfficial} type="button">
                    {copiedKey === "instagram_official_all" ? "Tudo copiado!" : "Copiar tudo (Instagram Oficial)"}
                  </button>
                </div>
                <div className="outputs-grid">
                  {instagramGeneratedFields.map((field) => (
                    <article className="output-card" key={field.key}>
                      <h3>{field.title}</h3>
                      <p>{instagramGenerated[field.key]}</p>
                      <button
                        className="secondary-btn"
                        onClick={() => copyText(`instagram_generated_${field.key}`, instagramGenerated[field.key])}
                        type="button"
                      >
                        {copiedKey === `instagram_generated_${field.key}` ? "Copiado!" : "Copiar"}
                      </button>
                    </article>
                  ))}
                </div>
              </>
            ) : null}

          </section>
        ) : null}

        {activeSection === "insp_imagens" ? (
          <section className="card">
            <h2>Inspirações & Imagens</h2>
            <p className="muted">
              Referências são registradas manualmente. A ferramenta usa apenas estratégia visual para criar conteúdo
              original, sem scraping e sem copiar publicações de terceiros.
            </p>

            <div className="subcard">
              <h3>1. Inspirações</h3>
              <form className="form-grid" onSubmit={saveInspiration}>
                <label className="full-width">
                  Link da publicação
                  <input
                    onChange={(event) => updateInspirationField("link", event.target.value)}
                    required
                    type="url"
                    value={inspirationForm.link}
                  />
                </label>

                <label>
                  Plataforma
                  <select
                    onChange={(event) => updateInspirationField("platform", event.target.value)}
                    value={inspirationForm.platform}
                  >
                    {inspirationPlatforms.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Tipo de conteúdo
                  <select
                    onChange={(event) => updateInspirationField("contentType", event.target.value)}
                    value={inspirationForm.contentType}
                  >
                    {inspirationContentTypes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Nicho
                  <select onChange={(event) => updateInspirationField("niche", event.target.value)} value={inspirationForm.niche}>
                    {inspirationNiches.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Elemento visual principal
                  <select
                    onChange={(event) => updateInspirationField("visualElement", event.target.value)}
                    value={inspirationForm.visualElement}
                  >
                    {inspirationVisualElements.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Visualizações
                  <input
                    min="0"
                    onChange={(event) => updateInspirationField("views", event.target.value)}
                    type="number"
                    value={inspirationForm.views}
                  />
                </label>
                <label>
                  Curtidas
                  <input
                    min="0"
                    onChange={(event) => updateInspirationField("likes", event.target.value)}
                    type="number"
                    value={inspirationForm.likes}
                  />
                </label>
                <label>
                  Comentários
                  <input
                    min="0"
                    onChange={(event) => updateInspirationField("comments", event.target.value)}
                    type="number"
                    value={inspirationForm.comments}
                  />
                </label>
                <label>
                  Compartilhamentos
                  <input
                    min="0"
                    onChange={(event) => updateInspirationField("shares", event.target.value)}
                    type="number"
                    value={inspirationForm.shares}
                  />
                </label>
                <label>
                  Salvamentos
                  <input
                    min="0"
                    onChange={(event) => updateInspirationField("saves", event.target.value)}
                    type="number"
                    value={inspirationForm.saves}
                  />
                </label>

                <label className="full-width">
                  Por que funcionou
                  <input
                    onChange={(event) => updateInspirationField("whyWorked", event.target.value)}
                    type="text"
                    value={inspirationForm.whyWorked}
                  />
                </label>

                <label className="full-width">
                  Ideia que posso adaptar para Sabor Latino
                  <input
                    onChange={(event) => updateInspirationField("adaptationIdea", event.target.value)}
                    type="text"
                    value={inspirationForm.adaptationIdea}
                  />
                </label>

                <button className="primary-btn full-width" type="submit">
                  Salvar inspiração
                </button>
                <button
                  className="primary-btn full-width"
                  disabled={inspirationAdaptationLoading}
                  onClick={adaptCurrentInspirationForm}
                  type="button"
                >
                  ✨ Adaptar para Sabor Latino
                </button>
              </form>
              {inspirationFeedback ? <p className="hint">{inspirationFeedback}</p> : null}
              {!inspirationAdaptationLoading && inspirationAdaptationFeedback ? (
                <p className="hint">{inspirationAdaptationFeedback}</p>
              ) : null}
              {inspirationAdaptationLoading ? (
                <p className="hint">{inspirationAdaptationFeedback || "Adaptando para Sabor Latino..."}</p>
              ) : null}
              <p className="muted inspiration-ethics-note">
                As inspirações são usadas apenas como referência estratégica. A app não copia publicações, imagens ou
                identidade de terceiros.
              </p>
              <p className="hint">
                <strong>{inspirations.length}</strong> inspirações salvas
              </p>

              {inspirationAnalysis.hasEnoughData ? (
                <div className="inspiration-analysis-panel">
                  <h3>Análise automática das inspirações</h3>
                  <div className="history-results-grid">
                    <article className="metric-card">
                      <span>Plataforma que mais aparece</span>
                      <strong>{inspirationAnalysis.topPlatform}</strong>
                    </article>
                    <article className="metric-card">
                      <span>Tipo de conteúdo mais usado</span>
                      <strong>{inspirationAnalysis.topContentType}</strong>
                    </article>
                    <article className="metric-card">
                      <span>Elemento visual mais repetido</span>
                      <strong>{inspirationAnalysis.topVisualElement}</strong>
                    </article>
                    <article className="metric-card">
                      <span>Inspiração com maior visualizações</span>
                      <strong>
                        {inspirationAnalysis.inspirationWithMostViews
                          ? `${inspirationAnalysis.inspirationWithMostViews.platform} • ${
                              inspirationAnalysis.inspirationWithMostViews.metrics?.views || 0
                            } views`
                          : "Sem dados"}
                      </strong>
                    </article>
                    <article className="metric-card">
                      <span>Inspiração com maior salvamentos</span>
                      <strong>
                        {inspirationAnalysis.inspirationWithMostSaves
                          ? `${inspirationAnalysis.inspirationWithMostSaves.platform} • ${
                              inspirationAnalysis.inspirationWithMostSaves.metrics?.saves || 0
                            } salvamentos`
                          : "Sem dados"}
                      </strong>
                    </article>
                  </div>
                  <div className="recommendation-list">
                    <p>• Melhor ideia para adaptar hoje: {inspirationAnalysis.bestIdeaForToday}</p>
                  </div>
                </div>
              ) : (
                <p className="empty-state">Salve pelo menos 2 inspirações para ver padrões criativos.</p>
              )}

              {inspirations.length ? (
                <div className="favorites-grid">
                  {inspirations.map((inspiration) => (
                    <article className="favorite-card" key={inspiration.id}>
                      <strong>{inspiration.platform} • {inspiration.contentType}</strong>
                      <p>{inspiration.niche} • {inspiration.visualElement}</p>
                      <p>
                        Métricas: {inspiration.metrics.views} views, {inspiration.metrics.likes} curtidas,{" "}
                        {inspiration.metrics.comments} comentários, {inspiration.metrics.shares} compartilhamentos,{" "}
                        {inspiration.metrics.saves} salvamentos
                      </p>
                      <p>Por que funcionou: {inspiration.whyWorked || "não informado"}</p>
                      <p>Ideia para Sabor Latino: {inspiration.adaptationIdea || "não informada"}</p>
                      <div className="grid-two">
                        <button
                          className="secondary-btn"
                          disabled={inspirationAdaptationLoading}
                          onClick={() => adaptSavedInspiration(inspiration)}
                          type="button"
                        >
                          Adaptar
                        </button>
                        <button className="secondary-btn" onClick={() => useInspirationInGenerator(inspiration)} type="button">
                          Usar no gerador de imagem
                        </button>
                        <button className="secondary-btn" onClick={() => copyInspirationIdea(inspiration)} type="button">
                          {copiedKey === `inspiration_copy_${inspiration.id}` ? "Copiado!" : "Copiar ideia"}
                        </button>
                        <button className="secondary-btn" onClick={() => deleteInspiration(inspiration.id)} type="button">
                          Excluir
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">Nenhuma inspiração salva ainda.</p>
              )}

              {inspirationAdaptation ? (
                <div className="inspiration-adaptation-panel">
                  <h3>Adaptação original para Sabor Latino</h3>
                  <div className="grid-two">
                    <button className="secondary-btn" onClick={copyAllInspirationAdaptationTexts} type="button">
                      {copiedKey === "all_inspiration_adaptation" ? "Tudo copiado!" : "Copiar adaptação completa"}
                    </button>
                    <button className="whatsapp-btn" onClick={openWhatsAppWithInspirationAdaptation} type="button">
                      Enviar no WhatsApp
                    </button>
                  </div>
                  <div className="outputs-grid">
                    {inspirationAdaptationOutputFields.map((field) => (
                      <article className="output-card" key={field.key}>
                        <h3>{field.title}</h3>
                        <p>{inspirationAdaptation[field.key]}</p>
                        <button
                          className="secondary-btn"
                          onClick={() => copyText(`inspiration_adapt_${field.key}`, inspirationAdaptation[field.key])}
                          type="button"
                        >
                          {copiedKey === `inspiration_adapt_${field.key}` ? "Copiado!" : "Copiar"}
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="subcard">
              <h3>2. Gerador de Imagens</h3>
              <p className="muted">
                Regra: usar inspiração apenas como referência estratégica. Nunca copiar texto, imagem ou identidade de
                outra conta.
              </p>

              <div className="form-grid">
                <label>
                  Produto
                  <select onChange={(event) => updateImageBuilderField("product", event.target.value)} value={imageBuilder.product}>
                    {imageProducts.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Formato
                  <select onChange={(event) => updateImageBuilderField("format", event.target.value)} value={imageBuilder.format}>
                    {imageFormats.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Estilo visual
                  <select
                    onChange={(event) => updateImageBuilderField("visualStyle", event.target.value)}
                    value={imageBuilder.visualStyle}
                  >
                    {imageStyles.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Objetivo
                  <select onChange={(event) => updateImageBuilderField("goal", event.target.value)} value={imageBuilder.goal}>
                    {imageGoals.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Usar inspiração salva
                  <select
                    onChange={(event) => updateImageBuilderField("useSavedInspiration", event.target.value)}
                    value={imageBuilder.useSavedInspiration}
                  >
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </label>

                {imageBuilder.useSavedInspiration === "sim" ? (
                  <label>
                    Inspiração selecionada
                    <select
                      onChange={(event) => updateImageBuilderField("selectedInspirationId", event.target.value)}
                      value={imageBuilder.selectedInspirationId}
                    >
                      <option value="">Escolher inspiração</option>
                      {inspirations.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.platform} • {item.contentType} • {item.visualElement}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              <button className="primary-btn full-width" onClick={() => generateImageNow(imageBuilder)} type="button">
                Gerar prompt profissional
              </button>

              {selectedInspiration && imageBuilder.useSavedInspiration === "sim" ? (
                <p className="hint">
                  Base ativa: {selectedInspiration.platform} • {selectedInspiration.contentType} •{" "}
                  {selectedInspiration.visualElement}. Adaptação original para Sabor Latino.
                </p>
              ) : null}

              {imageGenerated ? (
                <>
                  <div className="grid-two">
                    <button className="secondary-btn full-width" onClick={copyAllImageTexts} type="button">
                      {copiedKey === "all_images" ? "Tudo copiado!" : "Copiar tudo (Imagens)"}
                    </button>
                  </div>
                  {imageCopyFeedback ? <p className="hint">{imageCopyFeedback}</p> : null}

                  <div className="outputs-grid">
                    {imageOutputFields.map((field) => (
                      <article className="output-card" key={field.key}>
                        <h3>{field.title}</h3>
                        <p>{imageGenerated[field.key]}</p>
                        <button
                          className="secondary-btn"
                          onClick={() => copyText(`image_${field.key}`, imageGenerated[field.key])}
                          type="button"
                        >
                          {copiedKey === `image_${field.key}` ? "Copiado!" : "Copiar"}
                        </button>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <p className="empty-state">Escolha as opções e toque em "Gerar prompt profissional".</p>
              )}
            </div>
          </section>
        ) : null}

        {activeSection === "historico" ? (
          <section className="card">
            <h2>Histórico</h2>
            <p className="muted">Registro automático das promoções geradas.</p>
            {historyResultFeedback ? <p className="hint">{historyResultFeedback}</p> : null}

            <div className="subcard">
              <h3>Painel de resultados reais</h3>
              <div className="history-results-grid">
                <article className="metric-card">
                  <span>Total de pedidos gerados</span>
                  <strong>{historyResultsSummary.totalOrders}</strong>
                </article>
                <article className="metric-card">
                  <span>Total vendido aproximado</span>
                  <strong>{formatCurrencyBRL(historyResultsSummary.totalSoldApprox)}</strong>
                </article>
                <article className="metric-card">
                  <span>Campanhas publicadas</span>
                  <strong>{historyResultsSummary.publishedCampaigns}</strong>
                </article>
                <article className="metric-card">
                  <span>Melhor canal</span>
                  <strong>{historyResultsSummary.bestChannel}</strong>
                </article>
              </div>

              <div className="recommendation-list">
                <p>• Melhor campanha da semana: {historyResultsSummary.bestCampaignOfWeek}</p>
                <p>• Produto que mais vendeu: {historyResultsSummary.topProductBySales}</p>
                <p>• Canal que mais trouxe pedidos: {historyResultsSummary.topChannelByOrders}</p>
                <p>• Melhor horário observado: {historyResultsSummary.bestHourObserved}</p>
                <p>• Tipo de texto que mais funcionou: {historyResultsSummary.topTextType}</p>
                <p>• Recomendação para próxima campanha: {historyResultsSummary.recommendationNext}</p>
              </div>
            </div>

            {historyItems.length ? (
              <div className="history-grid">
                {historyItems.map((item) => {
                  const campaignResult = historyResultByCampaignId[item.id] || null;
                  const isEditing = historyResultEditingId === item.id;

                  return (
                    <article className="history-card" key={item.id}>
                      <div className="history-top">
                        <strong>{item.promotionType || "Promoção"}</strong>
                        <div className="history-top-tags">
                          {campaignResult ? <span className="meta-chip">Resultado registrado</span> : null}
                          {item.isFavorite ? <span className="meta-chip">Favorita</span> : null}
                        </div>
                      </div>
                      <p>
                        {item.createdAt} • Canal: {item.channel || "não informado"} • Tom: {item.tone || "não informado"}
                      </p>
                      <p>
                        <strong>WhatsApp:</strong> {item.whatsappText || "Não gerado"}
                      </p>
                      <p>
                        <strong>Instagram:</strong> {item.instagramText || "Não gerado"}
                      </p>
                      <p>
                        <strong>Facebook:</strong> {item.facebookText || "Não gerado"}
                      </p>
                      <p>
                        <strong>Hashtags:</strong> {item.hashtags || "Não gerado"}
                      </p>
                      <p>
                        <strong>Roteiro de vídeo:</strong> {item.videoScript || "Não gerado"}
                      </p>
                      <p>
                        <strong>Prompt de imagem:</strong> {item.imagePrompt || "Não gerado"}
                      </p>

                      {campaignResult ? (
                        <div className="history-result-preview">
                          <p>
                            <strong>Resultado:</strong> {campaignResult.ordersGenerated} pedidos •{" "}
                            {formatCurrencyBRL(campaignResult.soldApprox)} • {campaignResult.channelUsed}
                          </p>
                        </div>
                      ) : null}

                      <div className="history-actions">
                        <button className="secondary-btn" onClick={() => copyHistoryItem(item)} type="button">
                          {copiedKey === `history_${item.id}` ? "Copiado!" : "Copiar promoção"}
                        </button>
                        <button className="secondary-btn" onClick={() => toggleHistoryFavorite(item.id)} type="button">
                          {item.isFavorite ? "Desfavoritar" : "Favoritar"}
                        </button>
                        <button className="secondary-btn" onClick={() => startHistoryResultRegistration(item)} type="button">
                          {campaignResult ? "Editar resultado" : "Registrar resultado"}
                        </button>
                        <button className="secondary-btn" onClick={() => deleteHistoryItem(item.id)} type="button">
                          Excluir
                        </button>
                      </div>

                      {isEditing ? (
                        <form
                          className="form-grid history-result-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            saveHistoryResultRegistration();
                          }}
                        >
                          <label>
                            Data da publicação
                            <input
                              onChange={(event) => updateHistoryResultFormField("publishedAt", event.target.value)}
                              required
                              type="datetime-local"
                              value={historyResultForm.publishedAt}
                            />
                          </label>
                          <label>
                            Canal usado
                            <select
                              onChange={(event) => updateHistoryResultFormField("channelUsed", event.target.value)}
                              value={historyResultForm.channelUsed}
                            >
                              {historyResultChannels.map((channelOption) => (
                                <option key={channelOption} value={channelOption}>
                                  {channelOption}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="full-width">
                            Produto promovido
                            <input
                              onChange={(event) => updateHistoryResultFormField("productPromoted", event.target.value)}
                              placeholder="Ex: Ropa vieja cubana"
                              required
                              type="text"
                              value={historyResultForm.productPromoted}
                            />
                          </label>
                          <label>
                            Visualizações
                            <input
                              min="0"
                              onChange={(event) => updateHistoryResultFormField("views", event.target.value)}
                              type="number"
                              value={historyResultForm.views}
                            />
                          </label>
                          <label>
                            Curtidas
                            <input
                              min="0"
                              onChange={(event) => updateHistoryResultFormField("likes", event.target.value)}
                              type="number"
                              value={historyResultForm.likes}
                            />
                          </label>
                          <label>
                            Comentários
                            <input
                              min="0"
                              onChange={(event) => updateHistoryResultFormField("comments", event.target.value)}
                              type="number"
                              value={historyResultForm.comments}
                            />
                          </label>
                          <label>
                            Compartilhamentos
                            <input
                              min="0"
                              onChange={(event) => updateHistoryResultFormField("shares", event.target.value)}
                              type="number"
                              value={historyResultForm.shares}
                            />
                          </label>
                          <label>
                            Salvamentos
                            <input
                              min="0"
                              onChange={(event) => updateHistoryResultFormField("saves", event.target.value)}
                              type="number"
                              value={historyResultForm.saves}
                            />
                          </label>
                          <label>
                            Cliques no WhatsApp
                            <input
                              min="0"
                              onChange={(event) => updateHistoryResultFormField("whatsappClicks", event.target.value)}
                              type="number"
                              value={historyResultForm.whatsappClicks}
                            />
                          </label>
                          <label>
                            Pedidos gerados
                            <input
                              min="0"
                              onChange={(event) => updateHistoryResultFormField("ordersGenerated", event.target.value)}
                              type="number"
                              value={historyResultForm.ordersGenerated}
                            />
                          </label>
                          <label>
                            Valor vendido aproximado
                            <input
                              min="0"
                              onChange={(event) => updateHistoryResultFormField("soldApprox", event.target.value)}
                              step="0.01"
                              type="number"
                              value={historyResultForm.soldApprox}
                            />
                          </label>
                          <label className="full-width">
                            Observações
                            <textarea
                              onChange={(event) => updateHistoryResultFormField("notes", event.target.value)}
                              placeholder="Ex: Story com close do prato gerou mais pedidos."
                              rows={3}
                              value={historyResultForm.notes}
                            />
                          </label>
                          <div className="grid-two full-width">
                            <button className="primary-btn" type="submit">
                              Salvar resultado
                            </button>
                            <button className="secondary-btn" onClick={cancelHistoryResultRegistration} type="button">
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="empty-state">Nenhuma promoção registrada no histórico ainda.</p>
            )}
          </section>
        ) : null}

        {activeSection === "rapidas" ? (
          <section className="card">
            <h2>Promoções rápidas prontas</h2>
            <p className="muted">Um toque para gerar campanhas instantâneas.</p>

            <div className="quick-grid">
              {quickActions.map((action) => (
                <button
                  className="quick-btn"
                  disabled={quickLoading}
                  key={action.id}
                  onClick={() => runQuickAction(action)}
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {quickLoading ? <p className="hint">Gerando promoção...</p> : null}
            {quickFeedback ? <p className="hint">{quickFeedback}</p> : null}

            {quickGenerated ? (
              <>
                <div className="grid-two">
                  <button className="secondary-btn" onClick={copyAllQuickTexts} type="button">
                    {copiedKey === "all_quick_texts" ? "Tudo copiado!" : "Copiar tudo"}
                  </button>
                  <button className="whatsapp-btn" onClick={openWhatsAppWithQuickGenerated} type="button">
                    Enviar no WhatsApp
                  </button>
                </div>

                <div className="outputs-grid">
                  {quickOutputFields.map((field) => (
                    <article className="output-card" key={field.key}>
                      <h3>{field.title}</h3>
                      <p>{quickGenerated[field.key] || "Não gerado."}</p>
                      <button
                        className="secondary-btn"
                        onClick={() => copyText(`quick_${field.key}`, quickGenerated[field.key] || "")}
                        type="button"
                      >
                        {copiedKey === `quick_${field.key}` ? "Copiado!" : "Copiar"}
                      </button>
                    </article>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        {activeSection === "favoritas" ? (
          <section className="card">
            <h2>Favoritas</h2>
            <p className="muted">Promoções marcadas para reutilizar rapidamente.</p>

            {favoritePromotions.length ? (
              <div className="favorites-grid">
                {favoritePromotions.map((favorite) => (
                  <article className="favorite-card" key={favorite.id}>
                    <strong>{favorite.meta.promotionType}</strong>
                    <p>
                      Canal: {favorite.meta.channel} • Tom: {favorite.meta.tone}
                    </p>
                    <p>Salvo em: {favorite.createdAt}</p>
                    <div className="favorites-actions">
                      <button className="secondary-btn" onClick={() => copyFavoriteWhatsApp(favorite)} type="button">
                        {copiedKey === `favorite_whatsapp_${favorite.id}` ? "Copiado!" : "Copiar texto de WhatsApp"}
                      </button>
                      <button className="secondary-btn" onClick={() => copyFavoriteInstagram(favorite)} type="button">
                        {copiedKey === `favorite_instagram_${favorite.id}` ? "Copiado!" : "Copiar texto de Instagram"}
                      </button>
                      <button className="secondary-btn" onClick={() => copyFavoriteAll(favorite)} type="button">
                        {copiedKey === `favorite_all_${favorite.id}` ? "Copiado!" : "Copiar tudo"}
                      </button>
                      <button className="secondary-btn" onClick={() => deleteFavorite(favorite.id)} type="button">
                        Eliminar de favoritas
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">
                Nenhuma promoção favorita salva ainda. Gere uma promoção e toque em "Salvar promoção favorita".
              </p>
            )}
          </section>
        ) : null}
        {activeSection === "config" ? (
          <section className="card">
            <h2>Configuração simples</h2>
            <p className="muted">Dados do restaurante para personalizar suas promoções.</p>

            <div className="form-grid">
              <label>
                Nome do restaurante
                <input
                  onChange={(event) => updateSettingsField("restaurantName", event.target.value)}
                  type="text"
                  value={settings.restaurantName}
                />
              </label>

              <label>
                WhatsApp
                <input
                  onChange={(event) => updateSettingsField("whatsappNumber", event.target.value)}
                  type="text"
                  value={settings.whatsappNumber}
                />
              </label>

              <label className="full-width">
                Endereço
                <input
                  onChange={(event) => updateSettingsField("address", event.target.value)}
                  type="text"
                  value={settings.address}
                />
              </label>

              <label className="full-width">
                Instagram oficial do restaurante
                <input
                  onBlur={handleInstagramOfficialBlur}
                  onChange={(event) => {
                    setInstagramProfileInput(event.target.value);
                    if (instagramProfileError) setInstagramProfileError("");
                  }}
                  onKeyDown={handleInstagramOfficialKeyDown}
                  placeholder="@saborlatinobassano"
                  type="text"
                  value={instagramProfileInput}
                />
              </label>

              <div className="full-width">
                <button className="secondary-btn" onClick={saveInstagramOfficialSetting} type="button">
                  Salvar Instagram oficial
                </button>
                {instagramProfileError ? <p className="input-error">{instagramProfileError}</p> : null}
                <p className="hint">
                  Formatos aceitos: @usuario, usuario, https://instagram.com/usuario ou
                  https://www.instagram.com/usuario/
                </p>
              </div>

              <label>
                Prato destacado
                <input
                  onChange={(event) => updateSettingsField("featuredDish", event.target.value)}
                  type="text"
                  value={settings.featuredDish}
                />
              </label>

              <label>
                Horário de atendimento
                <input
                  onChange={(event) => updateSettingsField("openingHours", event.target.value)}
                  type="text"
                  value={settings.openingHours}
                />
              </label>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="footer-note">
        <small>
          {settings.restaurantName} • Nova Bassano, Rio Grande do Sul • WhatsApp fixo: {fixedWhatsAppNumber}
        </small>
      </footer>
    </div>
  );
}

export default App;


