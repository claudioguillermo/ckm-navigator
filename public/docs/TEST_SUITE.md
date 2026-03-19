# EMPOWER-CKM Navigator - Testing Suite

## 🎯 Overview

This document provides comprehensive testing procedures for all bug fixes and security improvements.

---

## ✅ PRE-FLIGHT CHECKLIST

Before starting tests, ensure:
- [ ] Backend server running (`node server.js`)
- [ ] Frontend server running (`npx serve -l 5173`)
- [ ] `.env` file configured with API key
- [ ] Browser DevTools console open (F12)
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

## 🔒 SECURITY TESTS

### TEST-SEC-01: API Key Not Exposed
**Priority:** CRITICAL
**Status:** ✅ Should Pass

**Steps:**
1. Open DevTools → Network tab
2. Click "AI Assistant"
3. Type: "What is CKM health?"
4. Click Send
5. Find the request to `/api/chat` or `anthropic.com`

**Expected:**
- ✅ Request goes to `localhost:3001/api/chat` (not directly to Anthropic)
- ✅ No `x-api-key` header visible in browser
- ✅ `credentials: include` present (session cookie)

**If Failed:**
- Check `js/chatbot.js` - should use `backendUrl`
- Check backend is running
- Check CORS settings

---

### TEST-SEC-02: XSS Prevention
**Priority:** CRITICAL
**Status:** ✅ Should Pass

**Steps:**
1. Open chat
2. Type: `<img src=x onerror=alert('XSS')>`
3. Send message

**Expected:**
- ✅ No alert popup
- ✅ Message appears as plain text (sanitized)
- ✅ No script execution

**Additional Tests:**
```
<script>alert('xss')</script>
<svg onload=alert('xss')>
<iframe src="javascript:alert('xss')">
<body onload=alert('xss')>
```

**If Failed:**
- Check DOMPurify is loaded
- Check `DOMUtils.safeSetHTML()` is being used
- Check Content Security Policy headers

---

### TEST-SEC-03: Data Integrity
**Priority:** CRITICAL
**Status:** ✅ Should Pass

**Steps:**
1. Complete a module
2. Open DevTools → Application → LocalStorage
3. Find `ckm_progress` key
4. Manually edit the value (add extra module ID)
5. Refresh page
6. Check progress display

**Expected:**
- ✅ Tampered data rejected
- ✅ Console shows "Data integrity check failed"
- ✅ Progress reset to safe state
- ✅ No crash or errors

**If Failed:**
- Check `SecureStorage` is initialized
- Check HMAC verification is working
- Check error handling

---

### TEST-SEC-04: Rate Limiting
**Priority:** HIGH
**Status:** ✅ Should Pass

**Steps:**
1. Open chat
2. Send 10 messages rapidly (use browser console):
   ```javascript
   for(let i=0; i<11; i++) {
     fetch('http://localhost:3001/api/chat', {
       method: 'POST',
       credentials: 'include',
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({query: 'test', context: ''})
     }).then(r => console.log(i, r.status));
   }
   ```

**Expected:**
- ✅ First 10 requests succeed (status 200)
- ✅ 11th request fails (status 429 "Too Many Requests")
- ✅ Error message: "Too many requests"

**If Failed:**
- Check rate limiter in `server.js`
- Check session is maintained
- Verify `credentials: include`

---

### TEST-SEC-05: Session Management
**Priority:** HIGH
**Status:** ✅ Should Pass

**Steps:**
1. Open chat and send a message (creates session)
2. Open DevTools → Application → Cookies
3. Find session cookie
4. Note the cookie value
5. Delete the cookie
6. Try sending another chat message

**Expected:**
- ✅ Session cookie created on first use
- ✅ Cookie has `HttpOnly` flag
- ✅ After deletion, new request creates new session
- ✅ Request without session gets 401 error (in dev) or new session

**If Failed:**
- Check `express-session` configuration
- Check cookie settings in `server.js`
- Check `credentials: include` in fetch calls

---

## 🐛 BUG FIX TESTS

### TEST-BUG-01: Search Engine - Division by Zero
**Priority:** HIGH
**Status:** ✅ Should Pass

