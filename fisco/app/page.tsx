import Home from '@/components/server/Home.server'

export default async function App({ searchParams }: { searchParams: { offset?: string } }) {
  const params = await searchParams; 
  const offset = params.offset ? parseInt(params.offset, 10) : 0;
  
  // Pass the offset as a number to the Home component
  return <Home offset={offset} />;
}


// export default function App() {
//   return (
//     <Home />
//     );
// }
