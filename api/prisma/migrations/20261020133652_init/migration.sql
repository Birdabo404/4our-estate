-- CreateEnum
CREATE TYPE "Role" AS ENUM ('buyer', 'agent', 'admin');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('sale', 'rent');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('house', 'condominium', 'townhouse', 'villa', 'penthouse', 'lot');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'pending', 'published', 'sold', 'archived');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('new', 'contacted', 'closed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'buyer',
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "agency" TEXT,
    "licenseNo" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "agentId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "listingType" "ListingType" NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'draft',
    "pricePhp" BIGINT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" DECIMAL(4,1) NOT NULL,
    "floorAreaSqm" DECIMAL(10,2) NOT NULL,
    "lotAreaSqm" DECIMAL(12,2),
    "parkingSlots" INTEGER NOT NULL DEFAULT 0,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yearBuilt" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_images" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "storagePath" TEXT,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "userId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("userId","propertyId")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "buyerId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "preferredViewingDate" DATE,
    "status" "InquiryStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "properties_slug_key" ON "properties"("slug");

-- CreateIndex
CREATE INDEX "properties_status_city_idx" ON "properties"("status", "city");

-- CreateIndex
CREATE INDEX "properties_pricePhp_idx" ON "properties"("pricePhp");

-- CreateIndex
CREATE INDEX "properties_publishedAt_idx" ON "properties"("publishedAt");

-- CreateIndex
CREATE INDEX "properties_agentId_idx" ON "properties"("agentId");

-- CreateIndex
CREATE INDEX "property_images_propertyId_idx" ON "property_images"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "property_images_propertyId_position_key" ON "property_images"("propertyId", "position");

-- CreateIndex
CREATE INDEX "favorites_propertyId_idx" ON "favorites"("propertyId");

-- CreateIndex
CREATE INDEX "inquiries_propertyId_idx" ON "inquiries"("propertyId");

-- CreateIndex
CREATE INDEX "inquiries_buyerId_idx" ON "inquiries"("buyerId");

-- CreateIndex
CREATE INDEX "inquiries_email_createdAt_idx" ON "inquiries"("email", "createdAt");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "users" ADD CONSTRAINT "users_full_name_len" CHECK (char_length("fullName") BETWEEN 1 AND 120);
ALTER TABLE "users" ADD CONSTRAINT "users_phone_len" CHECK ("phone" IS NULL OR char_length("phone") BETWEEN 8 AND 32);
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_len" CHECK ("avatarUrl" IS NULL OR char_length("avatarUrl") BETWEEN 1 AND 500);
ALTER TABLE "users" ADD CONSTRAINT "users_agency_len" CHECK ("agency" IS NULL OR char_length("agency") BETWEEN 1 AND 120);
ALTER TABLE "users" ADD CONSTRAINT "users_license_len" CHECK ("licenseNo" IS NULL OR char_length("licenseNo") BETWEEN 1 AND 40);
ALTER TABLE "users" ADD CONSTRAINT "users_bio_len" CHECK ("bio" IS NULL OR char_length("bio") BETWEEN 1 AND 800);

ALTER TABLE "properties" ADD CONSTRAINT "properties_slug_shape" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "properties" ADD CONSTRAINT "properties_title_len" CHECK (char_length("title") BETWEEN 4 AND 140);
ALTER TABLE "properties" ADD CONSTRAINT "properties_description_len" CHECK (char_length("description") BETWEEN 1 AND 8000);
ALTER TABLE "properties" ADD CONSTRAINT "properties_price_positive" CHECK ("pricePhp" > 0);
ALTER TABLE "properties" ADD CONSTRAINT "properties_bedrooms" CHECK ("bedrooms" BETWEEN 0 AND 30);
ALTER TABLE "properties" ADD CONSTRAINT "properties_bathrooms" CHECK ("bathrooms" >= 0 AND "bathrooms" <= 30);
ALTER TABLE "properties" ADD CONSTRAINT "properties_floor_area" CHECK ("floorAreaSqm" >= 0);
ALTER TABLE "properties" ADD CONSTRAINT "properties_lot_area" CHECK ("lotAreaSqm" IS NULL OR "lotAreaSqm" > 0);
ALTER TABLE "properties" ADD CONSTRAINT "properties_parking" CHECK ("parkingSlots" BETWEEN 0 AND 40);
ALTER TABLE "properties" ADD CONSTRAINT "properties_neighborhood_len" CHECK (char_length("neighborhood") BETWEEN 1 AND 80);
ALTER TABLE "properties" ADD CONSTRAINT "properties_city_len" CHECK (char_length("city") BETWEEN 1 AND 80);
ALTER TABLE "properties" ADD CONSTRAINT "properties_province_len" CHECK (char_length("province") BETWEEN 1 AND 80);
ALTER TABLE "properties" ADD CONSTRAINT "properties_address_len" CHECK (char_length("address") BETWEEN 1 AND 200);
ALTER TABLE "properties" ADD CONSTRAINT "properties_latitude" CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90);
ALTER TABLE "properties" ADD CONSTRAINT "properties_longitude" CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);
ALTER TABLE "properties" ADD CONSTRAINT "properties_year_built" CHECK ("yearBuilt" IS NULL OR "yearBuilt" BETWEEN 1800 AND 2100);

ALTER TABLE "property_images" ADD CONSTRAINT "property_images_url_len" CHECK (char_length("url") BETWEEN 1 AND 800);
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_path_len" CHECK ("storagePath" IS NULL OR char_length("storagePath") BETWEEN 1 AND 400);
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_alt_len" CHECK (char_length("alt") BETWEEN 1 AND 300);
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_position" CHECK ("position" >= 0);

ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_name_len" CHECK (char_length("name") BETWEEN 2 AND 80);
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_email_shape" CHECK (char_length("email") BETWEEN 6 AND 160 AND "email" ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_phone_len" CHECK ("phone" IS NULL OR char_length("phone") BETWEEN 8 AND 32);
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_message_len" CHECK (char_length("message") BETWEEN 20 AND 2000);

CREATE INDEX "inquiries_email_hour_idx" ON "inquiries" (lower("email"), "createdAt" DESC);
