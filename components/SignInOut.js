import { auth, firestore, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup, signInAnoymously, signOut } from 'firebase/auth';
import { UserContext } from '../lib/context';
//COPY V9 auth code

// Sign in with Google button
export function SignInButton() {
  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleAuthProvider).catch((e) => {
      console.log('error with signing in with google', e);
    });
  };

  return (
    <button className="btn-google" onClick={signInWithGoogle}>
      <img src={'/google.png'} /> Sign in with Google
    </button>
  );
}
// Sign out button
export function SignOutButton() {
  return (
    <button className="btn-google" onClick={signOut(auth)}>
      <img src={'/google.png'} /> Sign out of Google
    </button>
  );
  // <button onClick={() => signOut(auth)}>Sign Out</button>;
}
