import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { CompanyProfileForm } from "./CompanyProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const session = await requireSession();
  if (!session?.user.companyId) notFound();
  const company = await prisma.company.findUnique({ where: { id: session.user.companyId } });
  if (!company) notFound();

  return (
    <div className="space-y-4">
      <h1 className="font-syne text-[22px] font-bold">Profil entreprise</h1>
      <p className="text-[13.5px] text-text3">
        Ces informations sont partagées sur toutes vos fiches (nom, email, téléphone, site). La
        description, l'adresse et les photos se gèrent par fiche.
      </p>
      <CompanyProfileForm
        company={{
          name: company.name,
          phone: company.phone,
          website: company.website,
          email: company.email,
        }}
      />
    </div>
  );
}
