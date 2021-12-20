import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, storage, STATE_CHANGED } from '../firebase';
import { logProgress } from './setProgress';

export const uploadAudio = async (file, filename, setProcessRatio) => {
  const audioExt = 'aac';

  try {
    // upload file to cloud storage
    console.log('file', file);
    const ext = '.aac';

    const newAudioRef = ref(
      storage,
      `uploads/${auth.currentUser.uid}/${filename}`
    );
    //  setUploading(true);
    const fileSnapshot = uploadBytesResumable(newAudioRef, file);

    fileSnapshot.on(STATE_CHANGED, (snapshot) => {
      const pct = snapshot.bytesTransferred / snapshot.totalBytes;
      console.log('pct', pct);
      setProcessRatio(pct);
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
};
