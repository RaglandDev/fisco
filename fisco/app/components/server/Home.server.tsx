import {SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs"
import { getHomeData, getPostData } from "@/lib/getHomeData";
import ClientHome from "@/components/client/Home.client";

export default async function Home() {
  const { testData } = await getHomeData();
  // const { testData } = await getHomeData();
  return (
      
    /*  
      <SignedOut> clerk stuff needs to be mocked still
        <SignInButton mode="modal" />
        <SignUpButton mode="modal" />
      </SignedOut>

      <SignedIn>
        <UserButton />
      </SignedIn>
    */
      <>
      
      <ClientHome testData={testData} /> 
    </>
        // <ClientHome posts={posts} />
    );
}