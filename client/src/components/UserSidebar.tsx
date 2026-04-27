import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Settings, Search, Camera } from "lucide-react";
import NexioLogo from "@/components/NexioLogo";
import type { User } from "@shared/schema";

interface UserSidebarProps {
  currentUser: User;
  onUserSelect: (user: User) => void;
  onShowRegistration: () => void;
  onShowAdmin: () => void;
}

export default function UserSidebar({
  currentUser,
  onUserSelect,
  onShowRegistration,
  onShowAdmin,
}: UserSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch all users with live status
  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Filter users based on search term, excluding self
  const filteredUsers = allUsers.filter((user) =>
    user.id !== currentUser.id &&
    (user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.profession?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const onlineCount = filteredUsers.filter(u => u.isOnline).length;

  const formatUserInfo = (user: User) => {
    const parts = [];
    if (user.profession) parts.push(user.profession);
    if (user.age) parts.push(`${user.age} ans`);
    if (user.maritalStatus) {
      const statusMap = {
        single: "Célibataire",
        dating: "En couple",
        married: "Marié(e)",
        divorced: "Divorcé(e)",
        widowed: "Veuf/Veuve"
      };
      parts.push(statusMap[user.maritalStatus as keyof typeof statusMap] || user.maritalStatus);
    }
    return parts.join(" • ");
  };

  return (
    <div className="w-full bg-card border-r border-border flex-shrink-0 h-full flex flex-col" data-testid="sidebar-users">
      {/* Header - Optimized for mobile */}
      <div className="p-3 md:p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-1.5" data-testid="title-app">
              <NexioLogo size={24} />
              <span className="text-lg md:text-xl font-bold tracking-tight text-foreground">Nexio</span>
            </div>
          <div className="flex space-x-1 md:space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowRegistration}
              className="touch-target"
              data-testid="button-show-registration"
              aria-label="Inscription d'un nouvel utilisateur"
            >
              <UserPlus className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            {currentUser.isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="touch-target"
                onClick={onShowAdmin}
                data-testid="button-show-admin"
                aria-label="Panneau d'administration"
              >
                <Settings className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Current User Profile - Mobile optimized */}
        <div className="p-2 md:p-3 bg-secondary rounded-lg" data-testid="card-current-user">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div
              className="relative group cursor-pointer flex-shrink-0"
              onClick={onShowRegistration}
              title="Modifier le profil"
              data-testid="button-edit-avatar"
            >
              <img
                src={currentUser.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                alt="Profile"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover"
                data-testid="img-current-user-avatar"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-xs md:text-sm truncate" data-testid="text-current-user-name">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-current-user-status">En ligne</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - Mobile optimized */}
      <div className="p-3 md:p-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 md:pl-10 text-base md:text-sm min-h-[40px] md:min-h-[36px]"
            data-testid="input-search-users"
          />
          <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* User List - Mobile optimized */}
      <div className="flex-1 overflow-y-auto smooth-scroll no-bounce">
        <div className="px-3 md:px-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3" data-testid="text-online-users-count">
            Utilisateurs ({filteredUsers.length}) · <span className="text-accent">{onlineCount} en ligne</span>
          </h3>
        </div>

        {isLoading ? (
          <div className="px-3 md:px-4 py-6 md:py-8 text-center" data-testid="loading-users">
            <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-xs md:text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-3 md:px-4 py-6 md:py-8 text-center" data-testid="empty-users">
            <p className="text-xs md:text-sm text-muted-foreground">
              {searchTerm ? "Aucun utilisateur trouvé" : "Aucun autre utilisateur pour l'instant"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredUsers.map((user: User) => (
              <div
                key={user.id}
                className="mx-2 md:mx-3 px-3 py-2.5 md:py-3 hover:bg-secondary cursor-pointer transition-colors rounded-lg border border-transparent hover:border-primary/20 active:scale-[0.98] active:bg-secondary/80 touch-target"
                onClick={() => onUserSelect(user)}
                data-testid={`user-item-${user.id}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onUserSelect(user);
                  }
                }}
                aria-label={`Démarrer une conversation avec ${user.firstName} ${user.lastName}`}
              >
                <div className="flex items-center space-x-2.5 md:space-x-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                      data-testid={`img-user-avatar-${user.id}`}
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${user.isOnline ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" data-testid={`text-user-name-${user.id}`}>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate" data-testid={`text-user-info-${user.id}`}>
                      {formatUserInfo(user)}
                    </p>
                    <div className="flex items-center mt-1">
                      {user.isOnline ? (
                        <Badge variant="secondary" className="text-xs bg-accent/10 text-accent px-2 py-0.5" data-testid={`badge-user-status-${user.id}`}>
                          <span className="w-1.5 h-1.5 bg-accent rounded-full mr-1 animate-pulse"></span>
                          En ligne
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground px-2 py-0.5" data-testid={`badge-user-status-${user.id}`}>
                          <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mr-1"></span>
                          Hors ligne
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
