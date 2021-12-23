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
// import { transcript } from '../refTranscriptData/transcript_en.js';
// import { transcript } from '../refTranscriptData/transcript_2_flac_narrowband';
// import { transcript } from '../refTranscriptData/cxTranscripts5min';
// import { transcript } from '../refTranscriptData/cxTranscripts2min';
import { transcript } from '../refTranscriptData/cxTranscripts1min';
// ============FIREBASE=============
import { doc, deleteDoc, onSnapshot } from 'firebase/firestore';
//import needed to get firebase initiated
import { firestore, auth } from '../lib/firebase';

// ============FIREBASE=============

import {
  Progress,
  ProgressLabel,
  Button,
  Flex,
  HStack,
  Tooltip,
  Spinner
} from '@chakra-ui/react';

export default function Home() {
  // const { user, username } = useContext(UserContext);
  const ffmpeg = useContext(ffmpegContext);

  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState();
  const [audioUuid, setAudioUuid] = useState();
  const [cleanedClip, setCleanedClip] = useState(false);
  //TODO remove trasncript
  const [transcription, setTranscription] = useState(transcript.result);
  const ffmpegRatio = useRef(0);
  const [processStage, setProcessStage] = useState([]);
  const [progress, setProgress] = useState(0);
  const [timeTaken, setTimeTaken] = useState([]);
  const [audioAnalysisBegan, setAudioAnalysisBegan] = useState(false);

  const [mergedTranscript, setMergedTranscript] = useState();
  const [cleanedTranscript, setCleanedTranscript] = useState();
  const [message, setMessage] = useState();

  const NORMS = {
    'Loading video': 5,
    'Extracting audio': 5,
    'Extracted audio': 5,
    'Uploading audio': 5,
    'Analysing audio': 5,
    'Analysed audio': 25,
    'Processing video': 5,
    'Cleaning transcript': 5,
    'Cutting video': 5,
    'Speeding up pauses': 16,
    'Preparing to stitch': 4,
    'Stitching video': 5,
    'Clearing memory': 9,
    Completed: 1,
  };
  let user = auth.currentUser;

  const FINALAUDIO = 'finalAudio.aac';
  const PROCESSEDAUDIOFN = 'finalcut.mp4';

  const inputFile = useRef(null);
  const downloadAnchor = useRef(null);

  const timeStampAtStage = (stage) => {
    const currTime = Math.round(+new Date());
    // can be combined
    timeTaken.push(currTime);
    processStage.push(stage);
    setTimeTaken(timeTaken);
    setProcessStage(processStage);
    setProgress(progress + +NORMS[stage]);
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
            const { result } = JSON.parse(doc.data().response);
            setTranscription(result);
            timeStampAtStage(stage.ANALYSED_AUDIO);
            const { results } = result;
            const lastResultTimeStamps = results[results.length - 1].timeStamps;
            const lastTime =
              lastResultTimeStamps[lastResultTimeStamps.length - 1][2];
            setTranscriptDuration(lastTime);
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

  const fileSizeInMb = (file) => {
    const fileSize = (file.size / (1024 * 1024)).toFixed(4);
    return fileSize;
  };
  const getFileExtension = (file) => {
    const re = /(?:\.([^.]+))?$/;
    const fileExt = re.exec(file.name)[1];
    return fileExt;
  };
  const calcTimeTakenPerStage = () => {
    const durations = [];
    for (let i = 1; i < timeTaken.length; i += 1) {
      durations.push(timeTaken[i] - timeTaken[i - 1]);
    }
    return durations;
  };
  const [ transcriptList, setTranscriptList ] = useState();
  const [ optimizedList, setOptimizedList ] = useState( false );
  const [ remainingPercentage, setRemainingPercentage ] = useState(100);
  const [ transcriptDuration, setTranscriptDuration] = useState();
  useEffect(() => {
    console.log('mergedTranscript', mergedTranscript);
    if (!!mergedTranscript) {
      const transcriptDura =
        mergedTranscript[mergedTranscript.length - 1].endTime;
      setTranscriptDuration(transcriptDura);
      const colorMap = {
        WORD: 'green',
        '%PAUSE': 'yellow',
        '%HESITATION': 'orange',
        BREAK: 'gray',
      };

      let memoPrevEnd = 0;

      const tList = mergedTranscript.map((t) => {
        let percentage, tType, duration, intermediate;
        if (memoPrevEnd - t.startTime != 0) {
          // implies there's a break
          duration = t.startTime - memoPrevEnd;
          percentage = (duration / transcriptDura) * 100;
          tType = '[ BREAK ]';

          intermediate = (
            <Tooltip hasArrow label={`${tType}`}>
              <Flex
                height="20px"
                width={`${percentage}%`}
                bgColor={colorMap['BREAK']}
              >
                {' '}
              </Flex>
            </Tooltip>
          );

          memoPrevEnd = t.endTime;
        }

        duration = t.endTime - t.startTime;
        percentage = (duration / transcriptDura) * 100;

        switch (t.type) {
          case '%HESITATION':
            tType = '[ HESITATION ]';
            break;
          case '%PAUSE':
            tType = '[ PAUSE ]';
            break;
          case 'WORD':
            tType = t.value;
            break;
          default:
            tType = `[ ${t.type.substring(1)} ]`;
            break;
        }

        return (
          <>
            {intermediate}
            <Tooltip hasArrow label={tType}>
              <Flex
                height="20px"
                width={`${percentage}%`}
                bgColor={colorMap[t.type]}
              >
                {' '}
              </Flex>
            </Tooltip>
          </>
        );
      });

      setTranscriptList(tList);

      let memoPrevEnd2 = 0;

      const oList = mergedTranscript.map((t) => {
        let percentage, tType, duration, intermediate;
        if (memoPrevEnd2 - t.startTime != 0) {
          // implies there's a break
          duration = t.startTime - memoPrevEnd2;
          if (duration > 0.8) {
            duration = 0.8;
          }
          percentage = (duration / transcriptDura) * 100;
          setRemainingPercentage(remainingPercentage - percentage);

          tType = '[ BREAK ]';

          intermediate = (
            <Tooltip hasArrow label={`${tType}`}>
              <Flex
                height="20px"
                width={`${percentage}%`}
                bgColor={colorMap['BREAK']}
              >
                {' '}
              </Flex>
            </Tooltip>
          );

          memoPrevEnd2 = t.endTime;
        }

        switch (t.type) {
          case '%HESITATION':
            return <>{intermediate}</>;
          case '%PAUSE':
            tType = '[ PAUSE ]';
            duration = t.endTime - t.startTime;
            if (duration > 0.8) {
              duration = 0.8;
            }
            percentage = (duration / transcriptDuration) * 100;
            break;
          case 'WORD':
            tType = t.value;
            duration = t.endTime - t.startTime;
            percentage = (duration / transcriptDuration) * 100;
            break;
          default:
            tType = `[ ${t.type.substring(1)} ]`;
            break;
        }

        setRemainingPercentage(remainingPercentage - percentage);
        memoPrevEnd2 = t.endTime;

        return (
          <>
            {intermediate}
            <Tooltip hasArrow label={tType}>
              <Flex
                height="20px"
                width={`${percentage}%`}
                bgColor={colorMap[t.type]}
              >
                {' '}
              </Flex>
            </Tooltip>
          </>
        );
      });

      setOptimizedList(oList);
    }
  }, [mergedTranscript]);

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
        {/* {ready ? ( */}
        {ready && user !== null ? (
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
                {message && <div>{message}</div>}
              </div>
              <div className={styles.card}>
                { video && (
                  cleanedClip ?
                    <video
                      controls
                      className={styles.video}
                      src={cleanedClip}
                    ></video> :
                    <Spinner
                      thickness='4px'
                      speed='0.65s'
                      emptyColor='gray.200'
                      color='blue.500'
                      size='xl'
                    />
                  )
                }
              </div>
            </div>
            <div className={styles.grid}>
              <div className={styles.minicard}>
                <HStack width="100%" border="1px solid" spacing={0}>
                  {transcriptList}
                </HStack>
              </div>
              <div className={styles.minicard}>
                <HStack width="100vw" border="1px solid" spacing={0}>
                  { optimizedList }
                  <Tooltip
                    hasArrow
                    label={`Time Savings = ${Math.round(
                      remainingPercentage
                    )}% | ${Math.round(
                      (remainingPercentage / 100) * transcriptDuration
                    )}s`}
                  >
                    <Flex
                      width={`${remainingPercentage}%`}
                      height="20px"
                      bgColor="white"
                    >
                      {' '}
                    </Flex>
                  </Tooltip>
                </HStack>
              </div>
            </div>
            <div className={styles.grid}>
              <input
                type="file"
                accept=".mp4"
                ref={inputFile}
                style={{ display: 'none' }}
                onChange={(e) => {
                  const fileUpload = e.target.files?.item(0);
                  if (
                    fileUpload &&
                    fileSizeInMb(fileUpload) < 100 &&
                    getFileExtension(fileUpload) === 'mp4'
                  ) {
                    setVideo(fileUpload);
                    setMessage();
                  } else {
                    setMessage('Choose a mp4 file that is <100 MB');
                  }
                  //create new uuid for audio filename to be saved
                  console.log('fileUpload', fileUpload);
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
                    timeStampAtStage,
                    setMergedTranscript,
                    setCleanedTranscript,
                    setTranscriptDuration
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
            <Flex>
              <Progress h={4} w="90vw" hasStripe isAnimated value={progress}>
                <ProgressLabel color="black">
                  {' '}
                  {processStage.length > 0 &&
                    timeTaken.length > 0 &&
                    `${processStage.at(-1)} | Time taken: ${
                      timeTaken.at(-1) - timeTaken.at(0)
                    } ms` &&
                    processStage.map((stage, i) => (
                      <span key={i}>
                        {stage}: {calcTimeTakenPerStage()[i]}
                      </span>
                    ))}{' '}
                </ProgressLabel>
              </Progress>
            </Flex>
            {transcription && <p>{JSON.stringify(transcription)}</p>}
          </>
        ) : (
          <Loader show={true} />
        )}
      </main>
    </div>
  );
}
