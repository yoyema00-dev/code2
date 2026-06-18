const CHEAPSHARK_API = "https://www.cheapshark.com/api/1.0";
const CHEAPSHARK_SITE = "https://www.cheapshark.com";

function getApiBase() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const useProxy = import.meta.env.VITE_USE_DEALS_PROXY === "true";

  if (useProxy && supabaseUrl) {
    return `${supabaseUrl}/functions/v1/game-deals`;
  }

  return CHEAPSHARK_API;
}

async function request(resource, params = {}) {
  const apiBase = getApiBase();
  const isProxy = apiBase.includes("/functions/v1/");
  const supabasePublishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY;
  const url = new URL(isProxy ? apiBase : `${apiBase}/${resource}`);

  if (isProxy) {
    url.searchParams.set("resource", resource);
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(isProxy && supabasePublishableKey
        ? { apikey: supabasePublishableKey }
        : {}),
    },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "בוצעו יותר מדי בקשות למחירים. נסו שוב בעוד דקה."
        : "שירות המחירים אינו זמין כרגע.",
    );
  }

  return response.json();
}

export function getDealUrl(dealId) {
  return `${CHEAPSHARK_SITE}/redirect?dealID=${dealId}`;
}

export function getStoreImage(path) {
  return path ? `${CHEAPSHARK_SITE}${path}` : "";
}

function getGameCover(steamAppId, fallback) {
  return steamAppId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppId}/header.jpg`
    : fallback;
}

export async function fetchStores() {
  const stores = await request("stores");

  return stores
    .filter((store) => Number(store.isActive) === 1)
    .map((store) => ({
      id: String(store.storeID),
      name: store.storeName,
      icon: getStoreImage(store.images?.icon),
      logo: getStoreImage(store.images?.logo),
    }));
}

function normalizeDeal(deal, storesById) {
  const price = Number(deal.salePrice ?? deal.price);
  const originalPrice = Number(deal.normalPrice ?? deal.retailPrice ?? price);
  const discount = Math.round(Number(deal.savings ?? 0));
  const isAvailable = Boolean(deal.dealID) && Number.isFinite(price) && price >= 0;

  return {
    id: deal.dealID,
    storeId: String(deal.storeID),
    store: storesById.get(String(deal.storeID))?.name ?? `Store ${deal.storeID}`,
    storeIcon: storesById.get(String(deal.storeID))?.icon ?? "",
    price,
    originalPrice,
    discount,
    isAvailable,
    isOnSale: isAvailable && discount > 0 && price < originalPrice,
    url: isAvailable ? getDealUrl(deal.dealID) : "",
  };
}

function groupDeals(rows, stores) {
  const storesById = new Map(stores.map((store) => [store.id, store]));
  const games = new Map();

  rows.forEach((row) => {
    const id = String(row.gameID);
    const existing = games.get(id);
    const deal = normalizeDeal(row, storesById);

    if (existing) {
      existing.deals.push(deal);
      return;
    }

    games.set(id, {
      id,
      title: row.title,
      titleHe: row.title,
      category: "PC",
      cover: getGameCover(row.steamAppID, row.thumb),
      summary: row.steamRatingText
        ? `דירוג שחקני Steam: ${row.steamRatingText} (${row.steamRatingPercent}%).`
        : "השוואת מחירים עדכנית בין מפיצי משחקים רשמיים.",
      tags: [
        row.metacriticScore && row.metacriticScore !== "0"
          ? `Metacritic ${row.metacriticScore}`
          : null,
        row.steamRatingText || null,
      ].filter(Boolean),
      rating: row.dealRating ? `ציון דיל ${row.dealRating}/10` : "מחירים חיים",
      releaseYear: row.releaseDate
        ? new Date(Number(row.releaseDate) * 1000).getFullYear()
        : "לא ידוע",
      lastUpdated: row.lastChange
        ? new Date(Number(row.lastChange) * 1000).toISOString()
        : null,
      steamAppId: row.steamAppID || null,
      deals: [deal],
    });
  });

  return [...games.values()].map((game) => ({
    ...game,
    deals: game.deals.sort((a, b) => a.price - b.price),
  }));
}

export async function fetchDeals({
  stores,
  query = "",
  storeId = "",
  pageSize = 60,
  onSale = false,
  sortBy = "DealRating",
} = {}) {
  const rows = await request("deals", {
    pageSize,
    sortBy,
    desc: 0,
    onSale: onSale ? 1 : 0,
    title: query.trim(),
    storeID: storeId,
  });

  return groupDeals(rows, stores);
}

export async function fetchGame(gameId, stores) {
  const data = await request("games", { id: gameId });
  const storesById = new Map(stores.map((store) => [store.id, store]));
  const deals = (data.deals ?? [])
    .map((deal) => normalizeDeal(deal, storesById))
    .sort((a, b) => a.price - b.price);

  return {
    id: String(gameId),
    title: data.info?.title ?? "משחק",
    titleHe: data.info?.title ?? "משחק",
    category: "PC",
    cover: getGameCover(data.info?.steamAppID, data.info?.thumb ?? ""),
    summary: "מחירים עדכניים ממפיצים רשמיים ומורשים בלבד.",
    tags: data.info?.steamAppID ? [`Steam App ${data.info.steamAppID}`] : [],
    rating: data.cheapestPriceEver
      ? `שפל היסטורי: $${Number(data.cheapestPriceEver.price).toFixed(2)}`
      : "השוואת מחירים",
    releaseYear: "לא ידוע",
    lastUpdated: new Date().toISOString(),
    steamAppId: data.info?.steamAppID ?? null,
    historicalLow: data.cheapestPriceEver
      ? {
          price: Number(data.cheapestPriceEver.price),
          date: new Date(Number(data.cheapestPriceEver.date) * 1000).toISOString(),
        }
      : null,
    deals,
  };
}

export async function fetchGamesByIds(gameIds, stores) {
  if (gameIds.length === 0) return [];

  const batches = [];
  for (let index = 0; index < gameIds.length; index += 25) {
    batches.push(gameIds.slice(index, index + 25));
  }

  const responses = await Promise.all(
    batches.map((ids) => request("games", { ids: ids.join(","), format: "array" })),
  );

  const storesById = new Map(stores.map((store) => [store.id, store]));
  const games = responses.flat().map((entry, index) => {
    const id = String(entry.info?.gameID ?? batches.flat()[index]);
    const deals = (entry.deals ?? [])
      .map((deal) => normalizeDeal(deal, storesById))
      .sort((a, b) => a.price - b.price);

    return {
      id,
      title: entry.info?.title ?? "משחק",
      titleHe: entry.info?.title ?? "משחק",
      category: "PC",
      cover: getGameCover(entry.info?.steamAppID, entry.info?.thumb ?? ""),
      summary: "משחק שנשמר ברשימת המעקב האישית.",
      tags: [],
      rating: "במעקב",
      releaseYear: "לא ידוע",
      lastUpdated: new Date().toISOString(),
      deals,
    };
  });

  return games;
}

export function getBestDeal(game) {
  return game?.deals?.length ? game.deals[0] : null;
}

export function getPurchaseStatus(game) {
  const availableDeals = game?.deals?.filter((deal) => deal.isAvailable) ?? [];

  if (availableDeals.length === 0) return "unavailable";
  if (availableDeals.some((deal) => deal.isOnSale)) return "on-sale";
  return "full-price";
}
