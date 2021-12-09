import { HESITATION, PAUSE, WORD } from './timestampTypes';

const getTimestampType = (obj) => {
  if (!(obj.value === HESITATION || obj.value === PAUSE)) {
    return WORD;
  }
  return obj.value;
};
export const mergeWordsTimeStamps = (flattenTranscript) => {
  const timestampObjs = [];

  let flag = '';
  for (var i = 0; i < flattenTranscript.length; i += 1) {
    const refObj = flattenTranscript[i];

    flag = getTimestampType(refObj);
    for (var j = i + 1; j < flattenTranscript.length; j += 1) {
      const nextObj = flattenTranscript[j];
      let nextType = getTimestampType(nextObj);

      if (nextType === flag) {
        //update last item of the list
        refObj.endTime = nextObj.endTime;
        if (nextType === WORD) {
          refObj.value += ` ${nextObj.value}`;
        }
      } else {
        timestampObjs.push(refObj);
        // if flag not same as previous, update i
        i = j - 1;
        break;
      }
    }
  }
  return timestampObjs;
};

// action to cut video by meta info attached to each clip

// if its a hesitation, cut
// if its a pause, speed up
export const extractWordIndices = (mergedTranscript) => {
  const indices = [];

  for (var i = 0; i < mergedTranscript.length; i += 1) {
    const refObj = mergedTranscript[i];
    if (getTimestampType(refObj) === WORD) {
      indices.push(i);
    }
  }
  return indices;
};
