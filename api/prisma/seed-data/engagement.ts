import type { InquiryStatus } from "./types.js";

export type SeedInquiry = {
  key: string;
  buyerEmail: string | null;
  slug: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  preferredViewingDate: string | null;
  status: InquiryStatus;
};

export type SeedFavorite = {
  userEmail: string;
  slug: string;
};

export const INQUIRIES: SeedInquiry[] = [
  {
    key: "camille-forbes",
    buyerEmail: "camille.uy@4our.estate",
    slug: "forbes-park-acacia-house",
    name: "Camille Uy",
    email: "camille.uy@4our.estate",
    phone: "+63 917 555 0127",
    message:
      "I would like to walk Narra Street on a weekday morning, before the gardeners arrive. Please tell me which week in November still has a morning free.",
    preferredViewingDate: "2026-11-08",
    status: "new",
  },
  {
    key: "camille-siargao",
    buyerEmail: "camille.uy@4our.estate",
    slug: "siargao-cloud-nine-villa",
    name: "Camille Uy",
    email: "camille.uy@4our.estate",
    phone: "+63 917 555 0127",
    message:
      "We are in General Luna the first week of December. If the caretaker can open the villa on the 3rd, I can be there after the morning session.",
    preferredViewingDate: "2026-12-03",
    status: "contacted",
  },
  {
    key: "joaquin-alabang",
    buyerEmail: "joaquin.tan@4our.estate",
    slug: "ayala-alabang-molave",
    name: "Joaquin Tan",
    email: "joaquin.tan@4our.estate",
    phone: "+63 918 555 0133",
    message:
      "My family is comparing Molave with the house on Acacia. I need the association dues and a Saturday viewing that does not collide with the school run.",
    preferredViewingDate: "2026-11-14",
    status: "new",
  },
  {
    key: "bea-seasons",
    buyerEmail: "bea.lim@4our.estate",
    slug: "bgc-seasons-penthouse",
    name: "Bea Lim",
    email: "bea.lim@4our.estate",
    phone: "+63 919 555 0148",
    message:
      "We toured the penthouse in May and decided to stay in our current apartment. Thank you for the hour. You can close this one.",
    preferredViewingDate: null,
    status: "closed",
  },
  {
    key: "reader-rockwell",
    buyerEmail: null,
    slug: "rockwell-proscenium-residence",
    name: "Miguel Santos",
    email: "miguel.santos@example.com",
    phone: null,
    message:
      "I am writing without an account. Is the Rockwell flat available to view on a Thursday evening after six, and is the second parking slot included?",
    preferredViewingDate: "2026-11-19",
    status: "new",
  },
  {
    key: "joaquin-boracay",
    buyerEmail: "joaquin.tan@4our.estate",
    slug: "boracay-diniwid-villa",
    name: "Joaquin Tan",
    email: "joaquin.tan@4our.estate",
    phone: "+63 918 555 0133",
    message:
      "I want to understand the walk down to Diniwid in the rain, and whether the staff room is habitable for a couple who would live in for the season.",
    preferredViewingDate: null,
    status: "new",
  },
];

export const FAVORITES: SeedFavorite[] = [
  { userEmail: "camille.uy@4our.estate", slug: "forbes-park-acacia-house" },
  { userEmail: "camille.uy@4our.estate", slug: "siargao-cloud-nine-villa" },
  { userEmail: "camille.uy@4our.estate", slug: "bgc-seasons-penthouse" },
  { userEmail: "joaquin.tan@4our.estate", slug: "ayala-alabang-molave" },
  { userEmail: "joaquin.tan@4our.estate", slug: "boracay-diniwid-villa" },
  { userEmail: "bea.lim@4our.estate", slug: "baguio-john-hay-house" },
  { userEmail: "bea.lim@4our.estate", slug: "salcedo-village-pavilion" },
];
