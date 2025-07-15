import React, { useState } from 'react';
import { Music, Upload, User, FileText, Image, Headphones, ExternalLink, ChevronRight, ChevronLeft, Check, Plus, X } from 'lucide-react';
import { DropboxUploader } from './utils/dropboxUploader';

const MUSIC_GENRES = [
  'Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 'Electronic', 'Jazz', 'Classical',
  'Folk', 'Blues', 'Reggae', 'Punk', 'Metal', 'Alternative', 'Indie', 'Soul',
  'Funk', 'Gospel', 'Latin', 'World', 'Ambient', 'House', 'Techno', 'Trance',
  'Drum & Bass', 'Dubstep', 'Trap', 'Lo-fi', 'Acoustic', 'Singer-Songwriter'
];

// Hardcoded Dropbox token - users don't need to enter this
const DROPBOX_TOKEN = 'sl.u.AF0gq9q1WB7U7FDqyrqv_MdL-F4CTEkDXMirwKR5Hs4Is-lbaseD5Gz5-aD5ACNOcDVGU0nhWWdeLHYzjsm9xXUSvsp73lPlfTBasz1qut1ZvfpTJaRDJHV-WkTo2bLqdGE8c6lRQ6WQdB66jTA30T9jBJ--qTTjX395PTxPL7R49SrLw-8jO8GdmSvEVGc74KZaWyfCDCsFh_tRZjMXBVu0fCygJ-Y1wAnQyvLcYAL8nXNy70_rmdyhMvscwPMtkIB2I6HYcobNMJ85x-CYdoOHp9dLEvQneSu8T-OD93HiqMr4fBFS_vDjUYzLNGPP3K2Y-9nXh5wpWvtYDzshI0Yk2bboWYL5gon8sTAHgz3118fexhxMvIzygF46jKu7jCFulec0QL8A3pfFTMN47yyHepMGk0zer_AVdhmLUv3t44CsSEVoVAsZp2efiUvt0V-7uS8wlRG49ERB5jb8dMGORNQHCCV8rBSKsQ87Fys0Yeup90zukKUQK7RKa7Zb6nMAy_woEKVpo8al5GBS-QF0cxlDPPXdI5jHC7As2mPyij1Mx65RaAWzv8KOlUNWj3N8i0mTOQXvPTmwcKIE3vjRTqbUDL-0jzTaiqqsrb3yxp6IedeeqeOlhiez34QgdDFtac6x5B0lghghWmEZF5mAEHA3PxpUo55zgvxlix--Ub5B4dtM8WuXRg-ceRf6oYlQb221PKgf74Bk7BT2JecO84TQ-qwkyruNR_hZ5tjs4UpqzIhmbtsq1efOqjAQvQ7MMZZJ7xkgVEZ936y2eOUHhrGEv2-h0GzBnEA9V2DJlZOkExKvEVhjgsbTNhfreQVwebb8Suwkysh_Wb4Lqtlnnw3NxrLXyjtVnw9jqHCpx2lZ6UHRqVfZltiG7hsovhWiS3vQZwDOpkn6jO_HaZJcV-HkCjbqfYk6McKSryCl3ON1jKVlxwfrmO235eL1LfrJfk36lAaPHGVgxABCbWfguehoR8RRs6QsMkOeuHaKd1x6qq01CGEFjEAiMOMHfILE-8xns0EBze4xAiBFBIqi2OJc0QT8uPkflKniC3pi3SvhyRcbbQe173b5k3kR5jdwXdizAofAb6UeqvyoC97ZGH-FY5AK5z-yDV1R_oKO6T5yIN589jxcnylPmizHGii2S2hocvHBsC7iO69VOPR1VDDVxPu1ZvGuSLtde0iwy0179-BMSyDP9klsxCLMCmlIp4y3JHObyzGXWoe5bggAxCLe75qwEXQPOEVcTKum1Poz48Yyy5Os-fRzvnWm8pFSSTpsy7F7WqgjkPs1wgyETOi_A5oqsjM5QfRaHZTBtA';

