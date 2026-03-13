import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  useCharacterDetails,
  useDeleteCharacter,
  useUpdateCharacter,
} from '@/app/characters';
import { useLoras } from '@/app/loras';
import { notifyError } from '@/app/toast';
import {
  Alert,
  Button,
  Container,
  EmptyState,
  Field,
  FormRow,
  Input,
  Modal,
  Select,
  Stack,
  Switch,
  Textarea,
} from '@/atoms';
import {
  CharacterBodyType,
  CharacterBreastSize,
  CharacterEthnicity,
  CharacterHairColor,
  FileDir,
  type IFile,
} from '@/common/types';
import { ConfirmModal, FileUpload } from '@/components/molecules';
import { AppShell } from '@/components/templates';

import {
  BODY_TYPE_OPTIONS,
  BREAST_SIZE_OPTIONS,
  ETHNICITY_OPTIONS,
  HAIR_COLOR_OPTIONS,
} from './characterAttributeOptions';
import s from './CharacterDetailsPage.module.scss';
import { CharacterHeader } from './components/CharacterHeader';
import { CharacterOverview } from './components/CharacterOverview';
import { LoraSelect } from './components/LoraSelect';
import { ScenarioSection } from './components/ScenarioSection';

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return dateTimeFormatter.format(parsed);
}

