import { useContext } from 'react';
import { UserContext } from '../lib/context';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

import { auth, googleAuthProvider } from '../lib/firebase';

// Top navbar
export default function Enter(props) {
  const { user, username } = useContext(UserContext);
  // 1. user signed out <SignInButton />
  // 2. user signed in, but missing username <UsernameForm />
  // 3. user signed in, has username <SignOutButton />
  return <main>{user ? <SignOutButton /> : <SignInButton />}</main>;
}

const signInWithGoogle = async () => {
  try {
    signInWithPopup(auth, googleAuthProvider)
      .then((result) => {
        console.log('in signin with popup');
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        // ...
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
  } catch (e) {
    console.log('error with signing in', e);
  }
};
// Sign in with Google button
function SignInButton() {
  return (
    <button className="btn-google" onClick={signInWithGoogle}>
      <img src={'/google.png'} /> Sign in with Google
    </button>
  );
}

// Sign out button
function SignOutButton() {
  return <button onClick={() => auth.signOut()}>Sign Out</button>;
}

function UsernameForm() {
  return null;
}
