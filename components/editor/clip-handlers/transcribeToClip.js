import axios from 'axios';

// Fetch data at buildtime
const FormData = require('form-data');

export const getStaticProps = async () => {};

// Fetch data on request
export const getServerSideProps = async () => {};

export const transcribeClip = async (ffmpeg, audiofilename) => {
  const data = ffmpeg.FS('readFile', audiofilename);
  console.log('data :>> ', data);

  const formData = new FormData();
  const blob = new Blob([data.buffer], { type: 'audio/aac' });
  console.log('blob :>> ', blob);
  formData.append('audio', blob, audiofilename);
  // form.append('audioFile', file, 'audio.aac')
  axios.post('/api/watsons', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  //uint8Array
  //make an axios post to watsons with data as formdata

  //file data from form has filename, last modified, size...

  // get file from ffmpeg
  // send to api?

  //call watsons in api folder
  // TODO: make call to IBM watsons
  //send request to backend
  //ask backend for key
  // const params = watsonsParams.hesitations;
  // const recognizeStream = speechToText.recognizeUsingWebSocket(params);
  // fs.createReadStream(PROCESSEDAUDIOFN).pipe(recognizeStream);
  // const transcripts = [];
  // recognizeStream.on('data', function (event) {
  //   onEvent('Data:', event);
  //   transcripts.push(event);
  // });
  // recognizeStream.on('error', function (event) {
  //   onEvent('Error:', event);
  // });
  // recognizeStream.on('close', function (event) {
  //   fs.writeFile(
  //     './transcript2.json',
  //     JSON.stringify(transcripts),
  //     (err) => {}
  //   );
  //   console.timeEnd();
  //   onEvent('Close:', event);
  // });
  // // console.log('recognizeStream :>> ', recognizeStream);
  // // Display events on the console.
  // function onEvent(name, event) {
  //   console.log('event :>> ', event);
  //   console.log(name, JSON.stringify(event, null, 2));
  // }
};
