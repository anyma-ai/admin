import { Field, FormRow, Input, Select, Textarea } from '@/atoms';
import { PhotoAngle, SexPose, SexType } from '@/common/types';
import {
  photoAngleOptions,
  sexPoseOptions,
  sexTypeOptions,
} from '@/common/utils';

export type PosePromptFormValues = {
  idx: string;
  sexType: SexType | '';
  pose: SexPose | '';
  angle: PhotoAngle | '';
  prompt: string;
};

export type PosePromptFormErrors = Partial<
  Record<keyof PosePromptFormValues, string>
>;

type PosePromptFormProps = {
  values: PosePromptFormValues;
  errors: PosePromptFormErrors;
  disabled?: boolean;
  onChange: (field: keyof PosePromptFormValues, value: string) => void;
};

export function PosePromptForm({
  values,
  errors,
  disabled = false,
  onChange,
}: PosePromptFormProps) {
  return (
    <>
      <FormRow columns={2}>
        <Field label="Index" labelFor="pose-idx" error={errors.idx}>
          <Input
            id="pose-idx"
            size="sm"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={values.idx}
            onChange={(event) => onChange('idx', event.target.value)}
            placeholder="0"
            disabled={disabled}
            fullWidth
          />
        </Field>

        <Field label="Pose" labelFor="pose-meta-pose" error={errors.pose}>
          <Select
            id="pose-meta-pose"
            size="sm"
            value={values.pose}
            options={sexPoseOptions}
            onChange={(value) =>
              onChange('pose', value as PosePromptFormValues['pose'])
            }
            placeholder="Select pose"
            disabled={disabled}
            fullWidth
          />
        </Field>
      </FormRow>

      <FormRow columns={2}>
        <Field label="Sex type" labelFor="pose-sex-type" error={errors.sexType}>
          <Select
            id="pose-sex-type"
            size="sm"
            value={values.sexType}
            options={sexTypeOptions}
            onChange={(value) =>
              onChange('sexType', value as PosePromptFormValues['sexType'])
            }
            placeholder="Select sex type"
            disabled={disabled}
            fullWidth
          />
        </Field>

        <Field label="Angle" labelFor="pose-meta-angle" error={errors.angle}>
          <Select
            id="pose-meta-angle"
            size="sm"
            value={values.angle}
            options={photoAngleOptions}
            onChange={(value) =>
              onChange('angle', value as PosePromptFormValues['angle'])
            }
            placeholder="Select angle"
            disabled={disabled}
            fullWidth
          />
        </Field>
      </FormRow>

      <Field label="Prompt" labelFor="pose-prompt" error={errors.prompt}>
        <Textarea
          id="pose-prompt"
          size="sm"
          value={values.prompt}
          onChange={(event) => onChange('prompt', event.target.value)}
          rows={10}
          disabled={disabled}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          fullWidth
        />
      </Field>
    </>
  );
}
