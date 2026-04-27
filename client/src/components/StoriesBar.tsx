import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Clock } from "lucide-react";
import type { Story, User } from "@shared/schema";
import StoryViewer from "./StoryViewer";
import StoryComposer from "./StoryComposer";

type StoryWithAuthor = Story & { author: User };

interface StoriesBarProps {
  currentUser: User;
}

export default function StoriesBar({ currentUser }: StoriesBarProps) {
  const [viewingStory, setViewingStory] = useState<StoryWithAuthor | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);

  const { data: stories = [] } = useQuery<StoryWithAuthor[]>({
    queryKey: ['/api/stories'],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Group stories by author: one bubble per author, showing their latest story
  const byAuthor = stories.reduce<Record<string, StoryWithAuthor[]>>((acc, s) => {
    if (!acc[s.authorId]) acc[s.authorId] = [];
    acc[s.authorId].push(s);
    return acc;
  }, {});

  const authorIds = Object.keys(byAuthor);

  const openStory = (authorId: string) => {
    const authorStories = byAuthor[authorId];
    if (!authorStories?.length) return;
    setViewingIndex(0);
    setViewingStory(authorStories[0]);
  };

  const handleNext = () => {
    if (!viewingStory) return;
    const authorStories = byAuthor[viewingStory.authorId];
    if (viewingIndex + 1 < authorStories.length) {
      setViewingIndex(viewingIndex + 1);
      setViewingStory(authorStories[viewingIndex + 1]);
    } else {
      setViewingStory(null);
    }
  };

  const timeLeft = (expiresAt: string | Date | null) => {
    if (!expiresAt) return "";
    const diff = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h`;
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}m`;
  };

  const myStoriesCount = byAuthor[currentUser.id]?.length ?? 0;

  return (
    <>
      <div className="flex items-center gap-3 px-3 py-3 overflow-x-auto no-scrollbar border-b border-border bg-card/60">

        {/* Current user — publish button */}
        <button
          onClick={() => setComposerOpen(true)}
          className="flex flex-col items-center gap-1 flex-shrink-0 group"
          aria-label="Publier une story"
        >
          <div className="relative">
            <div className={`w-14 h-14 rounded-full p-0.5 ${myStoriesCount > 0 ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-muted'}`}>
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-card">
                {currentUser.profileImageUrl ? (
                  <img
                    src={currentUser.profileImageUrl}
                    alt="Moi"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                  </div>
                )}
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-card shadow-sm">
              <Plus className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[56px] leading-tight">
            {myStoriesCount > 0 ? `Ma story` : "Story"}
          </span>
        </button>

        {/* Other users' stories */}
        {authorIds
          .filter(id => id !== currentUser.id)
          .map(authorId => {
            const authorStories = byAuthor[authorId];
            const latest = authorStories[0];
            const author = latest.author;
            return (
              <button
                key={authorId}
                onClick={() => openStory(authorId)}
                className="flex flex-col items-center gap-1 flex-shrink-0 group"
                aria-label={`Story de ${author.firstName}`}
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-blue-500 to-purple-600">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-card">
                      {author.profileImageUrl ? (
                        <img
                          src={author.profileImageUrl}
                          alt={`${author.firstName} ${author.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {author.firstName?.[0]}{author.lastName?.[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  {authorStories.length > 1 && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center border border-card font-medium">
                      {authorStories.length}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-foreground truncate max-w-[56px] leading-tight font-medium">
                    {author.firstName}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {timeLeft(latest.expiresAt)}
                  </span>
                </div>
              </button>
            );
          })}

        {authorIds.filter(id => id !== currentUser.id).length === 0 && (
          <p className="text-xs text-muted-foreground italic px-2">
            Aucune story active pour l'instant
          </p>
        )}
      </div>

      {/* Story viewer */}
      {viewingStory && (
        <StoryViewer
          story={viewingStory}
          totalInGroup={byAuthor[viewingStory.authorId]?.length ?? 1}
          currentIndex={viewingIndex}
          onNext={handleNext}
          onClose={() => setViewingStory(null)}
        />
      )}

      {/* Story composer */}
      <StoryComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
}
