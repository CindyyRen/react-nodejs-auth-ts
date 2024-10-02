import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import axios from 'axios';

// User interface
interface User {
  id: string;
  username: string;
}

// AuthContextType defines the shape of the context value
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create the context with the correct type, starting as undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for consuming the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// The AuthProvider component that provides authentication state
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State for storing the authenticated user
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Effect to validate the token on initial load
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(
            'http://localhost:3001/validate-token',
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data.isValid) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            // Token not valid, remove it
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Error validating token:', error);
          localStorage.removeItem('token');
        }
      }
    };

    validateToken();
  }, []);

  // Login function, should be marked as async
  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await axios.post('http://localhost:3001/login', {
        username,
        password,
      });
      const { token, user } = response.data; // Assuming the response contains both token and user
      localStorage.setItem('token', token);
      setUser(user); // Set the logged-in user
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Context value to be provided
  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated,
  };

  // Provide the context value to children
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
