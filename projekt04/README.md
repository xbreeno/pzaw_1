# Opis projektu

Projekt realizuje prosty serwer HTTP stworzony w Node.js z wykorzystaniem frameworka Express oraz silnika szablonów EJS. Tematem projektu jest aplikacja do zapisów na zawody Baja Poland Cross Country. Aplikacja umożliwia użytkownikom rejestrację uczestników zawodów, wyświetlanie listy uczestników, usuwanie oraz edycję zapisanych uczestników.

Dodatkowo projekt zawiera system logowania i rejestracji użytkowników oparty o hashowanie haseł (argon2) z użyciem "pepper" i sesji użytkownika przechowywanych w bazie SQLite.

## Uruchomienie projektu

### 1. Sklonowanie repozytorium:
```bash
git clone https://github.com/xbreeno/pzaw_1.git
```

### 2. Przejście do folderu projektu:
```bash
cd projekt04
```

### 3. Zainstalowanie wymaganych pakietów:
```bash
npm install
```

### 4. (Opcjonalnie) Dodanie testowych danych:
```bash
node scripts/testdata.js
```

### 5. Ustawienie zmiennych środowiskowych (opcjonalnie, ale zalecane):
- `SECRET` – sekret służący do podpisywania ciasteczek.
- `PEPPER` – 64-znakowy ciąg heksadecymalny używany jako "pepper" przy hashowaniu haseł.

Przykładowo (PowerShell):
```powershell
$env:SECRET = "moja-tajna-wartosc"
$env:PEPPER = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

Jeżeli zmienne nie zostaną ustawione, aplikacja nadal będzie działać, ale bezpieczeństwo będzie niższe.

### 6. Uruchomienie serwera:
```bash
node index.js
```

### 7. Otwarcie aplikacji w przeglądarce:
http://localhost:6767
