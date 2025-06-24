# About

This is the backend that serves JSON-formatted content for interacting with the QSeek FORGE database.

# Environment Variables to Set

In your .env file set the following environment variables

    QSEEK_DATABASE_READ_ONLY_USER=
    QSEEK_DATABASE_READ_ONLY_PASSWORD=
    QSEEK_DATABASE_NAME=
    QSEEK_DATABASE_HOST=localhost
    QSEEK_DATABASE_PORT=5432
    REFRESH_RATE=600
    RATE_TIME_LIMIT_SECONDS=60
    RATE_REQUEST_LIMIT=10
    HOST=127.0.0.1
    PORT=8090

Then you can run this after building

    npm install
    npm build
    cd dist
    node --env-file path/to/.env index.js

