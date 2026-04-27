import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Image, Type, Send } from "lucide-react";
import type { User } from "@shared/schema";

const textStorySchema = z.object({
  type: z.literal('text'),
  textContent: z.string().min(1, 'Le texte ne peut pas être vide').max(500, 'Maximum 500 caractères'),
});

const imageStorySchema = z.object({
  type: z.literal('image'),
  mediaUrl: z.string().url('URL invalide').min(1),
  textContent: z.string().max(200).optional(),
});

interface StoryComposerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export default function StoryComposer({ isOpen, onClose, currentUser }: StoryComposerProps) {
  const [storyType, setStoryType] = useState<'text' | 'image'>('text');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const textForm = useForm({
    resolver: zodResolver(textStorySchema),
    defaultValues: { type: 'text' as const, textContent: '' },
  });

  const imageForm = useForm({
    resolver: zodResolver(imageStorySchema),
    defaultValues: { type: 'image' as const, mediaUrl: '', textContent: '' },
  });

  const { mutate: createStory, isPending } = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/stories', data);
    },
    onSuccess: () => {
      toast({ title: "Story publiée", description: "Elle sera visible pendant 24 heures." });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      textForm.reset();
      imageForm.reset();
      onClose();
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de publier la story", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (storyType === 'text') {
      textForm.handleSubmit(data => createStory(data))();
    } else {
      imageForm.handleSubmit(data => createStory(data))();
    }
  };

  const textValue = textForm.watch('textContent') || '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publier une story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          {/* Type selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={storyType === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoryType('text')}
              className="flex-1 gap-2"
            >
              <Type className="h-4 w-4" />
              Texte
            </Button>
            <Button
              type="button"
              variant={storyType === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoryType('image')}
              className="flex-1 gap-2"
            >
              <Image className="h-4 w-4" />
              Image (URL)
            </Button>
          </div>

          {storyType === 'text' ? (
            <div className="space-y-2">
              {/* Preview */}
              <div className="w-full h-48 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-6">
                <p className="text-white text-lg font-semibold text-center break-words leading-relaxed">
                  {textValue || <span className="opacity-50 text-base font-normal">Votre texte ici…</span>}
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="story-text">Votre message</Label>
                <Textarea
                  id="story-text"
                  placeholder="Quoi de neuf ?"
                  rows={3}
                  maxLength={500}
                  {...textForm.register('textContent')}
                  className="resize-none"
                />
                <div className="flex justify-between items-center">
                  {textForm.formState.errors.textContent && (
                    <p className="text-xs text-destructive">{textForm.formState.errors.textContent.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">{textValue.length}/500</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="story-url">URL de l'image</Label>
                <input
                  id="story-url"
                  type="url"
                  placeholder="https://..."
                  {...imageForm.register('mediaUrl')}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {imageForm.formState.errors.mediaUrl && (
                  <p className="text-xs text-destructive">{imageForm.formState.errors.mediaUrl.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="story-caption">Légende (optionnel)</Label>
                <Textarea
                  id="story-caption"
                  placeholder="Ajoutez une légende…"
                  rows={2}
                  maxLength={200}
                  {...imageForm.register('textContent')}
                  className="resize-none"
                />
              </div>
              {imageForm.watch('mediaUrl') && (
                <div className="w-full h-40 rounded-xl overflow-hidden border border-border">
                  <img
                    src={imageForm.watch('mediaUrl')}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isPending} className="gap-2">
              <Send className="h-4 w-4" />
              {isPending ? "Publication…" : "Publier"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
