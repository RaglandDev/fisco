import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

async function dbTest() {
  const res = await fetch(`${process.env.API_URL}/api/testendpoint`, {
    cache: 'no-store',
  });
  return res.json();
}

export default async function Home() {

const testData = await dbTest();

  return (
    <>
    <div>Home page</div>

    <SignedOut>
      <SignInButton mode="modal"/>
      <SignUpButton mode="modal"/>
    </SignedOut>

      <SignedIn>
          <UserButton />
      </SignedIn>

    <ul>
        {testData.map((item) => (
          <li key={item.id}>{JSON.stringify(item)}</li>
        ))}
    </ul>
    </>
  );
}
