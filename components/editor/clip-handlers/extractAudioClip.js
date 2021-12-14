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

    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'audio/aac' })
    );
    console.log('url :>> ', url);
    setClip(url);
  } catch (error) {
    console.error(error);
  }
};
