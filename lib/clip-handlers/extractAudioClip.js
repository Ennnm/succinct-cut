import * as stage from './stage-constants';
import * as ffmpegProcess from '../videoprocessing/ffmpegProcess';

import { fetchFile } from '@ffmpeg/ffmpeg';

import { uploadAudio } from './uploadAudioToCloud';
import { v4 as uuidv4 } from 'uuid';
//Testing function
export const extractAudioClip = async (
  ffmpeg,
  video,
  FINALAUDIO,
  setAudioUuid,
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
    const audioUuid = uuidv4();
    // TODO uncomment uploadAudio
    // await uploadAudio(audioBlob, audioUuid);
    timeStampAtStage(stage.ANALYSING_AUDIO);
    //remove audio from mem

    await ffmpegProcess
      .removeFiles(ffmpeg, [FINALAUDIO.split('.')[0]], 'aac')
      .catch((e) => {
        console.log('error in removing file', e);
      });

    // ffmpeg.exit();
    setAudioUuid(audioUuid);
  } catch (error) {
    console.error(error);
  }
};
