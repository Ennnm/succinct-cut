export const concatList = (indices) => {
  const inputPaths = indices.map((i) => `file ${i}.mp4\n`);
  return inputPaths;
};

export const buildConcatList = async (ffmpeg, indices) => {
  const FILENAME = 'concat_list.txt';
  //try catches?
  const inputPaths = indices.map((i) => `file ${i}.mp4\n`);

  await ffmpeg.FS('writeFile', FILENAME, inputPaths.join(''));
  return FILENAME;
};

export const changeSpeedOfClip = () => {};
