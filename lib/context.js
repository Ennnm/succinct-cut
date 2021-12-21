import { createContext } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

export const UserContext = createContext({ user: null, username: null });
// const ffmpeg = createFFmpeg({
//   corePath: '/ffmpeg-core/ffmpeg-core.js',
// });
export const ffmpegContext = createContext({ ffmpeg: null });
console.log('in context file');
