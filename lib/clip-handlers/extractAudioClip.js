import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, storage, STATE_CHANGED } from '../firebase';

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
  setAudio
) => {
  // const [uploading, setUploading] = useState(false);
  // const [progress, setProgress] = useState(0);
  // const [downloadURL, setDownloadURL] = useState(null);

  async function saveAudio(file) {
    try {
      // upload file to cloud storage
      console.log('file', file);
      const filePath = `audioTrack.aac`;
      const ext = '.aac'
      const newAudioRef = ref(storage, `uploads/${auth.currentUser.uid}/${filePath}`);
      //  setUploading(true);
      const fileSnapshot = uploadBytesResumable(newAudioRef, file);

      fileSnapshot.on(STATE_CHANGED, (snapshot) => {
        const pct = (
          (snapshot.bytesTransferred / snapshot.totalBytes) *
          100
        ).toFixed(0);
        console.log('pct', pct);
        // setProgress(pct);
      });

      fileSnapshot
        .then((d) => getDownloadURL(newAudioRef))
        .then((url) => {
          // setDownloadURL(url);
          // setUploading(false);
        });
    } catch (error) {
      console.error(
        'There was an error uploading a file to Cloud Storage:',
        error
      );
    }
  }
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
    //sent for transcription
    const url = URL.createObjectURL(audioBlob);

    console.log('url :>> ', url);
    setAudio(url);
  } catch (error) {
    console.error(error);
  }
};
