# account-generator

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Development with API Routes (Recommended)

**Important**: The `/api/register` endpoint requires Vercel's serverless function runtime. To test locally:

```sh
# Install Vercel CLI if not already installed
npm install -g vercel

# Run with Vercel dev (this serves both frontend and API routes)
npm run dev:vercel
# or
vercel dev
```

This will:
- Start the Vite frontend
- Serve the `/api/register` serverless function
- Make everything work together locally

### Development without API Routes (Frontend only)

```sh
npm run dev
```

**Note**: This will show 404 errors for `/api/register` because Vite doesn't handle serverless functions. Use `vercel dev` instead.

### Compile and Minify for Production

```sh
npm run build
```

## Environment Variables

For the registration API to work, you need to set:

- `BROWSERLESS_TOKEN` - Your Browserless.io token (required for `api/register.mjs`)

Set these in:
- **Local development**: Create a `.env.local` file or use `vercel env pull`
- **Vercel deployment**: Set in Vercel Dashboard > Settings > Environment Variables

## Firebase Setup

1. Create a Firebase project
2. Enable Firestore Database
3. Add your Firebase config to `.env.local`:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

## API Endpoints

- `POST /api/register` - Register a new account (requires Browserless.io token)
