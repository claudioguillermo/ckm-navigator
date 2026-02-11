# EMPOWER-CKM Questionnaire Implementation Guide
**Google Forms Setup Instructions**

---

## Quick Reference

| Component | Pre-Test Questions | Post-Test Questions | Total Time |
|-----------|-------------------|---------------------|------------|
| Demographics | 3 | 1 | Pre: 5-7 min<br>Post: 8-10 min |
| Confidence (Matched) | 5 | 5 | |
| Efficiency/Practice | 2 | 2 | |
| Attitudes/Digital Tools | 3 | - | |
| App Evaluation | - | 5 | |
| Future Implementation | - | 2 | |
| Qualitative Feedback | 1 | 2 | |
| **TOTAL** | **14** | **17** | |

---

## Overview

This implementation guide provides step-by-step instructions for creating two Google Forms questionnaires:
1. **Pre-Test Questionnaire** (administered January 2026, before CKM Navigator app deployment)
2. **Post-Test Questionnaire** (administered April 2026, after 3-month implementation period)

**Key Design Features:**
- **Hybrid approach:** Core confidence questions (Q2-6 in post-test) match pre-test questions (Q4-8) to enable paired statistical analysis
- **Anonymous:** No identifying information collected
- **Stratification:** Responses stratified by PGY year for subgroup analysis
- **Focus:** Digital education tools (CKM Navigator app), not physical materials

---

## Pre-Test Questionnaire Setup

### Form Settings

1. **Create New Google Form**
   - Go to forms.google.com
   - Click "Blank" to create new form
   - Title: "EMPOWER-CKM Pre-Test Questionnaire"

2. **Form Description** (add at top)
```
Educating and Motivating Patients On Wellness through Effective Resident-led CKM-guidance

Please complete this survey BEFORE the implementation of the CKM Navigator app in January 2026. This should take approximately 5-7 minutes. All responses are anonymous.

Project Team: Sokratis Zisis, Thomas Tsai, Juan Ernesto Villareal del Moral, Kate Ji-Yoon Lee, Lucca Gesteira, Maysa Vilbert
```

3. **Settings Configuration**
   - Click Settings (gear icon)
   - General tab:
     - ☐ Limit to 1 response (leave UNCHECKED for anonymity)
     - ☑ Shuffle question order (optional)
   - Presentation tab:
     - ☑ Show progress bar
     - Confirmation message: "Thank you for completing the pre-test questionnaire! Your feedback is invaluable for improving CKM patient education in our clinic."
   - Responses tab:
     - ☑ Collect email addresses (UNCHECK - keep anonymous)

---

### Section A: Demographics & Background

**Section Header:** Add section break with title "Section A: Demographics & Background"

#### Question 1: PGY Year
- **Type:** Multiple choice
- **Question:** What is your current year of training?
- **Options:**
  - PGY-1
  - PGY-2
  - PGY-3
- **Required:** Yes

#### Question 2: Prior CKM Experience
- **Type:** Multiple choice
- **Question:** How would you rate your prior experience or training in cardio-kidney-metabolic (CKM) syndrome?
- **Options:**
  - No formal training or exposure
  - Minimal (brief mention in lectures or reading)
  - Moderate (dedicated lectures or rotation experience)
  - Substantial (extensive training, research, or clinical focus)
- **Required:** Yes

#### Question 3: Language Proficiency
- **Type:** Checkboxes
- **Question:** Do you speak Spanish or Portuguese fluently enough to counsel patients in these languages?
- **Options:**
  - Spanish (fluent for patient counseling)
  - Portuguese (fluent for patient counseling)
  - Neither
- **Required:** Yes

---

### Section B: Baseline Confidence in CKM Patient Education

**Section Header:** Add section break with title "Section B: Baseline Confidence in CKM Patient Education"

**Section Description:**
```
For questions 4-8, please rate your confidence using the following scale:
1 = Not at all confident
2 = Slightly confident
3 = Moderately confident
4 = Very confident
5 = Extremely confident
```

#### Question 4: CKM Interconnections
- **Type:** Linear scale (1-5)
- **Question:** How confident are you in explaining the interconnected nature of cardiovascular disease, chronic kidney disease, and metabolic conditions (CKM syndrome) to patients?
- **Scale:** 1 (Not at all confident) to 5 (Extremely confident)
- **Required:** Yes

#### Question 5: Dietary Counseling
- **Type:** Linear scale (1-5)
- **Question:** How confident are you in counseling patients about dietary modifications for CKM health (e.g., plate method, sodium reduction, healthy fats)?
- **Scale:** 1 (Not at all confident) to 5 (Extremely confident)
- **Required:** Yes

