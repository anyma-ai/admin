import { useMemo, useState } from 'react';

import { notifyError } from '@/app/toast';
import { useCreateVoice, useUpdateVoice } from '@/app/voices';
import { Button, Checkbox, Field, FormRow, Input } from '@/atoms';
import { FileDir, type IFile, type IVoice, VoiceType } from '@/common/types';
import { Drawer, FileUpload } from '@/components/molecules';

import { voiceTypeOptions } from '../voiceFormat';
import s from './VoiceUpsertDrawer.module.scss';

type VoiceUpsertDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voice?: IVoice | null;
};

type Values = {
  name: string;
  key: string;
  type: VoiceType[];
};

const SAMPLE_ACCEPT =
  'audio/mpeg,audio/wav,audio/x-wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a';

function normalizeVoiceTypes(types: VoiceType[]) {
  const selected = new Set(types);
  return voiceTypeOptions
    .map((option) => option.value)
    .filter((value) => selected.has(value));
}

export function VoiceUpsertDrawer({
  open,
  onOpenChange,
  voice = null,
}: VoiceUpsertDrawerProps) {
  const [values, setValues] = useState<Values>(() => ({
    name: voice?.name ?? '',
    key: voice?.key ?? '',
    type: normalizeVoiceTypes(voice?.type ?? []),
  }));
  const [sampleFile, setSampleFile] = useState<IFile | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const createMutation = useCreateVoice();
  const updateMutation = useUpdateVoice();
  const isBusy = createMutation.isPending || updateMutation.isPending;

  const errors = useMemo(() => {
    if (!showErrors) return {};
    return {
      name: values.name.trim() ? undefined : 'Enter a name.',
      key: values.key.trim() ? undefined : 'Enter a key.',
    };
  }, [showErrors, values.key, values.name]);

  const handleSave = async () => {
    if (!values.name.trim() || !values.key.trim()) {
      setShowErrors(true);
      return;
    }

    const payload = {
      name: values.name.trim(),
      key: values.key.trim(),
      type: values.type,
      ...(sampleFile ? { sampleId: sampleFile.id } : {}),
    };

    try {
      if (voice) {
        await updateMutation.mutateAsync({ id: voice.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      setShowErrors(true);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isBusy) return;
        onOpenChange(nextOpen);
      }}
      title={voice ? 'Edit voice' : 'New voice'}
      className={s.drawer}
    >
      <div className={s.form}>
        <FormRow columns={2}>
          <Field label="Name" labelFor="voice-upsert-name" error={errors.name}>
            <Input
              id="voice-upsert-name"
              size="sm"
              value={values.name}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Voice name"
              fullWidth
              disabled={isBusy}
            />
          </Field>
          <Field label="Key" labelFor="voice-upsert-key" error={errors.key}>
            <Input
              id="voice-upsert-key"
              size="sm"
              value={values.key}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, key: event.target.value }))
              }
              placeholder="Provider voice key"
              fullWidth
              disabled={isBusy}
            />
          </Field>
        </FormRow>

        <Field label="Types">
          <FormRow columns={3}>
            {voiceTypeOptions.map((option) => (
              <Checkbox
                key={option.value}
                checked={values.type.includes(option.value)}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    type: event.target.checked
                      ? normalizeVoiceTypes([...prev.type, option.value])
                      : prev.type.filter((item) => item !== option.value),
                  }))
                }
                label={option.label}
                disabled={isBusy}
              />
            ))}
          </FormRow>
        </Field>

        {voice?.sampleUrl ? (
          <Field label="Current sample">
            <audio
              className={s.audio}
              src={voice.sampleUrl}
              controls
              preload="none"
            />
          </Field>
        ) : null}

        <FileUpload
          label={voice?.sampleUrl ? 'Replace sample' : 'Sample'}
          folder={FileDir.Public}
          accept={SAMPLE_ACCEPT}
          buttonLabel="Choose audio"
          value={sampleFile}
          onChange={setSampleFile}
          onError={(message) =>
            notifyError(new Error(message), 'Unable to upload the sample.')
          }
          disabled={isBusy}
        />

        <div className={s.drawerActions}>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isBusy} disabled={isBusy}>
            {voice ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
