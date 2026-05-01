import { SignIn } from '@clerk/nextjs';

import { AuthShell } from '@/features/auth/components/auth-shell';

export default function LoginPage() {
  return (
    <AuthShell
      title="Accede y continúa con tu inventario"
      subtitle="Inicia sesión para entrar a tu organización y seguir trabajando con tus productos, categorías e importaciones."
    >
      <SignIn
        path="/login"
        routing="path"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          variables: {
            colorPrimary: "#111111",
            colorText: "#111111",
            colorTextSecondary: "#555555",
            colorInputText: "#111111",
            colorInputBackground: "#f7f7f7",
            colorBackground: "#ffffff",
            borderRadius: "0.9rem",
          },
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none",
            card: "w-full shadow-none bg-transparent p-0",
            headerTitle: "text-2xl font-semibold text-gray-900",
            headerSubtitle: "text-sm text-gray-500",
            socialButtonsBlockButton:
              "h-12 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-none",
            dividerLine: "bg-gray-200",
            dividerText: "text-gray-400",
            formFieldLabel: "text-gray-700 text-sm font-medium",
            formFieldInput:
              "h-12 border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 shadow-none rounded-xl",
            formButtonPrimary:
              "h-12 bg-gray-900 text-white hover:bg-gray-800 shadow-none rounded-xl",
            footer: "hidden",
            footerAction: "hidden",
            identityPreviewEditButton: "text-gray-600",
          },
          layout: {
            socialButtonsPlacement: "top",
            socialButtonsVariant: "blockButton",
            unsafe_disableDevelopmentModeWarnings: true,
          },
        }}
      />
    </AuthShell>
  );
}