#### Question 6: Physical Activity Counseling
- **Type:** Linear scale (1-5)
- **Question:** How confident are you in discussing physical activity targets and explaining "Zone 2" heart rate concepts in patient-friendly terms?
- **Scale:** 1 (Not at all confident) to 5 (Extremely confident)
- **Required:** Yes

#### Question 7: Health Metrics Interpretation
- **Type:** Linear scale (1-5)
- **Question:** How confident are you in interpreting and explaining key CKM health metrics to patients (blood pressure, A1c, LDL cholesterol)?
- **Scale:** 1 (Not at all confident) to 5 (Extremely confident)
- **Required:** Yes

#### Question 8: Treatment Options Discussion
- **Type:** Linear scale (1-5)
- **Question:** How confident are you in discussing both lifestyle and pharmacologic treatment options for CKM conditions with patients (including quantifiable benefits and medication trade-offs)?
- **Scale:** 1 (Not at all confident) to 5 (Extremely confident)
- **Required:** Yes

---

### Section C: Current Practice Patterns & Efficiency

**Section Header:** Add section break with title "Section C: Current Practice Patterns & Efficiency"

#### Question 9: Time Spent on Education
- **Type:** Multiple choice
- **Question:** On average, how much time do you currently spend on patient education about CKM conditions during a typical continuity clinic visit?
- **Options:**
  - Less than 2 minutes
  - 2-5 minutes
  - 6-10 minutes
  - 11-15 minutes
  - More than 15 minutes
- **Required:** Yes

#### Question 10: Adequacy of Current Approach
- **Type:** Linear scale (1-5)
- **Question:** How adequate do you feel your current patient education approach is for CKM conditions?
- **Scale:** 1 (Very inadequate) to 5 (Very adequate)
- **Required:** Yes

---

### Section D: Attitudes Toward Digital Patient Education

**Section Header:** Add section break with title "Section D: Attitudes Toward Digital Patient Education"

#### Question 11: Importance of Digital Tools
- **Type:** Linear scale (1-5)
- **Question:** How important do you believe digital education tools (apps, QR codes to resources, mobile-friendly materials) are for improving patient understanding of chronic health conditions?
- **Scale:** 1 (Not at all important) to 5 (Extremely important)
- **Required:** Yes

#### Question 12: Patient Receptivity
- **Type:** Linear scale (1-5)
- **Question:** How receptive do you think your continuity clinic patients would be to using a mobile app for CKM health education?
- **Scale:** 1 (Not at all receptive) to 5 (Very receptive)
- **Required:** Yes

#### Question 13: Personal Interest
- **Type:** Linear scale (1-5)
- **Question:** How interested are you in using digital education tools (such as the CKM Navigator app) to support your patient counseling in continuity clinic?
- **Scale:** 1 (Not at all interested) to 5 (Extremely interested)
- **Required:** Yes

#### Question 14: Barriers (Qualitative)
- **Type:** Paragraph (long answer)
- **Question:** What do you perceive as the biggest barriers to effective CKM patient education in your current practice? (Optional)
- **Required:** No

---

## Post-Test Questionnaire Setup

### Form Settings

1. **Create New Google Form**
   - Title: "EMPOWER-CKM Post-Test Questionnaire"

2. **Form Description** (add at top)
```
Educating and Motivating Patients On Wellness through Effective Resident-led CKM-guidance

Please complete this survey AFTER the 3-month implementation period (April 2026). This should take approximately 8-10 minutes. All responses are anonymous.

Your feedback will help us evaluate the CKM Navigator app and determine if it should be formally adopted as a permanent resource in the resident continuity clinic.
```

3. **Settings Configuration** (same as pre-test)

---

### Section A: Demographics

**Section Header:** Add section break with title "Section A: Demographics"

#### Question 1: PGY Year
- **Type:** Multiple choice
- **Question:** What is your current year of training?
- **Options:**
  - PGY-1
  - PGY-2
  - PGY-3
- **Required:** Yes

---

### Section B: Post-Intervention Confidence in CKM Patient Education

**Section Header:** Add section break with title "Section B: Post-Intervention Confidence in CKM Patient Education"

**Section Description:**
```
For questions 2-6, please rate your confidence using the same scale as the pre-test:
1 = Not at all confident
2 = Slightly confident
3 = Moderately confident
4 = Very confident
5 = Extremely confident
```

