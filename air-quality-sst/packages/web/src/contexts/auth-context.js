import { useCallback, createContext, useContext, useEffect, useReducer, useRef } from 'react';
import PropTypes from 'prop-types';

const HANDLERS = {
  INITIALIZE: 'INITIALIZE',
  SIGN_OUT: 'SIGN_OUT',
};

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
};

const handlers = {
  [HANDLERS.INITIALIZE]: (state, action) => {
    const user = action.payload;

    return {
      ...state,
      ...// if payload (user) is provided, then is authenticated
      (user
        ? {
            isAuthenticated: true,
            isLoading: false,
            user,
          }
        : {
            isLoading: false,
          }),
    };
  },
  [HANDLERS.SIGN_OUT]: (state) => {
    return {
      ...state,
      isAuthenticated: false,
      user: null,
    };
  },
};

const reducer = (state, action) =>
  handlers[action.type] ? handlers[action.type](state, action) : state;

// The role of this context is to propagate authentication state through the App tree.

export const AuthContext = createContext({ undefined });

export const AuthProvider = (props) => {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false);

  /**
   * Get token from local storage
   */
  const getTokenLocalStorage = useCallback(() => localStorage.getItem('session'), []);

  /**
   * Clear token from local storage
   */
  const clearTokenLocalStorage = useCallback(() => localStorage.removeItem('session'), []);

  /**
   * Check if the URL contains the token query string when the page loads
   * If so, store it in local storage and then redirect the user to the root domain
   */
  const getTokenUrl = useCallback(() => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const token = params.get('token');
    if (token) {
      console.log('Found token in URL');
      localStorage.setItem('session', token);
      window.location.replace(window.location.origin);
    }
    return token;
  }, []);

  /**
   * Get user info from DB
   * @param {String} token
   */
  const getUserInfo = useCallback(async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/session`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.json();
    } catch (error) {
      console.log('Error getting session', error);
    }
  }, []);

  const initialize = useCallback(async () => {
    // Prevent from calling twice in development mode with React.StrictMode enabled
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    let token = null;

    try {
      token = getTokenLocalStorage() ?? getTokenUrl();
    } catch (err) {
      console.error(err);
    }

    if (token) {
      const user = await getUserInfo(token);

      dispatch({
        type: HANDLERS.INITIALIZE,
        payload: { ...user, token },
      });
    } else {
      dispatch({
        type: HANDLERS.INITIALIZE,
      });
    }
  }, [getTokenLocalStorage, getTokenUrl, getUserInfo]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const signOut = () => {
    clearTokenLocalStorage();
    dispatch({
      type: HANDLERS.SIGN_OUT,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export const AuthConsumer = AuthContext.Consumer;

export const useAuthContext = () => useContext(AuthContext);
