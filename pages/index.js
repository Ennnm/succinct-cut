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
  Spinner,
  useToast,
  Container,
} from '@chakra-ui/react';

export default function Home() {
  // const { user, username } = useContext(UserContext);
  const ffmpeg = useContext(ffmpegContext);

  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState();
  const [audioUuid, setAudioUuid] = useState();
  const [cleanedClip, setCleanedClip] = useState(false);
  //TODO remove trasncript
  const [transcription, setTranscription] = useState();
  // const [transcription, setTranscription] = useState(transcript.result);
  const ffmpegRatio = useRef(0);
  const [processStage, setProcessStage] = useState([]);
  const [progress, setProgress] = useState(0);
  const [timeTaken, setTimeTaken] = useState([]);
  const [audioAnalysisBegan, setAudioAnalysisBegan] = useState(false);

  const [mergedTranscript, setMergedTranscript] = useState();
  const [cleanedTranscript, setCleanedTranscript] = useState();
  const [message, setMessage] = useState();

  const NORMS = {};

  NORMS[stage.LOADING_VIDEO] = 5;
  NORMS[stage.EXTRACTING_AUDIO] = 5;
  NORMS[stage.EXTRACTED_AUDIO] = 5;
  NORMS[stage.UPLOADING_AUDIO] = 5;
  NORMS[stage.ANALYSING_AUDIO] = 5;
  NORMS[stage.ANALYSED_AUDIO] = 25;
  NORMS[stage.PROCESSING_VIDEO] = 5;
  NORMS[stage.CLEANING_TRANSCRIPT] = 5;
  NORMS[stage.CUTTING_VIDEO] = 5;
  NORMS[stage.SPEEDING_UP_PAUSES] = 16;
  NORMS[stage.PREPARING_TO_STITCH] = 4;
  NORMS[stage.STITCHING_VIDEO] = 5;
  NORMS[stage.CLEARING_MEMORY] = 9;
  NORMS[stage.COMPLETED] = 1;

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

    setProgress((progress) => progress + +NORMS[stage]);
  };

  const load = async () => {
    if (!ffmpeg.isLoaded()) {
      console.log('ffmpeg was not loaded');
      try {
        await ffmpeg.load().then(() => setReady(true));
        // await ffmpeg.setProgress((p) => {
        //   console.log('ratio', p);
        //   // setProgressRatio(p.ratio);
        //   ffmpegRatio.current = p.ratio;
        // });
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
            console.log('result', result);
            console.log('results', results);
            const lastResult = results[results.length-1]
            console.log('lastResult', lastResult);
            console.log('lastResult.alternatives[0]');
            const lastResultTimeStamps = lastResult.alternatives[0].timestamps;
            console.log('lastResultTimeStamps', lastResultTimeStamps);
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
  const [transcriptList, setTranscriptList] = useState();
  const [optimizedList, setOptimizedList] = useState(false);
  const [remainingPercentage, setRemainingPercentage] = useState(100);
  const [transcriptDuration, setTranscriptDuration] = useState();
  useEffect(() => {
    console.log('mergedTranscript', mergedTranscript);
    if (!!mergedTranscript) {
      const tduration = mergedTranscript[mergedTranscript.length - 1].endTime;
      setTranscriptDuration(tduration);
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
          percentage = (duration / tduration) * 100;
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
        percentage = (duration / tduration) * 100;

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
          percentage = (duration / tduration) * 100;
          setRemainingPercentage(
            (remainingPercentage) => remainingPercentage - percentage
          );

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
            percentage = (duration / tduration) * 100;
            break;
          case 'WORD':
            tType = t.value;
            duration = t.endTime - t.startTime;
            percentage = (duration / tduration) * 100;
            break;
          default:
            tType = `[ ${t.type.substring(1)} ]`;
            break;
        }

        setRemainingPercentage(
          (remainingPercentage) => remainingPercentage - percentage
        );
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
                {video &&
                  (processStage.length > 1 && cleanedClip ? (
                    <video
                      controls
                      className={styles.video}
                      src={cleanedClip}
                    ></video>
                  ) : (
                    <Spinner
                      thickness="4px"
                      speed="0.65s"
                      emptyColor="gray.200"
                      color="blue.500"
                      size="xl"
                    />
                  ))}
              </div>
            </div>
            <div className={styles.grid}>
              <div className={styles.minicard}>
                <HStack width="100%" border="0.5px solid" spacing={0}>
                  {transcriptList}
                </HStack>
              </div>
              <div className={styles.minicard}>
                <HStack width="100vw" border="0.5px solid" spacing={0}>
                  {optimizedList ? (
                    <>
                      {optimizedList}
                      <Tooltip
                        hasArrow
                        label={`Potential Time Savings = ${Math.abs(
                          Math.round(remainingPercentage)
                        )}% | ${Math.abs(
                          Math.round(
                            (remainingPercentage / 100) * transcriptDuration
                          )
                        )}s`}
                      >
                        <Flex
                          width={`${Math.abs(remainingPercentage)}%`}
                          height="20px"
                          bgColor="white"
                        >
                          {' '}
                        </Flex>
                      </Tooltip>
                    </>
                  ) : null}
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
              <Button variant="ghost" onClick={onBrowseBtnClick}>
                Browse ...
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  extractAudioClip(
                    ffmpeg,
                    video,
                    FINALAUDIO,
                    setAudioUuid,
                    timeStampAtStage
                  );
                  // setProcessStage([]);
                  setTimeTaken([]);
                  setAudioAnalysisBegan(true);
                }}
                isDisabled={!video || processStage.length > 0}
              >
                Analyse Video
              </Button>

              <Button
                variant="ghost"
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
                isDisabled={!transcription || !video}
              >
                Clean Video
              </Button>
              <Button
                variant="ghost"
                onClick={onDownloadClick}
                isDisabled={!cleanedClip}
              >
                Download
              </Button>
              <a
                ref={downloadAnchor}
                href={cleanedClip}
                download={'result.mp4'}
                style={{ display: 'none' }}
              >
                Click to download
              </a>
            </div>
            <Flex direction="column" justify="center" align="center">
              <Progress
                height="20px"
                w="90vw"
                hasStripe
                isAnimated
                value={progress}
              >
                <ProgressLabel fontSize="1rem" color="black">
                  {`${progress}%`}
                </ProgressLabel>
              </Progress>
              <Container textAlign="center">
                {
                  processStage.length > 0 &&
                    timeTaken.length > 0 &&
                    `${processStage.at(-1)} | Time taken: ${(
                      (timeTaken.at(-1) - timeTaken.at(0)) /
                      1000 /
                      60
                    ).toFixed(2)} min`
                  // && processStage.map((stage, i) => (
                  //   <span key={i}>
                  //     {stage}: {calcTimeTakenPerStage()[i]}
                  //   </span>
                  // ))
                }
              </Container>
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
