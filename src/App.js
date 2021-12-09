// https://github.com/ffmpegwasm/ffmpeg.wasm/issues/245

import React, { useState, useEffect } from 'react';
import './App.css';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { transcript } from './transcript_2_flac_narrowband';
import * as watsonProcess from './modules/watsonsProcessing';
import * as processTimestamps from './modules/processTimestamps';
import * as ffmpegProcess from './modules/ffmpegProcess';

const fs = require('fs');
const ffmpeg = createFFmpeg({ log: true });
const path = require('path');
function App() {
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState();
  const [gif, setGif] = useState();
  const [clip, setClip] = useState();
  const [image, setImage] = useState();
  const [images, setImages] = useState();
  const [cleanedClip, setCleanedClip] = useState();

  const load = async () => {
    await ffmpeg.load();
    setReady(true);
  };

  useEffect(() => {
    load();
  }, []); // only called once

  const convertToClip = async () => {
    ffmpeg.FS('writeFile', 'test.mp4', await fetchFile(video));
    await ffmpeg.run('-i', 'test.mp4', '-ss', '0', '-to', '1', 'out.mp4');
    // clip 2
    await ffmpeg.run('-i', 'test.mp4', '-ss', '4', '-to', '6', 'out2.mp4');
    console.log('fs:>> ', fs);
    //make list of files to concat
    const inputPaths = ['file out.mp4', 'file out2.mp4'];
    ffmpeg.FS('writeFile', 'concat_list.txt', inputPaths.join('\n'));
    // concat
    await ffmpeg.run(
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      'concat_list.txt',
      'out.mp4'
    );

    // await ffmpeg.run('-i', 'out.mp4', '-i', 'out2.mp4')
    const allFiles = ffmpeg.FS('readdir', '/'); //: list files inside specific path
    console.log('allFiles :>> ', allFiles);
    const data = ffmpeg.FS('readFile', 'out.mp4');
    console.log('data :>> ', data);
    // const data = ffmpeg.FS('readFile', 'out.mp4');
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'image/mp4' })
    );
    setClip(url);
  };

  const cutClips = async (filename, flattenTranscript) => {
    console.log('flattenTranscript in cutclip :>> ', flattenTranscript.length);
    for (var i = 0; i < flattenTranscript.length; i += 1) {
      const cut = flattenTranscript[i];
      console.log('cut :>> ', cut, i);
      await ffmpeg.run(
        '-i',
        filename,
        '-ss',
        `${cut.startTime}`,
        '-to',
        `${cut.endTime}`,
        `${i}.mp4`
      );
    }
    console.log('finish cutting', i);
  };

  const cleanClip = async () => {
    const IMPORTFILENAME = 'test.mp4';
    const FINALFILENAME = 'finalcut.mp4';
    let CONCATFILENAME = '';
    //fetch video
    ffmpeg.FS('writeFile', IMPORTFILENAME, await fetchFile(video));

    const flattenTranscript = watsonProcess.flattenTranscript(transcript);
    //clean transcript
    //remove long silences /speed up
    //remove hesitations
    console.log('flattenTranscript :>> ', flattenTranscript);
    const mergedTranscript =
      processTimestamps.mergeWordsTimeStamps(flattenTranscript);
    console.log('mergedTranscript :>> ', mergedTranscript);
    // cut video according to flattened transcript
    // try to run multiple webworkers to cut concurrently

    // cut only clips that are needed
    console.time('cut');
    await cutClips(IMPORTFILENAME, mergedTranscript);
    console.timeEnd('cut');

    const wordIndices = processTimestamps.extractWordIndices(mergedTranscript);
    console.log('wordIndices :>> ', wordIndices);
    CONCATFILENAME = await ffmpegProcess.buildConcatList(ffmpeg, wordIndices);
    // speed up pauses
    // ffmpeg -i input.mkv -filter_complex "[0:v]setpts=<1/x>*PTS[v];[0:a]atempo=<x>[a]" -map "[v]" -map "[a]" output.mkv

    // reduce pause duration
    console.time('concat');
    await ffmpeg.run(
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      CONCATFILENAME,
      FINALFILENAME
    );
    console.timeEnd('concat');

    const allFiles = ffmpeg.FS('readdir', '/'); //: list files inside specific path
    console.log('allFiles :>> ', allFiles);

    const data = ffmpeg.FS('readFile', FINALFILENAME);
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'image/mp4' })
    );
    setCleanedClip(url);
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
      <button onClick={convertToFrames}>Convert</button>
      <button onClick={convertToGif}>Convert to gif</button>
      <button onClick={convertToClip}>Convert to clip</button>
      <button onClick={cleanClip}>Clean clip</button>

      {gif && <img src={gif} width="500" />}
      {image && <img src={image} width="250" />}
      {images && [...images].map((image) => <img src={image} width="250" />)}
      {clip && <video controls width="250" src={clip}></video>}
      {cleanedClip && <video controls width="250" src={cleanedClip}></video>}
    </div>
  ) : (
    <p>Loading...</p>
  );
}

export default App;
