import { PhotoAngle, SexPose, SexType } from '../types';

export const SEX_TYPE_LABELS: Record<SexType, string> = {
  [SexType.Vagina]: 'Vagina',
  [SexType.Anal]: 'Anal',
  [SexType.Oral]: 'Oral',
  [SexType.Hand]: 'Hand',
  [SexType.Foot]: 'Foot',
  [SexType.Tits]: 'Tits',
};

export const PHOTO_ANGLE_LABELS: Record<PhotoAngle, string> = {
  [PhotoAngle.Pov]: 'POV',
  [PhotoAngle.Closeup]: 'Closeup',
  [PhotoAngle.Topdown]: 'Top Down',
  [PhotoAngle.Front]: 'Front',
  [PhotoAngle.Back]: 'Back',
  [PhotoAngle.Side]: 'Side',
};

export const SEX_POSE_LABELS: Record<SexPose, string> = {
  [SexPose.Blowjob]: 'Blowjob',
  [SexPose.Handjob]: 'Handjob',
  [SexPose.Titjob]: 'Titjob',
  [SexPose.Cowgirl]: 'Cowgirl',
  [SexPose.Doggy]: 'Doggy',
  [SexPose.Missionary]: 'Missionary',
  [SexPose.Footjob]: 'Footjob',
  [SexPose.LegsUp]: 'Legs Up',
  [SexPose.Cumshot]: 'Cumshot',
};

export const sexTypeOptions = Object.values(SexType).map((value) => ({
  value,
  label: SEX_TYPE_LABELS[value],
}));

export const photoAngleOptions = Object.values(PhotoAngle).map((value) => ({
  value,
  label: PHOTO_ANGLE_LABELS[value],
}));

export const sexPoseOptions = Object.values(SexPose).map((value) => ({
  value,
  label: SEX_POSE_LABELS[value],
}));

export function formatSexType(value: SexType | null | undefined) {
  return value ? SEX_TYPE_LABELS[value] : '-';
}

export function formatPhotoAngle(value: PhotoAngle | null | undefined) {
  return value ? PHOTO_ANGLE_LABELS[value] : '-';
}

export function formatSexPose(value: SexPose | null | undefined) {
  return value ? SEX_POSE_LABELS[value] : '-';
}
