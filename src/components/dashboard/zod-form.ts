import type { ZodError } from "zod";

const UNFRIENDLY = /^(Too small|Too big|Invalid|Expected|Unrecognized)/;

const FIELD_COPY: Record<string, string> = {
  pricePhp: "Enter a price in pesos.",
  bedrooms: "Enter the number of bedrooms.",
  bathrooms: "Enter the number of bathrooms.",
  floorAreaSqm: "Enter the floor area.",
  lotAreaSqm: "Enter the lot area, or leave it blank.",
  parkingSlots: "Enter the parking spaces.",
  yearBuilt: "Enter a year between 1800 and 2100, or leave it blank.",
  neighborhood: "Enter the neighborhood.",
  city: "Enter the city.",
  province: "Enter the province.",
  address: "Enter the street address.",
  latitude: "Enter both latitude and longitude, or leave both blank.",
  longitude: "Enter both latitude and longitude, or leave both blank.",
  slug: "Use lowercase words separated by hyphens.",
  listingType: "Choose sale or rent.",
  propertyType: "Choose a property type.",
  amenities: "Shorten the amenity names.",
  title: "Enter a title.",
  description: "Enter a description.",
  fullName: "Enter your full name.",
  email: "Enter a valid email.",
  password: "Enter your password.",
  phone: "Use +63 9XX XXX XXXX or 09XXXXXXXXX.",
  agency: "Enter your agency.",
  licenseNo: "Enter your PRC license number.",
  avatarUrl: "Use an http or https image address.",
  bio: "Shorten the biography.",
};

export function fieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string" || errors[key]) continue;
    const fallback = FIELD_COPY[key];
    errors[key] = fallback && UNFRIENDLY.test(issue.message) ? fallback : issue.message;
  }
  return errors;
}

export function focusNamed(name: string) {
  const field = document.querySelector<HTMLElement>(`[name="${CSS.escape(name)}"]`);
  field?.focus();
}

export function firstInvalid(
  errors: Partial<Record<string, string>>,
  order: readonly string[],
): string | undefined {
  return order.find((name) => errors[name]);
}
