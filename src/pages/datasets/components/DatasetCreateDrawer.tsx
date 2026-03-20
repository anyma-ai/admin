import { Cross1Icon } from '@radix-ui/react-icons';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { isApiRequestError } from '@/app/api/apiErrors';
import {
  useCreateDataset,
  useCreateDatasetFromImages,
} from '@/app/datasets';
import { markFileUploaded, signUpload } from '@/app/files/filesApi';
import { notifyError } from '@/app/toast';
import { PlusIcon } from '@/assets/icons';
import {
  Badge,
  Button,
  Field,
  FormRow,
  IconButton,
  Input,
  Select,
  Stack,
  Textarea,
  Typography,
} from '@/atoms';
import {
  DatasetModel,
  DatasetResolution,
  DatasetStyle,
  FileDir,
  FileStatus,
  type IFile,
} from '@/common/types';
import { Drawer } from '@/components/molecules';

import s from './DatasetCreateDrawer.module.scss';

export type DatasetCreateMode = 'default' | 'from-images' | null;

type DatasetCreateDrawerProps = {
  mode: DatasetCreateMode;
  onClose: () => void;
  onSuccess: (id: string) => void;
};

type CreateDatasetBaseValues = {
  name: string;
  characterName: string;
  description: string;
  loraTriggerWord: string;
  model: DatasetModel;
  resolution: DatasetResolution;
  style: DatasetStyle;
};

type CreateImageUploadItem = {
  id: string;
  fileName: string;
  status: 'uploading' | 'uploaded' | 'error';
  uploadedFile: IFile | null;
  message?: string;
};

const RESOLUTION_OPTIONS = [
  { label: 'Low (1K)', value: DatasetResolution.low },
  { label: 'Medium (2K)', value: DatasetResolution.medium },
  { label: 'High (4K)', value: DatasetResolution.high },
];

const STYLE_OPTIONS = [
  { label: 'Photorealistic', value: DatasetStyle.Photorealistic },
  { label: 'Anime', value: DatasetStyle.Anime },
];

const MODEL_OPTIONS = [
  { label: 'Grok', value: DatasetModel.Grok },
  { label: 'Gemini', value: DatasetModel.Gemini },
];

const DATASET_MODEL_VALUES = new Set(Object.values(DatasetModel));
const DATASET_RESOLUTION_VALUES = new Set(Object.values(DatasetResolution));
const DATASET_STYLE_VALUES = new Set(Object.values(DatasetStyle));
const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp';
const ACCEPTED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);
const EXTENSION_TO_MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
} as const;
const MIN_ITEMS_COUNT = 1;
const MAX_ITEMS_COUNT = 100;
const MIN_IMAGES = 1;
const MAX_REF_IMAGES = 5;

const EMPTY_BASE_VALUES: CreateDatasetBaseValues = {
  name: '',
  characterName: '',
  description: '',
  loraTriggerWord: '',
  model: DatasetModel.Grok,
  resolution: DatasetResolution.low,
  style: DatasetStyle.Photorealistic,
};

