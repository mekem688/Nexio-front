import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { loginUrl } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Database, UserPlus, Trash2, Edit, BarChart3, Fan } from "lucide-react";
import type { User } from "@shared/schema";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [sqlQuery, setSqlQuery] = useState(`-- Exemple de requête
SELECT u.first_name, u.last_name, u.email, u.is_online, COUNT(m.id) as message_count
FROM users u
LEFT JOIN messages m ON u.id = m.sender_id
WHERE u.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.first_name, u.last_name, u.email, u.is_online
ORDER BY message_count DESC;`);

  const { toast } = useToast();

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isOpen,
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<{total: number; today: number; activeUsers: number}>({
    queryKey: ['/api/admin/stats'],
    enabled: isOpen,
  });

  // Fetch recent messages
  const { data: recentMessages = [], isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/messages/recent'],
    enabled: isOpen,
  });

  // Cleanup messages mutation
  const { mutate: cleanupMessages, isPending: cleanupPending } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/cleanup');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Nettoyage terminé",
        description: `${data.deletedCount} messages expirés supprimés`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = loginUrl();
        }, 500);
      } else {
        toast({
          title: "Erreur",
          description: "Échec du nettoyage des messages",
          variant: "destructive",
        });
      }
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (user: User) => {
    return user.isOnline ? (
      <Badge className="bg-accent/10 text-accent" data-testid={`badge-user-online-${user.id}`}>
        En ligne
      </Badge>
    ) : (
      <Badge variant="secondary" data-testid={`badge-user-offline-${user.id}`}>
        Hors ligne
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden p-4 md:p-6" data-testid="modal-admin-panel">
        <DialogHeader>
          <DialogTitle data-testid="title-admin-panel">Administration</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="users" className="h-full">
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-admin">
            <TabsTrigger value="users" className="text-xs md:text-sm" data-testid="tab-users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="messages" className="text-xs md:text-sm" data-testid="tab-messages">Messages</TabsTrigger>
            <TabsTrigger value="database" className="text-xs md:text-sm" data-testid="tab-database">Base de données</TabsTrigger>
          </TabsList>

          <div className="mt-4 md:mt-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
            <TabsContent value="users" className="space-y-4" data-testid="content-users-tab">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground" data-testid="title-user-management">
                  Gestion des utilisateurs
                </h3>
                <Button data-testid="button-new-user">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nouvel utilisateur
                </Button>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-8" data-testid="loading-users-admin">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="bg-secondary rounded-lg overflow-hidden overflow-x-auto">
                  <Table className="min-w-[500px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead data-testid="header-user">Utilisateur</TableHead>
                        <TableHead className="hidden sm:table-cell" data-testid="header-email">Email</TableHead>
                        <TableHead data-testid="header-status">Statut</TableHead>
                        <TableHead className="hidden md:table-cell" data-testid="header-registration">Inscription</TableHead>
                        <TableHead data-testid="header-actions">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <img
                                src={user.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-8 h-8 rounded-full object-cover"
                                data-testid={`img-admin-user-avatar-${user.id}`}
                              />
                              <span className="font-medium text-foreground" data-testid={`text-admin-user-name-${user.id}`}>
                                {user.firstName} {user.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs md:text-sm hidden sm:table-cell" data-testid={`text-admin-user-email-${user.id}`}>
                            {user.email}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(user)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs hidden md:table-cell" data-testid={`text-admin-user-registration-${user.id}`}>
                            {user.createdAt ? formatDate(user.createdAt.toString()) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-edit-user-${user.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-delete-user-${user.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="messages" className="space-y-4" data-testid="content-messages-tab">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground" data-testid="title-message-management">
                  Gestion des messages
                </h3>
                <p className="text-sm text-muted-foreground">
                  Messages supprimés automatiquement après 1 semaine
                </p>
              </div>

              {statsLoading ? (
                <div className="flex justify-center py-4" data-testid="loading-stats">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-primary" data-testid="title-messages-today">
                        Messages aujourd'hui
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary" data-testid="stat-messages-today">
                        {stats?.today || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-accent" data-testid="title-active-users">
                        Utilisateurs actifs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-accent" data-testid="stat-active-users">
                        {stats?.activeUsers || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-foreground" data-testid="title-total-messages">
                        Messages stockés
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-total-messages">
                        {stats?.total || 0}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="bg-secondary rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-3" data-testid="title-recent-messages">
                  Messages récents
                </h4>
                {messagesLoading ? (
                  <div className="flex justify-center py-4" data-testid="loading-recent-messages">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : recentMessages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4" data-testid="empty-recent-messages">
                    Aucun message récent
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentMessages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-center justify-between p-3 bg-card rounded-lg"
                        data-testid={`message-row-${message.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={message.sender?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                            alt={`${message.sender?.firstName} ${message.sender?.lastName}`}
                            className="w-8 h-8 rounded-full object-cover"
                            data-testid={`img-recent-message-avatar-${message.id}`}
                          />
                          <div>
                            <p className="font-medium text-foreground" data-testid={`text-recent-message-sender-${message.id}`}>
                              {message.sender?.firstName} {message.sender?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs" data-testid={`text-recent-message-content-${message.id}`}>
                              {message.content}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground" data-testid={`text-recent-message-time-${message.id}`}>
                          {message.createdAt ? formatDate(message.createdAt.toString()) : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-4" data-testid="content-database-tab">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground" data-testid="title-database-management">
                  Gestion de la base de données PostgreSQL
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3" data-testid="title-database-tables">Tables</h4>
                  <div className="bg-secondary rounded-lg p-4">
                    <ul className="space-y-2">
                      <li className="flex justify-between items-center py-2 px-3 bg-card rounded" data-testid="table-users">
                        <span className="font-mono text-sm">users</span>
                        <span className="text-xs text-muted-foreground">{users.length} enregistrements</span>
                      </li>
                      <li className="flex justify-between items-center py-2 px-3 bg-card rounded" data-testid="table-messages">
                        <span className="font-mono text-sm">messages</span>
                        <span className="text-xs text-muted-foreground">{stats?.total || 0} enregistrements</span>
                      </li>
                      <li className="flex justify-between items-center py-2 px-3 bg-card rounded" data-testid="table-conversations">
                        <span className="font-mono text-sm">conversations</span>
                        <span className="text-xs text-muted-foreground">- enregistrements</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3" data-testid="title-maintenance-actions">
                    Actions de maintenance
                  </h4>
                  <div className="space-y-3">
                    <Button className="w-full" data-testid="button-backup-database">
                      <Database className="h-4 w-4 mr-2" />
                      Sauvegarder la base
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => cleanupMessages()}
                      disabled={cleanupPending}
                      data-testid="button-cleanup-messages"
                    >
                      <Fan className="h-4 w-4 mr-2" />
                      {cleanupPending ? "Nettoyage..." : "Nettoyer les messages expirés"}
                    </Button>
                    <Button variant="outline" className="w-full" data-testid="button-generate-report">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Générer rapport
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-foreground mb-3" data-testid="title-sql-console">Console SQL</h4>
                <div className="bg-gray-900 rounded-lg p-4">
                  <Textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="w-full bg-transparent text-green-400 font-mono text-sm resize-none border-0 outline-none min-h-[150px]"
                    placeholder="SELECT * FROM users WHERE status = 'online';"
                    data-testid="textarea-sql-query"
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-green-400" data-testid="text-sql-status">Ready</span>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-execute-sql"
                    >
                      Exécuter
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
