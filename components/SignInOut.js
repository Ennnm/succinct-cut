import { auth, firestore, googleAuthProvider } from '../lib/firebase';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import { UserContext } from '../lib/context';
//COPY V9 auth code

// Sign in with Google button

export function SignInButton() {
  // const auth = getAuth();
  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleAuthProvider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        console.log('credential :>> ', credential);
        const token = credential.accessToken;
        console.log('token :>> ', token);

        // The signed-in user info.
        const user = result.user;
        console.log('user :>> ', user);
        // ...
      })
      .catch((error) => {
        // Handle Errors here.
        console.log('error :>> ', error);
        const errorCode = error.code;
        console.log('errorCode :>> ', errorCode);
        const errorMessage = error.message;
        console.log('errorMessage :>> ', errorMessage);
        // The email of the user's account used.
        const email = error.email;
        console.log('email :>> ', email);
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        console.log('credential :>> ', credential);

        // ...
      });
  };

  return (
    <button className="btn-google" onClick={signInWithGoogle}>
      <img src={'/google.png'} /> Sign in with Google
    </button>
  );
}

const onClickSignOut = (e) => {
  e.preventDefault();
  signOut(auth);
};
// Sign out button
export function SignOutButton() {
  // const auth = getAuth();
  return (
    <button className="btn-google" onClick={onClickSignOut}>
      <img src={'/google.png'} /> Sign out of Google
    </button>
  );
  // <button onClick={() => signOut(auth)}>Sign Out</button>;
}
