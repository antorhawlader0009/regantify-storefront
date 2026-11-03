// Sample data for the PlayMate template demo page (/template-demo/playmate), copied from templete/playmate/src/data.
// Photos are real Unsplash photos (free to use under the Unsplash License); prices are sample prices, shown in taka.
export const photo = (id: string, w = 600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  teddy: "1530325553241-4f6e7690cf36",
  teddyBow: "1556012018-50c5c0da73bf",
  blocks: "1587654780291-39c9404d746b",
  rcCar: "1527612820672-5b56351f7346",
  learningToys: "1545558014-8692077e9b5c",
  artPencils: "1558181330-ea29c3d1d5c1",
  puzzle: "1494059980473-813e73ee784b",
  dino: "1521988925010-ae9b5332edd3",
  woodenTrain: "1596461404969-9ae70f2830c1",
  babyToy: "1618842676088-c4d48a6a7c9d",
  miniFigure: "1599623560574-39d485900c95",
  robot: "1731834451174-6bcb32236bbf",
  toysTable: "1558060370-d644479cb6f7",
  // product photos (Unsplash, checked)
  bearBowTie: "1602734846297-9299fc2d4703",
  bearCloseUp: "1562040506-a9b32cb51b94",
  legoColor: "1631106254201-ffbee2305c5b",
  legoPile: "1672267273720-053bee27b9a2",
  woodenBlocksColor: "1575364289437-fb1479d52732",
  racingCars: "1560859251-d563a49c5e4a",
  letterBlocks: "1558907353-ceb54f3882ed",
  woodenTrainBeige: "1505003098838-83ce5356c228",
  paintCases: "1517036723957-e2891b1b32ae",
  clay: "1536293182766-c9c0c4133b55",
  woodenElephants: "1703581698778-2224c729135b",
  woodenAnimals: "1714618888538-8d15a9228236",
  chess: "1611957082141-c449bb2b4ada",
  jenga: "1539477192933-1a7dde04aa77",
  toyShelf: "1642379831546-67d5e2bf8bcc",
} as const;

export interface DemoProduct {
  id: number;
  name: string;
  subtitle: string;
  price: number;
  oldPrice: number;
  rating: number;
  reviews: number;
  category: string;
  brand: string;
  ages: number[];
  bestSeller?: boolean;
  isNew?: boolean;
  image?: string;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  // ---- Stuffed Toys
  { id: 1, name: "Giant Teddy Bear", subtitle: "Soft Plush Toy (60cm)", price: 29.99, oldPrice: 39.99, rating: 5, reviews: 245, category: "Stuffed Toys", brand: "Fisher-Price", ages: [0, 1, 2], isNew: true, image: photo(IMG.teddy) },
  { id: 9, name: "Cuddle Bear with Bow", subtitle: "Plush Friend (35cm)", price: 18.99, oldPrice: 24.99, rating: 4.5, reviews: 158, category: "Stuffed Toys", brand: "Melissa & Doug", ages: [0, 1, 2], bestSeller: true, image: photo(IMG.bearBowTie) },
  { id: 10, name: "Snuggle Pal Bear", subtitle: "Extra Soft Teddy (25cm)", price: 12.99, oldPrice: 16.99, rating: 4, reviews: 97, category: "Stuffed Toys", brand: "Fisher-Price", ages: [0, 1], image: photo(IMG.bearCloseUp) },

  // ---- Building & Blocks
  { id: 2, name: "Building Blocks", subtitle: "City Set (120 Pieces)", price: 24.99, oldPrice: 34.99, rating: 4.5, reviews: 312, category: "Building & Blocks", brand: "LEGO", ages: [1, 2, 3], bestSeller: true, image: photo(IMG.legoColor) },
  { id: 11, name: "Mega Brick Box", subtitle: "Creative Set (300 Pieces)", price: 44.99, oldPrice: 59.99, rating: 5, reviews: 421, category: "Building & Blocks", brand: "LEGO", ages: [2, 3], bestSeller: true, image: photo(IMG.legoPile) },
  { id: 12, name: "Junior Builder Blocks", subtitle: "Chunky Bricks (60 Pieces)", price: 16.99, oldPrice: 22.99, rating: 4.5, reviews: 134, category: "Building & Blocks", brand: "VTech", ages: [0, 1], isNew: true, image: photo(IMG.woodenBlocksColor) },

