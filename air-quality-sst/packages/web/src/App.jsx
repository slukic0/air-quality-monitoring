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
  const [loading, setLoading] = useState(true);

  /**
   * Check if user has already has a token stored
   */
  const getSession = async () => {
    const token = localStorage.getItem("session");
    if (token) {
      console.log('Found token in localStorage');
      const user = await getUserInfo(token);
      if (user) {
        console.log('Got user info');
        setSession(user);
      }
    }
    setLoading(false);
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
      console.log("Found token in URL");
      localStorage.setItem("session", token);
      window.location.replace(window.location.origin);
    }
  }, []);

  const getUserInfo = async (session) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/session`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session}`,
          },
        }
      );
      return response.json();
    } catch (error) {
      //TODO seems like theres some kinda race condition going on...
      alert(error);
    }
  };

  const signOut = async () => {
    localStorage.removeItem("session");
    setSession(null);
  };

  console.log(import.meta.env.VITE_APP_API_URL);

  if (loading) return <div className="container">Loading...</div>;
  else
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
            <div className="profile">
              <p>Welcome {session.name}!</p>
              <img
                src={session.picture}
                style={{ borderRadius: "50%" }}
                width={100}
                height={100}
                alt=""
              />
              <p>{session.email}</p>
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
