export const logProgress = (ffmpeg) => {
  console.log('in log progress');
  ffmpeg.setProgress(({ ratio }) => {
    console.log('ratio', ratio);
  });
};