function createUploadItemId() {
  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    typeof window.crypto.randomUUID === 'function'
  ) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseItemsCount(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

function getFileExtension(name: string) {
  const parts = name.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

function isAcceptedImageFile(file: File) {
  if (ACCEPTED_MIME_TYPES.has(file.type)) {
    return true;
  }
  const extension = getFileExtension(file.name);
  return extension in EXTENSION_TO_MIME;
}

function resolveMimeType(file: File) {
  if (file.type) {
    return file.type;
  }
  const extension = getFileExtension(file.name);
  return (
    EXTENSION_TO_MIME[extension as keyof typeof EXTENSION_TO_MIME] ??
    'application/octet-stream'
  );
}

function resolveUploadErrorMessage(error: unknown) {
  if (isApiRequestError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Upload failed.';
}

async function uploadToPresigned(
  presigned: { url: string; fields: Record<string, string> },
  file: File,
) {
  const formData = new FormData();
  Object.entries(presigned.fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append('file', file);

  const uploadRes = await fetch(presigned.url, {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    throw new Error('Upload failed.');
  }
}

function isDatasetResolution(value: string): value is DatasetResolution {
  return DATASET_RESOLUTION_VALUES.has(value as DatasetResolution);
}

function isDatasetStyle(value: string): value is DatasetStyle {
  return DATASET_STYLE_VALUES.has(value as DatasetStyle);
}

function isDatasetModel(value: string): value is DatasetModel {
  return DATASET_MODEL_VALUES.has(value as DatasetModel);
}

export function DatasetCreateDrawer({
  mode,
  onClose,
  onSuccess,
}: DatasetCreateDrawerProps) {
  const [baseValues, setBaseValues] =
    useState<CreateDatasetBaseValues>(EMPTY_BASE_VALUES);
  const [itemsCount, setItemsCount] = useState(String(MIN_ITEMS_COUNT));
  const [images, setImages] = useState<IFile[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [createFiles, setCreateFiles] = useState<CreateImageUploadItem[]>([]);
  const [imageInputKey, setImageInputKey] = useState(0);
  const imageInputId = useId();

  const createMutation = useCreateDataset();
  const createFromImagesMutation = useCreateDatasetFromImages();

  const isOpen = mode !== null;
  const isFromImages = mode === 'from-images';
  const isPending = createMutation.isPending || createFromImagesMutation.isPending;
  const parsedItemsCount = parseItemsCount(itemsCount);
  const uploadedCreateFiles = useMemo(
    () =>
      createFiles.filter(
        (item) => item.status === 'uploaded' && Boolean(item.uploadedFile?.id),
      ),
    [createFiles],
  );
  const isUploadingCreateFiles = useMemo(
    () => createFiles.some((item) => item.status === 'uploading'),
    [createFiles],
  );
  const imageIds = useMemo(
    () =>
      isFromImages
        ? uploadedCreateFiles
            .map((item) => item.uploadedFile?.id)
            .filter((id): id is string => Boolean(id))
        : images.map((file) => file.id),
    [images, isFromImages, uploadedCreateFiles],
  );
  const maxImages = isFromImages ? undefined : MAX_REF_IMAGES;

  useEffect(() => {
    if (!isOpen) return;
    setBaseValues(EMPTY_BASE_VALUES);
    setItemsCount(String(MIN_ITEMS_COUNT));
    setImages([]);
    setCreateFiles([]);
    setShowErrors(false);
    setIsImageUploading(false);
    setImageInputKey((prev) => prev + 1);
  }, [isOpen, mode]);

  const updateCreateFile = useCallback(
    (
      id: string,
      updater: (item: CreateImageUploadItem) => CreateImageUploadItem,
    ) => {
      setCreateFiles((prev) =>
        prev.map((item) => (item.id === id ? updater(item) : item)),
      );
    },
    [],
  );

  const validationErrors = useMemo(() => {
    if (!showErrors) return {};

    return {
      name: baseValues.name.trim() ? undefined : 'Enter a name.',
      characterName: baseValues.characterName.trim()
        ? undefined
        : 'Enter a character name.',
      description: baseValues.description.trim()
        ? undefined
        : 'Enter a description.',
      itemsCount:
        isFromImages ||
        (parsedItemsCount !== null &&
          parsedItemsCount >= MIN_ITEMS_COUNT &&
          parsedItemsCount <= MAX_ITEMS_COUNT)
          ? undefined
          : `Enter a value between ${MIN_ITEMS_COUNT} and ${MAX_ITEMS_COUNT}.`,
      loraTriggerWord: baseValues.loraTriggerWord.trim()
        ? undefined
        : 'Enter a LoRA trigger word.',
      model: isDatasetModel(baseValues.model) ? undefined : 'Select a model.',
      style: isDatasetStyle(baseValues.style) ? undefined : 'Select a style.',
      resolution: isDatasetResolution(baseValues.resolution)
        ? undefined
        : 'Select a resolution.',
      images:
        imageIds.length >= MIN_IMAGES &&
        (typeof maxImages !== 'number' || imageIds.length <= maxImages)
          ? undefined
          : typeof maxImages === 'number'
            ? `Upload ${MIN_IMAGES}-${maxImages} images.`
            : `Upload at least ${MIN_IMAGES} image.`,
    };
  }, [
    baseValues.characterName,
    baseValues.description,
    baseValues.loraTriggerWord,
    baseValues.model,
    baseValues.name,
    baseValues.resolution,
    baseValues.style,
    imageIds.length,
    isFromImages,
    maxImages,
    parsedItemsCount,
    showErrors,
  ]);

  const isValid = useMemo(
    () =>
      Boolean(
        baseValues.name.trim() &&
          baseValues.characterName.trim() &&
          baseValues.description.trim() &&
          baseValues.loraTriggerWord.trim() &&
          isDatasetModel(baseValues.model) &&
          isDatasetStyle(baseValues.style) &&
          isDatasetResolution(baseValues.resolution) &&
          (isFromImages ||
            (parsedItemsCount !== null &&
              parsedItemsCount >= MIN_ITEMS_COUNT &&
              parsedItemsCount <= MAX_ITEMS_COUNT)) &&
          imageIds.length >= MIN_IMAGES &&
          (typeof maxImages !== 'number' || imageIds.length <= maxImages),
      ),
    [baseValues, imageIds.length, isFromImages, maxImages, parsedItemsCount],
  );

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const removeImage = (id: string) => {
    if (isFromImages) {
      setCreateFiles((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    setImages((prev) => prev.filter((file) => file.id !== id));
  };

  const handleAddImageClick = () => {
    if (
      (isFromImages ? isUploadingCreateFiles : isImageUploading) ||
      isPending ||
      (typeof maxImages === 'number' &&
        (isFromImages ? imageIds.length : images.length) >= maxImages)
    ) {
      return;
    }

    const element = document.getElementById(imageInputId);
    if (element instanceof HTMLInputElement) {
      element.click();
    }
  };

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setImageInputKey((prev) => prev + 1);

    if (files.length === 0) return;

    if (isFromImages) {
      if (isPending || isUploadingCreateFiles) return;

      const queuedItems = files.map((file) => ({
        id: createUploadItemId(),
        fileName: file.name,
        status: 'uploading',
        uploadedFile: null,
      })) satisfies CreateImageUploadItem[];
      setCreateFiles((prev) => [...prev, ...queuedItems]);

      let failedUploads = 0;
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const queuedItem = queuedItems[index];
        if (!file || !queuedItem) continue;

        if (!isAcceptedImageFile(file)) {
          failedUploads += 1;
          updateCreateFile(queuedItem.id, (item) => ({
            ...item,
            status: 'error',
            message: 'Only PNG, JPG, JPEG, or WEBP files are allowed.',
          }));
          continue;
        }

        try {
          const mime = resolveMimeType(file);
          const { presigned, file: signedFile } = await signUpload({
            fileName: file.name,
            mime,
            folder: FileDir.Public,
          });

          await uploadToPresigned(presigned, file);
          const success = await markFileUploaded(signedFile.id);
          if (!success) {
            throw new Error('Unable to finalize upload.');
          }

          updateCreateFile(queuedItem.id, (item) => ({
            ...item,
            status: 'uploaded',
            uploadedFile: { ...signedFile, status: FileStatus.UPLOADED },
            message: undefined,
          }));
        } catch (error) {
          failedUploads += 1;
          updateCreateFile(queuedItem.id, (item) => ({
            ...item,
            status: 'error',
            message: resolveUploadErrorMessage(error),
          }));
        }
      }

      if (failedUploads > 0) {
        const failedLabel = failedUploads === 1 ? 'file failed' : 'files failed';
        notifyError(
          new Error(`${failedUploads} ${failedLabel} to upload.`),
          'Unable to upload some images.',
        );
      }
      return;
    }

    const file = files[0];
    if (!file) return;
    if (
      isImageUploading ||
      (typeof maxImages === 'number' && images.length >= maxImages)
    ) {
      return;
    }

    if (!isAcceptedImageFile(file)) {
      notifyError(
        new Error('Only PNG, JPG, JPEG, or WEBP files are allowed.'),
        'Unable to upload image.',
      );
      return;
    }

    try {
      setIsImageUploading(true);
      const mime = resolveMimeType(file);
      const { presigned, file: signedFile } = await signUpload({
        fileName: file.name,
        mime,
        folder: FileDir.Public,
      });

      await uploadToPresigned(presigned, file);
      const success = await markFileUploaded(signedFile.id);
      if (!success) {
        throw new Error('Unable to finalize upload.');
      }

      setImages((prev) => [
        ...prev,
        { ...signedFile, status: FileStatus.UPLOADED },
      ]);
    } catch (error) {
      const message = resolveUploadErrorMessage(error);
      notifyError(new Error(message), 'Unable to upload image.');
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }

    const payload = {
      name: baseValues.name.trim(),
      characterName: baseValues.characterName.trim(),
      description: baseValues.description.trim(),
      loraTriggerWord: baseValues.loraTriggerWord.trim(),
      model: baseValues.model,
      style: baseValues.style,
      resolution: baseValues.resolution,
    };

    const result = isFromImages
      ? await createFromImagesMutation.mutateAsync({
          ...payload,
          imgIds: imageIds,
        })
      : await createMutation.mutateAsync({
          ...payload,
          itemsCount: parsedItemsCount!,
          refImgIds: imageIds,
        });

    onClose();
    if (result?.id) {
      onSuccess(result.id);
    }
  };

  const imageFieldLabel = isFromImages ? 'Images' : 'Reference images';
  const addImageLabel = isFromImages ? 'Add image' : 'Add reference';
  const uploadedHint =
    typeof maxImages === 'number'
      ? `${imageIds.length}/${maxImages} uploaded`
      : `${imageIds.length} uploaded`;
  const fromImagesItems = createFiles;

  return (
    <Drawer
      open={isOpen}
      title={isFromImages ? 'Create from Images' : 'New dataset'}
      className={s.drawer}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <Stack gap="16px">
        {isFromImages ? (
          <Field
            label="Name"
            labelFor="dataset-create-name"
            error={validationErrors.name}
          >
            <Input
              id="dataset-create-name"
              size="sm"
              value={baseValues.name}
              onChange={(event) =>
                setBaseValues((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              placeholder="Dataset name"
              fullWidth
            />
          </Field>
        ) : (
          <FormRow columns={2}>
            <Field
              label="Name"
              labelFor="dataset-create-name"
              error={validationErrors.name}
            >
              <Input
                id="dataset-create-name"
                size="sm"
                value={baseValues.name}
                onChange={(event) =>
                  setBaseValues((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Dataset name"
                fullWidth
              />
            </Field>
            <Field
              label="Items count"
              labelFor="dataset-create-items-count"
              error={validationErrors.itemsCount}
            >
              <Input
                id="dataset-create-items-count"
                type="number"
                min={MIN_ITEMS_COUNT}
                max={MAX_ITEMS_COUNT}
                size="sm"
                value={itemsCount}
                onChange={(event) => setItemsCount(event.target.value)}
                placeholder={String(MIN_ITEMS_COUNT)}
                fullWidth
              />
            </Field>
          </FormRow>
        )}

        <Field
          label="Character name"
          labelFor="dataset-create-character-name"
          error={validationErrors.characterName}
        >
          <Input
            id="dataset-create-character-name"
            size="sm"
            value={baseValues.characterName}
            onChange={(event) =>
              setBaseValues((prev) => ({
                ...prev,
                characterName: event.target.value,
              }))
            }
            placeholder="Character name"
            fullWidth
          />
        </Field>

        <FormRow columns={2}>
          <Field
            label="LoRA trigger word"
            labelFor="dataset-create-lora-trigger-word"
            error={validationErrors.loraTriggerWord}
          >
            <Input
              id="dataset-create-lora-trigger-word"
              size="sm"
              value={baseValues.loraTriggerWord}
              onChange={(event) =>
                setBaseValues((prev) => ({
                  ...prev,
                  loraTriggerWord: event.target.value,
                }))
              }
              placeholder="char123"
              fullWidth
            />
          </Field>
          <Field
            label="Resolution"
            labelFor="dataset-create-resolution"
            error={validationErrors.resolution}
          >
            <Select
              id="dataset-create-resolution"
              size="sm"
              options={RESOLUTION_OPTIONS}
              value={baseValues.resolution}
              onChange={(value) =>
                setBaseValues((prev) => ({
                  ...prev,
                  resolution: value as DatasetResolution,
                }))
              }
              fullWidth
            />
          </Field>
        </FormRow>

        <FormRow columns={2}>
          <Field
            label="Style"
            labelFor="dataset-create-style"
            error={validationErrors.style}
          >
            <Select
              id="dataset-create-style"
              size="sm"
              options={STYLE_OPTIONS}
              value={baseValues.style}
              onChange={(value) =>
                setBaseValues((prev) => ({
                  ...prev,
                  style: value as DatasetStyle,
                }))
              }
              fullWidth
            />
          </Field>
          <Field
            label="Model"
            labelFor="dataset-create-model"
            error={validationErrors.model}
          >
            <Select
              id="dataset-create-model"
              size="sm"
              options={MODEL_OPTIONS}
              value={baseValues.model}
              onChange={(value) =>
                setBaseValues((prev) => ({
                  ...prev,
                  model: value as DatasetModel,
                }))
              }
              fullWidth
            />
          </Field>
        </FormRow>

        <Field
          label="Description"
          labelFor="dataset-create-description"
          error={validationErrors.description}
        >
          <Textarea
            id="dataset-create-description"
            value={baseValues.description}
            onChange={(event) =>
              setBaseValues((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            placeholder="Young woman, casual everyday style"
            rows={4}
            fullWidth
          />
        </Field>

        <Field
          label={imageFieldLabel}
          hint={uploadedHint}
          error={validationErrors.images}
        >
          <Stack gap="12px">
            <div className={s.imageActions}>
              <IconButton
                aria-label={addImageLabel}
                tooltip={addImageLabel}
                variant="secondary"
                size="sm"
                icon={<PlusIcon />}
                onClick={handleAddImageClick}
                disabled={
                  isPending ||
                  (isFromImages ? isUploadingCreateFiles : isImageUploading) ||
                  (typeof maxImages === 'number' &&
                    (isFromImages ? imageIds.length : images.length) >= maxImages)
                }
              />
              <Typography variant="meta" tone="muted">
                {isFromImages
                  ? isUploadingCreateFiles
                    ? 'Uploading images...'
                    : addImageLabel
                  : isImageUploading
                    ? 'Uploading image...'
                    : addImageLabel}
              </Typography>
            </div>

            {isFromImages ? (
              fromImagesItems.length === 0 ? (
                <div className={s.imageEmpty}>
                  <Typography variant="caption" tone="muted">
                    No images uploaded yet.
                  </Typography>
                </div>
              ) : (
                <div className={s.imageGrid}>
                  {fromImagesItems.map((item) => (
                    <div key={item.id} className={s.imageCard}>
                      <div className={s.imagePreview}>
                        {item.uploadedFile?.url ? (
                          <img
                            className={s.imagePreviewImage}
                            src={item.uploadedFile.url}
                            alt={item.fileName}
                            loading="lazy"
                          />
                        ) : (
                          <Typography variant="caption" tone="muted">
                            {item.status === 'uploading' ? 'Uploading...' : 'No preview'}
                          </Typography>
                        )}
                        <div className={s.imageCardActions}>
                          <IconButton
                            aria-label="Remove image"
                            tooltip="Remove"
                            variant="ghost"
                            tone="danger"
                            size="sm"
                            icon={<Cross1Icon />}
                            onClick={() => removeImage(item.id)}
                            disabled={isPending}
                          />
                        </div>
                      </div>
                      <Typography
                        variant="caption"
                        tone="muted"
                        className={s.imageName}
                      >
                        {item.fileName}
                      </Typography>
                      <div className={s.imageMeta}>
                        <Badge
                          tone={
                            item.status === 'uploaded'
                              ? 'success'
                              : item.status === 'error'
                                ? 'danger'
                                : 'accent'
                          }
                        >
                          {item.status === 'uploaded'
                            ? 'Uploaded'
                            : item.status === 'error'
                              ? 'Error'
                              : 'Uploading'}
                        </Badge>
                        {item.message ? (
                          <Typography
                            variant="caption"
                            className={s.imageMessageError}
                          >
                            {item.message}
                          </Typography>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : images.length === 0 ? (
              <div className={s.imageEmpty}>
                <Typography variant="caption" tone="muted">
                  No images uploaded yet.
                </Typography>
              </div>
            ) : (
              <div className={s.imageGrid}>
                {images.map((file) => (
                  <div key={file.id} className={s.imageCard}>
                    <div className={s.imagePreview}>
                      {file.url ? (
                        <img
                          className={s.imagePreviewImage}
                          src={file.url}
                          alt={file.name}
                          loading="lazy"
                        />
                      ) : (
                        <Typography variant="caption" tone="muted">
                          No preview
                        </Typography>
                      )}
                      <div className={s.imageCardActions}>
                        <IconButton
                          aria-label="Remove image"
                          tooltip="Remove"
                          variant="ghost"
                          tone="danger"
                          size="sm"
                          icon={<Cross1Icon />}
                          onClick={() => removeImage(file.id)}
                        />
                      </div>
                    </div>
                    <Typography
                      variant="caption"
                      tone="muted"
                      className={s.imageName}
                    >
                      {file.name}
                    </Typography>
                  </div>
                ))}
              </div>
            )}

            <Input
              key={imageInputKey}
              id={imageInputId}
              type="file"
              accept={IMAGE_ACCEPT}
              multiple={isFromImages}
              onChange={handleImageFileChange}
              disabled={
                isPending ||
                (isFromImages ? isUploadingCreateFiles : isImageUploading) ||
                (typeof maxImages === 'number' &&
                  (isFromImages ? imageIds.length : images.length) >= maxImages)
              }
              wrapperClassName={s.hiddenInputWrapper}
              className={s.hiddenInput}
            />
          </Stack>
        </Field>

        <div className={s.actions}>
          <Button variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isPending}
            disabled={!isValid || isPending}
          >
            {isFromImages ? 'Create from images' : 'Create'}
          </Button>
        </div>
      </Stack>
    </Drawer>
  );
}
