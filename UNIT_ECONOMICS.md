# Studio Agents - Unit Economics Calculator

**Last Updated:** January 21, 2026  
**Purpose:** Calculate cost per generation, break-even points, and validate LTV:CAC claims for investor pitches

---

## API Cost Structure

### Google Gemini 2.0 Flash (Text Generation)
- **Pricing:** $0.075 per 1M input tokens, $0.30 per 1M output tokens
- **Typical Usage:**
  - Ghostwriter (lyrics): ~500 input tokens, ~1,000 output tokens
  - Beat Lab (production ideas): ~300 input tokens, ~800 output tokens
  - Trend Analyzer: ~400 input tokens, ~600 output tokens

**Cost per generation (text):**
- Input: 500 tokens × $0.075 / 1M = **$0.0000375**
- Output: 1,000 tokens × $0.30 / 1M = **$0.0003**
- **Total: ~$0.00034 per text generation**

### Imagen 4.0 (Image Generation)
- **Pricing:** Estimated $0.02 - $0.04 per image (1024x1024)
- **Typical Usage:**
  - Album Artist: 1 image per generation
  - Visual variations: 4 images per session

**Cost per generation (image):** **$0.03 per image**

### Veo 3.0 (Video Generation)
- **Pricing:** Estimated $0.30 - $0.50 per 5-second clip
- **Typical Usage:**
  - Video Creator: 1 video per generation (5-10 seconds)

**Cost per generation (video):** **$0.40 per video**

---

## Credit System Analysis

**Current Credit Pricing:**
- Free tier: 50 credits/month (4 agents)
- Monthly ($4.99): 500 credits/month (12 agents)
- Pro ($9.99): 1,000 credits/month (16 agents)

**Credit to Generation Mapping:**
- Ghostwriter (text): 10 credits = $0.00034 cost → **$0.000034 per credit**
- Album Artist (image): 50 credits = $0.03 cost → **$0.0006 per credit**
- Video Creator (video): 100 credits = $0.40 cost → **$0.004 per credit**

**Weighted Average Cost (assuming 60% text, 30% image, 10% video):**
- (0.6 × $0.00034) + (0.3 × $0.03) + (0.1 × $0.40) = **$0.0492 per average generation**

---

## Break-Even Analysis

### Monthly Subscription Plan ($4.99)
- **Credits provided:** 500
- **Typical usage:** 60% text (300 credits), 30% image (150 credits), 10% video (50 credits)
- **API costs:**
  - Text: 30 generations × $0.00034 = $0.0102
  - Images: 3 generations × $0.03 = $0.09
  - Videos: 0.5 generations × $0.40 = $0.20
  - **Total: $0.30 per user per month**

**Gross Margin:** $4.99 - $0.30 = **$4.69 (94% margin)**

### Pro Plan ($9.99)
- **Credits provided:** 1,000
- **API costs (doubled usage):** $0.60 per user per month
- **Gross Margin:** $9.99 - $0.60 = **$9.39 (94% margin)**

---

## Customer Acquisition Cost (CAC)

**Estimated Channels:**
- Organic (SEO, social): $0 - $5 per user
- Paid ads (Google, Meta): $10 - $30 per user
- Influencer/partnerships: $5 - $15 per user

**Conservative CAC estimate:** **$15 per user**

---

## Lifetime Value (LTV)

**Assumptions:**
- Average subscription length: 12 months (industry standard for SaaS)
- Monthly churn rate: 8% (aggressive for year 1, target 5% by year 2)
- Average plan: $7.49 (mix of $4.99 and $9.99)

**LTV Calculation:**
- Monthly revenue per user: $7.49
- Gross margin: 94% = $7.04 net per month
- Average lifetime: 1 / 0.08 = 12.5 months
- **LTV = $7.04 × 12.5 = $88**

**LTV:CAC Ratio = $88 / $15 = 5.87:1**

---

## Validation of Pitch Claims

**Claimed LTV:CAC = 12:1** (from STUDIO_AGENTS_PITCH.md)