**Steps:**
1. Use search functionality (if exposed in UI)
2. Or test directly in console:
   ```javascript
   const engine = new HybridSearchEngine([{content: "test", metadata: {}}]);
   engine.semanticSearch("", 5); // Empty query
   ```

**Expected:**
- ✅ No `NaN` or `Infinity` in results
- ✅ Returns empty array or zero scores
- ✅ No console errors

**If Failed:**
- Check `js/search-engine.js` lines 97-102
- Verify zero check before division

---

### TEST-BUG-02: Language Loading Race Condition
**Priority:** HIGH
**Status:** ✅ Should Pass

**Steps:**
1. Click language buttons rapidly:
   - Click EN
   - Immediately click PT
   - Immediately click ES
   - Immediately click EN
   (Do this as fast as possible)

2. Wait for loading to complete
3. Check the UI language

**Expected:**
- ✅ Final language matches last clicked button
- ✅ No mixed language content
- ✅ Console may show "Language request cancelled"
- ✅ No errors

**If Failed:**
- Check `activeLanguageRequest` in main.js
- Verify Symbol() tracking is implemented
- Check loadLanguage method

---

### TEST-BUG-03: localStorage Crash on Corruption
**Priority:** HIGH
**Status:** ✅ Should Pass

**Steps:**
1. Open DevTools → Console
2. Run: `localStorage.setItem('ckm_progress', '[1,2,')`
3. Refresh page

**Expected:**
- ✅ App loads without crashing
- ✅ Console shows parse error
- ✅ Corrupted data cleaned up
- ✅ Progress reset to empty

**If Failed:**
- Check `SecureStorage.getItem()` error handling
- Verify try-catch blocks
- Check fallback values

---

### TEST-BUG-04: fetch() Error Handling
**Priority:** HIGH
**Status:** ✅ Should Pass

**Steps:**
1. Stop backend server
2. Try to use chat

**Expected:**
- ✅ Graceful fallback message shown
- ✅ "AI connection being configured" message
- ✅ No crash or blank screen
- ✅ User can still navigate app

**Steps 2:**
1. Delete `locales/pt.json` temporarily
2. Switch to Portuguese

**Expected:**
- ✅ Error message shown to user
- ✅ Falls back to English
- ✅ No crash

**If Failed:**
- Check `chatbot.js` generateResponse error handling
- Check loadLanguage try-catch
- Verify user notifications

---

## ✨ FEATURE TESTS

### TEST-FEAT-01: Navigation
**Priority:** HIGH
**Status:** Should Pass

**Steps:**
Test all navigation:
1. Click "Home" → Dashboard loads
2. Click "Curriculum" → Module list loads
3. Click "Clinic" → Clinic info loads
4. Click "AI Assistant" → Chat opens
5. Close chat → Chat disappears
6. Use browser back button
7. Use any "Back" buttons in app

**Expected:**
- ✅ All pages load correctly
- ✅ No console errors
- ✅ Smooth transitions
- ✅ Back button works
- ✅ URLs update (if using router)

---

### TEST-FEAT-02: Module Completion
**Priority:** HIGH
**Status:** Should Pass

**Steps:**
1. Click "Curriculum"
2. Click first module
3. Scroll to bottom
4. Click "Finish Lesson"
5. Return to curriculum
6. Check progress

**Expected:**
- ✅ Module marked complete
- ✅ Checkmark shows
- ✅ Progress saved (refresh page to verify)
- ✅ Next module unlocked/highlighted

---

### TEST-FEAT-03: Language Switching
**Priority:** HIGH
**Status:** Should Pass

**Steps:**
1. Click 🇧🇷 PT button
2. Verify UI changes to Portuguese
3. Click 🇪🇸 ES button
4. Verify UI changes to Spanish
5. Click 🇺🇸 EN button
6. Refresh page
7. Verify language persists

**Expected:**
- ✅ All text translates
- ✅ No missing translations (check console)
- ✅ Language persists after refresh
- ✅ Active state shows correct flag

---

