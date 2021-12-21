import * as stage from './stage-constants';

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
  setProcessRatio,
  timeStampAtStage
) => {
  try {
    timeStampAtStage(stage.LOADING_VIDEO);
    const videoFilename = video.name;
    ffmpeg.FS('writeFile', videoFilename, await fetchFile(video));

    timeStampAtStage(stage.EXTRACTING_AUDIO);
    await ffmpeg.run('-i', videoFilename, '-vn', '-acodec', 'copy', FINALAUDIO);
    timeStampAtStage(stage.EXTRACTED_AUDIO);

    const allFiles = ffmpeg.FS('readdir', '/'); //: list files inside specific path
    console.log('allFiles :>> ', allFiles);
    const data = ffmpeg.FS('readFile', FINALAUDIO);
    console.log('data :>> ', data);

    const audioBlob = new Blob([data.buffer], { type: 'audio/aac' });
    timeStampAtStage(stage.UPLOADING_AUDIO);
    uploadAudio(audioBlob, audioUuid, setProcessRatio);
    timeStampAtStage(stage.ANALYSING_AUDIO);
    // set timer for analysis
    //sent for transcription
    const url = URL.createObjectURL(audioBlob);

    console.log('url :>> ', url);
    setAudio(url);
  } catch (error) {
    console.error(error);
  }
};
