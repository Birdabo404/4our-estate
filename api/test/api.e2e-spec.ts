import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

process.env.DATABASE_URL = 'postgresql://estate:estate@localhost:5432/estate_test';
process.env.JWT_SECRET = 'test-jwt-secret-estate';
process.env.JWT_EXPIRES_IN = '1d';
process.env.PORT = '4000';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.PUBLIC_API_ORIGIN = 'http://localhost:4000';

const PASSWORD = 'Estate!2026';
const API = '/api/v1';
const ROOT = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(ROOT, '..');
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

type Session = { token: string; id: string; role: string };

function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

function expectData(res: request.Response): void {
  expect(res.body).toEqual(expect.objectContaining({ data: expect.anything() }));
  expect(res.body.error).toBeUndefined();
}

function expectError(res: request.Response, status: number, code: string): void {
  expect(res.status).toBe(status);
  expect(res.body.data).toBeUndefined();
  expect(res.body.error.statusCode).toBe(status);
  expect(res.body.error.code).toBe(code);
  expect(typeof res.body.error.message).toBe('string');
}

describe('estate API', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let buyer: Session;
  let otherBuyer: Session;
  let agentA: Session;
  let agentB: Session;
  let admin: Session;

  beforeAll(async () => {
    execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: PACKAGE_ROOT,
      env: process.env,
      stdio: 'inherit',
    });
    execFileSync(
      'docker',
      [
        'exec',
        'estate-postgres',
        'psql',
        '-U',
        'estate',
        '-d',
        'estate_test',
        '-c',
        'TRUNCATE TABLE inquiries, favorites, property_images, properties, users RESTART IDENTITY CASCADE',
      ],
      { stdio: 'inherit' },
    );
    execFileSync('npx', ['prisma', 'db', 'seed'], {
      cwd: PACKAGE_ROOT,
      env: process.env,
      stdio: 'inherit',
    });

    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    buyer = await login('camille.uy@4our.estate');
    otherBuyer = await login('joaquin.tan@4our.estate');
    agentA = await login('isabel.santos@4our.estate');
    agentB = await login('mateo.cruz@4our.estate');
    admin = await login('admin@4our.estate');
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function login(email: string): Promise<Session> {
    const res = await request(app.getHttpServer()).post(`${API}/auth/login`).send({ email, password: PASSWORD });
    expect(res.status).toBe(200);
    expectData(res);
    expect(res.body.data.user.kind).toBe('member');
    expect(res.body.data.user.email).toBe(email);
    return {
      token: res.body.data.accessToken as string,
      id: res.body.data.user.id as string,
      role: res.body.data.user.role as string,
    };
  }

  it('guests see no drafts, pending, or archived listings', async () => {
    const first = await request(app.getHttpServer()).get(`${API}/properties`);
    const second = await request(app.getHttpServer()).get(`${API}/properties?page=2`);
    expect(first.status).toBe(200);
    expectData(first);
    expectData(second);
    expect(first.body.meta).toEqual({ total: expect.any(Number), page: 1, pageSize: 12 });
    const items = [...first.body.data, ...second.body.data] as { slug: string; status: string }[];
    expect(items).toHaveLength(first.body.meta.total);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.status === 'published')).toBe(true);
    expect(items.some((item) => item.slug === 'tagaytay-highlands-villa')).toBe(false);
    expect(items.some((item) => item.slug === 'bgc-park-west-lease')).toBe(false);
    expect(items.some((item) => item.slug === 'bgc-grand-hyatt-residence')).toBe(false);
  });

  it('rejects non-numeric listing filters as numbers', async () => {
    const cases = [
      [`${API}/properties?minBeds=abc`, 'minBeds'],
      [`${API}/properties?minPrice=abc`, 'minPrice'],
      [`${API}/properties?maxPrice=nope`, 'maxPrice'],
      [`${API}/properties?page=abc`, 'page'],
      [`${API}/properties/featured?limit=abc`, 'limit'],
    ] as const;
    for (const [path, field] of cases) {
      const res = await request(app.getHttpServer()).get(path);
      expectError(res, 400, 'VALIDATION_FAILED');
      expect(res.body.error.fields[field]).toBe(`${field} must be a number.`);
      expect(res.body.error.fields[field]).not.toMatch(/greater than|less than/i);
    }
    const high = await request(app.getHttpServer()).get(`${API}/properties?minBeds=31`);
    expectError(high, 400, 'VALIDATION_FAILED');
    expect(high.body.error.fields.minBeds).toBe('minBeds must not be greater than 30.');
  });

  it('sold listings stay public and images follow the listing', async () => {
    const sold = await request(app.getHttpServer()).get(`${API}/properties/mactan-newtown-beachfront`);
    const draft = await request(app.getHttpServer()).get(`${API}/properties/tagaytay-highlands-villa`);
    expect(sold.status).toBe(200);
    expectData(sold);
    expect(sold.body.data.status).toBe('sold');
    expect(sold.body.data.images.length).toBeGreaterThanOrEqual(4);
    expect(sold.body.data.coverImage.position).toBe(0);
    expect(sold.body.data.agent.fullName).toEqual(expect.any(String));
    expect(sold.body.data.agent.email).toBeUndefined();
    expectError(draft, 404, 'NOT_FOUND');
  });

  it('reports published market stats', async () => {
    const stats = await request(app.getHttpServer()).get(`${API}/properties/stats`);
    const cities = await request(app.getHttpServer()).get(`${API}/properties/cities`);
    const featured = await request(app.getHttpServer()).get(`${API}/properties/featured`);
    expectData(stats);
    expectData(cities);
    expectData(featured);
    expect(stats.body.data.listingCount).toBe(19);
    expect(stats.body.data.cityCount).toBe(10);
    expect(stats.body.data.medianPricePhp).toBe(68_000_000);
    expect(cities.body.data).toHaveLength(10);
    expect(featured.body.data.every((row: { featured: boolean; status: string }) => row.featured && row.status === 'published')).toBe(true);
  });

  it('a buyer cannot create a property or escalate a role', async () => {
    const created = await request(app.getHttpServer())
      .post(`${API}/properties`)
      .set(bearer(buyer.token))
      .send(draftBody('Buyer should fail'));
    expectError(created, 403, 'FORBIDDEN');
    const escalated = await request(app.getHttpServer())
      .patch(`${API}/admin/users/${buyer.id}/role`)
      .set(bearer(buyer.token))
      .send({ role: 'admin' });
    expectError(escalated, 403, 'FORBIDDEN');
    const profile = await request(app.getHttpServer())
      .patch(`${API}/me/profile`)
      .set(bearer(buyer.token))
      .send({ fullName: 'Camille Uy', role: 'admin' });
    expectError(profile, 400, 'VALIDATION_FAILED');
    expect(profile.body.error.fields.role).toEqual(expect.any(String));
    const me = await request(app.getHttpServer()).get(`${API}/auth/me`).set(bearer(buyer.token));
    expectData(me);
    expect(me.body.data.role).toBe('buyer');
  });

  it('a buyer sees only their own inquiries', async () => {
    const mine = await request(app.getHttpServer()).get(`${API}/me/inquiries`).set(bearer(buyer.token));
    const theirs = await request(app.getHttpServer()).get(`${API}/me/inquiries`).set(bearer(otherBuyer.token));
    expectData(mine);
    expectData(theirs);
    expect(mine.body.data.length).toBeGreaterThan(0);
    expect(mine.body.data.every((row: { buyerId: string }) => row.buyerId === buyer.id)).toBe(true);
    expect(theirs.body.data.every((row: { buyerId: string }) => row.buyerId === otherBuyer.id)).toBe(true);
    const mineIds = new Set(mine.body.data.map((row: { id: string }) => row.id));
    expect(theirs.body.data.some((row: { id: string }) => mineIds.has(row.id))).toBe(false);
    const asAgent = await request(app.getHttpServer()).get(`${API}/me/inquiries`).set(bearer(agentA.token));
    expectError(asAgent, 403, 'FORBIDDEN');
  });

  it('an agent sees only inquiries on their own listings', async () => {
    const ownListings = await request(app.getHttpServer()).get(`${API}/agent/listings`).set(bearer(agentA.token));
    const otherListings = await request(app.getHttpServer()).get(`${API}/agent/listings`).set(bearer(agentB.token));
    const own = await request(app.getHttpServer()).get(`${API}/agent/inquiries`).set(bearer(agentA.token));
    const other = await request(app.getHttpServer()).get(`${API}/agent/inquiries`).set(bearer(agentB.token));
    expectData(ownListings);
    expectData(own);
    expectData(other);
    expect(own.body.data.length).toBeGreaterThan(0);
    expect(otherListings.body.data.some((row: { status: string }) => row.status !== 'published')).toBe(true);
    const ownSlugs = new Set(ownListings.body.data.map((row: { slug: string }) => row.slug));
    const otherSlugs = new Set(otherListings.body.data.map((row: { slug: string }) => row.slug));
    expect(own.body.data.every((row: { propertySlug: string }) => ownSlugs.has(row.propertySlug))).toBe(true);
    expect(other.body.data.every((row: { propertySlug: string }) => otherSlugs.has(row.propertySlug))).toBe(true);
    const shared = own.body.data.some((row: { propertySlug: string }) =>
      other.body.data.some((item: { propertySlug: string }) => item.propertySlug === row.propertySlug),
    );
    expect(shared).toBe(false);
  });

  it("agent A cannot edit agent B's listing or feature it", async () => {
    const before = await request(app.getHttpServer()).get(`${API}/properties/bgc-seasons-penthouse`);
    expectData(before);
    const id = before.body.data.id as string;
    const title = before.body.data.title as string;
    const updated = await request(app.getHttpServer())
      .patch(`${API}/properties/${id}`)
      .set(bearer(agentA.token))
      .send({ title: 'Taken over' });
    expectError(updated, 403, 'FORBIDDEN');
    const featured = await request(app.getHttpServer())
      .patch(`${API}/properties/${id}/featured`)
      .set(bearer(agentA.token))
      .send({ featured: true });
    expectError(featured, 403, 'FORBIDDEN');
    const sneaky = await request(app.getHttpServer())
      .patch(`${API}/properties/${id}`)
      .set(bearer(agentB.token))
      .send({ title, featured: true });
    expectError(sneaky, 400, 'VALIDATION_FAILED');
    const after = await request(app.getHttpServer()).get(`${API}/properties/bgc-seasons-penthouse`);
    expect(after.body.data.title).toBe(title);
    expect(after.body.data.featured).toBe(before.body.data.featured);
  });

  it('rejects draft to sold, blocks an agent publish, and lets an admin publish', async () => {
    const created = await request(app.getHttpServer())
      .post(`${API}/properties`)
      .set(bearer(agentA.token))
      .send(draftBody('RLS probe house'));
    expect(created.status).toBe(201);
    expectData(created);
    const id = created.body.data.id as string;
    const slug = created.body.data.slug as string;
    expect(slug).toBe('rls-probe-house');

    const soldByAgent = await request(app.getHttpServer())
      .post(`${API}/properties/${id}/transitions`)
      .set(bearer(agentA.token))
      .send({ to: 'sold' });
    const soldByAdmin = await request(app.getHttpServer())
      .post(`${API}/properties/${id}/transitions`)
      .set(bearer(admin.token))
      .send({ to: 'sold' });
    expectError(soldByAgent, 403, 'FORBIDDEN');
    expectError(soldByAdmin, 403, 'FORBIDDEN');
    expect(soldByAgent.body.error.message).toBe('That status change is not allowed.');

    const pending = await request(app.getHttpServer())
      .post(`${API}/properties/${id}/transitions`)
      .set(bearer(agentA.token))
      .send({ to: 'pending' });
    expect(pending.status).toBe(200);
    expect(pending.body.data.status).toBe('pending');

    const publishedByAgent = await request(app.getHttpServer())
      .post(`${API}/properties/${id}/transitions`)
      .set(bearer(agentA.token))
      .send({ to: 'published' });
    expectError(publishedByAgent, 403, 'FORBIDDEN');

    const published = await request(app.getHttpServer())
      .post(`${API}/properties/${id}/transitions`)
      .set(bearer(admin.token))
      .send({ to: 'published' });
    expect(published.status).toBe(200);
    expectData(published);
    expect(published.body.data).toEqual({ id, status: 'published', slug });
    const fresh = await prisma.property.findUniqueOrThrow({ where: { id } });
    expect(fresh.publishedAt).not.toBeNull();

    const hidden = await request(app.getHttpServer()).get(`${API}/properties/${slug}`);
    expect(hidden.status).toBe(200);
    await prisma.inquiry.deleteMany({ where: { propertyId: id } });
    await prisma.propertyImage.deleteMany({ where: { propertyId: id } });
    await prisma.property.delete({ where: { id } });
  });

  it('accepts an anonymous inquiry on a published listing and rejects a draft', async () => {
    const published = await prisma.property.findUniqueOrThrow({ where: { slug: 'forbes-park-acacia-house' } });
    const draft = await prisma.property.findUniqueOrThrow({ where: { slug: 'tagaytay-highlands-villa' } });
    const ok = await request(app.getHttpServer()).post(`${API}/inquiries`).send({
      propertyId: published.id,
      name: 'RLS Guest',
      email: 'rls-guest@example.com',
      message: 'This anonymous inquiry should land on a published listing only.',
    });
    expect(ok.status).toBe(201);
    expectData(ok);
    expect(ok.body.data.id).toEqual(expect.any(String));
    const stored = await prisma.inquiry.findUniqueOrThrow({ where: { id: ok.body.data.id } });
    expect(stored.buyerId).toBeNull();

    const denied = await request(app.getHttpServer()).post(`${API}/inquiries`).send({
      propertyId: draft.id,
      name: 'RLS Guest',
      email: 'rls-draft@example.com',
      message: 'This anonymous inquiry should be rejected because the listing is a draft.',
    });
    expectError(denied, 404, 'NOT_FOUND');
  });

  it('keeps favorites private to their owner', async () => {
    const property = await prisma.property.findUniqueOrThrow({ where: { slug: 'rockwell-proscenium-residence' } });
    const saved = await request(app.getHttpServer())
      .put(`${API}/me/favorites/${property.id}`)
      .set(bearer(buyer.token));
    expect(saved.status).toBe(200);
    expect(saved.body.data).toEqual({ favorited: true });
    const mine = await request(app.getHttpServer()).get(`${API}/me/favorites/ids`).set(bearer(buyer.token));
    const theirs = await request(app.getHttpServer()).get(`${API}/me/favorites/ids`).set(bearer(otherBuyer.token));
    const guest = await request(app.getHttpServer()).get(`${API}/me/favorites`);
    expectData(mine);
    expectData(theirs);
    expect(mine.body.data).toContain(property.id);
    expect(theirs.body.data).not.toContain(property.id);
    expectError(guest, 401, 'UNAUTHORIZED');
    const draft = await prisma.property.findUniqueOrThrow({ where: { slug: 'tagaytay-highlands-villa' } });
    const hidden = await request(app.getHttpServer())
      .put(`${API}/me/favorites/${draft.id}`)
      .set(bearer(buyer.token));
    expectError(hidden, 404, 'NOT_FOUND');
  });

  it('rejects a bad upload and an upload onto another agent listing', async () => {
    const own = await prisma.property.findFirstOrThrow({ where: { agentId: agentA.id, status: 'published' } });
    const other = await prisma.property.findFirstOrThrow({ where: { agentId: agentB.id } });
    const bad = await request(app.getHttpServer())
      .post(`${API}/properties/${own.id}/images`)
      .set(bearer(agentA.token))
      .field('alt', 'A probe frame')
      .attach('file', Buffer.from('not an image'), { filename: 'note.txt', contentType: 'text/plain' });
    expectError(bad, 400, 'VALIDATION_FAILED');
    expect(bad.body.error.fields.file).toEqual(expect.any(String));

    const denied = await request(app.getHttpServer())
      .post(`${API}/properties/${other.id}/images`)
      .set(bearer(agentA.token))
      .field('alt', 'A probe frame')
      .attach('file', PNG, { filename: 'pixel.png', contentType: 'image/png' });
    expectError(denied, 403, 'FORBIDDEN');

    const uploaded = await request(app.getHttpServer())
      .post(`${API}/properties/${own.id}/images`)
      .set(bearer(agentA.token))
      .field('alt', 'A one pixel probe')
      .attach('file', PNG, { filename: 'pixel.png', contentType: 'image/png' });
    expect(uploaded.status).toBe(201);
    expectData(uploaded);
    expect(uploaded.body.data.alt).toBe('A one pixel probe');
    expect(uploaded.body.data.url).toContain(`/uploads/${agentA.id}/${own.id}/`);
    const path = new URL(uploaded.body.data.url as string).pathname;
    const file = await request(app.getHttpServer())
      .get(path)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toContain('image/png');
    expect(Buffer.isBuffer(file.body)).toBe(true);
    expect(file.body.equals(PNG)).toBe(true);
  });

  it('trips the inquiry throttle on the sixth send', async () => {
    const property = await prisma.property.findUniqueOrThrow({ where: { slug: 'salcedo-village-pavilion' } });
    let failures = 0;
    for (let index = 0; index < 6; index += 1) {
      const inserted = await request(app.getHttpServer()).post(`${API}/inquiries`).send({
        propertyId: property.id,
        name: 'RLS Throttle',
        email: 'rls-throttle@example.com',
        message: `Throttle probe message number ${index + 1} for the hourly limit.`,
      });
      if (inserted.status === 429) {
        failures += 1;
        expectError(inserted, 429, 'TOO_MANY_REQUESTS');
      } else {
        expect(inserted.status).toBe(201);
      }
    }
    const stored = await prisma.inquiry.count({ where: { email: 'rls-throttle@example.com' } });
    expect(failures).toBe(1);
    expect(stored).toBe(5);
  });

  it('denies admin routes to a buyer and refuses to remove the last admin', async () => {
    const stats = await request(app.getHttpServer()).get(`${API}/admin/stats`).set(bearer(buyer.token));
    const users = await request(app.getHttpServer()).get(`${API}/admin/users`).set(bearer(buyer.token));
    const queue = await request(app.getHttpServer()).get(`${API}/admin/moderation`).set(bearer(buyer.token));
    expectError(stats, 403, 'FORBIDDEN');
    expectError(users, 403, 'FORBIDDEN');
    expectError(queue, 403, 'FORBIDDEN');

    const directory = await request(app.getHttpServer()).get(`${API}/admin/users`).set(bearer(admin.token));
    const adminStats = await request(app.getHttpServer()).get(`${API}/admin/stats`).set(bearer(admin.token));
    expectData(directory);
    expectData(adminStats);
    expect(directory.body.data.length).toBeGreaterThanOrEqual(9);
    expect(adminStats.body.data.userCount).toBeGreaterThanOrEqual(9);
    expect(adminStats.body.data.pendingCount).toBe(2);

    const demoted = await request(app.getHttpServer())
      .patch(`${API}/admin/users/${admin.id}/role`)
      .set(bearer(admin.token))
      .send({ role: 'buyer' });
    expectError(demoted, 409, 'CONFLICT');
    expect(demoted.body.error.message).toBe('The last admin cannot be removed.');
    const still = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
    expect(still.role).toBe('admin');
  });

  it('returns field errors for signup and login, and rejects a bad or deleted token', async () => {
    const signup = await request(app.getHttpServer()).post(`${API}/auth/signup`).send({
      role: 'buyer',
      fullName: 'A',
      email: 'not-an-email',
      password: 'short',
    });
    expectError(signup, 400, 'VALIDATION_FAILED');
    expect(signup.body.error.fields.fullName).toEqual(expect.any(String));
    expect(signup.body.error.fields.email).toEqual(expect.any(String));
    expect(signup.body.error.fields.password).toEqual(expect.any(String));

    const agentSignup = await request(app.getHttpServer()).post(`${API}/auth/signup`).send({
      role: 'agent',
      fullName: 'New Agent',
      email: 'new.agent@example.com',
      password: 'Estate!2026',
    });
    expectError(agentSignup, 400, 'VALIDATION_FAILED');
    expect(agentSignup.body.error.fields.agency).toEqual(expect.any(String));
    expect(agentSignup.body.error.fields.licenseNo).toEqual(expect.any(String));

    const adminSignup = await request(app.getHttpServer()).post(`${API}/auth/signup`).send({
      role: 'admin',
      fullName: 'Sneaky Admin',
      email: 'sneaky@example.com',
      password: 'Estate!2026',
    });
    expectError(adminSignup, 400, 'VALIDATION_FAILED');
    expect(adminSignup.body.error.fields.role).toEqual(expect.any(String));

    const emptyPassword = await request(app.getHttpServer())
      .post(`${API}/auth/login`)
      .send({ email: 'admin@4our.estate', password: '' });
    expectError(emptyPassword, 400, 'VALIDATION_FAILED');
    expect(emptyPassword.body.error.fields.password).toEqual(expect.any(String));

    const wrong = await request(app.getHttpServer())
      .post(`${API}/auth/login`)
      .send({ email: 'missing@example.com', password: 'Estate!2026' });
    expectError(wrong, 401, 'UNAUTHORIZED');
    expect(wrong.body.error.message).toBe('Email or password is incorrect.');

    const bad = await request(app.getHttpServer()).get(`${API}/auth/me`).set({ Authorization: 'Bearer not-a-token' });
    expectError(bad, 401, 'UNAUTHORIZED');

    const created = await request(app.getHttpServer()).post(`${API}/auth/signup`).send({
      role: 'buyer',
      fullName: 'Temporary Buyer',
      email: 'temporary.buyer@example.com',
      password: 'Estate!2026',
      phone: '09171234567',
    });
    expect(created.status).toBe(201);
    expectData(created);
    expect(created.body.data.user.role).toBe('buyer');
    const token = created.body.data.accessToken as string;
    const id = created.body.data.user.id as string;
    await prisma.user.delete({ where: { id } });
    const gone = await request(app.getHttpServer()).get(`${API}/auth/me`).set(bearer(token));
    expectError(gone, 401, 'UNAUTHORIZED');
  });

  it('answers health with the database up', async () => {
    const health = await request(app.getHttpServer()).get(`${API}/health`);
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ data: { status: 'ok', db: 'up' } });
  });
});

function draftBody(title: string) {
  return {
    title,
    description: 'Probe listing used by the permission check and removed afterward.',
    listingType: 'sale',
    propertyType: 'house',
    pricePhp: 1_000_000,
    bedrooms: 1,
    bathrooms: 1,
    floorAreaSqm: 40,
    parkingSlots: 0,
    neighborhood: 'Probe',
    city: 'Makati',
    province: 'Metro Manila',
    address: '1 Probe Street',
    amenities: [],
  };
}
