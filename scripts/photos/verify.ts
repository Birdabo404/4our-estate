import { PHOTOS, PHOTO_CATEGORIES, photosBy, type Photo } from "../../src/lib/photography/catalog";

const CONCURRENCY = 8;

async function check(photo: Photo): Promise<string | null> {
  const res = await fetch(`${photo.url}?w=400&q=60`);
  const type = res.headers.get("content-type");
  await res.arrayBuffer();
  return res.status === 200 && type === "image/jpeg" ? null : `${res.status} ${type}`;
}

async function main() {
  const failures: string[] = [];
  const queue = [...PHOTOS];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let photo = queue.shift(); photo; photo = queue.shift()) {
        const problem = await check(photo);
        console.log(`${problem ? "FAIL" : "OK  "} ${photo.category.padEnd(25)} ${photo.url}${problem ? ` ${problem}` : ""}`);
        if (problem) failures.push(photo.id);
      }
    }),
  );
  console.log(PHOTO_CATEGORIES.map((c) => `${c}=${photosBy(c).length}`).join(" "));
  console.log(`${PHOTOS.length - failures.length}/${PHOTOS.length} OK`);
  if (failures.length) process.exit(1);
}

main();
