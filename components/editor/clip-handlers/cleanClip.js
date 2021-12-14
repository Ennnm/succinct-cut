import * as ffmpegProcess from '../videoprocessing/ffmpegProcess';
import * as processTimestamps from '../videoprocessing/processTimestamps';
import * as watsonProcess from '../videoprocessing/watsonsProcessing';
import { HESITATION, PAUSE, WORD } from '../videoprocessing/timestampTypes';
// import { transcript } from '../videoprocessing/transcript_2_flac_narrowband';
import { fetchFile } from '@ffmpeg/ffmpeg';
import { logProgress } from './setProgress';

export const cleanClip = async (
  transcript,
  ffmpeg,
  video,
  IMPORTFILENAME,
  CONCATFILENAME,
  PROCESSEDAUDIOFN,
  setCleanedClip
) => {
  console.log('transcript in cleanclip', transcript);
  console.time('clean');
  try {
    //fetch video
    ffmpeg.FS('writeFile', IMPORTFILENAME, await fetchFile(video));
    //clean transcript
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

    // try to run multiple webworkers to cut concurrently
    // cut only clips that are needed
    console.time('cut');
    await ffmpegProcess.cutClips(ffmpeg, IMPORTFILENAME, wordsAndPauses, 'mp4');
    console.timeEnd('cut');

    // modify duration of pauses
    console.time('speed');
    await ffmpegProcess.changeDurationOfPauses(
      ffmpeg,
      0.8,
      wordsAndPauses,
      'mp4'
    );
    console.timeEnd('speed');

    const clipNames = wordsAndPauses.map((clip) => clip.filename);
    console.log('clipNames :>> ', clipNames);
    CONCATFILENAME = await ffmpegProcess.buildConcatList(
      ffmpeg,
      clipNames,
      'mp4'
    );

    console.time('concat');
    await ffmpegProcess.concatFiles(ffmpeg, CONCATFILENAME, PROCESSEDAUDIOFN);
    console.timeEnd('concat');

    const allFiles = ffmpeg.FS('readdir', '/'); //: list files inside specific path
    console.log('allFiles :>> ', allFiles);
    await ffmpegProcess.removeFiles(ffmpeg, clipNames, 'mp4');
    // unlink files
    const data = ffmpeg.FS('readFile', PROCESSEDAUDIOFN);
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'image/mp4' })
    );
    setCleanedClip(url);
    console.timeEnd('clean');
  } catch (error) {
    console.error(error);
  }
};
