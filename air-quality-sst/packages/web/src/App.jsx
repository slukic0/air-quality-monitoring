import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [message, setMessage] = useState("Hi 👋");

  function onClick() {
    fetch(`${import.meta.env.VITE_APP_API_URL}/`)
      .then((response) => response.text())
      .then(setMessage);
  }

  const [session, setSession] = useState(null);

  /**
   * Check if user has already has a token stored
   */
  const getSession = async () => {
    const token = localStorage.getItem("session");
    if (token) {
      console.log('Found existing token');
      setSession(token);
    }
  };

  useEffect(() => {
    getSession();
  }, []);

  /**
   * Check if the URL contains the token query string when the page loads
   * If so, store it in local storage and then redirect the user to the root domain
   */
  useEffect(() => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const token = params.get("token");
    if (token) {
      console.log('Found token in URL');
      localStorage.setItem("session", token);
      window.location.replace(window.location.origin);
    }
  }, []);

  const signOut = async () => {
    localStorage.removeItem("session");
    setSession(null);
  };

  return (
    <div className="App">
      <div className="card">
        <button onClick={onClick}>
          Message is "<i>{message}</i>"
        </button>
      </div>
      <div className="container">
        <h2>SST Auth Example</h2>
        {session ? (
          <div>
            <p>Yeah! You are signed in.</p>
            <button onClick={signOut}>Sign out</button>
          </div>
        ) : (
          <div>
            <a
              href={`${import.meta.env.VITE_APP_API_URL}/auth/google/authorize`}
              rel="noreferrer"
            >
              <button>Sign in with Google</button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
