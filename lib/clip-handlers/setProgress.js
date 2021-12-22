export const logProgress = (ffmpeg) => {
  console.log('in log progress');
  ffmpeg.setProgress((output) => {
    console.log('ratio', output);
  });
};
