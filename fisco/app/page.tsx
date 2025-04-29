import Home from '@/components/server/Home.server';

export default async function App({ searchParams }: { searchParams: Promise<{ offset?: string }> }) {
  const { offset } = await searchParams;
  const parsedOffset = offset ? parseInt(offset, 10) : 0;

  return <Home offset={parsedOffset} />;
}