**Current Calculation: 5.87:1**

**Gap Analysis:**
To achieve 12:1, we need either:
1. **Reduce CAC to $7.33** (via better organic growth)
2. **Increase LTV to $180** (via lower churn: 4%, or higher ARPU: $14.40/mo)
3. **Combination:** CAC = $10, LTV = $120 (6% churn, $9.60 ARPU)

**Recommendation:** Update pitch to reflect **5-7:1 LTV:CAC** for seed stage, with roadmap to 10:1+ by year 2.

---

## Revenue Projections

### Year 1 (Conservative)
- Target users: 10,000
- Conversion to paid: 5% = 500 paid users
- Average plan: $7.49/mo
- **MRR:** $3,745
- **ARR:** $44,940
- **Total costs (API + infrastructure):** ~$6,000/year
- **Gross profit:** $38,940

### Year 2 (Growth)
- Target users: 50,000
- Conversion to paid: 8% = 4,000 paid users
- Average plan: $8.49/mo (more Pro upgrades)
- **MRR:** $33,960
- **ARR:** $407,520
- **Total costs:** ~$40,000/year
- **Gross profit:** $367,520

---

## Key Metrics Dashboard

**Track these metrics for investor updates:**

1. **Total Signups:** [Use Analytics.getMetrics()]
2. **Total Generations:** [localStorage: generations_total]
3. **Agent Usage Breakdown:** [localStorage: generations_by_agent]
4. **Projects Created:** [localStorage: projects_created]
5. **Free-to-Paid Conversion:** [Firebase: user tier changes]
6. **Monthly Active Users (MAU):** [Firebase: last login timestamp]
7. **Avg Generations per User:** [generations / signups]
8. **Credit Burn Rate:** [avg credits used per active user]

**Access metrics via browser console:**
```javascript
// Get current metrics
Analytics.getMetrics()

// Output:
// {
//   totalSignups: 127,
//   totalGenerations: 543,
//   totalProjects: 89,
//   agentUsage: { ghost: 234, album: 156, beat: 153 },
//   totalRevenue: 0,
//   avgGenerationsPerUser: "4.28"
// }
```

---

## Cost Optimization Strategies

1. **Batch Processing:** Group similar requests to reduce API overhead
2. **Caching:** Store common outputs (e.g., popular beat patterns) to avoid regeneration
3. **Tiered Quality:** Offer "fast" (cheaper model) vs "premium" (Gemini 2.0 Flash) options
4. **Rate Limiting:** Prevent abuse by limiting generations per hour
5. **Smart Credits:** Dynamic pricing based on actual API costs (text = 5 credits, image = 30, video = 80)

---

## Next Steps for VC Readiness

✅ **Unit economics calculated and documented**  
⬜ **Add metrics dashboard to admin panel** (show Analytics.getMetrics() data)  
⬜ **Set up automated email reports** (weekly metrics summary)  
⬜ **Create investor-facing metrics deck** (one-pager with key numbers)  
⬜ **Implement conversion tracking** (free → paid upgrade events)  

**Estimated completion:** 2-3 hours for dashboard implementation

---

## Supporting Documentation

- **API Pricing Sources:**
  - Gemini: https://ai.google.dev/pricing
  - Imagen: https://cloud.google.com/vertex-ai/generative-ai/pricing
  - Veo: https://cloud.google.com/vertex-ai/generative-ai/pricing

- **Industry Benchmarks:**
  - SaaS churn rate: 5-8% monthly (source: ChartMogul 2025)
  - LTV:CAC ratio: 3:1 minimum, 5:1 healthy, 7:1+ excellent (source: SaaStr)
  - Free-to-paid conversion: 2-5% for freemium SaaS (source: ProfitWell)

---

**Summary:** Studio Agents has a **94% gross margin** with a conservative **5.87:1 LTV:CAC ratio**. With current pricing and API costs, break-even requires ~15 paying users per month. Revenue scales efficiently due to low variable costs.
