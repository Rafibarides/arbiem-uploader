import { Dropbox } from 'dropbox';
import { convertImageToJPG, convertAudioToMP3, convertVideoToMP4, generateCreditsJSON, generateVideoInfoJSON, generateSongInfoJSON } from './fileConverter';

export class DropboxUploader {
  private dbx: Dropbox;
  private refreshToken?: string;
  private accessToken: string;
  private tokenExpiry?: Date;
  
  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.dbx = new Dropbox({ 
      accessToken,
      fetch: fetch,
      // Add additional configuration for better compatibility
      selectUser: undefined,
      selectAdmin: undefined,
      pathRoot: undefined
    });
  }

  // Refresh the access token using refresh token
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available. Please update your Dropbox configuration.');
    }

    try {
      console.log('Refreshing Dropbox access token...');
      
      // Your Dropbox app credentials
      const APP_KEY = 'j6vu4sp9a2n84c0';
      const APP_SECRET = '1jvv4ojc8nh49jg';
      
      const response = await fetch('https://api.dropbox.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${APP_KEY}:${APP_SECRET}`)}`
        },
        body: new URLSearchParams({
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      // Calculate expiry time (typically 4 hours)
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
      
      // Update the Dropbox client with new token
      this.dbx = new Dropbox({ 
        accessToken: this.accessToken,
        fetch: fetch,
        selectUser: undefined,
        selectAdmin: undefined,
        pathRoot: undefined
      });

      console.log('Access token refreshed successfully. Expires at:', this.tokenExpiry);
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw new Error('Failed to refresh Dropbox access token. Please check your refresh token and app credentials.');
    }
  }

  // Check if token needs refresh and refresh if necessary
  private async ensureValidToken(): Promise<void> {
    // If we have a refresh token and the access token is close to expiring (within 5 minutes)
    if (this.refreshToken && this.tokenExpiry) {
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      if (this.tokenExpiry <= fiveMinutesFromNow) {
        await this.refreshAccessToken();
      }
    }
  }

  // Test the connection and token validity
  async testConnection(): Promise<boolean> {
    try {
      // Ensure we have a valid token first
      await this.ensureValidToken();
      
      console.log('Testing Dropbox connection...');
      const response = await this.dbx.usersGetCurrentAccount();
      console.log('Dropbox connection successful:', response.result.name.display_name);
      console.log('Account email:', response.result.email);
      return true;
    } catch (error: any) {
      console.error('Dropbox connection failed:', error);
      
      // If we get a 401 and have a refresh token, try refreshing
      if (error?.status === 401 && this.refreshToken) {
        try {
          console.log('Got 401 error, attempting to refresh token...');
          await this.refreshAccessToken();
          // Try the connection test again with new token
          const response = await this.dbx.usersGetCurrentAccount();
          console.log('Dropbox connection successful after refresh:', response.result.name.display_name);
          return true;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      console.error('Error details:', {
        status: error?.status,
        error: error?.error,
        message: error?.message,
        stack: error?.stack
      });
      
      // Provide specific error messages based on the error type
      if (error?.status === 401) {
        throw new Error('Dropbox authentication failed. The access token has expired and could not be refreshed. Please update your token configuration.');
      } else if (error?.status === 403) {
        throw new Error('Dropbox access forbidden. The token may not have sufficient permissions.');
      } else if (error?.message?.includes('NetworkError') || error?.message?.includes('CORS')) {
        throw new Error('Network/CORS error. This may be due to browser security restrictions.');
      } else {
        throw new Error(`Dropbox authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private toCamelCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .split(' ')
      .map((word, index) => 
        index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join('');
  }

  private async uploadFile(file: File, path: string, onProgress?: (progress: number) => void): Promise<void> {
    // Ensure we have a valid token before starting upload
    await this.ensureValidToken();
    
    const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks
    const UPLOAD_TIMEOUT = 60000; // 60 seconds timeout per chunk
    
    try {
      if (file.size <= CHUNK_SIZE) {
        // Small file - upload directly with timeout
        const uploadPromise = this.dbx.filesUpload({
          path,
          contents: file,
          mode: 'overwrite',
          autorename: true
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Upload timeout')), UPLOAD_TIMEOUT);
        });
        
        await Promise.race([uploadPromise, timeoutPromise]);
        onProgress?.(100);
    } else {
      // Large file - use upload session with timeout and retry logic
      let sessionStart;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const startPromise = this.dbx.filesUploadSessionStart({
            contents: file.slice(0, CHUNK_SIZE)
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Session start timeout')), UPLOAD_TIMEOUT);
          });
          
          sessionStart = await Promise.race([startPromise, timeoutPromise]);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to start upload session after ${maxRetries} attempts: ${error}`);
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        }
      }
      
      let offset = CHUNK_SIZE;
      onProgress?.(Math.round((offset / file.size) * 100));
      
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        const isLast = offset + CHUNK_SIZE >= file.size;
        
        retryCount = 0;
        while (retryCount < maxRetries) {
          try {
            if (isLast) {
              const finishPromise = this.dbx.filesUploadSessionFinish({
                cursor: {
                  session_id: sessionStart.result.session_id,
                  offset
                },
                commit: {
                  path,
                  mode: 'overwrite',
                  autorename: true
                },
                contents: chunk
              });
              
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Session finish timeout')), UPLOAD_TIMEOUT);
              });
              
              await Promise.race([finishPromise, timeoutPromise]);
            } else {
              const appendPromise = this.dbx.filesUploadSessionAppendV2({
                cursor: {
                  session_id: sessionStart.result.session_id,
                  offset
                },
                contents: chunk
              });
              
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Session append timeout')), UPLOAD_TIMEOUT);
              });
              
              await Promise.race([appendPromise, timeoutPromise]);
            }
            break;
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw new Error(`Failed to upload chunk at offset ${offset} after ${maxRetries} attempts: ${error}`);
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          }
        }
        
        offset += CHUNK_SIZE;
        onProgress?.(Math.round((offset / file.size) * 100));
      }
    }
    } catch (error: any) {
      // Handle specific Dropbox errors
      if (error?.status === 401) {
        throw new Error('Dropbox authentication failed. The access token may be expired or invalid. Please contact support.');
      } else if (error?.status === 403) {
        throw new Error('Dropbox access forbidden. The token may not have sufficient permissions.');
      } else if (error?.status === 429) {
        throw new Error('Dropbox rate limit exceeded. Please try again later.');
      } else if (error?.status === 507) {
        throw new Error('Dropbox storage quota exceeded. Please free up space or upgrade your plan.');
      } else if (error?.message?.includes('Network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      // Re-throw the original error if it's not a known Dropbox error
      throw error;
    }
  }

  async uploadNewArtistProfile(
    artistData: {
      artistName: string;
      bio: string;
      supportLink: string;
      artwork: File | null;
    },
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const folderPath = `/Arbiem Sounds Uploads/${artistData.artistName}`;
    
    // Create artist info JSON
    const artistInfo = {
      artistName: artistData.artistName,
      bio: artistData.bio,
      supportLink: artistData.supportLink,
      createdAt: new Date().toISOString()
    };
    
    const artistInfoFile = new File(
      [JSON.stringify(artistInfo, null, 2)], 
      'artist-info.json', 
      { type: 'application/json' }
    );
    
    let uploadedFiles = 0;
    const totalFiles = artistData.artwork ? 2 : 1;
    
    // Upload artist info
    await this.uploadFile(artistInfoFile, `${folderPath}/artist-info.json`);
    uploadedFiles++;
    onProgress?.(Math.round((uploadedFiles / totalFiles) * 100));
    
    // Upload and convert artwork if provided
    if (artistData.artwork) {
      const convertedArtwork = await convertImageToJPG(artistData.artwork);
      const artistFileName = this.toCamelCase(artistData.artistName);
      await this.uploadFile(convertedArtwork, `${folderPath}/${artistFileName}.jpg`);
      uploadedFiles++;
      onProgress?.(Math.round((uploadedFiles / totalFiles) * 100));
    }
  }

  async uploadNewArtist(
    artistData: {
      artistName: string;
      bio: string;
      profilePicture: File | null;
      uploadType: string;
      singleData: {
        songTitle: string;
        audioFile: File | null;
        artwork: File | null;
        genre: string;
        lyricsFile: File | null;
        credits: {
          songwriter: string;
          producer: string;
          engineer: string;
          additional: string;
        };
      };
      albumData: {
        albumTitle: string;
        albumArtwork: File | null;
        tracks: Array<{
          title: string;
          audioFile: File | null;
          genre: string;
          lyricsFile: File | null;
          credits: {
            songwriter: string;
            producer: string;
            engineer: string;
            additional: string;
          };
        }>;
      };
      videoData: {
        videoTitle: string;
        videoFile: File | null;
        thumbnail: File | null;
      };
    },
    onStatusUpdate?: (status: string, progress: number) => void
  ): Promise<void> {
    // Test connection first
    onStatusUpdate?.('Verifying Dropbox connection...', 0);
    await this.testConnection();
    const folderPath = `/Arbiem Sounds Uploads/${artistData.artistName}`;
    
    // Create artist info JSON
    const artistInfo = {
      artistName: artistData.artistName,
      bio: artistData.bio,
      createdAt: new Date().toISOString()
    };
    
    const artistInfoFile = new File(
      [JSON.stringify(artistInfo, null, 2)], 
      'artist-info.json', 
      { type: 'application/json' }
    );

    // Calculate total number of files to upload
    let totalFiles = 1; // Artist info
    if (artistData.profilePicture) totalFiles++;
    
    if (artistData.uploadType === 'single') {
      if (artistData.singleData.audioFile) totalFiles++;
      if (artistData.singleData.artwork) totalFiles++;
      if (artistData.singleData.lyricsFile) totalFiles++;
      totalFiles++; // Song info JSON
      if (Object.values(artistData.singleData.credits).some(credit => credit.trim())) totalFiles++; // Credits JSON
    } else if (artistData.uploadType === 'album') {
      if (artistData.albumData.albumArtwork) totalFiles++;
      artistData.albumData.tracks.forEach(track => {
        if (track.title.trim()) totalFiles++; // Track info JSON
        if (track.audioFile) totalFiles++;
        if (track.lyricsFile) totalFiles++;
        if (Object.values(track.credits).some(credit => credit.trim())) totalFiles++; // Track credits JSON
      });
    } else if (artistData.uploadType === 'video') {
      totalFiles++; // Video info JSON
      if (artistData.videoData.videoFile) totalFiles++;
      if (artistData.videoData.thumbnail) totalFiles++;
    }

    let uploadedFiles = 0;

    // Helper function to update progress
    const updateProgress = (status: string) => {
      uploadedFiles++;
      const progress = Math.round((uploadedFiles / totalFiles) * 100);
      onStatusUpdate?.(status, progress);
    };

    // Upload artist info
    await this.uploadFile(artistInfoFile, `${folderPath}/artist-info.json`);
    updateProgress('Uploaded artist info');

    // Upload profile picture
    if (artistData.profilePicture) {
      const convertedProfilePicture = await convertImageToJPG(artistData.profilePicture);
      const artistFileName = this.toCamelCase(artistData.artistName);
      await this.uploadFile(convertedProfilePicture, `${folderPath}/${artistFileName}-profile.jpg`);
      updateProgress('Uploaded profile picture');
    }

    // Upload content based on type
    if (artistData.uploadType === 'single') {
      await this.uploadSingleContent(artistData.artistName, artistData.singleData, updateProgress);
    } else if (artistData.uploadType === 'album') {
      await this.uploadAlbumContent(artistData.artistName, artistData.albumData, updateProgress);
    } else if (artistData.uploadType === 'video') {
      await this.uploadVideoContent(artistData.artistName, artistData.videoData, updateProgress);
    }
  }

  private async uploadSingleContent(
    artistName: string,
    singleData: any,
    updateProgress: (status: string) => void
  ): Promise<void> {
    const folderPath = `/Arbiem Sounds Uploads/${artistName}/${singleData.songTitle}`;
    
    // Generate song info JSON
    const songInfoFile = generateSongInfoJSON(singleData.songTitle, singleData.genre);
    await this.uploadFile(songInfoFile, `${folderPath}/${singleData.songTitle} info.json`);
    updateProgress('Uploaded song info');

    // Generate credits JSON if there are credits
    const credits = Object.entries(singleData.credits)
      .filter(([_, value]) => (value as string).trim())
      .map(([role, name]) => ({ name: name as string, role }));
    
    if (credits.length > 0) {
      const creditsFile = generateCreditsJSON(singleData.songTitle, credits);
      await this.uploadFile(creditsFile, `${folderPath}/${singleData.songTitle} credits.json`);
      updateProgress('Uploaded credits');
    }

    // Upload artwork
    if (singleData.artwork) {
      const convertedArtwork = await convertImageToJPG(singleData.artwork);
      await this.uploadFile(convertedArtwork, `${folderPath}/artwork.jpg`);
      updateProgress('Uploaded artwork');
    }

    // Upload lyrics file
    if (singleData.lyricsFile) {
      await this.uploadFile(singleData.lyricsFile, `${folderPath}/lyrics.json`);
      updateProgress('Uploaded lyrics');
    }

    // Upload audio file
    if (singleData.audioFile) {
      const convertedAudio = await convertAudioToMP3(singleData.audioFile);
      const songFileName = this.toCamelCase(singleData.songTitle);
      await this.uploadFile(convertedAudio, `${folderPath}/${songFileName}.mp3`);
      updateProgress('Uploaded audio file');
    }
  }

  private async uploadAlbumContent(
    artistName: string,
    albumData: any,
    updateProgress: (status: string) => void
  ): Promise<void> {
    const folderPath = `/Arbiem Sounds Uploads/${artistName}/${albumData.albumTitle}`;
    
    // Upload album artwork
    if (albumData.albumArtwork) {
      const convertedArtwork = await convertImageToJPG(albumData.albumArtwork);
      await this.uploadFile(convertedArtwork, `${folderPath}/album-artwork.jpg`);
      updateProgress('Uploaded album artwork');
    }

    // Process each track
    for (const track of albumData.tracks) {
      if (track.title.trim()) {
        // Generate track info JSON
        const trackInfoFile = generateSongInfoJSON(track.title, track.genre);
        await this.uploadFile(trackInfoFile, `${folderPath}/${track.title} info.json`);
        updateProgress(`Uploaded ${track.title} info`);

        // Generate credits JSON for track
        const credits = Object.entries(track.credits)
          .filter(([_, value]) => (value as string).trim())
          .map(([role, name]) => ({ name: name as string, role }));
        
        if (credits.length > 0) {
          const creditsFile = generateCreditsJSON(track.title, credits);
          await this.uploadFile(creditsFile, `${folderPath}/${track.title} credits.json`);
          updateProgress(`Uploaded ${track.title} credits`);
        }

        // Upload lyrics file
        if (track.lyricsFile) {
          await this.uploadFile(track.lyricsFile, `${folderPath}/${track.title} lyrics.json`);
          updateProgress(`Uploaded ${track.title} lyrics`);
        }

        // Upload audio file
        if (track.audioFile) {
          const convertedAudio = await convertAudioToMP3(track.audioFile);
          const trackFileName = this.toCamelCase(track.title);
          await this.uploadFile(convertedAudio, `${folderPath}/${trackFileName}.mp3`);
          updateProgress(`Uploaded ${track.title} audio`);
        }
      }
    }
  }

  private async uploadVideoContent(
    artistName: string,
    videoData: any,
    updateProgress: (status: string) => void
  ): Promise<void> {
    const folderPath = `/Arbiem Sounds Uploads/${artistName}/Videos/${videoData.videoTitle}`;
    
    // Generate video info JSON
    const videoInfoFile = generateVideoInfoJSON(videoData.videoTitle);
    await this.uploadFile(videoInfoFile, `${folderPath}/${videoData.videoTitle} info.json`);
    updateProgress('Uploaded video info');

    // Upload thumbnail
    if (videoData.thumbnail) {
      const convertedThumbnail = await convertImageToJPG(videoData.thumbnail);
      const thumbnailFileName = this.toCamelCase(videoData.videoTitle);
      await this.uploadFile(convertedThumbnail, `${folderPath}/${thumbnailFileName}.jpg`);
      updateProgress('Uploaded thumbnail');
    }

    // Upload video file with detailed progress tracking
    if (videoData.videoFile) {
      const convertedVideo = await convertVideoToMP4(videoData.videoFile);
      const videoFileName = this.toCamelCase(videoData.videoTitle);
      
      // Add intermediate progress updates for large video files
      let lastProgressUpdate = 0;
      await this.uploadFile(convertedVideo, `${folderPath}/${videoFileName}.mp4`, (progress) => {
        // Only update status every 10% to avoid too many updates
        if (progress - lastProgressUpdate >= 10) {
          updateProgress(`Uploading video: ${progress}%`);
          lastProgressUpdate = progress;
        }
      });
      updateProgress('Uploaded video file');
    }
  }

  async uploadSingle(
    artistName: string,
    singleData: {
      songName: string;
      genre: string;
      artwork: File | null;
      credits: any;
      lyricsFile: File | null;
      audioFile: File | null;
    },
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // Test connection first
    await this.testConnection();
    const folderPath = `/Arbiem Sounds Uploads/${artistName}/${singleData.songName}`;
    
    const files: { file: File; path: string; weight: number }[] = [];
    
    // Generate song info JSON with genre and release date
    const songInfoFile = generateSongInfoJSON(singleData.songName, singleData.genre);
    files.push({ file: songInfoFile, path: `${folderPath}/${singleData.songName} info.json`, weight: 1 });
    
    // Generate credits JSON if there are credits
    const credits = Object.entries(singleData.credits)
      .filter(([_, value]) => (value as string).trim())
      .map(([role, name]) => ({ name: name as string, role }));
    
    if (credits.length > 0) {
      const creditsFile = generateCreditsJSON(singleData.songName, credits);
      files.push({ file: creditsFile, path: `${folderPath}/${singleData.songName} credits.json`, weight: 1 });
    }
    
    // Convert and add artwork
    if (singleData.artwork) {
      const convertedArtwork = await convertImageToJPG(singleData.artwork);
      files.push({ file: convertedArtwork, path: `${folderPath}/artwork.jpg`, weight: 1 });
    }
    
    // Add lyrics file
    if (singleData.lyricsFile) {
      files.push({ file: singleData.lyricsFile, path: `${folderPath}/lyrics.json`, weight: 1 });
    }
    
    // Convert and add audio file
    if (singleData.audioFile) {
      const convertedAudio = await convertAudioToMP3(singleData.audioFile);
      const songFileName = this.toCamelCase(singleData.songName);
      // Audio files get higher weight based on file size
      const audioWeight = Math.max(5, Math.ceil(convertedAudio.size / (1024 * 1024))); // Weight based on file size in MB
      files.push({ file: convertedAudio, path: `${folderPath}/${songFileName}.mp3`, weight: audioWeight });
    }
    
    // Calculate total weight for proper progress tracking
    const totalWeight = files.reduce((sum, f) => sum + f.weight, 0);
    let completedWeight = 0;
    
    // Upload all files with proper progress tracking
    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      const fileStartWeight = completedWeight;
      
      await this.uploadFile(fileItem.file, fileItem.path, (fileProgress) => {
        // Calculate the progress contribution of this file
        const fileContribution = (fileProgress / 100) * fileItem.weight;
        const currentTotalProgress = ((fileStartWeight + fileContribution) / totalWeight) * 100;
        onProgress?.(Math.min(Math.round(currentTotalProgress), 100));
      });
      
      completedWeight += fileItem.weight;
      onProgress?.(Math.round((completedWeight / totalWeight) * 100));
    }
  }

  async uploadAlbum(
    artistName: string,
    albumData: {
      albumName: string;
      artwork: File | null;
      tracks: Array<{
        title: string;
        audioFile: File | null;
        genre: string;
        lyricsFile: File | null;
        credits: any;
      }>;
    },
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // Test connection first
    await this.testConnection();
    const folderPath = `/Arbiem Sounds Uploads/${artistName}/${albumData.albumName}`;
    
    const files: { file: File; path: string; weight: number }[] = [];
    
    // Convert and add album artwork
    if (albumData.artwork) {
      const convertedArtwork = await convertImageToJPG(albumData.artwork);
      files.push({ file: convertedArtwork, path: `${folderPath}/album-artwork.jpg`, weight: 1 });
    }
    
    // Process each track
    for (const track of albumData.tracks) {
      if (track.title.trim()) {
        // Generate song info JSON for track
        const trackInfoFile = generateSongInfoJSON(track.title, track.genre);
        files.push({ file: trackInfoFile, path: `${folderPath}/${track.title} info.json`, weight: 1 });
        
        // Generate credits JSON for track
        const credits = Object.entries(track.credits)
          .filter(([_, value]) => (value as string).trim())
          .map(([role, name]) => ({ name: name as string, role }));
        
        if (credits.length > 0) {
          const creditsFile = generateCreditsJSON(track.title, credits);
          files.push({ file: creditsFile, path: `${folderPath}/${track.title} credits.json`, weight: 1 });
        }
        
        // Add lyrics file for track
        if (track.lyricsFile) {
          files.push({ file: track.lyricsFile, path: `${folderPath}/${track.title} lyrics.json`, weight: 1 });
        }
        
        // Convert and add audio file
        if (track.audioFile) {
          const convertedAudio = await convertAudioToMP3(track.audioFile);
          const trackFileName = this.toCamelCase(track.title);
          // Audio files get higher weight based on file size
          const audioWeight = Math.max(5, Math.ceil(convertedAudio.size / (1024 * 1024))); // Weight based on file size in MB
          files.push({ file: convertedAudio, path: `${folderPath}/${trackFileName}.mp3`, weight: audioWeight });
        }
      }
    }
    
    // Calculate total weight for proper progress tracking
    const totalWeight = files.reduce((sum, f) => sum + f.weight, 0);
    let completedWeight = 0;
    
    // Upload all files with proper progress tracking
    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      const fileStartWeight = completedWeight;
      
      await this.uploadFile(fileItem.file, fileItem.path, (fileProgress) => {
        // Calculate the progress contribution of this file
        const fileContribution = (fileProgress / 100) * fileItem.weight;
        const currentTotalProgress = ((fileStartWeight + fileContribution) / totalWeight) * 100;
        onProgress?.(Math.min(Math.round(currentTotalProgress), 100));
      });
      
      completedWeight += fileItem.weight;
      onProgress?.(Math.round((completedWeight / totalWeight) * 100));
    }
  }

  async uploadVideo(
    artistName: string,
    videoData: {
      videoTitle: string;
      videoFile: File | null;
      thumbnail: File | null;
    },
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // Test connection first
    await this.testConnection();
    const folderPath = `/Arbiem Sounds Uploads/${artistName}/Videos/${videoData.videoTitle}`;
    
    const files: { file: File; path: string; weight: number }[] = [];
    
    // Generate video info JSON with release date
    const videoInfoFile = generateVideoInfoJSON(videoData.videoTitle);
    files.push({ file: videoInfoFile, path: `${folderPath}/${videoData.videoTitle} info.json`, weight: 1 });
    
    // Convert and add thumbnail
    if (videoData.thumbnail) {
      const convertedThumbnail = await convertImageToJPG(videoData.thumbnail);
      const thumbnailFileName = this.toCamelCase(videoData.videoTitle);
      files.push({ file: convertedThumbnail, path: `${folderPath}/${thumbnailFileName}.jpg`, weight: 1 });
    }
    
    // Convert and add video file
    if (videoData.videoFile) {
      const convertedVideo = await convertVideoToMP4(videoData.videoFile);
      const videoFileName = this.toCamelCase(videoData.videoTitle);
      // Video files get much higher weight since they're typically much larger
      const videoWeight = Math.max(10, Math.ceil(convertedVideo.size / (1024 * 1024))); // Weight based on file size in MB
      files.push({ file: convertedVideo, path: `${folderPath}/${videoFileName}.mp4`, weight: videoWeight });
    }
    
    // Calculate total weight for proper progress tracking
    const totalWeight = files.reduce((sum, f) => sum + f.weight, 0);
    let completedWeight = 0;
    
    // Upload all files with proper progress tracking
    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      const fileStartWeight = completedWeight;
      
      await this.uploadFile(fileItem.file, fileItem.path, (fileProgress) => {
        // Calculate the progress contribution of this file
        const fileContribution = (fileProgress / 100) * fileItem.weight;
        const currentTotalProgress = ((fileStartWeight + fileContribution) / totalWeight) * 100;
        onProgress?.(Math.min(Math.round(currentTotalProgress), 100));
      });
      
      completedWeight += fileItem.weight;
      onProgress?.(Math.round((completedWeight / totalWeight) * 100));
    }
  }
}