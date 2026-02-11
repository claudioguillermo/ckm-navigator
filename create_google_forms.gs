/**
 * EMPOWER-CKM Questionnaire Generator
 * Google Apps Script to automatically create pre-test and post-test forms
 *
 * INSTRUCTIONS:
 * 1. Open Google Drive (drive.google.com)
 * 2. Click "New" → "More" → "Google Apps Script"
 * 3. Delete any default code and paste this entire script
 * 4. Click "Run" → Select "createBothForms"
 * 5. Authorize the script when prompted
 * 6. Check your Google Drive for the two new forms
 */

function createBothForms() {
  Logger.log('Creating EMPOWER-CKM questionnaires...');

  // Create both forms
  var preTestForm = createPreTestForm();
  var postTestForm = createPostTestForm();

  // Log the URLs
  Logger.log('✅ Pre-Test Form created: ' + preTestForm.getEditUrl());
  Logger.log('📋 Pre-Test Published URL: ' + preTestForm.getPublishedUrl());
  Logger.log('');
  Logger.log('✅ Post-Test Form created: ' + postTestForm.getEditUrl());
  Logger.log('📋 Post-Test Published URL: ' + postTestForm.getPublishedUrl());

  // Show a popup with the URLs
  var ui = SpreadsheetApp.getUi();
  var message = 'Forms created successfully!\n\n' +
                'PRE-TEST FORM:\n' + preTestForm.getPublishedUrl() + '\n\n' +
                'POST-TEST FORM:\n' + postTestForm.getPublishedUrl();

  // Since we're in Apps Script, show in Logger
  Logger.log('\n=== FORMS CREATED SUCCESSFULLY ===');
  Logger.log('Share these URLs with residents:\n');
  Logger.log('PRE-TEST: ' + preTestForm.getPublishedUrl());
  Logger.log('POST-TEST: ' + postTestForm.getPublishedUrl());
}

