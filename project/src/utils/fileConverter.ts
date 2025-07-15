// File conversion utilities
export const convertImageToJPG = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const convertedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(convertedFile);
          } else {
            reject(new Error('Failed to convert image'));
          }
        }, 'image/jpeg', 0.9);
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const convertAudioToMP3 = async (file: File): Promise<File> => {
  // For now, we'll return the original file since browser-based audio conversion
  // requires complex libraries. You can integrate with services like FFmpeg.wasm if needed
  // or handle conversion server-side later
  
  // If the file is already MP3, return as is
  if (file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3')) {
    return file;
  }
  
  // For other formats, we'll rename to .mp3 for now
  // In production, you'd want to use FFmpeg.wasm or similar
  const convertedFile = new File([file], file.name.replace(/\.[^/.]+$/, '.mp3'), {
    type: 'audio/mpeg',
    lastModified: Date.now()
  });
  
  return convertedFile;
};

export const convertVideoToMP4 = async (file: File): Promise<File> => {
  // For now, we'll return the original file since browser-based video conversion
  // requires complex libraries. You can integrate with services like FFmpeg.wasm if needed
  // or handle conversion server-side later
  
  // If the file is already MP4, return as is
  if (file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4')) {
    return file;
  }
  
  // For other formats, we'll rename to .mp4 for now
  // In production, you'd want to use FFmpeg.wasm or similar
  const convertedFile = new File([file], file.name.replace(/\.[^/.]+$/, '.mp4'), {
    type: 'video/mp4',
    lastModified: Date.now()
  });
  
  return convertedFile;
};

export const generateCreditsJSON = (songName: string, credits: { name: string; role: string }[]) => {
  const creditsData = {
    song: songName,
    credits: credits.filter(credit => credit.name.trim() && credit.role.trim())
  };
  
  const jsonString = JSON.stringify(creditsData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  return new File([blob], `${songName} credits.json`, {
    type: 'application/json',
    lastModified: Date.now()
  });
};

export const generateVideoInfoJSON = (videoTitle: string, genre?: string) => {
  const videoData = {
    title: videoTitle,
    releaseDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    ...(genre && { genre })
  };
  
  const jsonString = JSON.stringify(videoData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  return new File([blob], `${videoTitle} info.json`, {
    type: 'application/json',
    lastModified: Date.now()
  });
};

export const generateSongInfoJSON = (songName: string, genre: string) => {
  const songData = {
    title: songName,
    genre,
    releaseDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  };
  
  const jsonString = JSON.stringify(songData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  return new File([blob], `${songName} info.json`, {
    type: 'application/json',
    lastModified: Date.now()
  });
};