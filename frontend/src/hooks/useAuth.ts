import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextBase';

export const useAuth = () => useContext(AuthContext);