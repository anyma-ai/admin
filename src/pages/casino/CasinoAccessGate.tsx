import { type FormEvent, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { Button, Container, Field, Input, Typography } from '@/atoms';

import s from './CasinoPages.module.scss';

const CASINO_ACCESS_PASSWORD = 'nightcrew';
const CASINO_ACCESS_STORAGE_KEY = 'aera-admin:casino:access';
const CASINO_ACCESS_STORAGE_VALUE = 'granted';

function readCasinoAccess() {
  try {
    return (
      window.localStorage.getItem(CASINO_ACCESS_STORAGE_KEY) ===
      CASINO_ACCESS_STORAGE_VALUE
    );
  } catch {
    return false;
  }
}

function writeCasinoAccess(value: boolean) {
  try {
    if (value) {
      window.localStorage.setItem(
        CASINO_ACCESS_STORAGE_KEY,
        CASINO_ACCESS_STORAGE_VALUE,
      );
      return;
    }

    window.localStorage.removeItem(CASINO_ACCESS_STORAGE_KEY);
  } catch {
    // Local storage access can fail in restricted browser contexts.
  }
}

function CasinoLogin({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [invalid, setInvalid] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password === CASINO_ACCESS_PASSWORD) {
      writeCasinoAccess(true);
      setInvalid(false);
      onUnlock();
      return;
    }

    setInvalid(true);
  };

  return (
    <div className={s.accessPage}>
      <form className={s.accessPanel} onSubmit={handleSubmit}>
        <div className={s.accessTitle}>
          <Typography variant="h2">Casino</Typography>
          <Typography variant="body" tone="muted">
            Enter access phrase.
          </Typography>
        </div>
        <div className={s.accessForm}>
          <Field
            label="Access phrase"
            labelFor="casino-access"
            error={invalid ? 'Incorrect access phrase.' : undefined}
          >
            <Input
              id="casino-access"
              type="password"
              value={password}
              invalid={invalid}
              onChange={(event) => {
                setPassword(event.target.value);
                setInvalid(false);
              }}
              autoFocus
              fullWidth
            />
          </Field>
          <Button type="submit" fullWidth>
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}

function CasinoShell({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const isAnalytics = location.pathname.startsWith('/casino/analytics');

  return (
    <div className={s.standalone}>
      <header className={s.shellHeader}>
        <div className={s.shellHeaderInner}>
          <div className={s.brand}>
            <Typography variant="h2">Casino</Typography>
            <Typography variant="caption" tone="muted">
              Admin view
            </Typography>
          </div>
          <div className={s.shellActions}>
            <nav className={s.nav} aria-label="Casino navigation">
              <Button
                as={NavLink}
                to="/casino"
                end
                variant={isAnalytics ? 'secondary' : 'primary'}
                size="sm"
              >
                Chats
              </Button>
              <Button
                as={NavLink}
                to="/casino/analytics"
                variant={isAnalytics ? 'primary' : 'secondary'}
                size="sm"
              >
                Analytics
              </Button>
            </nav>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <Container size="wide">
        <Outlet />
      </Container>
    </div>
  );
}

export function CasinoAccessGate() {
  const [hasAccess, setHasAccess] = useState(readCasinoAccess);

  if (!hasAccess) {
    return <CasinoLogin onUnlock={() => setHasAccess(true)} />;
  }

  return (
    <CasinoShell
      onLogout={() => {
        writeCasinoAccess(false);
        setHasAccess(false);
      }}
    />
  );
}
