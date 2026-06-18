import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  fetchDeals,
  fetchGame,
  fetchGamesByIds,
  getBestDeal,
  getPurchaseStatus,
} from "../services/gameDeals.js";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatPrice(price) {
  return currency.format(price);
}

function formatUpdatedAt(value) {
  if (!value) return "לא ידוע";

  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function LoadingState({ text }) {
  return (
    <div className="empty-state">
      <h2>{text}</h2>
    </div>
  );
}

function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}

const purchaseStatusLabels = {
  "on-sale": "מבצע פעיל וזמין",
  "full-price": "זמין ללא מבצע",
  unavailable: "לא זמין כרגע",
};

function PurchaseStatus({ game }) {
  const status = getPurchaseStatus(game);

  return (
    <span className={`availability-badge availability-${status}`}>
      {purchaseStatusLabels[status]}
    </span>
  );
}

function LiveGameCard({ game, isSaved, onToggleWishlist }) {
  const bestDeal = getBestDeal(game);
  const purchaseStatus = getPurchaseStatus(game);

  return (
    <article className="game-card">
      <Link to={`/game/${game.id}`} className="card-media">
        <img src={game.cover} alt={game.title} loading="lazy" />
        {bestDeal?.discount > 0 && (
          <span className="discount-badge">{bestDeal.discount}% הנחה</span>
        )}
      </Link>

      <div className="card-body">
        <div className="meta-row">
          <span>PC</span>
          <PurchaseStatus game={game} />
        </div>
        <h3>
          <Link to={`/game/${game.id}`}>{game.title}</Link>
        </h3>
        <p>{game.summary}</p>

        <div className="price-row">
          <strong>{bestDeal ? formatPrice(bestDeal.price) : "לא זמין"}</strong>
          {bestDeal && bestDeal.originalPrice > bestDeal.price && (
            <del>{formatPrice(bestDeal.originalPrice)}</del>
          )}
          <span>{bestDeal?.store ?? "אין חנות פעילה"}</span>
        </div>

        <div className="card-actions">
          {purchaseStatus === "unavailable" ? (
            <span className="primary-action disabled-action">לא זמין לרכישה</span>
          ) : (
            <Link className="primary-action" to={`/game/${game.id}`}>
              כל המחירים
            </Link>
          )}
          <button
            type="button"
            className={isSaved ? "save-button saved" : "save-button"}
            onClick={() => onToggleWishlist(game.id)}
            aria-pressed={isSaved}
          >
            {isSaved ? "נשמר" : "מעקב"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function LiveHomePage({ stores, wishlist, onToggleWishlist }) {
  const [query, setQuery] = useState("");
  const [hotDeals, setHotDeals] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const navigate = useNavigate();

  useEffect(() => {
    if (stores.length === 0) return undefined;

    let active = true;

    async function loadDeals() {
      setStatus({ loading: true, error: "" });

      try {
        const data = await fetchDeals({ stores, onSale: true, pageSize: 24 });
        if (active) {
          setHotDeals(data.slice(0, 8));
          setStatus({ loading: false, error: "" });
        }
      } catch (error) {
        if (active) setStatus({ loading: false, error: error.message });
      }
    }

    loadDeals();
    const refreshTimer = window.setInterval(loadDeals, 15 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [stores]);

  const heroGame = hotDeals[0];
  const heroDeal = getBestDeal(heroGame);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">מחירים חיים ממפיצים רשמיים</p>
          <h1>מצאו את הדיל החוקי הכי טוב למשחק הבא שלכם.</h1>
          <p>
            השוו מחירים בין Steam, Epic Games, GOG, Fanatical, Humble Store וחנויות
            מורשות נוספות, עם קישור לעמוד הרכישה של כל הצעה.
          </p>

          <form className="search-panel" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="home-search">
              חיפוש משחק
            </label>
            <input
              id="home-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="חפשו Cyberpunk, Hades, Elden Ring..."
            />
            <button type="submit">חיפוש מחירים</button>
          </form>
        </div>

        {heroGame && heroDeal ? (
          <Link
            className="hero-deal live-hero-deal"
            to={`/game/${heroGame.id}`}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.94)), url("${heroGame.cover}")`,
            }}
          >
            <span className="discount-badge">{heroDeal.discount}% הנחה</span>
            <span className="deal-kicker">דיל חי בולט</span>
            <h2>{heroGame.title}</h2>
            <p>{heroGame.rating}</p>
            <strong>{formatPrice(heroDeal.price)}</strong>
            <small>ב-{heroDeal.store}</small>
          </Link>
        ) : (
          <div className="hero-deal hero-loading">
            <strong>{status.loading ? "טוען דילים חיים..." : "הדילים יחזרו בקרוב"}</strong>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Live Deals</p>
            <h2>הנחות חמות עכשיו</h2>
          </div>
          <Link className="text-link" to="/search?discount=50">
            כל הדילים מעל 50%
          </Link>
        </div>

        {status.error && <p className="form-alert">{status.error}</p>}
        {status.loading && <LoadingState text="מעדכן מחירים מהחנויות..." />}

        {!status.loading && hotDeals.length > 0 && (
          <div className="game-grid">
            {hotDeals.map((game) => (
              <LiveGameCard
                key={game.id}
                game={game}
                isSaved={wishlist.includes(game.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        )}
      </section>

      <section className="value-grid" aria-label="יתרונות השירות">
        <article>
          <span>01</span>
          <strong>{stores.length} חנויות פעילות</strong>
          <p>חנויות שמוכרות ישירות מטעם מפתחים ומפיצים, ללא שווקי מפתחות אפורים.</p>
        </article>
        <article>
          <span>02</span>
          <strong>מחירים שמתעדכנים לאורך היום</strong>
          <p>הנתונים מתרעננים אוטומטית ומציגים מחיר, מחיר רגיל ואחוז הנחה בדולר.</p>
        </article>
        <article>
          <span>03</span>
          <strong>מעבר בטוח לעמוד הרכישה</strong>
          <p>כל הצעה משתמשת בקישור העסקה הרשמי של ספק הנתונים וממשיכה לחנות המורשית.</p>
        </article>
      </section>
    </>
  );
}

export function LiveSearchPage({ stores, wishlist, onToggleWishlist }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedStore, setSelectedStore] = useState(searchParams.get("store") ?? "all");
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get("price") ?? 100));
  const [minDiscount, setMinDiscount] = useState(Number(searchParams.get("discount") ?? 0));
  const [availability, setAvailability] = useState(searchParams.get("availability") ?? "all");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setSelectedStore(searchParams.get("store") ?? "all");
    setMaxPrice(Number(searchParams.get("price") ?? 100));
    setMinDiscount(Number(searchParams.get("discount") ?? 0));
    setAvailability(searchParams.get("availability") ?? "all");
  }, [searchParams]);

  useEffect(() => {
    if (stores.length === 0) return;

    let active = true;

    async function loadResults() {
      setStatus({ loading: true, error: "" });

      try {
        const games = await fetchDeals({
          stores,
          query: searchParams.get("q") ?? "",
          storeId: searchParams.get("store") ?? "",
          pageSize: 60,
        });

        if (active) {
          setResults(games);
          setStatus({ loading: false, error: "" });
        }
      } catch (error) {
        if (active) setStatus({ loading: false, error: error.message });
      }
    }

    loadResults();
    return () => {
      active = false;
    };
  }, [searchParams, stores]);

  const filteredGames = useMemo(
    () => {
      const normalizedQuery = query.trim().toLowerCase();

      return results
        .filter((game) => {
          const bestDeal = getBestDeal(game);
          const purchaseStatus = getPurchaseStatus(game);
          const matchesAvailability =
            availability === "all" || purchaseStatus === availability;
          const matchesPrice = !bestDeal || bestDeal.price <= maxPrice;
          const matchesDiscount = !bestDeal || bestDeal.discount >= minDiscount;

          return matchesAvailability && matchesPrice && matchesDiscount;
        })
        .sort((a, b) => {
          const aExact = a.title.toLowerCase() === normalizedQuery;
          const bExact = b.title.toLowerCase() === normalizedQuery;
          if (aExact !== bExact) return aExact ? -1 : 1;
          return getBestDeal(a).price - getBestDeal(b).price;
        });
    },
    [availability, maxPrice, minDiscount, query, results],
  );

  const runSearch = (event) => {
    event.preventDefault();
    const nextParams = new URLSearchParams();
    if (query.trim()) nextParams.set("q", query.trim());
    if (selectedStore !== "all") nextParams.set("store", selectedStore);
    if (maxPrice !== 100) nextParams.set("price", String(maxPrice));
    if (minDiscount > 0) nextParams.set("discount", String(minDiscount));
    if (availability !== "all") nextParams.set("availability", availability);
    setSearchParams(nextParams);
  };

  const resetFilters = () => {
    setQuery("");
    setSelectedStore("all");
    setMaxPrice(100);
    setMinDiscount(0);
    setAvailability("all");
    setSearchParams({});
  };

  return (
    <section className="section search-layout">
      <aside className="filters-panel">
        <h1>חיפוש משחקים ודילים</h1>
        <form onSubmit={runSearch} className="filters-form">
          <label>
            שם משחק
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="לדוגמה: Baldur's Gate 3"
            />
          </label>

          <label>
            חנות מורשית
            <select value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)}>
              <option value="all">כל החנויות הפעילות</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            זמינות לרכישה
            <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
              <option value="all">כל המצבים</option>
              <option value="on-sale">מבצע פעיל וזמין</option>
              <option value="full-price">זמין ללא מבצע</option>
              <option value="unavailable">לא זמין כרגע</option>
            </select>
          </label>

          <label>
            מחיר מקסימלי: {formatPrice(maxPrice)}
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
            />
          </label>

          <label>
            הנחה מינימלית: {minDiscount}%
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minDiscount}
              onChange={(event) => setMinDiscount(Number(event.target.value))}
            />
          </label>

          <button type="submit">חיפוש בזמן אמת</button>
          <button type="button" className="secondary-action" onClick={resetFilters}>
            ניקוי סינון
          </button>
        </form>
      </aside>

      <div className="results-panel">
        <div className="results-topline">
          <div>
            <p className="eyebrow">Live Search</p>
            <h2>{status.loading ? "מחפש..." : `${filteredGames.length} משחקים נמצאו`}</h2>
          </div>
          <span>עד 60 תוצאות חיות בכל חיפוש</span>
        </div>

        {status.error && <p className="form-alert">{status.error}</p>}
        {status.loading && <LoadingState text="בודק מחירים בחנויות..." />}

        {!status.loading && filteredGames.length > 0 ? (
          <div className="game-grid">
            {filteredGames.map((game) => (
              <LiveGameCard
                key={game.id}
                game={game}
                isSaved={wishlist.includes(game.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        ) : !status.loading ? (
          <EmptyState
            title="לא נמצאו משחקים"
            text="נסו שם אחר, חנות אחרת או טווח מחיר והנחה רחבים יותר."
          />
        ) : null}
      </div>
    </section>
  );
}

export function LiveGameDetailsPage({ stores, wishlist, onToggleWishlist }) {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [status, setStatus] = useState({ loading: true, error: "" });

  useEffect(() => {
    if (!id || stores.length === 0) return;

    let active = true;
    setStatus({ loading: true, error: "" });

    fetchGame(id, stores)
      .then((data) => {
        if (active) {
          setGame(data);
          setStatus({ loading: false, error: "" });
        }
      })
      .catch((error) => {
        if (active) setStatus({ loading: false, error: error.message });
      });

    return () => {
      active = false;
    };
  }, [id, stores]);

  if (status.loading) {
    return (
      <section className="section">
        <LoadingState text="טוען מחירים עדכניים..." />
      </section>
    );
  }

  if (status.error || !game) {
    return (
      <section className="section">
        <EmptyState
          title="לא ניתן לטעון את המשחק"
          text={status.error || "המשחק אינו זמין כרגע."}
          action={<Link to="/search">חזרה לחיפוש</Link>}
        />
      </section>
    );
  }

  const bestDeal = getBestDeal(game);
  const isSaved = wishlist.includes(game.id);

  return (
    <section className="section detail-page">
      <div className="detail-hero">
        <img src={game.cover} alt={game.title} />
        <div className="detail-copy">
          <p className="eyebrow">Live PC Prices</p>
          <h1>{game.title}</h1>
          <p>{game.summary}</p>

          <div className="tag-list">
            <PurchaseStatus game={game} />
            {game.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
            {game.historicalLow && (
              <span>שפל היסטורי {formatPrice(game.historicalLow.price)}</span>
            )}
          </div>

          {bestDeal ? (
            <>
              <div className="deal-summary">
                <span>המחיר הטוב ביותר כרגע</span>
                <strong>{formatPrice(bestDeal.price)}</strong>
                <small>
                  {bestDeal.discount}% הנחה ב-{bestDeal.store}
                </small>
              </div>

              <div className="detail-actions">
                <a className="primary-action" href={bestDeal.url} target="_blank" rel="noreferrer">
                  מעבר לעמוד הקנייה
                </a>
                <button
                  type="button"
                  className={isSaved ? "save-button saved" : "save-button"}
                  onClick={() => onToggleWishlist(game.id)}
                  aria-pressed={isSaved}
                >
                  {isSaved ? "ברשימת המעקב" : "הוסף לרשימת מעקב"}
                </button>
              </div>
            </>
          ) : (
            <p className="form-alert">אין כרגע הצעה פעילה למשחק הזה.</p>
          )}
        </div>
      </div>

      <section className="comparison-card" aria-labelledby="comparison-title">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Price Comparison</p>
            <h2 id="comparison-title">השוואת מחירים בין חנויות מורשות</h2>
          </div>
          <span>נטען לאחרונה: {formatUpdatedAt(game.lastUpdated)}</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>חנות</th>
                <th>זמינות</th>
                <th>מחיר</th>
                <th>מחיר רגיל</th>
                <th>הנחה</th>
                <th>פעולה</th>
              </tr>
            </thead>
            <tbody>
              {game.deals.map((deal) => (
                <tr key={deal.id} className={deal.id === bestDeal?.id ? "best-row" : ""}>
                  <td>
                    <span className="store-name">
                      {deal.storeIcon && <img src={deal.storeIcon} alt="" />}
                      <strong>{deal.store}</strong>
                    </span>
                    {deal.id === bestDeal?.id && <span>הכי זול</span>}
                  </td>
                  <td>
                    <span
                      className={`availability-badge ${
                        deal.isOnSale
                          ? "availability-on-sale"
                          : deal.isAvailable
                            ? "availability-full-price"
                            : "availability-unavailable"
                      }`}
                    >
                      {deal.isOnSale
                        ? "מבצע פעיל"
                        : deal.isAvailable
                          ? "זמין"
                          : "לא זמין"}
                    </span>
                  </td>
                  <td>{formatPrice(deal.price)}</td>
                  <td>
                    {deal.originalPrice > deal.price ? (
                      <del>{formatPrice(deal.originalPrice)}</del>
                    ) : (
                      formatPrice(deal.originalPrice)
                    )}
                  </td>
                  <td>{deal.discount}%</td>
                  <td>
                    {deal.isAvailable ? (
                      <a href={deal.url} target="_blank" rel="noreferrer">
                        לעמוד הקנייה
                      </a>
                    ) : (
                      <span className="unavailable-action">לא זמין</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="data-note">
          קישורי הרכישה עוברים דרך CheapShark כנדרש בתנאי ה-API וממשיכים להצעה בחנות.
          המחיר בקופה עשוי להשתנות לפי מדינה, מטבע ומסים.
        </p>
      </section>
    </section>
  );
}

export function LiveWishlistPage({
  stores,
  wishlist,
  onToggleWishlist,
  isLoading,
  error,
}) {
  const [savedGames, setSavedGames] = useState([]);
  const [pricesStatus, setPricesStatus] = useState({ loading: false, error: "" });

  useEffect(() => {
    if (isLoading || stores.length === 0 || wishlist.length === 0) {
      if (wishlist.length === 0) setSavedGames([]);
      return;
    }

    let active = true;
    setPricesStatus({ loading: true, error: "" });

    fetchGamesByIds(wishlist, stores)
      .then((games) => {
        if (active) {
          setSavedGames(games);
          setPricesStatus({ loading: false, error: "" });
        }
      })
      .catch((loadError) => {
        if (active) setPricesStatus({ loading: false, error: loadError.message });
      });

    return () => {
      active = false;
    };
  }, [isLoading, stores, wishlist]);

  const totalPotentialSavings = savedGames.reduce((sum, game) => {
    const bestDeal = getBestDeal(game);
    return bestDeal ? sum + (bestDeal.originalPrice - bestDeal.price) : sum;
  }, 0);
  const loading = isLoading || pricesStatus.loading;

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Live Wishlist</p>
          <h1>רשימת מעקב עם מחירים עדכניים</h1>
        </div>
        <Link className="text-link" to="/search">
          הוספת משחקים
        </Link>
      </div>

      <div className="dashboard-strip">
        <article>
          <span>משחקים במעקב</span>
          <strong>{wishlist.length}</strong>
        </article>
        <article>
          <span>חיסכון נוכחי</span>
          <strong>{formatPrice(totalPotentialSavings)}</strong>
        </article>
        <article>
          <span>מקור המחירים</span>
          <strong>Live</strong>
        </article>
      </div>

      {(error || pricesStatus.error) && (
        <p className="form-alert">{error || pricesStatus.error}</p>
      )}
      {loading && <LoadingState text="מעדכן את מחירי רשימת המעקב..." />}

      {!loading && savedGames.length > 0 ? (
        <div className="watchlist">
          {savedGames.map((game) => {
            const bestDeal = getBestDeal(game);
            return (
              <article key={game.id} className="watchlist-row">
                <img src={game.cover} alt={game.title} />
                <div>
                  <h2>{game.title}</h2>
                  <PurchaseStatus game={game} />
                  <p>{bestDeal ? `ההצעה הזולה כרגע: ${bestDeal.store}` : "אין הצעה פעילה"}</p>
                </div>
                <strong>{bestDeal ? formatPrice(bestDeal.price) : "-"}</strong>
                <Link to={`/game/${game.id}`}>השוואה</Link>
                <button type="button" onClick={() => onToggleWishlist(game.id)}>
                  הסרה
                </button>
              </article>
            );
          })}
        </div>
      ) : !loading ? (
        <EmptyState
          title="רשימת המעקב ריקה"
          text="שמרו משחקים מתוצאות החיפוש כדי לקבל את המחירים העדכניים שלהם בכל כניסה."
          action={<Link to="/search">חיפוש משחקים</Link>}
        />
      ) : null}
    </section>
  );
}
