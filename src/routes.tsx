import { Route, Routes } from 'react-router-dom';

import { AuthGuard } from '@/app/auth';
import {
  AdminsPage,
  AnalyticsPage,
  AuthCallbackPage,
  AuthPage,
  BroadcastPage,
  CharacterDetailsPage,
  CharacterImageDetailsPage,
  CharacterImagesPage,
  CharactersPage,
  ChatDetailsPage,
  ChatsPage,
  ConfirmEmailPage,
  DatasetDetailsPage,
  DatasetsPage,
  ForgotPasswordPage,
  GenerateImagePage,
  GenerationDetailsPage,
  GenerationsPage,
  GiftDetailsPage,
  GiftsPage,
  LogsPage,
  LorasPage,
  PlansPage,
  PoseCreatePage,
  PoseFindSimilarPage,
  PosesPage,
  PoseUpdatePage,
  ProfilePage,
  PromptCreatePage,
  PromptsPage,
  PromptUpdatePage,
  ResetPasswordPage,
  ScenarioGenCreatePage,
  ScenarioGenDetailsPage,
  ScenarioGenPage,
  UiKitPage,
  UsersPage,
} from '@/pages';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/confirm" element={<ConfirmEmailPage />} />
      <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset" element={<ResetPasswordPage />} />
      <Route element={<AuthGuard />}>
        <Route path="/" element={<AnalyticsPage />} />
        <Route path="/ui" element={<UiKitPage />} />
        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/characters/:id" element={<CharacterDetailsPage />} />
        <Route path="/character-images" element={<CharacterImagesPage />} />
        <Route
          path="/character-images/:id"
          element={<CharacterImageDetailsPage />}
        />
        <Route path="/admins" element={<AdminsPage />} />
        <Route path="/broadcast" element={<BroadcastPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/chats/:id" element={<ChatDetailsPage />} />
        <Route path="/generations/new" element={<GenerateImagePage />} />
        <Route path="/generations" element={<GenerationsPage />} />
        <Route path="/generations/:id" element={<GenerationDetailsPage />} />
        <Route path="/gifts" element={<GiftsPage />} />
        <Route path="/gifts/:id" element={<GiftDetailsPage />} />
        <Route path="/datasets" element={<DatasetsPage />} />
        <Route path="/datasets/:id" element={<DatasetDetailsPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/loras" element={<LorasPage />} />
        <Route path="/poses" element={<PosesPage />} />
        <Route path="/poses/find-similar" element={<PoseFindSimilarPage />} />
        <Route path="/poses/new" element={<PoseCreatePage />} />
        <Route path="/poses/:id" element={<PoseUpdatePage />} />
        <Route path="/prompts" element={<PromptsPage />} />
        <Route path="/prompts/new" element={<PromptCreatePage />} />
        <Route path="/prompts/:id" element={<PromptUpdatePage />} />
        <Route path="/scenario-gen" element={<ScenarioGenPage />} />
        <Route path="/scenario-gen/new" element={<ScenarioGenCreatePage />} />
        <Route path="/scenario-gen/:id" element={<ScenarioGenDetailsPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}
