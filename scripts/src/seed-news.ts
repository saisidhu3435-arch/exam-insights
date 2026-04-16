import { db } from "@workspace/db";
import { newsArticlesTable } from "@workspace/db";

async function seed() {
  const articles = [
    {
      headline: "Supreme Court Strikes Down Electoral Bond Scheme",
      summary: "India's Supreme Court unanimously declared the Electoral Bond Scheme unconstitutional, calling it a threat to free and fair elections.",
      fullExplanation: "The Supreme Court of India, in a landmark 5-0 verdict, struck down the Electoral Bond Scheme introduced in 2018. The scheme allowed anonymous donations to political parties via bonds purchased from the State Bank of India. The court ruled that this violated the voters' right to know about political funding, which is fundamental to free and fair elections. The government argued the scheme promoted transparency by eliminating black money in political funding, but the court disagreed — saying anonymity itself is the problem. The SBI was ordered to submit details of all bonds purchased, linking donors to recipients.",
      category: "Polity & Governance",
      tags: ["Supreme Court", "Electoral Bonds", "Constitutional Law", "Polity"],
      readingTime: "5min" as const,
      likes: 142,
      dislikes: 12,
      isFeatured: true,
      whyItMatters: "This directly affects how political parties get funded in India — and how voters can hold them accountable.",
      examRelevance: "Highly relevant for CLAT/AILET — constitutional law, right to information, Article 19(1)(a), judicial review.",
    },
    {
      headline: "India's GDP Growth Slips to 6.4% in Q3 — What It Means",
      summary: "India's economy grew 6.4% in the October-December quarter, slower than 8.1% a year ago. The slowdown is linked to weak manufacturing and urban spending.",
      fullExplanation: "India's GDP growth slipped to 6.4% in Q3 FY25, down from 8.1% in the same period last year. The National Statistical Office attributed this to weaker performance in manufacturing (which grew only 4.3%) and a slowdown in private consumption — meaning ordinary people are spending less. Agriculture, however, improved. India remains one of the fastest-growing major economies globally, but the data has renewed debate about whether the 'K-shaped recovery' from COVID is widening inequality — with the wealthy doing fine while the middle class tightens its belt. The Reserve Bank of India may revisit its rate policy in response.",
      category: "Economy",
      tags: ["GDP", "Economy", "RBI", "Manufacturing", "India"],
      readingTime: "5min" as const,
      likes: 98,
      dislikes: 8,
      isFeatured: true,
      whyItMatters: "GDP data shapes government policy on taxes, jobs, and interest rates — it affects your future job market.",
      examRelevance: "Essential for CLAT GK section — understand GDP, fiscal policy, RBI role, and economic indicators.",
    },
    {
      headline: "What Is the Waqf Amendment Bill and Why Is Everyone Talking About It?",
      summary: "The Indian government introduced amendments to the Waqf Act that changes how Islamic charitable properties are managed, sparking debate across political lines.",
      fullExplanation: "The Waqf Amendment Bill proposes changes to how Waqf properties — Islamic charitable endowments covering mosques, hospitals, and schools — are governed in India. Currently managed by state Waqf Boards, the amendment seeks to add non-Muslim members to these boards and give the government more oversight powers. Supporters say it will bring transparency and end corruption in Waqf property management. Critics, including Muslim organisations and opposition parties, argue it is an unconstitutional interference in religious affairs protected under Articles 25-28. The bill passed the Lok Sabha but remains in Rajya Sabha.",
      category: "Polity & Governance",
      tags: ["Waqf", "Parliament", "Religious Rights", "Minority Rights", "Constitutional Law"],
      readingTime: "10min" as const,
      likes: 201,
      dislikes: 45,
      isFeatured: true,
      whyItMatters: "This is a major political and constitutional debate about the relationship between state and religion in India.",
      examRelevance: "Critical for CLAT — covers Articles 25-30 (freedom of religion), minority rights, legislative process, Rajya Sabha vs Lok Sabha powers.",
    },
    {
      headline: "Google DeepMind's AlphaFold 3 Can Now Design New Medicines",
      summary: "AlphaFold 3, the upgraded AI system from Google DeepMind, can now predict how proteins interact with DNA, RNA, and drugs — a breakthrough that could transform medicine.",
      fullExplanation: "Google DeepMind released AlphaFold 3, an AI model that goes beyond predicting protein shapes (AlphaFold 2 won a Nobel Prize for this) to modeling how proteins interact with DNA, RNA, and small molecules like drugs. This matters because most diseases — from cancer to Alzheimer's — involve broken protein interactions. Scientists can now use AlphaFold 3 to virtually test thousands of potential drug compounds before running expensive lab trials. This could dramatically cut drug development time from 12-15 years to a fraction of that. DeepMind has made the model available for free to academic researchers.",
      category: "Science & Technology",
      tags: ["AI", "Medicine", "Google DeepMind", "AlphaFold", "Biotechnology"],
      readingTime: "5min" as const,
      likes: 315,
      dislikes: 11,
      isFeatured: true,
      whyItMatters: "AI is not just about chatbots — it is actively changing how we discover cures for diseases that kill millions.",
      examRelevance: "Relevant for CLAT GK — science and technology section, AI ethics, intellectual property in research.",
    },
    {
      headline: "India and Maldives Patch Relations After Muizzu Visits Delhi",
      summary: "Maldivian President Mohamed Muizzu visited India and signed key agreements, signaling a thaw after months of diplomatic tension over the 'India Out' campaign.",
      fullExplanation: "Relations between India and the Maldives had hit a low point after President Muizzu, elected on an 'India Out' platform, asked India to withdraw its military personnel. But his Delhi visit marked a significant reset. Both countries signed agreements on digital infrastructure, health, and financial support. India extended a credit line to help the Maldives manage its debt crisis. Analysts say the Maldives' economic dependence on India (it is a major tourist destination for Indians and relies on Indian imports for food and fuel) made full confrontation impractical. China had been seen as filling the gap, making India's outreach strategically critical.",
      category: "International Relations",
      tags: ["Maldives", "India Foreign Policy", "Diplomacy", "South Asia", "China"],
      readingTime: "5min" as const,
      likes: 178,
      dislikes: 19,
      isFeatured: false,
      whyItMatters: "India's relationship with its neighbours directly affects regional stability, trade, and its standing as a superpower.",
      examRelevance: "Important for CLAT Legal GK — India's neighbourhood policy, SAARC, bilateral agreements, strategic autonomy.",
    },
    {
      headline: "COP29: What Did the World Actually Agree to on Climate?",
      summary: "At the UN Climate Summit in Azerbaijan, wealthy nations pledged $300 billion annually to help developing countries — but climate experts say it's far less than what's needed.",
      fullExplanation: "The UN's annual climate summit, COP29, concluded with a landmark deal: developed countries agreed to mobilise $300 billion per year by 2035 for developing nations to fight climate change. Sounds big — but it falls well short of the $1.3 trillion scientists say is needed. India and other developing nations were frustrated, arguing they bear the least responsibility for historical emissions but face the worst consequences (floods, heatwaves, crop failures). The deal also includes a broader goal of mobilising $1.3 trillion, but only $300 billion is a firm government commitment. Critics called it 'climate finance theatre.'",
      category: "Environment & Climate",
      tags: ["COP29", "Climate Change", "UN", "Global Warming", "India"],
      readingTime: "10min" as const,
      likes: 245,
      dislikes: 28,
      isFeatured: false,
      whyItMatters: "Climate finance determines whether India gets the money to build solar farms, protect coastlines, and adapt to extreme weather.",
      examRelevance: "Directly relevant for CLAT GK — international environmental law, UNFCCC, Paris Agreement, climate justice.",
    },
    {
      headline: "What Is 'Operation Sindoor'? India's Strikes on Pakistan Explained",
      summary: "India launched precision strikes on alleged terrorist infrastructure in Pakistan and Pakistan-Occupied Kashmir following the Pahalgam terror attack.",
      fullExplanation: "Following the Pahalgam terror attack that killed 26 civilians, India launched 'Operation Sindoor' — a series of precision military strikes targeting alleged terrorist camps in Pakistan and Pakistan-Occupied Kashmir. The Indian government stated that the strikes were non-escalatory and targeted only terror infrastructure, not Pakistani military installations. The operation is named 'Sindoor' — the red powder symbolic of marriage — in tribute to the women widowed in the attack. Pakistan condemned the strikes as an act of aggression. The operation has significantly escalated tensions between the two nuclear-armed neighbours and drawn international attention.",
      category: "National Security",
      tags: ["Operation Sindoor", "India-Pakistan", "Terrorism", "Military", "Kashmir"],
      readingTime: "5min" as const,
      likes: 892,
      dislikes: 67,
      isFeatured: true,
      whyItMatters: "This represents one of the most significant military actions India has taken in years, with implications for regional security and international relations.",
      examRelevance: "Critical for CLAT GK — India's security policy, cross-border terrorism, Article 51 of UN Charter, right to self-defense under international law.",
    },
    {
      headline: "India Suspends Indus Waters Treaty: What This Means",
      summary: "India announced the suspension of the Indus Waters Treaty with Pakistan following heightened tensions, threatening water access for millions of Pakistanis.",
      fullExplanation: "The Indus Waters Treaty (1960), brokered by the World Bank, has been one of the most durable agreements between India and Pakistan — surviving wars, diplomatic crises, and decades of hostility. Under it, India controls the eastern rivers (Ravi, Beas, Sutlej) and Pakistan the western rivers (Indus, Jhelum, Chenab). India's announcement to 'hold in abeyance' the treaty marks an unprecedented step. The Indus system feeds over 80% of Pakistan's farmland. Legal experts are divided on whether unilateral suspension is permissible under the treaty's dispute resolution mechanism. The World Bank has not commented.",
      category: "International Relations",
      tags: ["Indus Waters Treaty", "India-Pakistan", "Water Rights", "International Law", "Agriculture"],
      readingTime: "10min" as const,
      likes: 445,
      dislikes: 38,
      isFeatured: true,
      whyItMatters: "Water is becoming one of the most contested resources in geopolitics. This could reshape India-Pakistan relations for decades.",
      examRelevance: "Major for CLAT/AILET — international treaties, World Bank role, water rights as international law, diplomatic history.",
    },
  ];

  await db.insert(newsArticlesTable).values(articles).onConflictDoNothing();
  console.log(`Seeded ${articles.length} articles.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
