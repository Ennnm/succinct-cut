// https://github.com/ffmpegwasm/ffmpeg.wasm/issues/245

import React, { useState, useEffect } from 'react';
import './App.css';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { transcript } from './transcript_2_flac_narrowband';
import * as watsonProcess from './modules/watsonsProcessing';
import * as processTimestamps from './modules/processTimestamps';
import * as ffmpegProcess from './modules/ffmpegProcess';
import * as watsonsParams from './modules/watsonsParams.js';
import { HESITATION, PAUSE, WORD } from './modules/timestampTypes';


require('dotenv').config();

//TODO get api key working
const SILENCEDETECT = '[silencedetect @';
const SILENCELOG = 'silencedetect=';
const DURATIONLOG = 'Duration: ';

let silenceLogs = [];
let duration;
const fs = require('fs');
const ffmpeg = createFFmpeg({
  log: true,
  logger: (message) => {
    if (message.message.includes(SILENCEDETECT)) {
      silenceLogs.push(message.message);
    } else if (message.message.includes(SILENCELOG)) {
      silenceLogs = [];
    } else if (message.message.includes(DURATIONLOG)) {
      const durationHMS = message.message.split(DURATIONLOG)[1].split(',')[0];
      duration = ffmpegProcess.convertTimeToSeconds(durationHMS);
    }
  },
});

function App() {
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState();
  const [gif, setGif] = useState();
  const [clip, setClip] = useState();
  const [images, setImages] = useState();
  const [cleanedClip, setCleanedClip] = useState();
  const [transcription, setTranscription] = useState();

  const IMPORTFILENAME = 'test.mp4';
  const AUDIOFILENAME = 'test.aac';
  const SILENCESFILENAME = 'silence.txt';
  const PROCESSEDAUDIOFN = 'finalcut.mp4';
  let CONCATFILENAME = '';

  const load = async () => {
    await ffmpeg.load();
    setReady(true);
  };

  useEffect(() => {
    load();
  }, []); // only called once

  const convertToClip = async (ffmpeg, videoFileName) => {
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
    // await ffmpeg.run('-i shennan_video.mp4 -af silencedetect=d=0.8 -f null - ');
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
    await ffmpegProcess.cutClips(ffmpeg, AUDIOFILENAME, audioChunks);
    console.timeEnd('cut');

    const clipNames = audioChunks.map((clip) => clip.filename);
    console.log('clipNames :>> ', clipNames);
    CONCATFILENAME = await ffmpegProcess.buildConcatList(ffmpeg, clipNames);

    // stitch file
    console.time('concat');
    await ffmpegProcess.concatFiles(ffmpeg, CONCATFILENAME, PROCESSEDAUDIOFN);
    console.timeEnd('concat');

    // send for IBM transcription

    const allFiles = ffmpeg.FS('readdir', '/'); //: list files inside specific path
    console.log('allFiles :>> ', allFiles);
    const data = ffmpeg.FS('readFile', PROCESSEDAUDIOFN);
    console.log('data :>> ', data);

    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'audio/aac' })
    );
    console.log('url :>> ', url);
    setClip(url);
  };

  const transcribeClip = async () => {
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
  const cleanClip = async () => {
    console.time('clean');
    //fetch video
    ffmpeg.FS('writeFile', IMPORTFILENAME, await fetchFile(video));

    //clean transcript
    const flattenTranscript = watsonProcess.flattenTranscript(transcript);
    console.log('flattenTranscript :>> ', flattenTranscript);
    const mergedTranscript =
      processTimestamps.mergeWordsTimeStamps(flattenTranscript);

    mergedTranscript.forEach((clip, i) => (clip.filename = i));
    console.log('mergedTranscript :>> ', mergedTranscript);

    const wordsAndPauses = mergedTranscript.filter(
      (clip) => clip.type !== HESITATION
    );
    console.log('wordsAndPauses :>> ', wordsAndPauses);

    // try to run multiple webworkers to cut concurrently
    // cut only clips that are needed
    console.time('cut');
    await ffmpegProcess.cutClips(ffmpeg, IMPORTFILENAME, wordsAndPauses);
    console.timeEnd('cut');

    // modify duration of pauses
    console.time('speed');
    await ffmpegProcess.changeDurationOfPauses(ffmpeg, 0.8, wordsAndPauses);
    console.timeEnd('speed');

    const clipNames = wordsAndPauses.map((clip) => clip.filename);
    console.log('clipNames :>> ', clipNames);
    CONCATFILENAME = await ffmpegProcess.buildConcatList(ffmpeg, clipNames);

    console.time('concat');
    await ffmpegProcess.concatFiles(ffmpeg, CONCATFILENAME, PROCESSEDAUDIOFN);
    console.timeEnd('concat');

    await ffmpegProcess.removeFiles(ffmpeg, clipNames);
    const allFiles = ffmpeg.FS('readdir', '/'); //: list files inside specific path
    console.log('allFiles :>> ', allFiles);
    // unlink files
    const data = ffmpeg.FS('readFile', PROCESSEDAUDIOFN);
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'image/mp4' })
    );
    setCleanedClip(url);
    console.timeEnd('clean');
  };
  const convertToGif = async () => {
    ffmpeg.FS('writeFile', 'test.mp4', await fetchFile(video));

    await ffmpeg.run(
      '-i',
      'test.mp4',
      '-t',
      '10',
      '-ss',
      '0.0',
      '-f',
      'gif',
      'out.gif'
    );

    const data = ffmpeg.FS('readFile', 'out.gif');
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'image/gif' })
    );
    setGif(url);
  };

  const convertToFrames = async () => {
    ffmpeg.FS('writeFile', 'test.mp4', await fetchFile(video));

    await ffmpeg.run('-i', 'test.mp4', '-vsync', '0', 'output%0d.png');
    // await ffmpeg.run('-i', 'test.mp4', '-t', `${endTime}`, '-ss', `${startTime}`, '-vf', 'fps="30"', 'output%0d.png');
    // await ffmpeg.run('-i', 'test.mp4', '-t', `${endTime}`, '-ss', `${startTime}`, '-vsync', '0', 'output%0d.png');

    var listOfUrls = [];
    for (var i = 1; i <= 60 * 20000; ++i) {
      try {
        const data = ffmpeg.FS('readFile', `output${i}.png`);
        const url = URL.createObjectURL(
          new Blob([data.buffer], { type: 'image/png' })
        );
        listOfUrls = [...listOfUrls, url];
      } catch (e) {
        break;
      }
    }
    setImages(listOfUrls);
  };

  return ready ? (
    <div className="App">
      {video && (
        <video controls width="250" src={URL.createObjectURL(video)}></video>
      )}

      <input
        type="file"
        onChange={(e) => {
          setVideo(e.target.files?.item(0));
        }}
      />

      <h3>Result</h3>
      {/* <button onClick={convertToFrames}>Convert</button> */}
      {/* <button onClick={convertToGif}>Convert to gif</button> */}
      <button onClick={convertToClip}>Convert to clip</button>
      {clip && <button onClick={transcribeClip}>Transcribe</button>}
      <button onClick={cleanClip}>Clean clip</button>

      {/* {gif && <img src={gif} width="500" />}
      {image && <img src={image} width="250" />}
      {images && [...images].map((image) => <img src={image} width="250" />)} */}
      {clip && <video controls width="250" src={clip}></video>}
      {transcription && <p>{JSON.stringify(transcription)}</p>}
      {cleanedClip && <video controls width="250" src={cleanedClip}></video>}
    </div>
  ) : (
    <p>Loading...</p>
  );
}

export default App;
