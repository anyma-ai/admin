import { useEffect, useMemo, useState } from 'react';

import { useUpdateCharacter } from '@/app/characters';
import { useUserTypes } from '@/app/user-types';
import { TrashIcon } from '@/assets/icons';
import {
  Button,
  Divider,
  EmptyState,
  Field,
  IconButton,
  Select,
  Stack,
  Textarea,
  Typography,
} from '@/atoms';
import type {
  CharacterUserTypeOverrides,
  ICharacterDetails,
} from '@/common/types';
import { Drawer } from '@/components/molecules';

import s from './CharacterFormDrawer.module.scss';

type CharacterUserTypesDrawerProps = {
  character: ICharacterDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type OverrideRow = {
  userTypeId: string;
  chatPrompt: string;
  resistance: string;
};

function toRows(userTypes: Record<string, CharacterUserTypeOverrides> = {}) {
  return Object.entries(userTypes).map<OverrideRow>(([userTypeId, value]) => ({
    userTypeId,
    chatPrompt: value?.chatPrompt ?? '',
    resistance: value?.resistance ?? '',
  }));
}

function serializeRows(rows: OverrideRow[]) {
  return JSON.stringify(
    rows.map((row) => [
      row.userTypeId,
      row.chatPrompt.trim(),
      row.resistance.trim(),
    ]),
  );
}

export function CharacterUserTypesDrawer({
  character,
  open,
  onOpenChange,
}: CharacterUserTypesDrawerProps) {
  const updateMutation = useUpdateCharacter();
  const userTypesQuery = useUserTypes({ order: 'ASC', take: 1000 });

  const initialRows = useMemo(
    () => toRows(character?.meta?.userTypes),
    [character?.meta?.userTypes],
  );
  const [rows, setRows] = useState<OverrideRow[]>(initialRows);

  useEffect(() => {
    if (!open) return;
    setRows(initialRows);
  }, [initialRows, open]);

  const userTypes = useMemo(
    () => userTypesQuery.data?.data ?? [],
    [userTypesQuery.data?.data],
  );
  const userTypeNames = useMemo(
    () => new Map(userTypes.map((userType) => [userType.id, userType.name])),
    [userTypes],
  );

  const usedIds = useMemo(
    () => new Set(rows.map((row) => row.userTypeId).filter(Boolean)),
    [rows],
  );

  const getOptions = (currentId: string) => {
    const options = userTypes.map((userType) => ({
      value: userType.id,
      label: userType.name,
      disabled: userType.id !== currentId && usedIds.has(userType.id),
    }));
    if (currentId && !userTypeNames.has(currentId)) {
      return [{ value: currentId, label: currentId }, ...options];
    }
    return options;
  };

  const isSubmitting = updateMutation.isPending;
  const isDirty = serializeRows(rows) !== serializeRows(initialRows);
  const hasEmptyUserType = rows.some((row) => !row.userTypeId);
  const canAddRow =
    !userTypesQuery.isLoading &&
    userTypes.some((userType) => !usedIds.has(userType.id));

  const updateRow = (index: number, patch: Partial<OverrideRow>) => {
    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { userTypeId: '', chatPrompt: '', resistance: '' },
    ]);
  };

  const closeDrawer = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!character) return;

    await updateMutation.mutateAsync({
      id: character.id,
      payload: {
        meta: {
          ...character.meta,
          userTypes: Object.fromEntries(
            rows.map((row) => [
              row.userTypeId,
              {
                chatPrompt: row.chatPrompt.trim() || undefined,
                resistance: row.resistance.trim() || undefined,
              },
            ]),
          ),
        },
      },
    });

    onOpenChange(false);
  };

  if (!character) return null;

  return (
    <Drawer
      open={open}
      title="User Type Overrides"
      className={s.drawer}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeDrawer();
        }
      }}
    >
      <Stack gap="20px" className={s.form}>
        {rows.length ? (
          rows.map((row, index) => (
            <div key={index} className={s.section}>
              {index > 0 ? <Divider /> : null}
              <div className={s.sectionHeader}>
                <Typography variant="control">
                  {userTypeNames.get(row.userTypeId) ?? 'User type'}
                </Typography>
                <Typography variant="meta" tone="muted">
                  {row.userTypeId || 'Not selected'}
                </Typography>
              </div>

              <Stack gap="16px">
                <Field
                  label="User type"
                  labelFor={`user-type-override-${index}`}
                >
                  <Select
                    id={`user-type-override-${index}`}
                    options={getOptions(row.userTypeId)}
                    value={row.userTypeId}
                    placeholder="Select user type"
                    onChange={(value) =>
                      updateRow(index, { userTypeId: value })
                    }
                    disabled={isSubmitting}
                    fullWidth
                  />
                </Field>

                <Field
                  label="Chat prompt"
                  labelFor={`user-type-override-chat-prompt-${index}`}
                >
                  <Textarea
                    id={`user-type-override-chat-prompt-${index}`}
                    size="sm"
                    value={row.chatPrompt}
                    onChange={(event) =>
                      updateRow(index, { chatPrompt: event.target.value })
                    }
                    rows={8}
                    disabled={isSubmitting}
                    fullWidth
                  />
                </Field>

                <Field
                  label="Resistance"
                  labelFor={`user-type-override-resistance-${index}`}
                >
                  <Textarea
                    id={`user-type-override-resistance-${index}`}
                    size="sm"
                    value={row.resistance}
                    onChange={(event) =>
                      updateRow(index, { resistance: event.target.value })
                    }
                    rows={6}
                    disabled={isSubmitting}
                    fullWidth
                  />
                </Field>

                <div className={s.actions}>
                  <IconButton
                    aria-label="Remove override"
                    icon={<TrashIcon />}
                    tooltip="Remove override"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(index)}
                    disabled={isSubmitting}
                  />
                </div>
              </Stack>
            </div>
          ))
        ) : (
          <EmptyState
            title="No overrides"
            description="Add a user type to override its chat prompt or resistance for this character."
          />
        )}

        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={addRow}
            disabled={!canAddRow || isSubmitting}
          >
            Add user type
          </Button>
        </div>

        <Divider />

        <div className={s.actions}>
          <Button
            variant="secondary"
            onClick={closeDrawer}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            loading={isSubmitting}
            disabled={!isDirty || hasEmptyUserType || isSubmitting}
          >
            Save
          </Button>
        </div>
      </Stack>
    </Drawer>
  );
}
