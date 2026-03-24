# Opis projektu

Projekt realizuje prosty serwer HTTP stworzony w Node.js z wykorzystaniem frameworka Express oraz silnika szablonów EJS. Tematem projektu jest aplikacja do zapisów na zawody Baja Poland Cross Country. Aplikacja umożliwia użytkownikom rejestrację uczestników zawodów, wyświetlanie listy uczestników, usuwanie oraz edycję zapisanych uczestników.

Dodatkowo projekt zawiera system logowania i rejestracji użytkowników oparty o hashowanie haseł (argon2) z użyciem "pepper" i sesji użytkownika przechowywanych w bazie SQLite.

## Konto administratora

Przy starcie aplikacja tworzy konto administratora automatycznie w bazie, jeśli jeszcze nie istnieje:

- `username`: wartość `ADMIN_USERNAME` z `.env`, domyślnie `admin`
- `password`: wartość `ADMIN_PASSWORD` z `.env`, domyślnie `admin1234`
- `is_admin`: `1`

Dzięki temu zawsze możesz się zalogować i mieć pełne uprawnienia.

### Jak się zalogować jako admin

1. Wejdź na stronę logowania: `http://localhost:6767/auth/login`
2. Podaj dane administratora:
   - login: `admin` (lub `ADMIN_USERNAME` z `.env`)
   - hasło: `admin1234` (lub `ADMIN_PASSWORD` z `.env`)
3. Po zalogowaniu zobaczysz, że możesz edytować i usuwać wszystkie wpisy uczestników.

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

### 5. Ustawienie zmiennych środowiskowych

Aplikacja automatycznie pobiera zmienne z pliku `.env` korzystając z `dotenv`.
Przykład pliku `.env`:
```ini
SECRET=moja-tajna-wartosc
PEPPER=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin1234
PORT=6767
```

Jeżeli nie podasz `ADMIN_USERNAME` / `ADMIN_PASSWORD`, aplikacja utworzy konto `admin` / `admin1234`.

### 6. Uruchomienie serwera:
```bash
node index.js
```

### 7. Otwarcie aplikacji w przeglądarce:
http://localhost:6767

