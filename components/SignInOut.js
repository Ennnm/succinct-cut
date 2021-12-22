import { auth, firestore, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup, signInAnoymously, signOut } from 'firebase/auth';
import { UserContext } from '../lib/context';
//COPY V9 auth code

// Sign in with Google button
export function SignInButton() {
  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleAuthProvider);
  };

  return (
    <>
      <button className="btn-google" onClick={signInWithGoogle}>
        <img src={'/google.png'} width="30px" /> Sign in with Google
      </button>
      <button onClick={() => signInAnonymously(auth)}>
        Sign in Anonymously
      </button>
    </>
  );
}
// Sign out button
export function SignOutButton() {
  return <button onClick={() => signOut(auth)}>Sign Out</button>;
}
