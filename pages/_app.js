import '../styles/globals.css';
import Navbar from '../components/Navbar';
import { UserContext, ffmpegContext } from '../lib/context';
import { useUserData } from '../lib/hooks';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { ChakraProvider } from '@chakra-ui/react';

const ffmpeg = createFFmpeg({
  corePath: '/ffmpeg-core/ffmpeg-core.js',
});

function MyApp({ Component, pageProps }) {
  const userData = useUserData();
  console.log('userData', userData);

  return (
    <>
      <ChakraProvider>
        <ffmpegContext.Provider value={ffmpeg}>
          <UserContext.Provider value={userData}>
            <Navbar />
            <Component {...pageProps} />
          </UserContext.Provider>
        </ffmpegContext.Provider>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
