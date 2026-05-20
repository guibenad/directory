"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  uploadUrl?: string;
};

export function PhotoUploader({
  photos,
  onChange,
  maxPhotos = 30,
  uploadUrl = "/api/mon-compte/upload",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (files: FileList) => {
      setError(null);
      const toUpload = Array.from(files).slice(0, maxPhotos - photos.length);
      if (toUpload.length === 0) return;

      setUploading(true);
      const uploaded: string[] = [];
      let done = 0;
      for (const file of toUpload) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
          });
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            if (body.error === "storage_not_configured") {
              setError(
                "Le stockage photos n'est pas encore configuré. Ajoutez Supabase Storage ou saisissez une URL directement.",
              );
            } else if (body.error === "file_too_large") {
              setError(`${file.name} : fichier trop volumineux (max 8 Mo).`);
            } else if (body.error === "invalid_type") {
              setError(`${file.name} : format non supporté (JPG, PNG, WebP, AVIF).`);
            } else {
              setError(`Échec pour ${file.name}.`);
            }
            continue;
          }
          const { url } = (await res.json()) as { url: string };
          uploaded.push(url);
        } catch {
          setError("Erreur réseau pendant l'upload.");
        }
        done += 1;
        setProgress(Math.round((done / toUpload.length) * 100));
      }

      if (uploaded.length > 0) onChange([...photos, ...uploaded]);
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    },
    [photos, onChange, maxPhotos, uploadUrl],
  );

  function removePhoto(idx: number) {
    onChange(photos.filter((_, i) => i !== idx));
  }

  function movePhoto(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    onChange(next);
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) void upload(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-r2 border-2 border-dashed border-border bg-bg3 p-6 text-center transition-colors hover:border-amber"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
          disabled={uploading || photos.length >= maxPhotos}
        />
        <span className="font-syne text-[14px] font-semibold text-text">
          {uploading ? `Upload en cours — ${progress}%` : "Glissez vos photos ici"}
        </span>
        <span className="text-[12px] text-text3">
          {uploading
            ? "Merci de patienter"
            : `ou cliquez pour parcourir · JPG/PNG/WebP · 8 Mo max · ${photos.length}/${maxPhotos} photos`}
        </span>
      </label>

      {error ? (
        <p className="rounded-lg bg-red-bg px-3 py-2 text-[12.5px] text-red">{error}</p>
      ) : null}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((url, idx) => (
            <div
              key={url + idx}
              className="group relative overflow-hidden rounded-r2 border border-border bg-bg3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                className="aspect-video w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => movePhoto(idx, -1)}
                    disabled={idx === 0}
                    className="rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] text-[#0F1117] disabled:opacity-40"
                    title="Monter"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(idx, 1)}
                    disabled={idx === photos.length - 1}
                    className="rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] text-[#0F1117] disabled:opacity-40"
                    title="Descendre"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="rounded-md bg-red px-1.5 py-0.5 text-[11px] text-white"
                >
                  Supprimer
                </button>
              </div>
              {idx === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold text-[#0F1117]">
                  Principale
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
