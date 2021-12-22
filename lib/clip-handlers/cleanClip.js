import * as ffmpegProcess from '../videoprocessing/ffmpegProcess';
import * as processTimestamps from '../videoprocessing/processTimestamps';
import * as watsonProcess from '../videoprocessing/watsonsProcessing';
import { HESITATION, PAUSE, WORD } from '../videoprocessing/timestampTypes';
import * as stage from './stage-constants';

import { fetchFile } from '@ffmpeg/ffmpeg';

export const cleanClip = async (
  transcript,
  ffmpeg,
  video,
  PROCESSEDAUDIOFN,
  setCleanedClip,
  timeStampAtStage
) => {
  console.log('transcript in cleanclip', transcript);
  console.time('clean');

  // ffmpeg.setLogger(({ type, message }) => {
  //   console.log('message :>> ', message);
  // });

  try {
    //fetch video
    const videoFilename = video.name;
    timeStampAtStage(stage.PROCESSING_VIDEO);
    ffmpeg.FS('writeFile', videoFilename, await fetchFile(video));
    
    //clean transcript
    timeStampAtStage(stage.CLEANING_TRANSCRIPT);
    const flattenTranscript = watsonProcess.flattenTranscript(transcript);
    console.log('flattenTranscript :>> ', flattenTranscript);
    const mergedTranscript =
      processTimestamps.mergeWordsTimeStamps(flattenTranscript);

    mergedTranscript.forEach((clip, i) => (clip.filename = i));
    console.log('mergedTranscript :>> ', mergedTranscript);

    const wordsAndPauses = mergedTranscript.filter(
      (clip) => clip.type !== HESITATION
    );
    console.log('wordsAndPauses :>> ', wordsAndPauses);

    const cleanedWordsAndPauses =
      processTimestamps.mergeWordsTimeStamps(wordsAndPauses);
    console.log('cleanedWordsAndPauses   ', cleanedWordsAndPauses);

    // try to run multiple webworkers to cut concurrently
    // cut only clips that are needed
    timeStampAtStage(stage.CUTTING_VIDEO); 
    console.time('cut');
    console.log('cutting clips');
    await ffmpegProcess.cutClips(
      ffmpeg,
      videoFilename,
      cleanedWordsAndPauses,
      'mp4'
    );
    console.timeEnd('cut');

    console.log('speeding pauses');
    // modify duration of pauses
    timeStampAtStage(stage.SPEEDING_UP_PAUSES);
    console.time('speed');
    await ffmpegProcess.changeDurationOfPauses(
      ffmpeg,
      0.8,
      cleanedWordsAndPauses,
      'mp4'
    );
    console.timeEnd('speed');

    console.log('building concat list');
    const clipNames = cleanedWordsAndPauses.map((clip) => clip.filename);
    console.log('clipNames :>> ', clipNames);
    timeStampAtStage(stage.PREPARING_TO_STITCH);
    const CONCATFILENAME = await ffmpegProcess.buildConcatList(
      ffmpeg,
      clipNames,
      'mp4'
    );

    console.log('stitching video');
    timeStampAtStage(stage.STITCHING_VIDEO);
    console.time('concat');
    await ffmpegProcess.concatFiles(ffmpeg, CONCATFILENAME, PROCESSEDAUDIOFN);
    console.timeEnd('concat');

    const allFiles = ffmpeg.FS('readdir', '/'); //: list files inside specific path
    console.log('allFiles :>> ', allFiles);
    timeStampAtStage(stage.CLEARING_MEMORY);
    const data = ffmpeg.FS('readFile', PROCESSEDAUDIOFN);
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'image/mp4' })
    );
    timeStampAtStage(stage.COMPLETED);

    setCleanedClip(url);
    console.timeEnd('clean');
    // unlink files
    ffmpegProcess.removeAllFiles(ffmpeg);
  } catch (error) {
    console.error(error);
  }
};
