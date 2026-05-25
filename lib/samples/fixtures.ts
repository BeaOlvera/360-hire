/**
 * Fixtures used by /admin/samples to demonstrate every report variant
 * against a fictional candidate. No real people, no real companies.
 * All content is originally written.
 */

import type { FitResult } from '../score_fit'
import type { ComprehensiveResult } from '../generate_comprehensive_report'

export const SAMPLE_CANDIDATE_NAME = 'Maria Sample'
export const SAMPLE_JOB_TITLE = 'Senior Product Manager (sample)'
export const SAMPLE_ORG_LEVEL = 'Manager'
export const SAMPLE_LANGUAGE: 'en' = 'en'

export const SAMPLE_JOB_DESCRIPTION = `You will lead the product strategy and quarterly roadmap for one of our core consumer-facing surfaces. You will partner closely with engineering, design and sales to define scope, ship with quality, and own outcomes across discovery, delivery and impact. You will manage one product manager directly and influence a cross-functional team of 12 to 18 people. The role reports to the head of product and works closely with sales leadership on enterprise opportunities.

Responsibilities:
- Define and maintain the 12 month product roadmap with input from engineering, design, sales and customer success.
- Run discovery cycles to validate problem and solution before committing engineering capacity.
- Partner with design and engineering leads on scoping, trade-offs and quality bars.
- Own and report on a small number of measurable outcome metrics for the surface.
- Mentor and develop one direct report; help raise the bar across the broader PM craft.

Requirements:
- 6+ years of product management experience, including at least 2 years on consumer-facing surfaces at scale.
- Comfortable making prioritisation calls under uncertainty and explaining them to senior stakeholders.
- Data-fluent: can read SQL or work with an analyst to size opportunities and validate impact.
- Track record of shipping work that moved a metric, not just shipping output.
- Strong written communication; you write down the trade-offs before the meeting, not during.`

export const SAMPLE_COMPETENCIES = [
  { name: 'Stakeholder management',         weight: 3 as const },
  { name: 'Strategic thinking',             weight: 3 as const },
  { name: 'Team leadership and mentoring',  weight: 2 as const },
  { name: 'Data-driven judgement',          weight: 2 as const },
  { name: 'Resilience under change',        weight: 1 as const },
]

export const SAMPLE_CULTURE_PROFILE = { CLAN: 20, ADHOCRACY: 35, MARKET: 25, HIERARCHY: 20 }

export const SAMPLE_CV_TEXT = `MARIA SAMPLE
Senior Product Manager, currently at SampleCo (3 years)

EXPERIENCE
SampleCo. Senior Product Manager. 2023 to present.
- Led the redesign of the onboarding flow on the consumer mobile app. Activation rate up 12 points over two quarters.
- Owned the experimentation roadmap for the surface, ran 14 A/B tests in 2024 of which 5 reached significance.
- Managed one product manager, mentored two other PMs across the org.

DemoStartup. Product Manager. 2020 to 2023.
- Joined as the second PM, grew the function to four. Ran weekly product reviews with eng and design leads.
- Shipped the first paid tier of the product; ARR went from zero to 1.4M in 18 months.
- Made the call to deprecate the legacy admin console after a discovery cycle showed only 6 percent of users still used it.

Acme University. Product Analyst. 2018 to 2020.
- Built the first weekly retention dashboard for the platform team. Used to inform two roadmap shifts.

EDUCATION
MSc Information Systems, University of Example, 2018.
BA Economics, University of Example, 2016.

SKILLS: product strategy, A/B testing, SQL, written communication, cross-functional collaboration.`

