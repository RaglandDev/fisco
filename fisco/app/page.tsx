import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@actions/user.action"

async function dbTest() {
  const res = await fetch(`${process.env.API_URL}/api/testendpoint`, {
    cache: 'no-store',
  });
  return res.json();
}

export default async function Home() {

const testData = await dbTest();
const user = await currentUser();
if (user) await syncUser();

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