function formatValue(value: string | null | undefined) {
  if (!value) return '-';
  const trimmed = value.trim();
  if (!trimmed) return '-';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function CharacterDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, isLoading, refetch } = useCharacterDetails(id ?? null);
  const updateMutation = useUpdateCharacter();
  const deleteMutation = useDeleteCharacter();

  const scenarios = useMemo(() => data?.scenarios ?? [], [data?.scenarios]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    null,
  );
  const effectiveSelectedScenarioId = useMemo(() => {
    if (!scenarios.length) return null;
    if (
      selectedScenarioId &&
      scenarios.some((scenario) => scenario.id === selectedScenarioId)
    ) {
      return selectedScenarioId;
    }
    return scenarios[0]?.id ?? null;
  }, [scenarios, selectedScenarioId]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    emoji: '',
    gender: '',
    hairColor: CharacterHairColor.Blond,
    ethnicity: CharacterEthnicity.Caucasian,
    bodyType: CharacterBodyType.Average,
    breastSize: CharacterBreastSize.Medium,
    isActive: true,
    isFeatured: false,
    loraId: '',
    description: '',
    avatarId: '',
    promoImgId: '',
  });
  const [initialValues, setInitialValues] = useState(formValues);
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

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loraOptions = useMemo(() => {
    const list = loraData?.data ?? [];
    if (data?.lora && !list.some((lora) => lora.id === data.lora.id)) {
      return [data.lora, ...list];
    }
    return list;
  }, [data?.lora, loraData?.data]);

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
    if (!formValues.name.trim()) {
      errors.name = 'Enter a name.';
    }
    if (!formValues.loraId) {
      errors.loraId = 'Select a LoRA.';
    }
    if (!formValues.hairColor) {
      errors.hairColor = 'Select a hair color.';
    }
    if (!formValues.ethnicity) {
      errors.ethnicity = 'Select an ethnicity.';
    }
    if (!formValues.bodyType) {
      errors.bodyType = 'Select a body type.';
    }
    if (!formValues.breastSize) {
      errors.breastSize = 'Select a breast size.';
    }
    return errors;
  }, [
    formValues.bodyType,
    formValues.breastSize,
    formValues.ethnicity,
    formValues.hairColor,
    formValues.loraId,
    formValues.name,
    showErrors,
  ]);

  const isValid = useMemo(
    () =>
      Boolean(
        formValues.name.trim() &&
        formValues.loraId &&
        formValues.hairColor &&
        formValues.ethnicity &&
        formValues.bodyType &&
        formValues.breastSize,
      ),
    [
      formValues.bodyType,
      formValues.breastSize,
      formValues.ethnicity,
      formValues.hairColor,
      formValues.loraId,
      formValues.name,
    ],
  );

  const isDirty = useMemo(
    () =>
      formValues.name !== initialValues.name ||
      formValues.emoji !== initialValues.emoji ||
      formValues.gender !== initialValues.gender ||
      formValues.hairColor !== initialValues.hairColor ||
      formValues.ethnicity !== initialValues.ethnicity ||
      formValues.bodyType !== initialValues.bodyType ||
      formValues.breastSize !== initialValues.breastSize ||
      formValues.isActive !== initialValues.isActive ||
      formValues.isFeatured !== initialValues.isFeatured ||
      formValues.loraId !== initialValues.loraId ||
      formValues.description !== initialValues.description ||
      formValues.avatarId !== initialValues.avatarId ||
      formValues.promoImgId !== initialValues.promoImgId,
    [formValues, initialValues],
  );

  const openEditModal = () => {
    if (!data) return;
    const nextValues = {
      name: data.name ?? '',
      emoji: data.emoji ?? '',
      gender: data.gender ?? '',
      hairColor: data.hairColor ?? '',
      ethnicity: data.ethnicity ?? '',
      bodyType: data.bodyType ?? '',
      breastSize: data.breastSize ?? '',
      isActive: data.isActive,
      isFeatured: Boolean(data.isFeatured),
      loraId: data.lora?.id ?? '',
      description: data.description ?? '',
      avatarId: data.avatar?.id ?? '',
      promoImgId: data.promoImg?.id ?? '',
    };
    setFormValues(nextValues);
    setInitialValues(nextValues);
    setAvatarFile(data.avatar ?? null);
    setPromoFile(data.promoImg ?? null);
    setShowErrors(false);
    setLoraSearch('');
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    if (updateMutation.isPending) return;
    setIsEditOpen(false);
  };

  const handleSave = async () => {
    if (!data) return;
    const errors = {
      name: formValues.name.trim() ? undefined : 'Enter a name.',
      loraId: formValues.loraId ? undefined : 'Select a LoRA.',
      hairColor: formValues.hairColor ? undefined : 'Select a hair color.',
      ethnicity: formValues.ethnicity ? undefined : 'Select an ethnicity.',
      bodyType: formValues.bodyType ? undefined : 'Select a body type.',
      breastSize: formValues.breastSize ? undefined : 'Select a breast size.',
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
    await updateMutation.mutateAsync({
      id: data.id,
      payload: {
        name: formValues.name.trim(),
        emoji: formValues.emoji.trim(),
        gender: formValues.gender.trim(),
        hairColor: formValues.hairColor,
        ethnicity: formValues.ethnicity,
        bodyType: formValues.bodyType,
        breastSize: formValues.breastSize,
        isActive: formValues.isActive,
        isFeatured: formValues.isFeatured,
        loraId: formValues.loraId,
        description: formValues.description.trim(),
        avatarId: formValues.avatarId,
        promoImgId: formValues.promoImgId || undefined,
      },
    });
    setIsEditOpen(false);
  };

  const handleDelete = async () => {
    if (!data) return;
    await deleteMutation.mutateAsync(data.id);
    setIsDeleteOpen(false);
    navigate('/characters');
  };

  return (
    <AppShell>
      <Container size="wide" className={s.page}>
        <CharacterHeader
          data={data}
          isLoading={isLoading}
          onDelete={() => setIsDeleteOpen(true)}
          canDelete={Boolean(data)}
          isDeleting={deleteMutation.isPending}
        />

        {error ? (
          <Stack className={s.state} gap="12px">
            <Alert
              title="Unable to load character"
              description={
                error instanceof Error ? error.message : 'Please try again.'
              }
              tone="warning"
            />
            <Button variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </Stack>
        ) : null}

        <CharacterOverview
          data={data}
          formatDate={formatDate}
          formatValue={formatValue}
          loraLabel={data?.lora?.fileName || '-'}
          onEdit={openEditModal}
          canEdit={Boolean(data)}
        />
        <ScenarioSection
          characterId={id ?? null}
          characterName={data?.name ?? ''}
          scenarios={scenarios}
          selectedScenarioId={effectiveSelectedScenarioId}
          onSelectScenario={setSelectedScenarioId}
          isLoading={Boolean(isLoading && !data)}
          formatDate={formatDate}
        />

        <Modal
          open={isEditOpen}
          title="Edit character"
          onClose={closeEditModal}
          actions={
            <div className={s.modalActions}>
              <Button
                variant="secondary"
                onClick={closeEditModal}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                loading={updateMutation.isPending}
                disabled={
                  !isDirty ||
                  !isValid ||
                  updateMutation.isPending ||
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
                Save
              </Button>
            </div>
          }
        >
          <Stack gap="16px">
            <FormRow columns={2}>
              <Field
                label="Name"
                labelFor="character-edit-name"
                error={validationErrors.name}
              >
                <Input
                  id="character-edit-name"
                  size="sm"
                  value={formValues.name}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  fullWidth
                />
              </Field>
              <Field label="Emoji" labelFor="character-edit-emoji">
                <Input
                  id="character-edit-emoji"
                  size="sm"
                  value={formValues.emoji}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      emoji: event.target.value,
                    }))
                  }
                  fullWidth
                />
              </Field>
            </FormRow>

            <FormRow columns={3}>
              <Field label="Gender" labelFor="character-edit-gender">
                <Select
                  id="character-edit-gender"
                  size="sm"
                  options={[
                    { label: 'Female', value: 'female' },
                    { label: 'Male', value: 'male' },
                  ]}
                  value={formValues.gender}
                  onChange={(value) =>
                    setFormValues((prev) => ({ ...prev, gender: value }))
                  }
                  fullWidth
                />
              </Field>
              <Field
                label="Hair color"
                labelFor="character-edit-hair-color"
                error={validationErrors.hairColor}
              >
                <Select
                  id="character-edit-hair-color"
                  size="sm"
                  options={HAIR_COLOR_OPTIONS}
                  value={formValues.hairColor}
                  onChange={(value) =>
                    setFormValues((prev) => ({
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
                labelFor="character-edit-ethnicity"
                error={validationErrors.ethnicity}
              >
                <Select
                  id="character-edit-ethnicity"
                  size="sm"
                  options={ETHNICITY_OPTIONS}
                  value={formValues.ethnicity}
                  onChange={(value) =>
                    setFormValues((prev) => ({
                      ...prev,
                      ethnicity: value as CharacterEthnicity,
                    }))
                  }
                  placeholder="Select ethnicity"
                  fullWidth
                />
              </Field>
            </FormRow>

            <FormRow columns={3}>
              <Field
                label="Body type"
                labelFor="character-edit-body-type"
                error={validationErrors.bodyType}
              >
                <Select
                  id="character-edit-body-type"
                  size="sm"
                  options={BODY_TYPE_OPTIONS}
                  value={formValues.bodyType}
                  onChange={(value) =>
                    setFormValues((prev) => ({
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
                labelFor="character-edit-breast-size"
                error={validationErrors.breastSize}
              >
                <Select
                  id="character-edit-breast-size"
                  size="sm"
                  options={BREAST_SIZE_OPTIONS}
                  value={formValues.breastSize}
                  onChange={(value) =>
                    setFormValues((prev) => ({
                      ...prev,
                      breastSize: value as CharacterBreastSize,
                    }))
                  }
                  placeholder="Select breast size"
                  fullWidth
                />
              </Field>
              <Field label="Status" labelFor="character-edit-status">
                <Switch
                  id="character-edit-status"
                  checked={formValues.isActive}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      isActive: event.target.checked,
                    }))
                  }
                  label={formValues.isActive ? 'Active' : 'Inactive'}
                />
              </Field>
              <Field label="Featured" labelFor="character-edit-featured">
                <Switch
                  id="character-edit-featured"
                  checked={formValues.isFeatured}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      isFeatured: event.target.checked,
                    }))
                  }
                  label={formValues.isFeatured ? 'Featured' : 'Not featured'}
                />
              </Field>
            </FormRow>

            <Field
              label="LoRA"
              labelFor="character-edit-lora"
              error={validationErrors.loraId}
            >
              <LoraSelect
                id="character-edit-lora"
                value={formValues.loraId}
                options={loraOptions.map((lora) => ({
                  id: lora.id,
                  fileName: lora.fileName,
                }))}
                search={loraSearch}
                onSearchChange={setLoraSearch}
                onSelect={(value) =>
                  setFormValues((prev) => ({ ...prev, loraId: value }))
                }
                placeholder={isLoraLoading ? 'Loading LoRAs...' : 'Select LoRA'}
                disabled={isLoraLoading}
                loading={isLoraLoading}
              />
            </Field>

            <Field label="Description" labelFor="character-edit-description">
              <Textarea
                id="character-edit-description"
                size="sm"
                value={formValues.description}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={4}
                fullWidth
              />
            </Field>
            <FileUpload
              label="Avatar"
              folder={FileDir.Public}
              value={avatarFile}
              onChange={(file) => {
                setAvatarFile(file);
                setFormValues((prev) => ({
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
                setFormValues((prev) => ({
                  ...prev,
                  promoImgId: file?.id ?? '',
                }));
              }}
              onError={(message) =>
                notifyError(new Error(message), 'Unable to upload image.')
              }
            />
          </Stack>
        </Modal>

        <ConfirmModal
          open={isDeleteOpen}
          title="Delete character"
          description={
            data
              ? `Delete ${data.name}? This cannot be undone.`
              : 'Delete this character? This cannot be undone.'
          }
          confirmLabel="Delete"
          tone="danger"
          isConfirming={deleteMutation.isPending}
          onConfirm={handleDelete}
          onClose={() => setIsDeleteOpen(false)}
        />

        {!data && !isLoading && !error ? (
          <EmptyState
            title="Character not found"
            description="We could not find this character."
          />
        ) : null}
      </Container>
    </AppShell>
  );
}