function createPreTestForm() {
  // Create form
  var form = FormApp.create('EMPOWER-CKM Pre-Test Questionnaire')
    .setDescription(
      'Educating and Motivating Patients On Wellness through Effective Resident-led CKM-guidance\n\n' +
      'Please complete this survey BEFORE the implementation of the CKM Navigator app in January 2026. ' +
      'This should take approximately 5-7 minutes. All responses are anonymous.\n\n' +
      'Project Team: Sokratis Zisis, Thomas Tsai, Juan Ernesto Villareal del Moral, Kate Ji-Yoon Lee, Lucca Gesteira, Maysa Vilbert'
    )
    .setConfirmationMessage('Thank you for completing the pre-test questionnaire! Your feedback is invaluable for improving CKM patient education in our clinic.')
    .setAllowResponseEdits(false)
    .setCollectEmail(false)
    .setShowLinkToRespondAgain(false)
    .setProgressBar(true);

  // Section A: Demographics & Background
  form.addPageBreakItem()
    .setTitle('Section A: Demographics & Background');

  // Q1: PGY Year
  form.addMultipleChoiceItem()
    .setTitle('What is your current year of training?')
    .setChoiceValues(['PGY-1', 'PGY-2', 'PGY-3'])
    .setRequired(true);

  // Q2: Prior CKM Experience
  form.addMultipleChoiceItem()
    .setTitle('How would you rate your prior experience or training in cardio-kidney-metabolic (CKM) syndrome?')
    .setChoiceValues([
      'No formal training or exposure',
      'Minimal (brief mention in lectures or reading)',
      'Moderate (dedicated lectures or rotation experience)',
      'Substantial (extensive training, research, or clinical focus)'
    ])
    .setRequired(true);

  // Q3: Language Proficiency
  form.addCheckboxItem()
    .setTitle('Do you speak Spanish or Portuguese fluently enough to counsel patients in these languages?')
    .setChoiceValues([
      'Spanish (fluent for patient counseling)',
      'Portuguese (fluent for patient counseling)',
      'Neither'
    ])
    .setRequired(true);

  // Section B: Baseline Confidence
  form.addPageBreakItem()
    .setTitle('Section B: Baseline Confidence in CKM Patient Education')
    .setHelpText(
      'For questions 4-8, please rate your confidence using the following scale:\n' +
      '1 = Not at all confident\n' +
      '2 = Slightly confident\n' +
      '3 = Moderately confident\n' +
      '4 = Very confident\n' +
      '5 = Extremely confident'
    );

  // Q4: CKM Interconnections
  form.addScaleItem()
    .setTitle('How confident are you in explaining the interconnected nature of cardiovascular disease, chronic kidney disease, and metabolic conditions (CKM syndrome) to patients?')
    .setBounds(1, 5)
    .setLabels('Not at all confident', 'Extremely confident')
    .setRequired(true);

  // Q5: Dietary Counseling
  form.addScaleItem()
    .setTitle('How confident are you in counseling patients about dietary modifications for CKM health (e.g., plate method, sodium reduction, healthy fats)?')
    .setBounds(1, 5)
    .setLabels('Not at all confident', 'Extremely confident')
    .setRequired(true);

  // Q6: Physical Activity
  form.addScaleItem()
    .setTitle('How confident are you in discussing physical activity targets and explaining "Zone 2" heart rate concepts in patient-friendly terms?')
    .setBounds(1, 5)
    .setLabels('Not at all confident', 'Extremely confident')
    .setRequired(true);

  // Q7: Health Metrics
  form.addScaleItem()
    .setTitle('How confident are you in interpreting and explaining key CKM health metrics to patients (blood pressure, A1c, LDL cholesterol)?')
    .setBounds(1, 5)
    .setLabels('Not at all confident', 'Extremely confident')
    .setRequired(true);

  // Q8: Treatment Options
  form.addScaleItem()
    .setTitle('How confident are you in discussing both lifestyle and pharmacologic treatment options for CKM conditions with patients (including quantifiable benefits and medication trade-offs)?')
    .setBounds(1, 5)
    .setLabels('Not at all confident', 'Extremely confident')
    .setRequired(true);

  // Section C: Current Practice Patterns
  form.addPageBreakItem()
    .setTitle('Section C: Current Practice Patterns & Efficiency');

  // Q9: Time Spent
  form.addMultipleChoiceItem()
    .setTitle('On average, how much time do you currently spend on patient education about CKM conditions during a typical continuity clinic visit?')
    .setChoiceValues([
      'Less than 2 minutes',
      '2-5 minutes',
      '6-10 minutes',
      '11-15 minutes',
      'More than 15 minutes'
    ])
    .setRequired(true);

  // Q10: Adequacy
  form.addScaleItem()
    .setTitle('How adequate do you feel your current patient education approach is for CKM conditions?')
    .setBounds(1, 5)
    .setLabels('Very inadequate', 'Very adequate')
    .setRequired(true);

  // Section D: Attitudes
  form.addPageBreakItem()
    .setTitle('Section D: Attitudes Toward Digital Patient Education');

  // Q11: Importance of Digital Tools
  form.addScaleItem()
    .setTitle('How important do you believe digital education tools (apps, QR codes to resources, mobile-friendly materials) are for improving patient understanding of chronic health conditions?')
    .setBounds(1, 5)
    .setLabels('Not at all important', 'Extremely important')
    .setRequired(true);

  // Q12: Patient Receptivity
  form.addScaleItem()
    .setTitle('How receptive do you think your continuity clinic patients would be to using a mobile app for CKM health education?')
    .setBounds(1, 5)
    .setLabels('Not at all receptive', 'Very receptive')
    .setRequired(true);

  // Q13: Personal Interest
  form.addScaleItem()
    .setTitle('How interested are you in using digital education tools (such as the CKM Navigator app) to support your patient counseling in continuity clinic?')
    .setBounds(1, 5)
    .setLabels('Not at all interested', 'Extremely interested')
    .setRequired(true);

  // Q14: Barriers (Optional)
  form.addParagraphTextItem()
    .setTitle('What do you perceive as the biggest barriers to effective CKM patient education in your current practice? (Optional)')
    .setRequired(false);

  return form;
}

