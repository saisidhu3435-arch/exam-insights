import { db } from "@workspace/db";
import { newsArticlesTable, reactionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

async function seed() {
  await db.delete(reactionsTable);
  await db.delete(newsArticlesTable);

  const articles = [
    {
      headline: "India Just Struck Pakistan — And Called It Non-Escalatory. Here's What That Actually Means.",
      summary: "In the biggest military move in years, India launched precision airstrikes inside Pakistan and Pakistan-Occupied Kashmir. The government says it didn't want war. Pakistan says otherwise. The world is watching.",
      fullExplanation: "On the night of May 6-7, India launched 'Operation Sindoor' — a series of precision airstrikes targeting nine sites described as terror infrastructure in Pakistan and Pakistan-Occupied Kashmir. The strikes came exactly two weeks after the Pahalgam terror attack that killed 26 civilians, mostly tourists.\n\nWhat makes this significant: India hasn't conducted strikes inside Pakistani territory since 1971. The government was careful with its language — it called the strikes 'non-escalatory' and 'measured,' insisting only terror camps were targeted, not Pakistani military bases.\n\nPakistan responded by calling it an 'act of war' and claimed to have shot down Indian jets — a claim India denied. Several Pakistani cities went on high alert.\n\nWhy is this hard to fully understand? Because both sides are controlling the information. India hasn't released footage. Pakistan's account differs sharply. Independent verification is nearly impossible.\n\nWhat we know for sure: this marks a serious escalation between two nuclear-armed neighbours, and it's the most consequential military action India has taken in decades.",
      category: "National Security",
      tags: ["Operation Sindoor", "India-Pakistan", "Military", "Kashmir", "Terrorism"],
      readingTime: "5min" as const,
      likes: 1240,
      dislikes: 89,
      isFeatured: true,
      whyItMatters: "Two nuclear-armed countries just exchanged fire. The next 48 hours could shape South Asian security for a generation.",
      examRelevance: "Critical for CLAT GK: right of self-defence (Article 51 UN Charter), cross-border terrorism, Pakistan's FATF status, India's surgical strike doctrine, nuclear deterrence theory.",
    },
    {
      headline: "The Treaty That Gave Pakistan Water for 60 Years Just Got Suspended. Was It Legal?",
      summary: "India announced it is 'holding in abeyance' the Indus Waters Treaty — the agreement that controls rivers flowing into Pakistan. Experts are divided on whether India can actually do this.",
      fullExplanation: "The Indus Waters Treaty (IWT) was signed in 1960 by India and Pakistan, brokered by the World Bank after nine years of negotiations. It is considered one of the world's most successful water-sharing agreements — it survived wars, crises, and decades of hostility.\n\nUnder it: India controls the eastern rivers (Ravi, Beas, Sutlej) and Pakistan controls the western rivers (Indus, Jhelum, Chenab). These western rivers feed over 80% of Pakistan's agriculture.\n\nIndia's decision to 'hold the treaty in abeyance' — effectively suspend it — is unprecedented. The government says cross-border terrorism violates the spirit of the treaty.\n\nHere's the legal controversy: The IWT has a dispute resolution mechanism through the Permanent Indus Commission and the International Court of Arbitration — but it has no provision for unilateral suspension. International law experts are divided on whether India's move is valid or a violation of treaty obligations itself.\n\nPakistan has already approached the World Bank. This could become a landmark case in international water law.",
      category: "International Relations",
      tags: ["Indus Waters Treaty", "India-Pakistan", "International Law", "Water Rights", "World Bank"],
      readingTime: "10min" as const,
      likes: 876,
      dislikes: 54,
      isFeatured: true,
      whyItMatters: "Water is the next oil. This decision could reshape how countries use treaties as leverage — setting a precedent that echoes for decades.",
      examRelevance: "Major for CLAT/AILET: international treaty law, World Bank's role, VCLT (Vienna Convention on Law of Treaties), water as a human right, bilateral agreements and their limits.",
    },
    {
      headline: "The Court Said No to the Government's Secret Money Machine. Here's the Full Story.",
      summary: "India's Supreme Court struck down the Electoral Bond Scheme in a unanimous 5-0 verdict, saying anonymous political donations violate voters' right to know. But what was the scheme, really?",
      fullExplanation: "Since 2018, any company or individual could walk into a State Bank of India branch, buy a 'bond' of any value (from ₹1,000 to ₹1 crore), and donate it to any political party — completely anonymously. The party could then encash it at SBI. No public record. No disclosure.\n\nThe government called this 'transparent': at least it's going through a bank, not cash. Critics called it a legitimised money laundering system.\n\nThe Supreme Court disagreed with the government in a historic 5-0 verdict. Chief Justice D.Y. Chandrachud held that voters have a constitutional right to know who funds the parties they vote for — under Article 19(1)(a), the right to information is part of free speech. Anonymity in political funding directly undermines democracy.\n\nThe court ordered SBI to hand over all bond data — who bought them, how much, which party received them. The data revealed that BJP received the majority of bonds; companies that received government contracts and licences were among the largest donors.\n\nWas this scheme unique to India? No. Many democracies struggle with political funding transparency. But the scale and near-total anonymity of this scheme was unusual.",
      category: "Polity & Governance",
      tags: ["Supreme Court", "Electoral Bonds", "Democracy", "Article 19", "Political Funding"],
      readingTime: "10min" as const,
      likes: 934,
      dislikes: 67,
      isFeatured: true,
      whyItMatters: "Democracy depends on informed voters. When you don't know who funds the parties, you can't fully understand whose interests they serve.",
      examRelevance: "Essential for CLAT: Article 19(1)(a), judicial review, PIL mechanism, right to information, constitutional morality, separation of powers.",
    },
    {
      headline: "An AI Just Figured Out How to Design New Medicines. Scientists Say This Is a Bigger Deal Than It Sounds.",
      summary: "Google DeepMind's AlphaFold 3 can now predict how drugs interact with human proteins — something that used to take years of lab work. This could change how fast we find cures.",
      fullExplanation: "In 2020, DeepMind's AlphaFold 2 solved a 50-year-old problem in biology: how to predict the 3D shape of proteins from their genetic sequence. It won its creators a Nobel Prize.\n\nNow, AlphaFold 3 goes further. It can model how proteins interact with DNA, RNA, and small molecules — including drug compounds. This is where medicine gets made.\n\nHere's why this matters: almost every disease — cancer, Alzheimer's, HIV, diabetes — involves a protein malfunction. Drugs work by binding to proteins and either blocking or activating them. Currently, finding a drug that does this correctly takes 12-15 years and costs $2-3 billion. Most candidates fail in clinical trials.\n\nAlphaFold 3 lets researchers virtually test millions of molecules against a target protein before ever going to a lab. You can fail fast, learn fast, and arrive at promising candidates much sooner.\n\nDeepMind made the research model free for academic use — though the commercial version is paywalled. Indian research institutions have already begun exploring it for diseases that disproportionately affect South Asia: tuberculosis, dengue, malaria.",
      category: "Science & Technology",
      tags: ["AI", "Medicine", "AlphaFold", "Google DeepMind", "Drug Discovery", "Nobel Prize"],
      readingTime: "5min" as const,
      likes: 1102,
      dislikes: 23,
      isFeatured: true,
      whyItMatters: "One AI breakthrough could cut drug discovery time by a decade — meaning diseases that currently have no cure might have treatments within your lifetime.",
      examRelevance: "CLAT GK: science and technology, AI ethics and IP, open-source research, Nobel Prize 2024, India's pharma sector, TRIPS agreement.",
    },
    {
      headline: "India's Economy Slowed Down. But 6.4% Is Still Fast — So Why Are People Worried?",
      summary: "GDP growth slipped to 6.4% from 8.1% a year ago. India is still one of the fastest-growing major economies. But the slowdown tells a specific story about who is struggling.",
      fullExplanation: "India's GDP grew 6.4% in Q3 FY25 (October-December 2024), down from 8.1% in the same quarter a year earlier. Headlines called this a 'slowdown.' But is it?\n\nContext: China grew at around 5%. The US at 2.5%. The EU at 1%. Globally, 6.4% is fast. But India has been running at 7-8% — so this is a slowdown relative to our own pace.\n\nThe specific problem: manufacturing grew only 4.3%, and private consumption — meaning how much ordinary Indians are spending — slowed. When consumers tighten belts, companies invest less, which means fewer jobs, which means consumers tighten belts more. It's a cycle economists worry about.\n\nThe other pattern: corporate profits in India have been rising, but wage growth has been slow. The top 10% are doing well; the middle class is stretched. Economists call this a K-shaped recovery — one group rising, another stagnating or falling.\n\nThe RBI's response: the central bank may cut interest rates to encourage borrowing and spending. Lower rates mean cheaper home loans and business credit — which should stimulate activity.",
      category: "Economy",
      tags: ["GDP", "Economy", "RBI", "K-shaped Recovery", "India", "Inflation"],
      readingTime: "5min" as const,
      likes: 567,
      dislikes: 34,
      isFeatured: false,
      whyItMatters: "GDP numbers are the government's report card. When they slow, it usually means jobs are getting harder to find and incomes aren't keeping up.",
      examRelevance: "CLAT Economics: GDP vs GNP, fiscal deficit, RBI's monetary policy, inflation-growth trade-off, demand-side economics.",
    },
    {
      headline: "The Waqf Bill: A Religious Property Dispute or a Constitutional Showdown?",
      summary: "Parliament passed amendments to the law governing Islamic charitable properties. Supporters call it transparency. Critics say it's unconstitutional interference in religious affairs. Both sides have a legal point.",
      fullExplanation: "Waqf refers to Islamic charitable endowments — properties donated permanently for religious or community purposes: mosques, dargahs, schools, hospitals. India has roughly 8.7 lakh Waqf properties covering 9.4 lakh acres, making Waqf Boards among the largest landholders in the country.\n\nThe old law had problems. Waqf Boards had sweeping powers to claim properties, sometimes with little evidence. There were documented cases of private land being claimed as Waqf property without proper process. Mismanagement and corruption were common.\n\nThe amendment does two main things: first, adds non-Muslim members to Waqf Boards (currently all-Muslim bodies). Second, requires government registration of all Waqf properties and disputes to go through civil courts rather than Waqf tribunals.\n\nSupporting argument: Waqf Boards manage public properties. Transparency and diversity in governance is normal for any public body. Why should they be exempt?\n\nOpposing argument: Articles 25-30 of the Constitution protect religious communities' rights to manage their own religious affairs. Adding non-Muslim members to an Islamic charitable body is, critics say, state interference in religion — which the Constitution explicitly prohibits.\n\nThe Supreme Court has admitted challenges to the law. The legal question is genuine, and the outcome will define the scope of minority religious autonomy.",
      category: "Polity & Governance",
      tags: ["Waqf", "Parliament", "Religious Rights", "Articles 25-30", "Minority Rights", "Supreme Court"],
      readingTime: "10min" as const,
      likes: 789,
      dislikes: 112,
      isFeatured: false,
      whyItMatters: "This will settle a core constitutional question: how far can the government go in regulating the internal affairs of religious communities?",
      examRelevance: "Top-priority for CLAT: Articles 25, 26, 27, 28, 29, 30 — freedom of religion, minority rights, State's power to regulate religious practices, secularism in India.",
    },
    {
      headline: "The Maldives Wanted India Out. Now It's Back Asking for Help. What Changed?",
      summary: "Maldivian President Muizzu was elected on an 'India Out' slogan. Within a year, he flew to Delhi, signed agreements, and accepted India's financial help. Why did he change course so quickly?",
      fullExplanation: "When Mohamed Muizzu won the Maldivian presidential election in late 2023, his platform was simple: remove Indian military from Maldivian soil. India had stationed around 88 military personnel there, ostensibly for maritime surveillance and helicopter operations.\n\nMuizzu delivered on his promise — Indian troops left by May 2024. He deepened ties with China, signing various agreements. India watched, concerned.\n\nThen something happened: money. The Maldives is tiny (500,000 people) and almost entirely dependent on tourism and imports. It imports nearly everything — food, fuel, medicine — and a significant chunk comes from India. Its foreign exchange reserves dropped dangerously. By mid-2024, it was on the verge of a debt crisis.\n\nIndia stepped in. Not loudly. Quietly. A currency swap deal, a line of credit, infrastructure projects.\n\nWhen Muizzu visited Delhi in late 2024, he signed new agreements on digital infrastructure, health, and financial cooperation. The optics shifted. India-Maldives relations reset.\n\nGeopolitics lesson: ideology meets reality when you can't pay your bills. India's 'neighbourhood first' policy works best when it offers economic value, not just security relationships.",
      category: "International Relations",
      tags: ["Maldives", "India Foreign Policy", "Neighbourhood First", "SAARC", "China", "Geopolitics"],
      readingTime: "5min" as const,
      likes: 445,
      dislikes: 28,
      isFeatured: false,
      whyItMatters: "This is a live case study in how India uses economic leverage with neighbours — and how small countries navigate between big powers.",
      examRelevance: "CLAT International GK: India's neighbourhood policy, SAARC, bilateral treaties, China's Belt and Road in South Asia, soft power vs hard power.",
    },
    {
      headline: "Rich Countries Promised Developing Nations $300 Billion for Climate. Scientists Say That's Not Even Half Enough.",
      summary: "COP29 ended with a climate finance deal that looked big but fell far short of what experts say is needed. India called it inadequate. The gap between rich and poor countries on climate is growing.",
      fullExplanation: "Every year, world leaders gather for the UN Climate Conference — this year it was COP29 in Baku, Azerbaijan. The central fight: money.\n\nDeveloping countries (including India) argued they need about $1.3 trillion per year to transition to clean energy and adapt to climate change — floods, droughts, sea-level rise. This is not charity; it's compensation. Rich countries industrialised using coal and oil for 200 years, building up most of the CO₂ that now causes warming.\n\nWhat was agreed: developed nations will 'mobilise' $300 billion per year by 2035. Of this, only a fraction is direct government funding — the rest is private investment that governments will 'facilitate.' Critics say this is creative accounting.\n\nIndia's response: India's environment minister walked out of a session in protest, calling the deal a 'paltry' sum that condemned developing nations to choose between development and survival.\n\nThe fundamental tension: poorer countries want the money to be grants (free). Rich countries want it to be loans (repayable). If developing countries take on more debt to fight climate change they didn't cause, the injustice compounds.\n\nMeanwhile, global temperatures in 2024 crossed 1.5°C above pre-industrial levels for the first time.",
      category: "Environment & Climate",
      tags: ["COP29", "Climate Finance", "India", "UNFCCC", "Paris Agreement", "Global Warming"],
      readingTime: "10min" as const,
      likes: 612,
      dislikes: 41,
      isFeatured: false,
      whyItMatters: "Climate finance will determine whether countries like India can afford to go green without sacrificing growth — and who pays for a crisis mostly caused by others.",
      examRelevance: "CLAT Environment: UNFCCC, Paris Agreement, COP process, climate justice, differentiated responsibility, India's NDC targets, 1.5°C threshold.",
    },
  ];

  await db.insert(newsArticlesTable).values(articles);
  console.log(`Seeded ${articles.length} articles with engaging headlines.`);

  await db.execute(sql`SELECT setval(pg_get_serial_sequence('news_articles', 'id'), (SELECT MAX(id) FROM news_articles))`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
