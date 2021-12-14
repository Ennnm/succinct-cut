// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import SpeechToTextV1 from 'ibm-watson/speech-to-text/v1.js';
import { IamAuthenticator } from 'ibm-watson/auth/index.js';
import multer from 'multer';
import nextConnect from 'next-connect';
// app.use(express.static('build'));
// const ffmpeg = createFFmpeg({ log: true });

// const speechToText = new SpeechToTextV1({
//   authenticator: new IamAuthenticator({
//     apikey: process.env.IBM_WATSON_API_KEY,
//   }),
//   serviceUrl:
//     'https://api.au-syd.speech-to-text.watson.cloud.ibm.com/instances/718a50c5-072d-4804-9bf3-d26662ba6e50',
// });

const params = {
  objectMode: true, // If true, the event handler returns the recognition results exactly as it receives them from the service: as one or more instances of a SpeechRecognitionResults object.
  contentType: 'application/octet-stream',
  // model: 'en-US_Multimedia',
  model: 'en-US_NarrowbandModel',
  // model: 'en-US_BroadbandModel',
  maxAlternatives: 1,
  interimResults: false,
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
const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
});

// const apiRoute = nextConnect({
//   onError(error, req, res) {
//     res
//       .status(501)
//       .json({ error: `Sorry something Happened! ${error.message}` });
//   },
//   onNoMatch(req, res) {
//     res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
//   },
// });

// apiRoute.use(upload.single('theFile'));

// apiRoute.post((req, res) => {
//   res.status(200).send('posted!');
//   // res.status(200).json({ data: 'success' });
// });
// apiRoute.get((req, res) => {
//   res.status(200).send('get get');
// });

// export default apiRoute;

// export const config = {
//   api: {
//     bodyParser: false, // Disallow body parsing, consume as stream
//   },
// };

// export default function handler(req, res) {
//   const { method } = req;

//   if (method === 'GET') {
//     // send video through request
//     // const recognizeStream = speechToText.recognizeUsingWebSocket(params);
//     return res.status(200);
//   }

//   if (method === 'POST') {
//     console.log('received post request');
//     console.log('req.body :>> ', req.body);

//     //use multer to reaasemble body
//     return res.status(200).send(req.body);
//   }

//   res.status(200).json({ name: 'John Doe' });
// }

// export default apiRoute;
import middleware from '../../middleware/middleware';
import fs from 'fs';
// import nextConnect from 'next-connect';

const handler = nextConnect();
handler.use(middleware);

handler.post(async (req, res) => {
  console.log(req.body);
  console.log(req.files);
  console.log(req.files.audio);
  // res.statusCode(200).send(req.files[0]);
  // fs.writeFile('public/uploads/audio.aac', req.files.audio, (err) => {
  //   console.log('error', err);
  // });
  //...

  //get file send to IBM
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
