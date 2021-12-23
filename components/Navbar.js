import Link from 'next/link';
import { useContext } from 'react';
import { UserContext } from '../lib/context';
import { SignInButton, SignOutButton } from './SignInOut';
// Top navbar
export default function Navbar() {
  const { user, username } = useContext(UserContext);

  return (
    <nav className="navbar">
      <ul>
        <li>
          <Link href="/">
            <button className="btn-logo">Succinct Cut</button>
          </Link>
        </li>
        <li>
          {user === null && (
            <Link href="/enter">
              <button className="btn-blue">Log in</button>
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
