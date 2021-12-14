
import 'dotenv/config';
// import {IamAuthenticator} from
// import { SpeechToTextV1 } from 'ibm-watson/speech-to-text/v1.js';

export const video = {
  objectMode: true, // If true, the event handler returns the recognition results exactly as it receives them from the service: as one or more instances of a SpeechRecognitionResults object.
  contentType: 'application/octet-stream',
  model: 'en-US_Multimedia',
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

export const hesitations = {
  objectMode: true, // If true, the event handler returns the recognition results exactly as it receives them from the service: as one or more instances of a SpeechRecognitionResults object.
  contentType: 'application/octet-stream',
  model: 'en-US_NarrowbandModel',
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

