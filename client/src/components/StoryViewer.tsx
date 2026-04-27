import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Story, User } from "@shared/schema";

type StoryWithAuthor = Story & { author: User };

interface StoryViewerProps {
  story: StoryWithAuthor;
  totalInGroup: number;
  currentIndex: number;
  onNext: () => void;
  onClose: () => void;
}

const STORY_DURATION = 5000;

export default function StoryViewer({ story, totalInGroup, currentIndex, onNext, onClose }: StoryViewerProps) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number>(Date.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setProgress(0);
    startRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        onNext();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [story.id]);

  const timeAgo = (date: string | Date | null) => {
    if (!date) return "";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins}m`;
    return `il y a ${Math.floor(mins / 60)}h`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm h-full max-h-[680px] rounded-2xl overflow-hidden bg-black shadow-2xl"
        onClick={e => e.stopPropagation()}
      >

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {Array.from({ length: totalInGroup }).map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 left-3 right-3 flex items-center gap-2 z-10">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/60 flex-shrink-0">
            {story.author.profileImageUrl ? (
              <img src={story.author.profileImageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                {story.author.firstName?.[0]}{story.author.lastName?.[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">
              {story.author.firstName} {story.author.lastName}
            </p>
            <p className="text-white/60 text-xs leading-tight">{timeAgo(story.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="w-full h-full flex items-center justify-center">
          {story.type === 'image' && story.mediaUrl ? (
            <img
              src={story.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-8">
              <p className="text-white text-xl font-semibold text-center leading-relaxed break-words">
                {story.textContent}
              </p>
            </div>
          )}
        </div>

        {/* Tap zones */}
        <button
          className="absolute left-0 top-0 w-1/3 h-full z-20 opacity-0"
          onClick={onClose}
          aria-label="Précédent"
        />
        <button
          className="absolute right-0 top-0 w-1/3 h-full z-20 opacity-0"
          onClick={onNext}
          aria-label="Suivant"
        />
      </div>
    </div>
  );
}
