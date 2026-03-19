# 📦 EMPOWER-CKM Questionnaire Package

**Complete survey deployment package for resident physician interest in digital CKM education tools**

---

## 📁 Package Contents

### Core Documents

1. **EMPOWER_CKM_Questionnaire.docx** (12 KB)
   - Professionally formatted Word document
   - Contains both pre-test (14 questions) and post-test (17 questions)
   - Print-friendly reference version
   - [View document](./EMPOWER_CKM_Questionnaire.docx)

2. **create_google_forms.gs** (19 KB)
   - Google Apps Script for automated form creation
   - Creates both forms with one click
   - Includes all questions, sections, and logic
   - [View script](./create_google_forms.gs)

3. **implementation_guide.md** (22 KB)
   - Comprehensive 40+ page technical guide
   - Detailed Google Forms setup instructions
   - Statistical analysis plan with sample size calculations
   - Quality assurance checklists
   - [View guide](./implementation_guide.md)

4. **DEPLOYMENT_INSTRUCTIONS.md** (Current file - 15 KB)
   - Step-by-step deployment walkthrough
   - Email templates for distribution
   - Troubleshooting common issues
   - Pre-launch checklist
   - [View instructions](./DEPLOYMENT_INSTRUCTIONS.md)

---

## 🚀 Quick Start (5 Minutes)

### Option A: Automated Deployment ⚡ (Recommended)

