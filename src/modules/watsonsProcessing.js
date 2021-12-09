import { HESITATION, PAUSE, WORD } from './timestampTypes';

export const getResults = (transcript) => {
  return transcript.results;
};

export const getTimeStamps = (transcript) => {
  const results = getResults(transcript);
  const wordTimeStamps = results.map(
    (result) => result.alternatives[0].timestamps
  );

  return wordTimeStamps;
};

export const getLongPauses = (timestamps) => {
  const timestampPauses = [];

  for (var i = 0; i < timestamps.length - 1; i += 1) {
    const pauseBlock = [];
    //last time of first timestamp block
    const priorBlock = timestamps[i];
    const priorLastTimeStamp = priorBlock[priorBlock.length - 1][2];
    //first time of last timestamp block
    const afterBlock = timestamps[i + 1];
    const afterFirstTimeStamp = afterBlock[0][1];

    timestampPauses.push([priorLastTimeStamp, afterFirstTimeStamp]);
  }
  return timestampPauses;
};

export const getHesitations = (timestamps) => {
  const hesitations = [];
  timestamps.forEach((block) => {
    block.forEach((timeStamp) => {
      if (timeStamp[0] === HESITATION) {
        hesitations.push([timeStamp[1], timeStamp[2]]);
      }
    });
  });
  return hesitations;
};
export const getWordsTimeStamps = (timestamps) => {
  const words = [];
  timestamps.forEach((block) => {
    block.forEach((timeStamp) => {
      if (timeStamp[0] !== HESITATION) {
        words.push([timeStamp[1], timeStamp[2], timeStamp[0]]);
      }
    });
  });
  return words;
};

function timeStampObj(value, startTime, endTime) {
  this.value = value;
  this.startTime = startTime;
  this.endTime = endTime;
}

const convertToTimeStampObjs = (timestampsArr) => {
  return timestampsArr.map((ts) => new timeStampObj(ts[0], ts[1], ts[2]));
};

export const flattenTranscript = (transcript) => {
  const timestamps = getTimeStamps(transcript);
  const timestampObjs = [];
  //handle hesitations
  for (var i = 0; i < timestamps.length - 1; i += 1) {
    //last time of first timestamp block
    const priorBlock = timestamps[i];
    const priorLastTimeStamp = priorBlock[priorBlock.length - 1][2];
    //first time of last timestamp block
    const afterBlock = timestamps[i + 1];
    const afterFirstTimeStamp = afterBlock[0][1];

    const pauseObj = new timeStampObj(
      PAUSE,
      priorLastTimeStamp,
      afterFirstTimeStamp
    );
    timestampObjs.push(...convertToTimeStampObjs(priorBlock), pauseObj);
    // timestampObjs.push(...convertToTimeStampObjs(priorBlock));
    // timestampPauses.push([priorLastTimeStamp, afterFirstTimeStamp]);
  }
  timestampObjs.push(
    ...convertToTimeStampObjs(timestamps[timestamps.length - 1])
  );
  return timestampObjs;
};
