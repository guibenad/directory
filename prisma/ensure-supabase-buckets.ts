import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_LISTINGS_BUCKET ?? "listings";

const MAX_BYTES = 8 * 1024 * 1024; // 8 Mo
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

async function main() {
  if (!url || !serviceRoleKey) {
    console.error(
      "✗ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error("✗ Impossible de lister les buckets :", listErr.message);
    process.exit(1);
  }

  const found = existing?.find((b) => b.name === BUCKET);
  if (!found) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: ALLOWED,
    });
    if (error) {
      console.error(`✗ Échec création bucket "${BUCKET}" :`, error.message);
      process.exit(1);
    }
    console.log(`✓ Bucket "${BUCKET}" créé (public, 8 Mo, JPG/PNG/WebP/AVIF)`);
  } else {
    const { error } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: ALLOWED,
    });
    if (error) {
      console.error(`✗ Échec mise à jour bucket "${BUCKET}" :`, error.message);
      process.exit(1);
    }
    console.log(`✓ Bucket "${BUCKET}" déjà présent — config mise à jour`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