#### Question 2: CKM Interconnections (MATCHED)
- **Type:** Linear scale (1-5)
- **Question:** How confident are you in explaining the interconnected nature of cardiovascular disease, chronic kidney disease, and metabolic conditions (CKM syndrome) to patients?
- **Scale:** 1 (Not at all confident) to 5 (Extremely confident)
- **Required:** Yes
- **Note:** Matches pre-test Q4

#### Question 3: Dietary Counseling (MATCHED)
- **Type:** Linear scale (1-5)
- **Question:** How confident are you in counseling patients about dietary modifications for CKM health (e.g., plate method, sodium reduction, healthy fats)?
- **Scale:** 1 (Not at all confident) to 5 (Extremely confident)
- **Required:** Yes
- **Note:** Matches pre-test Q5

#### Question 4: Physical Activity Counseling (MATCHED)
- **Type:** Linear scale (1-5)
- **Question:** How confident are you in discussing physical activity targets and explaining "Zone 2" heart rate concepts in patient-friendly terms?
- **Scale:** 1 (Not at all confident) to 5 (Extremely confident)
- **Required:** Yes
- **Note:** Matches pre-test Q6

#### Question 5: Health Metrics Interpretation (MATCHED)
- **Type:** Linear scale (1-5)
- **Question:** How confident are you in interpreting and explaining key CKM health metrics to patients (blood pressure, A1c, LDL cholesterol)?
- **Scale:** 1 (Not at all confident) to 5 (Extremely confident)
- **Required:** Yes
- **Note:** Matches pre-test Q7

#### Question 6: Treatment Options Discussion (MATCHED)
- **Type:** Linear scale (1-5)
- **Question:** How confident are you in discussing both lifestyle and pharmacologic treatment options for CKM conditions with patients (including quantifiable benefits and medication trade-offs)?
- **Scale:** 1 (Not at all confident) to 5 (Extremely confident)
- **Required:** Yes
- **Note:** Matches pre-test Q8

---

### Section C: Efficiency & Practice Impact

**Section Header:** Add section break with title "Section C: Efficiency & Practice Impact"

#### Question 7: Time Impact
- **Type:** Multiple choice
- **Question:** Did using the CKM Navigator app change the amount of time you spend on CKM patient education during clinic visits?
- **Options:**
  - Significantly decreased time (saved >5 minutes per visit)
  - Slightly decreased time (saved 2-5 minutes per visit)
  - No change in time
  - Slightly increased time (added 2-5 minutes per visit)
  - Significantly increased time (added >5 minutes per visit)
  - Did not use the app
- **Required:** Yes

#### Question 8: Post-Intervention Adequacy
- **Type:** Linear scale (1-5)
- **Question:** How adequate do you now feel your patient education approach is for CKM conditions (after using the CKM Navigator app)?
- **Scale:** 1 (Very inadequate) to 5 (Very adequate)
- **Required:** Yes

---

### Section D: CKM Navigator App Utility & Features

**Section Header:** Add section break with title "Section D: CKM Navigator App Utility & Features"

#### Question 9: Usage Frequency
- **Type:** Multiple choice
- **Question:** How frequently did you use or recommend the CKM Navigator app during the 3-month implementation period?
- **Options:**
  - Never
  - Rarely (1-2 times total)
  - Occasionally (once per month)
  - Frequently (2-3 times per month)
  - Very frequently (once per week or more)
- **Required:** Yes

#### Question 10: Overall Usefulness
- **Type:** Linear scale (1-5)
- **Question:** How would you rate the overall usefulness of the CKM Navigator app for patient education?
- **Scale:** 1 (Not at all useful) to 5 (Extremely useful)
- **Required:** Yes

#### Question 11: User-Friendliness
- **Type:** Linear scale (1-5)
- **Question:** How user-friendly was the CKM Navigator app interface for both you and your patients?
- **Scale:** 1 (Very difficult to use) to 5 (Very easy to use)
- **Required:** Yes

#### Question 12: Multilingual Effectiveness
- **Type:** Multiple choice
- **Question:** How effective was the multilingual capability (English/Spanish/Portuguese) of the CKM Navigator app for your patient population?
- **Options:**
  - Not applicable (only counseled English-speaking patients)
  - Not effective (translations were confusing or inaccurate)
  - Somewhat effective (translations were adequate)
  - Very effective (translations were accurate and helpful)
  - Extremely effective (translations significantly improved patient understanding)
- **Required:** Yes

#### Question 13: Patient Receptivity (Observed)
- **Type:** Linear scale (1-5)
- **Question:** Based on patient feedback and your observations, how receptive were patients to using the CKM Navigator app?
- **Scale:** 1 (Not at all receptive) to 5 (Very receptive)
- **Required:** Yes

