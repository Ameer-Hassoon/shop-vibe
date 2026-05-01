type TranslateFunction = (key: string) => string;

const CATEGORY_DISPLAY_TO_KEY: Record<string, string> = {
  "Electronics": "cat.electronics",
  "Computers & Laptops": "cat.computers",
  "Phones & Tablets": "cat.phones",
  "Cameras & Photography": "cat.cameras",
  "TV & Home Entertainment": "cat.tv",
  "Audio & Headphones": "cat.audio",
  "Clothing": "cat.clothing",
  "Shoes & Footwear": "cat.shoes",
  "Jewelry & Watches": "cat.jewelry",
  "Bags & Backpacks": "cat.bags",
  "Home & Garden": "cat.home",
  "Kitchen & Dining": "cat.kitchen",
  "Furniture": "cat.furniture",
  "Lighting": "cat.lighting",
  "Sports & Outdoors": "cat.sports",
  "Fitness & Gym": "cat.fitness",
  "Cycling": "cat.cycling",
  "Camping & Hiking": "cat.camping",
  "Books & Media": "cat.books",
  "Toys & Games": "cat.toys",
  "Health & Beauty": "cat.beauty",
  "Automotive": "cat.automotive",
  "Pet Supplies": "cat.pets",
  "Office & School": "cat.office",
  "Beauty & Personal Care": "cat.beauty",
  "Fitness Equipment": "cat.fitness",
  "Office Supplies": "cat.office",
};

export function translateCategory(category: string, t: TranslateFunction): string {
  if (category.startsWith("cat.")) {
    const translated = t(category);
    if (translated !== category) {
      return translated;
    }
    return category;
  }
  
  const key = CATEGORY_DISPLAY_TO_KEY[category];
  if (key) {
    const translated = t(key);
    if (translated !== key) {
      return translated;
    }
  }
  
  return category;
}