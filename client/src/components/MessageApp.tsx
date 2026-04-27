import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { wsUrl, loginUrl } from "@/lib/api";
import UserSidebar from "./UserSidebar";
import ChatInterface from "./ChatInterface";
import UserRegistration from "./UserRegistration";
import AdminPanel from "./AdminPanel";
import StoriesBar from "./StoriesBar";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import type { User } from "@shared/schema";

export default function MessageApp() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const { user } = useAuth();

  // true when the user hasn't set their name yet — forces the setup modal
  const isNewUser = !!user && !user.firstName;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if any admin exists (to show first-time claim banner)
  const { data: adminCheck } = useQuery<{ isAdmin: boolean; adminExists: boolean }>({
    queryKey: ['/api/admin/check'],
    enabled: !!user,
    retry: false,
  });

  const { mutate: claimAdmin, isPending: isClaimingAdmin } = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/claim'),
    onSuccess: () => {
      toast({ title: "Vous êtes maintenant administrateur" });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/check'] });
    },
    onError: () => {
      toast({ title: "Impossible de devenir administrateur", variant: "destructive" });
    },
  });

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    const websocket = new WebSocket(wsUrl());

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setUserOnlineStatus(true);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversation, 'messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      } else if (data.type === 'user_status_update' || data.type === 'online_users_sync') {
        queryClient.invalidateQueries({ queryKey: ['/api/users/online'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      } else if (data.type === 'new_story') {
        queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setUserOnlineStatus(false);
    };

    setWs(websocket);
    return () => { websocket.close(); };
  }, [user, queryClient, selectedConversation]);

  const { mutate: setUserOnlineStatus } = useMutation({
    mutationFn: async (isOnline: boolean) => {
      await apiRequest('POST', '/api/users/status', { isOnline });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = loginUrl(); }, 500);
      }
    },
  });

  const handleUserSelect = async (selectedUser: User) => {
    try {
      const response = await apiRequest('POST', '/api/conversations', {
        participantId: selectedUser.id
      });
      const conversation = await response.json();
      setSelectedConversation(conversation.id);
      setSelectedUser(selectedUser);
    } catch (error: any) {
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
          description: "Impossible de créer la conversation",
          variant: "destructive",
        });
      }
    }
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setSelectedConversation(null);
  };

  // Profile modal is only opened manually — no longer auto-triggered on login

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="loading-user">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Show claim-admin banner only if user is authenticated, not admin yet, and no admin exists
  const showClaimBanner = user && !user.isAdmin && adminCheck && !adminCheck.adminExists;

  return (
    <>
      {showClaimBanner && (
        <div className="fixed top-0 inset-x-0 z-50 bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between text-sm shadow-md">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Aucun administrateur n'est encore défini. Vous pouvez revendiquer ce rôle.
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="ml-4 shrink-0"
            onClick={() => claimAdmin()}
            disabled={isClaimingAdmin}
          >
            {isClaimingAdmin ? "..." : "Devenir admin"}
          </Button>
        </div>
      )}

      <div
        className={`flex h-screen bg-background overflow-hidden ${showClaimBanner ? 'pt-10' : ''}`}
        data-testid="container-message-app"
      >

        {/* Sidebar
            - Mobile : visible uniquement quand aucun utilisateur sélectionné
            - Tablette/Bureau : toujours visible en colonne fixe
        */}
        <div
          className={`
            flex-col h-full border-r border-border bg-card
            w-full md:w-72 lg:w-80 md:flex-shrink-0
            ${selectedUser ? 'hidden md:flex' : 'flex'}
          `}
          data-testid="sidebar-container"
        >
          <UserSidebar
            currentUser={user}
            onUserSelect={handleUserSelect}
            onShowRegistration={() => setShowRegistration(true)}
            onShowAdmin={() => setShowAdmin(true)}
          />
        </div>

        {/* Zone principale (stories + chat)
            - Mobile : visible uniquement quand un utilisateur est sélectionné
            - Tablette/Bureau : toujours visible, prend l'espace restant
        */}
        <div
          className={`
            flex-col h-full flex-1 min-w-0
            ${selectedUser ? 'flex' : 'hidden md:flex'}
          `}
          data-testid="main-chat-area"
        >
          {/* Stories bar — visible only when no conversation is open on mobile */}
          <div className={selectedUser ? 'hidden md:block' : 'block'}>
            <StoriesBar currentUser={user} />
          </div>

          <div className="flex-1 min-h-0">
            <ChatInterface
              currentUser={user}
              selectedConversation={selectedConversation}
              selectedUser={selectedUser}
              onBackToList={handleBackToList}
            />
          </div>
        </div>
      </div>

      {/* First-time setup — forced when user has no name yet */}
      {isNewUser && (
        <UserRegistration
          isOpen={true}
          forced={true}
          onClose={() => queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] })}
          currentUser={user}
        />
      )}

      {/* Normal profile edit — only when user already has a name */}
      {!isNewUser && (
        <UserRegistration
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
          currentUser={user}
        />
      )}

      <AdminPanel
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
      />
    </>
  );
}
