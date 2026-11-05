export const PACKB16 = [
  {
    skillId: "marketing-plan",
    path: "references/idea-cross-reference.md",
    content:
      '# Idea Cross-Reference — 139 Marketing Ideas Mapped to AARRR\r\n\r\nThe `marketing-ideas` skill catalogs 139 proven marketing tactics. This doc is the source-of-truth mapping: every idea assigned to a primary AARRR stage, with notes for when it\'s typically active and what category constraints apply.\r\n\r\nThe plan\'s Section 12 ("Tactical idea bank") uses this mapping as the base, then layers client-specific filters: brand voice rules might skip some ideas; funding stage might shift Q-status; client category might rule out others.\r\n\r\n## How to read this doc\r\n\r\n- **139 unique ideas, 144 entries.** Five ideas cross-cut multiple AARRR stages and appear under each stage they serve (#79 Early-Access Referrals, #86 Lifetime Deals, #91 In-App Upsells, #114 Moneyball Marketing, #117 Product Competitions). Each duplicate row carries a cross-cut note.\r\n- **"Entries" counts rows; idea IDs are unique.** Section header counts reflect rows in this doc, not unique ideas from `marketing-ideas`.\r\n- **Numbers correspond exactly to the `marketing-ideas` skill ordering.** If `marketing-ideas` reorders or expands, update this doc.\r\n\r\n## AARRR assignment for all 139 ideas\r\n\r\n### Acquisition (116 entries)\r\n\r\nThese ideas primarily serve top-of-funnel awareness, traffic, and lead generation.\r\n\r\n| # | Idea | Category | Typical stage available |\r\n|---|---|---|---|\r\n| 1 | Easy Keyword Ranking | Content & SEO | Now (any stage) |\r\n| 2 | SEO Audit | Content & SEO | Now |\r\n| 3 | Glossary Marketing | Content & SEO | Q2+ |\r\n| 4 | Programmatic SEO | Content & SEO | Q3+ (needs data + template system) |\r\n| 5 | Content Repurposing | Content & SEO | Now (immediate leverage) |\r\n| 6 | Proprietary Data Content | Content & SEO | Now (if data exists) |\r\n| 7 | Internal Linking | Content & SEO | Now |\r\n| 8 | Content Refreshing | Content & SEO | Q2+ (after content base exists) |\r\n| 9 | Knowledge Base SEO | Content & SEO | Q3+ (after help docs exist) |\r\n| 10 | Parasite SEO | Content & SEO | Now |\r\n| 11 | Competitor Comparison Pages | Competitor | Q2+ |\r\n| 12 | Marketing Jiu-Jitsu | Competitor | Now |\r\n| 13 | Competitive Ad Research | Competitor | Pre-paid |\r\n| 14 | Side Projects | Free Tools | Q3+ |\r\n| 15 | Engineering as Marketing | Free Tools | Q3+ |\r\n| 16 | Importers as Marketing | Free Tools | SaaS-specific |\r\n| 17 | Quiz Marketing | Free Tools | Q2+ |\r\n| 18 | Calculator Marketing | Free Tools | Q3+ |\r\n| 19 | Chrome Extensions | Free Tools | Browser-relevant only |\r\n| 20 | Microsites | Free Tools | Q3+ |\r\n| 21 | Scanners | Free Tools | Specific products only |\r\n| 22 | Public APIs | Free Tools | Developer/dev tool products |\r\n| 23 | Podcast Advertising | Paid Ads | Post-budget |\r\n| 24 | Pre-targeting Ads | Paid Ads | Post-budget |\r\n| 25 | Facebook Ads | Paid Ads | Post-budget |\r\n| 26 | Instagram Ads | Paid Ads | Post-budget |\r\n| 27 | Twitter Ads | Paid Ads | Post-budget |\r\n| 28 | LinkedIn Ads | Paid Ads | Post-budget (B2B-strong) |\r\n| 29 | Reddit Ads | Paid Ads | Post-budget |\r\n| 30 | Quora Ads | Paid Ads | Post-budget |\r\n| 31 | Google Ads | Paid Ads | Post-budget |\r\n| 32 | YouTube Ads | Paid Ads | Post-budget |\r\n| 33 | Cross-Platform Retargeting | Paid Ads | Post-paid-firing |\r\n| 34 | Click-to-Messenger Ads | Paid Ads | Niche use cases |\r\n| 35 | Community Marketing | Social & Community | Q3+ |\r\n| 36 | Quora Marketing | Social & Community | Now |\r\n| 37 | Reddit Keyword Research | Social & Community | Now |\r\n| 38 | Reddit Marketing | Social & Community | Q2+ |\r\n| 39 | LinkedIn Audience | Social & Community | Now (B2B + founders) |\r\n| 40 | Instagram Audience | Social & Community | Q2+ |\r\n| 41 | X Audience | Social & Community | Depends on founder bandwidth |\r\n| 42 | Short Form Video | Social & Community | Q3+ |\r\n| 43 | Engagement Pods | Social & Community | Generally off-brand |\r\n| 44 | Comment Marketing | Social & Community | Q2+ |\r\n| 49 | Monthly Newsletters | Email | Q2+ (Acquisition use: subscriber capture) |\r\n| 54 | Affiliate Discovery via Backlinks | Partnerships | Q2+ |\r\n| 55 | Influencer Whitelisting | Partnerships | Post-paid-budget |\r\n| 56 | Reseller Programs | Partnerships | Q4+ |\r\n| 57 | Expert Networks | Partnerships | Q3+ |\r\n| 58 | Newsletter Swaps | Partnerships | Q2+ |\r\n| 59 | Article Quotes (HARO) | Partnerships | Now |\r\n| 60 | Pixel Sharing | Partnerships | Post-paid |\r\n| 61 | Shared Slack Channels | Partnerships | Q3+ |\r\n| 63 | Integration Marketing | Partnerships | Q3+ |\r\n| 64 | Community Sponsorship | Partnerships | Q2+ |\r\n| 65 | Live Webinars | Events | Q2+ |\r\n| 66 | Virtual Summits | Events | Q3+ |\r\n| 67 | Roadshows | Events | Q4+ |\r\n| 68 | Local Meetups | Events | Q3+ |\r\n| 69 | Meetup Sponsorship | Events | Q3+ |\r\n| 70 | Conference Speaking | Events | Now (if founder is speakable) |\r\n| 71 | Conferences (own-hosted) | Events | Q4+ |\r\n| 72 | Conference Sponsorship | Events | Q3+ |\r\n| 73 | Media Acquisitions | PR & Media | Series A+ |\r\n| 74 | Press Coverage | PR & Media | Now (if newsworthy) |\r\n| 75 | Fundraising PR | PR & Media | When fund closes |\r\n| 76 | Documentaries | PR & Media | Q4+ |\r\n| 77 | Black Friday Promotions | Launches | Q4 (seasonal) |\r\n| 78 | Product Hunt Launch | Launches | At GA or major feature |\r\n| 79 | Early-Access Referrals | Launches | Pre-launch or GA |\r\n| 80 | New Year Promotions | Launches | Q1 (seasonal) |\r\n| 81 | Early Access Pricing | Launches | GA |\r\n| 82 | Product Hunt Alternatives | Launches | Same as PH |\r\n| 83 | Twitter Giveaways | Launches | Generally off-brand |\r\n| 84 | Giveaways | Launches | Q3+ |\r\n| 85 | Vacation Giveaways | Launches | Q4+ (seasonal) |\r\n| 86 | Lifetime Deals | Launches | Generally off-brand (damages LTV math) |\r\n| 87 | Powered By Marketing | Product-Led | Q4+ |\r\n| 88 | Free Migrations | Product-Led | SaaS-specific |\r\n| 89 | Contract Buyouts | Product-Led | B2B SaaS only |\r\n| 97 | Playlists as Marketing | Content Formats | Q3+ |\r\n| 98 | Template Marketing | Content Formats | Q3+ |\r\n| 99 | Graphic Novel Marketing | Content Formats | Generally off-brand |\r\n| 100 | Promo Videos | Content Formats | Q3+ |\r\n| 101 | Industry Interviews | Content Formats | Q2+ |\r\n| 102 | Social Screenshots | Content Formats | Q2+ |\r\n| 103 | Online Courses | Content Formats | Q3+ |\r\n| 104 | Book Marketing | Content Formats | Q4+ |\r\n| 105 | Annual Reports | Content Formats | Q4+ |\r\n| 106 | End of Year Wraps | Content Formats | Q4 (seasonal) |\r\n| 107 | Podcasts (own-hosted) | Content Formats | Q3+ |\r\n| 108 | Changelogs | Content Formats | Q2+ |\r\n| 109 | Public Demos | Content Formats | Now |\r\n| 110 | Awards as Marketing | Unconventional | Q4+ |\r\n| 111 | Challenges as Marketing | Unconventional | Q3+ |\r\n| 112 | Reality TV Marketing | Unconventional | Generally off-brand |\r\n| 113 | Controversy as Marketing | Unconventional | Brand-dependent |\r\n| 114 | Moneyball Marketing | Unconventional | Ongoing methodology |\r\n| 115 | Curation as Marketing | Unconventional | Q2+ |\r\n| 116 | Grants as Marketing | Unconventional | Q4+ |\r\n| 117 | Product Competitions | Unconventional | Developer-specific |\r\n| 118 | Cameo Marketing | Unconventional | Generally off-brand |\r\n| 119 | OOH Advertising | Unconventional | Series A+ |\r\n| 120 | Marketing Stunts | Unconventional | Brand-dependent |\r\n| 121 | Guerrilla Marketing | Unconventional | Brand-dependent |\r\n| 122 | Humor Marketing | Unconventional | Brand-dependent |\r\n| 123 | Open Source as Marketing | Platforms | Developer products |\r\n| 125 | App Marketplaces | Platforms | Platform-specific |\r\n| 126 | YouTube Reviews | Platforms | Q3+ |\r\n| 127 | YouTube Channel | Platforms | Q3+ |\r\n| 128 | Source Platforms | Platforms | B2B SaaS only |\r\n| 129 | Review Sites | Platforms | Now |\r\n| 130 | Live Audio | Platforms | Q3+ |\r\n| 131 | International Expansion | International | Q4+ |\r\n| 133 | Investor Marketing | Developer/etc | Now (when raising) |\r\n| 138 | Podcast Tours | Audience-Specific | Q2+ |\r\n\r\n### Activation (8 entries)\r\n\r\n| # | Idea | Category | Typical stage available |\r\n|---|---|---|---|\r\n| 47 | Founder Welcome Email | Email | Q2+ (Activation use) |\r\n| 48 | Dynamic Email Capture | Email | Q2+ |\r\n| 51 | Onboarding Emails | Email | When UI is stable |\r\n| 90 | One-Click Registration | Product-Led | Now |\r\n| 91 | In-App Upsells | Product-Led | Q2+ (cross-cuts Revenue) |\r\n| 95 | Concierge Setup | Product-Led | Q3+ (high-value users) |\r\n| 96 | Onboarding Optimization | Product-Led | Now |\r\n| 124 | App Store Optimization | Platforms | Now (App Store products) |\r\n\r\n### Retention (8 entries)\r\n\r\n| # | Idea | Category | Typical stage available |\r\n|---|---|---|---|\r\n| 45 | Mistake Email Marketing | Email | Opportunistic |\r\n| 46 | Reactivation Emails | Email | Now |\r\n| 50 | Inbox Placement | Email | Now (technical setup) |\r\n| 52 | Win-back Emails | Email | Q1+ |\r\n| 53 | Trial Reactivation | Email | Q2+ (when paywall is firing) |\r\n| 94 | Offboarding Flows | Product-Led | Q2+ |\r\n| 135 | Support as Marketing | Developer/etc | Q2+ |\r\n| 134 | Certifications | Developer/etc | Q3+ (cross-cuts Referral) |\r\n\r\n### Referral (5 entries)\r\n\r\n| # | Idea | Category | Typical stage available |\r\n|---|---|---|---|\r\n| 62 | Affiliate Program | Partnerships | Now (when inbound exists) |\r\n| 79 | Early-Access Referrals | Launches | Pre-launch / GA |\r\n| 92 | Newsletter Referrals | Product-Led | Q3+ (if newsletter exists) |\r\n| 93 | Viral Loops | Product-Led | Q3+ |\r\n| 137 | Two-Sided Referrals | Audience-Specific | Q2+ |\r\n\r\n### Revenue (2 entries — most monetization is strategy not tactic)\r\n\r\n| # | Idea | Category | Typical stage available |\r\n|---|---|---|---|\r\n| 91 | In-App Upsells | Product-Led | Q2+ (cross-cuts Activation) |\r\n| 132 | Price Localization | International | Q4+ |\r\n\r\n> **Skipped from Revenue:** #86 Lifetime Deals appears under Launches (Acquisition section) only. It\'s generally off-brand for subscription products because it damages LTV math; recommend in Section 12\'s Skip list with rationale, not in stage totals.\r\n\r\n### Cross-cutting / brand foundation (2 entries)\r\n\r\n| # | Idea | Category | Typical stage available |\r\n|---|---|---|---|\r\n| 114 | Moneyball Marketing | Unconventional | Ongoing methodology |\r\n| 139 | Customer Language | Audience-Specific | Now (foundational) |\r\n\r\n### Developer-specific / dev tool products (2 entries)\r\n\r\n| # | Idea | Category | Use when |\r\n|---|---|---|---|\r\n| 117 | Product Competitions | Unconventional | Developer tool products |\r\n| 136 | Developer Relations | Developer/etc | Developer tool products |\r\n\r\n## How to apply this to a specific client\r\n\r\nFor Section 12 of the plan:\r\n\r\n### Step 1 — Filter for category fit\r\n\r\nFor each idea, ask:\r\n- Does this idea apply to the client\'s category? (e.g., #16 Importers only for SaaS; #19 Chrome Extensions only for browser-relevant; #136 DevRel only for dev tools)\r\n- Skip ideas that don\'t apply, with a note\r\n\r\n### Step 2 — Filter for brand voice\r\n\r\nFor each idea, ask:\r\n- Does this idea conflict with the client\'s brand voice?\r\n- Common conflicts:\r\n  - **Lifetime Deals (#86)** — conflicts with premium positioning\r\n  - **Twitter Giveaways (#83)** — often off-brand for serious / clinical / luxury voices\r\n  - **Humor Marketing (#122)** — off-brand for serious / clinical voices\r\n  - **Cameo Marketing (#118)** — off-brand for most voices\r\n  - **Reality TV Marketing (#112)** — off-brand for most voices\r\n\r\nIf conflict, place in Skip list with explicit rationale.\r\n\r\n### Step 3 — Set timing status\r\n\r\nFor ideas that pass filters, set status:\r\n- **Now (Q1)** — already in 90-day plan OR can run alongside without new capacity\r\n- **Q2** — post-bedrock-fix, post-foundation; second-quarter layer-in\r\n- **Q3+** — post-seed-close, post-GA; expansion moves\r\n- **Q4+** — long-game / large-investment\r\n\r\nUse the "Typical stage available" column as the default. Shift earlier if client has unusual capability (e.g., a celebrity founder shifts Conference Speaking #70 from "Now" to "Now and high-leverage").\r\n\r\n### Step 4 — Write the client-specific note\r\n\r\nEvery "Now / Q2 / Q3+" idea gets a one-line client-specific note. Examples:\r\n- For idea #11 Competitor Comparison Pages: "Quietude vs. Calm / Headspace / Brain.fm / Endel / Wavepaths — high-intent SERPs"\r\n- For idea #133 Investor Marketing: "Alex\'s seed raise — leverage angel backchannel for PR + intros"\r\n- For idea #15 Engineering as Marketing: "HRV interpretation guide; nervous system self-assessment; sound bath finder directory"\r\n\r\n### Step 5 — Sum the bank\r\n\r\nAfter all five AARRR tables + skip list:\r\n\r\n```markdown\r\n### Idea-bank summary\r\n\r\n- {Acquisition count} ideas applicable to Acquisition (the dominant stage at {client}\'s current stage)\r\n- {Activation count} to Activation, {Retention count} to Retention\r\n- {Referral count} to Referral\r\n- {Revenue count} to Revenue\r\n- {cross-cutting count} cross-cutting\r\n- {skipped count} ideas skipped for brand / business-model fit\r\n\r\n**What this proves:** the plan is roughly X% of the available tactical surface area, not 100%. {appropriate or not for the stage} — as capacity unlocks across Q2 → Q3 → Series A, the cross-reference becomes the inventory to scale activity without losing strategic coherence.\r\n```\r\n\r\n## How to maintain this doc\r\n\r\nIf `marketing-ideas` adds new ideas (it\'s a living skill — the 139 may become 145 or 160 over time):\r\n1. Read `skills/marketing-ideas/references/ideas-by-category.md` in the `marketingskills` repo\r\n2. Assign each new idea to a primary AARRR stage using the rules above\r\n3. Add to this doc\'s tables\r\n4. Update SKILL.md\'s idea-count reference\r\n\r\n## Sources\r\n\r\n- `skills/marketing-ideas/SKILL.md` (in the `marketingskills` repo)\r\n- `skills/marketing-ideas/references/ideas-by-category.md` (in the `marketingskills` repo)\r\n',
  },
  {
    skillId: "marketing-plan",
    path: "references/market-sizing.md",
    content: `# Market Sizing\r
\r
Adapted from a contribution by @imMamdouhaboammar (PR #418).\r
\r
Use this reference when the market-quality gate raises the question "is this market big enough to plan around?" or when the user asks directly how big a market is. The goal is a defensible range that supports a decision (enter, narrow, validate, or avoid). A precise-looking number with no visible math does more harm than an honest range.\r
\r
## Define the market first\r
\r
Sizing a vague category ("healthcare," "SaaS") produces a meaningless number. Before estimating anything, write a one-sentence market definition covering geography, buyer, use case, and price model.\r
\r
> AI note-taking tools for sales teams at English-speaking B2B SaaS companies with 20-500 employees, sold per seat.\r
\r
State what is out of scope too (adjacent segments, other geographies, enterprise).\r
\r
## TAM, SAM, SOM in plain terms\r
\r
| Layer | Plain meaning | Narrowed by |\r
|---|---|---|\r
| **TAM** (total addressable market) | Annual spend if every possible buyer of this category bought | Category definition only |\r
| **SAM** (serviceable addressable market) | The slice you could actually serve with your product as it exists | Geography, segment, use case, language, price band, integrations |\r
| **SOM** (serviceable obtainable market) | What you can realistically win in the next 1-3 years | Channels, budget, sales capacity, conversion rates, competition |\r
\r
SOM is the number that matters for a marketing plan. TAM mostly matters for fundraising narratives, and a large TAM proves nothing about demand. Size TAM only when someone needs it.\r
\r
## The four sizing methods\r
\r
The mini-examples below use one made-up product (an AI note-taker for sales teams) with illustrative numbers, to show the math. They aren't real market data.\r
\r
\r
No single method is reliable alone. Run at least two, then compare.\r
\r
### 1. Bottom-up\r
\r
\`reachable buyers × expected annual spend × realistic capture rate\`\r
\r
Best for local services, B2B niches, agencies, and marketplaces where buyers can be counted.\r
\r
**Mini-example** (sales note-taker, SAM):\r
- ~18,000 B2B SaaS companies in range (LinkedIn company filter, Crunchbase export)\r
- Average 8 sales seats each, $25/seat/month = $2,400/year per account\r
- SAM ≈ 18,000 × $2,400 = **~$43M/year**\r
- SOM at 1-2% capture by end of Year 1 = **$0.4M-$0.9M ARR**\r
\r
Weak points: the seat count and capture rate are assumptions. Label them as such.\r
\r
### 2. Search-led\r
\r
Estimate demand from high-intent keyword clusters, then apply click and conversion assumptions.\r
\r
**Mini-example:**\r
- High-intent cluster ("AI meeting notes for sales," "Gong alternative," "sales call summary tool"): ~9,000 searches/month across 40 terms\r
- Achievable click share at page-one rankings: 10-20% → 900-1,800 visits/month\r
- Visit-to-trial 4%, trial-to-paid 20% → 7-14 new accounts/month\r
- At $2,400/year per account: **~$0.2M-$0.4M new ARR/year** from search alone\r
\r
Search volume is an intent proxy. It measures people actively looking, which undercounts latent demand and categories buyers don't search for by name. CPC levels and competitor ad density show how much others will pay for that intent.\r
\r
### 3. Competitor-led\r
\r
Infer market size and maturity from what competitors visibly earn.\r
\r
**Mini-example:**\r
- 6 direct competitors; 2 report ARR publicly or via press (~$15M and ~$8M), the other 4 estimated from headcount (~40-80 staff each at ~$150K revenue per employee → ~$6M-$12M each)\r
- Combined visible revenue: **~$47M-$71M**\r
- Cross-check: review counts on G2 and Capterra, pricing pages, hiring pace, ad activity\r
\r
If the combined revenue of competitors is larger than your SAM estimate, your SAM is probably too narrow (or competitors serve segments you excluded). In this example, $47M-$71M exceeds the $43M bottom-up SAM, which suggests competitors also sell to enterprise or non-sales teams. If combined revenue is tiny, the category may be early or the demand may be weaker than it looks.\r
\r
### 4. Channel-led\r
\r
Size the market you can reach through specific channels with the current budget. This is often the most useful number for an early-stage plan because it bakes in execution limits.\r
\r
**Mini-example** (Seed stage, $10K/month paid budget):\r
- LinkedIn: target audience of ~60,000 sales leaders in segment; $10K/month at ~$80 CPL → ~125 leads/month → 10% to paid → ~12 accounts/month\r
- Outbound: 1 SDR, 1,000 accounts/month, 1.5% meeting rate, 25% close → ~4 accounts/month\r
- Combined: ~16 accounts/month ≈ **~$0.45M new ARR/year**, capped by budget and headcount\r
\r
### Triangulate and cross-check\r
\r
Put each method's result side by side for the same layer (usually SOM or SAM):\r
\r
| Method | SOM estimate (Year 1) | Key assumption | Confidence |\r
|---|---|---|---|\r
| Bottom-up | $0.4M-$0.9M | 1-2% capture | Medium |\r
| Search-led | $0.2M-$0.4M (search channel only) | 10-20% click share | Medium |\r
| Channel-led | ~$0.45M | $80 CPL holds at scale | Low |\r
\r
How to read the comparison:\r
- **Compare like with like.** The search-led figure covers one channel, so it's a floor for SOM rather than a competing estimate. Here, bottom-up and channel-led agree around $0.4M-$0.5M, and search alone gets about halfway there, which is consistent.\r
- **Estimates overlap** → the overlap is your working range.\r
- **Estimates differ by more than ~3×** → one assumption is broken. Find it before presenting any number.\r
- **Bottom-up far exceeds channel-led** → demand exists but the plan can't reach it yet. That points to a budget or channel constraint, which belongs in Section 10 (funding-stage unlocks).\r
- **Channel-led far exceeds bottom-up** → the reachable-buyer count is probably too low, or the channel assumptions are optimistic.\r
\r
Top-down analyst reports can serve as a sanity check on TAM. Don't use them as the primary method for a local or niche market, because global category figures rarely translate.\r
\r
## Evidence and confidence\r
\r
Label every estimate and every major input.\r
\r
| Label | Use when |\r
|---|---|\r
| **High** | Two or more independent evidence types agree, or first-party data (CRM, conversion data, paid search terms) supports it |\r
| **Medium** | Credible but incomplete evidence, e.g. competitors are active but their revenue is estimated |\r
| **Low** | Plausible inference with thin support, e.g. a global trend with unknown local adoption |\r
| **Unknown** | Missing or contradictory data. Turn it into a validation task |\r
\r
Rank evidence by how close it sits to real buyer behavior:\r
1. First-party commercial data (sales notes, CRM, conversion rates, churn reasons)\r
2. Observed market behavior (competitor ads, pricing pages, review volume, job posts)\r
3. Search and demand proxies (keyword volume, CPC, autocomplete)\r
4. Third-party reports (analyst, government, platform data)\r
5. Expert opinion (founder interviews, practitioner posts)\r
6. Weak proxies (uncited market-size claims, trend articles, AI summaries)\r
\r
### The presentation rule\r
\r
Never present a single precise market number without sources. Always show:\r
- A **range**, not a point estimate\r
- The **assumptions** behind it, listed separately from observed facts\r
- The **method(s)** used and whether they agree\r
- A **confidence label**\r
- The **one assumption** that would most change the answer, and how to test it\r
\r
Bad: "The market is $4.27B."\r
Good: "SAM is roughly $35M-$50M/year (medium confidence), based on bottom-up seat math and competitor revenue. The biggest swing factor is average seats per account; 10 customer calls would tighten it."\r
\r
## Market attractiveness scorecard\r
\r
Size alone doesn't make a market worth entering. Score each factor 1-5 and total out of 50.\r
\r
| Factor | 1 | 3 | 5 |\r
|---|---|---|---|\r
| Demand clarity | Pain is unclear | Pain exists, intent is mixed | Clear repeated buying or search behavior |\r
| Budget availability | No clear payer | Payer exists, value uncertain | Clear budget owner and spend precedent |\r
| Competitive weakness | Strong incumbents everywhere | Some gaps | Obvious gaps buyers care about |\r
| Reachability | Hard to target | Reachable with work | Easy to reach through known channels |\r
| Channel feasibility | Channels expensive or unclear | Some testable channels | Clear low-risk validation path |\r
| Urgency | Nice-to-have | Periodic need | Triggered, painful, time-sensitive |\r
| Proof availability | Hard to prove results | Some proof can be built | Strong proof is easy to show |\r
| Execution risk | Heavy regulatory or operational risk | Manageable constraints | Low risk |\r
| Speed to signal | Months to learn | 2-6 weeks | 7-14 days |\r
| Strategic fit | Weak fit with team and assets | Partial fit | Strong fit |\r
\r
| Total | Read | Plan implication |\r
|---|---|---|\r
| 40-50 | Enter now | Plan around the full SOM range |\r
| 30-39 | Enter narrowly | Pick one segment or wedge; size SOM for that wedge only |\r
| 20-29 | Validate first | Make the first 90 days a validation sprint with kill criteria |\r
| Below 20 | Avoid for now | Flag in Section 13 open decisions unless the team has a unique advantage |\r
\r
Use the scorecard alongside the problem size × frequency gate. A large SOM in the weak quadrant (small, infrequent problem) still constrains CAC and channel mix.\r
\r
## Where this feeds the plan\r
\r
- **Section 2 (Strategic frame)**: market definition, quadrant, attractiveness score\r
- **Section 8 (Revenue)** and **Section 10 (12-month outlook)**: SOM range as the ceiling for revenue targets\r
- **Section 13 (Open decisions)**: low-confidence or unknown inputs, each with a validation task\r
\r
## Common mistakes\r
\r
- Treating TAM as proof of demand\r
- Using a global report for a local-market decision\r
- Reading search volume as market size\r
- Presenting one method's output without a cross-check\r
- Ignoring substitutes and the status quo (spreadsheets, agencies, doing nothing), which compete for the same budget\r
`,
  },
  {
    skillId: "marketing-plan",
    path: "references/measurement-framework.md",
    content: `# Measurement Framework — KPIs, North Stars, Cadence\r
\r
Every plan needs a measurement section that tells the team how to know if the plan is working. This doc is the source for Section 13's measurement subsection.\r
\r
**Related docs:**\r
- \`growth-patterns.md\` — the 3-3-2-2-2 VC growth path (3× in years 1–2, 2× in years 3–7 from $1M ARR) and which phase of SaaS growth the company is in ($0–10K / $10K–100K / $100K–1M+)\r
- \`budget-planning.md\` — CAC calculation (blended, not paid-only) and the forecasting reality check (forecasts under $100M ARR are educated guesses, not precise predictions)\r
\r
## The north-star principle\r
\r
A north star is one metric that captures the business-model thesis at the highest level. It should:\r
- Be derivable from the funnel + revenue model\r
- Move slowly enough to be a strategic compass (not whipsawed by weekly noise)\r
- Trade off correctly against other metrics — improving the north star should generally improve the business\r
\r
Don't default to "ARR" or "MRR" alone. Those are outcomes, not norths. Pick something that captures the business model.\r
\r
## North-star patterns by business model\r
\r
### B2B SaaS (subscription)\r
- **Net Revenue Retention (NRR)** — keeps existing customers + expansion in focus\r
- Alternative: "Logo retention × expansion ARR"\r
- Why: ARR alone hides churn / lets gross-add growth mask product fit problems\r
\r
### D2C consumer app (subscription)\r
- **Blended LTV / blended CAC** — keeps unit economics honest as paid layer scales\r
- Alternative: "Day-35 paid users from cohort × LTV"\r
- Why: monthly subscription metrics are volatile; cohort × LTV smooths it\r
\r
### Hybrid hardware + software (e.g., Quietude)\r
- **Blended LTV / blended CAC across hardware + software** — captures the wedge thesis\r
- Alternative: "Hardware-buyers-to-subscriber conversion × blended margin"\r
- Why: hardware revenue isn't free (cost to make); subscription revenue isn't expensive to acquire if hardware funds it\r
\r
### Marketplace (two-sided)\r
- **Liquidity ratio × take-rate** — captures both sides + monetization\r
- Alternative: "Monthly transacting users × take-rate × repeat frequency"\r
- Why: GMV alone doesn't capture whether the marketplace is becoming a habit\r
\r
### Developer tool / open source\r
- **Weekly active developers × paid-conversion** — captures both adoption and monetization\r
- Alternative: "Weekly active orgs × seats per org × ARPU"\r
\r
### Content / media business\r
- **Daily active readers / listeners × ad revenue per session** — captures both reach and monetization\r
- Alternative: "Subscriber count × retention × ARPU"\r
\r
### Commerce (DTC, non-subscription)\r
- **Repeat purchase rate × AOV × frequency** — captures monetization layered on quality of customer\r
- Alternative: "Customer LTV / CAC × payback period"\r
\r
## Leading indicators by AARRR stage\r
\r
After the north star, every plan needs leading indicators per AARRR stage. These move faster than the north star and trigger investigations.\r
\r
### Acquisition leading indicators\r
- Organic visits/month, total + per pillar (SEO health)\r
- App Store / Play Store visit-to-install rate (ASO health)\r
- Founder-led social channel growth → email subscriber conversion (LinkedIn / X / Substack funnels)\r
- Event-to-app conversion rate (event ROI)\r
- Ambassador-attributed visits (referral funnel)\r
- Paid CAC by channel (when paid is firing)\r
\r
### Activation leading indicators\r
- Day 1 / Day 7 / Day 35 → paid conversion rate\r
- Onboarding session-completion rate\r
- First key-action completion (post-signup activation event)\r
- App Store conversion rate (install → trial → paid)\r
- Trial → paid conversion rate\r
\r
### Retention leading indicators\r
- Day 30 / Day 60 / Day 90 retention\r
- Monthly churn rate (gross + net)\r
- Lifecycle email engagement (open / click / unsubscribe by flow)\r
- Hardware → app activation rate (for hybrid businesses)\r
- Win-back / reactivation rate\r
\r
### Referral leading indicators\r
- Ambassador-attributed new subs (via Dub or similar)\r
- Share-after-value moment rate (% of users sharing)\r
- Two-sided referral completion rate\r
- Guides program referrals (when live)\r
- NPS score (if surveyed)\r
\r
### Revenue leading indicators\r
- ARPU by cohort\r
- Annual plan adoption %\r
- Cohort LTV by source\r
- Plan mix shifts\r
- Eye-mask / hardware attach rate (for hybrid)\r
- Expansion revenue (B2B)\r
\r
## Review cadence\r
\r
The plan should specify three rhythms:\r
\r
### Weekly (operational sync)\r
- **Who:** fCMO ↔ founder (CEO usually)\r
- **Duration:** 30 min\r
- **Format:** AARRR scoreboard (current vs. last week numbers across the leading indicators) + this week's ships + blockers\r
- **Output:** Action items, decisions made\r
\r
### Monthly (metrics review)\r
- **Who:** fCMO + founder + extended team (CXO, product lead, designer if applicable)\r
- **Duration:** 60–90 min\r
- **Format:** Full metrics review + comparison against quarterly KPI targets + qualitative learnings + idea bank reprioritization\r
- **Output:** Possible plan adjustments, hire decisions\r
\r
### Quarterly (plan recalibration)\r
- **Who:** fCMO + founders + key advisors\r
- **Duration:** 2–3 hours\r
- **Format:** Full plan review against 90-day and 12-month outcomes, channel-level analysis, funding-stage transition check, recalibration of next 90 days\r
- **Output:** Updated plan (could be v2 / v3 document iteration)\r
\r
## KPI target setting\r
\r
For each quarter in Section 10, the plan must include 3–5 specific KPI targets. These should be:\r
- **Specific** — not "improve retention," but "Day 30 retention from 22% → 30%"\r
- **Measurable** — pull from a wired data source\r
- **Stretch but plausible** — based on funnel state + historical patterns\r
- **Decision-triggering** — if missed, what does that mean? (Adjust strategy, kill a channel, etc.)\r
\r
### KPI target patterns by quarter\r
\r
**Q1 (foundation quarter):**\r
- Mostly *bedrock* metrics — fixing leaks. "Headphones-gate conversion drop reverses." "Day 1 → paid +25–50%."\r
- Some *foundation* metrics — laying tracks. "4 SEO pillars staked." "App Store rewrite shipped."\r
- Avoid bold growth targets — the foundations aren't in yet\r
\r
**Q2 (validation quarter):**\r
- Mostly *validation* metrics — does what we built work? "Paid CAC < $X blended." "Organic traffic 1,500–3,500/mo."\r
- Some *cohort* metrics — do new cohorts behave better? "Day 7 retention for Q2 cohort vs. Q1."\r
\r
**Q3 (scaling quarter):**\r
- Mostly *scaling* metrics — how far does it go? "Paid scaling to $20–30K/mo with CAC steady." "First B2B install reference case live."\r
- Some *capability* metrics — what new things are live? "First Guides pilot launched."\r
\r
**Q4 (compound quarter):**\r
- Mostly *compound* metrics — is the flywheel turning? "50%+ of new subs from non-paid channels." "Ambassador-driven 15–25% of new subs."\r
- Some *narrative* metrics — does the Series A story write itself? "Blended LTV/CAC > 3."\r
\r
## Anchoring against the VC growth path\r
\r
For VC-backed clients past $1M ARR, anchor 12-month and multi-year targets against the **3-3-2-2-2 rule** (3× in years 1 and 2, then 2× in years 3 through 7). Hitting it is rare; most companies don't. Anchoring against it forces the plan to either match it and show how, or explicitly defend choosing a slower trajectory. Full table and context in \`growth-patterns.md\`.\r
\r
For non-VC-backed companies (bootstrapped, founder-funded, profit-focused), the 3-3-2-2-2 doesn't apply. Use linear-pattern targets ("$X MRR added per month") or step-function targets ("$Y revenue jump after the enterprise tier launches") instead.\r
\r
## Forecasting reality check\r
\r
A plan derives a budget and an annual goal. It does not produce a 12-month month-by-month forecast that's reliably accurate to the dollar.\r
\r
**Unless the company is publicly traded, all forecasts are educated guesses.** No startup under $100M ARR consistently hits month-by-month forecasts. Quarterly review is when the plan adjusts — not when variance is treated as failure.\r
\r
What the plan commits to honestly:\r
- The annual goal is a defensible direction-of-travel\r
- The budget is the resource commitment that makes the goal plausible\r
- The 90-day roadmap (Section 9) is what's actionable now\r
- Month-to-month projection is illustrative, not promised\r
\r
Founders who over-engineer the forecast end up explaining variance every month instead of executing. The plan should resist this — name the annual target, the quarterly KPIs, and the kill criteria. Don't promise the month.\r
\r
Full context in \`budget-planning.md\`.\r
\r
## Kill criteria\r
\r
For every channel or initiative, the plan should specify when to stop. Often missing from plans, kill criteria force discipline.\r
\r
Examples:\r
- "If a paid channel has CAC > 2× target after 30 days at meaningful spend, pause."\r
- "If onboarding Variant 3 doesn't show statistically meaningful lift (or directional lift + congruent qualitative signal) after 4 weeks, move to Variant 1."\r
- "If lifecycle Flow 4 has open rate < 12% after 6 weeks, redo subject lines + audience segmentation."\r
\r
## Guardrail metrics\r
\r
Some metrics get a hard guardrail (cannot drop below threshold). Useful for protecting brand or unit economics during aggressive growth.\r
\r
Examples:\r
- "Brand voice complaint rate > 1% of customer feedback triggers content review."\r
- "Paid CAC > $X for two consecutive months pauses paid scaling pending audit."\r
- "App Store rating drops below 4.5 triggers product review."\r
\r
## Data sources mapping\r
\r
The plan should name where each metric comes from. This makes it auditable.\r
\r
| Metric | Source |\r
|---|---|\r
| Organic traffic | GA4 / Ahrefs |\r
| App Store conversion | App Store Connect |\r
| Funnel conversion (Day N → paid) | Internal analytics (Mixpanel / Amplitude) or App Store Connect cohort export |\r
| Retention | Customer.io segments + product analytics |\r
| MRR / ARR | Stripe (via MCP if wired) |\r
| Plan mix | Stripe |\r
| Lifecycle email metrics | Customer.io |\r
| Ambassador attribution | Dub.co |\r
| Hardware → app activation | Shopify + App Store + internal join |\r
| NPS | Survey tool (Customer.io / Typeform / SurveyMonkey) |\r
\r
## When data isn't wired\r
\r
If a metric can't currently be measured, flag it in Section 13's open decisions. Example:\r
\r
> "Hardware → app activation rate not currently visible in the App Store dashboard. Requires Shopify ↔ App Store Connect join. Q1 work item."\r
\r
A plan with un-measurable goals is a plan that can't be validated. Surface the instrumentation work explicitly.\r
\r
## Reporting cadence + automation\r
\r
Where possible, auto-generate the metrics review rather than building it manually each time. Stripe MCP + GA4 MCP + Customer.io MCP can pull most of what's needed.\r
\r
For Tier 1 clients, a simple weekly metrics email to the team (Markdown table, generated via skills + MCPs) costs nothing and creates discipline.\r
\r
For Tier 2+ clients, consider a real dashboard (Hex, Metabase, Looker, or internal tool).\r
`,
  },
  {
    skillId: "marketing-plan",
    path: "references/methodology.md",
    content:
      "# Methodology — How a Marketing Plan Gets Made\r\n\r\nThe three-phase workflow that produces a comprehensive marketing plan. SKILL.md is the orchestration layer; this is the operational detail.\r\n\r\n## Phase 1 — INIT (research + intake)\r\n\r\n**Goal:** Walk into Phase 2 with enough context to draft every section without guessing.\r\n\r\n### Step 1.1 — Set up the plan folder\r\n\r\nCanonical file layout for every plan:\r\n\r\n```\r\n~/marketing-plans/{client-slug}/\r\n├── materials/         # Client-provided files (decks, audit output, brand-voice doc, etc.)\r\n├── research.md        # Written in Phase 1 (INIT)\r\n├── progress.md        # State machine — see Step 1.1.1 for schema\r\n├── sections/\r\n│   ├── 01.md          # Executive summary (written last, ordered first)\r\n│   ├── 02.md          # Strategic frame\r\n│   ├── ...\r\n│   └── 13.md          # Measurement, RACI, open decisions, appendix\r\n└── final_plan.md      # Compiled deliverable (Phase 3 output)\r\n```\r\n\r\n### Step 1.1.1 — `progress.md` state schema\r\n\r\nEvery plan tracks a single `progress.md` file at the plan root. It's the source of truth for resumption. Schema:\r\n\r\n```markdown\r\n# {Client} — Marketing Plan Progress\r\n\r\nphase: init | review | finalize | finalized\r\ncurrent_section: <number, only meaningful during review phase>\r\nplan_version: v1\r\nlast_updated: YYYY-MM-DD HH:MM\r\n\r\n## Sections completed\r\n- [ ] 2. Strategic frame\r\n- [ ] 3. Current state\r\n- [ ] 4. Acquisition\r\n- [ ] 5. Activation\r\n- [ ] 6. Retention\r\n- [ ] 7. Referral\r\n- [ ] 8. Revenue\r\n- [ ] 9. 90-day roadmap\r\n- [ ] 10. 12-month outlook\r\n- [ ] 11. Marketing operations stack\r\n- [ ] 12. Tactical idea bank\r\n- [ ] 13. Measurement, RACI, open decisions, appendix\r\n- [ ] 1. Executive summary (synthesized last)\r\n\r\n## Approved artifacts\r\nsections/02.md, sections/03.md, ... (list as they're written)\r\n\r\n## Notes\r\n<any open decisions, blockers, or out-of-band context that aren't in research.md>\r\n```\r\n\r\n### Step 1.1.2 — Resumption decision tree\r\n\r\n**Path safety (applies to every step below).** `{client-slug}` is the client name slugified to lowercase `[a-z0-9-]` only — reject `..`, `/`, and absolute paths, and never read, create, or delete outside `~/marketing-plans/`.\r\n\r\nOn every invocation, check state in this order:\r\n\r\n1. **No `{client-slug}/` folder** → fresh plan. Create folder + `materials/` + empty `sections/`. Start INIT (Step 1.2).\r\n2. **Folder exists, no `research.md`** → INIT was interrupted. Resume from Step 1.2.\r\n3. **`research.md` exists, no `progress.md`** → INIT done, REVIEW not started. Create `progress.md`, start REVIEW from Section 2.\r\n4. **`progress.md` exists, `phase: review`** → REVIEW in progress. Resume from `current_section` (or first unchecked box).\r\n5. **`progress.md` exists, `phase: finalize`** → FINALIZE was interrupted. Re-run Phase 3.\r\n6. **`progress.md` exists, `phase: finalized`** → plan is done. **Do not silently overwrite.** Ask the user: *\"This plan is finalized (v{N}). Want to (a) revise it as v{N+1}, (b) start a fresh plan in a new folder, or (c) re-open a specific section?\"*\r\n\r\nUpdate `phase` and `last_updated` whenever state changes.\r\n\r\n### Step 1.2 — Read existing materials\r\n\r\nIf `materials/` has files, read all of them. Common drops:\r\n- Pitch deck / investor deck\r\n- Positioning doc / brand voice doc\r\n- Customer research / ICP doc\r\n- App Store metrics / analytics snapshot\r\n- Lifecycle email inventory\r\n- Prior audit output (any scored current-state assessment the team has run)\r\n- SEO research (`seo/plan.md`, `seo/keyword-shortlist.md`)\r\n- Kickoff call transcript\r\n- Founder Slack / async notes\r\n\r\nRead everything. Capture key facts to `research.md` as you go.\r\n\r\n### Step 1.3 — Pull live data where wired\r\n\r\nIf MCPs/APIs are wired for this client, pull:\r\n\r\n- **Ahrefs** → domain rating, organic keywords, backlinks, top pages, ref domains (per `/seo-audit` skill)\r\n- **GA4 MCP** → traffic by channel, conversion events, retention curves\r\n- **Stripe MCP** → MRR, ARR, churn, plan mix, blended LTV by cohort\r\n- **App Store Connect** (manual or `dev-browser`) → install → trial → paid funnel; cohort retention\r\n- **Customer.io MCP** → flow inventory, send / open / click / unsubscribe rates\r\n- **Shopify** → product page conversion, AOV, repeat rate\r\n- **GitHub MCP** → repos inventory, last commit dates, what's stale\r\n- **Notion** → internal knowledge directory if exposed\r\n\r\nDon't ask the user to copy/paste data that can be pulled directly.\r\n\r\n### Step 1.4 — Conduct structured intake\r\n\r\nFor every gap in the materials, ask the user. The minimum intake covers ten topics:\r\n\r\n#### Intake 1 — Client overview\r\n- What does the company do, in one sentence (founder's words)?\r\n- What's the primary product?\r\n- What other products / SKUs / tiers exist?\r\n- Is the product live, beta, or pre-launch?\r\n- If beta: throttling? GA timeline?\r\n\r\n#### Intake 2 — ICP\r\n- Who are you for, in one sentence?\r\n- What do they say they want?\r\n- What do they actually want?\r\n- What's their stated problem? Their real problem?\r\n- Demographics / firmographics: who fits the ICP exactly?\r\n\r\n#### Intake 3 — Funnel state today\r\n- What are the current funnel numbers? (signups, activations, paid, retention)\r\n- What's the funnel *shape* — is it bottle-necked at top, middle, or bottom?\r\n- What's the biggest leak?\r\n\r\n#### Intake 4 — Funding state\r\n- Current round (pre-seed / seed / Series A / etc.)?\r\n- Total raised to date?\r\n- Current burn / runway?\r\n- Active raise? Closing when?\r\n- Investors of note?\r\n- Permission to mention fCMO engagement in pitches?\r\n\r\n#### Intake 5 — Team\r\n- Founders and what each owns (product, marketing, sales, etc.)?\r\n- Other roles on the team and their marketing surface area?\r\n- Advisors who touch marketing?\r\n- Agencies / contractors / fractionals?\r\n- Where are the obvious gaps?\r\n- For the team's current marketing owner (if there is one): is the shape π-shaped (two deep skill sets), T-shaped (one deep, broad), or tactical-only? See `team-and-agency-model.md` for the framework that informs Section 11 RACI and the first-hire recommendation in Section 9.\r\n\r\n#### Intake 6 — Budget\r\n- Current monthly marketing spend, broken down: paid acquisition, tools, retainers, headcount?\r\n- Budget tier this maps to (see `funding-stage-unlocks.md`)?\r\n- What budget unlocks when the next round closes?\r\n- Blended CAC if known (including salaries, content costs, tools, retainers — not just paid ad spend). If unknown, flag as the top Section 13 open decision — every revenue projection depends on it.\r\n- ARPC, annual retention rate (or churn rate), so the budget math in `budget-planning.md` can be applied to Section 8 (Revenue) and Section 10 (12-month outlook).\r\n\r\n#### Intake 7 — Channels currently active\r\n- Acquisition: organic SEO, paid search, paid social, content, social, partnerships, events, PR, ambassadors, etc. — for each, status (live / paused / never tried)\r\n- Activation: onboarding state, signup flow, paywall, first-session experience, app store listing\r\n- Retention: lifecycle email state, in-app upsells, churn cohort\r\n- Referral: program existence, attribution, inbound interest\r\n- Revenue: pricing structure, plan mix, recent experiments\r\n\r\n#### Intake 8 — Already done\r\nWhat past work should this plan acknowledge?\r\n- Major launches and dates\r\n- PR moments and who covered\r\n- Content pillars / hubs / cornerstone pieces\r\n- Partnerships\r\n- Awards / certifications\r\n- Notable customers / users (if consumer-named users)\r\n- Past advisors / fractionals\r\n\r\n#### Intake 9 — In-flight and stuck\r\n- What's drafted but not shipped? Why?\r\n- What's been \"almost ready\" for months?\r\n- What's blocking each?\r\n- What's broken or actively harmful?\r\n\r\n#### Intake 10 — Strategic posture\r\n- The most important thing to fix this quarter (founder's read)\r\n- The most important thing to ignore this quarter (founder's read)\r\n- What investors / board are asking about most\r\n- Any constraints not visible elsewhere (legal, partnership-related, brand-related)\r\n\r\n### Step 1.5 — Score current state against the rubric\r\n\r\nUse the 17-section rubric in `references/current-state-rubric.md` as your scoring lens. Two modes:\r\n\r\n- **From rich materials.** When the team has shared decks, prior content audits, an existing brand voice doc, recent positioning work, or a kickoff call transcript — score from those. Mark \"scored from materials\" in the section heading.\r\n- **From a separately scored audit.** If the team already has a scored current-state assessment (in any format), ingest those numbers directly. Don't redo the work.\r\n\r\nEither way, the output is the scored 17-row table that becomes Section 3 of the plan, followed by a 2–4 sentence \"shape interpretation\" calling out where strengths and gaps cluster.\r\n\r\n### Step 1.6 — Write research.md\r\n\r\nCompile everything into `research.md` with this structure:\r\n\r\n```markdown\r\n# {Client} — Marketing Plan Research Record\r\n\r\n**Date:** YYYY-MM-DD\r\n**Author:** (fCMO / planner name)\r\n\r\n## Company snapshot\r\n- One-sentence description\r\n- Stage (pre-seed / seed / Series A / etc.)\r\n- Product status (beta / GA)\r\n\r\n## ICP\r\n- Primary ICP\r\n- Stated vs. actual problem\r\n- Demographics / firmographics\r\n\r\n## Funnel state today\r\n- Current numbers\r\n- Funnel shape\r\n- Biggest leak\r\n\r\n## Funding\r\n- Total raised\r\n- Current round status\r\n- Runway\r\n\r\n## Team\r\n- Founders and ownership\r\n- Marketing surface area by person\r\n- Gaps\r\n\r\n## Current marketing budget\r\n- $/mo total\r\n- Breakdown\r\n- Tier mapping\r\n\r\n## Channels currently active\r\n[By AARRR stage]\r\n\r\n## Already done (acknowledge in plan)\r\n[List]\r\n\r\n## In-flight and stuck\r\n[List with blockers]\r\n\r\n## Strategic posture\r\n- Founder's top priority\r\n- Founder's top de-prioritization\r\n- Investor pressure points\r\n- Constraints\r\n\r\n## Current-state rubric scores\r\n[17 section scores using `references/current-state-rubric.md`. If a prior scored audit exists, paste those scores. Otherwise mark \"scored from materials.\"]\r\n\r\n## Materials read\r\n[List of files in materials/ + when read]\r\n```\r\n\r\nSave. Move to Phase 2.\r\n\r\n---\r\n\r\n## Phase 2 — REVIEW (section-by-section drafting)\r\n\r\n**Goal:** Walk through all 13 sections of the plan template (`references/plan-template.md`), drafting each, getting user confirmation, saving as you go.\r\n\r\n### Step 2.1 — Initialize progress.md\r\n\r\nUse the schema defined in Step 1.1.1 above. Set `phase: review`, `current_section: 2`, `plan_version: v1`, and stamp `last_updated`.\r\n\r\n### Step 2.2 — Walk each section in this order: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, then 1\r\n\r\nSection 1 (Executive Summary) is drafted **last** because it depends on every other section's conclusions. Walk Sections 2 → 13 in numeric order, then synthesize Section 1 from the others. The final compiled `final_plan.md` is always presented in canonical order 1 → 13.\r\n\r\nFor each section, use the template at `references/plan-template.md` to draft. Then in chat:\r\n\r\n1. Present the draft (or key bullets — short sections inline, long sections as bullet outline first)\r\n2. Ask: *\"Approve, adjust, or expand?\"*\r\n3. Iterate until user confirms\r\n4. Save the confirmed text to `sections/01.md` ... `sections/13.md` (one file per section, zero-padded for sort order). This is the canonical persisted artifact — recovery depends on it.\r\n5. Check the box in `progress.md`\r\n6. Move to next section\r\n\r\n### Step 2.3 — Section-specific guidance\r\n\r\n**Section 1 (Executive summary)** is synthesized from Sections 2–13 after they're all approved. Draft it last; present it first in the output document.\r\n\r\n**Section 3 (Current state)** uses the embedded 17-section rubric in `references/current-state-rubric.md`. If a prior scored audit exists, paste those scores in. If not, score from available materials.\r\n\r\n**Sections 4–8 (AARRR)** each follow the same internal structure: current state, the plan (numbered moves), 90-day moves, 12-month outlook, skills + tools. Don't skip the skills + tools sub-section — it's what makes the plan operationally honest.\r\n\r\n**Section 11 (Marketing operations stack)** is auto-generatable from `references/ops-stack-mapping.md` plus the specific moves named in Sections 4–8.\r\n\r\n**Section 12 (Idea bank)** is auto-generatable from `references/idea-cross-reference.md` plus client-specific filters (skip ideas that conflict with brand voice; status moves based on funding-stage timing).\r\n\r\n**Section 13** lives at the end. Open decisions should be ranked by impact. Appendix should reference only files the team can access (warn about machine-local paths).\r\n\r\n### Step 2.4 — Brand voice consistency\r\n\r\nIf the client has documented brand voice rules (captured in research.md / Section 2), every section must respect them. Common voice constraints:\r\n- Vocabulary rules (YES / NO lists)\r\n- CTA rules (e.g., \"never pressure\")\r\n- Initiatory vs. explanatory framing\r\n- Tone (e.g., authoritative-yet-accessible, intimate-yet-professional)\r\n\r\nIf a section's draft violates the brand voice, redo it before showing it to the user.\r\n\r\n---\r\n\r\n## Phase 3 — FINALIZE (compile + verify + publish)\r\n\r\n**Goal:** Produce `final_plan.md` and optionally publish to a shared repo.\r\n\r\n### Step 3.1 — Compile\r\n\r\nSet `phase: finalize` in `progress.md` before starting. Concatenate `sections/01.md` through `sections/13.md` into `final_plan.md` (canonical order 1 → 13, regardless of drafting order). Add:\r\n- Title header with date and \"v1\" version marker\r\n- \"Prepared by / For / Date / Status\" frontmatter\r\n- Section anchors that work in Notion paste\r\n\r\n### Step 3.2 — Verification pass\r\n\r\nBefore printing:\r\n\r\n- **Cross-reference check** — every marketing-ideas number (e.g., \"idea #17\") matches the actual idea in `references/idea-cross-reference.md`. Every related-skill mention either exists in the `marketingskills` repo or is documented as an external dependency (see ops-stack-mapping note on cross-marketplace skills).\r\n- **MCP/API check** — every tool mentioned in Section 11 actually exists in the user's stack (per research.md intake) OR is flagged as \"future / not yet wired.\"\r\n- **Path check** — no machine-specific paths (`/Users/...`, `/home/...`) in the output. Replace with descriptive references.\r\n- **Voice check** — final read against brand voice rules. Flag and fix violations.\r\n- **Open-decisions check** — every \"TBD\" or unanswered question from intake is listed in Section 13's open decisions, not hidden in the body.\r\n- **Acknowledge check** — every item from \"already done\" in research.md is acknowledged somewhere in the plan.\r\n\r\n### Step 3.3 — Print\r\n\r\nOutput `final_plan.md` to the plan folder. Print a summary to chat:\r\n\r\n> *\"Marketing Plan v1 saved to `~/marketing-plans/{client-slug}/final_plan.md`. ~X,XXX words across 13 sections. Ready to paste into Notion or share with the team.\"*\r\n\r\n### Step 3.4 — Publish (optional)\r\n\r\nAsk the user:\r\n> *\"Want me to publish this to a shared GitHub repo so the team can access it? If yes, what's the target repo and path (e.g., `{client-org}/{client-context}/marketing/plan.md`)?\"*\r\n\r\nIf yes:\r\n- Clone (or assume cloned) target repo\r\n- Check out a feature branch or push direct to main per user's preference\r\n- Copy `final_plan.md` to the target path\r\n- Adjust the appendix to use repo-relative paths (not machine paths)\r\n- Commit + push\r\n- Confirm with commit URL\r\n\r\nIf no: leave it local. Done.\r\n\r\n### Step 3.5 — Mark finalized\r\n\r\nSet `phase: finalized` in `progress.md` and stamp `last_updated`. This is the terminal state and prevents future `/marketing-plan` invocations from silently overwriting the plan (see Step 1.1.2 case 6).\r\n\r\n---\r\n\r\n## Resuming a plan\r\n\r\nResumption is governed entirely by the decision tree in Step 1.1.2 above — always check state in that order on every invocation.\r\n\r\nIf the user says *\"start over\"* → ask whether they want to delete the existing folder or move it to `archive/` first; don't silently overwrite.\r\nIf the user says *\"redo Section X\"* → uncheck that box in `progress.md`, delete `sections/0X.md`, and re-draft.\r\n\r\n## Failure modes to watch for\r\n\r\n- **Skipping intake.** A plan written without proper intake is generic and won't survive contact with the founder. Always do the full ten-topic intake unless the user explicitly waives it.\r\n- **Pretending data exists.** If you can't confirm a number (current MRR, retention rate, etc.), don't guess. Mark it `[TBD — to confirm with team]` in the plan and add to open decisions.\r\n- **Ignoring the brand voice.** If the client has a strong voice (most do), every section must respect it. Read the voice rules before drafting any copy-adjacent text.\r\n- **Padding the idea bank.** Section 12 is comprehensive only if it includes the skip list with reasons. Don't pad with ideas that clearly don't fit just to hit the 139.\r\n- **Glossing over uncomfortable metrics.** If churn is high or activation is low, name it in Current State. Founders read past sugar-coating.\r\n- **Forgetting funding-stage logic.** If the client is mid-raise, the plan must explain what changes when the round closes. Skipping this turns a plan into a wish-list.\r\n",
  },
  {
    skillId: "marketing-plan",
    path: "references/ops-stack-mapping.md",
    content:
      "# Marketing Operations Stack — Skills + MCPs per AARRR Stage\r\n\r\nThis doc maps every marketing-skill and every relevant MCP/API integration to the AARRR stage(s) it primarily serves. It's the source for Section 11 of every plan.\r\n\r\n> **Note on scope.** Skills below live in this `marketingskills` repo. A few references point to optional tools from adjacent Claude Code marketplaces (e.g., `vercel:agent-browser`, `compound-engineering:diagram-maker`) — substitute equivalents if not installed. When a plan references a skill or tool that isn't available, fall back to the underlying tactic and call it out in Section 13's open decisions.\r\n\r\n## The thesis\r\n\r\nA small team + fCMO + agentic tooling = output of a 15–20-person traditional marketing org. The skills + MCPs encode workflows that previously required dedicated headcount per channel.\r\n\r\nThe plan's Section 11 makes this thesis explicit by:\r\n1. Mapping skills to stages so the founder sees which skills execute which work\r\n2. Mapping MCPs/APIs to stages so the founder sees the tooling layer\r\n3. Naming a concrete operational example that proves the stack works\r\n4. Showing capability unlocks by funding stage (pre-seed → seed → Series A)\r\n\r\n## Marketing skills mapped to AARRR\r\n\r\n### Acquisition skills\r\n\r\n| Skill | What it does | Primary use in Acquisition |\r\n|---|---|---|\r\n| `seo-audit` | Audit site for technical and on-page SEO | Quarterly site health checks |\r\n| `ai-seo` | Optimize content for AI search engines / LLM citation | Future-proof content strategy |\r\n| `programmatic-seo` | Build template-driven SEO pages at scale | Location, comparison, integration page systems |\r\n| `schema` | Add structured data markup | Rich snippets, eligibility for AI citation |\r\n| `content-strategy` | Plan content topics, pillars, cadence | Setting the editorial calendar |\r\n| `competitors` | Build vs-pages and alternative-to-pages | Capture high-intent SERPs against competitors |\r\n| `ads` | Plan and structure paid campaigns | Apple Search Ads, Meta, Google, LinkedIn |\r\n| `ad-creative` | Generate ad variations and creative | Iterate ad creative across platforms |\r\n| `social` | Plan and write social media content | LinkedIn, Twitter/X, Instagram, TikTok |\r\n| `typefully` | Schedule/post tweets, threads, LinkedIn content | Cadence operations for founder-led channels |\r\n| `cold-email` | Write B2B cold outreach + sequences | Outbound for B2B SaaS / hybrid businesses |\r\n| `analytics` | Set up tracking, GA4, conversion events | Funnel instrumentation |\r\n| `free-tools` | Plan engineering-as-marketing free tools | Build tools that generate links + leads |\r\n| `marketing-website-design` | Design marketing sites with intention | Pillar/landing page design |\r\n| `launch` | Plan and execute launches (Product Hunt, GA, feature launches) | GTM moments — strategy + tactical execution |\r\n\r\n### Activation skills\r\n\r\n| Skill | What it does | Primary use in Activation |\r\n|---|---|---|\r\n| `onboarding` | Optimize user onboarding flows | Onboarding rebuild, activation rate tests |\r\n| `signup` | Optimize signup/registration | Reduce friction at top of activation |\r\n| `cro` | Optimize any marketing page or form | Conversion testing across pages, forms, landing pages |\r\n| `paywalls` | Optimize paywalls and upgrade screens | Trial → paid conversion (also Revenue) |\r\n| `popups` | Optimize popups, modals, slide-ins | Lead capture + activation prompts |\r\n| `copywriting` | Write marketing copy | Onboarding screens, paywall copy, CTAs |\r\n| `copy-editing` | Edit and improve existing copy | Voice / clarity pass before ship |\r\n| `copycraft` | Real-time copy variation overlay | Live copy iteration during reviews |\r\n| `website-copy` | Write full website copy (stage-8 from CF process) | Comprehensive site copy production |\r\n| `ab-testing` | Plan A/B tests | Structure for onboarding variant tests |\r\n| `marketing-psychology` | Apply behavioral science to copy and CRO | Persuasion principles in activation moments |\r\n\r\n### Retention skills\r\n\r\n| Skill | What it does | Primary use in Retention |\r\n|---|---|---|\r\n| `emails` | Design email sequences | Customer.io / Mailchimp / Resend flow building |\r\n| `churn-prevention` | Build cancellation flows, save offers, win-back | Reduce churn, recover failed payments |\r\n| `copywriting` / `copy-editing` | Email copy production | Lifecycle email content |\r\n| `paywalls` | (cross-cuts) — upgrade prompts in retention emails | Upsell within lifecycle |\r\n| `ab-testing` | Test email variants | Subject line, CTA, timing tests |\r\n\r\n### Referral skills\r\n\r\n| Skill | What it does | Primary use in Referral |\r\n|---|---|---|\r\n| `referrals` | Plan and launch referral / affiliate / ambassador programs | Core skill for Section 7 |\r\n| `social` | Create ambassador-shareable content | Talking points, post templates |\r\n| `copywriting` | Ambassador / affiliate email copy | Recruitment, onboarding, communication |\r\n| `marketing-website-design` | Per-ambassador landing pages | Attribution surface |\r\n| `emails` | Ambassador lifecycle emails | Onboarding, monthly digest, payout notifications |\r\n\r\n### Revenue skills\r\n\r\n| Skill | What it does | Primary use in Revenue |\r\n|---|---|---|\r\n| `pricing` | Audit and optimize pricing | Plan tier structure, annual defaults, value metrics |\r\n| `paywalls` | Paywall optimization | Trial → paid, free → paid conversion |\r\n| `sales-enablement` | Build sales decks, one-pagers, demos | B2B sales support material |\r\n| `revops` | Revenue operations, lead lifecycle | Marketing → sales handoff |\r\n| `ab-testing` | Pricing experiments | Test annual default, intro pricing, tier consolidation |\r\n\r\n### Cross-cutting / brand foundation skills\r\n\r\n| Skill | What it does | Primary use |\r\n|---|---|---|\r\n| `product-marketing` | Set up the `.agents/product-marketing.md` context file (positioning, ICP, voice) | Foundational — run first; every section of the plan references this |\r\n| `customer-research` | Conduct customer interviews + surveys | Section 2 + Section 3 (Current state) |\r\n| `marketing-psychology` | Apply behavioral science | Cross-cuts copy, CRO, paywalls |\r\n| `marketing-ideas` | The 139-idea library | Section 12 of plan (Idea bank) |\r\n\r\n## MCPs and APIs mapped to AARRR\r\n\r\n### Acquisition tooling\r\n\r\n| Tool | What it provides | Wired-at-client check |\r\n|---|---|---|\r\n| **Ahrefs API** | SEO data: keyword research, backlinks, competitor analysis | Required `AHREFS_API_KEY` in `.env` |\r\n| **DataForSEO API** | SERP data, keyword volume, competitor SERP analysis | Required API key |\r\n| **GA4 MCP** | Traffic by channel, conversion events, retention curves | Wired via gcp project + service account |\r\n| **GitHub MCP** | Repo work: marketing site (`site-name-promo` patterns), content authoring | Standard `gh` CLI auth + MCP server |\r\n| **Typefully MCP** | Social posting (LinkedIn, X, Threads, Bluesky) | Typefully account + API key |\r\n| **Google Ads MCP** | Ad account management, campaign creation, performance pulls | Wired post-budget-unlock |\r\n| **agent-browser** | Browser automation (form fills, screenshots, scraping) | CLI install: `npm install -g agent-browser` |\r\n| **dev-browser** | General-purpose browser automation | MCP server install |\r\n| **defuddle** | Clean markdown extraction from web pages | CLI install |\r\n| **Notion** | Internal knowledge directory access | Notion API key |\r\n| **Stripe MCP** | LTV math, paid-CAC reconciliation (cross-cuts to Revenue) | Stripe account + restricted key |\r\n\r\n### Activation tooling\r\n\r\n| Tool | What it provides |\r\n|---|---|\r\n| **App Store Connect** | Conversion rate by listing variant, install funnel | Usually manual + `dev-browser` for screenshots |\r\n| **GitHub MCP** | Mobile app repo for onboarding code edits |\r\n| **Figma / Pencil MCP** | Onboarding screen design + iteration |\r\n| **Customer.io MCP** | In-app messaging + lifecycle email coordination |\r\n| **Stripe MCP** | Subscription state for paywall logic |\r\n| **GA4 MCP** | Activation events instrumentation |\r\n\r\n### Retention tooling\r\n\r\n| Tool | What it provides |\r\n|---|---|\r\n| **Customer.io MCP** | The retention infrastructure — flow building, segmentation, sending |\r\n| **Shopify** | Hardware buyer events as lifecycle triggers |\r\n| **Stripe MCP** | Subscription state, churn cohorts, plan changes |\r\n| **GA4 MCP** | Session events, retention curves |\r\n| **Resend / Mailchimp / SendGrid** | Alternatives to Customer.io for different stacks |\r\n\r\n### Referral tooling\r\n\r\n| Tool | What it provides |\r\n|---|---|\r\n| **Dub.co** | Ambassador attribution, short links, per-ambassador tracking |\r\n| **Stripe MCP** | Commission accounting + payouts via Connect |\r\n| **GitHub MCP** | Per-ambassador landing pages |\r\n| **Customer.io MCP** | Ambassador lifecycle (recruitment → onboarding → monthly digest → payout notifications) |\r\n| **Rewardful / Tolt / Mention Me** | Alternatives to Dub for affiliate management |\r\n\r\n### Revenue tooling\r\n\r\n| Tool | What it provides |\r\n|---|---|\r\n| **Stripe MCP** | Pricing tests, subscription analytics, churn cohort analysis, blended CAC math |\r\n| **Shopify** | Hardware transactions |\r\n| **GA4 MCP** | Revenue events |\r\n| **Customer.io MCP** | Paywall / pricing-related lifecycle |\r\n| **Notion** | Commercial knowledge directory |\r\n\r\n### Cross-cutting tooling\r\n\r\n| Tool | What it provides |\r\n|---|---|\r\n| **Notion** | Shared knowledge base |\r\n| **GitHub MCP** | Shared context repo (`{client-org}/{client-context}`) |\r\n| **defuddle** | Research extraction |\r\n| **obsidian-cli** | Working notes for fCMO |\r\n| **Pencil MCP** | Design files |\r\n| **Figma MCP** | Design files (if Figma) |\r\n\r\n## Capability unlocks by funding stage\r\n\r\nThe plan's Section 11 must include this table (or equivalent), specific to the client's current and projected funding stages.\r\n\r\n| Stage | Headcount | Tooling | Channels live |\r\n|---|---|---|---|\r\n| **Pre-seed / bootstrapped** | fCMO + founder team | All current tooling + marketing-skills library + MCP layer | Organic only (SEO, content, App Store, founder-led social, events, WOM, ambassador) |\r\n| **Seed close** | + first marketing hire (lifecycle/content owner) | + paid ad accounts (Apple Search Ads, Meta, LinkedIn) + `ads` skill activated | + paid acquisition pilot ($5–15K/mo — see `funding-stage-unlocks.md` for canonical tiers) |\r\n| **Seed deployment** | + designer (potentially fractional) | + analytics expansion (Mixpanel / Amplitude if needed) | + paid scaling ($20–50K/mo) + first launches (PH, GA) |\r\n| **Series A** | + performance marketing lead + content lead | + dedicated tooling spend ($2–5K/mo software) + sponsored event budget | + paid scaling ($50–150K/mo) + international consideration + B2B vertical expansion |\r\n| **Series B+** | Full-stack marketing org (10+ people) | + agency partnerships + PR firm | + brand campaigns + acquisitions + sponsorships at category level |\r\n\r\n## The concrete-example test\r\n\r\nSection 11 of the plan must include at least one concrete operational example that proves the stack thesis. The example should be:\r\n- A specific event (not abstract claim)\r\n- From this client's actual history if possible (most credible)\r\n- Tied to a non-technical person executing via the stack (proves it works without dedicated engineering)\r\n\r\nExamples from real engagements:\r\n- *\"On the kickoff call, Alex drafted a working Customer.io abandoned-cart flow live, using Customer.io's Claude MCP. Validated that a non-technical founder can ship lifecycle work using the skill pattern independently.\"*\r\n- *\"In two weeks, the team scaled from 0 to 14 ranking keywords using `programmatic-seo` against the Ahrefs API + GitHub MCP — no dedicated SEO hire required.\"*\r\n- *\"The first email campaign generated a 24% reply rate after `cold-email` skill + GA4 MCP + Stripe MCP gave the team a verified target list of users with high LTV but no recent activity.\"*\r\n\r\nIf the client has no such moment in their history yet, frame the example as the *first move* — \"Here's the demonstration the team will run in week one to validate the stack:\"\r\n\r\n## When the stack doesn't apply (yet)\r\n\r\nFor clients without MCP connections set up, frame Section 11 differently:\r\n- List the skills that DO apply with current tooling\r\n- Name which MCPs would unlock which sections of the plan\r\n- Treat MCP setup as a Q1 priority alongside the bedrock fixes\r\n\r\nA plan can't claim the agentic-stack thesis if the stack isn't wired. Be honest about state.\r\n",
  },
  {
    skillId: "marketing-plan",
    path: "references/plan-template.md",
    content:
      "# Plan Template — The 13-Section Structure\r\n\r\nThe canonical template for every marketing plan generated by this skill. Each section has a purpose, a structure, and inline prompts for what to draft.\r\n\r\nThe Quietude plan (see `references/example-quietude.md`) is the canonical reference implementation.\r\n\r\n---\r\n\r\n## Title block\r\n\r\n```markdown\r\n# {Client} — Marketing Plan v1\r\n\r\n**Prepared by:** {Author / fCMO name}\r\n**For:** {Founders / leadership team}\r\n**Date:** YYYY-MM-DD\r\n**Status:** Draft v1 — for team review\r\n```\r\n\r\n---\r\n\r\n## Section 1 — Executive summary\r\n\r\n**Purpose:** Lift-and-share. A founder should be able to paste this into a board update or investor email without editing.\r\n\r\n**Length:** 400–700 words. Tight.\r\n\r\n**Structure:**\r\n1. **One-sentence frame.** What does this plan optimize for? Not \"more revenue\" — something specific to this client at this stage.\r\n2. **Three big bets, ranked by leverage.** Each is a paragraph. Bet = a high-conviction thesis about where the team should focus capital and attention.\r\n3. **What twelve months looks like, plausibly.** Bullet list. The plausible outcome state at end of plan horizon. Investor-readable.\r\n4. **90-day priorities.** Numbered list. The six (give or take) moves that ship in the first quarter.\r\n\r\n**Voice notes:**\r\n- Match the client's voice\r\n- Direct, founder-readable, no marketing-speak\r\n- Use names and numbers (specific channels, specific metrics) — not abstractions\r\n- Tradeoffs named explicitly when they matter\r\n\r\n---\r\n\r\n## Section 2 — Strategic frame\r\n\r\n**Purpose:** Distill positioning, ICP, business-model logic, and brand voice into a single page that any team member or new hire can read to orient.\r\n\r\n**Length:** 800–1500 words.\r\n\r\n**Structure:**\r\n\r\n### What {Company} is, in one sentence\r\nPulled from positioning doc / seed deck / founder language.\r\n\r\n### The category we're claiming\r\nIs the company creating a new category, redefining an existing one, or competing in a defined category? Name it. State the category-defining frame in 2–3 sentences. Reference the source (founder's words, ICP doc, etc.).\r\n\r\n### Who we're for (ICP, distilled)\r\nDemographics / firmographics + stated problem vs. real problem + what they're actually buying. Tight, 4–6 bullets.\r\n\r\n### The business model logic\r\nHow does the company make money? What's the customer-acquisition unit economics theory? What's the compounding channel thesis (if any)? Pulled from seed deck / financial model / founder narrative.\r\n\r\n### Brand voice (the non-negotiable)\r\nIf the client has documented voice rules, list them. YES / NO vocabulary. CTA rules. Tone. Core method (initiatory, explanatory, narrative, etc.). Every other section of the plan must respect these.\r\n\r\n**Voice notes:**\r\n- This section is the most \"lift from existing materials\" — don't invent positioning. Surface what's there.\r\n- If positioning is unclear or contradicted across materials, flag it in Section 13's open decisions.\r\n\r\n---\r\n\r\n## Section 3 — Current state\r\n\r\n**Purpose:** Anchor the plan in reality. What's the team, budget, in-flight work, and stuck work *today*?\r\n\r\n**Length:** 1000–2000 words.\r\n\r\n**Structure:**\r\n\r\n### Team composition (marketing surface area)\r\nTable of every person with marketing surface area:\r\n\r\n| Person | Role | Marketing surface area |\r\n|---|---|---|\r\n\r\nBe honest about gaps. If there's no dedicated marketing hire yet, name when one becomes necessary and what role (see `references/team-and-agency-model.md` — first hire should be π-shaped strategist titled Manager or Lead, not VP/CMO).\r\n\r\n### Marketing budget (current)\r\n- Paid acquisition: $X/mo\r\n- Tooling stack: list with estimated cost\r\n- Retainers / fCMO: list\r\n- Headcount: list\r\n- Blended CAC: $X (must include salaries, content costs, tools, retainers — not just paid spend; see `references/budget-planning.md` for the calculation)\r\n- Current spend as % of ARR: X% (compare against 5–40% range)\r\n\r\nState the funding-stage tier this maps to (see `references/funding-stage-unlocks.md`). Implication: what 90-day plan must produce *without* lever pulls that require future budget.\r\n\r\n### Phase of SaaS growth\r\nName the current phase: $0–10K ARR / $10K–100K / $100K–1M / $1M–$10M / $10M+. Each phase has its own binding constraint and dominant growth pattern (see `references/growth-patterns.md`). Section 10 sequences the move into the next phase.\r\n\r\n### What's already done (acknowledge, then build on)\r\nTable:\r\n\r\n| Asset | Status | Marketing leverage |\r\n|---|---|---|\r\n\r\nThis is where past launches, PR moments, content pillars, certifications, notable users get acknowledged. **Critical**: don't write a plan that ignores work the team is proud of.\r\n\r\n### What's in-flight (drafted but not shipped)\r\nTable:\r\n\r\n| Item | Status | Blocker |\r\n|---|---|---|\r\n\r\nBe honest about blockers. Where the blocker is \"no time\" or \"no decision,\" that goes to Section 13's open decisions.\r\n\r\n### What's stuck (and needs to unstick this quarter)\r\nTable:\r\n\r\n| Issue | Cost of inaction | Action |\r\n|---|---|---|\r\n\r\nStuck things are the most leverage-positive places to focus the first weeks of the 90-day plan.\r\n\r\n### Audit rubric snapshot\r\n17-section scored snapshot using the embedded current-state rubric. See `references/current-state-rubric.md` for the full rubric and scoring guides.\r\n\r\nIf a prior scored audit exists, paste those scores in. Otherwise score from available materials and note \"scored from materials\" under the heading.\r\n\r\n| # | Section | Score | Note |\r\n|---|---|---|---|\r\n| 1 | Positioning | 0–5 | |\r\n| 2 | Customer research | 0–5 | |\r\n| ... | ... | ... | ... |\r\n| 17 | Internationalization | 0–5 | |\r\n\r\n**Total: X / 85 (Y%).** Note the *shape* of strength and weakness — that shape is the gap the rest of the plan closes.\r\n\r\n**Voice notes:**\r\n- Honest > polished. If the client's metrics are bad, name them. Founders read past sugar-coating.\r\n\r\n---\r\n\r\n## Section 4 — Acquisition\r\n\r\n**Purpose:** Answer \"how do strangers become aware of us?\" Map every channel: current state, planned moves, skipped (with reason).\r\n\r\n**Length:** 1000–1800 words.\r\n\r\n**Structure:**\r\n\r\n### Current state\r\nBrief. What's working today, what's not, what the data shows about channel mix.\r\n\r\n### The plan\r\nNumbered \"Moves.\" Each move is a paragraph (3–6 sentences) describing the channel, the thesis, and the specific work. Common moves:\r\n\r\n- **Move 1 — SEO (and content)** — Reference the SEO plan if one exists (`seo/plan.md`). Otherwise: keyword research, pillar/spoke structure, content cadence.\r\n- **Move 2 — App Store / Play Store optimization** (for consumer apps) — Listing rewrite, screenshot tests, ASO keyword targeting.\r\n- **Move 3 — Founder-led channels** — LinkedIn for B2B/SaaS, Twitter/X for tech, Instagram for consumer. Cadence, topics, owners.\r\n- **Move 4 — PR amplification** — What's the credibility anchor? How to amplify it.\r\n- **Move 5 — Events (if applicable)** — Live events, conferences, webinars. Acquisition vs. activation role.\r\n- **Move 6 — Hardware / commerce surface (if applicable)** — Shopify storefront, Amazon, retail.\r\n- **Move 7 — B2B sales support** — Case studies, partner pages, vertical-specific content.\r\n- **Move 8 — Paid layer (when budget unlocks)** — Apple Search Ads, Meta, LinkedIn, Google. Held until specified funding stage.\r\n\r\n### 90-day acquisition moves\r\nWeek-by-week breakdown of the ships in the first quarter.\r\n\r\n### 12-month acquisition outlook\r\nQuarter-by-quarter outcome state (Q1 / Q2 / Q3 / Q4).\r\n\r\n### Skills + tools\r\n- **Skills:** list relevant marketing-skills repo skills (`seo-audit`, `ai-seo`, `ads`, `social`, `competitors`, etc.)\r\n- **MCPs / APIs:** list connections (Ahrefs API, GA4 MCP, Typefully MCP, Stripe MCP for LTV math, etc.)\r\n\r\n---\r\n\r\n## Section 5 — Activation\r\n\r\n**Purpose:** Answer \"once someone tries us, do they have an experience that converts?\"\r\n\r\n**Length:** 800–1500 words.\r\n\r\n**Structure:** Same as Acquisition (Current state / The plan / 90-day / 12-month / Skills + tools).\r\n\r\n**Common moves:**\r\n- Bedrock fixes (broken signup, broken onboarding gates, etc.)\r\n- Onboarding tests / rebuild (often the most leveraged move at this stage)\r\n- App Store listing rewrite (cross-references to Acquisition)\r\n- Lifecycle Flow ship order (when to ship onboarding emails vs. hold for product stability)\r\n- Paywall + pricing review (often Activation × Revenue)\r\n\r\n### Skills + tools\r\n`onboarding`, `signup`, `paywalls`, `copywriting`, `marketing-website-design`, `ab-testing`, etc.\r\n\r\n---\r\n\r\n## Section 6 — Retention\r\n\r\n**Purpose:** Answer \"once someone converts, do they stay and deepen?\"\r\n\r\n**Length:** 800–1500 words.\r\n\r\n**Structure:** Same as above.\r\n\r\n**Common moves:**\r\n- Lifecycle email flows (post-purchase, lapsed user, win-back)\r\n- Subscription / preference centers\r\n- Churn reconciliation (often metric definitions don't match across surfaces)\r\n- Hardware → software activation paths (for hybrid businesses)\r\n- Annual plan default tests (cross-references to Revenue)\r\n\r\n### Skills + tools\r\n`emails`, `churn-prevention`, `copywriting`, `paywalls`, etc.\r\n\r\n---\r\n\r\n## Section 7 — Referral\r\n\r\n**Purpose:** Answer \"do retained users bring more users, and at what cost?\"\r\n\r\n**Length:** 500–1200 words.\r\n\r\n**Structure:** Same as above.\r\n\r\n**Common moves:**\r\n- Ambassador / affiliate program launch (if inbound interest exists, lead with it)\r\n- Share-after-value moments built into product\r\n- Founder amplification (founder as referrer-zero)\r\n- Long-game expert / Guides / certified-host network\r\n- Gifting flows (for consumer / hardware)\r\n\r\n### Skills + tools\r\n`referrals`, `social`, `emails` (for ambassador lifecycle), `copywriting`, etc.\r\n\r\n---\r\n\r\n## Section 8 — Revenue\r\n\r\n**Purpose:** Answer \"what do we charge, who pays, and how does it compound?\"\r\n\r\n**Length:** 500–1200 words.\r\n\r\n**Structure:** Same as above.\r\n\r\n**Common moves:**\r\n- Pricing audit (what's actually charged today vs. listed?)\r\n- Annual plan default tests\r\n- Hardware → software bundling formalization (for hybrid businesses)\r\n- Storefront / commerce page optimization\r\n- B2B case studies + sales material\r\n- Long-term value pools (data licensing, enterprise expansion) — flagged not executed in 12-month plan\r\n\r\n### Unit economics\r\nRequired table:\r\n\r\n| Metric | Value | Note |\r\n|---|---|---|\r\n| ARPC (avg monthly revenue per customer) | $X | Pulled from Stripe / billing |\r\n| Blended CAC | $X | Includes all marketing costs, not just paid |\r\n| Annual retention rate | X% | 1 − annual churn |\r\n| LTV (rough) | $X | ARPC × 12 / annual churn |\r\n| LTV / CAC | X | Health benchmark: > 3 |\r\n\r\nThese feed the budget math in Section 10. If any of these are unknown, flag in Section 13 as top open decision.\r\n\r\n### Skills + tools\r\n`pricing`, `paywalls`, `sales-enablement`, `revops`, `ab-testing`, etc.\r\n\r\n---\r\n\r\n## Section 9 — 90-day roadmap\r\n\r\n**Purpose:** The tactical execution layer. Every move ships within a named week, with an owner.\r\n\r\n**Length:** Tables, not prose. Should fit on one printed page if possible.\r\n\r\n**Structure:** Four 2–3-week sprints:\r\n\r\n### Weeks 1–2 — Unblock\r\nHighest-confidence, lowest-cost changes. Removing things that are broken.\r\n\r\n| Move | Stage | Owner |\r\n|---|---|---|\r\n\r\n### Weeks 3–4 — Foundation\r\nPillar/foundational work. Domain consolidation. First content. First flows shipping. First tests live.\r\n\r\n### Weeks 5–8 — Velocity\r\nCompounding work begins. Content cadence. Repeat tests. Channel scaling.\r\n\r\n### Weeks 9–12 — Compound\r\nSecond-order moves. Layered tactics. 90-day review prep.\r\n\r\n---\r\n\r\n## Section 10 — 12-month outlook\r\n\r\n**Purpose:** Quarterly milestones with explicit funding-stage capability unlocks named, anchored against a defensible growth pattern.\r\n\r\n**Length:** Four sub-sections, one per quarter. ~250–400 words each. Plus a short framing paragraph at the top naming the budget method and growth pattern.\r\n\r\n### Framing (top of Section 10)\r\n\r\nState explicitly:\r\n- **Budget method used.** Method 1 (Revenue-Based 5–40% of ARR) or Method 2 (Goal-Based formula). See `references/budget-planning.md`. Show the math.\r\n- **Annual budget total** + the experimental buffer (+10–20%).\r\n- **Resulting end-of-year ARR goal.** Honest forecast, not a guarantee — see the forecasting reality check in `references/measurement-framework.md`.\r\n- **Growth pattern expected.** Linear (predictable $X MRR added per month), step-function (plateau between deliberate jumps), or layered S-curves. For VC-backed Series A+, anchor against 3-3-2-2-2 and show whether the plan matches it or explicitly chooses a different trajectory. See `references/growth-patterns.md`.\r\n\r\n### Structure (per quarter)\r\n\r\n#### Q{N} — Months {X}–{Y}\r\n\r\n**Funding state:** {tier} per `funding-stage-unlocks.md`\r\n\r\n**Focus:** One-sentence focus theme for the quarter.\r\n\r\n**Outcomes by end of Q{N}:**\r\n- Bulleted outcome list (5–8 items)\r\n\r\n**KPI targets:** 3–5 specific numerical targets.\r\n\r\n**Channel/Product/Market S-curve position:** Which curves are growing, which are plateauing, which is the next one being staged for this quarter (see `growth-patterns.md` — layering principle).\r\n\r\n---\r\n\r\n## Section 11 — Marketing operations stack\r\n\r\n**Purpose:** The fCMO differentiator. Show how a small team + agentic tooling executes the plan without hiring at every channel.\r\n\r\n**Length:** Tables + brief explanation.\r\n\r\n**Structure:**\r\n\r\n### The thesis\r\n1–2 paragraphs explaining the principle: small team + marketing-skills library + MCP integrations = output of a larger team.\r\n\r\n### Skills mapped to AARRR stages\r\n\r\n| Stage | Primary skills | Supporting skills |\r\n|---|---|---|\r\n| Acquisition | (list) | (list) |\r\n| Activation | (list) | (list) |\r\n| Retention | (list) | (list) |\r\n| Referral | (list) | (list) |\r\n| Revenue | (list) | (list) |\r\n| Cross-cutting | (list) | (list) |\r\n\r\n### MCPs / APIs mapped to stages\r\n\r\n| Stage | Existing connections | fCMO tooling layer |\r\n|---|---|---|\r\n\r\n### A concrete example\r\nPick one operational moment that proves the stack works (e.g., \"Customer.io MCP let the non-technical founder draft a flow live on the kickoff call\"). Anchor the abstract claim in a specific event.\r\n\r\n### Capability unlocks by funding stage\r\n\r\n| Stage | Headcount | Tooling | Channels live |\r\n|---|---|---|---|\r\n| (current) | (list) | (list) | (list) |\r\n| (next round) | (delta) | (delta) | (delta) |\r\n| ... | ... | ... | ... |\r\n\r\n### Team and agency model (RACI)\r\n\r\nApply the principle from `references/team-and-agency-model.md`: strategy in-house, execution often outsourced.\r\n\r\n| Function | Owned by (internal strategic role) | Executed by (IC / contractor / agency) |\r\n|---|---|---|\r\n| Growth marketing (demand engine) | | |\r\n| Product marketing (story engine) | | |\r\n| Content marketing (trust engine) | | |\r\n\r\nIf the team is missing a strategic owner for one of these functions, the first 90-day move (Section 9) should be the hire — Manager or Lead title, π-shaped if possible, not VP/CMO.\r\n\r\nIf execution capacity is the gap, name the contractor or small niche agency in the right cell rather than the team's existing IC.\r\n\r\nPull from `references/funding-stage-unlocks.md`.\r\n\r\n---\r\n\r\n## Section 12 — Tactical idea bank\r\n\r\n**Purpose:** Cross-reference all 139 ideas from the `marketing-ideas` skill against AARRR stages, with client-specific status.\r\n\r\n**Length:** Long — tables can easily total 150+ rows.\r\n\r\n**Structure:**\r\n\r\n### Intro paragraph\r\nExplain the cross-reference: Sections 4–8 prescribe what's *being done*. This section maps what's *possible*.\r\n\r\n### Status legend\r\n\r\n- **Now (Q1)** — already in 90-day plan\r\n- **Q2** — post-foundation layer-in\r\n- **Q3+** — post-seed-close or post-GA expansion\r\n- **Q4+** — long-game\r\n- **Skip / off-brand** — incompatible with brand voice or business model\r\n\r\n### 12.1 Acquisition ideas\r\n\r\nBy status (Now / Q2 / Q3+ / Q4+ / Skip), tables of relevant marketing-ideas by number.\r\n\r\n| # | Idea | Client note |\r\n|---|---|---|\r\n\r\n### 12.2 Activation ideas\r\n### 12.3 Retention ideas\r\n### 12.4 Referral ideas\r\n### 12.5 Revenue ideas\r\n### 12.6 Cross-cutting / brand foundation ideas\r\n\r\n### Idea-bank summary\r\n- Counts per AARRR stage\r\n- Counts skipped, with rationale\r\n- What the plan covers as a % of the available tactical surface area\r\n- What this proves about the client's stage\r\n\r\nUse `references/idea-cross-reference.md` as the source-of-truth mapping. Apply client-specific filters during draft (brand voice rules out some; funding stage shifts timing of others).\r\n\r\n---\r\n\r\n## Section 13 — Measurement, RACI, open decisions, appendix\r\n\r\n**Purpose:** Operational close. Define how the plan gets measured, who owns what, what's still TBD, and where to find the deeper docs.\r\n\r\n**Structure:**\r\n\r\n### Measurement — the metrics that matter\r\n\r\n**North star (proposed):** One metric that captures the business-model thesis. For Quietude it was blended-LTV-to-blended-CAC; for a B2B SaaS it might be NRR × NPS; for a marketplace, take-rate × monthly transacting users. Make it specific to the company.\r\n\r\n**Leading indicators by AARRR stage:** Table:\r\n\r\n| Stage | Leading indicators |\r\n|---|---|\r\n| Acquisition | ... |\r\n| Activation | ... |\r\n| Retention | ... |\r\n| Referral | ... |\r\n| Revenue | ... |\r\n\r\n**Review cadence:**\r\n- Weekly: who syncs with whom, on what\r\n- Monthly: who reviews what\r\n- Quarterly: plan recalibration trigger\r\n\r\n### RACI\r\n\r\n| Domain | Responsible | Accountable | Consulted | Informed |\r\n|---|---|---|---|---|\r\n\r\nCommon domains: strategic plan, brand voice, app/product implementation, lifecycle, SEO content, App Store, founder-led social, events, ambassadors, B2B sales, pricing, investor narrative, future hires.\r\n\r\n### Open decisions blocking the plan\r\n\r\nRanked by impact. Each is: name + impact + what's blocked.\r\n\r\n1. (highest impact) ...\r\n2. ...\r\n8. (lowest impact) ...\r\n\r\n### Appendix — deep-dive links\r\n\r\n**Published in this repo / shared with team:** {relative paths to docs in the shared repo}\r\n\r\n**Founder-authored strategic context** (internal knowledge base): {names of docs the team has access to outside the plan repo}\r\n\r\n**fCMO working drafts** (not yet published): {names + how to access from author}\r\n\r\n---\r\n\r\n## Closing line\r\n\r\n```markdown\r\n*{Client} Marketing Plan v1. Prepared by {Author}, {Date}. For team review and discussion.*\r\n```\r\n\r\n---\r\n\r\n## Per-section heuristics for \"is this section done?\"\r\n\r\n- **Section 1** — A non-Quietude reader could understand the company's growth thesis from this alone.\r\n- **Section 2** — Brand voice rules are explicit enough that any new copywriter could follow them.\r\n- **Section 3** — All \"in-flight\" items have an owner and a blocker named.\r\n- **Sections 4–8** — Each move names a skill (`some-skill`) and a tool (Customer.io MCP / Stripe MCP / Ahrefs / etc.).\r\n- **Section 9** — Every row has an owner.\r\n- **Section 10** — Each quarter names the funding stage explicitly.\r\n- **Section 11** — At least one concrete operational example proves the stack thesis.\r\n- **Section 12** — Skip list has rationale, not just absence.\r\n- **Section 13** — North-star is specific to this company (not generic \"ARR growth\").\r\n",
  },
  {
    skillId: "marketing-plan",
    path: "references/team-and-agency-model.md",
    content: `# Team and Agency Model — Hire for Strategy, Outsource Execution\r
\r
The marketing operations stack (Section 11 of every plan) describes *what* gets done. This doc describes *who does it* — the operating principle, the org shape, the first hire, the agency model, and how it evolves as the company scales.\r
\r
Excerpted and adapted from *Founding Marketing* by Corey Haines.\r
\r
## The principle\r
\r
**Strategy lives in-house. Execution can — and often should — be outsourced.**\r
\r
Two failure modes are common when founders ignore this:\r
\r
1. **Hire junior tactician first.** Founder hits a milestone, raises a round, hires a junior to "do marketing" (run ads, write blogs, post on social). Six months later: scattered tactics, no coherent strategy, disappointing results.\r
2. **Hire expensive agency for strategy.** Burns cash while the internal team struggles to execute on recommendations they don't fully understand. Strategic insight gathers dust; tactical needs go unmet.\r
\r
The traditional advice — "hire full-time for competitive advantages, only use agencies for commoditized work" — made sense when marketing moved slowly and talent stayed for decades. That world is gone. Full-time hires take months to ramp and years to develop deep expertise. The best agencies and contractors deliver results immediately, with cross-industry pattern recognition you couldn't build in-house affordably.\r
\r
## What stays in-house\r
\r
The strategic heart of the marketing operation. Specifically:\r
\r
- **Strategic direction and vision** — the "why" behind every move\r
- **Customer and market understanding** — only comes from daily immersion in the business\r
- **Positioning and deep market knowledge** — represents the company's unique place in the market\r
- **Core product and service delivery** — the heart of the value proposition\r
- **Long-term institutional knowledge** — the compound interest of experience\r
\r
These are not delegatable. An external partner can sharpen the articulation, but the underlying conviction must come from the team.\r
\r
## What's safe to outsource\r
\r
External expertise shines in specific contexts:\r
\r
- **Best-in-class implementation of specialized skills** (paid media operators, technical SEO, video production, designers)\r
- **Burst capacity** — launch sprints, campaign cycles, one-off content production\r
- **Well-defined strategies** — when the scope, deliverables, and success metrics are clear\r
- **Fresh eyes on old problems** — external perspective when the team is too close to see clearly\r
\r
The trick is *defining* what's being outsourced. Vague briefs ("help us with marketing") produce vague results. Specific briefs ("ship 20 RSAs across 4 ad groups by month-end with the CTR benchmarks in the brief") produce shippable work.\r
\r
## The three core functions\r
\r
Every marketing engine has three primary functions. Whether you have a team of 1 or 50, the functions exist — even if one person owns several.\r
\r
### Growth Marketing — the demand engine\r
\r
- Optimizes campaigns\r
- Manages the funnel\r
- Operates distribution channels\r
- Runs the marketing tech stack\r
- Data-driven; constantly testing and measuring\r
\r
Drives quantitative outcomes: leads, signups, paid traffic, conversion rate, CAC.\r
\r
### Product Marketing — the story engine\r
\r
- Transforms product benefits into compelling messages\r
- Powers product launches\r
- Equips the sales team\r
- Owns pricing and packaging communication\r
- Bridges what's built and why people should care\r
\r
Drives positioning quality, message-market fit, launch impact, sales enablement.\r
\r
### Content Marketing — the trust engine\r
\r
- Maintains the brand voice\r
- Manages the editorial calendar\r
- Produces content that reaches and teaches the audience\r
- Proves impact through customer stories\r
- Shapes industry conversations through thought leadership\r
- Supports sales with closing content\r
\r
Drives organic traffic, brand affinity, thought leadership, trust signals.\r
\r
These three functions are interconnected. Growth without story is performance with no positioning. Story without distribution is a great pitch nobody hears. Trust without demand capture is brand affinity that doesn't compound into revenue.\r
\r
## The first marketing hire\r
\r
The most consequential decision in building the marketing engine isn't about channels or technology — it's who leads.\r
\r
**The first marketing hire should be a strategist, not a tactician.** Counterintuitive when there's a mountain of tactical work to ship. Essential for sustainable growth.\r
\r
### Look for π-shaped, not T-shaped\r
\r
The standard advice is to hire a **T-shaped marketer**: broad knowledge across many areas, deep in one. That's fine for a tactical IC role.\r
\r
For the first strategic hire, look for **π-shaped**: two deep skill sets, plus broad surface-level competency across the rest. The two depths create unique leverage through their combination.\r
\r
#### High-leverage combinations\r
\r
**Product Marketing + Growth Marketing**\r
- Owns positioning *and* drives distribution\r
- Crafts the message *and* gets it to market\r
- No gap between planning and doing\r
- Best for technical products or complex sales\r
\r
**Product Marketing + Content Marketing**\r
- Translates product into compelling stories\r
- Owns voice and positioning together\r
- Creates content that compounds\r
- Best for thought-leadership or education-driven markets\r
\r
**Growth Marketing + Content Marketing**\r
- Builds the demand engine and the content that fuels it\r
- Closes the loop between SEO/social distribution and conversion\r
- Best for content-led growth motions\r
\r
The wrong shape for a first hire: deep paid media specialist alone, deep SEO specialist alone, deep designer alone. These are tactical depths; they need a strategic owner above them.\r
\r
### Title and progression — don't inflate\r
\r
A common mistake: making the first marketing hire a "CMO" or "VP." Creates problems when you actually need to scale the org, because there's no headroom above them.\r
\r
The right progression:\r
\r
| Title | Scope |\r
|---|---|\r
| **Manager** | Individual contributor, co-manages freelancers |\r
| **Lead** | Senior IC, manages freelancers/agencies |\r
| **Director / Head** | Manages ICs and vendors |\r
| **VP** | Manages Directors |\r
| **Chief (CMO)** | Manages VPs |\r
\r
The first hire is almost always **Marketing Manager** or **Marketing Lead**. They should be able to:\r
\r
- Define positioning — not just describe what you do, but why it matters\r
- Identify best channels — from data, not intuition\r
- Create the messaging framework — consistency across touchpoints\r
- Build the marketing engine — systems that scale beyond any individual\r
- Manage external resources — get the most from agencies and contractors\r
\r
Both strategic *and* hands-on. Comfortable setting direction and rolling up sleeves. Most importantly: a **builder** — creates processes, frameworks, and systems that scale beyond their individual capacity.\r
\r
## The marketing engine — three components\r
\r
Think of the marketing organization as an engine. Each part has a specific role; the magic is in how they work together.\r
\r
### The Fuel — Strategy\r
\r
What powers everything else. Without good fuel, even the best engine sputters.\r
\r
- Product marketing creates positioning (foundation of all communication)\r
- Content marketing develops stories (features → benefits that resonate)\r
- Brand marketing establishes identity (memorable and meaningful)\r
\r
Quality of the fuel determines efficiency. Poor positioning, weak stories, inconsistent branding waste energy regardless of execution.\r
\r
### The Engine — Execution\r
\r
Where strategy turns into action.\r
\r
- Growth marketing drives distribution (right message to the right people)\r
- Demand gen creates opportunities (attention → interest)\r
- Operations maintains systems (everything running smoothly)\r
\r
Needs to be well-maintained and properly tuned. Right processes, tools, people in place to execute consistently.\r
\r
### The Dashboard — Analytics\r
\r
How you know if you're heading in the right direction.\r
\r
- Metrics track performance (measuring what matters)\r
- Attribution shows what works (cause and effect)\r
- Data informs decisions (evidence over opinion)\r
\r
Without good instrumentation, flying blind. Need both leading and lagging indicators.\r
\r
## Working with agencies — selection framework\r
\r
Not all agencies are created equal. Ranked from most appropriate for early-stage to least:\r
\r
### Individual contractors\r
- **Most flexible** — adapt quickly to changing requirements\r
- **Direct relationship** — no account-management layer\r
- **Often most cost-effective** — pay for pure expertise\r
- **Best for** specific skills (paid media op, technical SEO, video editor, designer)\r
\r
For most pre-Series-A companies, this is the right answer for nearly all outsourced work.\r
\r
### Small niche agencies\r
- **Specialized expertise** — deep knowledge in specific areas\r
- **Personal attention** — often working directly with senior team\r
- **Often founder-led** — experienced practitioners calling the shots\r
- **Clear focus** — they know what they're good at\r
- **Best for** specialized needs with some complexity (full SEO program, lifecycle email program, brand identity work)\r
\r
### Small generalist agencies\r
- **Broader capabilities** — handle multiple needs\r
- **More resources** — team approach to problems\r
- **Multiple skill sets** — cross-functional\r
- **Usually more expensive** — paying for convenience\r
- **Best for** companies needing broader support and willing to pay for the simplicity of fewer relationships\r
\r
### Large agencies (not recommended for most startups)\r
- Long contracts, high minimums, junior account teams, slow turnaround\r
- Useful only when the brand spend is large enough to command senior attention\r
\r
## Setting agencies up for success\r
\r
The difference between a successful and failed agency relationship usually comes down to structure and management.\r
\r
### Before starting\r
\r
- **Define clear objectives** — what specific outcomes are we seeking?\r
- **Set realistic timelines** — when do we need to see results?\r
- **Establish communication channels** — how do we stay aligned?\r
- **Agree on metrics** — what defines success?\r
- **Document processes** — how do we work together?\r
\r
### During engagement\r
\r
- **Regular check-ins** — weekly tactical, monthly strategic\r
- **Clear feedback loops** — both ways, positive and constructive\r
- **Data sharing** — give them what they need to succeed\r
- **Performance reviews** — measure against agreed metrics\r
- **Strategy alignment** — ensure they're moving with the business\r
\r
### Red flags\r
\r
- **Scope creep beyond core expertise** — trying to do too much\r
- **High team turnover** — losing institutional knowledge\r
- **Missed deadlines** — failing to deliver as promised\r
- **Poor communication** — lack of proactive updates\r
- **Unclear reporting** — can't demonstrate value\r
\r
The best agency relationships feel like partnership: they understand the business, care about success, bring expertise you couldn't build in-house affordably. Takes work on both sides — clear expectations, open communication, mutual respect.\r
\r
## Scaling the model by stage\r
\r
The right ratio of internal to external resources isn't static. It evolves with stage, needs, and market conditions.\r
\r
### Early stage (pre-product-market-fit)\r
\r
**Mode:** discovery and iteration\r
\r
- **Internal:** 1–2 strategic hires leading the charge (often the founder + one π-shaped marketer)\r
- **External:** specialized contractors for execution (no long-term commitment)\r
- **Agency relationships:** project-based, testing approaches before bigger investments\r
- **North star:** solid foundation while keeping fixed costs low\r
\r
### Growth stage (post-PMF, scaling what works)\r
\r
**Mode:** optimization\r
\r
- **Internal:** small but mighty core strategic team that owns marketing direction\r
- **External:** balanced mix of contractors and agencies, each chosen for specific expertise\r
- **Agency relationships:** deeper, longer-term — partners who grow with you\r
- **North star:** double down on channels and approaches that have proven successful\r
\r
### Scale stage (multi-channel, multi-segment)\r
\r
**Mode:** coordination\r
\r
- **Internal:** larger strategic team focused on coordination and oversight (not execution)\r
- **External:** specialized agencies, each bringing deep expertise in specific areas of the mix\r
- **Trusted contractor network:** flexibility for variable workloads and special projects\r
- **North star:** finding efficiencies, improving processes, maximizing return\r
\r
The metaphor: a symphony orchestra. The internal team conducts. External partners play their instruments with expertise.\r
\r
## How this informs the plan\r
\r
| Section | What to include |\r
|---|---|\r
| **3 (Current state)** | Team composition — every person who touches marketing, what they own. Identify where the team is π-shaped vs. T-shaped vs. tactical-only. Flag gaps. |\r
| **9 (90-day roadmap)** | If the team is missing the strategic owner, the first move is the first marketing hire (Lead or Manager). If the team has strategy but no execution capacity, the first move is the first contractor or specialized agency. |\r
| **10 (12-month outlook)** | Map team evolution against funding-stage capability unlocks (see \`funding-stage-unlocks.md\`). When does the second hire come in? When does an agency relationship deepen? |\r
| **11 (Marketing operations stack)** | RACI is more honest with this model: "owned by" = internal strategic role; "executed by" = internal IC, contractor, or agency. The plan should make it explicit who does what. |\r
| **13 (Open decisions)** | If "first marketing hire" is open, name it as a top-three decision. If "in-house vs agency" for a specific function is open, frame the tradeoff using this doc's heuristics. |\r
\r
## Operational guardrails\r
\r
- **Don't title-inflate the first hire.** It paints the org into a corner.\r
- **Don't outsource positioning.** Even the best agency can articulate it back to you, but only if the conviction came from the team.\r
- **Don't full-time hire for a six-month sprint.** Use a contractor. The hidden cost of full-time is the months of ramp + the awkwardness of letting them go if the work doesn't compound.\r
- **Don't agency-hire to delay a strategy conversation.** Agencies execute; they don't replace strategic owners. If the internal team can't tell the agency what to do, the agency can't help.\r
- **Don't measure team size as a success metric.** Measure output, not headcount. A 4-person team with the right π-shaped leader and great external partners out-performs a 15-person team without strategic clarity.\r
`,
  },
];
