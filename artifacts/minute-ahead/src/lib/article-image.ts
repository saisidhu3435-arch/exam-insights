const KEYWORD_SEARCHES: Array<{ keywords: string[]; query: string }> = [
  { keywords: ["supreme court", "high court", "tribunal"], query: "supreme+court+building" },
  { keywords: ["constitution", "fundamental rights", "article 370"], query: "constitution+law+india" },
  { keywords: ["parliament", "lok sabha", "rajya sabha", "sansad"], query: "india+parliament+building" },
  { keywords: ["election", "vote", "voting", "ballot", "evm"], query: "election+voting+india" },
  { keywords: ["court", "verdict", "judge", "legal", "law"], query: "courthouse+justice" },
  { keywords: ["rbi", "reserve bank", "repo rate", "monetary policy"], query: "reserve+bank+india" },
  { keywords: ["rupee", "stock market", "sensex", "nifty", "share market"], query: "stock+market+finance" },
  { keywords: ["budget", "gdp", "fiscal", "income tax", "tax"], query: "budget+finance+india" },
  { keywords: ["inflation", "economic", "economy", "trade"], query: "economy+growth+india" },
  { keywords: ["pakistan", "indus", "water treaty"], query: "india+pakistan+border" },
  { keywords: ["china", "chinese", "beijing", "taiwan"], query: "china+beijing+city" },
  { keywords: ["usa", "america", "washington", "white house", "trump"], query: "washington+dc+usa" },
  { keywords: ["russia", "ukraine", "moscow", "nato"], query: "russia+diplomacy" },
  { keywords: ["isro", "space", "rocket", "satellite", "chandrayaan", "gaganyaan"], query: "rocket+launch+space" },
  { keywords: ["missile", "nuclear", "agni", "brahmos", "weapon"], query: "missile+military+defence" },
  { keywords: ["army", "military", "soldier", "defence", "air force", "navy"], query: "india+military+soldier" },
  { keywords: ["border", "surgical strike", "security forces", "terrorism", "terror attack"], query: "border+security+patrol" },
  { keywords: ["artificial intelligence", "chatgpt", "machine learning", "ai model"], query: "artificial+intelligence+technology" },
  { keywords: ["cyber", "hack", "data breach", "ransomware"], query: "cybersecurity+computer" },
  { keywords: ["technology", "digital", "internet", "startup"], query: "technology+innovation" },
  { keywords: ["climate", "global warming", "carbon", "emission", "net zero"], query: "climate+change+environment" },
  { keywords: ["renewable", "solar", "wind energy", "green energy"], query: "solar+panel+renewable+energy" },
  { keywords: ["forest", "wildlife", "tiger", "deforestation", "biodiversity"], query: "forest+wildlife+nature" },
  { keywords: ["flood", "cyclone", "earthquake", "disaster", "rainfall"], query: "flood+natural+disaster" },
  { keywords: ["drought", "water crisis", "groundwater"], query: "drought+water+scarcity" },
  { keywords: ["hospital", "health", "disease", "medicine", "doctor"], query: "hospital+healthcare+india" },
  { keywords: ["vaccine", "vaccination", "covid", "pandemic"], query: "vaccine+healthcare" },
  { keywords: ["education", "school", "university", "college", "jee", "neet"], query: "education+students+india" },
  { keywords: ["farmer", "agriculture", "crop", "msp", "kisan"], query: "farmer+agriculture+india" },
  { keywords: ["woman", "gender", "women rights", "maternity"], query: "women+empowerment+india" },
  { keywords: ["united nations", "imf", "world bank", "g20", "g7"], query: "united+nations+diplomacy" },
  { keywords: ["iran", "middle east", "israel", "gaza", "saudi"], query: "middle+east+diplomacy" },
  { keywords: ["protest", "strike", "demonstration", "agitation"], query: "protest+demonstration" },
  { keywords: ["corruption", "scam", "cbi", "ed ", "enforcement directorate"], query: "corruption+investigation" },
  { keywords: ["infrastructure", "highway", "metro", "railway", "bullet train"], query: "infrastructure+railway+india" },
  { keywords: ["modi", "prime minister", "government", "cabinet"], query: "india+government+prime+minister" },
];

// Standard Pexels CDN helper — works for all photos uploaded after ~2018
// (these use the generic pexels-photo-{id}.jpeg filename)
const P = (id: number): string =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

