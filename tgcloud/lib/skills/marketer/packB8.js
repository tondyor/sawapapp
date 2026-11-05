export const PACKB8 = [
  {
    skillId: "ai-seo",
    path: "references/agent-readiness.md",
    content:
      "# Agent Readiness — Can an Agent Reach, Navigate, and Parse Your Site?\r\n\r\nAI visibility work splits into two layers: what your content says (the rest of this skill) and whether an agent can *get to it at all*. This reference covers the second layer — the access/discovery/parseability audit — plus the emerging shift from agent-*readable* to agent-*actionable* sites.\r\n\r\nTwo free scoring tools shipped in August 2026 and turned this into a measurable discipline:\r\n\r\n| Tool | Run it | Method |\r\n|---|---|---|\r\n| **Is Agentic** (Vercel + Ora) | `npx is-agentic yourdomain.com` or [is-agentic.com](https://is-agentic.com) | 100+ checks; Essential checks carry most of the score; Recommended checks activate only when evidence shows you have that surface (API, MCP server, commerce); not-applicable checks are excluded, not failed; includes an observed agent journey showing where a real agent hit friction |\r\n| **Frase Agent Readiness Checker** | [frase.io/tools/agent-readiness](https://www.frase.io/tools/agent-readiness) | Access / Discovery / Parseability triad; 80+ = agents can reliably use the site, 60–79 = solid with gaps, <60 = real access problems |\r\n\r\nRun one before and after any agent-readiness work — the score is a shareable artifact and the failed checks are your worklist. (Both are vendor tools with a product behind them; the *checks* are the value, not the pitch.)\r\n\r\n## The three questions\r\n\r\n### 1. Access — can an agent get to the page and see real content?\r\n\r\n- **Core content in the initial HTML response.** Most agents never execute JavaScript. If the content only exists after client-side rendering, it doesn't exist. This is the #1 essential check in both tools.\r\n- **No bot challenge or firewall block** on the intended discovery path. Blocking `OAI-SearchBot`, `PerplexityBot`, or `Claude-SearchBot` may reduce search visibility. Blocking model-development crawlers such as `GPTBot` or `ClaudeBot` can be an intentional training opt-out and is not, by itself, a visibility failure. Audit what your CDN/WAF actually does to each user agent — many sites block them by default without anyone deciding to.\r\n- **Correct HTTP behavior**: real status codes (no soft-404s), stable canonical URLs, recoverable errors.\r\n\r\n### 2. Discovery — do your files tell agents what's here?\r\n\r\n- **robots.txt with an explicit AI-crawler stance** — name the relevant user agents and state a purpose-specific policy, rather than leaving it to be assumed (see the bot-access guidance in SKILL.md).\r\n- **A sitemap that loads and parses cleanly.**\r\n- **llms.txt at the domain root** (see Machine-Readable Files in SKILL.md).\r\n- **`llms-full.txt`** — the newer companion: your entire site content in one file, so an agent gets everything in a single request instead of crawling. Emerging, cheap to generate alongside llms.txt, and scored as bonus signal by both tools.\r\n- **robots.txt content-usage statements** — an emerging convention for declaring what AI may do with your content (train / cite / summarize), so the answer comes from you instead of being assumed.\r\n\r\n### 3. Parseability — once there, can the agent tell what the page is?\r\n\r\n- **Valid, substantive structured data** (JSON-LD — see the `schema` skill).\r\n- **A Markdown representation of the page.** This is the newest technique in the stack, two implementations:\r\n  - **Content negotiation**: serve compact Markdown at the *same canonical URL* when the request asks for `Accept: text/markdown`, with a `Vary` header keeping the HTML and Markdown cache entries separate. (This is how Is Agentic serves its own reports — agents get Markdown, browsers get HTML, one URL.)\r\n  - **Link header**: an HTTP `Link` header on the HTML page pointing to a parallel Markdown version — discoverable without guessing URLs.\r\n- Clear document structure — one H1, headings that answer sub-questions, extractable answer blocks (the content-patterns reference).\r\n\r\n## Emerging: agent-actionable, not just agent-readable\r\n\r\nReading is becoming table stakes. The next race is whether an agent can *act* on your site — fill the form, book the meeting, start the trial. **WebMCP** is the emerging standard here: a page declares its forms and CTAs as callable tools with input schemas, so an agent doesn't have to reverse-engineer your UI. Early days (label: emerging, not yet a ranking/citation signal), but the direction is clear — if agents are becoming buyers, the site that exposes \"start trial\" as a structured action wins the agent-mediated conversion that a pretty button loses.\r\n\r\nPractical today: make sure your highest-intent actions (signup, pricing, demo booking, contact) work without JavaScript-only flows, have labeled semantic form fields, and return machine-readable confirmation.\r\n\r\n**Ways to add WebMCP** (all early; confirm browser and assistant support before promising anything):\r\n- **Implement it yourself.** Follow the WebMCP draft to declare each action as a tool with an input schema, wired to the form or API the page already uses. Keep the tool list short (the 2–4 highest-intent actions) and reuse existing validation, spam protection, and permissions rather than building a parallel path.\r\n- **Use your platform's support, if it has any.** Some site platforms and agent workflows add WebMCP for you. Ploy ◆, for example, has a Ploybook that inspects the site, defines tool contracts, implements them against existing form logic, and validates them. It's a guided workflow, not a hosted MCP server. ◆ marks a [Verified Partner](https://github.com/coreyhaines31/marketingskills/blob/main/tools/REGISTRY.md#verified-partners) of this repository (disclosure, not endorsement); name an alternative alongside it when you mention it.\r\n- **Have a coding agent do it** in the site's repo, with the same scoping: a few actions, existing logic, a test for each.\r\n\r\nWhichever path, test that each tool rejects bad input, that submissions land where the normal form's do (CRM, inbox, conversion tracking), and that nothing bypasses consent or rate limits.\r\n\r\nFor products an agent installs mid-task (developer tools, APIs, infrastructure), the next step past acting on your site is being the vendor the agent picks in the first place. See [agent-defaults.md](agent-defaults.md).\r\n\r\n## Citation-source volatility (why you diversify)\r\n\r\nThird-party citation mixes are **not stable** — they shift overnight with model and retrieval updates, and August 2026 provided the case study: **ChatGPT's query fan-out changes nearly wiped Reddit as a citation source** within days (practitioner-reported by multiple AEO teams; one had been earning 24-hour citations from Reddit at 1M+ impressions/month before the change). Meanwhile the same practitioners report **business-owned websites dominate Gemini citations (~60%)**.\r\n\r\nLinkedIn moved in the same update: ChatGPT's LinkedIn citations fell ~36% in mid-August 2026, and its citations of Pulse articles fell ~86% from May to Oct while citations of feed posts rose. Perplexity and Copilot moved the other way. See [linkedin-ai-citations.md](linkedin-ai-citations.md).\r\n\r\nWhat this means for strategy:\r\n\r\n- **Never concentrate AI-visibility work in one third-party surface.** The Presence pillar's list (Wikipedia, Reddit, YouTube, podcasts, review sites, Quora) is a portfolio, not a menu to pick one from. A surface that's 2% of citations today can be 0% after one retrieval update — or vice versa.\r\n- **Owned-site fundamentals hedge the volatility.** Platform deals and retrieval changes reshuffle third-party sources; your own agent-readable site is the one surface no platform can drop you from — and on Gemini it's already the dominant citation class.\r\n- **Treat any citation-share statistic as dated.** The \"Reddit = 1.8% of ChatGPT citations\" class of stats (including the ones in this skill) are snapshots — check the date, and verify against your own citation monitoring (the DIY monitoring loop in SKILL.md) before betting budget on them.\r\n- **Speed is real**: fresh content on retrieved surfaces can be cited within ~24 hours. AI search rewards freshness faster than classic SEO ever did.\r\n\r\n---\r\n\r\n*Agent-readiness check taxonomy distilled from Vercel/Ora's Is Agentic (is-agentic.com) and Frase's Agent Readiness Checker (both August 2026, credited); citation-volatility events practitioner-reported (Ashni of Hype Partners (@ashnichrist) and others, August 2026) — labeled accordingly, verify against your own monitoring.*\r\n",
  },
  {
    skillId: "ai-seo",
    path: "references/ai-attribution.md",
    content: `# Measuring AI Search Impact Past the Referral Click\r
\r
AI answers influence buyers who never click a link. They read a recommendation, then search your brand or type your URL a few days later. Referral reports miss most of that, so "AI sends us almost no traffic" is usually a measurement gap, and the impact sits in other channels.\r
\r
Profound joined more than two million AI conversations with later browsing behavior (Profound, July 2026; observational, US-only, measured site visits rather than purchases). Two findings shape the setup below:\r
\r
- Only **42%** of the downstream visits after an AI assistant introduced a brand happened within 24 hours. A same-session window misses most of the effect.\r
- More than **97%** of those visits carried no AI referral parameter, even after ChatGPT made its links easier to click.\r
\r
SimilarWeb's journey data points the same way: about 9% of post-recommendation visits arrived as visible AI referrals (see [citations-vs-recommendations.md](citations-vs-recommendations.md)). Profound sells AI visibility tracking, so treat its numbers as vendor research, and don't present either study's lift as a forecast for one brand.\r
\r
## Four layers\r
\r
Report each layer separately. Rising visibility does not prove rising revenue.\r
\r
| Layer | What it captures | Where it comes from |\r
|---|---|---|\r
| **Exposure** | Mentions, recommendations, prominence, framing, citations | Prompt tracking (see [prompt-portfolio.md](prompt-portfolio.md)) |\r
| **Immediate behavior** | AI referral sessions, landing pages, engaged sessions | Analytics, with AI referrers grouped (see the **analytics** skill) |\r
| **Delayed behavior** | Branded search, direct visits, return visits, cross-session conversions | Search Console branded queries, analytics, CRM |\r
| **Business outcome** | Signups, leads, qualified pipeline, purchases, revenue, retention | CRM and billing |\r
\r
## Setup\r
\r
1. **Name the decision.** "Should we keep funding AEO content?" needs a different design from "Did fixing our pricing page change anything?"\r
2. **Define exposure** by engine, prompt cohort, market, language, and date, so you know what changed and when.\r
3. **Fix referral capture.** Group known AI referrers (chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com, claude.ai, and so on) into one channel. Preserve landing page, referrer, and query parameters. Expect it to undercount.\r
4. **Add delayed windows.** Measure branded search and direct visits to exposed pages over 1-hour, 24-hour, and 7-day windows after a known exposure change.\r
5. **Ask people.** A "How did you hear about us?" field with an AI option and a "What did you ask?" follow-up, plus tagged sales-call notes, catch journeys analytics can't see.\r
6. **Join to outcomes** in the CRM without counting the same conversion twice across layers.\r
\r
## Evaluation designs\r
\r
Pick the strongest design you can afford, and say which one you used.\r
\r
| Design | Use when | Confidence |\r
|---|---|---|\r
| **Holdout** | You can leave comparable pages, products, or markets untouched | Highest |\r
| **Matched comparison** | Similar pages or markets exist, but you can't randomize | Medium |\r
| **Interrupted time series** | One clear intervention date and a long, stable baseline | Medium |\r
| **Pre/post on a stable cohort** | Nothing better is possible | Low; confounders easily swamp it |\r
| **Exposure panel or incrementality study** | Budget for a vendor panel | Varies with the panel's method |\r
\r
List confounders before reading results: campaigns, launches, press, seasonality, pricing changes, and model or retrieval updates.\r
\r
## Reporting language\r
\r
Say which of three things you have: an **observation** ("branded search rose 18% after the change"), an **association** ("pages with more AI mentions saw more direct visits"), or a **causal result** ("the holdout pages didn't move; the treated pages did"). Most AEO reporting only supports the first two. Say so.\r
\r
Respect privacy rules in panel and self-reported data: aggregate small groups and follow your consent and retention policies.\r
\r
---\r
\r
*Framework lineage: the four-layer model, attribution windows, and evaluation designs adapted (re-expressed and restructured) from Profound's MIT-licensed ai-search-attribution-planner skill and its "AI mention effect" study (July 2026), credited.*\r
`,
  },
  {
    skillId: "ai-seo",
    path: "references/answer-accuracy.md",
    content: `# Answer Accuracy: Auditing What AI Says About You\r
\r
Visibility counts whether you appear. Accuracy checks what the answer says once you do. A brand can show up in every answer and still be described with last year's pricing, a missing integration, or a limitation it fixed months ago.\r
\r
Much of an answer is commentary the user never asked for. Profound's analysis of 50,000 responses (Profound, June 2026) found about 47% of response content was unsolicited editorial material: comparisons, rankings, caveats, and recommendations. That editorial layer is where wrong claims about you tend to live.\r
\r
Profound sells AI visibility tracking, so treat its figures as vendor research. Other trackers that capture answer text for this kind of audit include Ahrefs Brand Radar, Semrush's AI toolkit, Peec AI, Otterly, and ZipTie.\r
\r
## When to run it\r
\r
- An assistant states a wrong price, plan limit, feature, or compatibility claim\r
- Sales hears prospects repeat something false that "ChatGPT said"\r
- After a repositioning, pricing change, rebrand, or product retirement\r
- Quarterly for any brand with a regulated, safety, or pricing-sensitive product\r
\r
## The claim ledger\r
\r
Capture answers first, then log one row per claim. Record the engine, model or surface, locale, prompt, and capture date for every answer, since a claim you can't reproduce is hard to fix.\r
\r
| Field | What goes in it |\r
|---|---|\r
| Engine and date | ChatGPT (search on), Gemini, AI Overviews, Perplexity, Copilot, Claude; capture date |\r
| Prompt | Exact wording, plus which prompt family it belongs to (see [prompt-portfolio.md](prompt-portfolio.md)) |\r
| Claim | The sentence as the model wrote it |\r
| Claim type | Price, availability, compatibility, feature, limitation, comparison, ranking, recommendation, caveat, sentiment |\r
| Verdict | One of the seven below |\r
| Evidence | The current source that confirms or contradicts it |\r
| Likely source | The page the claim probably came from: your page, docs, a feed, a profile, a third-party article, a forum thread, or unknown |\r
| Severity | Critical, high, medium, or low |\r
| Owner | Who fixes the source |\r
\r
Extract every claim that could change a buying decision, including the ones the user didn't ask about. A question about pricing that comes back with an unprompted "but it lacks SSO" is two claims.\r
\r
### Seven verdicts\r
\r
1. **Accurate and current**\r
2. **Accurate but incomplete**: true, but missing the fact that matters (the free plan exists, but the answer omits its limits)\r
3. **Ambiguous**: could be read as true or false\r
4. **Stale**: was true, isn't now\r
5. **False**\r
6. **Subjective framing**: an opinion stated as fact ("best for small teams," "hard to set up")\r
7. **Unverifiable**: no current source either way\r
\r
Check first-party facts against your own current product material, and claims about the outside world against reliable independent sources. Your preferred marketing wording is not evidence.\r
\r
### Severity\r
\r
| Level | Examples |\r
|---|---|\r
| **Critical** | Safety, legal, eligibility, price, availability, or compatibility errors that could cause a bad purchase or real harm |\r
| **High** | False comparisons, invented limitations, stale product facts in high-value prompt families |\r
| **Medium** | Incomplete or slanted framing that could plausibly change a decision |\r
| **Low** | Tone and wording that don't change the decision |\r
\r
Weight severity by exposure too: a medium error that appears in every run of your top commercial prompt outranks a high error in one obscure prompt.\r
\r
## Fix the source first\r
\r
The answer is downstream of what the model retrieved or learned. Rewriting your homepage copy rarely fixes a claim that comes from a stale third-party review.\r
\r
1. **Trace it.** Search the claim's wording, check which sources the engine cited for that answer, and look for the page where the wrong fact lives.\r
2. **Fix your own sources.** State the correct fact plainly on the page that should own it, with a date: pricing page, docs, changelog, comparison page, help center. Remove or redirect the outdated page. Update feeds and structured data that carry the same fact.\r
3. **Fix your profiles.** G2, Capterra, app marketplaces, Crunchbase, LinkedIn, and partner directories often hold the stale version.\r
4. **Ask third parties for factual corrections only.** Send the publisher the correct fact and a source. Don't ask them to remove legitimate criticism.\r
5. **Retest** the same prompts after a set observation window (4–8 weeks is a reasonable starting point), with a few controlled variants. Report movement over time; one clean run proves nothing.\r
\r
Never promise that a source fix will change the answer. Models retrain and re-retrieve on their own schedules.\r
\r
**Off limits:** fabricated corrections, editing Wikipedia about yourself, astroturfed forum posts, and pressuring publishers to pull fair criticism. These break platform rules, and models are getting better at discounting them.\r
\r
## Report\r
\r
1. Accuracy rate across the cohort, the riskiest narrative, and the main source problem\r
2. The claim ledger\r
3. Owned-source fixes, each with the exact fact and the page that should state it\r
4. Third-party correction requests, factual and sourced\r
5. The retest plan and date\r
6. Unknowns\r
\r
This audit pairs with the positioning work in [positioning-and-consensus.md](positioning-and-consensus.md): accuracy fixes wrong facts, positioning fixes the wrong story. The AI-accuracy audit loop in **marketing-loops** can schedule it.\r
\r
---\r
\r
*Framework lineage: claim ledger, verdict set, and severity scale adapted (re-expressed and restructured) from Profound's MIT-licensed ai-answer-accuracy-auditor skill and its "Parrot Problem" research (June 2026), credited.*\r
`,
  },
  {
    skillId: "ai-seo",
    path: "references/citations-vs-recommendations.md",
    content: `# Citations vs. Recommendations: The AI Visibility Ladder\r
\r
Being cited by an AI engine and being recommended by it are **two different outcomes governed by two different systems**. A citation means your page was useful enough to pull information from. A recommendation means the model put your brand on the buyer's shortlist. Optimizing for the first does not automatically earn the second — and for smaller brands, conflating them leads to content strategies that can actively help competitors.\r
\r
Source note: the analysis and data in this reference draw on Lily Ray's (Amsive) 2026 study of B2B "best [category] software" queries, behavioral studies by Scrunch and SimilarWeb, and commentary by John-Henry Scherck (Growth Plays). The citation-mix taxonomy and decision rules are adapted (re-expressed and restructured) from Profound's MIT-licensed ai-citation-mix-strategist skill, credited.\r
\r
---\r
\r
## The Visibility Ladder\r
\r
AI visibility is a ladder, not a binary. Each rung has different selection criteria and different measurement:\r
\r
| Rung | What it means | What governs it | How to see it |\r
|---|---|---|---|\r
| **1. Retrieved** | The model read your content while building its answer, without citing it | Crawlability, parseable structure, query relevance | Mostly invisible; bot logs hint at it |\r
| **2. Cited** | Your page appears as a source in the answer | Content usefulness: structure, statistics, clarity, freshness | Prompt-tracking tools, AI Overview source lists |\r
| **3. Mentioned** | Your brand is named in the answer text | Entity recognition + how the web talks about you | Prompt-tracking tools |\r
| **4. Recommended** | Your product is on the shortlist the buyer actually considers | **Aggregate web consensus** — reviews, forums, analysts, press, video — largely independent of your own content | Prompt tracking + the framing around the mention |\r
\r
Rungs 1–3 are legitimate signals your content is working, and most prompt-tracking tools report them. But rung 4 is where buying behavior changes, and it's earned differently: **citation is about whether your content is useful to consult; recommendation is mostly a reflection of what the broader web says about you** — whether you published a guide on the topic or not.\r
\r
There is also a shadow rung: **recommended against**. On detailed, requirements-heavy prompts, models increasingly name products a buyer should *avoid* for their use case, with sources. The downside of weak third-party consensus is no longer just absence from the shortlist — it can be an explicit rule-out. This makes monitoring the *framing* around your mentions (favorable / neutral / hedged / negative), not just counting them, part of the job.\r
\r
**Repairing a weakness models repeat.** Address it in public, with specifics, from a real person. One practitioner's client was "slaughtered" on implementation time; over 1.5–2 years, founder posts about the process, guides on real timelines, and a concrete "4–8 weeks" on the implementation page shifted how models described it (anecdote, Harpreet Singh on Edward Sturm's podcast, Sep 2026). More in [positioning-and-consensus.md](positioning-and-consensus.md).\r
\r
---\r
\r
## The Self-Promotional Listicle Risk\r
\r
The common tactic — publish a "best [category] software" guide, rank yourself #1, and let it shape both organic search and AI answers — now has a stage-dependent payoff.\r
\r
**The data:** Lily Ray (Amsive) analyzed 100 B2B "best [category] software" queries across three dates in spring 2026. Across the dataset, self-promotional listicles earned 323 citations in AI Overviews — and in 224 of them (**69% of the citations**), the answer left the publishing brand out of the recommendations, pointing buyers to competitors instead.\r
\r
**The mechanism:** the model treats your guide as a source about the *category*. It happily extracts the competitor names, comparisons, and evaluation criteria you compiled — then makes its recommendation from web-wide consensus, where the established players dominate. For an emerging brand, a self-promotional buyer's guide can function as **a vote for your competitors**: you did the research that helps the model describe them.\r
\r
**The split by stage:**\r
\r
- **Established category leaders** get both outcomes. Their guides earn citations *and* their brands get recommended — because analysts, review sites, and forum discussions already validate them. For leaders, a definitive buyer's guide is highly advantageous: it shapes how the whole category (competitors included) gets described.\r
- **Emerging brands** may win the citation and even shape the category's framing, but miss the recommendation. That's not a wasted outcome — influencing how an LLM defines the category and its evaluation criteria is real positioning work — but it is not the shortlist placement the tactic promises.\r
\r
**What this changes (and doesn't):** genuinely useful buyer's guides still belong in a B2B content strategy at any stage. What changes is the expectation and the investment split. If you're not yet the consensus pick, weight effort toward the offsite signals that actually govern recommendations (below) rather than publishing a plethora of self-ranked listicles.\r
\r
**A third option between ranking yourself #1 and not writing the guide:** name the category leader first, say honestly what it does well, then show the specific cases where your product goes further (practitioner pattern, Sep 2026). It reads as a fair source, which is what models are now starting to filter for.\r
\r
---\r
\r
## What Earns Recommendations\r
\r
Recommendation is a consensus signal. The inputs the models weigh live mostly off your site:\r
\r
| Channel | Why it moves recommendations | Related skill |\r
|---|---|---|\r
| **Review platforms** (G2, Capterra, TrustRadius, app stores) | Third-party validation models treat as evidence of legitimacy | customer-research (review generation loops) |\r
| **Analyst coverage** (Gartner, Forrester, industry reports) | High-authority category framing; models echo analyst shortlists | public-relations |\r
| **Communities and forums** (Reddit, HN, Slack/Discord, niche forums) | Unprompted practitioner discussion is heavily retrieved and hard to fake | community-marketing |\r
| **Earned media and PR** | Independent sources repeating your positioning beyond your own site | public-relations |\r
| **Video and podcasts** | Increasingly retrieved; transcripts carry brand + category associations | video, social |\r
\r
The test to apply before investing in another self-ranked guide: *if a model ignored everything on our domain, would the rest of the web still put us on the shortlist?* If not, that gap is the priority. AEO discourse often stops at "are we in the answer?" — the better question is "are we credible enough to be recommended?"\r
\r
The encouraging flip side: earning an AI recommendation is harder to game than a top search ranking ever was. The durable strategy is the same at every stage — be the best fit for a clear set of buyers, and give those buyers reasons to talk about you in public, where the models can retrieve it.\r
\r
---\r
\r
## Reading the Citation Mix Before Picking Channels\r
\r
"Do more PR" and "post on Reddit" are guesses until you know which sources the engines actually cite for your prompts. The mix differs sharply by engine and industry. Profound's analysis of 11.84 billion citations across eight models and 29 industries found about 57% went to company-operated sites overall, with ChatGPT at 47% and Gemini at 69%; in 24 of 29 industries, the median Profound customer got more citations from brand sites than from earned or social sources (Profound, July 2026). Profound sells AI visibility tracking, so treat this as vendor research. Ahrefs Brand Radar, Semrush, Peec AI, and Otterly also report cited domains you can classify the same way.\r
\r
**Classify every cited source** across a stable prompt sample, split by engine and prompt cluster:\r
\r
| Class | Examples | Roll-up |\r
|---|---|---|\r
| Your own site | Product, docs, pricing, blog | Owned |\r
| Competitor or adjacent company site | A rival's comparison page, a partner's docs | Owned (someone else's) |\r
| Earned editorial | Trade press, independent reviews, newsletters | Earned |\r
| Institutional or primary authority | Standards bodies, government, universities, analyst firms | Earned |\r
| PR wire | Press release distribution | Earned |\r
| Social and user-generated | Reddit, YouTube, LinkedIn, forums | Community |\r
| Marketplace, directory, or review platform | G2, Capterra, app stores, Amazon | Community |\r
| Other or unknown | Anything you can't classify yet | Unclassified |\r
\r
Diagnose with the granular classes; report to executives with the three roll-ups. Separate sources that cite *you* from sources that only shape the surrounding answer.\r
\r
**Then follow the mix:**\r
\r
- **Engines already cite company sites, and yours lacks the facts:** strengthen owned content first. State specific, current facts on the page that should own them.\r
- **Editorial or institutional sources dominate:** pursue earned coverage and analyst inclusion.\r
- **Communities contribute materially:** participate where you can do it honestly and in your own name. Skip communities the engines don't cite.\r
- **Competitor pages get cited:** read them for the facts and framing you're missing. Don't copy them.\r
- **Engines disagree:** plan per engine. A blended average can hide opposite behavior.\r
\r
Re-measure on the same prompt cohort over time; mixes shift with retrieval updates (see the volatility section in [agent-readiness.md](agent-readiness.md)).\r
\r
---\r
\r
## What a Recommendation Is Worth\r
\r
Two behavioral studies quantified the gap between rungs:\r
\r
- **Scrunch** (opt-in panel linking AI conversations to subsequent web behavior, compared against each user's own baseline — observational, not a controlled experiment): a genuine recommendation ("a great option is X") was associated with people searching for, visiting, and evaluating a brand **about twice as often** as a passing mention. For users with no recent observed engagement with the brand, a recommendation was followed within a week by **+182% branded searches, +117% site visits, and +185% product views**.\r
- **SimilarWeb** (thousands of real user journeys, seven days post-answer): when ChatGPT recommended a brand, it received **roughly 2.5× more new visitors** the following week than the competitors left off the list.\r
\r
**The attribution blind spot:** in the SimilarWeb data, only about **9%** of those post-recommendation visits arrived as visible AI referral traffic; the largest share arrived via branded search, with direct and other channels making up the rest — indistinguishable from ordinary organic visitors. AI recommendations are already sending real, engaged buyers, but standard attribution underreports the AI touch.\r
\r
**Measurement triad** (no single signal is complete; together they give a reliable read):\r
\r
1. **AI prompt tracking** — whether and how you're mentioned/recommended in LLM answers, even when no click ever lands (tools in SKILL.md's Monitoring section). Track the framing around mentions — recommended, neutral, hedged, or recommended-against — not just the count.\r
2. **Self-reported attribution** — a "how did you hear about us?" field catches buyers whose journey started in an AI chat but arrived via branded search or direct. Add an AI option with a follow-up, "What did you type?", so buyers hand you real prompts to track. ChatGPT referral UTMs undercount, and AI Overview revenue can't be separated from organic in analytics, so this field is often the clearest signal you have.\r
3. **Sales call recordings** — buyers' own language often reveals an AI conversation shaped the shortlist long before any form fill.\r
\r
Also watch **branded search volume** as a proxy: sustained lifts without a matching campaign are increasingly AI-influence showing up under another name.\r
\r
---\r
\r
## Applying This\r
\r
- **Auditing an established brand:** buyer's guides and comparison content are high-leverage — publish the definitive version and shape the category's evaluation criteria.\r
- **Auditing an emerging brand:** publish the genuinely useful guides your ICP needs, but set expectations (citation and framing, not near-term recommendation) and rebalance investment toward reviews, communities, analysts, and earned media.\r
- **Reporting:** report the ladder, not a single "AI visibility" number — retrieved/cited/mentioned/recommended plus mention framing. A rising citation count with a flat recommendation rate is a specific, diagnosable gap: the web doesn't yet corroborate your content.\r
- **Risk check:** for requirements-heavy queries in your category, check whether models recommend *against* you, and trace the sources they cite when they do.\r
`,
  },
  {
    skillId: "ai-seo",
    path: "references/content-patterns.md",
    content:
      '# AEO and GEO Content Patterns\r\n\r\nReusable content block patterns optimized for answer engines and AI citation.\r\n\r\n---\r\n\r\n## Contents\r\n- Answer Engine Optimization (AEO) Patterns (Definition Block, Step-by-Step Block, Comparison Table Block, Pros and Cons Block, FAQ Block, Listicle Block)\r\n- Generative Engine Optimization (GEO) Patterns (Statistic Citation Block, Expert Quote Block, Authoritative Claim Block, Self-Contained Answer Block, Evidence Sandwich Block)\r\n- Fact-Family Fan-Out Matrix\r\n- Domain-Specific GEO Tactics (Technology Content, Health/Medical Content, Financial Content, Legal Content, Business/Marketing Content)\r\n- Voice Search Optimization (Question Formats for Voice, Voice-Optimized Answer Structure)\r\n\r\n## Answer Engine Optimization (AEO) Patterns\r\n\r\nThese patterns help content appear in featured snippets, AI Overviews, voice search results, and answer boxes.\r\n\r\n### Definition Block\r\n\r\nUse for "What is [X]?" queries.\r\n\r\n```markdown\r\n## What is [Term]?\r\n\r\n[Term] is [concise 1-sentence definition]. [Expanded 1-2 sentence explanation with key characteristics]. [Brief context on why it matters or how it\'s used].\r\n```\r\n\r\n**Example:**\r\n```markdown\r\n## What is Answer Engine Optimization?\r\n\r\nAnswer Engine Optimization (AEO) is the practice of structuring content so AI-powered systems can easily extract and present it as direct answers to user queries. Unlike traditional SEO that focuses on ranking in search results, AEO optimizes for featured snippets, AI Overviews, and voice assistant responses. This approach has become essential as over 60% of Google searches now end without a click.\r\n```\r\n\r\n### Step-by-Step Block\r\n\r\nUse for "How to [X]" queries. Optimal for list snippets.\r\n\r\n```markdown\r\n## How to [Action/Goal]\r\n\r\n[1-sentence overview of the process]\r\n\r\n1. **[Step Name]**: [Clear action description in 1-2 sentences]\r\n2. **[Step Name]**: [Clear action description in 1-2 sentences]\r\n3. **[Step Name]**: [Clear action description in 1-2 sentences]\r\n4. **[Step Name]**: [Clear action description in 1-2 sentences]\r\n5. **[Step Name]**: [Clear action description in 1-2 sentences]\r\n\r\n[Optional: Brief note on expected outcome or time estimate]\r\n```\r\n\r\n**Example:**\r\n```markdown\r\n## How to Optimize Content for Featured Snippets\r\n\r\nEarning featured snippets requires strategic formatting and direct answers to search queries.\r\n\r\n1. **Identify snippet opportunities**: Use tools like Semrush or Ahrefs to find keywords where competitors have snippets you could capture.\r\n2. **Match the snippet format**: Analyze whether the current snippet is a paragraph, list, or table, and format your content accordingly.\r\n3. **Answer the question directly**: Provide a clear, concise answer (40-60 words for paragraph snippets) immediately after the question heading.\r\n4. **Add supporting context**: Expand on your answer with examples, data, and expert insights in the following paragraphs.\r\n5. **Use proper heading structure**: Place your target question as an H2 or H3, with the answer immediately following.\r\n\r\nMost featured snippets appear within 2-4 weeks of publishing well-optimized content.\r\n```\r\n\r\n### Comparison Table Block\r\n\r\nUse for "[X] vs [Y]" queries. Optimal for table snippets.\r\n\r\n```markdown\r\n## [Option A] vs [Option B]: [Brief Descriptor]\r\n\r\n| Feature | [Option A] | [Option B] |\r\n|---------|------------|------------|\r\n| [Criteria 1] | [Value/Description] | [Value/Description] |\r\n| [Criteria 2] | [Value/Description] | [Value/Description] |\r\n| [Criteria 3] | [Value/Description] | [Value/Description] |\r\n| [Criteria 4] | [Value/Description] | [Value/Description] |\r\n| Best For | [Use case] | [Use case] |\r\n\r\n**Bottom line**: [1-2 sentence recommendation based on different needs]\r\n```\r\n\r\n### Pros and Cons Block\r\n\r\nUse for evaluation queries: "Is [X] worth it?", "Should I [X]?"\r\n\r\n```markdown\r\n## Advantages and Disadvantages of [Topic]\r\n\r\n[1-sentence overview of the evaluation context]\r\n\r\n### Pros\r\n\r\n- **[Benefit category]**: [Specific explanation]\r\n- **[Benefit category]**: [Specific explanation]\r\n- **[Benefit category]**: [Specific explanation]\r\n\r\n### Cons\r\n\r\n- **[Drawback category]**: [Specific explanation]\r\n- **[Drawback category]**: [Specific explanation]\r\n- **[Drawback category]**: [Specific explanation]\r\n\r\n**Verdict**: [1-2 sentence balanced conclusion with recommendation]\r\n```\r\n\r\n### FAQ Block\r\n\r\nUse for topic pages with multiple common questions. Essential for FAQ schema.\r\n\r\n```markdown\r\n## Frequently Asked Questions\r\n\r\n### [Question phrased exactly as users search]?\r\n\r\n[Direct answer in first sentence]. [Supporting context in 2-3 additional sentences].\r\n\r\n### [Question phrased exactly as users search]?\r\n\r\n[Direct answer in first sentence]. [Supporting context in 2-3 additional sentences].\r\n\r\n### [Question phrased exactly as users search]?\r\n\r\n[Direct answer in first sentence]. [Supporting context in 2-3 additional sentences].\r\n```\r\n\r\n**Tips for FAQ questions:**\r\n- Use natural question phrasing ("How do I..." not "How does one...")\r\n- Include question words: what, how, why, when, where, who, which\r\n- Match "People Also Ask" queries from search results\r\n- Keep answers between 50-100 words\r\n\r\n### Listicle Block\r\n\r\nUse for "Best [X]", "Top [X]", "[Number] ways to [X]" queries.\r\n\r\n**Caveat for self-promotional listicles:** ranking yourself #1 in your own "best [category]" guide gets the page *cited* far more reliably than it gets your brand *recommended* — for emerging brands, AI answers often harvest the competitor names from the guide and recommend them instead. See [citations-vs-recommendations.md](citations-vs-recommendations.md) before building these at scale.\r\n\r\n```markdown\r\n## [Number] Best [Items] for [Goal/Purpose]\r\n\r\n[1-2 sentence intro establishing context and selection criteria]\r\n\r\n### 1. [Item Name]\r\n\r\n[Why it\'s included in 2-3 sentences with specific benefits]\r\n\r\n### 2. [Item Name]\r\n\r\n[Why it\'s included in 2-3 sentences with specific benefits]\r\n\r\n### 3. [Item Name]\r\n\r\n[Why it\'s included in 2-3 sentences with specific benefits]\r\n```\r\n\r\n---\r\n\r\n## Generative Engine Optimization (GEO) Patterns\r\n\r\nThese patterns optimize content for citation by AI assistants like ChatGPT, Claude, Perplexity, and Gemini.\r\n\r\n### Statistic Citation Block\r\n\r\nStatistics increase AI citation rates by 15-30%. Always include sources.\r\n\r\n```markdown\r\n[Claim statement]. According to [Source/Organization], [specific statistic with number and timeframe]. [Context for why this matters].\r\n```\r\n\r\n**Example:**\r\n```markdown\r\nMobile optimization is no longer optional for SEO success. According to Google\'s 2024 Core Web Vitals report, 70% of web traffic now comes from mobile devices, and pages failing mobile usability standards see 24% higher bounce rates. This makes mobile-first indexing a critical ranking factor.\r\n```\r\n\r\n### Expert Quote Block\r\n\r\nNamed expert attribution adds credibility and increases citation likelihood.\r\n\r\n```markdown\r\n"[Direct quote from expert]," says [Expert Name], [Title/Role] at [Organization]. [1 sentence of context or interpretation].\r\n```\r\n\r\n**Example:**\r\n```markdown\r\n"The shift from keyword-driven search to intent-driven discovery represents the most significant change in SEO since mobile-first indexing," says Rand Fishkin, Co-founder of SparkToro. This perspective highlights why content strategies must evolve beyond traditional keyword optimization.\r\n```\r\n\r\n### Authoritative Claim Block\r\n\r\nStructure claims for easy AI extraction with clear attribution.\r\n\r\n```markdown\r\n[Topic] [verb: is/has/requires/involves] [clear, specific claim]. [Source] [confirms/reports/found] that [supporting evidence]. This [explains/means/suggests] [implication or action].\r\n```\r\n\r\n**Example:**\r\n```markdown\r\nE-E-A-T is the cornerstone of Google\'s content quality evaluation. Google\'s Search Quality Rater Guidelines confirm that trust is the most critical factor, stating that "untrustworthy pages have low E-E-A-T no matter how experienced, expert, or authoritative they may seem." This means content creators must prioritize transparency and accuracy above all other optimization tactics.\r\n```\r\n\r\n### Self-Contained Answer Block\r\n\r\nCreate quotable, standalone statements that AI can extract directly.\r\n\r\n```markdown\r\n**[Topic/Question]**: [Complete, self-contained answer that makes sense without additional context. Include specific details, numbers, or examples in 2-3 sentences.]\r\n```\r\n\r\n**Example:**\r\n```markdown\r\n**Ideal blog post length for SEO**: The optimal length for SEO blog posts is 1,500-2,500 words for competitive topics. This range allows comprehensive topic coverage while maintaining reader engagement. HubSpot research shows long-form content earns 77% more backlinks than short articles, directly impacting search rankings.\r\n```\r\n\r\n### Evidence Sandwich Block\r\n\r\nStructure claims with evidence for maximum credibility.\r\n\r\n```markdown\r\n[Opening claim statement].\r\n\r\nEvidence supporting this includes:\r\n- [Data point 1 with source]\r\n- [Data point 2 with source]\r\n- [Data point 3 with source]\r\n\r\n[Concluding statement connecting evidence to actionable insight].\r\n```\r\n\r\n---\r\n\r\n## Fact-Family Fan-Out Matrix\r\n\r\nEngines rewrite a prompt into several background searches before answering, and those searches are often plain fact lookups even when the prompt asked for advice. In Profound\'s 14-day tracking of 10,000 prompts, ChatGPT, Perplexity, and Copilot each ran roughly 1.4–2 searches per answer, but 91% of ChatGPT\'s search queries were unique across repeated runs, against 14% for Perplexity and 47% for Copilot (Profound, April 2026; observational, vendor research). Exact query strings won\'t repeat, so plan content around the stable **fact families** underneath them.\r\n\r\n1. **Pick a prompt family**, with its audience, buying stage, engine, and market.\r\n2. **List the fan-outs.** Use observed queries where you have them (ChatGPT\'s background queries can be extracted; see [format-volatility.md](format-volatility.md)). Otherwise infer them, and mark every inferred row as a hypothesis.\r\n3. **Break the job into fact families:** entities and category terms, factual sub-questions, comparison criteria, constraints (price, compatibility, location, recency), and the evidence that settles them (standards, definitions, reviews, primary data).\r\n4. **Fill the matrix**, one row per fact family:\r\n\r\n| Fact family | Observed or inferred | What the buyer needs | Current best source | Competitor source | Our owning page | Gap |\r\n|---|---|---|---|---|---|---|\r\n| Pricing for 10 seats | Observed | Monthly cost at 10 seats, annual discount | Third-party review (2025 prices) | Competitor pricing page | /pricing | Per-seat price not stated in text |\r\n| SOC 2 status | Inferred | Report type and date | None | Competitor trust page | /security | Page says "enterprise-grade," no report type |\r\n\r\n5. **Give each fact one owning page.** Improve or consolidate an existing page before creating a new one, and create one only when a real information gap exists. One strong page can answer several fact families. Never build a doorway page per fan-out query.\r\n6. **Retest across repeated runs and engines.** Expect different retrieval paths each time; judge by whether the fact family gets answered from your page.\r\n\r\nEngine priors to verify before relying on them: ChatGPT ranges widely across vocabulary and adjacent questions; Perplexity stays close to the prompt\'s own terms; Copilot compresses prompts into short search-style queries.\r\n\r\n*Adapted (re-expressed and restructured) from Profound\'s MIT-licensed ai-retrieval-fanout-mapper skill and its April 2026 study, credited.*\r\n\r\n---\r\n\r\n## Domain-Specific GEO Tactics\r\n\r\nDifferent content domains benefit from different authority signals.\r\n\r\n### Technology Content\r\n- Emphasize technical precision and correct terminology\r\n- Include version numbers and dates for software/tools\r\n- Reference official documentation\r\n- Add code examples where relevant\r\n\r\n### Health/Medical Content\r\n- Cite peer-reviewed studies with publication details\r\n- Include expert credentials (MD, RN, etc.)\r\n- Note study limitations and context\r\n- Add "last reviewed" dates\r\n\r\n### Financial Content\r\n- Reference regulatory bodies (SEC, FTC, etc.)\r\n- Include specific numbers with timeframes\r\n- Note that information is educational, not advice\r\n- Cite recognized financial institutions\r\n\r\n### Legal Content\r\n- Cite specific laws, statutes, and regulations\r\n- Reference jurisdiction clearly\r\n- Include professional disclaimers\r\n- Note when professional consultation is advised\r\n\r\n### Business/Marketing Content\r\n- Include case studies with measurable results\r\n- Reference industry research and reports\r\n- Add percentage changes and timeframes\r\n- Quote recognized thought leaders\r\n\r\n---\r\n\r\n## Voice Search Optimization\r\n\r\nVoice queries are conversational and question-based. Optimize for these patterns:\r\n\r\n### Question Formats for Voice\r\n- "What is..."\r\n- "How do I..."\r\n- "Where can I find..."\r\n- "Why does..."\r\n- "When should I..."\r\n- "Who is..."\r\n\r\n### Voice-Optimized Answer Structure\r\n- Lead with direct answer (under 30 words ideal)\r\n- Use natural, conversational language\r\n- Avoid jargon unless targeting expert audience\r\n- Include local context where relevant\r\n- Structure for single spoken response\r\n',
  },
  {
    skillId: "ai-seo",
    path: "references/content-types.md",
    content:
      '# AI SEO by Content Type\r\n\r\nTactical guidance for optimizing specific content types for AI search citation. These tactics work for non-Google AI engines (ChatGPT, Claude, Perplexity, Copilot) and don\'t hurt Google AI Overviews / AI Mode.\r\n\r\nFor the cross-cutting strategy, see [SKILL.md](../SKILL.md).\r\n\r\n---\r\n\r\n## SaaS Product Pages\r\n\r\n**Goal:** Get cited in "What is [category]?" and "Best [category]" queries. (Citation is the realistic goal here; being *recommended* in the answer depends on offsite consensus — see [citations-vs-recommendations.md](citations-vs-recommendations.md).)\r\n\r\n**Optimize:**\r\n- Clear product description in first paragraph (what it does, who it\'s for)\r\n- Feature comparison tables (you vs. category, not just competitors)\r\n- Specific metrics ("processes 10,000 transactions/sec" not "blazing fast")\r\n- Customer count or social proof with numbers\r\n- Pricing transparency (AI cites pages with visible pricing) — add a `/pricing.md` file so AI agents can parse your plans without rendering your page (see "Machine-Readable Files" in the main skill)\r\n- FAQ section addressing common buyer questions\r\n\r\n---\r\n\r\n## Blog Content\r\n\r\n**Goal:** Get cited as an authoritative source on topics in your space.\r\n\r\n**Optimize:**\r\n- One clear target query per post (match heading to query)\r\n- Definition in first paragraph for "What is" queries\r\n- Original data, research, or expert quotes\r\n- "Last updated" date visible\r\n- Author bio with relevant credentials\r\n- Internal links to related product/feature pages\r\n\r\n---\r\n\r\n## Comparison / Alternative Pages\r\n\r\n**Goal:** Get cited in "[X] vs [Y]" and "Best [X] alternatives" queries.\r\n\r\n**Optimize:**\r\n- Structured comparison tables (not just prose)\r\n- Fair and balanced (AI penalizes obviously biased comparisons)\r\n- Specific criteria with ratings or scores\r\n- Updated pricing and feature data\r\n- Cite the `competitors` skill for building these pages\r\n\r\n---\r\n\r\n## Industry / Segment Pages\r\n\r\n**Goal:** Get recommended when a prompt names an industry or company size ("email marketing software for e-commerce," "RFP software for government," "enterprise [category]"). Models increasingly sort brands into segments and personalize answers, so a generic page can lose to a competitor\'s segment page.\r\n\r\n**Optimize:**\r\n- One page per core industry or segment you actually serve, with industry-specific workflows, integrations, compliance, and customer proof\r\n- Start with core segments. Many pages are fine if each adds real, segment-specific value; templated pages that only swap the industry name are what the scaled-content policy targets (see the `programmatic-seo` skill)\r\n- Match the segment language used on your third-party profiles (see [positioning-and-consensus.md](positioning-and-consensus.md))\r\n\r\n---\r\n\r\n## Documentation / Help Content\r\n\r\n**Goal:** Get cited in "How to [X] with [your product]" queries.\r\n\r\n**Optimize:**\r\n- Step-by-step format with numbered lists\r\n- Code examples where relevant\r\n- HowTo schema markup\r\n- Screenshots with descriptive alt text\r\n- Clear prerequisites and expected outcomes\r\n\r\n---\r\n\r\n## Local Business / Ecom (Google emphasis)\r\n\r\nGoogle\'s AI features pull from product feeds and business profiles for local + ecom queries. Optimize:\r\n\r\n- **Merchant Center feeds** kept current with accurate inventory, pricing, attributes\r\n- **Google Business Profile** complete with hours, services, photos, posts, Q&A answered\r\n- **Reviews** — recent + sufficient volume; respond to reviews to signal active management\r\n- **Service area schema** for local services\r\n- **Business Agent** (where available) for conversational customer engagement\r\n',
  },
  {
    skillId: "ai-seo",
    path: "references/format-volatility.md",
    content: `# Format Volatility — Which Content Formats AI Cites (and How Fast That Changes)\r
\r
Citation-*source* volatility (Reddit wiped overnight, Gemini favoring owned sites) is covered in [agent-readiness.md](agent-readiness.md). This reference covers the second volatility axis: citation-*format* — which page types AI engines retrieve and cite, and the August 2026 evidence that heavily-exploited formats get demoted.\r
\r
Read this before recommending comparison pages, listicles, or "best X" content for AI visibility. The advice changed materially with ChatGPT 5.6.\r
\r
## The ChatGPT 5.6 format shift (August 2026)\r
\r
Data from Peec AI (shared by Tomek Rudzki via Lily Ray, Aug 2026), comparing ChatGPT retrieval behavior before and after the 5.6 launch:\r
\r
**Fan-out queries** — the modifiers that declined most as a share of ChatGPT's background searches:\r
\r
- "vs"\r
- "comparison"\r
- "top"\r
- "best"\r
- "reviews"\r
\r
At the same time: a surge in \`site:\` searches and modifiers like **"official"**.\r
\r
**Citations by page type** — share of total ChatGPT citations:\r
\r
| Page type | Pre-5.6 | Post-5.6 | Change |\r
|---|---:|---:|---:|\r
| Listicles ("Top 10 X," "8 best Y") | 15.77% | 7.80% | **−50.5%** |\r
| Comparison pages ("X vs Y," alternatives) | 9.08% | 6.17% | **−32.1%** |\r
\r
The interpretation (Lily Ray's, and it fits the fan-out data): these are exactly the two formats companies scaled for GEO over the prior 18 months, and ChatGPT adjusted retrieval to mitigate the spam. The \`site:\`/"official" surge points the same direction — **toward primary sources and owned domains, away from aggregator formats**.\r
\r
## What this changes (and what it doesn't)\r
\r
**It does NOT mean "stop making comparison pages."** Comparison and best-of content still:\r
\r
- Converts human buyers (its original job)\r
- Gets cited by Google AI Overviews (which follow core rankings, not ChatGPT's retrieval)\r
- Feeds Gemini and Perplexity, which haven't shown the same demotion\r
- Answers real mid-funnel queries on your own site\r
\r
**It DOES mean:**\r
\r
1. **Stop justifying scaled listicle/comparison production with "it wins AI citations."** On ChatGPT — the largest AI answer surface — that rationale lost half its force in one release.\r
2. **The "official"/primary-source shift favors your owned pages.** Product pages, docs, pricing pages, original research — the pages only you can publish — are rising as the citable class. This compounds the Gemini finding (business-owned sites ≈ 60% of citations).\r
3. **Format strategy is now per-platform.** Check which engines matter for your category before choosing formats:\r
\r
| Format | ChatGPT (post-5.6) | Google AIO | Gemini | Perplexity |\r
|---|---|---|---|---|\r
| Listicles / best-of | Demoted | Rankings-dependent | OK | OK |\r
| Comparison / vs pages | Demoted | Rankings-dependent | OK | OK |\r
| Original research + data | Strong | Strong | Strong | Strong |\r
| Product/docs/pricing (owned, "official") | **Rising** | Strong | **Dominant** | Strong |\r
| How-to / guides | Steady | Strong | OK | Strong |\r
\r
*(Table caveat: the demotion was measured on ChatGPT only. "OK" for Gemini/Perplexity means no demotion has been reported there — not that stability was measured. Any engine can ship its own 5.6-style shift.)*\r
\r
4. **Treat every number above as a dated snapshot.** Same doctrine as source volatility: these are Aug 2026 measurements of a moving system. Verify against your own citation monitoring before betting budget.\r
\r
## LinkedIn as a citation surface\r
\r
LinkedIn is among the most-cited domains for professional queries, but the surface mix shifted during 2026 and differs by engine: ChatGPT moved from Pulse articles to feed posts, Perplexity and Copilot still cite articles and company pages, and Gemini barely cites LinkedIn at all. A post's first words still become its URL slug, so front-load the target phrase.\r
\r
Correction: LinkedIn's guide doesn't say Articles get ~60% of citations versus ~40% for Posts. It says articles, newsletters, and posts *combined* account for 60%. Third-party splits put Articles ahead overall (roughly 60–70% vs 25–35%), but not on ChatGPT anymore.\r
\r
Full breakdown by engine, crawler access, a \`noindex\` self-check, and what makes posts citable: [linkedin-ai-citations.md](linkedin-ai-citations.md).\r
\r
## DIY diagnostic: extract ChatGPT's real fan-out queries\r
\r
You don't need a tool to see what ChatGPT actually searches for in your niche (method circulating publicly, Aug 2026):\r
\r
1. Run an important query for your category in ChatGPT (with search).\r
2. Open DevTools → Network tab, refresh the conversation (URL id after \`/c/\`).\r
3. Find the conversation response payload and search it for \`queries\`.\r
4. You'll see the literal background searches ChatGPT fanned out to.\r
\r
**Use it for:** building your query-test list from *real* fan-out behavior instead of guesses; checking whether your category's fan-outs still use "best/vs" modifiers or have shifted to \`site:\`/"official" patterns; finding sub-topics your content doesn't cover.\r
\r
**Then work backwards from the domains.** If the fan-out runs \`site:\` searches on third-party sources (Gartner, G2, Capterra) for your category, those profiles are your priority list, often ahead of new pages on your own site. See [positioning-and-consensus.md](positioning-and-consensus.md).\r
\r
**Do not use it for:** auto-generating and mass-publishing an article per fan-out query. That's the exact scaled-content pattern 5.6 demoted (and Google's scaled content abuse policy names). The diagnostic is for coverage planning, not content spam.\r
\r
## Measurement rigor: AI answers are non-deterministic\r
\r
A single ChatGPT answer is an anecdote, not a measurement — the same prompt returns different sources run-to-run. (The statistical-rigor framing here is popularized by Initial Commit's AEO audit skill, Josh Pigford, Aug 2026; the practice stands on its own.)\r
\r
When auditing or monitoring:\r
\r
- **Track prompts like keywords.** "I'm looking for the best X," "what is the best X," and "find me the best X" usually return the same brands. Collapse wording variants into one core prompt per intent, and spend the budget on repeat runs instead.\r
- **Run each query 3–5 times per platform**, fresh session each time.\r
- **Track mention/citation *rate*** ("cited in 3 of 5 runs"), never a yes/no from one run.\r
- **Report the sample size** with every number ("40% mention rate, n=5") so future-you knows how much to trust it.\r
- **Compare rates over time, not runs.** A drop from 4/5 to 3/5 is noise; a drop from 4/5 to 0/5 sustained across a month is signal.\r
- Before diagnosing *why* you're not cited, split causes the way an audit should: **technical** (can't be crawled/parsed — see agent-readiness.md), **comprehension** (AI describes you inaccurately or vaguely), or **trust** (understood but not selected — see citations-vs-recommendations.md).\r
\r
---\r
\r
*Sources, all labeled and dated: Peec AI pre/post-5.6 citation data via Tomek Rudzki and Lily Ray (Aug 2026); LinkedIn's AEO guide numbers via Chris Long (Sep 2026, platform-reported); fan-out extraction method as publicly circulated (Aug 2026); measurement-rigor framing credited to Initial Commit's AEO audit skill (Josh Pigford, Aug 2026). All snapshots of a volatile system — verify against your own monitoring.*\r
`,
  },
  {
    skillId: "ai-seo",
    path: "references/linkedin-ai-citations.md",
    content:
      "# LinkedIn Content That Gets Cited by AI\r\n\r\nLinkedIn is one of the most-cited domains for professional and B2B queries. But which LinkedIn surface gets cited depends heavily on the engine, and the mix moved sharply during 2026. Treat every number here as a dated snapshot and check your own prompts.\r\n\r\n## Contents\r\n- Which Surface, Which Engine\r\n- Who Can Crawl What\r\n- What Makes LinkedIn Content Citable\r\n- Durability\r\n- Risks\r\n- Checklist\r\n- Sources\r\n\r\n---\r\n\r\n## Which Surface, Which Engine\r\n\r\n| Engine | What it cites from LinkedIn (2026) |\r\n|---|---|\r\n| **ChatGPT** | Shifted from Pulse articles to feed posts. Ahrefs data shows ChatGPT citations of `/pulse/` down ~86% and `/posts/` up ~74% between May and Oct 2026, with a ~36% overall LinkedIn drop in the mid-August retrieval change that also hit Reddit |\r\n| **Perplexity** | Largest raw count of LinkedIn citations in OtterlyAI's sample and our Ahrefs pull, with company pages the biggest share in Ahrefs. (Semrush, measuring the share of answers that cite LinkedIn at all, found it lower on Perplexity than on ChatGPT or AI Mode, so the ranking depends on the measure) |\r\n| **Copilot** | Cites LinkedIn heavily and increasingly (citations more than doubled May → Oct 2026, ~6.5× its Reddit citations). Pulse and posts both appear |\r\n| **Google AI Overviews / AI Mode** | Posts and Pulse both cited, plus company pages |\r\n| **Gemini** | Almost never cites LinkedIn (~0 in three separate datasets). Don't count on LinkedIn for Gemini visibility |\r\n| **Claude** | Its search crawler is allowed on articles, posts, profiles, and company pages; little published citation data |\r\n\r\n**What this means:**\r\n- Publish both: feed posts for ChatGPT, long-form articles for Perplexity, Copilot, and Google's AI features.\r\n- Maintain the company page as well as people's profiles. Perplexity cites company pages most; ChatGPT and AI Mode mostly cite individual members.\r\n- Skip collaborative articles (`/advice/`). They're effectively uncited now.\r\n\r\n**Our Ahrefs snapshot** (citations of linkedin.com URLs in Ahrefs' AI-responses data, pulled 2026-10-02; the prompt pool changes over time, so treat as directional):\r\n\r\n| Path | ChatGPT, May 1 | ChatGPT, now | Perplexity | AI Overviews | AI Mode | Copilot | Gemini |\r\n|---|---|---|---|---|---|---|---|\r\n| All linkedin.com | 239K | 185K | 787K | 352K | 292K | 154K (65K in May) | ~0.7K |\r\n| `/pulse/` articles | 22.7K | 3.3K | 84K | 43K | 51K | 23K | ~0 |\r\n| `/posts/` | 17.7K | 30.8K | 133K | 62K | 55K | 18K | 0 |\r\n| `/company/` | — | — | 474K | 51K | 41K | 15K | — |\r\n| `/in/` profiles | — | — | 103K | 12K | 13K | 15K | — |\r\n\r\n---\r\n\r\n## Who Can Crawl What\r\n\r\nLinkedIn's robots.txt (checked 2026-10-02):\r\n\r\n| Crawler | Articles, posts, profiles, company pages |\r\n|---|---|\r\n| Googlebot, Bingbot | Allowed |\r\n| OAI-SearchBot (ChatGPT search), Claude-SearchBot | Allowed |\r\n| GPTBot, ChatGPT-User, ClaudeBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, CCBot | Blocked |\r\n\r\nSo ChatGPT and Claude can cite LinkedIn from their search indexes, but their live \"go read this page\" agents can't fetch it. Perplexity cites LinkedIn most despite both of its bots being blocked, presumably through another index.\r\n\r\n**Check your own articles for `noindex`.** LinkedIn appears to noindex some Pulse articles, reportedly from low-follower or low-engagement accounts, and only for crawlers, so the logged-in author never sees it (one small test, n=3). Check both the robots meta tag and the `X-Robots-Tag` header on the final response, for each crawler you care about:\r\n\r\n```bash\r\nURL=https://www.linkedin.com/pulse/your-article-slug\r\nfor UA in Googlebot bingbot OAI-SearchBot; do\r\n  echo \"== $UA\"\r\n  curl -sIL -A \"$UA\" \"$URL\" | grep -iE '^(HTTP/|x-robots-tag)'\r\n  curl -sL -A \"$UA\" \"$URL\" | grep -ioE '<meta[^>]+name=\"(robots|googlebot|bingbot)\"[^>]*>'\r\ndone\r\n```\r\n\r\nA `noindex` in either place for a crawler means that engine's index likely won't carry the article. An absent tag isn't proof it's indexed; confirm with a `site:` search.\r\n\r\n---\r\n\r\n## What Makes LinkedIn Content Citable\r\n\r\n**Supported by independent data:**\r\n- **Engagement barely matters.** Likes and comments show almost no correlation with citation. The median cited post has 15–25 reactions; 100 reactions get cited about as often as 10,000.\r\n- **Follower count matters little.** Authors under 500 followers get cited, and about half of citations come from authors under 10K.\r\n- **Original over reshared.** About 95% of cited posts are original.\r\n- **Teach something.** Most cited posts share knowledge or advice.\r\n- **Consistency.** About 75% of cited post authors posted 5+ times in the prior four weeks.\r\n- **Length.** Cited articles are mostly 500–2,000 words; cited posts mostly 50–300 words.\r\n- **Recent.** About half of cited content is under three months old.\r\n\r\n**Vendor causal model (Scrunch, ~4K posts, treat as directional):** technical detail (+77%), named entities like tools, companies, and people (+33%), and a niche topic (+18%) raised citation. Unicode bold or italic text (−58%) and \"link in comments\" (−31%) lowered the post's own citations. The study is about ChatGPT, and it also found link-in-comments can help the linked page get cited, so it's a trade-off if your goal is citations for your own site.\r\n\r\n**Platform-reported (LinkedIn's guide, Mar 2026):** articles of 800–1,200 words, posts of 200–300 words, post 2–3 times a week. The guide also suggests 3,000+ followers and 10+ comments help, which the independent data above doesn't support.\r\n\r\n**Mechanics:**\r\n- A post's first words become its URL slug, so front-load the target phrase.\r\n- Structure articles like blog content: clear headings, a direct answer early, specific numbers and names.\r\n\r\n---\r\n\r\n## Durability\r\n\r\n- Citations can be durable for specific, low-competition prompts. One B2B writer's six Pulse articles were cited in 54–86% of 28 tracked runs over ~20 weeks for a niche prompt (Kaleigh Moore, Sep 2026, anecdote).\r\n- At the platform level they're volatile. One fixed-prompt study measured LinkedIn's share of AI answers falling ~65% from Feb to Jul 2026, while others measured it rising on Perplexity over the same months. Track by engine, and don't put all your third-party effort into LinkedIn (see the volatility section in [agent-readiness.md](agent-readiness.md)).\r\n\r\n---\r\n\r\n## Risks\r\n\r\n- **No canonical control.** LinkedIn sets its own canonical on articles, so a full republish of your blog post competes with your own page. Publish on your site first, then post an adapted version (rewrite a meaningful share of it) or a summary that links back.\r\n- **You don't own it.** LinkedIn decides indexing, can noindex articles, and changes formats. By default, US members' content can be used to train LinkedIn and Microsoft models.\r\n- **Gemini blind spot.** Visibility built on LinkedIn won't carry to Gemini.\r\n\r\n---\r\n\r\n## Checklist\r\n\r\n- [ ] Feed posts and long-form articles both in the mix, matched to the engines you care about\r\n- [ ] Company page complete and consistent with your About page (see [positioning-and-consensus.md](positioning-and-consensus.md))\r\n- [ ] Target phrase in a post's first words\r\n- [ ] Original, specific, technical content with named entities; no Unicode bold; decide deliberately where the link goes (in-post helps the post, in-comments may help the destination)\r\n- [ ] Articles checked for crawler `noindex`\r\n- [ ] Blog posts published on your own site first; LinkedIn version adapted, not duplicated\r\n- [ ] Citations tracked per engine, re-checked monthly\r\n\r\n---\r\n\r\n## Sources\r\n\r\nAll dated; most are vendor studies running their own trackers, so none is fully neutral.\r\n\r\n- Profound, LinkedIn as most-cited domain for professional queries (Mar 2026): https://www.tryprofound.com/blog/linkedin-is-the-most-cited-domain-for-professional-queries-in-ai-search\r\n- Semrush, LinkedIn AI visibility study, 325K prompts (Mar 2026): https://www.semrush.com/blog/linkedin-ai-visibility-study/\r\n- OtterlyAI, LinkedIn AI search citations study, 1.31M citations (Jun 2026): https://otterly.ai/blog/linkedin-ai-search-citations-study/\r\n- Cloro, LinkedIn articles vs posts (Aug–Sep 2026): https://cloro.dev/blog/linkedin-articles-vs-posts/\r\n- Goodie, social media AI citations study (Sep 2026): https://higoodie.com/blog/social-media-ai-citations-study-2026/\r\n- Scrunch, LinkedIn posts and ChatGPT citations (May 2026): https://scrunch.com/blog/linkedin-posts-robots-cant-resist-what-data-says-about-chatgpt-citations\r\n- Mid-August 2026 ChatGPT source shift (Promptwatch, Petra Labs): https://somethinginc.com/blog/chatgpt-citation-sources-docs-replaced-reddit/\r\n- Ahrefs AI responses data by URL path, pulled 2026-10-02 (directional; the prompt pool changes over time)\r\n- LinkedIn robots.txt, fetched 2026-10-02; LinkedIn's AEO guide (Mar 2026)\r\n",
  },
  {
    skillId: "ai-seo",
    path: "references/multilingual-and-commerce.md",
    content:
      "# Multilingual AEO and AI Shopping Surfaces\r\n\r\nTwo extensions of the core workflow that fail in predictable ways: translating an English AEO plan into other markets, and investing in AI shopping surfaces for products those surfaces rarely show.\r\n\r\n## Multilingual and multi-market AEO\r\n\r\nThe language of the query changes which sources get cited. Profound's analysis of 3.25 billion citations across seven models and 14 countries, using native-language prompts, found citation mix and social-source rates shifted materially with query language (Profound, April 2026). Spanish-language markets looked alike across countries, so language sometimes mattered more than geography. Platforms diverged too: Google AI Overviews drew on a varied set of local social sources, while ChatGPT's social citations stayed concentrated on Reddit. Profound sells AI visibility tracking; treat these as vendor research and validate in your own category.\r\n\r\n### Checklist\r\n\r\n1. **Treat language and country as separate dimensions.** Spanish in Mexico, Spanish in Spain, and English in Mexico are three configurations.\r\n2. **Build prompts from native-language demand.** Use local customer research, local search terms, and native speakers. Don't translate the English prompt list word for word; category names, units, and decision criteria differ.\r\n3. **Run each prompt on each target engine** and classify cited sources: owned, competitor, earned editorial, institutional, social, marketplace or directory (taxonomy in [citations-vs-recommendations.md](citations-vs-recommendations.md)).\r\n4. **Find the local source market.** Note which local publishers, directories, review sites, communities, and authorities recur per engine. Don't assume Reddit, YouTube, LinkedIn, or a global publisher matters equally everywhere.\r\n5. **Audit local facts.** Prices and currency, availability, policies, legal claims, support hours, and local entities. A wrong local price is a critical error (see [answer-accuracy.md](answer-accuracy.md)).\r\n6. **Separate three gap types.** A translation gap means the page exists but not in this language. An information gap means the fact doesn't exist anywhere locally. An entity gap means local profiles describe you inconsistently.\r\n7. **Recommend local channels only where the local citation mix supports them.**\r\n8. **Assign native-language review and a freshness owner** for every localized page.\r\n9. **Report each language, country, and engine separately** before rolling anything up.\r\n\r\n## AI shopping surfaces\r\n\r\nAI shopping features (ChatGPT Shopping, product results in Google AI Mode, and similar) are worth investing in only for categories they actually show. In Profound's tests, product category was a stronger trigger for ChatGPT Shopping than purchase-intent wording: physical consumer products activated it far more often than software, services, travel, or financial products (Profound, March 2026; observational, and OpenAI hasn't published the trigger rules). Verify current merchant and feed requirements in each platform's documentation.\r\n\r\n### Fit check first\r\n\r\nClassify the offering before auditing anything:\r\n\r\n| Offering | Typical fit |\r\n|---|---|\r\n| Shippable consumer product, consumables | Strong; audit in full |\r\n| Large equipment or vehicles | Test narrowly |\r\n| Software, digital products, services, travel, financial products | Usually weak; put the effort into ordinary AI recommendations instead |\r\n| Local-only offerings | Focus on local surfaces and Business Profile |\r\n\r\nThen test with repeated representative prompts. Cards and offers vary between runs, so one carousel is not a ranking.\r\n\r\n### Data audit (when the fit is real)\r\n\r\n- Canonical title and description, brand, and identifiers (GTIN, MPN)\r\n- Category, attributes, variants, sizes, colors, and compatibility\r\n- Images\r\n- Price, currency, sale status, and availability, with how fast changes propagate\r\n- Shipping, returns, and merchant policies\r\n- Reviews and ratings from real customers\r\n\r\nCompare the feed, product page, structured data, merchant records, and marketplace listings for conflicts. Fix wrong data before any editorial work. Track three outcomes separately: whether the product is included, whether you are the headline merchant or offer, and whether you appear among all offers.\r\n\r\nNever fabricate reviews, ratings, availability, or discounts. For the agent-side protocols (Merchant Center, UCP), see the Agentic Experiences section in SKILL.md.\r\n\r\n---\r\n\r\n*Framework lineage: the market checklist and commerce fit check adapted (re-expressed and restructured) from Profound's MIT-licensed international-aeo-strategist and ai-commerce-readiness-auditor skills and their studies (March and April 2026), credited.*\r\n",
  },
  {
    skillId: "ai-seo",
    path: "references/okf.md",
    content:
      "# Open Knowledge Format (OKF)\r\n\r\nGoogle's v0.1 markdown spec for representing site content as an agent-readable bundle. Introduced on the [Google Cloud blog](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) on 2026-06-12 and shipped inside Knowledge Catalog.\r\n\r\n## What it is\r\n\r\nOKF is a directory of cross-linked markdown files. Each file has:\r\n\r\n- A YAML frontmatter block (`type` required; `title`, `description`, `resource`, `tags`, `timestamp` recommended)\r\n- A standard markdown body\r\n- Standard markdown links to other files in the bundle (which the spec treats as concept relationships)\r\n\r\nAn optional `index.md` lists the files for progressive disclosure. The bundle can be distributed as a git repo (recommended), a tarball/zip, or a subdirectory of a larger repo.\r\n\r\nThe [full spec](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/HEAD/okf/SPEC.md) fits on one page. The repo lives under `GoogleCloudPlatform` (the \"not an official Google product\" disclaimer is Google's standard open-source boilerplate, not a denial — it appears on most of Google's open-source repos including their main AI samples repo).\r\n\r\n### A minimal concept file\r\n\r\n```markdown\r\n---\r\ntype: Article\r\ntitle: How to Connect the Ahrefs MCP Server to Manus\r\ndescription: The official MCP servers, why they did not connect, and the fix.\r\nresource: https://yoursite.com/blog/ahrefs-mcp-manus/\r\ntags: [mcp, ahrefs]\r\n---\r\n\r\n# How to Connect the Ahrefs MCP Server to Manus\r\n\r\nThe body of the post, as clean markdown.\r\n```\r\n\r\nAdd an `index.md` that lists all files so an agent can see the bundle's shape before opening each file, and that is the entire format.\r\n\r\n## Honest framing\r\n\r\n**Google built OKF for data teams sharing catalog metadata** — BigQuery tables, API endpoints, metrics, playbooks. Most of the spec's examples are data-team artifacts, not blog posts. Google's blog post framing: \"improve data sharing\" and \"standardized documentation\" for collaboration across teams.\r\n\r\nPointing OKF at a marketing site is a **clever repurposing** popularized by [Suganthan Mohanadasan](https://suganthan.com/blog/open-knowledge-format/). It's a legitimate use case for the format but not Google's primary one. Frame it accurately when explaining it to founders or marketing teams.\r\n\r\n## What it does for AI search today\r\n\r\nNothing immediate. Nothing crawls the web for OKF bundles yet — the spec is weeks old, no AI engine has announced integration, and Knowledge Catalog ingests bundles only for paying enterprise customers' data teams.\r\n\r\nTreat OKF as **protocol-layer registration** — the same shape of bet as early `schema.org` adoption was a decade ago. Schema took the better part of ten years to pay off; people who shipped it early are still glad they did.\r\n\r\nA secondary benefit that pays off today regardless: **generating the bundle is itself an internal-linking audit**. Suganthan's tool draws every page as a node and every internal link as an edge, so islands and orphans become obvious at a glance.\r\n\r\n## Where OKF fits in the agent-readable stack\r\n\r\n| Layer | Purpose |\r\n|---|---|\r\n| `sitemap.xml` | Tells a crawler which URLs exist |\r\n| `robots.txt` (with AI bot rules) | Permits or blocks AI crawlers |\r\n| `llms.txt` | Points an agent at the handful of pages you most want read |\r\n| `/pricing.md` | Structured pricing for agent-buyer comparisons |\r\n| **`/okf/` bundle** | Hands over the content itself as cross-linked concepts |\r\n| Schema markup | Per-page structured data (Article, FAQPage, Product, etc.) |\r\n\r\nThese stack rather than compete. `llms.txt` is a signpost, OKF is the library.\r\n\r\n## How to ship one\r\n\r\nThree options, ordered by how much effort they take:\r\n\r\n### 1. Suganthan's free web tool (recommended for most sites)\r\n\r\n[suganthan.com/okf-generator](https://suganthan.com/okf-generator/) — paste a URL or sitemap, crawls up to 100 pages, returns a downloadable bundle. Also draws the resulting page graph so you can spot disconnected pages before publishing.\r\n\r\n### 2. WordPress plugin (pending wp.org approval)\r\n\r\nSuganthan's plugin (free, GPL, awaiting wp.org approval at time of writing) installs in a minute, serves the bundle at `/okf/`, and rebuilds on every publish or edit so it stays in sync. Direct download link is in [his blog post](https://suganthan.com/blog/open-knowledge-format/). Requires WordPress 6.0+ and PHP 7.4+. Read-only — never edits posts or settings.\r\n\r\n### 3. By hand\r\n\r\nOnly practical for a handful of pages. Each post becomes a markdown file with frontmatter that you cross-link manually. Miserable for a whole site.\r\n\r\n## Hosting & discovery\r\n\r\nServe the bundle at `yoursite.com/okf/`, starting with `yoursite.com/okf/index.md`:\r\n\r\n- **Static hosts / Cloudflare**: drag and drop\r\n- **WordPress**: Suganthan's plugin handles the serving\r\n- **Static sites with custom paths**: upload the directory to `/okf/`\r\n- **Closed platforms (Wix, Squarespace, most page-builders)**: you usually can't serve files at custom paths — skip OKF entirely\r\n\r\nAfter it's serving, add a line to `llms.txt` pointing to the bundle so agents that read `llms.txt` (today) can discover the bundle (later).\r\n\r\n## When to skip\r\n\r\n- Site is <10 pages — overhead exceeds payoff\r\n- Site is on a closed platform that won't allow custom paths\r\n- You're not maintaining `llms.txt`, schema markup, or other machine-readable files (OKF compounds with those; alone it does nothing)\r\n- You can't budget the 30 minutes a quarter to refresh the bundle as content changes\r\n\r\n## What to watch\r\n\r\nOKF is v0.1, weeks old. Worth tracking, not worth obsessing over:\r\n\r\n- Whether Google announces OKF support in AI Overviews / Knowledge Graph (currently no signal)\r\n- Whether non-Google engines (ChatGPT, Perplexity, Claude) announce OKF reading\r\n- Whether the spec moves to v1.0 (breaking changes are possible at <1.0)\r\n- Whether Knowledge Catalog adds public ingestion endpoints\r\n- Adoption signals — search GitHub for `okf/index.md` to see who's shipping bundles\r\n",
  },
  {
    skillId: "ai-seo",
    path: "references/platform-ranking-factors.md",
    content:
      "# How Each AI Platform Picks Sources\r\n\r\nEach AI search platform has its own search index, ranking logic, and content preferences. This guide covers what matters for getting cited on each one.\r\n\r\nSources cited throughout: Princeton GEO study (KDD 2024), SE Ranking's domain study (Nov 2025), Sellm.io's ranking-factor model, and Profound's citation data (2025). Most are vendor research with correlational methods.\r\n\r\n**Evidence order.** Weigh claims in this order: (1) official engine documentation and webmaster guidance, (2) controlled experiments and primary research, (3) large observational datasets, (4) practitioner case studies and commentary. When official guidance and observational data conflict, follow the documentation for eligibility and crawler controls and test the observation. Every number below is a dated snapshot of a moving system; re-check it before quoting it to a client.\r\n\r\n---\r\n\r\n## The Fundamentals\r\n\r\nEvery AI platform shares three baseline requirements:\r\n\r\n1. **Your content must be in their index** — Each platform uses a different search backend (Google, Bing, Brave, or their own). If you're not indexed, you can't be cited.\r\n2. **Your content must be crawlable for discovery** — Allow the relevant search-discovery path through robots.txt and your WAF; model-training controls are separate.\r\n3. **Your content must be extractable** — AI systems pull passages, not pages. Clear structure and self-contained paragraphs win.\r\n\r\nBeyond these basics, each platform weights different signals. Here's what matters and where.\r\n\r\n---\r\n\r\n## Google AI Overviews\r\n\r\nGoogle AI Overviews pull from Google's own index and lean heavily on E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness). BrightEdge measured them on about 48% of its tracked queries in February 2026, with wide swings by industry (most B2B tech and healthcare queries, few shopping queries).\r\n\r\n**What makes Google AI Overviews different:** They already have your traditional SEO signals — backlinks, page authority, topical relevance. The additional AI layer adds a preference for content with cited sources and structured data. The GEO study (Aggarwal et al., 2023) found that adding citations, quotations, and statistics raised visibility by roughly 30–40% on its own metric; individual examples in the paper show much larger jumps, but those aren't typical or additive.\r\n\r\n**AI Overviews don't just recycle the traditional Top 10.** Some studies have put the overlap between AI Overview sources and conventional organic results as low as ~15%, though figures vary widely by study, date, and query set. Pages that wouldn't crack page 1 can still get cited with clear, extractable answers. Even so, practitioners consistently find that better organic rankings mean better AI visibility, so don't treat the low-overlap stat as permission to skip SEO.\r\n\r\n**What to focus on:**\r\n- Schema markup gives AI Overviews structured context (Article, HowTo, Product). It's one lever among several, and Google says no special markup is required for AI features. Google limited FAQ rich results to government and health sites in 2023, so don't promise an AI lift from FAQPage schema\r\n- Build topical authority through content clusters with strong internal linking\r\n- Include named, sourced citations in your content (not just claims)\r\n- Author bios with real credentials matter — E-E-A-T is weighted heavily\r\n- Get into Google's Knowledge Graph where possible (an accurate Wikipedia entry helps)\r\n- Target \"how to\" and \"what is\" query patterns — these trigger AI Overviews most often\r\n\r\n**Watch for OKF.** In June 2026 Google introduced the [Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) — a markdown spec for agent-readable site bundles. There is no confirmed signal that AI Overviews factor it in today, but the spec is published, the GitHub repo lives under `GoogleCloudPlatform`, and it ships inside Knowledge Catalog. For protocol-layer \"register early\" plays, it has the same shape as early schema.org adoption did a decade ago. See **Machine-Readable Files for AI Agents** in the main `SKILL.md` for how to generate and serve a bundle.\r\n\r\n---\r\n\r\n## ChatGPT\r\n\r\nChatGPT's web search draws from a Bing-based index. It combines this with its training knowledge to generate answers, then cites the web sources it relied on.\r\n\r\n**What makes ChatGPT different:** Link authority correlates strongly with citation. SE Ranking's study of 129,000 domains (Nov 2025) found referring domains were the single strongest predictor: sites with up to 2,500 referring domains averaged 1.6–1.8 citations, sites with more than 350,000 averaged 8.4, and citations nearly doubled past about 32,000. It's a correlation, and big brands have both links and everything else.\r\n\r\n**Freshness is a major differentiator.** Several vendor studies report that recently updated pages earn several times more ChatGPT citations than stale ones. The multipliers vary by study and none is well documented, so treat freshness as a strong lean and don't forecast with any one multiplier.\r\n\r\n**Content-answer fit matters most among page-level signals.** Sellm.io trained a model on 400,000+ URLs across 10,000 queries (undated vendor study) and found that how closely a page's substance and structure match ChatGPT's own answer was its strongest predictor of citation, well ahead of domain authority and on-page structure. Write the direct answer the question deserves, and you're more likely to be the source it cites.\r\n\r\n**Where ChatGPT looks beyond your site:** In Profound's data from Aug 2024 to Jun 2025 (680 million citations), Wikipedia took 7.8% of ChatGPT citations, Reddit 1.8%, and Forbes 1.1%. Those shares have moved since: ChatGPT's August 2026 retrieval changes nearly removed Reddit as a source (see the volatility section in [agent-readiness.md](agent-readiness.md)). Company sites took most citations in Profound's later dataset (see [citations-vs-recommendations.md](citations-vs-recommendations.md)), and third-party mentions still shape recommendations.\r\n\r\n**What to focus on:**\r\n- Invest in earned links and authority; referring domains were the strongest correlate in SE Ranking's study\r\n- Update competitive content at least monthly\r\n- Structure your content the way ChatGPT structures its answers (conversational, direct, well-organized)\r\n- Include verifiable statistics with named sources\r\n- Clean heading hierarchy (H1 > H2 > H3) with descriptive headings\r\n\r\n---\r\n\r\n## Perplexity\r\n\r\nPerplexity always cites its sources with clickable links, making it the most transparent AI search platform. It combines its own index with Google's and runs results through multiple reranking passes — initial relevance retrieval, then traditional ranking factor scoring, then ML-based quality evaluation that can discard entire result sets if they don't meet quality thresholds.\r\n\r\n**What makes Perplexity different:** It's the most \"research-oriented\" AI search engine, and its citation behavior reflects that. Perplexity maintains curated lists of authoritative domains (Amazon, GitHub, major academic sites) that get inherent ranking boosts. It uses a time-decay algorithm that evaluates new content quickly, giving fresh publishers a real shot at citation.\r\n\r\n**Perplexity has unique content preferences:**\r\n- **FAQ Schema (JSON-LD)** — Pages with FAQ structured data get cited noticeably more often\r\n- **PDF documents** — Publicly accessible PDFs (whitepapers, research reports) are prioritized. If you have authoritative PDF content gated behind a form, consider making a version public.\r\n- **Publishing velocity** — How frequently you publish matters more than keyword targeting\r\n- **Self-contained paragraphs** — Perplexity prefers atomic, semantically complete paragraphs it can extract cleanly\r\n\r\n**What to focus on:**\r\n- Allow PerplexityBot in robots.txt\r\n- Implement FAQPage schema on any page with Q&A content\r\n- Host PDF resources publicly (whitepapers, guides, reports)\r\n- Add Article schema with publication and modification timestamps\r\n- Write in clear, self-contained paragraphs that work as standalone answers\r\n- Build deep topical authority in your specific niche\r\n\r\n---\r\n\r\n## Microsoft Copilot\r\n\r\nCopilot is embedded across Microsoft's ecosystem — Edge, Windows, Microsoft 365, and Bing Search. It relies entirely on Bing's index, so if Bing hasn't indexed your content, Copilot can't cite it.\r\n\r\n**What makes Copilot different:** The Microsoft ecosystem connection creates unique optimization opportunities. Copilot cites LinkedIn heavily (its LinkedIn citations more than doubled May → Oct 2026 and run about 6.5× its Reddit citations, per Ahrefs data), and GitHub content is a natural fit too. Copilot also puts more weight on page speed — sub-2-second load times are a clear threshold.\r\n\r\n**What to focus on:**\r\n- Submit your site to Bing Webmaster Tools (many sites only submit to Google Search Console)\r\n- Use IndexNow protocol for faster indexing of new and updated content\r\n- Optimize page speed to under 2 seconds\r\n- Write clear entity definitions — when your content defines a term or concept, make the definition explicit and extractable\r\n- Build presence on LinkedIn (articles, posts, and a complete company page; see [linkedin-ai-citations.md](linkedin-ai-citations.md)) and GitHub if relevant\r\n- Ensure Bingbot has full crawl access\r\n\r\n---\r\n\r\n## Claude\r\n\r\nClaude uses Brave Search as its search backend when web search is enabled — not Google, not Bing. This is a completely different index, which means your Brave Search visibility directly determines whether Claude can find and cite you.\r\n\r\n**What makes Claude different:** Claude is extremely selective about what it cites. While it processes enormous amounts of content, its citation rate is very low — it's looking for the most factually accurate, well-sourced content on a given topic. Data-rich content with specific numbers and clear attribution performs significantly better than general-purpose content.\r\n\r\n**What to focus on:**\r\n- Verify your content appears in Brave Search results (search for your brand and key terms at search.brave.com)\r\n- Decide separately whether to allow `Claude-SearchBot` for search discovery, `Claude-User` for user-directed retrieval, and `ClaudeBot` for potential model training\r\n- Maximize factual density — specific numbers, named sources, dated statistics\r\n- Use clear, extractable structure with descriptive headings\r\n- Cite authoritative sources within your content\r\n- Aim to be the most factually accurate source on your topic — Claude rewards precision\r\n- Don't rely on self-ranked \"best X\" lists. In a live test (Sep 2026), Claude noted that results for a \"best [category]\" query were dominated by vendors ranking themselves #1 and leaned on juried awards and practitioner reputation instead\r\n\r\n---\r\n\r\n## Allowing AI Bots in robots.txt\r\n\r\nDo not copy one blanket allowlist. Choose controls by documented purpose, then check WAF and CDN rules as well as `robots.txt`.\r\n\r\n```text\r\n# Automatic search discovery\r\nUser-agent: Bingbot\r\nUser-agent: Googlebot\r\nUser-agent: OAI-SearchBot\r\nUser-agent: PerplexityBot\r\nUser-agent: Claude-SearchBot\r\nAllow: /\r\n\r\n# Potential model training (publisher choice shown as disallow)\r\nUser-agent: GPTBot\r\nUser-agent: ClaudeBot\r\nDisallow: /\r\n\r\n# Gemini model training and grounding (publisher choice shown as disallow)\r\nUser-agent: Google-Extended\r\nDisallow: /\r\n```\r\n\r\nUser-triggered fetchers such as `ChatGPT-User`, `Claude-User`, and `Perplexity-User` are separate from automatic discovery. Vendor behavior can differ: OpenAI says `robots.txt` rules may not apply to `ChatGPT-User`, and Perplexity says `Perplexity-User` generally ignores them because these fetches are user-requested. Use `OAI-SearchBot`, not `ChatGPT-User`, to manage ChatGPT Search inclusion. `Google-Extended` is a standalone product token rather than a separate HTTP crawler; Google says it controls certain Gemini training and grounding uses and does not affect Google Search inclusion or ranking.\r\n\r\nVerify the current names and consequences in the vendors' maintained documentation: [OpenAI](https://developers.openai.com/api/docs/bots), [Perplexity](https://docs.perplexity.ai/docs/resources/perplexity-crawlers), [Anthropic](https://privacy.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), and [Google](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers).\r\n\r\nFor implementation, inspect `/robots.txt` manually first. Optional helpers include each vendor's own crawler documentation and robots.txt testing tools.\r\n\r\n---\r\n\r\n## Where to Start\r\n\r\nIf you're optimizing for AI search for the first time, focus your effort where your audience actually is:\r\n\r\n**Start with Google AI Overviews** — They reach the most users (about 48% of BrightEdge-tracked queries, Feb 2026) and you likely already have Google SEO foundations in place. Add schema markup, include cited sources in your content, and strengthen E-E-A-T signals.\r\n\r\n**Then address ChatGPT** — It's the most-used standalone AI search tool for tech and business audiences. Focus on freshness (update content monthly), domain authority, and matching your content structure to how ChatGPT formats its responses.\r\n\r\n**Then expand to Perplexity** — Especially valuable if your audience includes researchers, early adopters, or tech professionals. Add FAQ schema, publish PDF resources, and write in clear, self-contained paragraphs.\r\n\r\n**Copilot and Claude are lower priority** unless your audience skews enterprise/Microsoft (Copilot) or developer/analyst (Claude). But the fundamentals — structured content, cited sources, schema markup — help across all platforms.\r\n\r\n**Actions that help everywhere:**\r\n1. Set an explicit, purpose-specific robots policy: allow relevant discovery crawlers while deciding training and user-triggered retrieval separately\r\n2. Implement schema markup (FAQPage, Article, Organization at minimum)\r\n3. Include statistics with named sources in your content\r\n4. Update content regularly — monthly for competitive topics\r\n5. Use clear heading structure (H1 > H2 > H3)\r\n6. Keep page load time under 2 seconds\r\n7. Add author bios with credentials\r\n",
  },
  {
    skillId: "ai-seo",
    path: "references/positioning-and-consensus.md",
    content: `# Positioning and Consensus in AI Answers\r
\r
LLMs don't just retrieve pages. They hold an association between your brand and a category, a segment, and a set of strengths and weaknesses, built from everything written about you. This reference covers how to shape that association, and why it moves slowly.\r
\r
Most of this comes from practitioner experience rather than controlled studies, mainly Harpreet Singh on Edward Sturm's podcast (E1182, "AEO Companies Are Selling You 2016 SEO," Sep 2026). Claims are labeled as anecdote or opinion where that's all they are.\r
\r
## Contents\r
- Old SEO, New Name\r
- Positioning Moves Slowly\r
- Make Every Profile Say the Same Thing\r
- Work Backwards from the Fan-Out\r
- Segment and Industry Pages\r
- Managing the "Cons" Others Write\r
- Head Terms Where Incumbents Are Already Chosen\r
- What Not to Copy\r
\r
---\r
\r
## Old SEO, New Name\r
\r
Much of what gets sold as AEO is traditional SEO: keywords in URLs, FAQs, meta descriptions, solution pages, listicles, press releases. These still work, because strong organic rankings remain one of the best predictors of AI visibility, especially in Google's AI features.\r
\r
The risk is applying them without the history. Tactics that were tuned for years (how many FAQs, how keyword-stuffed a URL, how many near-duplicate pages) get overused when someone presents them as new, and the result can be a short-term lift followed by lost organic traffic (practitioner opinion; no data cited).\r
\r
**How to apply:** before recommending a tactic as "for AI," ask whether it's an SEO tactic with a known failure mode, and keep it inside normal SEO limits. Be skeptical of vendor statistics with no source or date.\r
\r
---\r
\r
## Positioning Moves Slowly\r
\r
A brand known for one segment for years doesn't become known for another because its pages change.\r
\r
- **Repositioning:** a mid-market brand that rewrites its site for enterprise can lose mid-market answers before it earns enterprise ones, and "disappear from LLMs for a while." Enterprise prompts are already associated with incumbents (anecdote, one client).\r
- **Mergers and rebrands:** an acquired brand often stops appearing for prompts it used to own once its pages fold into the parent (practitioner observation).\r
- **Local and niche markets too:** for many categories, models have "already picked their winners," and new entrants start behind (opinion).\r
\r
**How to apply before a repositioning, rebrand, or merger** (a practitioner sequence, not a tested playbook):\r
1. Record a baseline for the old segment's prompts *and* the target segment's prompts.\r
2. Watch for a dip and warn stakeholders it may happen. This rests on practitioner reports, not controlled data.\r
3. Move off-site signals first (profiles, reviews, press, analyst listings, partner pages), then stage the on-site rewrite, rather than switching everything at once.\r
4. Keep pages that still win old-segment prompts until the new association shows up in tracking.\r
\r
---\r
\r
## Make Every Profile Say the Same Thing\r
\r
Models look for consensus. Your G2, Capterra, Gartner, Crunchbase, LinkedIn, and partner-directory profiles should describe you with the same segment, category, and differentiators as your About page. If you're targeting enterprise, those profiles should say enterprise.\r
\r
- Fill in free profiles fully (what you do, who it's for, which industries), even on platforms you don't pay for.\r
- Review text matters as much as profile text. Models read what customers say on those pages.\r
- This is one of the cheapest changes available: an afternoon of edits across profiles you already have.\r
\r
Pair with the review-generation playbook in the directory-submissions skill.\r
\r
---\r
\r
## Work Backwards from the Fan-Out\r
\r
Extract the real background queries for your key prompts (the DevTools method in [format-volatility.md](format-volatility.md)), then look at which domains they name.\r
\r
- If ChatGPT's first fan-out round runs \`site:\` searches on Gartner, G2, or Capterra for your category, those profiles are your priority, often ahead of publishing another page on your own site.\r
- The mix differs by category and changes over time, so check your own prompts rather than copying someone else's list. One practitioner saw Gartner rise in finance-software fan-outs and moved review effort from G2 toward Gartner (anecdote).\r
\r
---\r
\r
## Segment and Industry Pages\r
\r
AI answers are increasingly personalized and segment-aware: models place brands into enterprise, mid-market, or SMB, and match them to industries.\r
\r
- Build pages for the core industries or segments you actually serve ("email marketing for e-commerce," "RFP software for government"), with real specifics for each.\r
- Start with your core segments. Scale isn't the problem in itself; near-duplicate pages that swap the industry name without adding real value are what Google's scaled-content policy targets. See [content-types.md](content-types.md).\r
\r
---\r
\r
## Managing the "Cons" Others Write\r
\r
Affiliates and review aggregators list a con for every product to look balanced. Find what they say about you.\r
\r
- If a listed con reinforces a known weakness models already repeat (for example, long implementation), ask the publisher to use a different con that is also true and less central.\r
- Never ask for negatives to be removed or for false claims. The goal is accuracy, not a clean sheet.\r
\r
To repair a weakness models repeat, address it in public with specifics: one practitioner's client turned "implementation takes forever" around over 1.5–2 years with founder posts about the process, guides on real timelines, and a concrete "4–8 weeks" on the implementation page (anecdote). See also the "recommended against" section of [citations-vs-recommendations.md](citations-vs-recommendations.md).\r
\r
---\r
\r
## Head Terms Where Incumbents Are Already Chosen\r
\r
For prompts like "best email marketing software," incumbents are in the training data and on every list. Practitioner playbooks (opinion, not tested):\r
\r
- **Run both formats.** A solution page for the term and a buyer's-guide listicle, since engines currently weight them differently (see [format-volatility.md](format-volatility.md)).\r
- **Amplify earned third-party proof.** Publish and promote G2 grid placements and analyst mentions; don't just collect them.\r
- **Occupy several places on the results page.** Your YouTube video, creator coverage, review profiles, and press, not only your own page. Compare Google and Bing results, since different engines draw on different backends.\r
- **Rank the leader honestly.** In a "best X for Y" guide, it can work better to name the category leader first and show where you go further, than to rank yourself #1 (see the self-promotional listicle risk in [citations-vs-recommendations.md](citations-vs-recommendations.md)).\r
\r
---\r
\r
## What Not to Copy\r
\r
The same episode floats tactics this skill does not recommend:\r
\r
- **Invented awards or brand-run "review" sites** presented as independent. These are inauthentic mentions, and fake or misleadingly sourced reviews can break the FTC's 2024 rule on consumer reviews and testimonials (16 CFR Part 465).\r
- **Fast-decaying press-release tricks** (which cheap wire syndicates into which outlets). If you use press releases, check that the destination pages are indexed before paying; outlets change this without notice.\r
`,
  },
  {
    skillId: "ai-seo",
    path: "references/prompt-portfolio.md",
    content: `# Prompt Portfolio Design\r
\r
Which prompts you track decides what your AI visibility numbers mean. A portfolio stuffed with glossary questions will report healthy visibility while you lose every shortlist. This reference covers how to choose prompts, group them, version them, and how often to run them, including the multi-turn buying conversations single prompts miss.\r
\r
## Start with the measurement question\r
\r
Write down the decision the numbers will drive before choosing a single prompt. "Are we on the shortlist for mid-market [category] buyers in the US?" needs a different portfolio from "Did our docs rewrite fix how Claude describes our API limits?"\r
\r
## Build from real demand\r
\r
Use the words buyers actually type. In order of preference:\r
\r
1. Prompts buyers report directly (a "What did you ask the AI?" follow-up on your how-did-you-hear field, sales call notes)\r
2. Prompt-demand data from a tracking tool, if you have it\r
3. Customer research, support tickets, community threads, and sales objections\r
4. Your search terms, rewritten as someone would phrase them to an assistant\r
\r
Don't mechanically turn a keyword list into questions. "crm small business" and "What CRM should a 5-person agency use if we live in Gmail?" retrieve different sources.\r
\r
## Cover the intent families\r
\r
| Family | Example shape |\r
|---|---|\r
| Category discovery | "What tools do teams use for [job]?" |\r
| Problem and solution research | "How do I stop [problem]?" |\r
| Comparisons and alternatives | "[You] vs [competitor]," "alternatives to [competitor]" |\r
| Recommendations and "best for" | "Best [category] for [segment or constraint]" |\r
| Trust, risk, and validation | "Is [you] legit?" "Does [you] have SOC 2?" |\r
| Price, availability, compatibility, limits | "[You] pricing," "Does [you] work with [tool]?" |\r
| Implementation and troubleshooting | "How do I set up [you] with [stack]?" |\r
| Local, shopping, or regulated | Only when they apply to the business |\r
\r
Weight families by business value. A citation for a definition question rarely sells anything; see the revenue filter in SKILL.md's audit step.\r
\r
## Three cohorts\r
\r
| Cohort | Purpose | Rules |\r
|---|---|---|\r
| **Stable core** | Trend measurement | Changes rarely and only through versioning. This is the set you report on. |\r
| **Exploratory** | Emerging demand, new segments, new competitors | Rotates freely. Promote prompts into the core when they prove valuable. |\r
| **Diagnostic controls** | Known outcomes that tell you whether measurement drifted | Include prompts where you should always appear (your brand name) and never appear (an unrelated category). If those move, the tool or the engine changed, and your work had nothing to do with it. |\r
\r
Keep engines, markets, languages, and personas as separate configurations. A US English ChatGPT run and a German Gemini run are different measurements; see [multilingual-and-commerce.md](multilingual-and-commerce.md).\r
\r
Add paraphrase variants only where you need to measure wording sensitivity. Otherwise collapse variants of the same intent into one core prompt.\r
\r
## How often to run\r
\r
Two regimes, depending on portfolio size:\r
\r
- **A broad portfolio (hundreds of prompts):** once a day is usually enough. In Profound's comparison of 753 prompts across seven platforms over two weeks, once-daily visibility estimates landed within about two percentage points of running each prompt ten times a day (Profound, July 2026). Extra runs helped citation share more than visibility, and couldn't remove day-to-day platform drift. Composition mattered more than frequency.\r
- **A small set (the 10–20 prompts of a DIY audit), short experiments, or citation-share precision:** run each prompt several times (3–5 per platform) and report the rate with its sample size, as the monitoring section in SKILL.md describes. With few prompts, one run per prompt is mostly noise.\r
\r
Profound sells AI visibility tracking, so treat these figures as vendor research from one setup. Other trackers include Ahrefs Brand Radar, Semrush, Peec AI, Otterly, and ZipTie; check what each one samples before comparing their numbers.\r
\r
## Version the portfolio\r
\r
- Give the portfolio a version number and log every addition, removal, and weighting change with a date and reason.\r
- Never compare two periods that used materially different portfolios. Recalculate on the prompts both periods share.\r
- Freeze the core during an experiment.\r
\r
## Multi-turn buying journeys\r
\r
Buyers don't stop at one prompt. Commercial conversations in ChatGPT were less likely to end after one turn than informational ones, and commercial intent rose from 13.9% to 19.2% of sampled conversations in a year (Profound, August 2026; sampled and modeled estimates). Earlier Profound research found web citations concentrate in the opening turns of a research conversation (Profound, Q4 2025 data). So the opening prompt decides which sources get pulled, and later turns decide who stays on the shortlist.\r
\r
Map the journey by stage, then write one opening prompt and two or three realistic follow-ups for each:\r
\r
| Stage | Typical follow-up |\r
|---|---|\r
| Define the need | "What should I look for in a [category]?" |\r
| Build a shortlist | "Which of these work for [constraint]?" |\r
| Compare | "How does [A] compare to [B] on [criterion]?" |\r
| Validate | "What do users complain about with [A]?" |\r
| Resolve risk | "Can I migrate from [incumbent] without losing [data]?" |\r
| Choose | "Which would you pick for a team like mine?" |\r
\r
Run the conversation in one session and record, per turn, whether you were mentioned, recommended, cited, or dropped, and the framing around the mention. The turn where you fall off the shortlist is the content or evidence gap to fix. Track mention, shortlist inclusion, framing, and citations separately; see the visibility ladder in [citations-vs-recommendations.md](citations-vs-recommendations.md).\r
\r
First decide whether AI buying conversations matter for the category at all. Profound found commercial-intent share varied about tenfold across industries in the same study.\r
\r
---\r
\r
*Framework lineage: cohort design, cadence regimes, and the journey map adapted (re-expressed and restructured) from Profound's MIT-licensed ai-prompt-portfolio-builder and commercial-ai-journey-mapper skills and the studies they cite (July and August 2026), credited.*\r
`,
  },
];
