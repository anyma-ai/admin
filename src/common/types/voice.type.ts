export enum VoiceType {
  Bold = 'bold',
  Breathy = 'breathy',
  Brooding = 'brooding',
  Deep = 'deep',
  Flirty = 'flirty',
  GirlNextDoor = 'girl-next-door',
  Mature = 'mature',
  Mysterious = 'mysterious',
  Nurturing = 'nurturing',
  Playful = 'playful',
  Sassy = 'sassy',
  Seductive = 'seductive',
  Shy = 'shy',
  Smooth = 'smooth',
  Soft = 'soft',
  Sweet = 'sweet',
  Villain = 'villain',
  Young = 'young',
}

export interface IVoice {
  id: string;
  name: string;
  key: string;
  sampleUrl?: string;
  type: VoiceType[];
  createdAt: string;
}

export interface CreateVoiceDto {
  name: string;
  key: string;
  type: VoiceType[];
  sampleId?: string;
}

export interface UpdateVoiceDto {
  name?: string;
  key?: string;
  type?: VoiceType[];
  sampleId?: string;
}
