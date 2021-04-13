# QRLS

QRLS (Questionable Research Labs Signon)

This is the new and improved software for manging the attendance of QRL members and guests.

Requires the following environment variables
(Can use a .env file)

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
DB_DATABASE=attendance_db

```