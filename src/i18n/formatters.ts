import type { TFunction } from './types';
import type { CareLevel, CompatibilityLevel, FishStatus, ReminderType, VerificationStatus, WaterType } from '@/types';
import { speciesTextZh } from './speciesText.zh';

export function getStatusLabel(status: FishStatus, t: TFunction): string {
  return t(`fish.status.${status}`);
}

export function getWaterTypeLabel(waterType: WaterType, t: TFunction): string {
  return t(`fish.waterType.${waterType}`);
}

export function getCareLevelLabel(careLevel: CareLevel | string, t: TFunction): string {
  return t(`fish.careLevel.${careLevel}`);
}

export function getVerificationLabel(status: VerificationStatus | string, t: TFunction): string {
  const keyMap: Record<string, string> = {
    verified: 'fish.verification.verified',
    partially_verified: 'fish.verification.partiallyVerified',
    needs_review: 'fish.verification.needsReview',
    draft: 'fish.verification.draft',
  };
  return t(keyMap[status] ?? status);
}

export function getCompatibilityLevelLabel(level: CompatibilityLevel, t: TFunction): string {
  if (level === 'unknown') return t('compat.caution');
  return t(`compat.${level}`);
}

export function getDurationText(days: number, t: TFunction): string {
  if (days < 30) {
    return days === 1 ? t('common.dayOne') : t('common.dayOther', { n: days });
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return months === 1 ? t('common.monthOne') : t('common.monthOther', { n: months });
  }

  const years = Math.floor(months / 12);
  return years === 1 ? t('common.yearOne') : t('common.yearOther', { n: years });
}

export function getReminderTypeTitle(type: ReminderType | string, t: TFunction, fallbackTitle?: string): string {
  const keyMap: Record<string, string> = {
    feeding: 'reminders.feeding',
    health_check: 'reminders.healthCheck',
    photo_update: 'reminders.photoUpdate',
  };
  const key = keyMap[type];
  if (key) return t(key);
  return fallbackTitle ?? type.replaceAll('_', ' ');
}

export function getTemperamentLabel(temperament: string | null | undefined, t: TFunction): string | null {
  if (!temperament || temperament === 'unknown') return null;
  const keyMap: Record<string, string> = {
    peaceful: 'species.temperament.peaceful',
    semi_aggressive: 'species.temperament.semi_aggressive',
    aggressive: 'species.temperament.aggressive',
  };
  const key = keyMap[temperament];
  return key ? t(key) : temperament;
}

export function getDietLabel(diet: string | null | undefined, t: TFunction): string | null {
  if (!diet || diet === 'unknown') return null;
  const keyMap: Record<string, string> = {
    omnivore: 'species.diet.omnivore',
    carnivore: 'species.diet.carnivore',
    herbivore: 'species.diet.herbivore',
  };
  const key = keyMap[diet];
  return key ? t(key) : diet;
}

export function getConfidenceLevelLabel(confidence: string | null | undefined, t: TFunction): string | null {
  if (!confidence || confidence === 'unknown') return null;
  const keyMap: Record<string, string> = {
    high: 'species.confidence.high',
    medium: 'species.confidence.medium',
    low: 'species.confidence.low',
  };
  const key = keyMap[confidence];
  return key ? t(key) : confidence;
}

export function getEntryTypeLabel(entryType: string | null | undefined, t: TFunction): string | null {
  if (!entryType || entryType === 'species') return null;
  const keyMap: Record<string, string> = {
    strain: 'species.entryType.strain',
    variety: 'species.entryType.variety',
    morph: 'species.entryType.morph',
    hybrid: 'species.entryType.hybrid',
  };
  const key = keyMap[entryType];
  return key ? t(key) : entryType.charAt(0).toUpperCase() + entryType.slice(1);
}

export function formatReminderDueText(nextDueAt: string, t: TFunction, language: string): string {
  const now = new Date();
  const due = new Date(nextDueAt);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  if (due < now) return t('dashboard.overdue');
  if (due <= todayEnd) return t('dashboard.dueToday');

  const locale = language === 'zh' ? 'zh-CN' : 'en-GB';
  const dateStr = due.toLocaleDateString(locale);
  return t('dashboard.dueOn', { date: dateStr });
}

