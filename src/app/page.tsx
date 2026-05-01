import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "InvFlow",
  description: "Plataforma de inventario multiempresa enfocada en biblioteca y negocio general.",
};

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  redirect("/dashboard");
}
