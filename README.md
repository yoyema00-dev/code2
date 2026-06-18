GameDeal Finder

## Supabase setup

Environment files are intentionally excluded from Git. Copy `.env.example` to `.env.local`
and fill in the project's public Supabase URL and publishable key from the Supabase Connect
dialog. Never commit `.env`, a Supabase secret key, or a `service_role` key.

Required local configuration:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

## Live game prices

The application now loads active PC game deals and official stores from the CheapShark API.
Prices are returned in USD and are generally refreshed by the provider about once per hour.
Purchase buttons use the required CheapShark deal redirect and continue to the selected store.

For local development the browser can call CheapShark directly:

```env
VITE_USE_DEALS_PROXY=false
```

For production, deploy the Supabase Edge Function and enable the proxy:

```bash
supabase functions deploy game-deals
```

```env
VITE_USE_DEALS_PROXY=true
```

The function is located at `supabase/functions/game-deals/index.ts` and adds caching, CORS
headers and the provider-required User-Agent header.
תיאור הפרויקט

GameDeal Finder הוא פרויקט Frontend להשוואת מחירי משחקי PC מחנויות דיגיטליות חוקיות ואמינות.

האתר מאפשר למשתמשים לחפש משחקים, לראות דילים חמים, להשוות מחירים בין חנויות שונות, להיכנס לעמוד פרטי משחק, ולשמור משחקים לרשימת מעקב לצורך מעקב עתידי אחר ירידות מחיר.

הפרויקט נבנה במסגרת משימה 6 בפרויקט המסכם בפיתוח אתרים, כחלק משלב פיתוח ה־Frontend.

מטרת האתר

מטרת האתר היא לעזור לגיימרים למצוא משחקים במחיר המשתלם ביותר בלי לבדוק ידנית כמה חנויות שונות.

האתר מציג מידע בצורה ברורה ונוחה:

שם המשחק
שם המשחק בעברית
קטגוריה
שנת יציאה
תיאור קצר
מחיר נוכחי
מחיר מקורי
אחוז הנחה
החנות שבה נמצא הדיל
השוואת מחירים בין חנויות
אפשרות לשמירת משחקים לרשימת מעקב
שימוש ב־Stitch

בפרויקט נעשה שימוש ב־Stitch לצורך יצירת כיוון עיצובי ראשוני למסכי האתר.

העיצוב והקוד הראשוני שהתקבלו מ־Stitch שימשו כבסיס ויזואלי ומבני לבניית ממשק המשתמש ב־React.
הקוד הסופי לא נשאר כ־HTML רגיל, אלא הותאם לפרויקט React + Vite עם רכיבים, Routing, Dummy Data ועיצוב RTL.

כלומר:

Stitch Design / HTML / CSS → React Components → React + Vite Frontend
טכנולוגיות בפרויקט

הפרויקט נבנה בעזרת:

React
Vite
React Router DOM
JavaScript
CSS
CSS Variables
LocalStorage
Dummy Data
עמודים באתר

האתר כולל ארבעה עמודים מרכזיים:

1. דף בית — /

דף הבית מציג את האתר, הסבר קצר, אזור חיפוש, דיל מומלץ, דילים חמים ויתרונות השימוש באתר.

2. דף חיפוש משחקים — /search

עמוד שבו המשתמש יכול לחפש משחקים ולסנן לפי:

שם משחק
חנות
קטגוריה
מחיר מקסימלי
אחוז הנחה מינימלי
3. דף פרטי משחק — /game/:id

עמוד דינמי שמציג מידע על משחק מסוים לפי מזהה המשחק ב־URL.

העמוד כולל:

תמונת משחק
שם המשחק
קטגוריה
תיאור
תגיות
המחיר הטוב ביותר
כפתור מעבר לחנות
כפתור הוספה לרשימת מעקב
טבלת השוואת מחירים בין חנויות
4. רשימת מעקב / Wishlist — /wishlist

עמוד שמציג את המשחקים שהמשתמש שמר למעקב.

העמוד כולל:

מספר המשחקים במעקב
חיסכון פוטנציאלי
הודעה על התראות מחיר עתידיות
רשימת משחקים שמורים
אפשרות להסיר משחק מהרשימה

המידע נשמר מקומית בדפדפן באמצעות LocalStorage.

רכיבים מרכזיים

בפרויקט קיימים רכיבים ואזורים מרכזיים כגון:

Layout
Navbar / Header
Footer
HomePage
SearchPage
GameDetailsPage
WishlistPage
GameCard
EmptyState
Price Comparison Table
Filters Panel
Dashboard Strip
Watchlist Row

חלק מהרכיבים נמצאים בקובץ App.jsx. בעתיד ניתן לפצל אותם לקבצים נפרדים בתיקיות components ו־pages.

נתוני דמה — Dummy Data

בשלב זה אין חיבור ל־Backend אמיתי.

הפרויקט משתמש בנתוני דמה מתוך הקובץ:

src/data/games.js

הנתונים כוללים:

משחקים
חנויות
מחירים
מחירים מקוריים
אחוזי הנחה
קטגוריות
תמונות
תיאורים
תגיות

בעתיד ניתן יהיה להחליף את הנתונים האלה בחיבור אמיתי ל־API או למסד נתונים.

איך להריץ את הפרויקט

יש להתקין את התלויות:

npm install

לאחר מכן להריץ את סביבת הפיתוח:

npm run dev

האתר ייפתח בדרך כלל בכתובת:

http://127.0.0.1:5173/

או:

http://localhost:5173/
בניית הפרויקט

כדי ליצור גרסת Build:

npm run build

כדי לבדוק את גרסת ה־Build:

npm run preview
מבנה תיקיות

מבנה הפרויקט הנוכחי:

gamedeal-finder-code2/
├─ index.html
├─ package.json
├─ package-lock.json
├─ vite.config.js
├─ README.md
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ styles.css
   └─ data/
      └─ games.js

מבנה מומלץ להמשך פיתוח:

src/
├─ components/
│  ├─ Navbar.jsx
│  ├─ Footer.jsx
│  ├─ GameCard.jsx
│  └─ EmptyState.jsx
├─ pages/
│  ├─ HomePage.jsx
│  ├─ SearchPage.jsx
│  ├─ GameDetailsPage.jsx
│  └─ WishlistPage.jsx
├─ data/
│  └─ games.js
├─ styles/
│  └─ globals.css
├─ App.jsx
└─ main.jsx
מצב הפרויקט

מה קיים בפרויקט:

React + Vite
React Router
ארבעה עמודים מרכזיים
עיצוב בעברית ובכיוון RTL
חיפוש משחקים
סינון לפי חנות, קטגוריה, מחיר והנחה
כרטיסי משחק
דף פרטי משחק
טבלת השוואת מחירים
Wishlist בסיסי
שמירה מקומית ב־LocalStorage
שימוש ב־Dummy Data
עיצוב עם CSS Variables

מה לא קיים בשלב זה:

Backend אמיתי
התחברות משתמשים אמיתית
API אמיתי למחירי משחקים
התראות מחיר אמיתיות
שמירת Wishlist בענן
מערכת תשלומים
הערות להמשך פיתוח

בעתיד ניתן להוסיף:

חיבור ל־API אמיתי של מחירי משחקים
התחברות והרשמה
שמירת Wishlist לפי משתמש
התראות מחיר אמיתיות
Backend עם Node.js / Express
מסד נתונים כמו Supabase או Firebase
גרפים של היסטוריית מחירים
מערכת Premium / Pro
