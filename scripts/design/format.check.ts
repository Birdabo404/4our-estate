import assert from "node:assert/strict";
import {
  formatArea,
  formatBaths,
  formatBeds,
  formatListingPrice,
  formatLocation,
  formatPhp,
  formatRelativeDate,
  propertyFacts,
} from "../../src/lib/format";

assert.equal(formatPhp(48_500_000), "₱48,500,000");
assert.equal(formatPhp(48_500_000, "compact"), "₱48.5M");
assert.equal(formatPhp(1_200_000_000, "compact"), "₱1.2B");
assert.equal(formatPhp(12_000_000, "compact"), "₱12M", "compact drops trailing zeros");
assert.equal(formatPhp(1_250_000_000, "compact"), "₱1.25B");
assert.equal(formatListingPrice(285_000, "rent"), "₱285,000/mo");
assert.equal(formatListingPrice(285_000, "rent", "compact"), "₱285K/mo");
assert.equal(formatListingPrice(48_500_000, "sale"), "₱48,500,000");
assert.equal(formatArea(320), "320 sqm");
assert.equal(formatArea(1200), "1,200 sqm");
assert.equal(formatBeds(1), "1 bed");
assert.equal(formatBeds(4), "4 beds");
assert.equal(formatBeds(0), "Studio");
assert.equal(formatBaths(2.5), "2.5 baths");
assert.equal(formatLocation({ neighborhood: "Rockwell", city: "Makati" }), "Rockwell, Makati");
assert.equal(formatLocation({ neighborhood: "Tagaytay", city: "Tagaytay" }), "Tagaytay");
assert.deepEqual(
  propertyFacts({ propertyType: "lot", bedrooms: 0, bathrooms: 0, floorAreaSqm: 0, lotAreaSqm: 1500 }),
  ["Lot 1,500 sqm"],
);
assert.deepEqual(
  propertyFacts({ propertyType: "villa", bedrooms: 5, bathrooms: 6, floorAreaSqm: 640, lotAreaSqm: 1200 }),
  ["5 beds", "6 baths", "640 sqm"],
);

const now = new Date("2026-10-20T12:00:00Z");
assert.equal(formatRelativeDate("2026-10-20T11:59:30Z", now), "just now");
assert.equal(formatRelativeDate("2026-10-19T12:00:00Z", now), "yesterday");
assert.equal(formatRelativeDate("2026-10-17T12:00:00Z", now), "3 days ago");
assert.equal(formatRelativeDate("2026-09-29T12:00:00Z", now), "3 weeks ago");
assert.equal(formatRelativeDate("2026-10-20T09:00:00Z", now), "3 hours ago");

console.log("format: all assertions pass");
