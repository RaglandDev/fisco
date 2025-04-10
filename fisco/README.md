# Project Directory Overview

## Directory Structure

```
fisco/
├── app/                  
│   ├── actions/          # Mutation functions to interact with the database (Next.js server actions)
│   ├── api/              # API endpoints for fetching data from the database
│   │   └── [endpoint]/   # Each endpoint is organized in its own directory
│   ├── components/       # React components
│   ├── route-example/    # Example Next.js route (e.g., /route-example)
│   ├── layout.tsx        # Root app component, includes ClerkProvider for authentication
│   ├── page.tsx          # Basic top-level component for the homepage
├── package.json          # NPM scripts and project dependencies
```

### Key Files and Directories

- **fisco/config**  
  Configuration files including `.env`. Ensure your environment variables are set here.

- **fisco/app/actions**  
  Contains server-side mutation actions for interacting with the database using Next.js server actions.

- **fisco/app/api**  
  Directory for API endpoints that handle data fetching from the database. Each endpoint has its own subdirectory.

- **fisco/app/components**  
  Place for reusable React components.

- **fisco/app/route-example**  
  Example of a Next.js route. The route is automatically created by the folder (e.g., `localhost:3000/route-example`). The React component for the page goes inside.

- **fisco/app/layout.tsx**  
  The root layout of the application, which includes the `ClerkProvider` component for authentication.

- **fisco/app/page.tsx**  
  The top-level component rendered on the homepage.

## Local Setup

To run the project locally:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the `fisco` subdirectory:
   ```bash
   cd fisco
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Explore the scripts available in `package.json` for additional functionality.

## Useful Notes

- Ensure that your `.env` file is correctly configured in the `fisco/` directory. (see discord)
- For new routes, create a folder under `fisco/app` and add a corresponding React component inside it.
- The `ClerkProvider` is used for authentication and must be included in the `layout.tsx` file.

