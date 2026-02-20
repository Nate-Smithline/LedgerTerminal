/**
 * Curated list of Bible nouns for human-readable verification tokens.
 * ~200 words gives ~1.6 billion 4-word combinations.
 */
export const BIBLE_WORDS: string[] = [
  "ark", "dove", "lamb", "vine", "fig", "scroll", "manna", "cedar",
  "olive", "pearl", "raven", "temple", "throne", "altar", "bread",
  "crown", "flame", "grain", "harp", "ivory", "jewel", "king",
  "lion", "moon", "night", "oath", "palm", "quail", "river", "star",
  "tower", "urn", "veil", "wheat", "yoke", "zion", "angel", "basin",
  "cloud", "dawn", "eagle", "feast", "gate", "honey", "iron", "jade",
  "kneel", "linen", "mercy", "noon", "oracle", "pillar", "quest",
  "reef", "sage", "tabor", "union", "vale", "water", "year",
  "zeal", "arrow", "balm", "cave", "desert", "ember", "fish",
  "gold", "hill", "ink", "jasper", "kernel", "leaven", "myrrh",
  "nest", "onyx", "praise", "quarry", "rod", "seed", "thorn",
  "vessel", "well", "shore", "bloom", "staff", "stone",
  "field", "flock", "haven", "lamp", "marsh", "north", "ocean",
  "path", "rain", "salt", "tree", "wind", "azure", "brook",
  "cliff", "dusk", "earth", "frost", "glen", "hawk", "isle",
  "joy", "keep", "leaf", "moss", "noon", "oak", "pine",
  "rose", "sand", "tide", "vine", "wolf", "abode", "bell",
  "cord", "dust", "eden", "ford", "glow", "helm", "inn",
  "just", "knot", "loom", "mile", "node", "olive", "pond",
  "raft", "silk", "tent", "vale", "wax", "apex", "barn",
  "coal", "drum", "elk", "fern", "gale", "herb", "jade",
  "kite", "lark", "mint", "nile", "opal", "port", "quay",
  "reed", "spur", "twig", "vow", "wren", "aloe", "birch",
  "cove", "dale", "ewe", "flax", "goat", "haze", "iris",
  "jay", "keel", "lyre", "mare", "nard", "orb", "pyre",
  "quill", "ram", "swan", "torch", "wick", "ash", "bay",
];

const FILLER_WORDS = ["the", "and", "for", "with", "from", "upon"];

/**
 * Generate a human-readable Bible-word token.
 * Format: "word-filler-word-word" e.g. "ark-the-olive-dove"
 */
export function generateBibleToken(): string {
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const w1 = pick(BIBLE_WORDS);
  const filler = pick(FILLER_WORDS);
  const w2 = pick(BIBLE_WORDS);
  const w3 = pick(BIBLE_WORDS);
  return `${w1}-${filler}-${w2}-${w3}`;
}
