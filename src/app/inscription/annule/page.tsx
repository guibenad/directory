import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="theme-public flex min-h-screen items-center justify-center px-8">
      <div className="max-w-md rounded-[14px] border border-[#E8E8E0] bg-white p-10 text-center">
        <h1 className="font-syne text-[24px] font-bold">Paiement annulé</h1>
        <p className="mt-2 text-[14px] text-[#555]">
          Aucun prélèvement n'a été effectué. Vous pouvez reprendre votre inscription à tout
          moment.
        </p>
        <Link
          href="/inscription"
          className="mt-6 inline-block rounded-lg bg-[#F5A623] px-5 py-2 font-bold text-[#1A1A1A]"
        >
          Réessayer
        </Link>
      </div>
    </div>
  );
}
