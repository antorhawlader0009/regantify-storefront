/**
 * StorePal's product search (the header's suggestion list and the results page), IDEA-19. It finds a product by its name, the hidden
 * "also found as" words the store added (TellMe idea 23: "kurta, কুর্তা" on a Panjabi), its category and its brand, and it forgives the way
 * people really type: Bangla, Banglish and English spellings of one word meet ("পাঞ্জাবি", "panjabi", "punjabi"), and a misspelled word
 * ("pnjabi", "walet") still finds its product. The rules are in lib/searchFold.ts, shared by every template.
 */
export { searchProducts } from '@/lib/searchFold';