function createPostTestForm() {
  // Create form
  var form = FormApp.create('EMPOWER-CKM Post-Test Questionnaire')
    .setDescription(
      'Educating and Motivating Patients On Wellness through Effective Resident-led CKM-guidance\n\n' +
      'Please complete this survey AFTER the 3-month implementation period (April 2026). ' +
      'This should take approximately 8-10 minutes. All responses are anonymous.\n\n' +
      'Your feedback will help us evaluate the CKM Navigator app and determine if it should be formally adopted as a permanent resource in the resident continuity clinic.'
    )
    .setConfirmationMessage('Thank you for completing the post-test questionnaire! Your feedback is invaluable for improving CKM patient education in our clinic.')
    .setAllowResponseEdits(false)
    .setCollectEmail(false)
    .setShowLinkToRespondAgain(false)
    .setProgressBar(true);

  // Section A: Demographics
  form.addPageBreakItem()
    .setTitle('Section A: Demographics');

  // Q1: PGY Year
  form.addMultipleChoiceItem()
    .setTitle('What is your current year of training?')
    .setChoiceValues(['PGY-1', 'PGY-2', 'PGY-3'])
    .setRequired(true);

  // Section B: Post-Intervention Confidence (MATCHED QUESTIONS)
  form.addPageBreakItem()
    .setTitle('Section B: Post-Intervention Confidence in CKM Patient Education')
    .setHelpText(
      'For questions 2-6, please rate your confidence using the same scale as the pre-test:\n' +
      '1 = Not at all confident\n' +
      '2 = Slightly confident\n' +
      '3 = Moderately confident\n' +
      '4 = Very confident\n' +
      '5 = Extremely confident'
    );

  // Q2: CKM Interconnections (MATCHED)
  form.addScaleItem()
    .setTitle('How confident are you in explaining the interconnected nature of cardiovascular disease, chronic kidney disease, and metabolic conditions (CKM syndrome) to patients?')
    .setBounds(1, 5)
    .setLabels('Not at all confident', 'Extremely confident')
    .setRequired(true);

  // Q3: Dietary Counseling (MATCHED)
  form.addScaleItem()
    .setTitle('How confident are you in counseling patients about dietary modifications for CKM health (e.g., plate method, sodium reduction, healthy fats)?')
    .setBounds(1, 5)
    .setLabels('Not at all confident', 'Extremely confident')
    .setRequired(true);

  // Q4: Physical Activity (MATCHED)
  form.addScaleItem()
    .setTitle('How confident are you in discussing physical activity targets and explaining "Zone 2" heart rate concepts in patient-friendly terms?')
    .setBounds(1, 5)
    .setLabels('Not at all confident', 'Extremely confident')
    .setRequired(true);

  // Q5: Health Metrics (MATCHED)
  form.addScaleItem()
    .setTitle('How confident are you in interpreting and explaining key CKM health metrics to patients (blood pressure, A1c, LDL cholesterol)?')
    .setBounds(1, 5)
    .setLabels('Not at all confident', 'Extremely confident')
    .setRequired(true);

  // Q6: Treatment Options (MATCHED)
  form.addScaleItem()
    .setTitle('How confident are you in discussing both lifestyle and pharmacologic treatment options for CKM conditions with patients (including quantifiable benefits and medication trade-offs)?')
    .setBounds(1, 5)
    .setLabels('Not at all confident', 'Extremely confident')
    .setRequired(true);

  // Section C: Efficiency & Practice Impact
  form.addPageBreakItem()
    .setTitle('Section C: Efficiency & Practice Impact');

  // Q7: Time Impact
  form.addMultipleChoiceItem()
    .setTitle('Did using the CKM Navigator app change the amount of time you spend on CKM patient education during clinic visits?')
    .setChoiceValues([
      'Significantly decreased time (saved >5 minutes per visit)',
      'Slightly decreased time (saved 2-5 minutes per visit)',
      'No change in time',
      'Slightly increased time (added 2-5 minutes per visit)',
      'Significantly increased time (added >5 minutes per visit)',
      'Did not use the app'
    ])
    .setRequired(true);

  // Q8: Post-Intervention Adequacy
  form.addScaleItem()
    .setTitle('How adequate do you now feel your patient education approach is for CKM conditions (after using the CKM Navigator app)?')
    .setBounds(1, 5)
    .setLabels('Very inadequate', 'Very adequate')
    .setRequired(true);

  // Section D: CKM Navigator App Utility & Features
  form.addPageBreakItem()
    .setTitle('Section D: CKM Navigator App Utility & Features');

  // Q9: Usage Frequency
  form.addMultipleChoiceItem()
    .setTitle('How frequently did you use or recommend the CKM Navigator app during the 3-month implementation period?')
    .setChoiceValues([
      'Never',
      'Rarely (1-2 times total)',
      'Occasionally (once per month)',
      'Frequently (2-3 times per month)',
      'Very frequently (once per week or more)'
    ])
    .setRequired(true);

  // Q10: Overall Usefulness
  form.addScaleItem()
    .setTitle('How would you rate the overall usefulness of the CKM Navigator app for patient education?')
    .setBounds(1, 5)
    .setLabels('Not at all useful', 'Extremely useful')
    .setRequired(true);

  // Q11: User-Friendliness
  form.addScaleItem()
    .setTitle('How user-friendly was the CKM Navigator app interface for both you and your patients?')
    .setBounds(1, 5)
    .setLabels('Very difficult to use', 'Very easy to use')
    .setRequired(true);

  // Q12: Multilingual Effectiveness
  form.addMultipleChoiceItem()
    .setTitle('How effective was the multilingual capability (English/Spanish/Portuguese) of the CKM Navigator app for your patient population?')
    .setChoiceValues([
      'Not applicable (only counseled English-speaking patients)',
      'Not effective (translations were confusing or inaccurate)',
      'Somewhat effective (translations were adequate)',
      'Very effective (translations were accurate and helpful)',
      'Extremely effective (translations significantly improved patient understanding)'
    ])
    .setRequired(true);

  // Q13: Patient Receptivity (Observed)
  form.addScaleItem()
    .setTitle('Based on patient feedback and your observations, how receptive were patients to using the CKM Navigator app?')
    .setBounds(1, 5)
    .setLabels('Not at all receptive', 'Very receptive')
    .setRequired(true);

  // Section E: Future Implementation
  form.addPageBreakItem()
    .setTitle('Section E: Future Implementation & Recommendations');

  // Q14: Likelihood of Continued Use
  form.addScaleItem()
    .setTitle('How likely are you to continue using the CKM Navigator app in your future clinical practice?')
    .setBounds(1, 5)
    .setLabels('Very unlikely', 'Very likely')
    .setRequired(true);

  // Q15: Formal Adoption Recommendation
  form.addMultipleChoiceItem()
    .setTitle('Would you recommend the CKM Navigator app be formally adopted as a permanent resource in the resident continuity clinic?')
    .setChoiceValues([
      'Strongly recommend adoption',
      'Recommend adoption',
      'Neutral',
      'Do not recommend adoption',
      'Strongly oppose adoption'
    ])
    .setRequired(true);

  // Q16: Valuable Features (Optional)
  form.addParagraphTextItem()
    .setTitle('What specific features of the CKM Navigator app did you find most valuable? (Optional)')
    .setRequired(false);

  // Q17: Improvement Suggestions (Optional)
  form.addParagraphTextItem()
    .setTitle('What improvements or additional features would you suggest for the CKM Navigator app? (Optional)')
    .setRequired(false);

  return form;
}

/**
 * Optional: Create a response spreadsheet linked to the form
 * Run this AFTER creating the forms if you want automated data collection
 */
function linkResponseSpreadsheets() {
  var preTestFormId = 'YOUR_PRE_TEST_FORM_ID_HERE';  // Get from form URL
  var postTestFormId = 'YOUR_POST_TEST_FORM_ID_HERE';  // Get from form URL

  var preTestForm = FormApp.openById(preTestFormId);
  var postTestForm = FormApp.openById(postTestFormId);

  // Create destination spreadsheets
  var preTestSpreadsheet = SpreadsheetApp.create('EMPOWER-CKM Pre-Test Responses');
  var postTestSpreadsheet = SpreadsheetApp.create('EMPOWER-CKM Post-Test Responses');

  // Link forms to spreadsheets
  preTestForm.setDestination(FormApp.DestinationType.SPREADSHEET, preTestSpreadsheet.getId());
  postTestForm.setDestination(FormApp.DestinationType.SPREADSHEET, postTestSpreadsheet.getId());

  Logger.log('Response spreadsheets created and linked!');
  Logger.log('Pre-Test Responses: ' + preTestSpreadsheet.getUrl());
  Logger.log('Post-Test Responses: ' + postTestSpreadsheet.getUrl());
}
