import type { PhotoCategory, PhotoTone } from "../../src/lib/photography/catalog";

export type Pick = { id: string; tone: PhotoTone; alt: string };

// Hand-curated from contact sheets of scrape.ts candidates. Alt text is written
// from looking at each frame; Unsplash's own alt text is often wrong.
export const PICKS: Record<PhotoCategory, readonly Pick[]> = {
  hero: [
    {
      id: "photo-1579991515244-f8ec47f8263d",
      tone: "warm",
      alt: "Infinity-edge pool on a stone terrace at dusk, the sea beyond it under a starry violet sky with a band of orange on the horizon",
    },
    {
      id: "photo-1588504633950-9dc518941e93",
      tone: "warm",
      alt: "Still infinity pool reflecting a slatted timber pavilion, with a calm bay and green mountains under a golden late-afternoon sky",
    },
    {
      id: "photo-1694859035074-cb7166b5e7ce",
      tone: "neutral",
      alt: "Stone and glass villa lit from within at twilight, its pool and garden stepping down a wooded hillside toward the sea",
    },
    {
      id: "photo-1623298317883-6b70254edf31",
      tone: "cool",
      alt: "Stone and dark steel hillside house lit warmly from within at blue hour, city lights glimmering in the valley below",
    },
    {
      id: "photo-1762254923872-5bdc4210eb90",
      tone: "warm",
      alt: "Infinity pool at sunset with a lone palm and a lit poolside pavilion mirrored in the water, the sea and distant headland beyond",
    },
    {
      id: "photo-1627294169003-44cbb1ec46f1",
      tone: "warm",
      alt: "Wide view across an infinity pool at sunset, silhouetted palms on the left and the sun low over a calm sea",
    },
  ],
  "exterior-tropical-modern": [
    {
      id: "photo-1613490493576-7fde63acd811",
      tone: "neutral",
      alt: "White two-storey modern house with timber soffits and full-height glazing behind a long rectangular pool",
    },
    {
      id: "photo-1538429514009-cd5e56785ffb",
      tone: "warm",
      alt: "Narrow blue-tiled lap pool beside a timber deck, framed by frangipani branches and dense tropical planting",
    },
    {
      id: "photo-1692736933732-ad902fc34626",
      tone: "neutral",
      alt: "Courtyard plunge pool in front of an open timber-lined pavilion, shaded by a frangipani tree and tall pandan plants",
    },
    {
      id: "photo-1676794944553-399cade9cd39",
      tone: "warm",
      alt: "Timber and concrete house with a steep pitched roof set in a clearing of lush rainforest",
    },
    {
      id: "photo-1675657144361-98ae33e6b6f9",
      tone: "cool",
      alt: "Pale green pool with a round daybed, edged by a dark timber column and palms overlooking rice fields",
    },
    {
      id: "photo-1668957067320-921d79368284",
      tone: "neutral",
      alt: "Thatched poolside bale with a cushioned daybed at the end of a stone-edged pool, set against dense jungle",
    },
    {
      id: "photo-1692736933760-8a8a9b8c1b6f",
      tone: "warm",
      alt: "Turquoise pool running along a white house with a deep timber-lined veranda, a swing seat and tropical garden",
    },
    {
      id: "photo-1675657144518-025804f1812c",
      tone: "warm",
      alt: "Single-storey villa wrapped around a garden courtyard with a pool, timber screens and coconut palms beyond",
    },
    {
      id: "photo-1721222205991-d74bcb224330",
      tone: "neutral",
      alt: "Stepping-stone path across a reflecting pool to a gabled white pavilion surrounded by palms",
    },
    {
      id: "photo-1721222204632-bf9abe6f023f",
      tone: "neutral",
      alt: "Pair of dark rattan sun loungers under a parasol on a stone deck beside a green-tiled pool and low white villa",
    },
  ],
  "exterior-contemporary": [
    {
      id: "photo-1523217582562-09d0def993a6",
      tone: "warm",
      alt: "Stacked white cubic house in strong sun, a stepped path and grasses leading to the entrance",
    },
    {
      id: "photo-1549791084-5f78368b208b",
      tone: "cool",
      alt: "Angular board-formed concrete house with deep-set windows under a clear blue sky",
    },
    {
      id: "photo-1633354747567-e0682586f082",
      tone: "neutral",
      alt: "White cantilevered upper storey over a glazed ground floor lit warmly from within, a slatted pergola extending to the garden",
    },
    {
      id: "photo-1768200498972-fd56353d73fc",
      tone: "cool",
      alt: "Long, low white modernist house with deep horizontal bands and a single palm, set against a saturated blue sky",
    },
    {
      id: "photo-1781795485048-3d98b53632db",
      tone: "neutral",
      alt: "Concrete house with a dramatic flat roof raised on slender angled columns above a mossy, rocky slope",
    },
    {
      id: "photo-1730170787463-53a7074137fa",
      tone: "neutral",
      alt: "Raw concrete house with broad stone steps rising through ornamental grasses and shrubs",
    },
    {
      id: "photo-1781795290283-893dd050eeb3",
      tone: "neutral",
      alt: "Slender white steel-framed glass pavilion standing in a meadow of tall grass, the sea faintly visible behind",
    },
    {
      id: "photo-1766603636562-531bb3e1dda8",
      tone: "warm",
      alt: "Low modern house with a slatted hardwood upper floor over a rough stone base, palms flanking stone entry steps",
    },
    {
      id: "photo-1787088988806-7ec503692b85",
      tone: "neutral",
      alt: "Long flat-roofed pavilion with a fieldstone wall and fully open living spaces facing a clipped green lawn",
    },
  ],
  "exterior-classic": [
    {
      id: "photo-1416331108676-a22ccb276e35",
      tone: "warm",
      alt: "Mediterranean-style villa with arched loggias lit at dusk around a kidney-shaped pool",
    },
    {
      id: "photo-1580494767366-82f4e74f5655",
      tone: "warm",
      alt: "Spanish revival villa with a carved stone doorway and clay-tile roof among tall palms and climbing plants",
    },
    {
      id: "photo-1583765748076-cac46b8c98c1",
      tone: "neutral",
      alt: "Cream classical mansion with a long curving driveway across manicured lawns, palms framing the view",
    },
    {
      id: "photo-1548463870-e32900ea6bb4",
      tone: "neutral",
      alt: "Philippine heritage ancestral house with a white timber upper floor of capiz-style windows over a vine-covered stone arch",
    },
    {
      id: "photo-1617141372324-a37d164e08ae",
      tone: "warm",
      alt: "White Spanish colonial house with terracotta roofs, a round tower and green shutters behind tall palms",
    },
    {
      id: "photo-1631528858266-5ebeb8bfc6f5",
      tone: "cool",
      alt: "Terracotta-roofed villa among pines and palms on a hillside above a deep blue sea",
    },
    {
      id: "photo-1598635158020-088c8c50c34f",
      tone: "neutral",
      alt: "White villa with a blue-glazed tile roof and arched window half hidden by red flowering shrubs",
    },
    {
      id: "photo-1589812635389-bba67781b7dd",
      tone: "warm",
      alt: "Cobbled street in Vigan lined with Spanish-era stone and timber houses with wide upper-floor windows",
    },
  ],
  "condo-tower": [
    {
      id: "photo-1587764379282-cea540e4305a",
      tone: "neutral",
      alt: "Looking up at a dark residential tower with rounded corners and bands of bronze-framed windows",
    },
    {
      id: "photo-1593766145069-76722bc20a47",
      tone: "warm",
      alt: "Brick-red residential tower with deep vertical fins rising into an overcast sky",
    },
    {
      id: "photo-1621705338437-f1b304737d09",
      tone: "cool",
      alt: "White curved balconies stacked up an apartment building, a leafy tree in the foreground",
    },
    {
      id: "photo-1620815007286-e81a52dff0e4",
      tone: "neutral",
      alt: "Abstract diagonal view of continuous concrete balcony bands on a high-rise",
    },
    {
      id: "photo-1618955599800-3d63a871e0be",
      tone: "cool",
      alt: "Slender glass residential tower with planted balconies against a bright sky",
    },
    {
      id: "photo-1647025980693-04e6b24a6d78",
      tone: "warm",
      alt: "Cream condominium tower with rounded balconies seen from below against a deep blue sky",
    },
    {
      id: "photo-1759671953272-a4719ca32266",
      tone: "neutral",
      alt: "Modern building with glass balconies overflowing with green planting",
    },
    {
      id: "photo-1783801419756-7d549c3eb277",
      tone: "cool",
      alt: "Two pale residential towers with curved planted balconies converging against a clear sky",
    },
  ],
  "interior-living": [
    {
      id: "photo-1567016376408-0226e4d0c1ea",
      tone: "warm",
      alt: "Sculpted cream plaster room with a tall arched opening framing a low dark leather sofa and a single dried stem in a vase",
    },
    {
      id: "photo-1564078516393-cf04bd966897",
      tone: "neutral",
      alt: "Double-height living room at dusk, a grey sectional beneath tall black-framed windows and warm recessed lights",
    },
    {
      id: "photo-1618221195710-dd6b41faaea6",
      tone: "warm",
      alt: "Wide open-plan living room with a grey sofa, leather ottomans and a clerestory window, glass doors opening to a garden",
    },
    {
      id: "photo-1578683010236-d716f9a3f461",
      tone: "neutral",
      alt: "Loft-like living space with pale timber floors, a low sectional and a bed beneath walls of glass facing dry hills",
    },
    {
      id: "photo-1617228133035-2347f159e755",
      tone: "warm",
      alt: "Bright living room under a skylight with a deep cream sofa, round white coffee table, timber sideboard and potted plants",
    },
    {
      id: "photo-1668277155881-9d3bccb1683a",
      tone: "warm",
      alt: "Capiz-shell chandelier hanging before floor-to-ceiling windows that look over the sea at sunset",
    },
    {
      id: "photo-1668277156357-3e174dff9f1a",
      tone: "warm",
      alt: "Glass-walled tropical lounge with low sea-green cushioned sofas, a polished concrete floor and cascading capiz-shell chandeliers",
    },
    {
      id: "photo-1679494415048-c2f8d798d992",
      tone: "warm",
      alt: "Built-in timber banquette with white cushions beside a full-height window, afternoon sun striping the floor",
    },
  ],
  "interior-kitchen": [
    {
      id: "photo-1502005097973-6a7082348e28",
      tone: "warm",
      alt: "Long galley kitchen of pale oak cabinetry and white counters leading to glass doors and a garden",
    },
    {
      id: "photo-1623903800664-a840b8be323b",
      tone: "neutral",
      alt: "Japandi kitchen nook with an oak table and chairs beneath a wide timber-framed window onto greenery, a red pendant overhead",
    },
    {
      id: "photo-1706459492982-a19edbdb3179",
      tone: "neutral",
      alt: "Minimal kitchen with a timber island, a blush-pink wall and a skylight washing the white walls with daylight",
    },
    {
      id: "photo-1631048501619-a27088a3bb70",
      tone: "neutral",
      alt: "Kitchen with a veined quartz waterfall island, amber glass pendants and sliding doors opening to a garden",
    },
    {
      id: "photo-1738748444653-2fb1388aef1a",
      tone: "cool",
      alt: "Green marble island with two pale timber stools in a raw concrete kitchen",
    },
    {
      id: "photo-1764526624453-db32c24eca55",
      tone: "neutral",
      alt: "Sloped-ceiling kitchen with skylights, a tall walnut cabinet, white stone counters and glass pendants",
    },
    {
      id: "photo-1788217158679-5f7a52049ecc",
      tone: "warm",
      alt: "Walnut-clad kitchen with a white island, four oak stools and a copper pendant in soft daylight",
    },
    {
      id: "photo-1765371515325-b6611765dfad",
      tone: "warm",
      alt: "Curved oak kitchen joinery wrapped around a dramatic veined marble splashback",
    },
  ],
  "interior-dining": [
    {
      id: "photo-1604578762246-41134e37f9cc",
      tone: "warm",
      alt: "Solid timber dining table beneath a layered pendant, polished floors running to sliding doors and a green garden",
    },
    {
      id: "photo-1617597837929-b34c021186f3",
      tone: "warm",
      alt: "Sunlit breakfast room with arched white plantation shutters, a round pedestal table and a woven rattan chair, hills beyond",
    },
    {
      id: "photo-1585128903994-9788298932a6",
      tone: "warm",
      alt: "Timber dining table and bench on herringbone floors under two black pendants, daylight from tall windows",
    },
    {
      id: "photo-1589719470769-08aa42145d03",
      tone: "warm",
      alt: "Long oak dining table lined with rattan chairs under a geometric lantern, glass doors open to a terrace",
    },
    {
      id: "photo-1581970696275-253e75ecf269",
      tone: "neutral",
      alt: "Rustic plank dining table with four woven rattan chairs against a bare white wall",
    },
    {
      id: "photo-1696986296905-e631802befb0",
      tone: "neutral",
      alt: "Dining table with bentwood cane chairs and a branch arrangement before tall windows onto trees",
    },
    {
      id: "photo-1721222203980-9bd247e68588",
      tone: "warm",
      alt: "Thick slab timber dining table beneath a gabled steel window framing tropical forest, rattan pendants above",
    },
    {
      id: "photo-1690603933976-253760032686",
      tone: "warm",
      alt: "Timber table with a cane-backed chair and a potted plant beside a window in soft morning light",
    },
  ],
  "interior-bedroom": [
    {
      id: "photo-1552558636-f6a8f071c2b3",
      tone: "warm",
      alt: "Linen-dressed bed against a raw plaster wall, sunlight falling across it beside a leafy potted plant",
    },
    {
      id: "photo-1589271243958-d61e12b61b97",
      tone: "neutral",
      alt: "Crisp white bed and a timber ledge holding a single dried palm stem in a black vase",
    },
    {
      id: "photo-1611892440504-42a792e24d32",
      tone: "warm",
      alt: "Timber-panelled villa bedroom with teal pillows and doors open to a private tropical garden",
    },
    {
      id: "photo-1613553474179-e1eda3ea5734",
      tone: "neutral",
      alt: "Concrete-walled tropical bedroom with a white bed, rattan sunburst mirror and sliding glass doors",
    },
    {
      id: "photo-1584132905271-512c958d674a",
      tone: "warm",
      alt: "Low platform bed on dark timber floors under a wood ceiling, late sun glowing through sheer curtains",
    },
    {
      id: "photo-1612301988752-5a5b19021f45",
      tone: "warm",
      alt: "Bedroom with a vaulted timber ceiling and ceiling fan, hardwood floors and sliding doors onto a lawn",
    },
    {
      id: "photo-1597126729864-51740ac05236",
      tone: "neutral",
      alt: "Bright white bedroom with textured cushions and a wall of glass opening onto a pool terrace with palms",
    },
    {
      id: "photo-1721222201438-b59e2bbca679",
      tone: "neutral",
      alt: "Villa bedroom with a timber bed, a rattan egg chair and full-height doors to a balcony of palms",
    },
  ],
  "interior-bath": [
    {
      id: "photo-1507652313519-d4e9174996dd",
      tone: "neutral",
      alt: "Freestanding white bathtub on a pebble border beside a potted palm, grey plaster walls and a timber towel ladder",
    },
    {
      id: "photo-1642755622932-d1e0cb783dc5",
      tone: "warm",
      alt: "Matte black freestanding tub in a travertine-lined bathroom, a slot window framing green trees",
    },
    {
      id: "photo-1626290246891-a498b0097e3d",
      tone: "warm",
      alt: "Copper soaking tub on a timber deck in an open-air bathroom ringed with greenery, seen from above",
    },
    {
      id: "photo-1631215750638-bdde5f616128",
      tone: "warm",
      alt: "Roll-top bath with a copper mixer tap against handmade zellige tiles and a veined marble wall",
    },
    {
      id: "photo-1733426107854-ee00a25d72a7",
      tone: "neutral",
      alt: "Sunlit bathroom with a freestanding tub, speckled plaster walls, a dark timber shower wall and potted plants",
    },
    {
      id: "photo-1717497043540-d45bf85e5d38",
      tone: "neutral",
      alt: "Stone bathtub with a timber bath caddy and glass bottles, lush ferns in front of a slate-tiled wall",
    },
    {
      id: "photo-1592248207497-1edb720a1552",
      tone: "warm",
      alt: "Antique stone trough bathtub against a rubble-stone wall, flanked by potted ferns on a brick floor",
    },
    {
      id: "photo-1621626802138-544f167e2c7f",
      tone: "warm",
      alt: "Narrow skylit bathroom with a round stone tub against a wall of honey-coloured stacked stone",
    },
  ],
  pool: [
    {
      id: "photo-1544984243-ec57ea16fe25",
      tone: "warm",
      alt: "Timber pool deck of a modern house at sunset, a plunge pool glowing under a red and violet sky",
    },
    {
      id: "photo-1543489822-c49534f3271f",
      tone: "cool",
      alt: "White pavilion beside an infinity pool overlooking a turquoise bay and distant islands",
    },
    {
      id: "photo-1587870306141-4f19861e6c73",
      tone: "cool",
      alt: "Aerial view of a rectangular pool framed by palm crowns and sun loungers in a tropical garden",
    },
    {
      id: "photo-1603085429201-64dadaec4061",
      tone: "cool",
      alt: "Curving white infinity pool edge dropping toward a calm sea and silhouetted islands",
    },
    {
      id: "photo-1696961672016-7d545878292c",
      tone: "cool",
      alt: "Palm frond shadows across submerged pool steps in clear green water",
    },
    {
      id: "photo-1596178067639-5c6e68aea6dc",
      tone: "neutral",
      alt: "Long blue-tiled lap pool beside a white villa with a timber gable, lined with loungers, parasols and coconut palms",
    },
    {
      id: "photo-1668276490368-409a6002756d",
      tone: "neutral",
      alt: "Round stone-rimmed plunge pool on a timber deck looking over treetops to the horizon",
    },
    {
      id: "photo-1706043890009-9aae000532cd",
      tone: "neutral",
      alt: "Mid-century glass pavilion with a thin flat roof beyond a green pool, a city spread below under scattered cloud",
    },
  ],
  "view-sea": [],
  "view-city": [],
  "view-highland": [],
  "land-lot": [],
  detail: [],
  "place-makati": [],
  "place-bgc": [],
  "place-cebu": [],
  "place-siargao": [],
  "place-boracay": [],
  "place-palawan": [],
  "place-tagaytay": [],
  "place-baguio": [],
  "place-la-union": [],
};
