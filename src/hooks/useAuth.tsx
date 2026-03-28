import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  nome: string;
  identificador: string;
  cargo: 'TI' | 'Medico' | 'Enfermeiro' | 'Tecnico' | 'Recepcao';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identificador: string, senha: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hospital_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('hospital_user');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      // Configura o axios para enviar o token em todas as requisições
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setIsLoading(false);
  }, [token]);

  const login = async (identificador: string, senha: string) => {
    try {
      const response = await axios.post('http://localhost:3001/api/login', { identificador, senha });
      const { token, user } = response.data;
      
      localStorage.setItem('hospital_token', token);
      localStorage.setItem('hospital_user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      throw new Error('Usuário ou senha inválidos');
    }
  };

  const logout = () => {
    localStorage.removeItem('hospital_token');
    localStorage.removeItem('hospital_user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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
