"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { deleteListingImage, setCoverImage, uploadListingImage } from "@/lib/actions/listings";
import type { PropertyDetail } from "@/lib/domain/types";
import { imageExtension, MAX_IMAGE_BYTES } from "@/lib/validation/listing";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type UploadRow = {
  key: string;
  name: string;
  phase: "uploading" | "added" | "error";
  message?: string;
};

function localSrc(url: string): boolean {
  return url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost");
}

function fileProblem(file: File): string | null {
  if (!imageExtension(file.type)) return "Use a JPEG, PNG, WebP, or AVIF image.";
  if (file.size > MAX_IMAGE_BYTES) return "Images must be 8 MB or smaller.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

export function ImageManager({ property }: { property: PropertyDetail }) {
  const router = useRouter();
  const { toast } = useToast();
  const [alt, setAlt] = useState(property.title);
  const [altError, setAltError] = useState<string>();
  const [over, setOver] = useState(false);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  async function upload(files: File[]) {
    const description = alt.trim();
    if (description.length < 3) {
      setAltError("Describe the photo.");
      return;
    }
    setAltError(undefined);
    setBusy(true);
    let added = 0;
    for (const file of files) {
      const key = `${file.name}-${file.size}-${crypto.randomUUID()}`;
      const problem = fileProblem(file);
      if (problem) {
        setRows((current) => [...current, { key, name: file.name, phase: "error", message: problem }]);
        continue;
      }
      setRows((current) => [...current, { key, name: file.name, phase: "uploading" }]);
      const formData = new FormData();
      formData.set("propertyId", property.id);
      formData.set("alt", description);
      formData.set("file", file);
      const result = await uploadListingImage(null, formData);
      if (!result.ok) {
        const message = result.fieldErrors?.file ?? result.formError ?? "The photograph could not be added.";
        setRows((current) => current.map((row) => (row.key === key ? { ...row, phase: "error", message } : row)));
        continue;
      }
      added += 1;
      setRows((current) => current.map((row) => (row.key === key ? { ...row, phase: "added" } : row)));
    }
    setBusy(false);
    if (added > 0) {
      toast({ title: added === 1 ? "Photograph added" : `${added} photographs added`, tone: "positive" });
      router.refresh();
    }
  }

  return (
    <Panel>
      <h2 className="font-display text-heading">Photographs</h2>
      <p className="mt-2 max-w-[42ch] text-small text-ink-muted">
        The first frame is the cover. JPEG, PNG, WebP, or AVIF, up to 8 MB.
      </p>
      <div className="mt-8">
        <Field label="Description for these frames" error={altError} required>
          <Input name="photoAlt" value={alt} onChange={(event) => setAlt(event.target.value)} />
        </Field>
      </div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          void upload([...event.dataTransfer.files]);
        }}
        className={cn(
          "mt-6 flex cursor-pointer flex-col items-start gap-2 rounded-[1.25rem] bg-paper px-6 py-10 ring-1 ring-inset ring-ink/10 transition-colors duration-300 ease-settle",
          over && "ring-accent",
        )}
      >
        <span className="font-display text-title">Drop photographs here</span>
        <span className="text-small text-ink-muted">or choose files from this device</span>
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const files = event.target.files ? [...event.target.files] : [];
            event.target.value = "";
            if (files.length > 0) void upload(files);
          }}
        />
      </label>
      {rows.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-2" aria-live="polite">
          {rows.map((row) => (
            <li key={row.key} className="flex items-baseline justify-between gap-4 text-small">
              <span className="truncate text-ink">{row.name}</span>
              <span className={row.phase === "error" ? "text-danger" : "text-ink-muted"}>
                {row.phase === "uploading" ? "Uploading…" : row.phase === "added" ? "Added" : row.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {property.images.length > 0 ? (
        <ul className="mt-10 grid gap-8 sm:grid-cols-2">
          {property.images.map((image) => (
            <li key={image.id} className="flex flex-col gap-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-photo bg-paper-sunken">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 768px) 30vw, 100vw"
                  unoptimized={localSrc(image.url)}
                  className="object-cover"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-small text-ink-muted">{image.position === 0 ? "Cover" : image.alt}</p>
                <div className="flex flex-wrap gap-2">
                  {image.position === 0 ? null : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const formData = new FormData();
                        formData.set("propertyId", property.id);
                        formData.set("imageId", image.id);
                        const result = await setCoverImage(null, formData);
                        if (!result.ok) {
                          toast({ title: result.formError ?? "Could not set the cover.", tone: "danger" });
                          return;
                        }
                        toast({ title: "Cover updated", tone: "positive" });
                        router.refresh();
                      }}
                    >
                      Set as cover
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRemoveId(image.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-small text-ink-muted">No photographs yet.</p>
      )}
      <RemovePhoto
        imageId={removeId}
        propertyId={property.id}
        onClose={() => setRemoveId(null)}
      />
    </Panel>
  );
}

function RemovePhoto({
  imageId,
  propertyId,
  onClose,
}: {
  imageId: string | null;
  propertyId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  return (
    <Dialog
      open={imageId !== null}
      onClose={onClose}
      title="Remove this photograph?"
      description="It is deleted from the listing."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Keep it
          </Button>
          <Button
            type="button"
            disabled={!imageId}
            onClick={async () => {
              if (!imageId) return;
              const formData = new FormData();
              formData.set("propertyId", propertyId);
              formData.set("imageId", imageId);
              const result = await deleteListingImage(null, formData);
              if (!result.ok) {
                toast({ title: result.formError ?? "Could not remove the photograph.", tone: "danger" });
                return;
              }
              toast({ title: "Photograph removed", tone: "positive" });
              onClose();
              router.refresh();
            }}
          >
            Remove
          </Button>
        </>
      }
    />
  );
}
