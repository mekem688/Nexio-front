import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginUrl } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { updateUserProfileSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Trash2 } from "lucide-react";
import type { User } from "@shared/schema";

interface UserRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  forced?: boolean;
}

// Full profile schema — all fields optional except firstName/lastName when forced
const profileSchema = updateUserProfileSchema.extend({
  profileImageUrl: z.string().optional(),
}).partial().extend({
  age: z.number().min(18).max(100).optional(),
  maritalStatus: z.enum(["single", "dating", "married", "divorced", "widowed"]).optional(),
});

// First-time setup: only name is required
const firstTimeSchema = z.object({
  firstName: z.string().min(1, "Le prénom est obligatoire").max(50),
  lastName: z.string().min(1, "Le nom est obligatoire").max(50),
  profileImageUrl: z.string().optional(),
});

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face";

function resizeImage(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UserRegistration({ isOpen, onClose, currentUser, forced = false }: UserRegistrationProps) {
  const [avatarPreview, setAvatarPreview] = useState<string>(
    currentUser.profileImageUrl || DEFAULT_AVATAR
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(forced ? firstTimeSchema : profileSchema),
    defaultValues: {
      firstName: currentUser.firstName || "",
      lastName: currentUser.lastName || "",
      age: currentUser.age || 18,
      maritalStatus: (currentUser.maritalStatus as any) || "single",
      profession: currentUser.profession || "",
      hobbies: currentUser.hobbies || "",
    },
  });

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", "/api/users/profile", {
        ...data,
        profileImageUrl: avatarPreview !== DEFAULT_AVATAR ? avatarPreview : currentUser.profileImageUrl,
        // provide defaults so the server schema doesn't reject missing fields
        age: data.age || currentUser.age || 18,
        maritalStatus: data.maritalStatus || currentUser.maritalStatus || "single",
      });
    },
    onSuccess: () => {
      toast({ title: forced ? "Bienvenue sur Nexio !" : "Profil mis à jour avec succès !" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onClose();
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
          description: "Impossible de mettre à jour le profil",
          variant: "destructive",
        });
      }
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Veuillez sélectionner une image", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Image trop lourde (max 10 Mo)", variant: "destructive" });
      return;
    }

    try {
      const base64 = await resizeImage(file);
      setAvatarPreview(base64);
    } catch {
      toast({ title: "Impossible de lire l'image", variant: "destructive" });
    }

    e.target.value = "";
  };

  const onSubmit = (data: any) => {
    updateProfile(data);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => { if (!open && !forced) onClose(); }}
    >
      <DialogContent
        className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto"
        data-testid="modal-user-registration"
        onInteractOutside={forced ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={forced ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle data-testid="title-registration">
            {forced ? "Bienvenue sur Nexio !" : currentUser.firstName ? "Modifier le profil" : "Compléter votre profil"}
          </DialogTitle>
          {forced && (
            <p className="text-sm text-muted-foreground mt-1">
              Choisissez votre prénom et nom pour apparaître dans la liste des utilisateurs.
            </p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Photo de profil */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <img
                  src={avatarPreview}
                  alt="Photo de profil"
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  data-testid="avatar-preview"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Changer la photo de profil"
                >
                  <Camera className="h-7 w-7 text-white" />
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5"
                  data-testid="button-upload-photo"
                >
                  <Camera className="h-4 w-4" />
                  Choisir une photo
                </Button>
                {avatarPreview !== DEFAULT_AVATAR && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAvatarPreview(DEFAULT_AVATAR)}
                    className="flex items-center gap-1.5 text-destructive hover:text-destructive"
                    data-testid="button-remove-photo"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                data-testid="input-file-photo"
              />
            </div>

            {/* Prénom + Nom — toujours affichés, obligatoires en mode forcé */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-first-name">
                      Prénom <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Votre prénom" {...field} data-testid="input-first-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-last-name">
                      Nom <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom" {...field} data-testid="input-last-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Champs supplémentaires — masqués en mode premier démarrage */}
            {!forced && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-age">Âge</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={18}
                            max={100}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-age"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-marital-status">État civil</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} data-testid="select-marital-status">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single">Célibataire</SelectItem>
                            <SelectItem value="dating">En couple</SelectItem>
                            <SelectItem value="married">Marié(e)</SelectItem>
                            <SelectItem value="divorced">Divorcé(e)</SelectItem>
                            <SelectItem value="widowed">Veuf/Veuve</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="profession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-profession">Profession</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Développeur, Professeur, Designer..."
                          {...field}
                          data-testid="input-profession"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hobbies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-hobbies">Loisirs</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez vos centres d'intérêt..."
                          className="h-20"
                          {...field}
                          data-testid="textarea-hobbies"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex justify-end space-x-3">
              {!forced && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isPending}
                  data-testid="button-cancel-registration"
                >
                  Annuler
                </Button>
              )}
              <Button
                type="submit"
                disabled={isPending}
                className={forced ? "w-full" : ""}
                data-testid="button-save-profile"
              >
                {isPending
                  ? "Enregistrement..."
                  : forced
                  ? "Commencer"
                  : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
