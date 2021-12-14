// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import SpeechToTextV1 from 'ibm-watson/speech-to-text/v1.js';
import { IamAuthenticator } from 'ibm-watson/auth/index.js';
import multer from 'multer';
import nextConnect from 'next-connect';

import middleware from '../../middleware/middleware';
import fs from 'fs';

import { transcript } from '../../transcript2';
const params = {
  objectMode: true, // If true, the event handler returns the recognition results exactly as it receives them from the service: as one or more instances of a SpeechRecognitionResults object.
  contentType: 'application/octet-stream',
  // model: 'en-US_Multimedia',
  model: 'en-US_NarrowbandModel',
  // model: 'en-US_BroadbandModel',
  maxAlternatives: 1,
  interimResults: true,
  timestamps: true,
  profanityFilter: true,
  smartFormatting: true,
  speakerLabels: true,
  processingMetrics: false,
  audioMetrics: false,
  endOfPhraseSilenceTime: 0.8, //default: 0.8
  splitTranscriptAtPhraseEnd: true,
  speechDetectorSensitivity: 0.5, //default: 0.5, 1.0 suppresses no audio
  backgroundAudioSuppression: 0.0, //default:0.0, 1.0 suppresses all audio
};

const speechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: process.env.IBM_WATSON_API_KEY,
  }),
  serviceUrl: process.env.IBM_WATSON_URL,
});

const handler = nextConnect();
handler.use(middleware);

handler.post(async (req, res) => {
  try {
    console.time('watsons server');

    console.log(req.body);
    console.log(req.files);

    const { path } = req.files.audio[0];

    //get file send to IBM
    const recognizeStream = speechToText.recognizeUsingWebSocket(params);
    await fs.stat(path, (err, stats) => {
      if (err) {
        console.log('throwing error from getting file stats');
        throw err;
      }
      console.log('stats', stats);
    });

    console.log('recognizeStream before pipe', recognizeStream);

    fs.createReadStream(path).pipe(recognizeStream);
    console.log('aft create read stream');
    console.log('recognizeStream after pipe', recognizeStream);

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
    //   onEvent('Close:', event);
    //   //send data back to be set as a transcript
    //   res.send(transcripts[0]);
    //   console.timeEnd('watsons');
    // });
  } catch (e) {
    console.log('error in watsons', e);
  }
  // console.log('recognizeStream :>> ', recognizeStream);
  // Display events on the console.
  function onEvent(name, event) {
    console.log('event :>> ', event);
    console.log(name, JSON.stringify(event, null, 2));
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
