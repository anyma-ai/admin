import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCreateCharacter } from '@/app/characters';
import { useLoras } from '@/app/loras';
import { notifyError } from '@/app/toast';
import {
  Button,
  Divider,
  Field,
  FormRow,
  Input,
  Select,
  Stack,
  Switch,
  Textarea,
  Typography,
} from '@/atoms';
import {
  CharacterBodyType,
  CharacterBreastSize,
  CharacterEthnicity,
  CharacterHairColor,
  FileDir,
  type IFile,
} from '@/common/types';
import { Drawer, FileUpload } from '@/components/molecules';

import {
  BODY_TYPE_OPTIONS,
  BREAST_SIZE_OPTIONS,
  ETHNICITY_OPTIONS,
  HAIR_COLOR_OPTIONS,
} from '../characterAttributeOptions';
import s from './CharacterCreateDrawer.module.scss';
import { LoraSelect } from './LoraSelect';

type CharacterCreateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DEFAULT_VALUES = {
  name: '',
  emoji: '',
  gender: 'female',
  hairColor: CharacterHairColor.Blond,
  ethnicity: CharacterEthnicity.Caucasian,
  bodyType: CharacterBodyType.Average,
  breastSize: CharacterBreastSize.Medium,
  isFeatured: false,
  loraId: '',
  description: '',
  avatarId: '',
  promoImgId: '',
};

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function CharacterCreateDrawer({
  open,
  onOpenChange,
}: CharacterCreateDrawerProps) {
  const navigate = useNavigate();
  const createMutation = useCreateCharacter();
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [avatarFile, setAvatarFile] = useState<IFile | null>(null);
  const [promoFile, setPromoFile] = useState<IFile | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [loraSearch, setLoraSearch] = useState('');
  const debouncedLoraSearch = useDebouncedValue(loraSearch, 300);

  const loraQueryParams = useMemo(
    () => ({
      search: debouncedLoraSearch || undefined,
      order: 'DESC',
      skip: 0,
      take: 50,
    }),
    [debouncedLoraSearch],
  );
  const { data: loraData, isLoading: isLoraLoading } =
    useLoras(loraQueryParams);

  const loraOptions = useMemo(() => loraData?.data ?? [], [loraData?.data]);

  useEffect(() => {
    if (!open) return;

    setValues(DEFAULT_VALUES);
    setAvatarFile(null);
    setPromoFile(null);
    setShowErrors(false);
    setLoraSearch('');
  }, [open]);

  const validationErrors = useMemo(() => {
    if (!showErrors) return {};

    const errors: {
      name?: string;
      loraId?: string;
      hairColor?: string;
      ethnicity?: string;
      bodyType?: string;
      breastSize?: string;
    } = {};

    if (!values.name.trim()) {
      errors.name = 'Enter a name.';
    }
    if (!values.loraId) {
      errors.loraId = 'Select a LoRA.';
    }
    if (!values.hairColor) {
      errors.hairColor = 'Select a hair color.';
    }
    if (!values.ethnicity) {
      errors.ethnicity = 'Select an ethnicity.';
    }
    if (!values.bodyType) {
      errors.bodyType = 'Select a body type.';
    }
    if (!values.breastSize) {
      errors.breastSize = 'Select a breast size.';
    }

    return errors;
  }, [
    showErrors,
    values.bodyType,
    values.breastSize,
    values.ethnicity,
    values.hairColor,
    values.loraId,
    values.name,
  ]);

  const isValid = useMemo(
    () =>
      Boolean(
        values.name.trim() &&
        values.loraId &&
        values.hairColor &&
        values.ethnicity &&
        values.bodyType &&
        values.breastSize,
      ),
    [
      values.bodyType,
      values.breastSize,
      values.ethnicity,
      values.hairColor,
      values.loraId,
      values.name,
    ],
  );

  const closeDrawer = () => {
    if (createMutation.isPending) return;
    onOpenChange(false);
  };

  const handleCreate = async () => {
    const errors = {
      name: values.name.trim() ? undefined : 'Enter a name.',
      loraId: values.loraId ? undefined : 'Select a LoRA.',
      hairColor: values.hairColor ? undefined : 'Select a hair color.',
      ethnicity: values.ethnicity ? undefined : 'Select an ethnicity.',
      bodyType: values.bodyType ? undefined : 'Select a body type.',
      breastSize: values.breastSize ? undefined : 'Select a breast size.',
    };

    if (
      errors.name ||
      errors.loraId ||
      errors.hairColor ||
      errors.ethnicity ||
      errors.bodyType ||
      errors.breastSize
    ) {
      setShowErrors(true);
      return;
    }

    const result = await createMutation.mutateAsync({
      name: values.name.trim(),
      emoji: values.emoji.trim(),
      gender: values.gender.trim(),
      hairColor: values.hairColor,
      ethnicity: values.ethnicity,
      bodyType: values.bodyType,
      breastSize: values.breastSize,
      loraId: values.loraId,
      description: values.description.trim(),
      avatarId: values.avatarId,
      isFeatured: values.isFeatured,
      promoImgId: values.promoImgId || undefined,
    });

    onOpenChange(false);
    if (result?.id) {
      navigate(`/characters/${result.id}`);
    }
  };

  return (
    <Drawer
      open={open}
      title="Create character"
      className={s.drawer}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeDrawer();
        }
      }}
    >
      <Stack gap="20px" className={s.form}>
        <div className={s.section}>
          <div className={s.sectionHeader}>
            <Typography variant="control">Core</Typography>
            <Typography variant="meta" tone="muted">
              Name, identity, and visibility settings.
            </Typography>
          </div>

          <Stack gap="16px">
            <FormRow columns={2}>
              <Field
                label="Name"
                labelFor="character-create-name"
                error={validationErrors.name}
              >
                <Input
                  id="character-create-name"
                  size="sm"
                  value={values.name}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  fullWidth
                />
              </Field>
              <Field label="Emoji" labelFor="character-create-emoji">
                <Input
                  id="character-create-emoji"
                  size="sm"
                  value={values.emoji}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      emoji: event.target.value,
                    }))
                  }
                  fullWidth
                />
              </Field>
            </FormRow>

            <FormRow columns={2}>
              <Field label="Gender" labelFor="character-create-gender">
                <Select
                  id="character-create-gender"
                  size="sm"
                  options={[
                    { label: 'Female', value: 'female' },
                    { label: 'Male', value: 'male' },
                  ]}
                  value={values.gender}
                  onChange={(value) =>
                    setValues((prev) => ({ ...prev, gender: value }))
                  }
                  fullWidth
                />
              </Field>
              <Field label="Featured" labelFor="character-create-featured">
                <Switch
                  id="character-create-featured"
                  checked={values.isFeatured}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      isFeatured: event.target.checked,
                    }))
                  }
                  label={values.isFeatured ? 'Featured' : 'Not featured'}
                />
              </Field>
            </FormRow>

            <Field label="Description" labelFor="character-create-description">
              <Textarea
                id="character-create-description"
                size="sm"
                value={values.description}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={2}
                fullWidth
              />
            </Field>
          </Stack>
        </div>

        <Divider />

        <div className={s.section}>
          <div className={s.sectionHeader}>
            <Typography variant="control">Appearance</Typography>
            <Typography variant="meta" tone="muted">
              Default physical attributes for the character profile.
            </Typography>
          </div>

          <Stack gap="16px">
            <FormRow columns={2}>
              <Field
                label="Hair color"
                labelFor="character-create-hair-color"
                error={validationErrors.hairColor}
              >
                <Select
                  id="character-create-hair-color"
                  size="sm"
                  options={HAIR_COLOR_OPTIONS}
                  value={values.hairColor}
                  onChange={(value) =>
                    setValues((prev) => ({
                      ...prev,
                      hairColor: value as CharacterHairColor,
                    }))
                  }
                  placeholder="Select hair color"
                  fullWidth
                />
              </Field>
              <Field
                label="Ethnicity"
                labelFor="character-create-ethnicity"
                error={validationErrors.ethnicity}
              >
                <Select
                  id="character-create-ethnicity"
                  size="sm"
                  options={ETHNICITY_OPTIONS}
                  value={values.ethnicity}
                  onChange={(value) =>
                    setValues((prev) => ({
                      ...prev,
                      ethnicity: value as CharacterEthnicity,
                    }))
                  }
                  placeholder="Select ethnicity"
                  fullWidth
                />
              </Field>
            </FormRow>

            <FormRow columns={2}>
              <Field
                label="Body type"
                labelFor="character-create-body-type"
                error={validationErrors.bodyType}
              >
                <Select
                  id="character-create-body-type"
                  size="sm"
                  options={BODY_TYPE_OPTIONS}
                  value={values.bodyType}
                  onChange={(value) =>
                    setValues((prev) => ({
                      ...prev,
                      bodyType: value as CharacterBodyType,
                    }))
                  }
                  placeholder="Select body type"
                  fullWidth
                />
              </Field>
              <Field
                label="Breast size"
                labelFor="character-create-breast-size"
                error={validationErrors.breastSize}
              >
                <Select
                  id="character-create-breast-size"
                  size="sm"
                  options={BREAST_SIZE_OPTIONS}
                  value={values.breastSize}
                  onChange={(value) =>
                    setValues((prev) => ({
                      ...prev,
                      breastSize: value as CharacterBreastSize,
                    }))
                  }
                  placeholder="Select breast size"
                  fullWidth
                />
              </Field>
            </FormRow>

            <Field
              label="LoRA"
              labelFor="character-create-lora"
              error={validationErrors.loraId}
            >
              <LoraSelect
                id="character-create-lora"
                value={values.loraId}
                options={loraOptions.map((lora) => ({
                  id: lora.id,
                  fileName: lora.fileName,
                }))}
                search={loraSearch}
                onSearchChange={setLoraSearch}
                onSelect={(value) =>
                  setValues((prev) => ({ ...prev, loraId: value }))
                }
                placeholder={isLoraLoading ? 'Loading LoRAs...' : 'Select LoRA'}
                disabled={isLoraLoading}
                loading={isLoraLoading}
              />
            </Field>
          </Stack>
        </div>

        <Divider />

        <div className={s.section}>
          <div className={s.sectionHeader}>
            <Typography variant="control">Assets</Typography>
            <Typography variant="meta" tone="muted">
              Upload the visual images used inside the mini-app.
            </Typography>
          </div>

          <Stack gap="16px">
            <FileUpload
              label="Avatar"
              folder={FileDir.Public}
              value={avatarFile}
              onChange={(file) => {
                setAvatarFile(file);
                setValues((prev) => ({
                  ...prev,
                  avatarId: file?.id ?? '',
                }));
              }}
              onError={(message) =>
                notifyError(new Error(message), 'Unable to upload avatar.')
              }
            />
            <FileUpload
              label="Promo image"
              folder={FileDir.Public}
              value={promoFile}
              onChange={(file) => {
                setPromoFile(file);
                setValues((prev) => ({
                  ...prev,
                  promoImgId: file?.id ?? '',
                }));
              }}
              onError={(message) =>
                notifyError(new Error(message), 'Unable to upload image.')
              }
            />
          </Stack>
        </div>

        <Divider />

        <div className={s.actions}>
          <Button
            variant="secondary"
            onClick={closeDrawer}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            loading={createMutation.isPending}
            disabled={
              !isValid ||
              createMutation.isPending ||
              Boolean(
                validationErrors.name ||
                validationErrors.loraId ||
                validationErrors.hairColor ||
                validationErrors.ethnicity ||
                validationErrors.bodyType ||
                validationErrors.breastSize,
              )
            }
          >
            Create
          </Button>
        </div>
      </Stack>
    </Drawer>
  );
}
