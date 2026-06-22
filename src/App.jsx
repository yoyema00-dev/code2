import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import { supabase } from "./lib/supabase.js";
import {
  LiveGameDetailsPage,
  LiveHomePage,
  LiveSearchPage,
  LiveWishlistPage,
} from "./live/LiveDealsPages.jsx";
import { fetchStores, getBestDeal } from "./services/gameDeals.js";
import { games, getCategories, getGameById, stores } from "./data/games.js";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatPrice(price) {
  return currency.format(price);
}

function useWishlist(userId) {
  const [wishlist, setWishlist] = useState([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState("");

  useEffect(() => {
    if (!userId) {
      setWishlist([]);
      setWishlistError("");
      return;
    }

    let isMounted = true;

    async function loadWishlist() {
      if (!supabase) return;

      setIsWishlistLoading(true);
      setWishlistError("");

      const { data, error } = await supabase
        .from("wishlist_items")
        .select("game_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setWishlist([]);
        setWishlistError("לא ניתן לטעון את רשימת המעקב כרגע.");
      } else {
        setWishlist(data.map((item) => item.game_id));
      }

      setIsWishlistLoading(false);
    }

    loadWishlist();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const toggleWishlist = async (gameId) => {
    if (!userId || !supabase) return;

    const isSaved = wishlist.includes(gameId);
    setWishlistError("");

    if (isSaved) {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", userId)
        .eq("game_id", gameId);

      if (error) {
        setWishlistError("לא ניתן להסיר את המשחק כרגע.");
        return;
      }

      setWishlist((current) => current.filter((id) => id !== gameId));
      return;
    }

    const { error } = await supabase.from("wishlist_items").insert({ user_id: userId, game_id: gameId });

    if (error) {
      setWishlistError("לא ניתן לשמור את המשחק כרגע.");
      return;
    }

    setWishlist((current) => (current.includes(gameId) ? current : [gameId, ...current]));
  };

  return { wishlist, toggleWishlist, isWishlistLoading, wishlistError };
}

function Layout({ wishlistCount, user, onLogout, children }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand" aria-label="GameDeal Finder דף הבית">
          <span className="brand-mark">GD</span>
          <span>
            <strong>GameDeal Finder</strong>
            <small>השוואת דילים חוקיים למשחקי PC</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label="ניווט ראשי">
          <NavLink to="/">בית</NavLink>
          <NavLink to="/search">חיפוש</NavLink>
          <NavLink to="/wishlist">רשימת מעקב ({wishlistCount})</NavLink>
          {user ? (
            <>
              <NavLink to="/profile">החשבון שלי</NavLink>
              {user.isAdmin && <NavLink to="/admin">ניהול משתמשים</NavLink>}
              <button type="button" className="nav-button" onClick={onLogout}>
                התנתקות
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">התחברות</NavLink>
              <NavLink to="/register">הרשמה</NavLink>
            </>
          )}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <span>המחירים מוצגים בדולר ארה"ב ומתעדכנים ממקור המחירים של CheapShark.</span>
        <span>מוצגות חנויות פעילות שהן מפיצות רשמיות בלבד. המחיר הסופי עשוי להשתנות לפי אזור ומס.</span>
      </footer>
    </div>
  );
}

const MIN_PASSWORD_LENGTH = 8;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getRedirectPath(location) {
  const from = location.state?.from;
  return from ? `${from.pathname}${from.search ?? ""}` : "/profile";
}

function LoadingState({ text = "טוען..." }) {
  return (
    <section className="section">
      <div className="empty-state">
        <h2>{text}</h2>
      </div>
    </section>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

function AuthPageShell({ eyebrow, title, text, children, footer }) {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </section>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setStatus("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!isValidEmail(form.email)) nextErrors.email = "הזינו כתובת אימייל תקינה.";
    if (!form.password) nextErrors.password = "הזינו סיסמה.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await login(form);
      navigate(getRedirectPath(location), { replace: true });
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <AuthPageShell
      eyebrow="Login"
      title="התחברות לחשבון"
      text="התחברו כדי לשמור משחקים ברשימת מעקב אישית ולנהל פרטי חשבון."
      footer={
        <>
          אין לכם חשבון? <Link to="/register">הרשמה מהירה</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {status && <p className="form-alert">{status}</p>}
        <label>
          אימייל
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            autoComplete="email"
          />
          {errors.email && <span>{errors.email}</span>}
        </label>
        <label>
          סיסמה
          <input
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            autoComplete="current-password"
          />
          {errors.password && <span>{errors.password}</span>}
        </label>
        <button type="submit">התחברות</button>
      </form>
    </AuthPageShell>
  );
}

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setStatus("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = "הזינו שם מלא.";
    if (!isValidEmail(form.email)) nextErrors.email = "הזינו כתובת אימייל תקינה.";
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `הסיסמה צריכה להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים.`;
    }
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "אימות הסיסמה לא תואם.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await register(form);
      navigate("/profile", { replace: true });
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <AuthPageShell
      eyebrow="Register"
      title="יצירת חשבון חדש"
      text="צרו חשבון Supabase כדי לעקוב אחרי משחקים ודילים מכל כניסה שלכם."
      footer={
        <>
          כבר יש לכם חשבון? <Link to="/login">התחברות</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {status && <p className="form-alert">{status}</p>}
        <label>
          שם מלא
          <input
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            autoComplete="name"
          />
          {errors.fullName && <span>{errors.fullName}</span>}
        </label>
        <label>
          אימייל
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            autoComplete="email"
          />
          {errors.email && <span>{errors.email}</span>}
        </label>
        <label>
          סיסמה
          <input
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            autoComplete="new-password"
          />
          {errors.password && <span>{errors.password}</span>}
        </label>
        <label>
          אימות סיסמה
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) => updateField("confirmPassword", event.target.value)}
            autoComplete="new-password"
          />
          {errors.confirmPassword && <span>{errors.confirmPassword}</span>}
        </label>
        <button type="submit">הרשמה</button>
      </form>
    </AuthPageShell>
  );
}

function ProfilePage({ wishlistCount }) {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: user.fullName });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");

  const createdAt = new Intl.DateTimeFormat("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(user.createdAt));

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setStatus("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = "הזינו שם מלא.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await updateProfile(form);
      setStatus("הפרטים עודכנו בהצלחה.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <section className="section profile-layout">
      <div className="profile-summary">
        <p className="eyebrow">Account</p>
        <h1>החשבון שלי</h1>
        <dl>
          <div>
            <dt>שם מלא</dt>
            <dd>{user.fullName}</dd>
          </div>
          <div>
            <dt>אימייל</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>תאריך יצירה</dt>
            <dd>{createdAt}</dd>
          </div>
          <div>
            <dt>משחקים במעקב</dt>
            <dd>{wishlistCount}</dd>
          </div>
        </dl>
        <button type="button" className="logout-button" onClick={handleLogout}>
          התנתקות
        </button>
      </div>

      <div className="profile-card">
        <h2>עדכון פרטים</h2>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {status && <p className={status.includes("בהצלחה") ? "form-success" : "form-alert"}>{status}</p>}
          <label>
            שם מלא
            <input value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
            {errors.fullName && <span>{errors.fullName}</span>}
          </label>
          <button type="submit">שמירת שינויים</button>
        </form>
      </div>
    </section>
  );
}

function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [status, setStatus] = useState("");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setStatus("");

    const { data, error } = await supabase.functions.invoke("admin-users", {
      method: "GET",
    });

    if (error) {
      setStatus("לא ניתן לטעון את המשתמשים כרגע.");
      setIsLoading(false);
      return;
    }

    setUsers(data.users ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const deleteUser = async (targetUser) => {
    if (pendingDeleteId !== targetUser.id) {
      setPendingDeleteId(targetUser.id);
      setStatus(`לחצו שוב כדי למחוק לצמיתות את ${targetUser.email}.`);
      return;
    }

    setDeletingId(targetUser.id);
    setStatus("");

    const { error } = await supabase.functions.invoke("admin-users", {
      method: "DELETE",
      body: { userId: targetUser.id },
    });

    if (error) {
      setStatus("המחיקה נכשלה. המשתמש לא נמחק.");
      setDeletingId("");
      return;
    }

    setUsers((current) => current.filter((item) => item.id !== targetUser.id));
    setPendingDeleteId("");
    setDeletingId("");
    setStatus(`המשתמש ${targetUser.email} נמחק לצמיתות.`);
  };

  return (
    <section className="section admin-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>ניהול משתמשים</h1>
          <p>מחיקה מסירה לצמיתות את החשבון, הפרופיל ורשימת המעקב.</p>
        </div>
        <button type="button" className="secondary-action" onClick={loadUsers} disabled={isLoading}>
          רענון
        </button>
      </div>

      {status && <p className={status.includes("נמחק לצמיתות") ? "form-success" : "form-alert"}>{status}</p>}

      {isLoading ? (
        <LoadingState text="טוען משתמשים..." />
      ) : (
        <div className="admin-users-card">
          <div className="admin-users-header">
            <strong>{users.length} משתמשים</strong>
            <span>רק חשבונות מנהל יכולים לגשת לעמוד הזה</span>
          </div>
          <div className="admin-users-list">
            {users.map((account) => {
              const isCurrentUser = account.id === user.id;
              const isConfirming = pendingDeleteId === account.id;

              return (
                <article className="admin-user-row" key={account.id}>
                  <div>
                    <strong>{account.fullName || account.email}</strong>
                    <span>{account.email}</span>
                    <small>נרשם: {new Date(account.createdAt).toLocaleDateString("he-IL")}</small>
                  </div>
                  <div className="admin-user-actions">
                    {account.isAdmin && <span className="admin-badge">מנהל</span>}
                    <button
                      type="button"
                      className={isConfirming ? "danger-button confirming" : "danger-button"}
                      disabled={isCurrentUser || deletingId === account.id}
                      onClick={() => deleteUser(account)}
                    >
                      {isCurrentUser
                        ? "החשבון הנוכחי"
                        : deletingId === account.id
                          ? "מוחק..."
                          : isConfirming
                            ? "אישור מחיקה לצמיתות"
                            : "מחיקת משתמש"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function HomePage({ wishlist, onToggleWishlist }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const hotDeals = useMemo(
    () => [...games].sort((a, b) => getBestDeal(b).discount - getBestDeal(a).discount).slice(0, 4),
    [],
  );
  const heroGame = getGameById("disco-elysium");
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
          <p className="eyebrow">לגיימרים שמחכים למחיר הנכון</p>
          <h1>מצאו את הדיל החוקי הכי טוב למשחק הבא שלכם.</h1>
          <p>
            חיפוש אחד מציג השוואת מחירים, אחוזי הנחה וקישור ישיר לחנות הדיגיטלית המשתלמת
            ביותר, בממשק עברי שמותאם לימין לשמאל.
          </p>

          <form className="search-panel" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="home-search">
              חיפוש משחק
            </label>
            <input
              id="home-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="חפשו Cyberpunk, Hades, אלדן רינג..."
            />
            <button type="submit">חיפוש דילים</button>
          </form>
        </div>

        <Link className="hero-deal" to={`/game/${heroGame.id}`} aria-label={`דיל מומלץ עבור ${heroGame.title}`}>
          <span className="discount-badge">{heroDeal.discount}% הנחה</span>
          <span className="deal-kicker">דיל בולט עכשיו</span>
          <h2>{heroGame.title}</h2>
          <p>{heroGame.rating}</p>
          <strong>{formatPrice(heroDeal.price)}</strong>
          <small>ב-{heroDeal.store}</small>
        </Link>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Hot Deals</p>
            <h2>הנחות חמות עכשיו</h2>
          </div>
          <Link className="text-link" to="/search?discount=50">
            כל הדילים מעל 50%
          </Link>
        </div>

        <div className="game-grid">
          {hotDeals.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isSaved={wishlist.includes(game.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </section>

      <section className="value-grid" aria-label="יתרונות השירות">
        <article>
          <span>01</span>
          <strong>השוואת מחירים מרוכזת</strong>
          <p>טבלה אחת עם חנויות, מחיר, עומק הנחה וקישור רכישה במקום לקפוץ בין טאבים.</p>
        </article>
        <article>
          <span>02</span>
          <strong>עברית ו-RTL כבר מה-MVP</strong>
          <p>זרימת ממשק מקומית, מחירים בשקלים ותוכן שמתאים לשוק דובר העברית.</p>
        </article>
        <article>
          <span>03</span>
          <strong>רשימת מעקב להתראות עתידיות</strong>
          <p>שמירת משחקים למעקב מחיר, עם מקום ברור להרחבת התראות ואימות משתמשים בהמשך.</p>
        </article>
      </section>
    </>
  );
}

function SearchPage({ wishlist, onToggleWishlist }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedStore, setSelectedStore] = useState("all");
  const [category, setCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState(250);
  const [minDiscount, setMinDiscount] = useState(Number(searchParams.get("discount") ?? 0));

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setMinDiscount(Number(searchParams.get("discount") ?? 0));
  }, [searchParams]);

  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const hebrewQuery = query.trim();

    return games
      .filter((game) => {
        const bestDeal = getBestDeal(game);
        const matchesQuery =
          !normalizedQuery ||
          game.title.toLowerCase().includes(normalizedQuery) ||
          game.titleHe.includes(hebrewQuery) ||
          game.tags.some((tag) => tag.includes(hebrewQuery));
        const matchesStore =
          selectedStore === "all" || game.deals.some((deal) => deal.store === selectedStore);
        const matchesCategory = category === "all" || game.category === category;
        const matchesPrice = bestDeal.price <= maxPrice;
        const matchesDiscount = bestDeal.discount >= minDiscount;

        return matchesQuery && matchesStore && matchesCategory && matchesPrice && matchesDiscount;
      })
      .sort((a, b) => getBestDeal(a).price - getBestDeal(b).price);
  }, [category, maxPrice, minDiscount, query, selectedStore]);

  const runSearch = (event) => {
    event.preventDefault();
    const nextParams = new URLSearchParams();
    if (query.trim()) nextParams.set("q", query.trim());
    if (minDiscount > 0) nextParams.set("discount", String(minDiscount));
    setSearchParams(nextParams);
  };

  const resetFilters = () => {
    setQuery("");
    setSelectedStore("all");
    setCategory("all");
    setMaxPrice(250);
    setMinDiscount(0);
    setSearchParams({});
  };

  return (
    <section className="section search-layout">
      <aside className="filters-panel">
        <h1>חיפוש דילים</h1>
        <form onSubmit={runSearch} className="filters-form">
          <label>
            שם משחק
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="שם משחק או תגית"
            />
          </label>

          <label>
            חנות
            <select value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)}>
              <option value="all">כל החנויות</option>
              {stores.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </label>

          <label>
            קטגוריה
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">כל הקטגוריות</option>
              {getCategories().map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            מחיר מקסימלי: {formatPrice(maxPrice)}
            <input
              type="range"
              min="20"
              max="250"
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

          <button type="submit">עדכון תוצאות</button>
          <button type="button" className="secondary-action" onClick={resetFilters}>
            ניקוי סינון
          </button>
        </form>
      </aside>

      <div className="results-panel">
        <div className="results-topline">
          <div>
            <p className="eyebrow">Search Results</p>
            <h2>{filteredGames.length} משחקים נמצאו</h2>
          </div>
          <span>ממוינים לפי המחיר הטוב ביותר הזמין</span>
        </div>

        {filteredGames.length > 0 ? (
          <div className="game-grid">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isSaved={wishlist.includes(game.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="לא נמצאו משחקים"
            text="נסו להרחיב את טווח המחיר, להוריד את אחוז ההנחה או לחפש שם אחר."
          />
        )}
      </div>
    </section>
  );
}

function GameCard({ game, isSaved, onToggleWishlist }) {
  const bestDeal = getBestDeal(game);

  return (
    <article className="game-card">
      <Link to={`/game/${game.id}`} className="card-media">
        <img src={game.cover} alt="" loading="lazy" />
        <span className="discount-badge">{bestDeal.discount}% הנחה</span>
      </Link>

      <div className="card-body">
        <div className="meta-row">
          <span>{game.category}</span>
          <span>{game.releaseYear}</span>
        </div>
        <h3>
          <Link to={`/game/${game.id}`}>{game.title}</Link>
        </h3>
        <p>{game.summary}</p>

        <div className="price-row">
          <strong>{formatPrice(bestDeal.price)}</strong>
          <del>{formatPrice(bestDeal.originalPrice)}</del>
          <span>{bestDeal.store}</span>
        </div>

        <div className="card-actions">
          <Link className="primary-action" to={`/game/${game.id}`}>
            השוואה מלאה
          </Link>
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

function GameDetailsPage({ wishlist, onToggleWishlist }) {
  const { id } = useParams();
  const game = getGameById(id);

  if (!game) {
    return <Navigate to="/search" replace />;
  }

  const bestDeal = getBestDeal(game);
  const isSaved = wishlist.includes(game.id);
  const sortedDeals = [...game.deals].sort((a, b) => a.price - b.price);

  return (
    <section className="section detail-page">
      <div className="detail-hero">
        <img src={game.cover} alt="" />
        <div className="detail-copy">
          <p className="eyebrow">{game.category}</p>
          <h1>{game.title}</h1>
          <p>{game.summary}</p>

          <div className="tag-list">
            {game.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="deal-summary">
            <span>המחיר הטוב ביותר</span>
            <strong>{formatPrice(bestDeal.price)}</strong>
            <small>
              {bestDeal.discount}% הנחה ב-{bestDeal.store}
            </small>
          </div>

          <div className="detail-actions">
            <a className="primary-action" href={bestDeal.url} target="_blank" rel="noreferrer">
              מעבר לחנות
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
        </div>
      </div>

      <section className="comparison-card" aria-labelledby="comparison-title">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Price Comparison</p>
            <h2 id="comparison-title">השוואת מחירים</h2>
          </div>
          <span>עודכן להדגמה: היום</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>חנות</th>
                <th>מחיר</th>
                <th>מחיר מקורי</th>
                <th>הנחה</th>
                <th>פעולה</th>
              </tr>
            </thead>
            <tbody>
              {sortedDeals.map((deal) => (
                <tr key={deal.store} className={deal.store === bestDeal.store ? "best-row" : ""}>
                  <td>
                    <strong>{deal.store}</strong>
                    {deal.store === bestDeal.store && <span>הכי זול</span>}
                  </td>
                  <td>{formatPrice(deal.price)}</td>
                  <td>
                    <del>{formatPrice(deal.originalPrice)}</del>
                  </td>
                  <td>{deal.discount}%</td>
                  <td>
                    <a href={deal.url} target="_blank" rel="noreferrer">
                      קנה עכשיו
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function WishlistPage({ wishlist, onToggleWishlist, isLoading, error }) {
  const savedGames = games.filter((game) => wishlist.includes(game.id));
  const totalPotentialSavings = savedGames.reduce((sum, game) => {
    const bestDeal = getBestDeal(game);
    return sum + (bestDeal.originalPrice - bestDeal.price);
  }, 0);

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Wishlist</p>
          <h1>רשימת מעקב והתרעות מחיר</h1>
        </div>
        <Link className="text-link" to="/search">
          הוספת משחקים
        </Link>
      </div>

      <div className="dashboard-strip">
        <article>
          <span>משחקים במעקב</span>
          <strong>{savedGames.length}</strong>
        </article>
        <article>
          <span>חיסכון פוטנציאלי</span>
          <strong>{formatPrice(totalPotentialSavings)}</strong>
        </article>
        <article>
          <span>התראות מחיר</span>
          <strong>בקרוב</strong>
        </article>
      </div>

      {error && <p className="form-alert">{error}</p>}

      {isLoading && <LoadingState text="טוען את רשימת המעקב..." />}

      {!isLoading && savedGames.length > 0 ? (
        <div className="watchlist">
          {savedGames.map((game) => {
            const bestDeal = getBestDeal(game);
            return (
              <article key={game.id} className="watchlist-row">
                <img src={game.cover} alt="" />
                <div>
                  <h2>{game.title}</h2>
                  <p>
                    יעד מומלץ: התראה כאשר המחיר ירד מתחת ל-{formatPrice(Math.max(20, bestDeal.price - 10))}
                  </p>
                </div>
                <strong>{formatPrice(bestDeal.price)}</strong>
                <Link to={`/game/${game.id}`}>השוואה</Link>
                <button type="button" onClick={() => onToggleWishlist(game.id)}>
                  הסרה
                </button>
              </article>
            );
          })}
        </div>
      ) : !isLoading ? (
        <EmptyState
          title="רשימת המעקב ריקה"
          text="שמרו משחקים מתוצאות החיפוש כדי לעקוב אחרי ירידות מחיר ולבנות בסיס להתראות עתידיות."
          action={<Link to="/search">חיפוש משחקים</Link>}
        />
      ) : null}
    </section>
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

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [liveStores, setLiveStores] = useState([]);
  const [storesError, setStoresError] = useState("");
  const { wishlist, toggleWishlist, isWishlistLoading, wishlistError } = useWishlist(user?.id);

  useEffect(() => {
    let active = true;

    fetchStores()
      .then((stores) => {
        if (active) {
          setLiveStores(stores);
          setStoresError("");
        }
      })
      .catch((error) => {
        if (active) setStoresError(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleToggleWishlist = async (gameId) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    await toggleWishlist(gameId);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <Layout wishlistCount={wishlist.length} user={user} onLogout={handleLogout}>
      <Routes>
        <Route
          path="/"
          element={
            storesError ? (
              <section className="section">
                <EmptyState title="שירות המחירים אינו זמין" text={storesError} />
              </section>
            ) : (
              <LiveHomePage
                stores={liveStores}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
              />
            )
          }
        />
        <Route
          path="/search"
          element={
            <LiveSearchPage
              stores={liveStores}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
            />
          }
        />
        <Route
          path="/game/:id"
          element={
            <LiveGameDetailsPage
              stores={liveStores}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
            />
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <LiveWishlistPage
                stores={liveStores}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                isLoading={isWishlistLoading}
                error={wishlistError}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage wishlistCount={wishlist.length} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
