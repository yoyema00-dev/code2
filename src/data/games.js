export const stores = ["Steam", "Epic Games Store", "GOG", "Humble Store"];

export const games = [
  {
    id: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    titleHe: "סייברפאנק 2077",
    category: "RPG",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
    summary:
      "משחק תפקידים פעולה בעולם פתוח עתידני, עם שדרוגי גוף, בחירות סיפוריות ועיר ענקית לחקור.",
    tags: ["עולם פתוח", "אקשן", "מדע בדיוני"],
    rating: "מומלץ למעריצי RPG עתידני",
    releaseYear: 2020,
    deals: [
      { store: "Steam", price: 119, originalPrice: 239, discount: 50, url: "https://store.steampowered.com/" },
      { store: "GOG", price: 89, originalPrice: 239, discount: 63, url: "https://www.gog.com/" },
      { store: "Epic Games Store", price: 109, originalPrice: 239, discount: 54, url: "https://store.epicgames.com/" },
    ],
  },
  {
    id: "the-witcher-3",
    title: "The Witcher 3: Wild Hunt",
    titleHe: "המכשף 3",
    category: "RPG",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg",
    summary:
      "הרפתקת עולם פתוח עטורת פרסים עם עלילה עשירה, מפלצות, בחירות מוסריות והרחבות ענקיות.",
    tags: ["פנטזיה", "עולם פתוח", "עלילה"],
    rating: "בחירה חזקה לפיישנט גיימרים",
    releaseYear: 2015,
    deals: [
      { store: "Steam", price: 35, originalPrice: 175, discount: 80, url: "https://store.steampowered.com/" },
      { store: "GOG", price: 35, originalPrice: 175, discount: 80, url: "https://www.gog.com/" },
      { store: "Humble Store", price: 44, originalPrice: 175, discount: 75, url: "https://www.humblebundle.com/store" },
    ],
  },
  {
    id: "elden-ring",
    title: "Elden Ring",
    titleHe: "אלדן רינג",
    category: "Soulslike",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
    summary:
      "אקשן RPG מאתגר בעולם פנטזיה פתוח, עם בוסים גדולים, בניית דמות עמוקה וחופש חקירה.",
    tags: ["אקשן", "פנטזיה", "אתגר"],
    rating: "מתאים למי שאוהב אתגר",
    releaseYear: 2022,
    deals: [
      { store: "Steam", price: 239, originalPrice: 239, discount: 0, url: "https://store.steampowered.com/" },
      { store: "Epic Games Store", price: 167, originalPrice: 239, discount: 30, url: "https://store.epicgames.com/" },
      { store: "Humble Store", price: 179, originalPrice: 239, discount: 25, url: "https://www.humblebundle.com/store" },
    ],
  },
  {
    id: "hades",
    title: "Hades",
    titleHe: "האדס",
    category: "Roguelike",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
    summary:
      "אקשן מהיר ומדויק מהעולם התחתון, עם ריצות קצרות, דמויות בלתי נשכחות ושדרוגים משתנים.",
    tags: ["אינדי", "אקשן", "רוגלייק"],
    rating: "מעולה לסשנים קצרים",
    releaseYear: 2020,
    deals: [
      { store: "Steam", price: 42, originalPrice: 95, discount: 56, url: "https://store.steampowered.com/" },
      { store: "Epic Games Store", price: 38, originalPrice: 95, discount: 60, url: "https://store.epicgames.com/" },
      { store: "GOG", price: 47, originalPrice: 95, discount: 51, url: "https://www.gog.com/" },
    ],
  },
  {
    id: "disco-elysium",
    title: "Disco Elysium",
    titleHe: "דיסקו אליזיום",
    category: "Narrative",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/632470/header.jpg",
    summary:
      "משחק תפקידים בלשי עם כתיבה יוצאת דופן, מערכת מיומנויות מקורית והמון החלטות מוזרות.",
    tags: ["בלשי", "עלילה", "אינדי"],
    rating: "כל הזמנים נמוך במיוחד",
    releaseYear: 2019,
    deals: [
      { store: "Steam", price: 24, originalPrice: 139, discount: 83, url: "https://store.steampowered.com/" },
      { store: "GOG", price: 29, originalPrice: 139, discount: 79, url: "https://www.gog.com/" },
      { store: "Humble Store", price: 35, originalPrice: 139, discount: 75, url: "https://www.humblebundle.com/store" },
    ],
  },
  {
    id: "red-dead-redemption-2",
    title: "Red Dead Redemption 2",
    titleHe: "רד דד רדמפשן 2",
    category: "Action",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg",
    summary:
      "מערבון קולנועי בעולם פתוח עם סיפור רחב, רכיבה, שודים, ציד והמון פרטים קטנים.",
    tags: ["עולם פתוח", "אקשן", "סיפור"],
    rating: "עסקה חזקה למחשב",
    releaseYear: 2019,
    deals: [
      { store: "Steam", price: 119, originalPrice: 239, discount: 50, url: "https://store.steampowered.com/" },
      { store: "Epic Games Store", price: 79, originalPrice: 239, discount: 67, url: "https://store.epicgames.com/" },
      { store: "Humble Store", price: 96, originalPrice: 239, discount: 60, url: "https://www.humblebundle.com/store" },
    ],
  },
  {
    id: "hollow-knight",
    title: "Hollow Knight",
    titleHe: "הולו נייט",
    category: "Metroidvania",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg",
    summary:
      "הרפתקת אינדי עמוקה ומדויקת בממלכה תת קרקעית, עם קרבות בוסים, חקר וסודות.",
    tags: ["אינדי", "מטרוידווניה", "אתגר"],
    rating: "תמורה מעולה למחיר",
    releaseYear: 2017,
    deals: [
      { store: "Steam", price: 29, originalPrice: 57, discount: 49, url: "https://store.steampowered.com/" },
      { store: "GOG", price: 29, originalPrice: 57, discount: 49, url: "https://www.gog.com/" },
    ],
  },
  {
    id: "stardew-valley",
    title: "Stardew Valley",
    titleHe: "סטארדיו ואלי",
    category: "Simulation",
    cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg",
    summary:
      "סימולציית חווה רגועה עם דיג, כרייה, חברות, עונות וקצב משחק שמתאים בדיוק לכם.",
    tags: ["חווה", "רגוע", "אינדי"],
    rating: "קניה בטוחה לחובבי סימולציה",
    releaseYear: 2016,
    deals: [
      { store: "Steam", price: 44, originalPrice: 55, discount: 20, url: "https://store.steampowered.com/" },
      { store: "GOG", price: 44, originalPrice: 55, discount: 20, url: "https://www.gog.com/" },
      { store: "Humble Store", price: 49, originalPrice: 55, discount: 11, url: "https://www.humblebundle.com/store" },
    ],
  },
];

export function getBestDeal(game) {
  return [...game.deals].sort((a, b) => a.price - b.price)[0];
}

export function getCategories() {
  return [...new Set(games.map((game) => game.category))].sort();
}

export function getGameById(id) {
  return games.find((game) => game.id === id);
}
