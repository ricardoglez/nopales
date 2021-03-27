import "./styles.css";
import ml5 from "ml5";
import { createMachine, interpret } from "xstate";
import { drawFaceMesh } from "./drawFaceMesh";

const { width, height } = { width: 640, height: 320 };
const cameraMachine = createMachine({
  id: "cameraMachine",
  initial: "inactive",
  context: {
    predictions: [],
    stream: null,
    tracks: null,
    myVideo: null,
    width: 640,
    height: 320,

  },
  states: {
    inactive: { on: { ACTIVATE: "active", } },
    active: { on: { START: "processing" } },
    processing: { on: { CHANGE: "ready" } },
    ready: { on: { DEACTIVATE: "inactive" } }
  }
});

let cameraService = null;

const getMedia = async (constraints) => {
  let stream = null;
  let myVideo = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    myVideo = document.querySelector("#myVideo");
    myVideo.srcObject = stream;
    myVideo.onloadedmetadata = () => {
      myVideo.play();
      cameraMachine.transition("inactive", "ACTIVATE");
      cameraService.send("ACTIVATE");
    };
    console.log('CameraMAchine',cameraMachine);
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
  const myVideo = document.querySelector("#myVideo");
  const facemesh = ml5.facemesh(myVideo, options, () => {
    console.log("Loaded Mesh");
  });
  let predictions = [];

  // Listen to new 'predict' events
  facemesh.on("predict", (results) => {
    predictions = results;
    drawFaceMesh(predictions, width, height);
  });
};

const iniciarCamara = () => {
  const constraints = {
    audio: false,
    video: { width, height }
  };
  getMedia(constraints);
  document.querySelector("#detener-camara").disabled = false;
  document.querySelector("#iniciar-ml").disabled = false;
  document.querySelector("#iniciar-camara").disabled = true;
};

const detenerCamara = () => {
  console.log("Detener Cámara");
  const myVideo = document.querySelector("#myVideo");
  const stream = myVideo.srcObject;
  const tracks = stream.getTracks();

  tracks.forEach(function (track) {
    track.stop();
  });

  myVideo.srcObject = null;
  myVideo.readyState = 1;
  document.querySelector("#iniciar-ml").disabled = true;
  document.querySelector("#iniciar-camara").disabled = false;
  document.querySelector("#detener-camara").disabled = true;
  cameraMachine.transition('inactive', 'DEACTIVATE')
  cameraService.send("DEACTIVATE");
};

const changeState = () => {
  console.log('CHANGE STATE');
  cameraMachine.transition("inactive", "CHANGE");
  cameraService.send('CHANGE');
};

const init = () => {
  cameraService = interpret(cameraMachine)
    .onTransition((state) => console.log("Transition", state))
    .start();

  document.querySelector("#state").innerHTML = cameraMachine.getStateNodes();
  document
    .querySelector("#iniciar-camara")
    .addEventListener("click", iniciarCamara);
  document
    .querySelector("#detener-camara")
    .addEventListener("click", detenerCamara);
  document.querySelector("#iniciar-ml").addEventListener("click", startML);
  document.querySelector("#testxState").addEventListener("click", changeState);

};

init();
