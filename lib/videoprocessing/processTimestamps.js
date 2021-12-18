import { HESITATION, PAUSE, WORD } from './timestampTypes';
export const mergeWordsTimeStamps = (flattenTranscript) => {
  const timestampObjs = [];

  let flag = '';
  let refObj;
  for (var i = 0; i < flattenTranscript.length; i += 1) {
    refObj = flattenTranscript[i];
    flag = refObj.type;

    for (var j = i + 1; j < flattenTranscript.length; j += 1) {
      const nextObj = flattenTranscript[j];
      let nextType = nextObj.type;
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
      // add last item
      if (j === flattenTranscript.length - 1) {
        timestampObjs.push(refObj);
      }
    }
  }
  return timestampObjs;
};

// action to cut video by meta info attached to each clip

// if its a hesitation, cut
// if its a pause, speed up
export const extractTypeIndices = (mergedTranscript, type) => {
  const indices = [];

  for (var i = 0; i < mergedTranscript.length; i += 1) {
    const refObj = mergedTranscript[i];
    if (refObj.type === type) {
      indices.push(i);
    }
  }
  return indices;
};
