import { HESITATION, PAUSE, WORD } from './timestampTypes';
import { timeStampObj } from './watsonsProcessing';

export const cutClips = async (ffmpeg, filename, clips) => {
  for (var i = 0; i < clips.length; i += 1) {
    const cut = clips[i];
    await ffmpeg.run(
      '-i',
      filename,
      '-ss',
      `${cut.startTime}`,
      '-to',
      `${cut.endTime}`,
      `${cut.filename}.mp4`
    );
  }
  console.log('finish cutting', i);
};

export const concatList = (indices) => {
  const inputPaths = indices.map((i) => `file ${i}.mp4\n`);
  console.log('inputPaths :>> ', inputPaths);
  return inputPaths;
};

export const buildConcatList = async (ffmpeg, clipNames) => {
  const FILENAME = 'concat_list.txt';
  //try catches?
  const inputPaths = clipNames.map((name) => `file ${name}.mp4`);
  console.log('inputPaths :>> ', inputPaths);
  await ffmpeg.FS('writeFile', FILENAME, inputPaths.join('\n'));
  return FILENAME;
};

export const changeSpeedOfClip = (ffmpeg, duration) => {
  // ffmpeg -i input.mkv -filter_complex "[0:v]setpts=<1/x>*PTS[v];[0:a]atempo=<x>[a]" -map "[v]" -map "[a]" output.mkv
  //create new file
  //unlink original file
  //create rename temp file to original name
};
export const changeDurationOfPauses = async (ffmpeg, duration, clips) => {
  for (var i = 0; i < clips.length; i += 1) {
    const clip = clips[i];
    if (clip.type !== PAUSE) {
      continue;
    }
    const originalDuration = clip.value;
    const ogFilename = clip.filename;
    const newName = `${ogFilename}_sped`;
    const x = duration / originalDuration;

    await ffmpeg.run(
      '-i',
      `${ogFilename}.mp4`,
      '-filter_complex',
      `[0:v]setpts=${x}*PTS[v];[0:a]atempo=${1 / x}[a]`,
      '-map',
      '[v]',
      '-map',
      '[a]',
      `${newName}.mp4`
    );
    clip.filename = newName;
    await ffmpeg.FS('unlink', `${ogFilename}.mp4`);
  }
};
export const concatFiles = async (ffmpeg, concatTxt, finalFileName) => {
  await ffmpeg.run(
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    concatTxt,
    finalFileName
  );
};

export const removeFiles = async (ffmpeg, filenames) => {
  for (let i = 0; i < filenames.length; i += 1) {
    await ffmpeg.FS('unlink', `${filenames[i]}.mp4`);
  }
};

export const getSilencesFromLogs = (logs) => {
  const pauses = [];
  for (let i = 0; i < logs.length; i += 2) {
    const startLog = logs[i];
    const endLog = logs[i + 1];

    const start = Number(startLog.split('silence_start: ')[1]);
    const end = Number(endLog.split('silence_end: ')[1].split(' ')[0]);

    const pauseObj = new timeStampObj(PAUSE, end - start, start, end);
    pauses.push(pauseObj);
  }
  return pauses;
};

export const getTimestampsNotSilence = (pauseObjs, duration) => {
  const chunks = [];
  let start = 0;

  for (let i = 0; i < pauseObjs.length; i += 1) {
    const refObj = pauseObjs[i];
    if (refObj.start === start) {
      continue;
    }
    const endTime = refObj.startTime;
    const audioObj = new timeStampObj(WORD, '', start, endTime);
    chunks.push(audioObj);
    start = refObj.endTime;
  }

  const lastPause = pauseObjs[pauseObjs.length - 1];
  if (lastPause.endTime !== duration) {
    const lastChunk = new timeStampObj(WORD, '', start, duration);
    chunks.push(lastChunk);
  }

  return chunks;
  // 0 to first timestamp
  // end of first timestamp to start of second time stamp
  // end of final timestamp in duration
};
// after result is processed, reinsert pauses into transcript data structure
// set index to say which pause chunk this audio chunk is after

// or send chunck at a time from browser to make it easier for addition to pause data structure everytime transcription is finished
// no need to stitch chunks together
// frequent calling of watsons api

export const convertTimeToSeconds = (time) => {
  // [HH:]MM:SS[.m...]
  // 00:00:54.94
  console.log('time :>> ', time);
  const timeArr = time.split(':');
  const [hour, min, s] = timeArr.map((t) => Number(t));
  const totalSeconds = hour * 3600 + min * 60 + s;
  console.log('totalSeconds :>> ', totalSeconds);
  return totalSeconds;
};
