// pages/login/index.tsx
import React from 'react';
import type { NextPage } from 'next';
import { LoginPage } from '@galicea-lab/nextjs-keycloak-auth';
import type { KeycloakConfig } from '@galicea-lab/nextjs-keycloak-auth';
import CONFIG from '@/configs/config';
import AuthLayout from '@/layouts/AuthLayout';

// 2026-11-18: konfiguracja Keycloaka pochodzi z globalnego CONFIG
// (src/configs/config.ts) - to samo źródło zasila AuthProvider w _app.tsx,
// dzięki czemu logowanie i odświeżanie tokenu nie mogą się rozjechać.
const keycloakConfig_my: KeycloakConfig = {
  keycloak: CONFIG.keycloak,
  keycloak_client: CONFIG.keycloak_client,
};

const Login: NextPage = () => {
  return <LoginPage keycloakConfig={keycloakConfig_my} />;
};

// 2026-11-18: ekran logowania bez paska bocznego (AuthLayout).
Login.getLayout = (page: React.ReactElement) => <AuthLayout>{page}</AuthLayout>;

export default Login;
