# Phase 12: Premium System Refinements

## Changes Summary

### 1. `src/hooks/usePayment.js` — Update ALL projects + sync localStorage

**Remove `activeProjectForPayment` state** — no longer needed since we update all projects.

**In `handleConfirmPremium`**:
- Re-fetch all projects from Firestore
- Update EVERY project's `isPremium: true` using `Promise.all`
- Sync `thesisProjects` in localStorage immediately
- Keep custom event dispatch

New file content:

```javascript
import { useState } from 'react';

const usePayment = (onNotify) => {
  const [showPremiumConfirm, setShowPremiumConfirm] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const handlePremiumClick = async () => {
    let projects;
    try {
      const { getProjects } = await import('../services/firestoreService');
      projects = await getProjects();
    } catch (e) {
      console.error('Error loading projects for premium:', e);
      if (onNotify) onNotify('Failed to check premium status. Please try again.', 'error');
      return;
    }
    if (!projects || projects.length === 0) {
      if (onNotify) onNotify('Create a project first before upgrading to Premium.', 'error');
      return;
    }
    if (projects.some(p => p.isPremium)) {
      if (onNotify) onNotify('You already have Premium access! Humanise and Feedback: up to 4 times per subsection.', 'info');
      return;
    }
    setShowPremiumConfirm(true);
  };

  const handleConfirmPremium = async () => {
    try {
      const { getProjects, updateProject } = await import('../services/firestoreService');
      const projects = await getProjects();
      await Promise.all(projects.map(p => updateProject(p.id, { isPremium: true })));
      try {
        const stored = JSON.parse(localStorage.getItem('thesisProjects') || '[]');
        localStorage.setItem('thesisProjects', JSON.stringify(stored.map(p => ({ ...p, isPremium: true }))));
      } catch (e) { console.warn('Failed to sync localStorage:', e); }
      setIsPremium(true);
      setShowPremiumConfirm(false);
      window.dispatchEvent(new CustomEvent('premiumActivated'));
      if (onNotify) onNotify('Premium activated successfully! Humanise and Feedback: up to 4 times per subsection.', 'success');
      return true;
    } catch (e) {
      console.error('Error updating premium status:', e);
      if (onNotify) onNotify('Failed to activate premium. Please try again.', 'error');
      return false;
    }
  };

  const handleCancelPremium = () => {
    setShowPremiumConfirm(false);
  };

  return {
    showPremiumConfirm, isPremium,
    handlePremiumClick,
    handleConfirmPremium,
    handleCancelPremium,
  };
};

export default usePayment;
```

---

### 2. `src/App.jsx` — Update ConfirmModal to spec benefits format

Change `<ConfirmModal ...>` props:

```diff
- title="Upgrade to Premium"
- message="Activate Premium features? This gives you up to 4 humanise and feedback uses per subsection."
- confirmText="Activate"
+ title="💎 Upgrade to Premium"
+ message="Premium Benefits:\n\n✨ Humanise up to 4 times per subsection\n✏️ Feedback up to 4 times per subsection\n\nThis is a one-time upgrade for your current project."
+ confirmText="Upgrade Now"
```

---

### 3. `src/hooks/useWriteContent.js` (line 10) — Add localStorage fallback

```diff
- const isPremium = project?.isPremium || false;
+ const isPremium = project?.isPremium || (() => {
+   try {
+     const stored = JSON.parse(localStorage.getItem('thesisProjects') || '[]');
+     return stored.some(p => p.id.toString() === project?.id?.toString() && p.isPremium);
+   } catch { return false; }
+ })();
```

---

### 4. `src/utils/writeHelpers.jsx` — Fix key format in availability helpers

**`isHumaniseAvailable`**: Add `activeChapter` param, change key to `${activeChapter}_${sub.id}`

**`isFeedbackAvailable`**: Same fix

```diff
- export const isHumaniseAvailable = (activeSubsections, currentSubsectionIndex, humaniseUsed, humaniseLimit, isViewingReferences) => {
+ export const isHumaniseAvailable = (activeChapter, activeSubsections, currentSubsectionIndex, humaniseUsed, humaniseLimit, isViewingReferences) => {
    if (isViewingReferences) return false;
    const sub = activeSubsections[currentSubsectionIndex];
    if (!sub || !sub.generated) return false;
-   const key = `${activeSubsections[currentSubsectionIndex]?.id || ''}_${sub.id}`;
+   const key = `${activeChapter}_${sub.id}`;
    return (humaniseUsed[key] || 0) < humaniseLimit;
  };

- export const isFeedbackAvailable = (activeSubsections, currentSubsectionIndex, feedbackUsed, feedbackLimit, isViewingReferences) => {
+ export const isFeedbackAvailable = (activeChapter, activeSubsections, currentSubsectionIndex, feedbackUsed, feedbackLimit, isViewingReferences) => {
    if (isViewingReferences) return false;
    const sub = activeSubsections[currentSubsectionIndex];
    if (!sub || !sub.generated) return false;
-   const key = `${activeSubsections[currentSubsectionIndex]?.id || ''}_${sub.id}`;
+   const key = `${activeChapter}_${sub.id}`;
    return (feedbackUsed[key] || 0) < feedbackLimit;
  };
```

---

### 5. Build verification

```bash
npx vite build
```

Expected: 2023 modules transformed, no errors.

---

## Files NOT Changing

- `Header.jsx` — already has correct Upgrade/Premium button states
- `useAppAuth.js` — already has `premiumActivated` event listener
- `ContentButtons.jsx` — already shows "✨ Humanise (X left)" / "✏️ Feedback (X left) 🔒"
- `Write.jsx` — already passes `humaniseLeft`/`feedbackLeft` as props to ContentButtons
- `Settings.jsx` — already uses `useAppAuth.isPremium`
- `ConfirmModal.jsx` — no changes needed (supports multiline via `\n` in message)
