import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SplashPhoto {
  id: string;
  file_path: string;
  description: string | null;
}

const FALLBACK_IMAGE = '/lovable-uploads/4b8a1bc2-18f7-41c2-8f2c-7dd1d22ec65a.png';
const ROTATE_INTERVAL = 5000;

export const SplashPhotoCarousel: React.FC = () => {
  const [photos, setPhotos] = useState<SplashPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data } = await supabase
        .from('splash_photos')
        .select('id, file_path, description')
        .order('display_order', { ascending: true });

      if (data && data.length > 0) {
        setPhotos(data);
      }
      setLoaded(true);
    };
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [photos.length]);

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('splash-photos').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Show fallback if no photos uploaded
  if (loaded && photos.length === 0) {
    return (
      <img
        src={FALLBACK_IMAGE}
        alt="Tucson infinity pool with desert background – Finest Pools & Spas"
        className="rounded-lg shadow-lg w-full h-auto object-cover"
      />
    );
  }

  if (!loaded) {
    return (
      <div className="rounded-lg shadow-lg w-full aspect-[4/3] bg-muted animate-pulse" />
    );
  }

  return (
    <div className="relative rounded-lg shadow-lg overflow-hidden aspect-[4/3]">
      {photos.map((photo, index) => (
        <img
          key={photo.id}
          src={getPublicUrl(photo.file_path)}
          alt={photo.description || 'Finest Pools & Spas work photo'}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000',
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          )}
        />
      ))}
      {/* Dots indicator */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                i === currentIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              )}
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