---

### Section E: Future Implementation & Recommendations

**Section Header:** Add section break with title "Section E: Future Implementation & Recommendations"

#### Question 14: Likelihood of Continued Use
- **Type:** Linear scale (1-5)
- **Question:** How likely are you to continue using the CKM Navigator app in your future clinical practice?
- **Scale:** 1 (Very unlikely) to 5 (Very likely)
- **Required:** Yes

#### Question 15: Formal Adoption Recommendation
- **Type:** Multiple choice
- **Question:** Would you recommend the CKM Navigator app be formally adopted as a permanent resource in the resident continuity clinic?
- **Options:**
  - Strongly recommend adoption
  - Recommend adoption
  - Neutral
  - Do not recommend adoption
  - Strongly oppose adoption
- **Required:** Yes

#### Question 16: Valuable Features (Qualitative)
- **Type:** Paragraph (long answer)
- **Question:** What specific features of the CKM Navigator app did you find most valuable? (Optional)
- **Required:** No

#### Question 17: Improvement Suggestions (Qualitative)
- **Type:** Paragraph (long answer)
- **Question:** What improvements or additional features would you suggest for the CKM Navigator app? (Optional)
- **Required:** No

---

## Data Analysis Plan

### Quantitative Analysis

#### 1. **Descriptive Statistics**
For all Likert scale questions (1-5), calculate:
- Mean ± standard deviation
- Median and interquartile range (IQR)
- Frequency distributions (percentage at each level)

#### 2. **Primary Outcome: Confidence Change**
Compare pre-test (Q4-8) and post-test (Q2-6) confidence scores:
- **Paired t-test** (if normally distributed)
- **Wilcoxon signed-rank test** (if non-normally distributed)
- Calculate mean difference and 95% confidence interval
- **Target:** 25% increase in confidence scores (e.g., from mean 3.0 → 3.75)

#### 3. **Subgroup Analysis by PGY Year**
Stratify all analyses by training year:
- **One-way ANOVA** or **Kruskal-Wallis test** to compare baseline confidence across PGY levels
- Assess whether intervention effect differs by experience level

#### 4. **Efficiency Assessment**
- Compare pre-test Q10 (baseline adequacy) with post-test Q8 (post-intervention adequacy)
- Analyze post-test Q7 (time impact) frequency distribution

#### 5. **App Utilization Metrics**
- Usage frequency (post-test Q9)
- Overall usefulness rating (post-test Q10)
- Correlation between usage frequency and confidence improvement

#### 6. **Adoption Likelihood**
- Future use likelihood (post-test Q14)
- Formal adoption recommendation (post-test Q15)

### Qualitative Analysis

#### Open-Ended Responses
- **Pre-test Q14:** Barriers to CKM education
- **Post-test Q16:** Valuable app features
- **Post-test Q17:** Improvement suggestions

**Analysis Method:**
1. **Thematic coding:** Identify recurring themes
2. **Frequency analysis:** Count mentions of specific barriers/features
3. **Representative quotes:** Extract exemplary responses for presentation

### Sample Size Considerations

- **Total n = 25 residents** (8-9 per PGY year)
- **Power analysis:** With n=25, paired t-test can detect effect size d=0.60 with 80% power at α=0.05
- **Effect size calculation:** Cohen's d = (Mean_post - Mean_pre) / SD_pooled
- For 25% improvement target: Need to detect ~0.75-1.0 SD change (large effect)

### Statistical Software

Recommended tools:
- **Google Sheets:** Basic descriptive statistics, visualization
- **R or Python:** Paired t-tests, effect size calculation, visualization
- **SPSS/Stata:** Comprehensive statistical analysis (if available)

---

## Timeline & Administration

| Date | Activity |
|------|----------|
| **Dec 2025** | Finalize and pilot test both questionnaires |
| **Jan 1, 2026** | Distribute pre-test questionnaire to all residents |
| **Jan 7, 2026** | Close pre-test data collection |
| **Jan 8 - Mar 31, 2026** | CKM Navigator app implementation period |
| **Apr 1, 2026** | Distribute post-test questionnaire |
| **Apr 7, 2026** | Close post-test data collection |
| **Apr 8-15, 2026** | Data analysis |
| **May 2026** | Prepare QI presentation |
| **June 2026** | Present findings at resident QI symposium |

---

## Best Practices for Survey Distribution

### Communication Strategy

