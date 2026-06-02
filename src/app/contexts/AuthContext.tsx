import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { users as initialUsers } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  isAuthenticated: boolean;
  bloquerUtilisateur: (id: string) => void;
  debloquerUtilisateur: (id: string) => void;
  creerUtilisateur: (user: Omit<User, 'id' | 'tentativesEchouees'>) => void;
  supprimerUtilisateur: (id: string) => void;
  restaurerUtilisateur: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email: string, password: string) => {
    const user = users.find(u => u.email === email);

    if (!user) {
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    if (user.dateSuppression) {
      return { success: false, message: 'Ce compte a été supprimé' };
    }

    if (user.bloqueJusqua && new Date(user.bloqueJusqua) > new Date()) {
      const minutesRestantes = Math.ceil(
        (new Date(user.bloqueJusqua).getTime() - new Date().getTime()) / 60000
      );
      return {
        success: false,
        message: `Compte bloqué. Réessayez dans ${minutesRestantes} minute(s).`,
      };
    }

    if (user.password !== password) {
      const updatedUsers = users.map(u => {
        if (u.id === user.id) {
          const tentatives = u.tentativesEchouees + 1;
          if (tentatives >= 5) {
            const bloqueJusqua = new Date();
            bloqueJusqua.setMinutes(bloqueJusqua.getMinutes() + 15);
            return { ...u, tentativesEchouees: tentatives, bloqueJusqua };
          }
          return { ...u, tentativesEchouees: tentatives };
        }
        return u;
      });
      setUsers(updatedUsers);

      const tentativesRestantes = 5 - (user.tentativesEchouees + 1);
      if (tentativesRestantes <= 0) {
        return {
          success: false,
          message: 'Compte bloqué suite à 5 tentatives échouées. Réessayez dans 15 minutes.',
        };
      }
      return {
        success: false,
        message: `Identifiants incorrects. ${tentativesRestantes} tentative(s) restante(s).`,
      };
    }

    const updatedUsers = users.map(u =>
      u.id === user.id ? { ...u, tentativesEchouees: 0, bloqueJusqua: undefined } : u
    );
    setUsers(updatedUsers);

    const userToSet = { ...user, tentativesEchouees: 0, bloqueJusqua: undefined };
    setCurrentUser(userToSet);
    localStorage.setItem('currentUser', JSON.stringify(userToSet));

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const bloquerUtilisateur = (id: string) => {
    const bloque = new Date();
    bloque.setFullYear(bloque.getFullYear() + 10);
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, bloqueJusqua: bloque, tentativesEchouees: 5 } : u))
    );
  };

  const debloquerUtilisateur = (id: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, bloqueJusqua: undefined, tentativesEchouees: 0 } : u))
    );
  };

  const creerUtilisateur = (user: Omit<User, 'id' | 'tentativesEchouees'>) => {
    const newUser: User = {
      ...user,
      id: `u${Date.now()}`,
      tentativesEchouees: 0,
    };
    setUsers(prev => [...prev, newUser]);
  };

  const supprimerUtilisateur = (id: string) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, dateSuppression: new Date().toISOString() } : u
    ));
  };

  const restaurerUtilisateur = (id: string) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, dateSuppression: undefined } : u
    ));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        isAuthenticated: !!currentUser,
        bloquerUtilisateur,
        debloquerUtilisateur,
        creerUtilisateur,
        supprimerUtilisateur,
        restaurerUtilisateur,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