export function formatCompatibilityReason(reason: string, t: TFunction): string {
  if (!reason) return reason;

  // "{name} has no linked species data. Please verify compatibility manually."
  const noDataMatch = reason.match(/^(.+) has no linked species data\. Please verify compatibility manually\.$/);
  if (noDataMatch) {
    return t('compat.noLinkedSpeciesData', { fishName: noDataMatch[1] });
  }

  // Exact service strings from compatibilityService.ts
  if (reason === 'Available species data shows no major compatibility warning for this pair.') {
    return t('compat.safeSummary');
  }
  if (
    reason === 'Compatibility guidance is based on available species data and simple rules. Always verify with trusted aquarium sources.' ||
    reason.startsWith('No active fish to compare with yet.') ||
    reason.startsWith('Species data unavailable.')
  ) {
    return t('compat.limitationNote');
  }
  if (reason === 'Unknown species') {
    return t('compat.unknownSpecies');
  }
  if (reason === 'New species data could not be loaded. Please verify compatibility manually.') {
    return t('compat.verifyManually');
  }
  if (
    reason === 'Please verify compatibility manually.' ||
    reason.includes('verify compatibility manually')
  ) {
    return t('compat.verifyManually');
  }
  if (
    reason.includes('possible compatibility concerns') ||
    reason === 'Found possible compatibility concerns or incomplete data.'
  ) {
    return t('compat.possibleConcerns');
  }
  if (reason === 'Size and temperament mismatch: aggressive larger fish may prey on a small peaceful fish.') {
    return t('compat.sizeTemperamentMismatch');
  }
  if (reason === 'Limited temperature range overlap.') {
    return t('compat.limitedTempOverlap');
  }
  if (reason === 'Limited pH range overlap.') {
    return t('compat.limitedPhOverlap');
  }
  if (reason === 'Semi-aggressive species with peaceful fish. Monitor carefully.') {
    return t('compat.semiAggressiveWarning');
  }
  if (reason === 'Large adult size difference. This may cause stress even without a clear predator flag.') {
    return t('compat.largeSizeDifference');
  }
  if (reason === 'Species data is incomplete or not fully verified. Treat result as cautious.') {
    return t('compat.incompleteData');
  }
  if (reason === 'Schooling fish may need same-species companions already in the collection.') {
    return t('compat.schoolingNeedsCompanions');
  }

  // Dynamic: "Water type mismatch: X vs Y."
  const waterMismatchMatch = reason.match(/^Water type mismatch: (.+) vs (.+)\.$/);
  if (waterMismatchMatch) {
    return t('compat.waterTypeMismatch', { a: waterMismatchMatch[1], b: waterMismatchMatch[2] });
  }

  // Dynamic: "No temperature range overlap: X-YC vs A-BC."
  const noTempMatch = reason.match(/^No temperature range overlap: (.+) vs (.+)\.$/);
  if (noTempMatch) {
    return t('compat.noTempOverlap', { a: noTempMatch[1], b: noTempMatch[2] });
  }

  // Dynamic: "No pH range overlap: X-Y vs A-B."
  const noPhMatch = reason.match(/^No pH range overlap: (.+) vs (.+)\.$/);
  if (noPhMatch) {
    return t('compat.noPhOverlap', { a: noPhMatch[1], b: noPhMatch[2] });
  }

  return reason;
}

export function getTankLevelLabel(tankLevel: string | null | undefined, t: TFunction): string | null {
  if (!tankLevel) return null;
  const keyMap: Record<string, string> = {
    'Top': 'species.tankLevel.top',
    'top': 'species.tankLevel.top',
    'Middle': 'species.tankLevel.middle',
    'middle': 'species.tankLevel.middle',
    'Bottom': 'species.tankLevel.bottom',
    'bottom': 'species.tankLevel.bottom',
    'Middle to top': 'species.tankLevel.middleToTop',
    'middle to top': 'species.tankLevel.middleToTop',
    'Middle to bottom': 'species.tankLevel.middleToBottom',
    'middle to bottom': 'species.tankLevel.middleToBottom',
    'All levels': 'species.tankLevel.allLevels',
    'all levels': 'species.tankLevel.allLevels',
  };
  const key = keyMap[tankLevel];
  return key ? t(key) : tankLevel;
}

export function localizeSpeciesText(
  value: string | null | undefined,
  t: TFunction,
  language?: string,
): string | null {
  if (!value) return null;
  const lang = language ?? (t('settings.title') === '设置' ? 'zh' : 'en');
  if (lang === 'zh') {
    const zh = speciesTextZh[value];
    if (zh) return zh;
  }
  return value;
}
