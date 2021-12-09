import { HESITATION, PAUSE, WORD } from './timestampTypes';

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
