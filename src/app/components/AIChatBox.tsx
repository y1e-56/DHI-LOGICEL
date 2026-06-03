import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Bot, User, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { suggerePriorite, suggereDeveloppeur } from '../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatBoxProps {
  open?: boolean;
  onClose?: () => void;
  context?: 'anomalie' | 'general';
  fonctionnaliteId?: string;
}

export function AIChatBox({ open = true, onClose, context = 'general', fonctionnaliteId }: AIChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Bonjour ! Je suis votre assistant IA pour QualityTrack. Je peux vous aider avec :\n\n• Suggérer une priorité pour votre anomalie\n• Recommander un développeur à assigner\n• Répondre à vos questions sur les tests\n\nComment puis-je vous aider ?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { currentUser, users } = useAuth();
  const { anomalies, fonctionnalites } = useData();

  const developpeurs = users.filter((u: any) => u.role === 'developpeur');

  useEffect(() => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  }, [messages]);

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const messageLower = userMessage.toLowerCase();

    // Détection de la demande de suggestion de priorité
    if (messageLower.includes('priorité') || messageLower.includes('priorite') || messageLower.includes('priority')) {
      // Essayer d'extraire un titre/description du message
      const priorite = suggerePriorite(userMessage, '');
      return `Basé sur votre description, je suggère une priorité **${priorite}**.\n\nLes critères utilisés sont :\n• Critique : crash, sécurité, données, production\n• Haute : bug, erreur, performance\n• Moyenne : amélioration, optimisation\n• Basse : cosmétique, optionnel`;
    }

    // Détection de la demande de suggestion de développeur
    if (messageLower.includes('développeur') || messageLower.includes('developpeur') || messageLower.includes('developer') || messageLower.includes('assigner')) {
      if (developpeurs.length === 0) {
        return 'Aucun développeur disponible dans le système.';
      }

      const devSuggere = suggereDeveloppeur(
        { titre: userMessage, description: '' },
        anomalies,
        developpeurs
      );

      if (devSuggere) {
        const dev = developpeurs.find((d: any) => d.id === devSuggere);
        return `Je recommande d'assigner cette anomalie à **${dev?.prenom} ${dev?.nom}**.\n\nCette recommandation est basée sur l'historique des résolutions d'anomalies similaires.`;
      }

      return "Je ne peux pas suggérer de développeur spécifique pour le moment. Vous pouvez choisir n'importe quel développeur disponible.";
    }

    // Réponses générales sur QualityTrack
    if (messageLower.includes('anomalie') || messageLower.includes('bug')) {
      return "Pour signaler une anomalie :\n1. Allez dans \"Mes tâches\"\n2. Cliquez sur \"Anomalie\" pour la fonctionnalité concernée\n3. Remplissez le formulaire avec titre, description et priorité\n4. L'IA vous suggérera automatiquement la priorité et le développeur à assigner.";
    }

    if (messageLower.includes('test') || messageLower.includes('tester')) {
      return "Pour tester une fonctionnalité :\n1. Accédez à \"Mes tâches\"\n2. Sélectionnez une fonctionnalité assignée\n3. Cliquez sur \"Conforme\" si elle passe les tests\n4. Cliquez sur \"Anomalie\" si vous détectez un problème";
    }

    if (messageLower.includes('aide') || messageLower.includes('help')) {
      return "Je peux vous aider avec :\n\n• **Priorité** : \"Quelle priorité pour un crash de login ?\"\n• **Développeur** : \"Quel développeur assigner pour ce bug ?\"\n• **Processus** : \"Comment signaler une anomalie ?\"\n• **Tests** : \"Comment tester une fonctionnalité ?\"";
    }

    // Réponse par défaut
    return "Je suis là pour vous aider avec QualityTrack. Vous pouvez me demander :\n\n• \"Quelle priorité pour cette anomalie ?\"\n• \"Quel développeur assigner ?\"\n• \"Comment signaler un bug ?\"\n• \"Aide\" pour voir toutes les commandes";
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-purple-200">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-semibold text-purple-900">Assistant IA</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 p-4 overflow-y-auto" ref={messagesContainerRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t p-4 bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez une question à l'IA..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
