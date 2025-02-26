# Character Cards API

A simple API for serving character data for the Memory Card Game.

## Environment Variables

This API uses environment variables for configuration. You can set these in a `.env` file in the root directory or in your deployment platform.

### Available Environment Variables

- `API_URL`: The base URL of the API. This is used to generate full URLs for media files. Default: Automatically determined from the request.
- `PORT`: The port to run the server on. Default: 3003

### Setting Up Environment Variables

#### Local Development

Create a `.env` file in the root directory with the following content:

```
API_URL=http://localhost:3003
PORT=3003
```

#### Vercel Deployment

The environment variables are configured in the `vercel.json` file:

```json
{
  "env": {
    "API_URL": "https://your-api-url.vercel.app"
  }
}
```

## API Endpoints

### GET /health

Returns a simple "OK2" text response to check if the API is running.

### GET /api/characters

Returns a list of all characters, with optional limit parameter.

Query Parameters:
- `limit`: Maximum number of characters to return (optional)

### GET /api/character/random

Returns a random character.

### GET /api/character/:id

Returns a specific character by ID.

Path Parameters:
- `id`: The ID of the character to retrieve

## Media Files

The API serves static media files from the `public` directory:

- `/music`: MP3 files for character defeat music
- `/videos`: MP4 files for character defeat videos

## Development

To run the API locally:

```bash
npm install
npm run dev
```

## Deployment

This API is designed to be deployed to Vercel. The `vercel.json` file contains the necessary configuration. 