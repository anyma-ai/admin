import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useCasinoChatDetails } from '@/app/casino';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  Grid,
  Section,
  Skeleton,
  Stack,
  Typography,
} from '@/atoms';
import {
  type CasinoChatItem,
  type CasinoChatItemEvent,
  CasinoChatItemType,
} from '@/common/types';

import s from './CasinoPages.module.scss';
import {
  formatCasinoDate,
  formatCasinoLabel,
  formatCasinoUser,
  formatCasinoUserMeta,
} from './casinoUtils';

function getItemTone(type: CasinoChatItem['type']) {
  if (type === CasinoChatItemType.Ai) return 'success' as const;
  if (type === CasinoChatItemType.Event) return 'warning' as const;
  return 'accent' as const;
}

function formatItemType(type: CasinoChatItem['type']) {
  if (type === CasinoChatItemType.Ai) return 'AI';
  return formatCasinoLabel(type);
}

function isEventItem(item: CasinoChatItem): item is CasinoChatItemEvent {
  return item.type === CasinoChatItemType.Event;
}

export function CasinoChatDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chatId = id ?? '';
  const { data, error, isLoading, refetch } = useCasinoChatDetails(
    chatId || null,
  );
  const history = useMemo(() => data?.history ?? [], [data?.history]);
  const showSkeleton = isLoading && !data;
  const showEmpty = !showSkeleton && !error && !data;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.titleBlock}>
          <Typography variant="h2">Chat details</Typography>
          {data ? (
            <Typography variant="caption" tone="muted">
              {data.id}
            </Typography>
          ) : null}
        </div>
        <Button variant="secondary" onClick={() => navigate('/casino')}>
          Back to chats
        </Button>
      </div>

      {error ? (
        <Stack className={s.state} gap="12px">
          <Alert
            title="Unable to load casino chat"
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

      {showEmpty ? (
        <EmptyState title="Casino chat not found" description="Check the ID." />
      ) : null}

      <Section
        title="Overview"
        description={data ? `${history.length} history items` : undefined}
      >
        {showSkeleton ? (
          <Grid columns={3} className={s.overviewGrid}>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={`overview-${index}`} width={180} height={14} />
            ))}
          </Grid>
        ) : data ? (
          <Grid columns={3} className={s.overviewGrid}>
            <Field label="User">
              <Typography variant="body">{formatCasinoUser(data.user)}</Typography>
              <Typography variant="caption" tone="muted">
                {formatCasinoUserMeta(data.user)}
              </Typography>
            </Field>
            <Field label="Level">
              <Badge tone="accent" outline>
                {data.level}
              </Badge>
            </Field>
            <Field label="Created">
              <Typography variant="body">
                {formatCasinoDate(data.createdAt)}
              </Typography>
            </Field>
          </Grid>
        ) : null}
      </Section>

      <Section
        title="History"
        description={
          data && history.length > 0
            ? `Showing ${history.length} history items`
            : undefined
        }
      >
        {showSkeleton ? (
          <Stack gap="12px">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={`history-${index}`} width="100%" height={76} />
            ))}
          </Stack>
        ) : history.length === 0 ? (
          <EmptyState
            title="No history"
            description="This casino chat has no history yet."
          />
        ) : (
          <div className={s.timeline}>
            {history.map((item, index) => (
              <div
                className={s.timelineItem}
                key={item.id || `${item.createdAt}-${index}`}
              >
                <div className={s.historyMeta}>
                  <Badge tone={getItemTone(item.type)} outline>
                    {formatItemType(item.type)}
                  </Badge>
                  {isEventItem(item) ? (
                    <Badge tone="warning" outline>
                      {formatCasinoLabel(item.event)}
                    </Badge>
                  ) : null}
                  <Typography variant="caption" tone="muted">
                    {formatCasinoDate(item.createdAt)}
                  </Typography>
                </div>

                {item.content ? (
                  <Typography variant="body" className={s.messageContent}>
                    {item.content}
                  </Typography>
                ) : (
                  <Typography variant="caption" tone="muted">
                    No content
                  </Typography>
                )}

                {isEventItem(item) && item.mediaId ? (
                  <Typography variant="caption" tone="muted">
                    Media: {item.mediaId}
                  </Typography>
                ) : null}

                {isEventItem(item) && item.instruction ? (
                  <div className={s.timelineInstruction}>
                    <Typography variant="caption" tone="muted">
                      Instruction
                    </Typography>
                    <Typography variant="body" className={s.messageContent}>
                      {item.instruction}
                    </Typography>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