  // ---- Remote Control
  { id: 3, name: "Remote Control Car", subtitle: "Off-Road Monster Truck", price: 34.99, oldPrice: 49.99, rating: 4.5, reviews: 198, category: "Remote Control", brand: "Hot Wheels", ages: [2, 3], bestSeller: true, image: photo(IMG.rcCar) },
  { id: 13, name: "Turbo Racer RC", subtitle: "High-Speed Sports Car", price: 27.99, oldPrice: 36.99, rating: 4.5, reviews: 176, category: "Remote Control", brand: "Hot Wheels", ages: [2, 3, 4], isNew: true, image: photo(IMG.racingCars) },
  { id: 14, name: "RC Robot Buddy", subtitle: "Walking & Talking Robot", price: 49.99, oldPrice: 69.99, rating: 4.5, reviews: 88, category: "Remote Control", brand: "NERF", ages: [2, 3, 4], isNew: true, image: photo(IMG.robot) },

  // ---- Wooden Toys
  { id: 4, name: "Wooden Activity Cube", subtitle: "Learning Toy", price: 22.99, oldPrice: 29.99, rating: 4.5, reviews: 276, category: "Wooden Toys", brand: "Melissa & Doug", ages: [0, 1], bestSeller: true, image: photo(IMG.letterBlocks) },
  { id: 8, name: "Wooden Train Set", subtitle: "Classic Railway Toy", price: 39.99, oldPrice: 54.99, rating: 5, reviews: 129, category: "Wooden Toys", brand: "Melissa & Doug", ages: [1, 2], bestSeller: true, image: photo(IMG.woodenTrainBeige) },
  { id: 15, name: "Wooden Town Playset", subtitle: "Cars, Signs & Houses", price: 32.99, oldPrice: 44.99, rating: 4.5, reviews: 112, category: "Wooden Toys", brand: "Melissa & Doug", ages: [1, 2], image: photo(IMG.woodenTrain) },

  // ---- Arts & Crafts
  { id: 5, name: "Kids Art Set", subtitle: "150 Pieces", price: 19.99, oldPrice: 29.99, rating: 4.5, reviews: 187, category: "Arts & Crafts", brand: "Play-Doh", ages: [1, 2, 3], bestSeller: true, image: photo(IMG.artPencils) },
  { id: 16, name: "Washable Paint Set", subtitle: "12 Bright Colours", price: 14.99, oldPrice: 19.99, rating: 4.5, reviews: 203, category: "Arts & Crafts", brand: "Melissa & Doug", ages: [1, 2, 3], image: photo(IMG.paintCases) },
  { id: 17, name: "Creative Dough Kit", subtitle: "Modeling Dough (12 Tubs)", price: 13.99, oldPrice: 18.99, rating: 4.5, reviews: 266, category: "Arts & Crafts", brand: "Play-Doh", ages: [0, 1, 2], isNew: true, image: photo(IMG.clay) },

  // ---- Baby Toys
  { id: 18, name: "Wooden Elephant Trio", subtitle: "Baby-Safe Animal Set", price: 11.99, oldPrice: 15.99, rating: 4.5, reviews: 142, category: "Baby Toys", brand: "Fisher-Price", ages: [0], image: photo(IMG.woodenElephants) },
  { id: 19, name: "Stacking Rings", subtitle: "Colourful Learning Toy", price: 9.99, oldPrice: 13.99, rating: 5, reviews: 318, category: "Baby Toys", brand: "Fisher-Price", ages: [0], bestSeller: true, image: photo(IMG.babyToy) },
  { id: 20, name: "Wooden Animal Friends", subtitle: "Montessori Play Set", price: 36.99, oldPrice: 49.99, rating: 4.5, reviews: 91, category: "Baby Toys", brand: "VTech", ages: [0], isNew: true, image: photo(IMG.woodenAnimals) },

