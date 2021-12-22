import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useEffect, useState, useRef, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { cleanClip } from '../lib/clip-handlers/cleanClip';
import { extractAudioClip } from '../lib/clip-handlers/extractAudioClip';
import * as stage from '../lib/clip-handlers/stage-constants';
import * as ffmpegProcess from '../lib/videoprocessing/ffmpegProcess';

import { Loader } from '../components/Loader';
import { ffmpegContext, UserContext } from '../lib/context';
// import { transcript } from '../lib/videoprocessing/transcript_en.js';
import { transcript } from '../lib/videoprocessing/transcript_2_flac_narrowband';
// ============FIREBASE=============
import { doc, deleteDoc, onSnapshot } from 'firebase/firestore';
//import needed to get firebase initiated
import { firestore, auth } from '../lib/firebase';

// ============FIREBASE=============

export default function Home() {
  // const { user, username } = useContext(UserContext);
  const ffmpeg = useContext(ffmpegContext);

  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState();
  const [audioUuid, setAudioUuid] = useState();
  const [cleanedClip, setCleanedClip] = useState();
  //TODO remove trasncript
  const [transcription, setTranscription] = useState(transcript);
  const ffmpegRatio = useRef(0);
  const [processStage, setProcessStage] = useState([]);
  const [timeTaken, setTimeTaken] = useState([]);
  const [audioAnalysisBegan, setAudioAnalysisBegan] = useState(false);
  let user = auth.currentUser;

  const FINALAUDIO = 'finalAudio.aac';
  const PROCESSEDAUDIOFN = 'finalcut.mp4';

  const inputFile = useRef(null);
  const downloadAnchor = useRef(null);

  const timeStampAtStage = (stage) => {
    const currTime = Math.round(+new Date());
    // can be combined
    setTimeTaken([...timeTaken, currTime]);
    setProcessStage([...processStage, stage]);
  };

  const load = async () => {
    if (!ffmpeg.isLoaded()) {
      console.log('ffmpeg was not loaded');
      try {
        await ffmpeg.load().then(() => setReady(true));
        await ffmpeg.setProgress((p) => {
          console.log('ratio', p);
          // setProgressRatio(p.ratio);
          ffmpegRatio.current = p.ratio;
        });
      } catch (e) {
        console.log('error loading ffmpeg', e);
        location.reload();
      }
    } else {
      console.log('ffmpeg loaded');
      setReady(true);
    }
  };

  useEffect(() => {
    load();
  }, []); // only called once

  useEffect(() => {
    //check auth for user
    if (user !== null && audioUuid !== null && audioAnalysisBegan) {
      const userUid = user.uid;
      console.log('userUid', userUid);
      //listen for transcript
      const unsub = onSnapshot(
        doc(firestore, 'users', userUid, 'transcript', audioUuid),
        (doc) => {
          if (doc.data() !== undefined && 'response' in doc.data()) {
            console.log('currentdata:', JSON.parse(doc.data().response));
            setTranscription(JSON.parse(doc.data().response).result);
            timeStampAtStage(stage.ANALYSED_AUDIO);
          }
        }
      );

      // deleting transcript takes time
      const deleteStatus = deleteDoc(
        doc(firestore, 'users', userUid, 'transcript', audioUuid)
      );
    } else {
      console.log('no user logged in, please log in');
    }
  }, [audioUuid]);

  const onBrowseBtnClick = () => {
    inputFile.current.click();
  };

  const onDownloadClick = () => {
    downloadAnchor.current.click();
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>SuccinctCut</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {user === null && <h3>Please log in</h3>}
        {/* to revert back after fixing google signin issue */}
        {ready ? (
          // {ready && user !== null ? (
          <>
            <div className={styles.grid}>
              <div className={styles.card}>
                {video && (
                  <video
                    className={styles.video}
                    controls
                    src={URL.createObjectURL(video)}
                  ></video>
                )}
              </div>
              <div className={styles.card}>
                {cleanedClip && (
                  <video
                    controls
                    className={styles.video}
                    src={cleanedClip}
                  ></video>
                )}
              </div>
            </div>
            <div className={styles.grid}>
              <input
                type="file"
                accept='.mp4'
                ref={inputFile}
                style={{ display: 'none' }}
                onChange={(e) => {
                  setVideo(e.target.files?.item(0));
                  //create new uuid for audio filename to be saved
                  // setAudioUuid(uuidv4());
                  console.log(
                    'e.target.files?.item(0) :>> ',
                    e.target.files?.item(0)
                  );
                  ffmpegProcess.removeAllFiles(ffmpeg);
                }}
              />
              <button className={styles.button} onClick={onBrowseBtnClick}>
                Browse ...
              </button>

              <button
                className={styles.button}
                onClick={() => {
                  extractAudioClip(
                    ffmpeg,
                    video,
                    FINALAUDIO,
                    setAudioUuid,
                    timeStampAtStage
                  );
                  setProcessStage([]);
                  setTimeTaken([]);
                  setAudioAnalysisBegan(true);
                }}
                disabled={!video}
              >
                Analyse Video
              </button>

              <button
                className={styles.button}
                onClick={() => {
                  cleanClip(
                    transcription,
                    ffmpeg,
                    video,
                    PROCESSEDAUDIOFN,
                    setCleanedClip,
                    timeStampAtStage
                  );
                }}
                disabled={!transcription || !video}
              >
                Clean Video
              </button>
              <button
                className={styles.button}
                onClick={onDownloadClick}
                disabled={!cleanedClip}
              >
                Download
              </button>
              <a
                ref={downloadAnchor}
                href={cleanedClip}
                download={'result.mp4'}
                style={{ display: 'none' }}
              >
                Click to download
              </a>
            </div>
            {processStage.length > 0 && (
              <>
                <h3>{processStage.at(-1)}:</h3>
                <h3>Time taken: {timeTaken.at(-1) - timeTaken.at(0)} ms</h3>
              </>
            )}
            {transcription && <p>{JSON.stringify(transcription)}</p>}
          </>
        ) : (
          <Loader show={true} />
        )}
      </main>
    </div>
  );
}