### TEST-FEAT-04: Staging Quiz
**Priority:** MEDIUM
**Status:** Should Pass

**Steps:**
1. Complete all modules (or enough to unlock quiz)
2. Take the staging quiz
3. Answer all questions
4. Review results
5. Check personalized plan

**Expected:**
- ✅ Quiz loads correctly
- ✅ Can select answers
- ✅ Results calculated correctly
- ✅ Plan shows appropriate recommendations
- ✅ Results saved (check localStorage)

---

### TEST-FEAT-05: Chat Functionality
**Priority:** HIGH
**Status:** Requires Backend

**Prerequisites:**
- Backend running
- API key configured

**Steps:**
1. Click "AI Assistant"
2. Type: "What is CKM health?"
3. Press Enter or click Send
4. Wait for response

**Expected:**
- ✅ Loading indicator shows
- ✅ Response appears in chat
- ✅ Medical disclaimer included
- ✅ Can send follow-up questions

**Test Error Cases:**
1. Stop backend → Should show fallback message
2. Invalid API key → Should show error (check logs)
3. Network error → Should show retry option

---

## 📱 RESPONSIVE TESTS

### TEST-RESP-01: Mobile Portrait
**Screen:** 375x667 (iPhone SE)

**Steps:**
1. Open DevTools → Toggle device toolbar
2. Select iPhone SE
3. Test all features

**Check:**
- [ ] Navigation menu accessible
- [ ] Text readable (not too small)
- [ ] Buttons tappable (44x44px minimum)
- [ ] No horizontal scroll
- [ ] Chat sidebar works
- [ ] Quiz fits screen
- [ ] Language switcher works

---

### TEST-RESP-02: Tablet
**Screen:** 768x1024 (iPad)

**Steps:**
1. Set viewport to 768x1024
2. Test both portrait and landscape

**Check:**
- [ ] Layout adapts appropriately
- [ ] Two-column layouts work
- [ ] Touch targets adequate
- [ ] Sidebar doesn't cover content

---

### TEST-RESP-03: Desktop
**Screen:** 1920x1080

**Steps:**
1. Test at full desktop size

**Check:**
- [ ] Content doesn't stretch too wide
- [ ] Max-width maintained
- [ ] Sidebars position correctly
- [ ] Modal centered

---

## ♿ ACCESSIBILITY TESTS

### TEST-A11Y-01: Keyboard Navigation
**Priority:** CRITICAL

**Steps:**
1. Start at top of page
2. Press Tab repeatedly
3. Navigate entire site using only keyboard:
   - Tab = next element
   - Shift+Tab = previous element
   - Enter/Space = activate button
   - Escape = close modal

**Expected:**
- ✅ All interactive elements focusable
- ✅ Focus visible (outline/highlight)
- ✅ Logical tab order
- ✅ Can complete all tasks
- ✅ No keyboard traps

---

### TEST-A11Y-02: Screen Reader
**Tools:** NVDA (Windows), JAWS (Windows), VoiceOver (Mac)

**Steps:**
1. Enable screen reader
2. Navigate through app
3. Check all interactive elements announced
4. Test forms and buttons
5. Test modals and dynamic content

**Expected:**
- ✅ All text readable
- ✅ Images have alt text
- ✅ Buttons have labels
- ✅ Form inputs labeled
- ✅ Headings in correct hierarchy
- ✅ Live regions announce updates

---

### TEST-A11Y-03: Color Contrast
**Tools:** WAVE, axe DevTools, or manual check

**Steps:**
1. Install WAVE or axe DevTools extension
2. Run audit on each page
3. Check all text vs background

**Expected:**
- ✅ WCAG AA minimum (4.5:1 for normal text)
- ✅ WCAG AA for large text (3:1)
- ✅ No contrast errors

---

### TEST-A11Y-04: Zoom Test
**Priority:** HIGH

**Steps:**
1. Zoom browser to 200% (`Ctrl +` or `Cmd +`)
2. Navigate entire app
3. Test all features

**Expected:**
- ✅ No horizontal scroll
- ✅ All content accessible
- ✅ No overlapping text
- ✅ Buttons still clickable

---

