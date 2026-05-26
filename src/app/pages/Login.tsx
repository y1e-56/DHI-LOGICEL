import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { FlaskConical, AlertCircle } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginAttempts, isAccountLocked } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isAccountLocked) {
      setError('Votre compte est temporairement bloqué suite à 5 tentatives de connexion échouées. Veuillez réessayer dans 15 minutes.');
      return;
    }

    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        const remainingAttempts = 5 - (loginAttempts + 1);
        if (remainingAttempts > 0) {
          setError(`Identifiant ou mot de passe incorrect. ${remainingAttempts} tentative(s) restante(s).`);
        } else {
          setError('Votre compte est temporairement bloqué suite à 5 tentatives de connexion échouées. Veuillez réessayer dans 15 minutes.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <FlaskConical className="size-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">TestFlow</CardTitle>
          <CardDescription>
            Plateforme de suivi des tests et de la qualité logiciel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Identifiant</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || isAccountLocked}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || isAccountLocked}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || isAccountLocked}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Comptes de démonstration :
            </p>
            <div className="grid gap-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-accent rounded">
                <span className="font-medium">Admin:</span>
                <code className="bg-background px-2 py-1 rounded">admin@test.com / admin123</code>
              </div>
              <div className="flex justify-between items-center p-2 bg-accent rounded">
                <span className="font-medium">Chef:</span>
                <code className="bg-background px-2 py-1 rounded">chef@test.com / chef123</code>
              </div>
              <div className="flex justify-between items-center p-2 bg-accent rounded">
                <span className="font-medium">Testeur:</span>
                <code className="bg-background px-2 py-1 rounded">testeur@test.com / testeur123</code>
              </div>
              <div className="flex justify-between items-center p-2 bg-accent rounded">
                <span className="font-medium">Dev:</span>
                <code className="bg-background px-2 py-1 rounded">dev@test.com / dev123</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
