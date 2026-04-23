import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { OnboardingGuard } from '@/components/shared/OnboardingGuard';
import { AppHotkeys } from '@/components/shared/app-hotkeys';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { orgId } = await auth();

  // Si no hay organización seleccionada, redirigimos o manejamos (Clerk hace esto, pero es buen fallback).
  if (!orgId) {
    // Si queremos obligar al Onboarding o selección org, clerk components como <OrganizationList /> son útiles.
  }

  return (
    <OnboardingGuard>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
        <AppHotkeys />
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </OnboardingGuard>
  );
}
