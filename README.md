# Another Chat App - Node Server

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:5000](http://localhost:5000) with your browser to see the result.

Then, reach [another-chat-app-client](https://github.com/fieztazica/another-chat-app-client) to get **Client Server** source code.

## Configuration

```json
// config.json
{
    "SECRET_KEY": "secret_key",
    "COOKIE_TOKEN_KEY": "TOKEN",
    "email": {
        "Host": "email_host",
        "Port": 465,
        "Username": "email_username",
        "Password": "email_password"
    },
    "SITE_URL": "frontend_site_url <host:port>",
    "DATABASE_CONNECTION_URL": "mongo db connection string",
    "ROOM_ID_LENGTH": 8 // default room id length
}
```
