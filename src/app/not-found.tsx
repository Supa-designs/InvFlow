import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          404
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Ruta no encontrada</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          La vista que intentaste abrir no existe o ya no está disponible.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        Volver al dashboard
      </Link>
    </div>
  );
}
