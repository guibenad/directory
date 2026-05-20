import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="theme-public flex min-h-screen items-center justify-center px-8">
      <div className="max-w-md rounded-[14px] border border-[#E8E8E0] bg-white p-10 text-center">
        <div className="mb-4 text-[40px]">✅</div>
        <h1 className="font-syne text-[24px] font-bold">Bienvenue sur LocalPro</h1>
        <p className="mt-2 text-[14px] text-[#555]">
          Votre abonnement est activé. Vous allez recevoir un email de confirmation avec le lien
          d'accès à votre espace entreprise.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-[#1A1A1A] px-5 py-2 text-white"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