1. Go to **[Google Drive](https://drive.google.com)** → New → More → Google Apps Script
2. Copy contents of `create_google_forms.gs`
3. Paste into script editor
4. Run function `createBothForms`
5. Authorize script when prompted
6. Copy form URLs from logs
7. **Done!** ✅

**Time:** 5 minutes | **Difficulty:** Easy

### Option B: Manual Creation 📝

1. Open `implementation_guide.md`
2. Follow "Pre-Test Questionnaire Setup" section
3. Follow "Post-Test Questionnaire Setup" section
4. Create forms question-by-question

**Time:** 60-90 minutes per form | **Difficulty:** Medium

---

## 📊 Survey Overview

### Pre-Test Questionnaire (January 2026)
- **Questions:** 14 (1 optional)
- **Time:** 5-7 minutes
- **Sections:**
  - Demographics (3 questions)
  - Baseline Confidence (5 questions, Likert 1-5)
  - Current Practice (2 questions)
  - Attitudes (3 questions, Likert 1-5)
  - Barriers (1 optional, free text)

### Post-Test Questionnaire (April 2026)
- **Questions:** 17 (2 optional)
- **Time:** 8-10 minutes
- **Sections:**
  - Demographics (1 question)
  - Post-Intervention Confidence (5 MATCHED questions, Likert 1-5)
  - Efficiency Impact (2 questions)
  - App Evaluation (5 questions)
  - Future Implementation (2 questions)
  - Qualitative Feedback (2 optional, free text)

### Key Design Features
✅ **Hybrid approach:** Core questions identical for paired analysis
✅ **Anonymous:** No email collection
✅ **Stratified by PGY year:** Enables subgroup analysis
✅ **Focused on digital tools:** CKM Navigator app evaluation
✅ **Powered for 25% improvement:** Sufficient sample size (n=25)

---

## 📅 Implementation Timeline

| Date | Milestone |
|------|-----------|
| **Dec 2025** | Finalize and pilot test questionnaires |
| **Jan 1, 2026** | Distribute pre-test to all 25 residents |
| **Jan 7, 2026** | Close pre-test data collection |
| **Jan 8 - Mar 31** | CKM Navigator app implementation period |
| **Apr 1, 2026** | Distribute post-test to all residents |
| **Apr 7, 2026** | Close post-test data collection |
| **Apr 8-15, 2026** | Data analysis (paired t-tests, descriptive stats) |
| **May 2026** | Prepare final presentation |
| **June 2026** | Present at resident QI symposium |

---

## 🎯 Primary Outcome

**Measure:** Change in resident confidence scores (pre-post comparison)

**Target:** 25% increase in mean confidence scores
- Example: Baseline mean 3.0 → Post-intervention mean 3.75 (on 5-point scale)

**Analysis:** Paired t-test on matched confidence questions
- Pre-test Q4-8 vs. Post-test Q2-6
- Calculate Cohen's d effect size
- 95% confidence intervals

**Expected Result:** With n=25, powered to detect effect size d=0.60

---

## 📧 Quick Distribution Checklist

### Before Sending Pre-Test (Late December 2025)

- [ ] Forms created and tested
- [ ] Pilot tested with 2-3 residents
- [ ] Program directors notified
- [ ] Email template customized with actual form URL
- [ ] Distribution date confirmed (Jan 1, 2026)
- [ ] Reminder emails scheduled (Day 3, Day 5)

### Pre-Test Email (Send January 1, 2026)

```
Subject: [ACTION REQUIRED] EMPOWER-CKM Pre-Test Survey (5 min)

🔗 Survey Link: [INSERT PRE-TEST URL]
⏱️ Time: 5-7 minutes
📅 Deadline: January 7, 2026
🔒 Anonymous

Please complete before we launch the CKM Navigator app pilot!
```

### Post-Test Email (Send April 1, 2026)

```
Subject: [ACTION REQUIRED] EMPOWER-CKM Post-Test Survey (8 min)

🔗 Survey Link: [INSERT POST-TEST URL]
⏱️ Time: 8-10 minutes
📅 Deadline: April 7, 2026
🔒 Anonymous

Your feedback determines if CKM Navigator becomes permanent!
```

---

## 🔧 Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| **Script won't run** | Select `createBothForms` from dropdown, not `myFunction` |
| **Authorization error** | Click "Advanced" → "Go to project (unsafe)" → Allow |
| **Can't find forms** | Check Drive search for "EMPOWER-CKM" |
| **Need to edit questions** | Open form → Click question → Edit directly |
| **Want to change colors** | Open form → Palette icon (top right) → Choose theme |
| **Low response rate** | Send reminders, announce at conferences, make mandatory |
| **Data export needed** | Open response spreadsheet → File → Download → CSV |

---

## 📈 Success Metrics

### Response Rates
- **Target:** 100% (25/25 residents)
- **Minimum acceptable:** 80% (20/25 residents)
- **By PGY year:** ~8-9 per year

### Data Quality
- **Complete responses:** >95%
- **Matched pre-post:** 100% (same residents both times)
- **Even PGY distribution:** Check with pivot table

### Primary Outcome
- **Significant improvement:** p < 0.05 on paired t-test
- **Clinical significance:** Cohen's d > 0.60
- **Target:** 25% increase in confidence scores

---

## 🎓 Statistical Analysis Resources

### Software Recommendations
- **Basic:** Google Sheets (descriptive statistics, charts)
- **Intermediate:** Excel (t-tests, ANOVA)
- **Advanced:** R, Python, SPSS, Stata (comprehensive analysis)

### Key Analyses (see implementation_guide.md for details)
1. **Descriptive statistics:** Mean, SD, median, IQR for all questions
2. **Paired t-test:** Pre-post confidence comparison (primary outcome)
3. **Effect size:** Cohen's d calculation
4. **Subgroup analysis:** Stratify by PGY year
5. **App utilization:** Frequency distributions
6. **Qualitative coding:** Thematic analysis of open-ended responses

### Analysis Template (R/Python)
```python
# Example paired t-test in Python
import pandas as pd
from scipy import stats

# Load data
pre_test = pd.read_csv('pre_test_responses.csv')
post_test = pd.read_csv('post_test_responses.csv')

# Extract matched confidence scores (Q4-8 pre, Q2-6 post)
pre_confidence = pre_test[['Q4', 'Q5', 'Q6', 'Q7', 'Q8']].mean(axis=1)
post_confidence = post_test[['Q2', 'Q3', 'Q4', 'Q5', 'Q6']].mean(axis=1)

# Paired t-test
t_stat, p_value = stats.ttest_rel(pre_confidence, post_confidence)

# Effect size (Cohen's d)
diff = post_confidence - pre_confidence
cohens_d = diff.mean() / diff.std()

print(f"Mean change: {diff.mean():.2f}")
print(f"p-value: {p_value:.4f}")
print(f"Cohen's d: {cohens_d:.2f}")
```

---

## 📞 Support & Resources

### Project Team
- Sokratis Zisis, MD, MSc (PGY-3)
- Thomas Tsai, MD (PGY-3)
- Juan Ernesto Villareal del Moral, MD (PGY-2)
- Kate Ji-Yoon Lee, MD (PGY-2)
- Lucca Gesteira, MD (PGY-1)
- Maysa Vilbert, MD (PGY-1)

### Administrative Support
- Rhonda Carlson (Residency Coordinator)
- Anne Hill (Administrative Support)
- Drs. Treadwell and Chun (Program Directors)

### External Resources
- [Google Forms Help](https://support.google.com/docs/answer/6281888)
- [Google Apps Script Docs](https://developers.google.com/apps-script)
- [Survey Design Best Practices](https://www.questionpro.com/blog/survey-design/)
- [Statistical Analysis Tutorials](https://www.statmethods.net/)

---

## 📚 Document Cross-Reference

| Need to... | See document... |
|------------|----------------|
| Understand questionnaire design | `implementation_guide.md` (pages 1-25) |
| Set up Google Forms manually | `implementation_guide.md` (pages 5-22) |
| Analyze data statistically | `implementation_guide.md` (pages 23-28) |
| Deploy forms automatically | `DEPLOYMENT_INSTRUCTIONS.md` (Method 1) |
| Distribute to residents | `DEPLOYMENT_INSTRUCTIONS.md` (Distribution section) |
| Troubleshoot technical issues | `DEPLOYMENT_INSTRUCTIONS.md` (Troubleshooting) |
| Print reference version | `EMPOWER_CKM_Questionnaire.docx` |
| View script source code | `create_google_forms.gs` |

---

## ✅ Final Pre-Launch Checklist

### Technical Setup
- [ ] Google Apps Script executed successfully
- [ ] Both forms created and accessible
- [ ] Response spreadsheets linked
- [ ] Forms tested in preview mode
- [ ] Pilot tested with 2-3 residents
- [ ] All questions display correctly
- [ ] Progress bar enabled
- [ ] Email collection disabled (anonymous)

### Administrative Setup
- [ ] Program directors informed and supportive
- [ ] Survey made mandatory (if possible)
- [ ] Protected time allocated (10 min during conference)
- [ ] Firm champions identified (PGY-1 team members)
- [ ] Group chat reminders scheduled
- [ ] Conference announcements prepared

### Distribution Preparation
- [ ] Email templates customized with URLs
- [ ] Distribution schedule finalized
- [ ] Reminder sequence planned (Day 0, Day 3, Day 5)
- [ ] Response monitoring dashboard set up
- [ ] Data backup plan established

### Analysis Preparation
- [ ] Statistical software installed (R/Python/SPSS)
- [ ] Analysis scripts prepared
- [ ] Biostatistician consulted (if needed)
- [ ] Presentation template created
- [ ] QI symposium date confirmed

---

## 🎉 You're Ready to Launch!

When you've completed the checklist above, you're ready to:

1. ✅ Deploy forms (Jan 1, 2026)
2. ✅ Collect pre-test data (Jan 1-7, 2026)
3. ✅ Implement CKM Navigator app (Jan-Mar 2026)
4. ✅ Collect post-test data (Apr 1-7, 2026)
5. ✅ Analyze results (Apr 8-15, 2026)
6. ✅ Present findings (June 2026)

**Good luck with the EMPOWER-CKM project!** 🚀

---

*For questions or issues with this questionnaire package, contact the project team.*

**Version 1.0 | Created: February 2026 | Authors: EMPOWER-CKM Project Team**
