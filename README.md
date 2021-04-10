# QRLS

QRLS (Questionable Research Labs Signon)

This is the new and improved software for manging the attendance of QRL members
and guests.

The app requires a .env file containing the following 

(PORT IS NOT REQUIRED)

```dotenv
# App web port
PORT=8080

# Google Credentials path
GOOGLE_CREDENTIALS=data/gsheet.json
TOKEN_PATH=data/token.json

# Youth google sheets data
YOUTH_SHEET_ID=
YOUTH_RANGE_NAME=
YOUTH_CACHE_FILE=data/youth.cache.json

# Facilitators google sheets data
FACILITATORS_SHEET_ID=
FACILITATORS_RANGE_NAME=
FACILITATORS_CACHE_FILE=data/facilitators.cache.json

# Database details
DB_HOST=localhost
DB_PORT=3306
DB_USER=user
DB_PASSWORD=password
DB=attendance_db

```