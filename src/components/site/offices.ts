export type Office = { city: string; district: string; address: string; phone: string; hours: string };

export const OFFICES: readonly Office[] = [
  {
    city: "Makati",
    district: "Legazpi Village",
    address: "Ayala Avenue, Makati City 1226",
    phone: "+63 2 8845 4687",
    hours: "Mon to Sat, by appointment",
  },
  {
    city: "BGC",
    district: "Bonifacio Global City",
    address: "5th Avenue, Taguig City 1634",
    phone: "+63 2 8856 4687",
    hours: "Mon to Sat, by appointment",
  },
  {
    city: "Cebu",
    district: "Cebu Business Park",
    address: "Archbishop Reyes Avenue, Cebu City 6000",
    phone: "+63 32 266 4687",
    hours: "Mon to Fri, by appointment",
  },
];