## ⚡ PERFORMANCE TESTS

### TEST-PERF-01: Page Load
**Tool:** Lighthouse (DevTools)

**Steps:**
1. Open DevTools → Lighthouse tab
2. Select "Performance" + "Accessibility"
3. Run audit

**Expected:**
- ✅ Performance: >80
- ✅ Accessibility: >90
- ✅ Best Practices: >90
- ✅ First Contentful Paint: <2s
- ✅ Time to Interactive: <4s

---

### TEST-PERF-02: Memory Leaks
**Tool:** DevTools Performance Monitor

**Steps:**
1. DevTools → More tools → Performance monitor
2. Navigate app extensively:
   - Switch pages 20+ times
   - Open/close chat 10+ times
   - Switch languages 10+ times
3. Watch JS Heap Size

**Expected:**
- ✅ Heap size stabilizes (not continuously growing)
- ✅ DOM nodes don't accumulate
- ✅ Event listeners cleaned up

**If Failed:**
- Check setTimeout cleanup
- Check event listener removal
- Check for circular references

---

## 🌐 BROWSER COMPATIBILITY

### TEST-COMPAT: Cross-Browser
**Priority:** HIGH

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**For Each Browser:**
1. Complete basic navigation test
2. Test chat functionality
3. Test language switching
4. Check for console errors
5. Verify styling looks correct

---

## 📊 TEST RESULTS TEMPLATE

```
Date: _______________
Tester: _____________
Environment: _________

SECURITY TESTS:
[ ] TEST-SEC-01: API Key Not Exposed
[ ] TEST-SEC-02: XSS Prevention
[ ] TEST-SEC-03: Data Integrity
[ ] TEST-SEC-04: Rate Limiting
[ ] TEST-SEC-05: Session Management

BUG FIX TESTS:
[ ] TEST-BUG-01: Search Engine
[ ] TEST-BUG-02: Language Race
[ ] TEST-BUG-03: localStorage Corruption
[ ] TEST-BUG-04: fetch() Errors

FEATURE TESTS:
[ ] TEST-FEAT-01: Navigation
[ ] TEST-FEAT-02: Module Completion
[ ] TEST-FEAT-03: Language Switching
[ ] TEST-FEAT-04: Staging Quiz
[ ] TEST-FEAT-05: Chat Functionality

RESPONSIVE TESTS:
[ ] TEST-RESP-01: Mobile
[ ] TEST-RESP-02: Tablet
[ ] TEST-RESP-03: Desktop

ACCESSIBILITY TESTS:
[ ] TEST-A11Y-01: Keyboard
[ ] TEST-A11Y-02: Screen Reader
[ ] TEST-A11Y-03: Color Contrast
[ ] TEST-A11Y-04: Zoom

PERFORMANCE TESTS:
[ ] TEST-PERF-01: Page Load (Lighthouse Score: ___)
[ ] TEST-PERF-02: Memory Leaks

BROWSER TESTS:
[ ] Chrome
[ ] Firefox
[ ] Safari
[ ] Edge
[ ] Mobile

CRITICAL ISSUES FOUND:
_____________________

BLOCKERS:
_____________________

READY FOR PRODUCTION: [ ] YES [ ] NO
```

---

## 🚨 CRITICAL FAILURE RESPONSES

If ANY security test fails:
1. **DO NOT DEPLOY**
2. Review fix implementation
3. Check related code
4. Retest thoroughly
5. Document the issue

If multiple features fail:
1. Restore from backup
2. Review changes carefully
3. Apply fixes incrementally
4. Test after each fix

---

## ✅ SIGN-OFF CRITERIA

Application is ready for production when:

- [ ] All CRITICAL security tests pass
- [ ] All HIGH priority tests pass
- [ ] 90%+ of MEDIUM tests pass
- [ ] No console errors on main flows
- [ ] Lighthouse performance >80
- [ ] Lighthouse accessibility >90
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Works on mobile devices
- [ ] Keyboard navigation functional
- [ ] Screen reader compatible

---

**Testing Completed By:** _______________
**Date:** _______________
**Sign-off:** _______________
