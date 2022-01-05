<div id="top"></div>

# Succinct Cut 🎥🧹✂

##### Succinct cut is a video cleaning service for unscripted video content. 

<!-- TABLE OF CONTENTS -->

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li><a href="#usage-steps">Usage Steps</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li><a href="#pipeline">Pipeline</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

![succinct cut final screenshot](/images/6_sc.png)



Unedited videos are full of verbal disfluencies  ("huh", "uh", "erm", "um") and long pauses when the speaker is thinking of what to say. Editing such videos manually is tedious and time consuming.

##### Succinct cut will

- Removes glaring disfluencies and hesitations.
- Reduce the duration of pauses without cuts.
- Return you a final cut that is cleaner and shorter than the original mp4 video upload.

##### In exchange for

- Some of your computer's CPU processing resources
- Time

You can find the deployed app [here](http://cutcut-sigma.vercel.app/)

##### Performance on i5-8600 CPU desktop computer

| Video size/mb | Video duration/min | Final Video Duration/min | Time taken for audio analysis/min | Time Taken for video editing/min |
| ------------- | ------------------ | ------------------------ | --------------------------------- | -------------------------------- |
| 21            | 1.04               | 0.53                     | 0.4                               | 11                               |
| 130           | 6.44               | 5.04                     | 3.53                              | 73                               |



<p align="right">(<a href="#top">back to top</a>)</p>

## Usage Steps

1. __Sign-in with Google__
2. __Browse__ to upload a .mp4 video ( max size: 100mb )
3. __Analyze Video__ to start video analysis.
4. __Clean__ __Video__ when progress bar reaches 50% to start video processing. 
   *Colored bars will appear below the video to indicate the type of speech (speech, hesitation, pauses) that occurred in the video's timeframe. 
   The bar on the right visualises the cleaned state without hesitations and long pauses.*
5. __Download__ when progress bar reaches 100%

<p align="right">(<a href="#top">back to top</a>)</p>

## Built With

##### Frontend

* [Next.js](https://nextjs.org/)
* [React.js](https://reactjs.org/)

##### Backend. Authentication, database, storage, functions

* [Firebase Auth](https://firebase.google.com/docs/auth)
* [Cloud Firestore](https://firebase.google.com/docs/firestore)
* [Cloud Storage](https://firebase.google.com/docs/storage)
* [Cloud Functions](https://firebase.google.com/docs/functions)

##### Video/audio analysis to get speeech, disfluencies, and pauses

- [IBM Watson Speech-to-Text](https://www.ibm.com/sg-en/cloud/watson-speech-to-text)

##### Video conversion, cutting, and editing in the browser

- [Ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)
- [Ffmpeg](https://www.ffmpeg.org/)

##### Styling

- [chakra-ui](https://chakra-ui.com/)

##### Planning

- [notion](https://wongshennan.notion.site/Video-Editor-Transcription-2877c4a64f5b46fdaace8af30a474a5d)



[frontend repo](https://github.com/Ennnm/succinct-cut)

[backend repo](https://github.com/Ennnm/succinct-cut-cloudfunc)

<p align="right">(<a href="#top">back to top</a>)</p>

### Pipeline

![flowchart](/images/pipeline_mermaid.JPG)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- ROADMAP -->

## Roadmap

- [] Fix login bugs
- [] Nicer login ui
- [] Port from nextjs + firebase to heroku

##### Issues

- Vercel deployment has a timeout of 15s.

- NextJS + Firebase sets a timeout on IBM watsons of 540s (current approach).

  *A longer video will require a longer transcription time and this may be cut off prematurely.
  While working with firebase databases and cloud functions have their advantages, porting over to express backend on heroku and using [IBM async API](https://cloud.ibm.com/apidocs/speech-to-text?code=node#registercallback) may remove this problem with fixed timeouts.*

See the [open issues](https://github.com/ennnm/succinct_cut/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->

## Contact

Jia En - [@ennnm_](https://twitter.com/ennnm_) - jiaen.1sc4@gmail.com
Shen Nan - [@wongsn](https://twitter.com/wongsn) - wongshennan@gmail.com

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

* [Fireship ](https://www.youtube.com/watch?v=-OTc0Ki7Sv0)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/github_username/repo_name.svg?style=for-the-badge
[contributors-url]: https://github.com/github_username/repo_name/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/github_username/repo_name.svg?style=for-the-badge
[forks-url]: https://github.com/github_username/repo_name/network/members
[stars-shield]: https://img.shields.io/github/stars/github_username/repo_name.svg?style=for-the-badge
[stars-url]: https://github.com/github_username/repo_name/stargazers
[issues-shield]: https://img.shields.io/github/issues/github_username/repo_name.svg?style=for-the-badge
[issues-url]: https://github.com/github_username/repo_name/issues
[license-shield]: https://img.shields.io/github/license/github_username/repo_name.svg?style=for-the-badge
[license-url]: https://github.com/github_username/repo_name/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: images/screenshot.png