export const SAMPLE_TRANSCRIPT: Array<{ role: 'assistant' | 'user'; content: string }> = [
  { role: 'assistant', content: `Hi Maria! Thank you for taking the time for this conversation about the Senior Product Manager role, I really appreciate it. Before we dive into anything work-related, how's your day going so far?` },
  { role: 'user', content: `Thanks, the day is good. A bit of a slower morning since the week has been intense, but I am looking forward to this conversation.` },
  { role: 'assistant', content: `Lovely. We'll have a natural conversation. First I would love to hear about your professional journey, then we'll spend the most time on the last couple of years and some specific situations relevant to this role, and we'll finish by talking about your motivation and what's ahead. Could you walk me through your journey, the moments that shaped you most?` },
  { role: 'user', content: `I started in analytics. I joined Acme University as a product analyst, mainly because I wanted to be close to the user data and the decisions it could inform. After about a year I built the first retention dashboard for the platform team and realised I was more interested in shaping the decisions than measuring them. So I moved into PM at DemoStartup. That was the biggest jump for me. I joined when there were two PMs and we grew it to four. I owned the paid tier launch which took us from zero to 1.4 million ARR.` },
  { role: 'assistant', content: `That's a significant outcome. Tell me about a specific moment in that paid tier launch when something did not go to plan. What happened?` },
  { role: 'user', content: `In the first month after launch our conversion was about a third of what we had projected. I had assumed pricing was the main lever. We ran a discovery cycle with 12 customer conversations in two weeks. It turned out the issue was not price, it was that the value of the paid tier was buried two screens deep in the admin console. We redesigned the upgrade prompt to surface the differentiated value the moment they hit a free-tier limit. Conversion roughly doubled in the next six weeks.` },
  { role: 'assistant', content: `What did that experience change about how you approach problems now?` },
  { role: 'user', content: `I am much more careful about my assumptions before committing engineering time. I now budget about a week of discovery before any feature larger than two engineer weeks. I also share the assumptions explicitly in the spec, marked as assumptions, so the team can challenge them.` },
  { role: 'assistant', content: `You mentioned earlier you manage one PM directly. Tell me about a time you had to give that person feedback that was harder to deliver.` },
  { role: 'user', content: `Yes. About four months ago they shipped a feature that did not meet the quality bar we had agreed on. Engineers were the ones who flagged it to me, which was a bad signal in itself. I asked for a one-to-one. I said the work shipped did not match what we had aligned on and asked them to walk me through what happened. It turned out they had been under-resourced for two weeks and had not raised it. So part of the feedback was about quality, and part was about raising flags earlier. We agreed they would flag any scope or resource risk in our weekly one-to-one. Since then they have done it consistently.` },
  { role: 'assistant', content: `What drew you specifically to this role?` },
  { role: 'user', content: `Two things. First the surface, consumer-facing at scale is where I have done my strongest work and where I want to keep building. Second the structure. The job description mentions partnering closely with sales on enterprise opportunities. I have not had to operate at that interface yet and I see it as one of the next things I need to grow into. So the role both leans on what I do well and stretches me on something I have not yet been responsible for.` },
  { role: 'assistant', content: `If you joined, what's the distinctive thing you think you would bring in the first 6 to 12 months?` },
  { role: 'user', content: `I think it would be the discipline around discovery before scoping. From the conversations I have had so far it sounds like the team can sometimes commit engineering capacity earlier than they would like to. The way I work, I would push for a short structured discovery cycle on anything material before scope is locked. I have seen this save real time at DemoStartup and SampleCo, on the order of a few weeks per quarter.` },
]

export const SAMPLE_FIT_RESULT: FitResult = {
  overall_fit: 0.74,
  recommendation: 'hire',
  one_line_summary: 'Strong fit on stakeholder discipline and data-driven judgement; some uncertainty on enterprise-sales partnership which the candidate openly acknowledges.',
  competencies: [
    {
      name: 'Stakeholder management',
      score: 4.0,
      weight: 0.25,
      evidence: [
        'Concrete example of giving harder feedback to a direct report after a quality issue, with a clear behavioural change agreed and sustained.',
        'Describes raising assumptions explicitly in specs so the team can challenge them, suggesting bias toward making disagreement visible early.',
      ],
      gaps: [
        'No example yet of stakeholder management at the senior-leadership level (head of, VP).',
      ],
    },
    {
      name: 'Strategic thinking',
      score: 3.5,
      weight: 0.25,
      evidence: [
        'Reframed a stalled launch from a pricing problem to a discoverability problem after structured discovery; conversion roughly doubled.',
        'Articulates 12-month rather than feature-by-feature roadmap thinking when describing planning approach.',
      ],
      gaps: [
        'Discussion stayed at the surface level when the interviewer probed multi-product strategy; no clear example of weighing trade-offs across competing surfaces.',
      ],
    },
    {
      name: 'Team leadership and mentoring',
      score: 4.0,
      weight: 0.2,
      evidence: [
        'Currently manages one PM directly, has mentored two others across the org.',
        'Concrete worked example of a feedback conversation that produced a sustained behavioural change.',
      ],
      gaps: [
        'Team scope has been one direct report; this role implies broader influence over a 12-18 person cross-functional team.',
      ],
    },
    {
      name: 'Data-driven judgement',
      score: 4.5,
      weight: 0.2,
      evidence: [
        'Started career in analytics, built the retention dashboard that informed two roadmap shifts.',
        '14 A/B tests in 2024 with explicit awareness of which reached significance.',
        'Comfortable being challenged on numbers (e.g. activation +12 points stated with no defensiveness).',
      ],
      gaps: [],
    },
    {
      name: 'Resilience under change',
      score: 3.0,
      weight: 0.1,
      evidence: [
        'Handled a botched launch month with a structured response rather than blaming pricing or the market.',
      ],
      gaps: [
        'Most career has been on a stable upward trajectory; limited evidence of operating through a downsizing, restructure, or major strategic pivot.',
      ],
    },
  ],
  strengths: [
    'Discovery discipline. Explicitly budgets discovery time before committing engineering capacity and can point to a recent worked example.',
    'Outcome-orientation. Talks about metrics moved rather than features shipped.',
    'Direct in feedback delivery. Brought a hard one-to-one within a week of a quality issue, did not let it drift.',
  ],
  concerns: [
    'Enterprise-sales partnership is new territory. Candidate is honest about this and frames it as growth, which is a positive signal, but it is a meaningful gap for this role.',
    'Stakeholder examples were all peer-level or downward; no senior-leadership stakeholder example surfaced.',
  ],
  risk_flags: [
    'Compensation expectation not discussed in this round.',
    'Confirm right-to-work and notice period in next round.',
  ],
  next_steps: [
    'Schedule a follow-up with the head of sales to assess fit on the enterprise-partnership dimension specifically.',
    'Ask the candidate to walk through one strategy trade-off across competing product surfaces, with a written one-pager.',
    'Reference check focused on team leadership beyond direct reports.',
  ],
}

