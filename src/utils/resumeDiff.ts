import {
  StructuredResume,
  DiffItem,
  IdentifiedKeyword,
} from '../types/resume';

export interface WordDiffToken {
  text: string;
  type: 'equal' | 'added' | 'removed' | 'keyword';
}

/**
 * Computes a clean word-level diff between original and modified strings,
 * tagging newly introduced JD keywords so they can be highlighted distinctly.
 */
export function computeWordDiff(
  originalText: string,
  newText: string,
  keywords: string[] = []
): { leftTokens: WordDiffToken[]; rightTokens: WordDiffToken[]; addedKeywordsInText: string[] } {
  const origWords = originalText.trim().length ? originalText.trim().split(/\s+/) : [];
  const newWords = newText.trim().length ? newText.trim().split(/\s+/) : [];

  const n = origWords.length;
  const m = newWords.length;

  // LCS matrix
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (origWords[i].toLowerCase() === newWords[j].toLowerCase()) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const leftTokens: WordDiffToken[] = [];
  const rightTokens: WordDiffToken[] = [];

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (origWords[i].toLowerCase() === newWords[j].toLowerCase()) {
      leftTokens.push({ text: origWords[i], type: 'equal' });
      rightTokens.push({ text: newWords[j], type: 'equal' });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      leftTokens.push({ text: origWords[i], type: 'removed' });
      i++;
    } else {
      rightTokens.push({ text: newWords[j], type: 'added' });
      j++;
    }
  }

  while (i < n) {
    leftTokens.push({ text: origWords[i], type: 'removed' });
    i++;
  }
  while (j < m) {
    rightTokens.push({ text: newWords[j], type: 'added' });
    j++;
  }

  // Detect added keywords present in newText that were NOT in originalText
  const origLower = originalText.toLowerCase();
  const newLower = newText.toLowerCase();
  const addedKeywordsInText = keywords.filter((kw) => {
    const clean = kw.trim().toLowerCase();
    return clean.length >= 2 && newLower.includes(clean) && !origLower.includes(clean);
  });

  // Mark tokens on the right that belong to an added keyword
  if (addedKeywordsInText.length > 0) {
    const kwWordSet = new Set<string>();
    for (const kw of addedKeywordsInText) {
      kw.toLowerCase()
        .split(/[\s,/&()]+/)
        .filter((w) => w.length >= 2)
        .forEach((w) => kwWordSet.add(w));
    }

    for (let k = 0; k < rightTokens.length; k++) {
      if (rightTokens[k].type === 'added') {
        const normalizedWord = rightTokens[k].text.toLowerCase().replace(/[^a-z0-9+#.-]/g, '');
        if (kwWordSet.has(normalizedWord)) {
          rightTokens[k] = { ...rightTokens[k], type: 'keyword' };
        }
      }
    }
  }

  return { leftTokens, rightTokens, addedKeywordsInText };
}

/**
 * Builds an exhaustive list of granular DiffItems comparing original and optimized StructuredResume
 * so every single change can be individually accepted or rejected by the user.
 */
export function generateDetailedDiffItems(
  original: StructuredResume,
  optimized: StructuredResume,
  aiDiffs: DiffItem[] = [],
  identifiedKeywords: IdentifiedKeyword[] = []
): DiffItem[] {
  const items: DiffItem[] = [];
  const keywordList = identifiedKeywords.map((k) => k.keyword);

  const findAiReason = (orig: string, opt: string, fallback: string) => {
    const match = aiDiffs.find(
      (d) =>
        (d.originalText && d.originalText.trim() === orig.trim()) ||
        (d.optimizedText && d.optimizedText.trim() === opt.trim())
    );
    return match?.reason || fallback;
  };

  const countAddedKeywords = (orig: string, opt: string) => {
    const oL = orig.toLowerCase();
    const nL = opt.toLowerCase();
    return keywordList.filter((kw) => {
      const k = kw.trim().toLowerCase();
      return k.length >= 2 && nL.includes(k) && !oL.includes(k);
    });
  };

  // 1. Headline
  if ((original.targetRoleHeadline || '').trim() !== (optimized.targetRoleHeadline || '').trim()) {
    const addedKws = countAddedKeywords(original.targetRoleHeadline || '', optimized.targetRoleHeadline || '');
    items.push({
      id: 'diff-headline',
      section: 'headline',
      originalText: original.targetRoleHeadline || '',
      optimizedText: optimized.targetRoleHeadline || '',
      reason: findAiReason(
        original.targetRoleHeadline || '',
        optimized.targetRoleHeadline || '',
        addedKws.length > 0
          ? `Aligns headline with target role and adds: ${addedKws.join(', ')}`
          : 'Refines role headline to match target JD positioning'
      ),
      status: 'pending',
    });
  }

  // 2. Summary
  if ((original.summary || '').trim() !== (optimized.summary || '').trim()) {
    const addedKws = countAddedKeywords(original.summary || '', optimized.summary || '');
    items.push({
      id: 'diff-summary',
      section: 'summary',
      originalText: original.summary || '',
      optimizedText: optimized.summary || '',
      reason: findAiReason(
        original.summary || '',
        optimized.summary || '',
        addedKws.length > 0
          ? `Tailors summary and introduces JD keywords: ${addedKws.join(', ')}`
          : 'Sharpens executive summary to highlight relevant accomplishments'
      ),
      status: 'pending',
    });
  }

  // 3. Experience bullets
  const maxExp = Math.max(original.experience.length, optimized.experience.length);
  for (let eIdx = 0; eIdx < maxExp; eIdx++) {
    const origExp = original.experience[eIdx];
    const optExp = optimized.experience[eIdx];
    if (!origExp && !optExp) continue;

    const origBullets = origExp?.bullets || [];
    const optBullets = optExp?.bullets || [];
    const maxB = Math.max(origBullets.length, optBullets.length);

    for (let bIdx = 0; bIdx < maxB; bIdx++) {
      const ob = (origBullets[bIdx] || '').trim();
      const nb = (optBullets[bIdx] || '').trim();
      if (ob !== nb) {
        const addedKws = countAddedKeywords(ob, nb);
        const roleLabel = optExp?.role || origExp?.role || `Role ${eIdx + 1}`;
        items.push({
          id: `diff-exp-${eIdx}-${bIdx}`,
          section: 'experience',
          entryIndex: eIdx,
          bulletIndex: bIdx,
          originalText: ob,
          optimizedText: nb,
          reason: findAiReason(
            ob,
            nb,
            !ob
              ? `Added bullet for ${roleLabel}`
              : !nb
                ? `Removed bullet from ${roleLabel}`
                : addedKws.length > 0
                  ? `${roleLabel}: integrates ${addedKws.join(', ')}`
                  : `${roleLabel}: strengthens action verbs and JD alignment`
          ),
          status: 'pending',
        });
      }
    }
  }

  // 4. Project bullets
  const maxProj = Math.max(original.projects.length, optimized.projects.length);
  for (let pIdx = 0; pIdx < maxProj; pIdx++) {
    const origProj = original.projects[pIdx];
    const optProj = optimized.projects[pIdx];
    if (!origProj && !optProj) continue;

    const origBullets = origProj?.bullets || [];
    const optBullets = optProj?.bullets || [];
    const maxB = Math.max(origBullets.length, optBullets.length);

    for (let bIdx = 0; bIdx < maxB; bIdx++) {
      const ob = (origBullets[bIdx] || '').trim();
      const nb = (optBullets[bIdx] || '').trim();
      if (ob !== nb) {
        const addedKws = countAddedKeywords(ob, nb);
        const projLabel = optProj?.title || origProj?.title || `Project ${pIdx + 1}`;
        items.push({
          id: `diff-proj-${pIdx}-${bIdx}`,
          section: 'projects',
          entryIndex: pIdx,
          bulletIndex: bIdx,
          originalText: ob,
          optimizedText: nb,
          reason: findAiReason(
            ob,
            nb,
            addedKws.length > 0
              ? `${projLabel}: highlights ${addedKws.join(', ')}`
              : `${projLabel}: clarifies technical deliverables for JD`
          ),
          status: 'pending',
        });
      }
    }
  }

  // 5. Skills categories
  const maxSkills = Math.max(original.skills.length, optimized.skills.length);
  for (let sIdx = 0; sIdx < maxSkills; sIdx++) {
    const origSkill = original.skills[sIdx];
    const optSkill = optimized.skills[sIdx];
    const origStr = (origSkill?.items || []).join(', ');
    const optStr = (optSkill?.items || []).join(', ');
    if (origStr !== optStr) {
      const catName = optSkill?.category || origSkill?.category || `Category ${sIdx + 1}`;
      const origSet = new Set((origSkill?.items || []).map((s) => s.toLowerCase()));
      const addedSkills = (optSkill?.items || []).filter((s) => !origSet.has(s.toLowerCase()));
      items.push({
        id: `diff-skill-${sIdx}`,
        section: 'skills',
        entryIndex: sIdx,
        originalText: origStr,
        optimizedText: optStr,
        reason:
          addedSkills.length > 0
            ? `${catName}: adds/reorders ${addedSkills.slice(0, 4).join(', ')}`
            : `${catName}: reorders skills to prioritize JD requirements`,
        status: 'pending',
      });
    }
  }

  return items;
}

/**
 * Applies or reverts an individual DiffItem onto StructuredResume,
 * ensuring the user has exact per-suggestion control over the final document.
 */
export function applyDiffToStructuredResume(
  currentData: StructuredResume,
  originalData: StructuredResume,
  diff: DiffItem,
  action: 'accepted' | 'rejected'
): StructuredResume {
  const targetValue = action === 'accepted' ? diff.optimizedText : diff.originalText;
  const next: StructuredResume = {
    ...currentData,
    experience: currentData.experience.map((e) => ({ ...e, bullets: [...e.bullets] })),
    projects: currentData.projects.map((p) => ({ ...p, bullets: [...p.bullets] })),
    skills: currentData.skills.map((s) => ({ ...s, items: [...s.items] })),
  };

  if (diff.section === 'headline') {
    next.targetRoleHeadline = targetValue || originalData.targetRoleHeadline;
    return next;
  }

  if (diff.section === 'summary') {
    next.summary = targetValue || originalData.summary;
    return next;
  }

  if (diff.section === 'experience') {
    const exp =
      typeof diff.entryIndex === 'number'
        ? next.experience[diff.entryIndex]
        : undefined;
    if (exp) {
      const orig = diff.originalText.trim();
      const opt = diff.optimizedText.trim();
      const searchText = action === 'accepted' ? orig : opt;

      if (!orig && opt) {
        // AI-added bullet
        if (action === 'accepted') {
          if (!exp.bullets.some((b) => b.trim() === opt)) {
            const insertAt =
              typeof diff.bulletIndex === 'number'
                ? Math.min(diff.bulletIndex, exp.bullets.length)
                : exp.bullets.length;
            exp.bullets.splice(insertAt, 0, diff.optimizedText);
          }
        } else {
          const idx = exp.bullets.findIndex((b) => b.trim() === opt);
          if (idx !== -1) exp.bullets.splice(idx, 1);
        }
      } else if (orig && !opt) {
        // AI-deleted bullet
        if (action === 'accepted') {
          const idx = exp.bullets.findIndex((b) => b.trim() === orig);
          if (idx !== -1) exp.bullets.splice(idx, 1);
        } else {
          if (!exp.bullets.some((b) => b.trim() === orig)) {
            const insertAt =
              typeof diff.bulletIndex === 'number'
                ? Math.min(diff.bulletIndex, exp.bullets.length)
                : exp.bullets.length;
            exp.bullets.splice(insertAt, 0, diff.originalText);
          }
        }
      } else {
        // Modified bullet
        const byText = exp.bullets.findIndex(
          (b) => b.trim() === searchText || b.trim() === targetValue.trim()
        );
        if (byText !== -1) {
          exp.bullets[byText] = targetValue;
        } else if (
          typeof diff.bulletIndex === 'number' &&
          diff.bulletIndex < exp.bullets.length
        ) {
          exp.bullets[diff.bulletIndex] = targetValue;
        } else if (targetValue) {
          exp.bullets.push(targetValue);
        }
      }
    } else {
      const searchFrom = action === 'accepted' ? diff.originalText : diff.optimizedText;
      for (const e of next.experience) {
        const idx = e.bullets.findIndex((b) => b.trim() === searchFrom.trim());
        if (idx !== -1) {
          if (targetValue) {
            e.bullets[idx] = targetValue;
          } else {
            e.bullets.splice(idx, 1);
          }
          break;
        }
      }
    }
    return next;
  }

  if (diff.section === 'projects') {
    const proj =
      typeof diff.entryIndex === 'number'
        ? next.projects[diff.entryIndex]
        : undefined;
    if (proj) {
      const orig = diff.originalText.trim();
      const opt = diff.optimizedText.trim();
      const searchText = action === 'accepted' ? orig : opt;

      if (!orig && opt) {
        if (action === 'accepted') {
          if (!proj.bullets.some((b) => b.trim() === opt)) {
            const insertAt =
              typeof diff.bulletIndex === 'number'
                ? Math.min(diff.bulletIndex, proj.bullets.length)
                : proj.bullets.length;
            proj.bullets.splice(insertAt, 0, diff.optimizedText);
          }
        } else {
          const idx = proj.bullets.findIndex((b) => b.trim() === opt);
          if (idx !== -1) proj.bullets.splice(idx, 1);
        }
      } else if (orig && !opt) {
        if (action === 'accepted') {
          const idx = proj.bullets.findIndex((b) => b.trim() === orig);
          if (idx !== -1) proj.bullets.splice(idx, 1);
        } else {
          if (!proj.bullets.some((b) => b.trim() === orig)) {
            const insertAt =
              typeof diff.bulletIndex === 'number'
                ? Math.min(diff.bulletIndex, proj.bullets.length)
                : proj.bullets.length;
            proj.bullets.splice(insertAt, 0, diff.originalText);
          }
        }
      } else {
        const byText = proj.bullets.findIndex(
          (b) => b.trim() === searchText || b.trim() === targetValue.trim()
        );
        if (byText !== -1) {
          proj.bullets[byText] = targetValue;
        } else if (
          typeof diff.bulletIndex === 'number' &&
          diff.bulletIndex < proj.bullets.length
        ) {
          proj.bullets[diff.bulletIndex] = targetValue;
        } else if (targetValue) {
          proj.bullets.push(targetValue);
        }
      }
    } else {
      const searchFrom = action === 'accepted' ? diff.originalText : diff.optimizedText;
      for (const p of next.projects) {
        const idx = p.bullets.findIndex((b) => b.trim() === searchFrom.trim());
        if (idx !== -1) {
          if (targetValue) {
            p.bullets[idx] = targetValue;
          } else {
            p.bullets.splice(idx, 1);
          }
          break;
        }
      }
    }
    return next;
  }

  if (diff.section === 'skills') {
    if (typeof diff.entryIndex === 'number') {
      const parsedItems = targetValue
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (next.skills[diff.entryIndex]) {
        next.skills[diff.entryIndex].items = parsedItems;
      } else if (parsedItems.length > 0) {
        next.skills.push({
          id: `skill-${Date.now()}-${diff.entryIndex}`,
          category: 'Additional Target Skills',
          items: parsedItems,
        });
      }
    }
    return next;
  }

  return next;
}

/**
 * Applies all pending/all diffs or reverts all to originalData.
 */
export function applyAllDiffsToResume(
  currentData: StructuredResume,
  originalData: StructuredResume,
  diffs: DiffItem[],
  action: 'accepted' | 'rejected'
): { nextData: StructuredResume; nextDiffs: DiffItem[] } {
  if (action === 'rejected') {
    return {
      nextData: {
        ...originalData,
        experience: originalData.experience.map((e) => ({ ...e, bullets: [...e.bullets] })),
        projects: originalData.projects.map((p) => ({ ...p, bullets: [...p.bullets] })),
        skills: originalData.skills.map((s) => ({ ...s, items: [...s.items] })),
      },
      nextDiffs: diffs.map((d) => ({ ...d, status: 'rejected' })),
    };
  }

  let working = {
    ...currentData,
    experience: currentData.experience.map((e) => ({ ...e, bullets: [...e.bullets] })),
    projects: currentData.projects.map((p) => ({ ...p, bullets: [...p.bullets] })),
    skills: currentData.skills.map((s) => ({ ...s, items: [...s.items] })),
  };
  for (const diff of diffs) {
    working = applyDiffToStructuredResume(working, originalData, diff, 'accepted');
  }
  return {
    nextData: working,
    nextDiffs: diffs.map((d) => ({ ...d, status: 'accepted' })),
  };
}
