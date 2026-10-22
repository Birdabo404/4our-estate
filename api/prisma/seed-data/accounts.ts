export const DEMO_PASSWORD = "Estate!2026";

export type SeedAccount = {
  email: string;
  role: "buyer" | "agent" | "admin";
  fullName: string;
  phone: string;
  agency?: string;
  licenseNo?: string;
  bio?: string;
};

export const ACCOUNTS: SeedAccount[] = [
  {
    email: "admin@4our.estate",
    role: "admin",
    fullName: "Elena Marquez",
    phone: "+63 917 555 0101",
    agency: "4OUR Estate",
    bio: "Elena keeps the desk, the licenses, and the order of the queue.",
  },
  {
    email: "isabel.santos@4our.estate",
    role: "agent",
    fullName: "Isabel Santos",
    phone: "+63 917 555 0142",
    agency: "Atelier Santos",
    licenseNo: "PRC REB No. 0012847",
    bio: "Isabel advises families who already live in the Makati villages and want the next house on the same street. She has held a PRC broker license since 2014.",
  },
  {
    email: "mateo.cruz@4our.estate",
    role: "agent",
    fullName: "Mateo Cruz",
    phone: "+63 918 555 0176",
    agency: "Northbound Estates",
    licenseNo: "PRC REB No. 0019022",
    bio: "Mateo works the towers of Bonifacio Global City, from one-bedroom leases to the penthouses above 32nd Street. He answers his phone.",
  },
  {
    email: "ana.reyes@4our.estate",
    role: "agent",
    fullName: "Ana Lucia Reyes",
    phone: "+63 919 555 0118",
    agency: "Ridge & Plain",
    licenseNo: "PRC REB No. 0021148",
    bio: "Ana Lucia covers the southern suburbs and the ridge towns: Alabang, Nuvali, Tagaytay, and the pine streets of Baguio.",
  },
  {
    email: "rafael.delacruz@4our.estate",
    role: "agent",
    fullName: "Rafael Dela Cruz",
    phone: "+63 917 555 0194",
    agency: "Visayas House",
    licenseNo: "PRC REB No. 0017730",
    bio: "Rafael keeps a small desk in Cebu and a Saturday on Mactan. Most of his clients already know the subdivision by name.",
  },
  {
    email: "sofia.navarro@4our.estate",
    role: "agent",
    fullName: "Sofia Navarro",
    phone: "+63 918 555 0160",
    agency: "Isla Norte",
    licenseNo: "PRC REB No. 0024401",
    bio: "Sofia handles island houses and the occasional titled lot, from General Luna to El Nido and the surf coast of La Union.",
  },
  {
    email: "camille.uy@4our.estate",
    role: "buyer",
    fullName: "Camille Uy",
    phone: "+63 917 555 0127",
  },
  {
    email: "joaquin.tan@4our.estate",
    role: "buyer",
    fullName: "Joaquin Tan",
    phone: "+63 918 555 0133",
  },
  {
    email: "bea.lim@4our.estate",
    role: "buyer",
    fullName: "Bea Lim",
    phone: "+63 919 555 0148",
  },
  {
    email: "clyde.lontoc@4our.estate",
    role: "buyer",
    fullName: "Clyde Lontoc",
    phone: "+63 917 555 0155",
  },
];