export const SAMPLE_COMPREHENSIVE_RESULT: ComprehensiveResult = {
  executive_summary: `Maria is a strong fit on the data and discovery dimensions of this role and a partial fit on stakeholder management at the senior-leadership level. The signals across her interview, her CV, her Big Five profile and her reasoning result converge on a candidate who is conscientious, data-fluent and outcome-oriented, with a small but real gap on operating across enterprise-sales surfaces and on strategy across multiple product lines.`,
  recommendation: 'hire',
  recommendation_rationale: `Hire-with-conditions. The behavioural evidence on discovery discipline, feedback delivery and metric ownership is strong and consistent across the interview and the CV. Personality and reasoning results support a candidate who can hold pressure, work analytically and communicate clearly. The two open dimensions (senior stakeholder fluency, enterprise-sales partnership) are real but addressable by structuring the next round around them rather than disqualifying. Recommend proceeding to a final round with the head of sales.`,
  top_strengths: [
    'Discovery discipline before committing engineering capacity, with a worked example from the paid-tier launch.',
    'Data fluency across the career arc (analytics origin, 14 A/B tests in 2024, comfortable with the numbers).',
    'Conscientiousness profile is high (Big Five C = 5.0) and matches the behavioural evidence in the interview.',
    'Self-aware about the gap on enterprise-sales partnership; brought it up unprompted as a growth area.',
  ],
  top_concerns: [
    'Has not operated at the head-of-sales or VP-stakeholder level; the role implies that interface.',
    'Most strategic-thinking examples stayed within one product surface; no cross-surface trade-off example surfaced.',
    'Team leadership has been one direct report; influence over a 12-18 person cross-functional team would be new at this scale.',
  ],
  risk_flags: [
    'Compensation expectations and notice period not yet discussed.',
    'Right-to-work to be verified in next round.',
  ],
  competencies: [
    {
      name: 'Stakeholder management',
      rating: 'adequate',
      interview_evidence: [
        'Brought a hard one-to-one within a week of a quality issue and produced a sustained behavioural change.',
        'Describes raising assumptions explicitly in specs so they can be challenged.',
      ],
      interview_gaps: [
        'No senior-leadership stakeholder example surfaced.',
      ],
      assessment_signals: [
        'Big Five Agreeableness is moderate (4.0), consistent with someone who can push back without conflict aversion.',
      ],
    },
    {
      name: 'Strategic thinking',
      rating: 'adequate',
      interview_evidence: [
        'Reframed a stalled launch from a pricing problem to a discoverability problem after structured discovery.',
        'Articulates 12-month rather than feature-by-feature roadmap thinking.',
      ],
      interview_gaps: [
        'Stayed at the surface level when probed on cross-product strategy.',
      ],
      assessment_signals: [
        'Reasoning (ICAR-style) result of 9 out of 12 (75 percent) supports the analytic dimension of strategy.',
        'Big Five Openness (5.0) supports comfort with abstract reframing.',
      ],
    },
    {
      name: 'Team leadership and mentoring',
      rating: 'adequate',
      interview_evidence: [
        'Currently manages one PM, mentored two others across the org.',
        'Worked example of a feedback conversation that produced a sustained change.',
      ],
      interview_gaps: [
        'Team scope has been one direct report; this role implies broader cross-functional influence.',
      ],
      assessment_signals: [
        'Career Values: Technical/Functional and Pure Challenge are top anchors; General Managerial is mid-range. Signals appetite for influence but not primarily for management headcount.',
      ],
    },
    {
      name: 'Data-driven judgement',
      rating: 'strong',
      interview_evidence: [
        'Built the first retention dashboard for a platform team; used to inform two roadmap shifts.',
        '14 A/B tests in 2024 with explicit awareness of which reached significance.',
      ],
      interview_gaps: [],
      assessment_signals: [
        'Reasoning result of 9 out of 12, with no failures on the numerical sub-domain.',
        'Big Five Conscientiousness 5.0 supports follow-through on instrumentation and rigour.',
      ],
    },
    {
      name: 'Resilience under change',
      rating: 'adequate',
      interview_evidence: [
        'Handled a stalled launch month structurally rather than reactively.',
      ],
      interview_gaps: [
        'Limited evidence of operating through downsizing, restructure, or strategic pivot.',
      ],
      assessment_signals: [
        'Resilience (BRS-framework) mean 3.8 (normal band).',
        'Big Five Negative Emotionality is low (2.0), consistent with recovery from setbacks.',
      ],
    },
  ],
  cross_signal_observations: [
    'Interview behavioural evidence on discovery and feedback delivery is reinforced by high Conscientiousness on the Big Five.',
    'Career Values point to a candidate whose primary anchors are Pure Challenge and Technical/Functional rather than General Managerial. Worth confirming the role would feel like a stretch rather than a sideways move.',
    'Culture Fit profile (Adhocracy-leaning) is close to the role profile, with a small gap on Hierarchy. Unlikely to be a frictional concern.',
    'Reasoning result (9 out of 12) lands in the higher band, supporting the analytic dimension of the role.',
  ],
  next_steps: [
    'Final round focused on the enterprise-sales interface, with the head of sales present.',
    'Ask for a one-pager: how she would prioritise across two competing product surfaces in the first quarter.',
    'Reference check explicitly on team leadership beyond direct reports.',
  ],
}

