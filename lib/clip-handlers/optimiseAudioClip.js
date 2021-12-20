import * as ffmpegProcess from '../videoprocessing/ffmpegProcess';
import { fetchFile } from '@ffmpeg/ffmpeg';
import { logProgress } from './setProgress';

const SILENCEDETECT = '[silencedetect @';
const SILENCELOG = 'silencedetect=';
const DURATIONLOG = 'Duration: ';
//Testing function
export const optimiseAudioClip = async (
  ffmpeg,
  video,
  IMPORTFILENAME,
  AUDIOFILENAME,
  CONCATFILENAME,
  FINALAUDIO,
  setClip
) => {
  let silenceLogs = [];
  let duration;

  ffmpeg.setLogger(({ type, message }) => {
    console.log('message :>> ', message);
    if (message.includes(SILENCEDETECT)) {
      silenceLogs.push(message);
    } else if (message.includes(SILENCELOG)) {
      silenceLogs = [];
    } else if (message.includes(DURATIONLOG)) {
      const durationHMS = message.split(DURATIONLOG)[1].split(',')[0];
      duration = ffmpegProcess.convertTimeToSeconds(durationHMS);
    }
  });
  try {
    console.time('optimise clip');
    ffmpeg.FS('writeFile', IMPORTFILENAME, await fetchFile(video));
    // await ffmpeg.run('-i', 'test.mp4', '-ss', '0', '-to', '1', 'out.mp4');
    await ffmpeg.run(
      '-i',
      IMPORTFILENAME,
      '-vn',
      '-acodec',
      'copy',
      AUDIOFILENAME
    );

    await ffmpeg.run(
      '-i',
      AUDIOFILENAME,
      '-af',
      'silencedetect=d=0.8',
      '-f',
      'null',
      '-'
    );
    const audioDuration = duration;
    console.log('duration :>> ', duration);
    console.log('audioDuration :>> ', audioDuration);
    console.log('silenceLogs :>> ', silenceLogs);
    const pauseObjs = ffmpegProcess.getSilencesFromLogs(silenceLogs);
    console.log('pauseObjs :>> ', pauseObjs);
    const audioChunks = ffmpegProcess.getTimestampsNotSilence(
      pauseObjs,
      audioDuration
    );

    console.log('audioChunks :>> ', audioChunks);
    const allChunks = [...pauseObjs, ...audioChunks];

    allChunks.sort((a, b) => a.startTime - b.startTime);
    allChunks.forEach((chunk, i) => (chunk.filename = i));
    console.log('allChunks :>> ', allChunks);

    // cut audio file
    console.time('cut');
    await ffmpegProcess.cutClips(ffmpeg, AUDIOFILENAME, audioChunks, 'aac');
    console.timeEnd('cut');

    const clipNames = audioChunks.map((clip) => clip.filename);
    console.log('clipNames :>> ', clipNames);
    CONCATFILENAME = await ffmpegProcess.buildConcatList(
      ffmpeg,
      clipNames,
      'aac'
    );

    // stitch file
    console.time('concat');
    await ffmpegProcess.concatFiles(ffmpeg, CONCATFILENAME, FINALAUDIO);
    console.timeEnd('concat');

    // send for IBM transcription

    const allFiles = ffmpeg.FS('readdir', '/'); //: list files inside specific path
    console.log('allFiles :>> ', allFiles);
    const data = ffmpeg.FS('readFile', FINALAUDIO);
    console.log('data :>> ', data);

    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'audio/aac' })
    );

    console.timeEnd('optimise clip');
    console.log('url :>> ', url);
    setClip(url);
  } catch (error) {
    console.error(error);
  }
};
