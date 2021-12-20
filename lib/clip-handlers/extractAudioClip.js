import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, storage, STATE_CHANGED } from '../firebase';
import { logProgress } from './setProgress';

import { fetchFile } from '@ffmpeg/ffmpeg';

import { uploadAudio } from './uploadAudioToCloud';

//Testing function
export const extractAudioClip = async (
  ffmpeg,
  video,
  FINALAUDIO,
  setAudio,
  audioUuid,
  setProcessStage,
  setProcessRatio
) => {
  try {
    console.log('video in extract', video);
    const videoFilename = video.name;
    ffmpeg.FS('writeFile', videoFilename, await fetchFile(video));

    setProcessStage('Extracting audio');
    await ffmpeg.run('-i', videoFilename, '-vn', '-acodec', 'copy', FINALAUDIO);
    setProcessStage('Extracted audio');

    const allFiles = ffmpeg.FS('readdir', '/'); //: list files inside specific path
    console.log('allFiles :>> ', allFiles);
    const data = ffmpeg.FS('readFile', FINALAUDIO);
    console.log('data :>> ', data);

    const audioBlob = new Blob([data.buffer], { type: 'audio/aac' });
    setProcessStage('Uploading audio');
    uploadAudio(audioBlob, audioUuid, setProcessRatio);
    setProcessStage('Analysing audio');
    // set timer for analysis
    //sent for transcription
    const url = URL.createObjectURL(audioBlob);

    console.log('url :>> ', url);
    setAudio(url);
  } catch (error) {
    console.error(error);
  }
};
