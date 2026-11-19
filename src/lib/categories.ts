/**
 * Product categories: the names stored in the database (English) and their keys in the
 * `categories` translation namespace. Single source of truth for the storefront and admin.
 */
export const CATEGORIES: ReadonlyArray<{ value: string; key: string }> = [
  { value: "Electronics", key: "electronics" },
  { value: "Computers & Laptops", key: "computers" },
  { value: "Phones & Tablets", key: "phones" },
  { value: "Cameras & Photography", key: "cameras" },
  { value: "TV & Home Entertainment", key: "tv" },
  { value: "Audio & Headphones", key: "audio" },
  { value: "Clothing", key: "clothing" },
  { value: "Shoes & Footwear", key: "shoes" },
  { value: "Jewelry & Watches", key: "jewelry" },
  { value: "Bags & Backpacks", key: "bags" },
  { value: "Home & Garden", key: "home" },
  { value: "Kitchen & Dining", key: "kitchen" },
  { value: "Furniture", key: "furniture" },
  { value: "Lighting", key: "lighting" },
  { value: "Sports & Outdoors", key: "sports" },
  { value: "Fitness & Gym", key: "fitness" },
  { value: "Cycling", key: "cycling" },
  { value: "Camping & Hiking", key: "camping" },
  { value: "Books & Media", key: "books" },
  { value: "Toys & Games", key: "toys" },
  { value: "Health & Beauty", key: "beauty" },
  { value: "Automotive", key: "automotive" },
  { value: "Pet Supplies", key: "pets" },
  { value: "Office & School", key: "office" },
];

/** Older names that may still exist in a database seeded by a previous version. */
const ALIASES: Record<string, string> = {
  Sports: "sports",
  "Fitness Equipment": "fitness",
  Books: "books",
  "Beauty & Personal Care": "beauty",
  "Office Supplies": "office",
};

const KEY_BY_NAME = new Map<string, string>([
  ...CATEGORIES.map((c) => [c.value, c.key] as [string, string]),
  ...Object.entries(ALIASES),
]);

/** Translation key for a stored category name (or a legacy `cat.x` value); undefined if unknown. */
export function categoryKey(name: string): string | undefined {
  return name.startsWith("cat.") ? name.slice(4) : KEY_BY_NAME.get(name);
}
