// pages/auth/signout.js
import { signOut } from "next-auth/react";

const SignOut = () => (
  <div>
    <button onClick={() => signOut()}>Sign Out</button>
  </div>
);

export default SignOut;
