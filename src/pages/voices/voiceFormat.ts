import { VoiceType } from '@/common/types';

const VOICE_TYPE_LABELS: Record<VoiceType, string> = {
  [VoiceType.Bold]: 'Bold',
  [VoiceType.Breathy]: 'Breathy',
  [VoiceType.Brooding]: 'Brooding',
  [VoiceType.Deep]: 'Deep',
  [VoiceType.Flirty]: 'Flirty',
  [VoiceType.GirlNextDoor]: 'Girl next door',
  [VoiceType.Mature]: 'Mature',
  [VoiceType.Mysterious]: 'Mysterious',
  [VoiceType.Nurturing]: 'Nurturing',
  [VoiceType.Playful]: 'Playful',
  [VoiceType.Sassy]: 'Sassy',
  [VoiceType.Seductive]: 'Seductive',
  [VoiceType.Shy]: 'Shy',
  [VoiceType.Smooth]: 'Smooth',
  [VoiceType.Soft]: 'Soft',
  [VoiceType.Sweet]: 'Sweet',
  [VoiceType.Villain]: 'Villain',
  [VoiceType.Young]: 'Young',
};

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const voiceTypeOptions = Object.values(VoiceType).map((value) => ({
  value,
  label: VOICE_TYPE_LABELS[value],
}));

export function formatVoiceTypes(types: VoiceType[] | null | undefined) {
  if (!types || types.length === 0) return '-';
  return types.map((type) => VOICE_TYPE_LABELS[type] ?? type).join(', ');
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return dateTimeFormatter.format(parsed);
}
