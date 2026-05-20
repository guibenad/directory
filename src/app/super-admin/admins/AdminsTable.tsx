type Admin = {
  id: string;
  email: string;
  name: string | null;
  role: "SUPER_ADMIN" | "DIRECTORY_ADMIN" | "COMPANY";
  directoryName: string | null;
  createdAt: string;
};

export function AdminsTable({ admins }: { admins: Admin[] }) {
  return (
    <div className="overflow-hidden rounded-r2 border border-border bg-card">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Nom", "Email", "Rôle", "Annuaire", "Créé le"].map((h) => (
              <th
                key={h}
                className="border-b border-border px-6 py-[10px] text-left text-[11.5px] font-medium uppercase tracking-[0.7px] text-text3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {admins.map((a) => (
            <tr key={a.id} className="border-b border-border last:border-0 hover:bg-bg3">
              <td className="px-6 py-[14px] text-[13.5px] text-text">{a.name ?? "—"}</td>
              <td className="px-6 py-[14px] text-[13px] text-text2">{a.email}</td>
              <td className="px-6 py-[14px]">
                <span
                  className={[
                    "inline-flex rounded-md px-[10px] py-[4px] text-[12px] font-medium",
                    a.role === "SUPER_ADMIN"
                      ? "bg-amber-bg text-amber"
                      : "bg-blue-bg text-blue",
                  ].join(" ")}
                >
                  {a.role === "SUPER_ADMIN" ? "Super admin" : "Admin annuaire"}
                </span>
              </td>
              <td className="px-6 py-[14px] text-[13px] text-text2">
                {a.directoryName ?? "—"}
              </td>
              <td className="px-6 py-[14px] text-[13px] text-text3">
                {new Date(a.createdAt).toLocaleDateString("fr-FR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
