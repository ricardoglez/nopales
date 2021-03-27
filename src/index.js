import "./styles.css";
import ml5 from "ml5";
import { interpret } from "xstate";
import { drawFaceMesh } from "./drawFaceMesh";
import { cameraMachine } from './stateMachhine';
const { width, height } = { width: 640, height: 320 };


let cameraService = null;
let facemesh = null;
let mainState = cameraMachine.initialState.context;
// I can get the default size of the camera and initialize it here also, or customize the size of the image that will output
const getMedia = async (constraints) => {
  let stream = null;
  let myVideo = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    myVideo = document.querySelector("#myVideo");
    myVideo.srcObject = stream;
    myVideo.onloadedmetadata = () => {
      myVideo.play();
    };
    return { video: myVideo, stream };

  } catch (err) {
    console.error(err);
  }
};

const startML = async () => {
  const options = {
    flipHorizontal: false, // boolean value for if the video should be flipped, defaults to false
    maxContinuousChecks: 5, // How many frames to go without running the bounding box detector. Only relevant if maxFaces > 1. Defaults to 5.
    detectionConfidence: 0.9, // Threshold for discarding a prediction. Defaults to 0.9.
    maxFaces: 1, // The maximum number of faces detected in the input. Should be set to the minimum number for performance. Defaults to 10.
    scoreThreshold: 0.75, // A threshold for removing multiple (likely duplicate) detections based on a "non-maximum suppression" algorithm. Defaults to 0.75.
    iouThreshold: 0.3 // A float representing the threshold for deciding whether boxes overlap too much in non-maximum suppression. Must be between [0, 1]. Defaults to 0.3.
  };
  cameraService.send('START');
  facemesh = await ml5.facemesh(mainState.context.video, options);
  let predictions = [];
  facemesh.on("predict", (results) => {
    predictions = results;
    cameraService.send('PREDICT', { predictions })
    drawFaceMesh(predictions, width, height);
  });
};

const iniciarCamara = async () => {
  const constraints = {
    audio: false,
    video: { width, height }
  };

  const mediaResults = await getMedia(constraints);
  console.log('MediaResults: ',mediaResults);

  mainState = cameraService.send("ACTIVATE", mediaResults );
};

const detenerCamara = () => {
  const myVideo = mainState.context.video;
  const tracks = mainState.context.stream.getTracks();

  tracks.forEach(function (track) {
    track.stop();
  });
  myVideo.pause();
  myVideo.currentTime = 0;
  myVideo.srcObject = null;
  myVideo.readyState = 1;
  if ( facemesh ) {
    facemesh.video = null;
  }
  mainState = cameraService.send("DEACTIVATE");
};

const handleButtons = (state) => {
  console.log('HandleButtons', state);
  switch(state.value) {
    case 'active':
      document.querySelector("#detener-camara").disabled = false;
      document.querySelector("#iniciar-ml").disabled = false;
      document.querySelector("#iniciar-camara").disabled = true;
      break;
    case 'inactive':
      document.querySelector("#iniciar-ml").disabled = true;
      document.querySelector("#iniciar-camara").disabled = false;
      document.querySelector("#detener-camara").disabled = true;
      break;
    case 'processing':
      document.querySelector("#iniciar-ml").disabled = true;
      document.querySelector("#iniciar-camara").disabled = true;
      document.querySelector("#detener-camara").disabled = false;
      break;
    case 'ready':
      document.querySelector("#iniciar-ml").disabled = true;
      document.querySelector("#iniciar-camara").disabled = true;
      document.querySelector("#detener-camara").disabled = false;
      break; 
  }
};

const init = () => {
  cameraService = interpret(cameraMachine)
    .onTransition((state) => {
      console.log('State Val: ', state.value)
      handleButtons(state);
    })
    .start();
  document.querySelector("#state").innerHTML = cameraMachine.getStateNodes();
  document
    .querySelector("#iniciar-camara")
    .addEventListener("click", iniciarCamara);
  document
    .querySelector("#detener-camara")
    .addEventListener("click", detenerCamara);
  document.querySelector("#iniciar-ml").addEventListener("click", startML);

};

init();
