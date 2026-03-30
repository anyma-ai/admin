import {
  PhotoAngle,
  SexPose,
  SexType,
  type IPosePromptDetails,
} from '@/common/types';

const POSES_TRANSFER_SCHEMA = 'aera-poses';
const POSES_TRANSFER_VERSION = 1;

export type PoseTransferItem = {
  idx: number;
  sexType: SexType;
  angle: PhotoAngle;
  pose: SexPose;
  prompt: string;
};

export type PosesTransferPayload = {
  schema: typeof POSES_TRANSFER_SCHEMA;
  version: typeof POSES_TRANSFER_VERSION;
  exportedAt: string;
  poses: PoseTransferItem[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function ensureRecord(value: unknown, path: string) {
  if (!isRecord(value)) {
    throw new Error(`Invalid import file: "${path}" must be an object.`);
  }
  return value;
}

function ensureString(value: unknown, path: string) {
  if (typeof value !== 'string') {
    throw new Error(`Invalid import file: "${path}" must be a string.`);
  }
  return value;
}

function ensureNonEmptyString(value: unknown, path: string) {
  const parsed = ensureString(value, path).trim();
  if (!parsed) {
    throw new Error(`Invalid import file: "${path}" must not be empty.`);
  }
  return parsed;
}

function ensureNonNegativeInteger(value: unknown, path: string) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `Invalid import file: "${path}" must be a non-negative integer.`,
    );
  }
  return value;
}

function ensureEnumValue<T extends string>(
  value: unknown,
  path: string,
  allowed: readonly T[],
) {
  const parsed = ensureString(value, path);
  if (!allowed.includes(parsed as T)) {
    throw new Error(`Invalid import file: "${path}" has unsupported value.`);
  }
  return parsed as T;
}

function parseTransferPose(value: unknown, path: string): PoseTransferItem {
  const obj = ensureRecord(value, path);

  return {
    idx: ensureNonNegativeInteger(obj.idx, `${path}.idx`),
    sexType: ensureEnumValue(
      obj.sexType,
      `${path}.sexType`,
      Object.values(SexType),
    ),
    angle: ensureEnumValue(
      obj.angle,
      `${path}.angle`,
      Object.values(PhotoAngle),
    ),
    pose: ensureEnumValue(
      obj.pose,
      `${path}.pose`,
      Object.values(SexPose),
    ),
    prompt: ensureNonEmptyString(obj.prompt, `${path}.prompt`),
  };
}

function ensureUniquePoseIdx(poses: PoseTransferItem[], path: string) {
  const counts = new Map<number, number>();
  for (const pose of poses) {
    counts.set(pose.idx, (counts.get(pose.idx) ?? 0) + 1);
  }

  const duplicates = Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([idx]) => String(idx));

  if (duplicates.length > 0) {
    throw new Error(
      `Invalid import file: duplicate pose idx values in "${path}": ${duplicates.join(', ')}.`,
    );
  }
}

function sortTransferPoses(a: PoseTransferItem, b: PoseTransferItem) {
  if (a.idx !== b.idx) return a.idx - b.idx;
  if (a.sexType !== b.sexType) return a.sexType.localeCompare(b.sexType);
  if (a.pose !== b.pose) return a.pose.localeCompare(b.pose);
  return a.angle.localeCompare(b.angle);
}

export function buildPosesTransferPayload(poses: IPosePromptDetails[]) {
  const mapped = poses.map((pose, index) => {
    if (!Number.isInteger(pose.idx) || pose.idx < 0) {
      throw new Error(
        `Unable to export poses: pose #${index + 1} has invalid idx.`,
      );
    }
    if (!pose.prompt?.trim()) {
      throw new Error(
        `Unable to export poses: pose idx "${pose.idx}" has empty prompt.`,
      );
    }

    return {
      idx: pose.idx,
      sexType: pose.sexType,
      angle: pose.angle,
      pose: pose.pose,
      prompt: pose.prompt.trim(),
    } satisfies PoseTransferItem;
  });

  mapped.sort(sortTransferPoses);
  ensureUniquePoseIdx(mapped, 'poses');

  return {
    schema: POSES_TRANSFER_SCHEMA,
    version: POSES_TRANSFER_VERSION,
    exportedAt: new Date().toISOString(),
    poses: mapped,
  } satisfies PosesTransferPayload;
}

export function buildPosesTransferFileName() {
  return 'poses.json';
}

export function downloadPosesTransferFile(
  payload: PosesTransferPayload,
  fileName: string,
) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function parsePosesTransferFile(file: File) {
  const text = await file.text();
  let rawPayload: unknown;

  try {
    rawPayload = JSON.parse(text) as unknown;
  } catch (_error) {
    throw new Error('Invalid JSON file.');
  }

  const payloadObj = ensureRecord(rawPayload, 'root');
  const schema = ensureString(payloadObj.schema, 'schema');
  const version = payloadObj.version;

  if (schema !== POSES_TRANSFER_SCHEMA) {
    throw new Error(
      `Invalid import file: unsupported schema "${schema}". Expected "${POSES_TRANSFER_SCHEMA}".`,
    );
  }
  if (version !== POSES_TRANSFER_VERSION) {
    throw new Error(
      `Invalid import file: unsupported version "${String(version)}".`,
    );
  }

  const posesValue = payloadObj.poses;
  if (!Array.isArray(posesValue)) {
    throw new Error('Invalid import file: "poses" must be an array.');
  }

  const poses = posesValue.map((pose, index) =>
    parseTransferPose(pose, `poses[${index}]`),
  );
  poses.sort(sortTransferPoses);
  ensureUniquePoseIdx(poses, 'poses');

  return {
    schema: POSES_TRANSFER_SCHEMA,
    version: POSES_TRANSFER_VERSION,
    exportedAt: ensureString(payloadObj.exportedAt, 'exportedAt'),
    poses,
  } satisfies PosesTransferPayload;
}
