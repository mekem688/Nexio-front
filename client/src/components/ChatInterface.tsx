import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { loginUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Info, Phone, Video, Plus, Smile, Send, MessageCircle } from "lucide-react";
import type { User, Message } from "@shared/schema";

interface ChatInterfaceProps {
  currentUser: User;
  selectedConversation: string | null;
  selectedUser: User | null;
  onBackToList: () => void;
}

export default function ChatInterface({
  currentUser,
  selectedConversation,
  selectedUser,
  onBackToList,
}: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation,
    refetchInterval: 5000,
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest('POST', '/api/messages', {
        conversationId: selectedConversation,
        content,
      });
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversation, 'messages'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = loginUrl(); }, 500);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer le message",
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || isPending) return;
    sendMessage(messageInput.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Écran vide — visible sur tablette/bureau quand aucune conversation n'est ouverte
  if (!selectedConversation || !selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card" data-testid="empty-chat">
        <div className="text-center max-w-xs px-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
            Sélectionnez une conversation
          </h3>
          <p className="text-sm text-muted-foreground">
            Choisissez un utilisateur dans la liste pour commencer à chatter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card" data-testid="chat-interface">

      {/* En-tête sticky */}
      <div className="sticky top-0 z-10 px-3 py-2.5 md:px-4 md:py-3 border-b border-border bg-card/95 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3">

          {/* Bouton retour — visible uniquement sur mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-10 w-10 p-0 flex-shrink-0"
            onClick={onBackToList}
            aria-label="Retour à la liste"
            data-testid="button-back-to-list"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={selectedUser.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
              alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover"
              data-testid="img-chat-partner-avatar"
            />
            {selectedUser.isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent border-2 border-white rounded-full" />
            )}
          </div>

          {/* Nom et statut */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm md:text-base text-foreground truncate leading-tight" data-testid="text-chat-partner-name">
              {selectedUser.firstName} {selectedUser.lastName}
            </p>
            <p className="text-xs text-accent leading-tight" data-testid="text-chat-partner-status">
              {selectedUser.isOnline ? "En ligne" : "Hors ligne"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 md:h-10 md:w-10 p-0"
              aria-label="Informations"
              data-testid="button-user-info"
            >
              <Info className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex h-9 w-9 md:h-10 md:w-10 p-0"
              aria-label="Appel vocal"
              data-testid="button-voice-call"
            >
              <Phone className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex h-9 w-9 md:h-10 md:w-10 p-0"
              aria-label="Appel vidéo"
              data-testid="button-video-call"
            >
              <Video className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Zone des messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 md:px-4 space-y-3 md:space-y-4"
        data-testid="messages-container"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full" data-testid="loading-messages">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full" data-testid="empty-messages">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Aucun message pour l'instant</p>
              <p className="text-xs text-muted-foreground mt-1">Envoyez le premier message !</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUser.id;
            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 md:gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}
                data-testid={`message-${message.id}`}
              >
                <img
                  src={
                    isOwn
                      ? currentUser.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                      : selectedUser.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                  }
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1"
                  data-testid={`img-message-avatar-${message.id}`}
                />
                <div className={`max-w-[78%] sm:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-secondary text-foreground rounded-bl-sm'
                    }`}
                  >
                    <span data-testid={`text-message-content-${message.id}`}>
                      {message.content}
                    </span>
                  </div>
                  <p
                    className={`text-xs text-muted-foreground px-1 ${isOwn ? 'text-right' : 'text-left'}`}
                    data-testid={`text-message-time-${message.id}`}
                  >
                    {formatTime(message.createdAt || new Date().toISOString())}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div
        className="flex-shrink-0 px-3 py-2.5 md:px-4 md:py-3 border-t border-border bg-card/95 backdrop-blur-sm"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex h-10 w-10 p-0 flex-shrink-0"
            aria-label="Pièce jointe"
            data-testid="button-attachment"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <div className="flex-1 relative">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message..."
              className="rounded-full text-sm pl-4 pr-10 h-10 border-2 focus:border-primary/60 bg-secondary/50"
              disabled={isPending}
              data-testid="input-message"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full"
              aria-label="Emoji"
              data-testid="button-emoji"
            >
              <Smile className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isPending}
            className="h-10 w-10 p-0 rounded-full flex-shrink-0"
            aria-label="Envoyer"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
