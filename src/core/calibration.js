import { createCalibratedProfile } from './tiles.js';

export const CALIBRATION_SESSION_SCHEMA_V2 = 'https://magnamath.app/schema/calibration-session/v2';
export const CALIBRATION_SESSION_COLLECTION_SCHEMA_V1 = 'https://magnamath.app/schema/calibration-session-collection/v1';

const T_CRITICAL_95 = {
  1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306,
  9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
  16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086, 24: 2.064, 29: 2.045,
};

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function tCritical95(sampleCount) {
  const degreesOfFreedom = Math.max(1, sampleCount - 1);
  if (T_CRITICAL_95[degreesOfFreedom]) return T_CRITICAL_95[degreesOfFreedom];
  if (degreesOfFreedom < 24) return T_CRITICAL_95[20];
  if (degreesOfFreedom < 29) return T_CRITICAL_95[24];
  if (degreesOfFreedom < 60) return T_CRITICAL_95[29];
  return 1.96;
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'session';
}

function generatedId(baseProfile, measuredAt) {
  const compactTime = measuredAt.replace(/[-:.TZ]/g, '').slice(0, 14);
  return `cal-${slug(baseProfile.id)}-${compactTime}`;
}

export function deriveCalibrationUncertainty(profile, instrumentResolutionMm = null) {
  const stats = profile.calibration?.dimensionStats ?? [];
  const sampleCount = profile.calibration?.sampleCount ?? 0;
  const resolution = finiteOrNull(instrumentResolutionMm);
  const critical = tCritical95(sampleCount);
  return stats.map((stat) => {
    const standardErrorMm = sampleCount > 0 ? stat.standardDeviationMm / Math.sqrt(sampleCount) : null;
    const repeatabilityCi95HalfWidthMm = standardErrorMm == null ? null : critical * standardErrorMm;
    const quantizationStandardMm = resolution != null && resolution >= 0 ? resolution / Math.sqrt(12) : 0;
    const combinedStandardMm = standardErrorMm == null
      ? null
      : Math.sqrt(standardErrorMm ** 2 + quantizationStandardMm ** 2);
    return {
      edgeIndex: stat.edgeIndex,
      meanMm: stat.meanMm,
      standardDeviationMm: stat.standardDeviationMm,
      standardErrorMm,
      repeatabilityCi95HalfWidthMm,
      estimatedExpandedUncertaintyMm: combinedStandardMm == null ? null : 2 * combinedStandardMm,
      instrumentResolutionMm: resolution,
      caveat: 'Statistical repeatability plus instrument quantization only; systematic bias, temperature, alignment, and operator effects are excluded.',
    };
  });
}

/** Creates a raw, portable session and its derived profile override together. */
export function createCalibrationSession(baseProfile, input = {}) {
  if (!baseProfile?.id) throw new Error('A base tile profile is required for calibration.');
  const measuredAt = input.measuredAt ?? new Date().toISOString();
  const sessionId = input.id?.trim() || generatedId(baseProfile, measuredAt);
  const profile = createCalibratedProfile(baseProfile, {
    ...input,
    measuredAt,
  });
  const instrumentResolutionMm = finiteOrNull(input.instrumentResolutionMm);
  const uncertainty = deriveCalibrationUncertainty(profile, instrumentResolutionMm);
  profile.calibration = {
    ...profile.calibration,
    sessionId,
    uncertainty,
    instrumentResolutionMm,
  };
  profile.source = {
    ...profile.source,
    sessionId,
    setOrBatch: input.setOrBatch?.trim() || '',
  };

  const session = {
    schema: CALIBRATION_SESSION_SCHEMA_V2,
    schemaVersion: 2,
    id: sessionId,
    baseProfileId: baseProfile.id,
    outputProfileId: profile.id,
    title: input.title?.trim() || `Calibration of ${baseProfile.label}`,
    label: input.label?.trim() || baseProfile.label,
    measuredAt,
    method: input.method ?? 'manual',
    device: input.device?.trim() || 'manual measuring tool',
    instrumentResolutionMm,
    setOrBatch: input.setOrBatch?.trim() || '',
    environment: {
      temperatureC: finiteOrNull(input.temperatureC),
      humidityPercent: finiteOrNull(input.humidityPercent),
    },
    anglesDegrees: input.anglesDegrees ?? null,
    samples: profile.calibration.samples,
    hingeRangeDegrees: profile.hingeRangeDegrees,
    notes: input.notes?.trim() || '',
    derived: {
      confidence: profile.confidence,
      scaleConfidence: profile.scaleConfidence,
      dimensionsMm: profile.dimensionsMm,
      dimensionStats: profile.calibration.dimensionStats,
      relativeRepeatability: profile.calibration.relativeRepeatability,
      uncertainty,
    },
  };
  return { session, profile };
}

function validateSession(record, index) {
  if (record?.schema !== CALIBRATION_SESSION_SCHEMA_V2 || record.schemaVersion !== 2) {
    throw new Error(`Calibration session ${index + 1} is not a MagnaMath calibration-session v2 record.`);
  }
  if (!record.id || !record.baseProfileId || !Array.isArray(record.samples) || !record.samples.length) {
    throw new Error(`Calibration session ${index + 1} is missing identity or samples.`);
  }
  record.samples.forEach((sample, sampleIndex) => {
    if (!Array.isArray(sample.edgeLengthsMm) || sample.edgeLengthsMm.some((value) => !Number.isFinite(Number(value)) || Number(value) <= 0)) {
      throw new Error(`Calibration session ${index + 1}, sample ${sampleIndex + 1} has invalid edge measurements.`);
    }
  });
  return structuredClone(record);
}

export function parseCalibrationSessionRecords(value) {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  const records = Array.isArray(parsed) ? parsed : parsed?.sessions;
  if (!Array.isArray(records)) throw new Error('Calibration-session import must be an array or an object with a sessions array.');
  return records.map(validateSession);
}

export function calibrationSessionsToJson(sessions, options = {}) {
  return JSON.stringify({
    schema: CALIBRATION_SESSION_COLLECTION_SCHEMA_V1,
    schemaVersion: 1,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    sessions: sessions.map((session) => structuredClone(session)),
  }, null, 2);
}

/** Re-derives a profile from a portable raw session against the current base. */
export function profileFromCalibrationSession(baseProfile, session) {
  const input = {
    id: session.id,
    title: session.title,
    label: session.label,
    measuredAt: session.measuredAt,
    method: session.method,
    device: session.device,
    instrumentResolutionMm: session.instrumentResolutionMm,
    setOrBatch: session.setOrBatch,
    temperatureC: session.environment?.temperatureC,
    humidityPercent: session.environment?.humidityPercent,
    anglesDegrees: session.anglesDegrees,
    samples: session.samples,
    minStableInteriorDegrees: session.hingeRangeDegrees?.minInterior,
    maxStableInteriorDegrees: session.hingeRangeDegrees?.maxInterior,
    notes: session.notes,
  };
  return createCalibrationSession(baseProfile, input).profile;
}