// Raw answers for each of the 7 assessments. Produce realistic-but-clearly-fictional profiles.

export const SAMPLE_RAW_ANSWERS: Record<string, Record<string, string | number>> = {
  thinking_style: {
    // Leaning toward AMARILLO (innovation / cortical right) with secondary AZUL (results / cortical left)
    q1: 'b', q2: 'b', q3: 'd', q4: 'a', q5: 'b', q6: 'b', q7: 'd', q8: 'b', q9: 'c', q10: 'a', q11: 'c', q12: 'b',
  },
  growth_orientation: {
    // Mean ~4.2 with slightly weaker Developing Leadership (DL = q1..q6)
    q1: 3, q2: 4, q3: 4, q4: 3, q5: 4, q6: 3,
    q7: 5, q8: 5, q9: 5, q10: 4, q11: 5, q12: 5,
    q13: 4, q14: 4, q15: 5, q16: 4, q17: 4, q18: 5,
  },
  career_values: {
    // Peaks on Pure Challenge (CH, q19-21) and Technical/Functional (TF, q1-3); mid on General Managerial (GM, q4-6)
    q1: 5, q2: 5, q3: 4,
    q4: 3, q5: 3, q6: 3,
    q7: 4, q8: 3, q9: 3,
    q10: 2, q11: 2, q12: 2,
    q13: 4, q14: 3, q15: 4,
    q16: 4, q17: 4, q18: 3,
    q19: 5, q20: 4, q21: 5,
    q22: 3, q23: 3, q24: 3,
  },
  culture_fit: (() => {
    // Adhocracy-leaning preferred profile, close to the role's culture
    const out: Record<string, number> = {}
    for (let d = 1; d <= 6; d++) {
      out[`d${d}_CLAN`] = 20
      out[`d${d}_ADHOCRACY`] = 35
      out[`d${d}_MARKET`] = 30
      out[`d${d}_HIERARCHY`] = 15
    }
    return out
  })(),
  big_five: {
    // E=4.0, A=4.0, C=5.0, N=2.0, O=5.0 (high-functioning conscientious profile)
    q1: 4, q2: 2, q3: 4, q4: 2, q5: 4, q6: 2,
    q7: 2, q8: 4, q9: 2, q10: 4, q11: 2, q12: 4,
    q13: 5, q14: 1, q15: 5, q16: 1, q17: 5, q18: 1,
    q19: 2, q20: 4, q21: 2, q22: 4, q23: 2, q24: 2,
    q25: 5, q26: 1, q27: 5, q28: 1, q29: 5, q30: 1,
  },
  icar_reasoning: {
    // 9 out of 12 correct (75 percent, "high" band). Correct: q1='b' q2='c' q3='b' q4='c' q5='d' q6='b' q7='a' q8='c' q9='b' q10='c' q11='b' q12='a'
    // Wrong-on-purpose: q5='a' (was d), q9='d' (was b), q12='b' (was a)
    q1: 'b', q2: 'c', q3: 'b', q4: 'c', q5: 'a', q6: 'b', q7: 'a', q8: 'c', q9: 'd', q10: 'c', q11: 'b', q12: 'b',
  },
  resilience: {
    // Mean 3.8, "normal" band
    q1: 4, q2: 3, q3: 4, q4: 2, q5: 4, q6: 2,
  },
}