// Older Pexels photos have descriptive filenames — hardcode exact CDN paths
// 159832 = judge's gavel on wood  (justice-law-case-hearing-159832.jpeg) ✓ HTTP 200
const GAVEL = "https://images.pexels.com/photos/159832/justice-law-case-hearing-159832.jpeg?auto=compress&cs=tinysrgb&w=1200";
// 60132   = SpaceX Dragon capsule orbiting Earth  (aerial-view-earth-exploration-flying-60132.jpeg) ✓ HTTP 200
const SATELLITE = P(60132);

const PEXELS_TOPIC_PHOTOS: Record<string, string[]> = {
  // Gavel (justice) — descriptive filename, hardcoded ✓
  "supreme+court+building":    [GAVEL],
  "constitution+law+india":    [GAVEL],
  "courthouse+justice":        [GAVEL],
  "corruption+investigation":  [GAVEL],

  // 3881113 = Rashtrapati Bhavan, Delhi ✓
  // 13819269 = India Gate, New Delhi ✓
  "india+parliament+building":       [P(3881113), P(13819269)],
  "india+government+prime+minister": [P(3881113), P(13819269)],

  // 1550337 = person dropping ballot into ballot box ✓
  "election+voting+india": [P(1550337)],

  // 5831251 = stock market chart on trading monitor ✓
  "reserve+bank+india":   [P(5831251)],
  "stock+market+finance": [P(5831251)],
  "budget+finance+india": [P(5831251)],
  "economy+growth+india": [P(5831251)],

  // 7468185 = close-up soldier in military uniform ✓
  // 12699768 = Indian tricolour flag waving ✓
  "india+pakistan+border":    [P(7468185), P(12699768)],
  "india+military+soldier":   [P(7468185), P(12699768)],
  "missile+military+defence": [P(7468185)],
  "border+security+patrol":   [P(7468185), P(12699768)],

  // 2412603 = Great Wall of China ✓
  "china+beijing+city": [P(2412603)],

  // 6451438 = US Capitol building at night ✓
  "washington+dc+usa": [P(6451438)],

  // 8698362 = Kremlin with dramatic clouds ✓
  "russia+diplomacy": [P(8698362)],

  // India Gate as generic diplomacy placeholder ✓
  "united+nations+diplomacy": [P(13819269), P(3881113)],
  "middle+east+diplomacy":    [P(13819269)],

  // 60132 = SpaceX Dragon satellite orbiting Earth ✓
  "rocket+launch+space": [SATELLITE],

  // 8386440 = robot pointing at wall ✓ | 1921326 = code on screen ✓
  "artificial+intelligence+technology": [P(8386440), P(1921326)],
  "technology+innovation":              [P(1921326), P(8386440)],

  // 5935787 = hacker typing on laptop ✓
  "cybersecurity+computer": [P(5935787)],

  // 247763 = industrial factory chimney emitting smoke ✓
  "climate+change+environment":   [P(247763)],
  "solar+panel+renewable+energy": [P(247763)],
  "flood+natural+disaster":       [P(247763)],
  "drought+water+scarcity":       [P(247763)],
  "forest+wildlife+nature":       [P(247763)],

  // 236380 = white hospital beds & equipment ✓
  "hospital+healthcare+india": [P(236380)],
  "vaccine+healthcare":        [P(236380)],

  // 3231358 = girls in a classroom ✓
  "education+students+india": [P(3231358)],

  // 20327958 = farming in India, Mahindra tractor ✓
  "farmer+agriculture+india": [P(20327958)],

  // India Gate as generic India placeholder ✓
  "women+empowerment+india": [P(13819269)],

  // 19489701 = protest crowd carrying flags and banners ✓
  "protest+demonstration": [P(19489701)],

  // 34625124 = Mumbai Metro at bustling station ✓
  "infrastructure+railway+india": [P(34625124)],
};

const DEFAULT_PHOTOS = [P(13819269), P(3881113), P(5831251)];

export function getArticleImage(
  articleId: number,
  _category: string,
  headline: string,
  storedUrl?: string | null
): string {
  if (
    storedUrl &&
    storedUrl.startsWith("https://") &&
    !storedUrl.includes("unsplash.com") &&
    !storedUrl.includes("pexels.com")
  ) {
    return storedUrl;
  }

  const h = (headline ?? "").toLowerCase();
  for (const entry of KEYWORD_SEARCHES) {
    if (entry.keywords.some((kw) => h.includes(kw))) {
      const pool = PEXELS_TOPIC_PHOTOS[entry.query];
      if (pool && pool.length > 0) return pool[articleId % pool.length];
    }
  }

  return DEFAULT_PHOTOS[articleId % DEFAULT_PHOTOS.length];
}
