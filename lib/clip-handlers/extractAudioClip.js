import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';

async function saveAudio(file) {
  try {
    // upload file to cloud storage
    console.log('file', file);
    const filePath = `audioTrack.aac`;

    const newAudioRef = ref(getStorage(), filePath);
    const fileSnapshot = await uploadBytesResumable(newAudioRef, file);

    // generate public URL for the file
    const publicAudioUrl = await getDownloadURL(newAudioRef);

    console.log('publicAudioUrl :>> ', publicAudioUrl);
  } catch (error) {
    console.error(
      'There was an error uploading a file to Cloud Storage:',
      error
    );
  }
}

import { fetchFile } from '@ffmpeg/ffmpeg';
import { logProgress } from './setProgress';
const SILENCEDETECT = '[silencedetect @';
const SILENCELOG = 'silencedetect=';
const DURATIONLOG = 'Duration: ';
//Testing function
export const extractAudioClip = async (
  ffmpeg,
  video,
  IMPORTFILENAME,
  FINALAUDIO,
  setClip
) => {
  try {
    ffmpeg.FS('writeFile', IMPORTFILENAME, await fetchFile(video));
    await ffmpeg.run(
      '-i',
      IMPORTFILENAME,
      '-vn',
      '-acodec',
      'copy',
      FINALAUDIO
    );

    const allFiles = ffmpeg.FS('readdir', '/'); //: list files inside specific path
    console.log('allFiles :>> ', allFiles);
    const data = ffmpeg.FS('readFile', FINALAUDIO);
    console.log('data :>> ', data);

    const audioBlob = new Blob([data.buffer], { type: 'audio/aac' });
    saveAudio(audioBlob);

    const url = URL.createObjectURL(audioBlob);

    console.log('url :>> ', url);
    setClip(url);
  } catch (error) {
    console.error(error);
  }
};
