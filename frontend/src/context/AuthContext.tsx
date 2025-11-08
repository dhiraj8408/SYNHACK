import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'professor' | 'student';
  department: string;
  enrolledCourses?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: SignupData) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  department: string;    // required
  role: string;  // backend only allows these via signup
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await authService.getMe(storedToken);
          // Map backend user object to frontend User interface
          setUser({
            id: userData._id || userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            department: userData.department || '',
            enrolledCourses: userData.enrolledCourses || [],
          });
          setToken(storedToken);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await authService.login(email, password);
    // After login, fetch full user data including department
    const fullUserData = await authService.getMe(response.token);
    const user: User = {
      id: fullUserData._id || fullUserData.id,
      name: fullUserData.name,
      email: fullUserData.email,
      role: fullUserData.role,
      department: fullUserData.department || '',
      enrolledCourses: fullUserData.enrolledCourses || [],
    };
    setUser(user);
    setToken(response.token);
    localStorage.setItem('token', response.token);
    return user;
  };

  const signup = async (data: SignupData): Promise<User> => {
    const response = await authService.signup(data);
    // After signup, fetch full user data including department
    const fullUserData = await authService.getMe(response.token);
    const user: User = {
      id: fullUserData._id || fullUserData.id,
      name: fullUserData.name,
      email: fullUserData.email,
      role: fullUserData.role,
      department: fullUserData.department || '',
      enrolledCourses: fullUserData.enrolledCourses || [],
    };
    setUser(user);
    setToken(response.token);
    localStorage.setItem('token', response.token);
    return user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
