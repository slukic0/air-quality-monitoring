import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useSession } from "./hooks/useSession";

function App() {
  const [message, setMessage] = useState("Hi 👋");

  function onClick() {
    fetch(`${import.meta.env.VITE_APP_API_URL}/`)
      .then((response) => response.text())
      .then(setMessage);
  }

  const {loading, session} = useSession();

  const signOut = async () => {
    localStorage.removeItem("session");
    window.location.replace(window.location.origin)
  };

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