1. **Pre-announcement (1 week before):**
   - Email all residents about upcoming questionnaire
   - Explain study aims and time commitment
   - Emphasize anonymity and value of honest feedback

2. **Day of distribution:**
   - Send questionnaire link via email to all residents
   - Post reminder in firm group chats
   - Announce at Wednesday Oyster Rounds or Tuesday sessions

3. **Follow-up reminders:**
   - Day 3: Gentle reminder for non-responders
   - Day 5: Final reminder emphasizing deadline
   - Offer to answer questions about survey content

### Maximizing Response Rate

- **Mandatory completion:** Work with program directors to make surveys mandatory
- **Protected time:** Allocate 10 minutes during educational conference
- **Incentives (if budget allows):** Coffee gift cards for completion
- **Peer champions:** PGY-1 team members encourage participation
- **Transparency:** Share preliminary findings to demonstrate value

---

## Quality Assurance Checklist

Before launching surveys:

### Pre-Test
- [ ] All 14 questions entered correctly
- [ ] Required fields marked appropriately
- [ ] Likert scales use consistent 1-5 format
- [ ] Section headers and descriptions included
- [ ] Confirmation message customized
- [ ] Email collection DISABLED (anonymity)
- [ ] Pilot test with 2-3 residents
- [ ] Check mobile responsiveness

### Post-Test
- [ ] All 17 questions entered correctly
- [ ] Questions 2-6 match pre-test questions 4-8 EXACTLY
- [ ] Required fields marked appropriately
- [ ] Section headers and descriptions included
- [ ] Confirmation message customized
- [ ] Email collection DISABLED (anonymity)
- [ ] Pilot test with 2-3 residents
- [ ] Check mobile responsiveness

### Data Management
- [ ] Export responses to secure spreadsheet
- [ ] De-identify any inadvertent identifying information
- [ ] Back up data in multiple locations
- [ ] Restrict access to research team only
- [ ] Document data cleaning procedures

---

## Troubleshooting Common Issues

### Low Response Rate
- **Solution:** Make surveys mandatory, allocate protected time, send multiple reminders

### Incomplete Responses
- **Solution:** Mark critical questions as "Required," keep surveys concise (< 10 min)

### Response Bias
- **Solution:** Emphasize anonymity, clarify that feedback won't affect evaluations

### Technical Issues
- **Solution:** Test on multiple devices, provide alternative paper-based option if needed

### Data Interpretation Challenges
- **Solution:** Consult with biostatistician or QI mentor for analysis guidance

---

## Contact Information

For questions about survey implementation:
- **Project Team:** Sokratis Zisis, Thomas Tsai, Juan Ernesto Villareal del Moral, Kate Ji-Yoon Lee, Lucca Gesteira, Maysa Vilbert
- **Program Support:** Rhonda Carlson (residency coordinator), Anne Hill

---

## Appendix: Question Mapping Table

This table shows how pre-test and post-test questions align for paired analysis:

| Domain | Pre-Test Q# | Post-Test Q# | Question Content |
|--------|-------------|--------------|------------------|
| Demographics | 1 | 1 | PGY year |
| Demographics | 2 | - | Prior CKM experience |
| Demographics | 3 | - | Language proficiency |
| **Confidence** | **4** | **2** | CKM interconnections explanation |
| **Confidence** | **5** | **3** | Dietary counseling |
| **Confidence** | **6** | **4** | Physical activity counseling |
| **Confidence** | **7** | **5** | Health metrics interpretation |
| **Confidence** | **8** | **6** | Treatment options discussion |
| Efficiency | 9 | - | Current time spent |
| **Efficiency** | **10** | **8** | Adequacy of approach |
| Attitudes | 11 | - | Importance of digital tools |
| Attitudes | 12 | - | Patient receptivity (predicted) |
| Attitudes | 13 | - | Personal interest |
| Qualitative | 14 | - | Barriers to education |
| App Evaluation | - | 7 | Time impact |
| App Evaluation | - | 9 | Usage frequency |
| App Evaluation | - | 10 | Overall usefulness |
| App Evaluation | - | 11 | User-friendliness |
| App Evaluation | - | 12 | Multilingual effectiveness |
| App Evaluation | - | 13 | Patient receptivity (observed) |
| Implementation | - | 14 | Likelihood of continued use |
| Implementation | - | 15 | Formal adoption recommendation |
| Qualitative | - | 16 | Valuable features |
| Qualitative | - | 17 | Improvement suggestions |

**Bold rows** indicate matched questions for paired statistical analysis.

---

*End of Implementation Guide*
