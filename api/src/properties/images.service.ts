import { FileTypeValidator, Injectable, MaxFileSizeValidator, ParseFilePipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { AuthUser } from '../auth/auth-user.js';
import { ApiException, badRequest, notFound } from '../common/api.exception.js';
import { MAX_IMAGE_BYTES, type PropertyImage } from '../common/contracts.js';
import { uploadsDir } from '../common/uploads.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { requireManagedProperty } from './access.js';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

export const imageFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({
      maxSize: MAX_IMAGE_BYTES,
      errorMessage: 'Images must be 8 MB or smaller.',
    }),
    new FileTypeValidator({
      fileType: /^image\/(jpeg|png|webp|avif)$/,
      errorMessage: 'Use a JPEG, PNG, WebP, or AVIF image.',
      fallbackToMimetype: true,
    }),
  ],
  exceptionFactory: (error: string) =>
    new ApiException(400, 'VALIDATION_FAILED', 'Check the highlighted fields.', { file: error }),
});

@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async save(propertyId: string, user: AuthUser, file: UploadedImage, alt: string): Promise<PropertyImage> {
    await requireManagedProperty(this.prisma, propertyId, user);
    const extension = EXTENSIONS[file.mimetype];
    if (!extension) {
      throw badRequest('Use a JPEG, PNG, WebP, or AVIF image.', {
        file: 'Use a JPEG, PNG, WebP, or AVIF image.',
      });
    }
    const id = randomUUID();
    const relative = `${user.id}/${propertyId}/${id}.${extension}`;
    const absolute = join(uploadsDir(), relative);
    await mkdir(join(uploadsDir(), user.id, propertyId), { recursive: true });
    await writeFile(absolute, file.buffer);
    const origin = this.config.getOrThrow<string>('PUBLIC_API_ORIGIN');
    try {
      const last = await this.prisma.propertyImage.aggregate({
        where: { propertyId },
        _max: { position: true },
      });
      const position = last._max.position === null ? 0 : last._max.position + 1;
      const image = await this.prisma.propertyImage.create({
        data: {
          id,
          propertyId,
          url: `${origin}/uploads/${relative}`,
          storagePath: relative,
          alt,
          position,
        },
      });
      return { id: image.id, url: image.url, alt: image.alt, position: image.position };
    } catch (error) {
      await unlink(absolute).catch(() => undefined);
      throw error;
    }
  }

  async remove(propertyId: string, imageId: string, user: AuthUser): Promise<{ id: string }> {
    await requireManagedProperty(this.prisma, propertyId, user);
    const image = await this.prisma.propertyImage.findFirst({ where: { id: imageId, propertyId } });
    if (!image) throw notFound('Photo not found.');
    await this.prisma.propertyImage.delete({ where: { id: imageId } });
    if (image.storagePath) {
      await unlink(join(uploadsDir(), image.storagePath)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
    return { id: imageId };
  }

  async makeCover(propertyId: string, imageId: string, user: AuthUser): Promise<PropertyImage> {
    await requireManagedProperty(this.prisma, propertyId, user);
    const image = await this.prisma.$transaction(async (tx) => {
      const images = await tx.propertyImage.findMany({
        where: { propertyId },
        orderBy: { position: 'asc' },
      });
      const target = images.find((row) => row.id === imageId);
      if (!target) throw notFound('Photo not found.');
      const ordered = [target, ...images.filter((row) => row.id !== imageId)];
      for (const row of images) {
        await tx.propertyImage.update({
          where: { id: row.id },
          data: { position: row.position + 10_000 },
        });
      }
      for (let index = 0; index < ordered.length; index += 1) {
        const row = ordered[index];
        if (!row) continue;
        await tx.propertyImage.update({ where: { id: row.id }, data: { position: index } });
      }
      return tx.propertyImage.findUniqueOrThrow({ where: { id: imageId } });
    });
    return { id: image.id, url: image.url, alt: image.alt, position: image.position };
  }
}