interface FileUploadAreaProps {
  onFileChange: (file: File | null) => void;
  acceptedTypes: string;
  label: string;
  file: File | null;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFileChange, acceptedTypes, label, file }) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      onFileChange(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors"
    >
      <input
        type="file"
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
        id={`file-${label}`}
      />
      <label htmlFor={`file-${label}`} className="cursor-pointer">
        {file ? (
          <div className="text-green-600">
            <Check className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-gray-500">Click to change</p>
          </div>
        ) : (
          <div className="text-gray-500">
            <Upload className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Drop your {label} here or click to browse</p>
            <p className="text-sm">Supports: {acceptedTypes}</p>
          </div>
        )}
      </label>
    </div>
  );
};

function App() {
  const [step, setStep] = useState('start');
  const [userType, setUserType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // New artist state
  const [newArtist, setNewArtist] = useState({
    artistName: '',
    bio: '',
    profilePicture: null as File | null,
    uploadType: '',
    // Single track data
    singleData: {
      songTitle: '',
      audioFile: null as File | null,
      artwork: null as File | null,
      genre: '',
      lyricsFile: null as File | null,
      credits: {
        songwriter: '',
        producer: '',
        engineer: '',
        additional: ''
      }
    },
    // Album data
    albumData: {
      albumTitle: '',
      albumArtwork: null as File | null,
      tracks: [] as Array<{
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
      }>
    },
    // Video data
    videoData: {
      videoTitle: '',
      videoFile: null as File | null,
      thumbnail: null as File | null
    }
  });

  // Existing artist state
  const [existingArtist, setExistingArtist] = useState({
    artistName: '',
    uploadType: '',
    // Single track data
    singleData: {
      songTitle: '',
      audioFile: null as File | null,
      artwork: null as File | null,
      genre: '',
      lyricsFile: null as File | null,
      credits: {
        songwriter: '',
        producer: '',
        engineer: '',
        additional: ''
      }
    },
    // Album data
    albumData: {
      albumTitle: '',
      albumArtwork: null as File | null,
      tracks: [] as Array<{
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
      }>
    },
    // Video data
    videoData: {
      videoTitle: '',
      videoFile: null as File | null,
      thumbnail: null as File | null
    }
  });

  const handleFileChange = (file: File | null, field: string) => {
    if (userType === 'new') {
      if (field === 'profilePicture') {
        setNewArtist(prev => ({ ...prev, profilePicture: file }));
      } else if (newArtist.uploadType === 'single') {
        if (field === 'lyricsFile') {
          setNewArtist(prev => ({
            ...prev,
            singleData: { ...prev.singleData, lyricsFile: file }
          }));
        } else {
          setNewArtist(prev => ({
            ...prev,
            singleData: { ...prev.singleData, [field]: file }
          }));
        }
      } else if (newArtist.uploadType === 'album') {
        setNewArtist(prev => ({
          ...prev,
          albumData: { ...prev.albumData, [field]: file }
        }));
      } else if (newArtist.uploadType === 'video') {
        setNewArtist(prev => ({
          ...prev,
          videoData: { ...prev.videoData, [field]: file }
        }));
      }
    } else {
      if (existingArtist.uploadType === 'single') {
        if (field === 'lyricsFile') {
          setExistingArtist(prev => ({
            ...prev,
            singleData: { ...prev.singleData, lyricsFile: file }
          }));
        } else {
          setExistingArtist(prev => ({
            ...prev,
            singleData: { ...prev.singleData, [field]: file }
          }));
        }
      } else if (existingArtist.uploadType === 'album') {
        setExistingArtist(prev => ({
          ...prev,
          albumData: { ...prev.albumData, [field]: file }
        }));
      } else if (existingArtist.uploadType === 'video') {
        setExistingArtist(prev => ({
          ...prev,
          videoData: { ...prev.videoData, [field]: file }
        }));
      }
    }
  };

  const addAlbumTrack = () => {
    const newTrack = {
      title: '',
      audioFile: null as File | null,
      genre: '',
      lyricsFile: null as File | null,
      credits: {
        songwriter: '',
        producer: '',
        engineer: '',
        additional: ''
      }
    };

    if (userType === 'new') {
      setNewArtist(prev => ({
        ...prev,
        albumData: {
          ...prev.albumData,
          tracks: [...prev.albumData.tracks, newTrack]
        }
      }));
    } else {
      setExistingArtist(prev => ({
        ...prev,
        albumData: {
          ...prev.albumData,
          tracks: [...prev.albumData.tracks, newTrack]
        }
      }));
    }
  };

  const removeAlbumTrack = (index: number) => {
    if (userType === 'new') {
      setNewArtist(prev => ({
        ...prev,
        albumData: {
          ...prev.albumData,
          tracks: prev.albumData.tracks.filter((_, i) => i !== index)
        }
      }));
    } else {
      setExistingArtist(prev => ({
        ...prev,
        albumData: {
          ...prev.albumData,
          tracks: prev.albumData.tracks.filter((_, i) => i !== index)
        }
      }));
    }
  };

  const updateAlbumTrack = (index: number, field: string, value: any) => {
    if (userType === 'new') {
      setNewArtist(prev => ({
        ...prev,
        albumData: {
          ...prev.albumData,
          tracks: prev.albumData.tracks.map((track, i) => 
            i === index ? { ...track, [field]: value } : track
          )
        }
      }));
    } else {
      setExistingArtist(prev => ({
        ...prev,
        albumData: {
          ...prev.albumData,
          tracks: prev.albumData.tracks.map((track, i) => 
            i === index ? { ...track, [field]: value } : track
          )
        }
      }));
    }
  };

  const updateAlbumTrackCredits = (index: number, field: string, value: string) => {
    if (userType === 'new') {
      setNewArtist(prev => ({
        ...prev,
        albumData: {
          ...prev.albumData,
          tracks: prev.albumData.tracks.map((track, i) => 
            i === index ? { 
              ...track, 
              credits: { ...track.credits, [field]: value }
            } : track
          )
        }
      }));
    } else {
      setExistingArtist(prev => ({
        ...prev,
        albumData: {
          ...prev.albumData,
          tracks: prev.albumData.tracks.map((track, i) => 
            i === index ? { 
              ...track, 
              credits: { ...track.credits, [field]: value }
            } : track
          )
        }
      }));
    }
  };

  const handleSubmit = async () => {
    setUploading(true);
    setUploadStatus('Preparing upload...');
    setUploadProgress(0);

    try {
      const uploader = new DropboxUploader(DROPBOX_TOKEN);
      
      if (userType === 'new') {
        await uploader.uploadNewArtist(newArtist, (status, progress) => {
          setUploadStatus(status);
          setUploadProgress(progress);
        });
      } else {
        if (existingArtist.uploadType === 'single') {
          await uploader.uploadSingle(
            existingArtist.artistName,
            {
              songName: existingArtist.singleData.songTitle,
              genre: existingArtist.singleData.genre,
              artwork: existingArtist.singleData.artwork,
              credits: existingArtist.singleData.credits,
              lyricsFile: existingArtist.singleData.lyricsFile,
              audioFile: existingArtist.singleData.audioFile,
            },
            (progress) => setUploadProgress(progress)
          );
        } else if (existingArtist.uploadType === 'album') {
          await uploader.uploadAlbum(
            existingArtist.artistName,
            {
              albumName: existingArtist.albumData.albumTitle,
              artwork: existingArtist.albumData.albumArtwork,
              tracks: existingArtist.albumData.tracks,
            },
            (progress) => setUploadProgress(progress)
          );
        } else if (existingArtist.uploadType === 'video') {
          await uploader.uploadVideo(
            existingArtist.artistName,
            {
              videoTitle: existingArtist.videoData.videoTitle,
              videoFile: existingArtist.videoData.videoFile,
              thumbnail: existingArtist.videoData.thumbnail,
            },
            (progress) => setUploadProgress(progress)
          );
        }
      }

      setUploadStatus('Upload completed successfully!');
      setUploadProgress(100);
      
      // Reset form after successful upload
      setTimeout(() => {
        setStep('start');
        setUserType('');
        setUploading(false);
        setUploadStatus('');
        setUploadProgress(0);
        setNewArtist({
          artistName: '',
          bio: '',
          profilePicture: null,
          uploadType: '',
          singleData: {
            songTitle: '',
            audioFile: null,
            artwork: null,
            genre: '',
            lyricsFile: null,
            credits: { songwriter: '', producer: '', engineer: '', additional: '' }
          },
          albumData: {
            albumTitle: '',
            albumArtwork: null,
            tracks: []
          },
          videoData: {
            videoTitle: '',
            videoFile: null,
            thumbnail: null
          }
        });
        setExistingArtist({
          artistName: '',
          uploadType: '',
          singleData: {
            songTitle: '',
            audioFile: null,
            artwork: null,
            genre: '',
            lyricsFile: null,
            credits: { songwriter: '', producer: '', engineer: '', additional: '' }
          },
          albumData: {
            albumTitle: '',
            albumArtwork: null,
            tracks: []
          },
          videoData: {
            videoTitle: '',
            videoFile: null,
            thumbnail: null
          }
        });
        setUploading(false);
        setUploadStatus('');
        setUploadProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Upload failed. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Upload timed out. This may be due to a large file or slow internet connection. Please try again.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('Session')) {
          errorMessage = 'Upload session error. Please try uploading again.';
        } else if (error.message.includes('authorization') || error.message.includes('token')) {
          errorMessage = 'Authorization error. Please refresh the page and try again.';
        }
      }
      
      setUploadStatus(errorMessage);
      setUploadProgress(0);
      setUploading(false);
      
      // Auto-hide error message after 10 seconds
      setTimeout(() => {
        if (!uploading) {
          setUploadStatus('');
        }
      }, 10000);
    }
  };

  const handleBack = () => {
    if (userType === 'new') {
      if (newArtist.uploadType) {
        // If on a specific upload type, go back to upload type selection
        setNewArtist(prev => ({ ...prev, uploadType: '' }));
      } else if (step === 'newArtist') {
        // If on artist details, go back to start
        setStep('start');
        setUserType('');
      }
    } else if (userType === 'existing') {
      if (existingArtist.uploadType) {
        // If on a specific upload type, go back to upload type selection
        setExistingArtist(prev => ({ ...prev, uploadType: '' }));
      } else if (step === 'existingArtist') {
        // If on artist name input, go back to start
        setStep('start');
        setUserType('');
      }
    }
  };

  if (step === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-4 w-20 h-20 mx-auto mb-4">
              <Music className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Arbiem Sounds</h1>
            <p className="text-gray-600">Upload your music content</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                setUserType('new');
                setStep('newArtist');
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center">
                <User className="h-5 w-5 mr-3" />
                New Artist
              </div>
              <p className="text-sm opacity-90 mt-1">Create your profile and upload content</p>
            </button>

            <button
              onClick={() => {
                setUserType('existing');
                setStep('existingArtist');
              }}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:border-purple-400 hover:text-purple-600 transition-all transform hover:scale-105"
            >
              <div className="flex items-center justify-center">
                <Headphones className="h-5 w-5 mr-3" />
                Existing Artist
              </div>
              <p className="text-sm opacity-70 mt-1">Upload new content to your profile</p>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Ready to upload! Your files will be securely uploaded to Arbiem Sounds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Arbiem Sounds</h1>
          <p className="text-purple-200">Upload your music and create your artist profile</p>
        </div>


        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex items-center text-white hover:text-purple-200 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back
              </button>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">Arbiem Sounds</h1>
                <p className="text-purple-100">
                  {userType === 'new' ? 'New Artist Setup' : 'Existing Artist Upload'}
                </p>
              </div>
              <div className="w-16"></div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {userType === 'new' && (
              <div className="space-y-8">
                {!newArtist.uploadType ? (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Artist Profile</h2>
                      <p className="text-gray-600">Tell us about yourself and choose what to upload</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Artist Name</label>
                        <input
                          type="text"
                          value={newArtist.artistName}
                          onChange={(e) => setNewArtist(prev => ({ ...prev, artistName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Your stage name or band name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                        <FileUploadArea
                          onFileChange={(file) => handleFileChange(file, 'profilePicture')}
                          acceptedTypes="image/*"
                          label="profile picture"
                          file={newArtist.profilePicture}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Artist Bio</label>
                      <textarea
                        value={newArtist.bio}
                        onChange={(e) => setNewArtist(prev => ({ ...prev, bio: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Tell your fans about your music journey..."
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">What would you like to upload?</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <button
                          onClick={() => setNewArtist(prev => ({ ...prev, uploadType: 'single' }))}
                          className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
                        >
                          <Music className="h-8 w-8 text-green-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                          <h4 className="font-semibold text-gray-900 mb-2">Single Track</h4>
                          <p className="text-sm text-gray-600">Upload one song with artwork and credits</p>
                        </button>

                        <button
                          onClick={() => {
                            setNewArtist(prev => ({ ...prev, uploadType: 'album' }));
                            if (newArtist.albumData.tracks.length === 0) {
                              addAlbumTrack();
                            }
                          }}
                          className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                          <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                          <h4 className="font-semibold text-gray-900 mb-2">Album/EP</h4>
                          <p className="text-sm text-gray-600">Upload multiple tracks as an album</p>
                        </button>

                        <button
                          onClick={() => setNewArtist(prev => ({ ...prev, uploadType: 'video' }))}
                          className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group"
                        >
                          <Image className="h-8 w-8 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                          <h4 className="font-semibold text-gray-900 mb-2">Music Video</h4>
                          <p className="text-sm text-gray-600">Upload a music video with thumbnail</p>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : newArtist.uploadType === 'single' ? (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Single Track</h2>
                      <p className="text-gray-600">Add your song details and files</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Song Title</label>
                        <input
                          type="text"
                          value={newArtist.singleData.songTitle}
                          onChange={(e) => setNewArtist(prev => ({
                            ...prev,
                            singleData: { ...prev.singleData, songTitle: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter song title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                        <select
                          value={newArtist.singleData.genre}
                          onChange={(e) => setNewArtist(prev => ({
                            ...prev,
                            singleData: { ...prev.singleData, genre: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select Genre</option>
                          {MUSIC_GENRES.map(genre => (
                            <option key={genre} value={genre}>{genre}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
                        <FileUploadArea
                          onFileChange={(file) => handleFileChange(file, 'audioFile')}
                          acceptedTypes="audio/*"
                          label="audio file"
                          file={newArtist.singleData.audioFile}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Artwork</label>
                        <FileUploadArea
                          onFileChange={(file) => handleFileChange(file, 'artwork')}
                          acceptedTypes="image/*"
                          label="artwork"
                          file={newArtist.singleData.artwork}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lyrics File (Optional)</label>
                      <FileUploadArea
                        onFileChange={(file) => handleFileChange(file, 'lyricsFile')}
                        acceptedTypes=".json"
                        label="lyrics JSON file"
                        file={newArtist.singleData.lyricsFile}
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Generate lyrics JSON at <a href="https://arbiem.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">arbiem.com</a>
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Credits</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Songwriter</label>
                          <input
                            type="text"
                            value={newArtist.singleData.credits.songwriter}
                            onChange={(e) => setNewArtist(prev => ({
                              ...prev,
                              singleData: {
                                ...prev.singleData,
                                credits: { ...prev.singleData.credits, songwriter: e.target.value }
                              }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Who wrote the song?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Producer</label>
                          <input
                            type="text"
                            value={newArtist.singleData.credits.producer}
                            onChange={(e) => setNewArtist(prev => ({
                              ...prev,
                              singleData: {
                                ...prev.singleData,
                                credits: { ...prev.singleData.credits, producer: e.target.value }
                              }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Who produced the track?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Engineer</label>
                          <input
                            type="text"
                            value={newArtist.singleData.credits.engineer}
                            onChange={(e) => setNewArtist(prev => ({
                              ...prev,
                              singleData: {
                                ...prev.singleData,
                                credits: { ...prev.singleData.credits, engineer: e.target.value }
                              }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Who engineered the recording?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Credits</label>
                          <input
                            type="text"
                            value={newArtist.singleData.credits.additional}
                            onChange={(e) => setNewArtist(prev => ({
                              ...prev,
                              singleData: {
                                ...prev.singleData,
                                credits: { ...prev.singleData.credits, additional: e.target.value }
                              }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Any other contributors?"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : newArtist.uploadType === 'album' ? (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Album/EP</h2>
                      <p className="text-gray-600">Add your album details and tracks</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Album Title</label>
                        <input
                          type="text"
                          value={newArtist.albumData.albumTitle}
                          onChange={(e) => setNewArtist(prev => ({
                            ...prev,
                            albumData: { ...prev.albumData, albumTitle: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter album title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Album Artwork</label>
                        <FileUploadArea
                          onFileChange={(file) => handleFileChange(file, 'albumArtwork')}
                          acceptedTypes="image/*"
                          label="album artwork"
                          file={newArtist.albumData.albumArtwork}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Tracks</h3>
                        <button
                          onClick={addAlbumTrack}
                          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Track
                        </button>
                      </div>

                      {newArtist.albumData.tracks.map((track, trackIndex) => (
                        <React.Fragment key={trackIndex}>
                          <div className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-md font-semibold text-gray-900">Track {trackIndex + 1}</h4>
                              {newArtist.albumData.tracks.length > 1 && (
                                <button
                                  onClick={() => removeAlbumTrack(trackIndex)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Track Title</label>
                                <input
                                  type="text"
                                  value={track.title}
                                  onChange={(e) => updateAlbumTrack(trackIndex, 'title', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Enter track title"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                                <select
                                  value={track.genre}
                                  onChange={(e) => updateAlbumTrack(trackIndex, 'genre', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="">Select Genre</option>
                                  {MUSIC_GENRES.map(genre => (
                                    <option key={genre} value={genre}>{genre}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
                              <FileUploadArea
                                onFileChange={(file) => updateAlbumTrack(trackIndex, 'audioFile', file)}
                                acceptedTypes="audio/*"
                                label="audio file"
                                file={track.audioFile}
                              />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Songwriter</label>
                                <input
                                  type="text"
                                  value={track.credits.songwriter}
                                  onChange={(e) => updateAlbumTrackCredits(trackIndex, 'songwriter', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Who wrote this track?"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Producer</label>
                                <input
                                  type="text"
                                  value={track.credits.producer}
                                  onChange={(e) => updateAlbumTrackCredits(trackIndex, 'producer', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Who produced this track?"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Engineer</label>
                                <input
                                  type="text"
                                  value={track.credits.engineer}
                                  onChange={(e) => updateAlbumTrackCredits(trackIndex, 'engineer', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Who engineered this track?"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Credits</label>
                                <input
                                  type="text"
                                  value={track.credits.additional}
                                  onChange={(e) => updateAlbumTrackCredits(trackIndex, 'additional', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Any other contributors?"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Lyrics File (Optional)</label>
                              <FileUploadArea
                                onFileChange={(file) => updateAlbumTrack(trackIndex, 'lyricsFile', file)}
                                acceptedTypes=".json"
                                label="lyrics JSON file"
                                file={track.lyricsFile}
                              />
                              <p className="text-sm text-gray-500 mt-2">
                                Generate lyrics JSON at <a href="https://arbiem.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">arbiem.com</a>
                              </p>
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : newArtist.uploadType === 'video' ? (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Music Video</h2>
                      <p className="text-gray-600">Add your music video and details</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Video Title</label>
                        <input
                          type="text"
                          value={newArtist.videoData.videoTitle}
                          onChange={(e) => setNewArtist(prev => ({
                            ...prev,
                            videoData: { ...prev.videoData, videoTitle: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter video title exactly as you want it to appear"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
                        <FileUploadArea
                          onFileChange={(file) => handleFileChange(file, 'videoFile')}
                          acceptedTypes="video/*"
                          label="video file"
                          file={newArtist.videoData.videoFile}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail (Optional)</label>
                      <FileUploadArea
                        onFileChange={(file) => handleFileChange(file, 'thumbnail')}
                        acceptedTypes="image/*"
                        label="thumbnail image"
                        file={newArtist.videoData.thumbnail}
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        If no thumbnail is provided, the video platform will generate one automatically.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {userType === 'existing' && (
              <div className="space-y-8">
                {!existingArtist.uploadType ? (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload New Content</h2>
                      <p className="text-gray-600">Add new content to your existing profile</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Artist Name</label>
                      <input
                        type="text"
                        value={existingArtist.artistName}
                        onChange={(e) => setExistingArtist(prev => ({ ...prev, artistName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter your existing artist name"
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">What would you like to upload?</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <button
                          onClick={() => setExistingArtist(prev => ({ ...prev, uploadType: 'single' }))}
                          disabled={!existingArtist.artistName.trim()}
                          className={`p-6 border-2 rounded-xl transition-all group ${
                            !existingArtist.artistName.trim()
                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                              : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                          }`}
                        >
                          <Music className={`h-8 w-8 mx-auto mb-3 transition-transform ${
                            !existingArtist.artistName.trim()
                              ? 'text-gray-400'
                              : 'text-green-600 group-hover:scale-110'
                          }`} />
                          <h4 className="font-semibold text-gray-900 mb-2">Single Track</h4>
                          <p className="text-sm text-gray-600">Upload one song with artwork and credits</p>
                        </button>

                        <button
                          onClick={() => {
                            setExistingArtist(prev => ({ ...prev, uploadType: 'album' }));
                            if (existingArtist.albumData.tracks.length === 0) {
                              addAlbumTrack();
                            }
                          }}
                          disabled={!existingArtist.artistName.trim()}
                          className={`p-6 border-2 rounded-xl transition-all group ${
                            !existingArtist.artistName.trim()
                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                              : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          <FileText className={`h-8 w-8 mx-auto mb-3 transition-transform ${
                            !existingArtist.artistName.trim()
                              ? 'text-gray-400'
                              : 'text-blue-600 group-hover:scale-110'
                          }`} />
                          <h4 className="font-semibold text-gray-900 mb-2">Album/EP</h4>
                          <p className="text-sm text-gray-600">Upload multiple tracks as an album</p>
                        </button>

                        <button
                          onClick={() => setExistingArtist(prev => ({ ...prev, uploadType: 'video' }))}
                          disabled={!existingArtist.artistName.trim()}
                          className={`p-6 border-2 rounded-xl transition-all group ${
                            !existingArtist.artistName.trim()
                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                              : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                          }`}
                        >
                          <Image className={`h-8 w-8 mx-auto mb-3 transition-transform ${
                            !existingArtist.artistName.trim()
                              ? 'text-gray-400'
                              : 'text-purple-600 group-hover:scale-110'
                          }`} />
                          <h4 className="font-semibold text-gray-900 mb-2">Music Video</h4>
                          <p className="text-sm text-gray-600">Upload a music video with thumbnail</p>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : existingArtist.uploadType === 'single' ? (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Single Track</h2>
                      <p className="text-gray-600">Add your new single to {existingArtist.artistName}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Song Title</label>
                        <input
                          type="text"
                          value={existingArtist.singleData.songTitle}
                          onChange={(e) => setExistingArtist(prev => ({
                            ...prev,
                            singleData: { ...prev.singleData, songTitle: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter song title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                        <select
                          value={existingArtist.singleData.genre}
                          onChange={(e) => setExistingArtist(prev => ({
                            ...prev,
                            singleData: { ...prev.singleData, genre: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select Genre</option>
                          {MUSIC_GENRES.map(genre => (
                            <option key={genre} value={genre}>{genre}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
                        <FileUploadArea
                          onFileChange={(file) => handleFileChange(file, 'audioFile')}
                          acceptedTypes="audio/*"
                          label="audio file"
                          file={existingArtist.singleData.audioFile}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Artwork</label>
                        <FileUploadArea
                          onFileChange={(file) => handleFileChange(file, 'artwork')}
                          acceptedTypes="image/*"
                          label="artwork"
                          file={existingArtist.singleData.artwork}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lyrics File (Optional)</label>
                      <FileUploadArea
                        onFileChange={(file) => handleFileChange(file, 'lyricsFile')}
                        acceptedTypes=".json"
                        label="lyrics JSON file"
                        file={existingArtist.singleData.lyricsFile}
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Generate lyrics JSON at <a href="https://arbiem.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">arbiem.com</a>
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Credits</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Songwriter</label>
                          <input
                            type="text"
                            value={existingArtist.singleData.credits.songwriter}
                            onChange={(e) => setExistingArtist(prev => ({
                              ...prev,
                              singleData: {
                                ...prev.singleData,
                                credits: { ...prev.singleData.credits, songwriter: e.target.value }
                              }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Who wrote the song?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Producer</label>
                          <input
                            type="text"
                            value={existingArtist.singleData.credits.producer}
                            onChange={(e) => setExistingArtist(prev => ({
                              ...prev,
                              singleData: {
                                ...prev.singleData,
                                credits: { ...prev.singleData.credits, producer: e.target.value }
                              }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Who produced the track?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Engineer</label>
                          <input
                            type="text"
                            value={existingArtist.singleData.credits.engineer}
                            onChange={(e) => setExistingArtist(prev => ({
                              ...prev,
                              singleData: {
                                ...prev.singleData,
                                credits: { ...prev.singleData.credits, engineer: e.target.value }
                              }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Who engineered the recording?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Credits</label>
                          <input
                            type="text"
                            value={existingArtist.singleData.credits.additional}
                            onChange={(e) => setExistingArtist(prev => ({
                              ...prev,
                              singleData: {
                                ...prev.singleData,
                                credits: { ...prev.singleData.credits, additional: e.target.value }
                              }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Any other contributors?"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : existingArtist.uploadType === 'album' ? (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Album/EP</h2>
                      <p className="text-gray-600">Add your new album to {existingArtist.artistName}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Album Title</label>
                        <input
                          type="text"
                          value={existingArtist.albumData.albumTitle}
                          onChange={(e) => setExistingArtist(prev => ({
                            ...prev,
                            albumData: { ...prev.albumData, albumTitle: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter album title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Album Artwork</label>
                        <FileUploadArea
                          onFileChange={(file) => handleFileChange(file, 'albumArtwork')}
                          acceptedTypes="image/*"
                          label="album artwork"
                          file={existingArtist.albumData.albumArtwork}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Tracks</h3>
                        <button
                          onClick={addAlbumTrack}
                          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Track
                        </button>
                      </div>

                      {existingArtist.albumData.tracks.map((track, trackIndex) => (
                        <React.Fragment key={trackIndex}>
                          <div className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-md font-semibold text-gray-900">Track {trackIndex + 1}</h4>
                              {existingArtist.albumData.tracks.length > 1 && (
                                <button
                                  onClick={() => removeAlbumTrack(trackIndex)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Track Title</label>
                                <input
                                  type="text"
                                  value={track.title}
                                  onChange={(e) => updateAlbumTrack(trackIndex, 'title', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Enter track title"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                                <select
                                  value={track.genre}
                                  onChange={(e) => updateAlbumTrack(trackIndex, 'genre', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="">Select Genre</option>
                                  {MUSIC_GENRES.map(genre => (
                                    <option key={genre} value={genre}>{genre}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
                              <FileUploadArea
                                onFileChange={(file) => updateAlbumTrack(trackIndex, 'audioFile', file)}
                                acceptedTypes="audio/*"
                                label="audio file"
                                file={track.audioFile}
                              />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Songwriter</label>
                                <input
                                  type="text"
                                  value={track.credits.songwriter}
                                  onChange={(e) => updateAlbumTrackCredits(trackIndex, 'songwriter', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Who wrote this track?"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Producer</label>
                                <input
                                  type="text"
                                  value={track.credits.producer}
                                  onChange={(e) => updateAlbumTrackCredits(trackIndex, 'producer', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Who produced this track?"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Engineer</label>
                                <input
                                  type="text"
                                  value={track.credits.engineer}
                                  onChange={(e) => updateAlbumTrackCredits(trackIndex, 'engineer', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Who engineered this track?"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Credits</label>
                                <input
                                  type="text"
                                  value={track.credits.additional}
                                  onChange={(e) => updateAlbumTrackCredits(trackIndex, 'additional', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Any other contributors?"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Lyrics File (Optional)</label>
                              <FileUploadArea
                                onFileChange={(file) => updateAlbumTrack(trackIndex, 'lyricsFile', file)}
                                acceptedTypes=".json"
                                label="lyrics JSON file"
                                file={track.lyricsFile}
                              />
                              <p className="text-sm text-gray-500 mt-2">
                                Generate lyrics JSON at <a href="https://arbiem.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">arbiem.com</a>
                              </p>
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : existingArtist.uploadType === 'video' ? (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Music Video</h2>
                      <p className="text-gray-600">Add your new music video to {existingArtist.artistName}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Video Title</label>
                        <input
                          type="text"
                          value={existingArtist.videoData.videoTitle}
                          onChange={(e) => setExistingArtist(prev => ({
                            ...prev,
                            videoData: { ...prev.videoData, videoTitle: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter video title exactly as you want it to appear"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
                        <FileUploadArea
                          onFileChange={(file) => handleFileChange(file, 'videoFile')}
                          acceptedTypes="video/*"
                          label="video file"
                          file={existingArtist.videoData.videoFile}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail (Optional)</label>
                      <FileUploadArea
                        onFileChange={(file) => handleFileChange(file, 'thumbnail')}
                        acceptedTypes="image/*"
                        label="thumbnail image"
                        file={existingArtist.videoData.thumbnail}
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        If no thumbnail is provided, the video platform will generate one automatically.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center pt-8 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className={`px-8 py-4 rounded-xl font-semibold text-white transition-all transform hover:scale-105 ${
                  uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : userType === 'new'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {uploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    {uploadStatus} {uploadProgress}%
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    {userType === 'new' ? 'Create Profile & Upload' : 'Upload Content'}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;