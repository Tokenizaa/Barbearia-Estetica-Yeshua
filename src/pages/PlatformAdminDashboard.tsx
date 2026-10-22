import React from 'react';
import { UnifiedAdminDashboard } from './UnifiedAdminDashboard';

export function PlatformAdminDashboard() {
  return (
    <UnifiedAdminDashboard
      initialSection="rede-saloes"
      onBackToApp={() => {
        window.location.assign('/');
      }}
    />
  );
}
