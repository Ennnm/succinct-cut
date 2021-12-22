import { auth, firestore, googleAuthProvider } from '../lib/firebase';
import {
  signInWithPopup,
  signInAnonymously,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import { UserContext } from '../lib/context';
//COPY V9 auth code

import { useEfect, useState, useCallback, useContext } from 'react';

// Top navbar
export default function Enter(props) {
  const { user, username } = useContext(UserContext);

  // 1. user signed out <SignInButton />
  // 2. user signed in, but missing username <UsernameForm />
  // 3. user signed in, has username <SignOutButton />
  return <main>{user ? <SignOutButton /> : <SignInButton />}</main>;
}
// Sign in with Google button
function SignInButton() {
  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleAuthProvider).catch((error) => {
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
    <>
      <button className="btn-google" onClick={signInWithGoogle}>
        <img src={'/google.png'} width="30px" /> Sign in with Google
      </button>
    </>
  );
}

const onClickSignOut = (e) => {
  e.preventDefault();
  signOut(auth).catch((e) => {
    console.log('error in signing out');
  });
};
// Sign out button
function SignOutButton() {
  return <button onClick={onClickSignOut}>Sign Out</button>;
  // return <button onClick={() => signOut(auth)}>Sign Out</button>;
}
