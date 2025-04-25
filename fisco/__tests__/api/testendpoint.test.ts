import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterEach, afterAll, it, expect } from 'vitest';
import { GET } from '@/api/testendpoint/route'; 

//
const handlers = [
  http.get(`${process.env.API_URL}/api/testendpoint`, (req) => {
    return new HttpResponse(JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
];

const server = setupServer(...handlers);


beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'bypass', // Ignore unhandled requests
  });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => server.close());

it('returns mocked data from GET /api/testendpoint', async () => {
  const request = new Request(`${process.env.API_URL}/api/testendpoint`, {
    method: 'GET',
  });

  const response = await fetch(`${process.env.API_URL}/api/testendpoint`);

  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
});
