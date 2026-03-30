export interface IPosePrompt {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export enum SexPose {
  Blowjob = 'blowjob',
  Handjob = 'handjob',
  Titjob = 'titjob',
  Cowgirl = 'cowgirl',
  Doggy = 'doggy',
  Missionary = 'missionary',
  Footjob = 'footjob',
  LegsUp = 'legs-up',
  Cumshot = 'cumshot',
}

export enum PhotoAngle {
  Pov = 'pov',
  Closeup = 'closeup',
  Topdown = 'topdown',
  Front = 'front',
  Back = 'back',
  Side = 'side',
}

export enum SexType {
  Vagina = 'vagina',
  Anal = 'anal',
  Oral = 'oral',
  Hand = 'hand',
  Foot = 'foot',
  Tits = 'tits',
}

export interface IPosePromptDetails extends IPosePrompt {
  idx: number;
  sexType: SexType;
  angle: PhotoAngle;
  pose: SexPose;
  prompt: string;
}

export type CreatePosePromptDto = {
  idx: number;
  sexType: SexType;
  angle: PhotoAngle;
  pose: SexPose;
  prompt: string;
};

export type UpdatePosePromptDto = {
  idx: number;
  sexType: SexType;
  angle: PhotoAngle;
  pose: SexPose;
  prompt: string;
};
