# Jak uruchomić Twój żywy Sighting Log (krok po kroku)

Będziesz potrzebować dwóch darmowych kont: **GitHub** (do przechowania kodu) i **Render.com**
(serwer, który go uruchomi). Zero instalowania czegokolwiek na komputerze.

## Krok 1 — Wrzuć kod na GitHub

1. Wejdź na **github.com** i załóż konto (jeśli jeszcze nie masz)
2. Kliknij zielony przycisk **New** (lub `+` w prawym górnym rogu → **New repository**)
3. Nazwij repozytorium np. `sighting-log`, zostaw **Public**, kliknij **Create repository**
4. Na stronie repozytorium kliknij **uploading an existing file** (albo **Add file → Upload files**)
5. Przeciągnij tam wszystkie 3 pliki z tego folderu: `server.js`, `package.json`, `JAK-WDROZYC.md`
6. Kliknij **Commit changes**

## Krok 2 — Uruchom serwer na Render.com

1. Wejdź na **render.com** i załóż konto (możesz zalogować się przez GitHub — najszybciej)
2. Kliknij **New +** → **Web Service**
3. Wybierz swoje repozytorium `sighting-log` z listy (Render poprosi o dostęp do GitHuba — zezwól)
4. W ustawieniach zostaw domyślne, upewnij się że:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Wybierz plan **Free**
6. Rozwiń sekcję **Environment Variables** → kliknij **Add Environment Variable**:
   - Klucz (Key): `YT_API_KEY`
   - Wartość (Value): wklej swój klucz z Google Cloud (ten sam, który już masz)
7. Kliknij **Create Web Service**

Render zbuduje i uruchomi aplikację (zajmie 1–2 minuty). Na górze strony dostaniesz swój
publiczny adres, coś w stylu `https://sighting-log.onrender.com` — to jest Twoja strona,
działająca 24/7. Możesz ją zapisać w zakładkach albo dodać na telefonie do ekranu głównego.

## Uwaga o darmowym planie Render

Darmowy plan "usypia" serwer po ~15 minutach bez odwiedzin. Gdy ktoś (Ty) wejdzie na stronę
po takiej przerwie, obudzenie zajmuje ok. 30–50 sekund, potem działa normalnie. Dane o
filmach i tak są odświeżane przez sam serwer co 10 minut, gdy jest aktywny.

## Jak dodać / zmienić kanały później

Otwórz plik `server.js` na GitHubie (ikona ołówka = edytuj), znajdź listę `CHANNELS` na
górze pliku, dodaj albo usuń wpis w formacie:

```js
{ name: "Nazwa kanału", handle: "NazwaHandle" },
```

albo, jeśli masz ID kanału (zaczyna się od `UC`):

```js
{ name: "Nazwa kanału", id: "UCxxxxxxxxxxxxxxxxxxxxxx" },
```

Zapisz zmiany (**Commit changes**) — Render automatycznie wykryje zmianę na GitHubie i
wdroży nową wersję w ciągu minuty.
