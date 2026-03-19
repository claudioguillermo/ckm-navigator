# 🚀 Google Forms Deployment Instructions
## EMPOWER-CKM Questionnaires

This guide will walk you through deploying both the pre-test and post-test questionnaires as Google Forms using the automated script.

---

## 📋 Prerequisites

- Google Account (institutional or personal)
- Google Drive access
- 5-10 minutes

---

## 🎯 Method 1: Automated Deployment (Recommended)

### Step 1: Open Google Apps Script

1. Go to **[Google Drive](https://drive.google.com)**
2. Click **"New"** (top left)
3. Select **"More"** → **"Google Apps Script"**
   - If you don't see this option:
     - Click **"Connect more apps"**
     - Search for **"Google Apps Script"**
     - Click **"Connect"**
     - Repeat Step 1

### Step 2: Paste the Script

1. You'll see a blank script editor with `function myFunction() {}`
2. **Delete all existing code**
3. Open the file `create_google_forms.gs` (provided)
4. **Copy the entire contents** (Ctrl+A, Ctrl+C or Cmd+A, Cmd+C)
5. **Paste into the script editor** (Ctrl+V or Cmd+V)
6. Click **File → Save** (or Ctrl+S / Cmd+S)
7. Name the project: **"EMPOWER-CKM Form Generator"**

### Step 3: Run the Script

1. In the toolbar, find the function dropdown menu (shows `myFunction` by default)
2. Select **`createBothForms`** from the dropdown
3. Click the **▶ Run** button
4. **First time only:** You'll see an authorization prompt:
   - Click **"Review permissions"**
   - Select your Google account
   - Click **"Advanced"** (bottom left)
   - Click **"Go to EMPOWER-CKM Form Generator (unsafe)"**
   - Click **"Allow"**

   ⚠️ **Note:** The "unsafe" warning is standard for all custom scripts. This script only creates forms in your Drive—it doesn't access external data.

### Step 4: Get Your Form URLs

1. After the script runs (5-10 seconds), click **View → Logs** (or Ctrl+Enter / Cmd+Enter)
2. You'll see output like:

```
✅ Pre-Test Form created: https://docs.google.com/forms/d/.../edit
📋 Pre-Test Published URL: https://docs.google.com/forms/d/.../viewform

✅ Post-Test Form created: https://docs.google.com/forms/d/.../edit
📋 Post-Test Published URL: https://docs.google.com/forms/d/.../viewform
```

3. **Copy both "Published URL" links** (these are what you'll distribute to residents)
4. **Save the "Edit URL" links** (these let you modify the forms later)

### Step 5: Verify Forms

1. Go to **[Google Drive](https://drive.google.com)**
2. You should see two new forms:
   - **EMPOWER-CKM Pre-Test Questionnaire**
   - **EMPOWER-CKM Post-Test Questionnaire**
3. Open each form (click the name)
4. Click **"Preview"** (eye icon) to test the form as a respondent

---

## 🔧 Method 2: Manual Creation

If you prefer to create the forms manually or the script doesn't work, follow the detailed instructions in **`implementation_guide.md`** (Section: "Pre-Test Questionnaire Setup" and "Post-Test Questionnaire Setup").

**Time required:** 60-90 minutes per form

---

## 📊 Setting Up Response Collection

### Automatic Response Spreadsheet

Google Forms automatically creates a response spreadsheet. To access it:

1. Open your form in **edit mode** (use the Edit URL)
2. Click the **"Responses"** tab
3. Click the **spreadsheet icon** (green with white grid)
4. This creates a new Google Sheet linked to your form
5. Responses will automatically populate this spreadsheet in real-time

### Manual Spreadsheet Link (Optional)

If you want to create the spreadsheets separately:

1. In the script editor, scroll to the `linkResponseSpreadsheets()` function
2. After creating forms, get the Form IDs:
   - Open form in edit mode
   - URL format: `https://docs.google.com/forms/d/FORM_ID_HERE/edit`
   - Copy the `FORM_ID_HERE` part
3. Replace `YOUR_PRE_TEST_FORM_ID_HERE` and `YOUR_POST_TEST_FORM_ID_HERE` with actual IDs
4. Change function dropdown to `linkResponseSpreadsheets`
5. Click **Run**

---

## 🎨 Customizing Your Forms (After Creation)

### Change Theme/Colors

1. Open form in **edit mode**
2. Click **palette icon** (top right)
3. Choose theme color (suggest: **blue** for clinical/professional feel)
4. Select header style

### Add Your Institution's Logo

1. Click **palette icon** → **"Choose image"**
2. Upload your residency program or hospital logo
3. This appears at the top of the form

### Modify Questions

1. Click any question to edit
2. Click the **⋮** (three dots) to:
   - Duplicate question
   - Delete question
   - Add description/help text
   - Make required/optional

### Reorder Questions

1. Hover over a question
2. Click and drag the **⋮⋮** (six dots) icon to move

---

## 📧 Distributing the Forms

### Pre-Test Distribution (January 2026)

**Email Template:**

```
Subject: [ACTION REQUIRED] EMPOWER-CKM Pre-Test Survey (5 min)

Dear Residents,

As part of the EMPOWER-CKM quality improvement project, we are implementing a new digital education tool (CKM Navigator app) to improve our CKM patient counseling.

Before we begin the 3-month pilot (January-March 2026), please complete this brief anonymous survey:

🔗 Pre-Test Survey: [INSERT PRE-TEST PUBLISHED URL]

Time required: 5-7 minutes
Deadline: January 7, 2026
Anonymous: No identifying information collected

Your honest feedback is essential for measuring the impact of this intervention.

Questions? Contact: [Project Team Email]

Thank you,
[Your Name]
EMPOWER-CKM Project Team
```

### Post-Test Distribution (April 2026)

**Email Template:**

```
Subject: [ACTION REQUIRED] EMPOWER-CKM Post-Test Survey (8 min)

Dear Residents,

Thank you for participating in the CKM Navigator app pilot over the past 3 months!

Please complete this final anonymous survey to help us evaluate the app's effectiveness:

🔗 Post-Test Survey: [INSERT POST-TEST PUBLISHED URL]

Time required: 8-10 minutes
Deadline: April 7, 2026
Anonymous: No identifying information collected

Your feedback will determine whether the CKM Navigator app becomes a permanent clinic resource.

Questions? Contact: [Project Team Email]

Thank you for your participation,
[Your Name]
EMPOWER-CKM Project Team
```

### Distribution Channels

1. **Email** (primary method)
2. **Firm group chats** (Slack, WhatsApp, etc.)
3. **Wednesday Oyster Rounds announcement**
4. **Tuesday Dr. Chun session announcement**
5. **QR code poster** in resident workroom (optional)

---

## 📈 Monitoring Response Rates

### Real-Time Dashboard

1. Open form in **edit mode**
2. Click **"Responses"** tab
3. View:
   - Total responses
   - Response rate over time (graph)
   - Summary statistics
   - Individual responses

### Checking Completion by PGY Year

1. Open response spreadsheet
2. Look at "PGY Year" column
3. Use pivot table to count by year:
   - **Data → Pivot table**
   - Rows: PGY Year
   - Values: COUNTA of PGY Year

### Target Response Rates

- **Goal:** 100% response rate (mandatory survey)
- **Minimum acceptable:** 80% (20/25 residents)
- **By PGY year:**
  - PGY-1: 8-9 responses
  - PGY-2: 8-9 responses
  - PGY-3: 8-9 responses

---

## 🔒 Privacy & Data Security

### Settings Already Configured

✅ **Anonymous responses** (email collection disabled)
✅ **Single response only** (prevents duplicate entries)
✅ **No response editing** (ensures data integrity)
✅ **Progress bar enabled** (improves completion rate)

### Additional Security Measures

1. **Restrict form access** (optional):
   - Click **⚙️ Settings** → **Responses**
   - Enable **"Restrict to [Your Institution]"**
   - Only users with institutional email can respond

2. **Response notifications**:
   - Click **Responses** → **⋮** (three dots)
   - Select **"Get email notifications for new responses"**
   - Useful for monitoring completion rates

3. **Download backup data**:
   - Open response spreadsheet
   - **File → Download → Comma-separated values (.csv)**
   - Store securely (HIPAA-compliant location if applicable)

---

## 🛠️ Troubleshooting

### Issue: Script won't run

**Solution:**
1. Check that you selected `createBothForms` function (not `myFunction`)
2. Ensure you authorized the script (see Step 3)
3. Try refreshing the page and running again
4. Check browser console for errors (F12 → Console tab)

### Issue: Forms created but can't find them

**Solution:**
1. Check **View → Logs** in script editor for URLs
2. Search Google Drive for "EMPOWER-CKM"
3. Check **"Recent"** in Google Drive left sidebar

### Issue: Questions in wrong order

**Solution:**
1. Open form in edit mode
2. Click and drag questions using **⋮⋮** icon
3. Or delete and recreate using manual method

### Issue: Can't access form URLs

**Solution:**
1. Check sharing settings:
   - Open form → **Send** button (top right)
   - Copy link → **"Anyone with the link"** should be selected
2. Test in incognito/private browser window

### Issue: Need to modify a question

**Solution:**
1. Open form in edit mode
2. Click the question
3. Make changes
4. Changes are saved automatically

---

## ✅ Pre-Launch Checklist

Before distributing to residents:

### Pre-Test Form
- [ ] Form created successfully
- [ ] All 14 questions present
- [ ] Section breaks in correct locations
- [ ] Likert scales show 1-5 range with correct labels
- [ ] Required questions marked (all except Q14)
- [ ] Response spreadsheet linked
- [ ] Form tested in preview mode
- [ ] Confirmation message displays correctly
- [ ] Sharing set to "Anyone with the link"
- [ ] Email collection is OFF (anonymous)

### Post-Test Form
- [ ] Form created successfully
- [ ] All 17 questions present
- [ ] Questions 2-6 match pre-test questions 4-8 EXACTLY
- [ ] Section breaks in correct locations
- [ ] Likert scales show 1-5 range with correct labels
- [ ] Required questions marked (all except Q16-17)
- [ ] Response spreadsheet linked
- [ ] Form tested in preview mode
- [ ] Confirmation message displays correctly
- [ ] Sharing set to "Anyone with the link"
- [ ] Email collection is OFF (anonymous)

### Distribution Preparation
- [ ] Pre-test URL saved and tested
- [ ] Post-test URL saved and tested
- [ ] Email templates customized with actual URLs
- [ ] Distribution date scheduled (Pre: Jan 1, Post: Apr 1)
- [ ] Reminder emails drafted
- [ ] Program directors notified
- [ ] Firm champions briefed

---

## 📞 Support Contacts

**Technical Issues:**
- Google Forms Help: https://support.google.com/docs/answer/6281888
- Google Apps Script Documentation: https://developers.google.com/apps-script

**Project Questions:**
- Project Team: [Insert contact email]
- Program Coordinator: Rhonda Carlson
- Administrative Support: Anne Hill

---

## 📊 Next Steps After Data Collection

1. **Export response data:**
   - Open response spreadsheet
   - File → Download → CSV

2. **Data cleaning:**
   - Check for incomplete responses
   - Verify PGY year distribution
   - Remove test responses if any

3. **Statistical analysis:**
   - Follow analysis plan in `implementation_guide.md`
   - Use R, Python, SPSS, or Excel
   - Calculate pre-post differences with paired t-tests

4. **Results presentation:**
   - Prepare findings for June 2026 QI Symposium
   - Include:
     - Response rates
     - Baseline confidence scores
     - Change in confidence (primary outcome)
     - App utilization and adoption recommendations
     - Qualitative themes

---

## 🎉 Success Metrics

You'll know your deployment is successful when:

✅ Both forms created and accessible
✅ 100% response rate on pre-test (25/25 residents)
✅ 100% response rate on post-test (25/25 residents)
✅ Even distribution across PGY years
✅ Minimal incomplete responses
✅ Rich qualitative feedback in open-ended questions
✅ Data ready for statistical analysis

---

**Good luck with your EMPOWER-CKM project! 🎯**

*For questions about this deployment guide, contact the project team.*