  // ---- Puzzles & Games
  { id: 6, name: "Puzzle Game", subtitle: "1000 Pieces", price: 17.99, oldPrice: 24.99, rating: 4.5, reviews: 231, category: "Puzzles & Games", brand: "Melissa & Doug", ages: [3, 4], bestSeller: true, image: photo(IMG.puzzle) },
  { id: 21, name: "Classic Chess Set", subtitle: "Strategy Game for Kids", price: 12.99, oldPrice: 17.99, rating: 4.5, reviews: 154, category: "Puzzles & Games", brand: "Melissa & Doug", ages: [2, 3], image: photo(IMG.chess) },
  { id: 22, name: "Tower Stacking Game", subtitle: "Family Block Tower", price: 21.99, oldPrice: 28.99, rating: 4.5, reviews: 187, category: "Puzzles & Games", brand: "Barbie", ages: [2, 3, 4], isNew: true, image: photo(IMG.jenga) },

  // ---- Action Figures
  { id: 7, name: "Dino Roar Figure", subtitle: "Collectible Dinosaur", price: 14.99, oldPrice: 19.99, rating: 4.5, reviews: 164, category: "Action Figures", brand: "NERF", ages: [1, 2, 3], bestSeller: true, image: photo(IMG.dino) },
  { id: 23, name: "Mini Hero Figure", subtitle: "Poseable Collectible", price: 15.99, oldPrice: 21.99, rating: 4.5, reviews: 119, category: "Action Figures", brand: "LEGO", ages: [2, 3, 4], image: photo(IMG.miniFigure) },
  { id: 24, name: "Collectible Toy Set", subtitle: "Display Shelf Bundle", price: 26.99, oldPrice: 34.99, rating: 4.5, reviews: 209, category: "Action Figures", brand: "Barbie", ages: [1, 2, 3], isNew: true, image: photo(IMG.toyShelf) },
];


export const DEMO_CATEGORIES: { name: string; bg: string; image?: string }[] = [
  { name: "Stuffed Toys", bg: "#fde7ea", image: photo(IMG.teddy, 400) },
  { name: "Building & Blocks", bg: "#e8f0fb", image: photo(IMG.blocks, 400) },
  { name: "Remote Control", bg: "#eceff5", image: photo(IMG.rcCar, 400) },
  { name: "Wooden Toys", bg: "#fdf0df", image: photo(IMG.woodenTrain, 400) },
  { name: "Arts & Crafts", bg: "#fdf3e3", image: photo(IMG.artPencils, 400) },
  { name: "Baby Toys", bg: "#fdf3d6", image: photo(IMG.babyToy, 400) },
  { name: "Puzzles & Games", bg: "#efe8f8", image: photo(IMG.puzzle, 400) },
  { name: "Action Figures", bg: "#ece9f7", image: photo(IMG.miniFigure, 400) },
];


export const DEMO_HERO_SLIDES = [
  {
    title1: "Amazing Toys",
    title2: "Endless",
    accent: "Joy",
    text: "Discover the perfect toys for every age and every adventure.",
    image: photo(IMG.toysTable, 1600),
    alt: "Colorful toys on a table",
  },
  {
    title1: "Build & Create",
    title2: "Without",
    accent: "Limits",
    text: "Blocks, robots and remote-control racers that spark big ideas.",
    image: photo(IMG.blocks, 1600),
    alt: "Colorful building blocks",
  },
  {
    title1: "Cuddles For",
    title2: "Every",
    accent: "Hug",
    text: "Soft, safe and snuggly friends that kids never want to let go.",
    image: photo(IMG.teddyBow, 1600),
    alt: "Teddy bear with a red bow",
  },
];


export const DEMO_PROMO_IMAGES = {
  robot: photo(IMG.robot, 800),
  dino: photo(IMG.dino, 800),
};


export const DEMO_BRANDS = ["LEGO", "Fisher-Price", "Hot Wheels", "NERF", "Barbie", "Play-Doh", "VTech", "Melissa & Doug"];
