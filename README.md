## Testing
All unit tests are located in ``fisco/__tests__``; API routes, client components, and server components have their own separate directories.
- Test framework/runner: [Vitest](https://vitest.dev/)
- Component testing: [React testing library](https://testing-library.com/docs/react-testing-library/intro/)
-  API mocking: [MSW](https://mswjs.io/)

tip: ``screen.debug();`` can be very useful when debugging component tests

### Server-side components (async) 
- Testing components from @/components/server/
- Using Vitest to mock API responses from @/lib/
- React testing library is primarily for testing synchronous, client-side components (whose render time is not bottlenecked by a network), so when using it with server components here don't forget to use ``await``

### Client-side components (sync)
- Testing components from @/components/client/
- Mostly prop-passing to client-side components and then checking that they render the props correctly with React testing library

### Next.js API Routes
- Testing API endpoints from @/api/*/
- Using MSW to intercept http requests to the API endpoints, and then mock a response
- The ``handlers`` array contains specified endpoints and the response that they will return

### Commands
- ``npm run test`` runs tests and hot-reloads when you save changes to a file
- ``npm run coverage`` runs tests once and generates a coverage report in ``fisco/coverage/``

### Misc.
- Try to get >=95% code coverage on tests
- Still trying to figure out how to test Next.js server actions
- ``vitest.config.mts`` is Vitest's config file
- Following naming convention and add ``.test.tsx`` in order for Vitest to recognize your tests

##  Application Overview 
Core application located in ``fisco/app/``
### Next.js Server Actions
- Located in ``fisco/app/actions``
- POST requests to the database for mutating data

### Next.js API Routes
- Located in ``fisco/app/api/``
- GET requests to the database for retrieving data
- Each endpoint in ``api/`` has its own named directory with a ``route.ts`` file inside of it

### React Components
- Located in ``fisco/app/components/``
- Separated into two separate directories; one for server-side components, and one for client-side components

#### Client-side
- Located in ``fisco/app/components/client/``
- `'use client'` must be written at the top of the file
- These should **not** be making any requests to the database
- These **should** display data passed down as props from parents

#### Server-side
- Located in ``fisco/app/components/server/``
- These can make requests to the database

### Library
- Located in ``fisco/app/lib/``
- A good place to put your async functions that make API calls

### ``route-example/``
This is an example of Next.js file-based routing, where each subdirectory of ``app/`` that has a ``page.tsx`` in it will become a Next.js route. So this directory is reachable as a route from http://localhost:3000/route-example.

### ``types/``
This is where all of our types live. Global types are in ``types/index.d.ts`` and any types needed for a new component can be placed in a new file ``component_name.ts``.

## Other
- Don't forget to set your .env variables and place it in ``fisco/``
- ``package.json`` is where you can add or change scripts, as well as view installed packages
- Remember to ``npm run build`` and ``npm run start`` before you push to make sure the production build doesn't fail
- If you install new packages that are only needed for development and not production, use ``npm install -D YourPackageNameHere``
- ``git pull`` frequently to avoid merge conflicts

## Useful commands
- ``npm install``
- ``npm run build``
- ``npm run start``
- ``npm run dev``
- ``npm run test``
- ``npm run coverage``
- ``npm run lint``
- ``npm install -D <...>``
