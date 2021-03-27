export const drawFaceMesh = (predictions, w, h) => {
    var canvas, context;
    canvas = document.querySelector("#myCanvas");
    context = canvas.getContext("2d");
    canvas.width = w;
    canvas.height = h;
  
    if (predictions[0]) {
      for (let i = 0; i < predictions.length; i += 1) {
        const keypoints = predictions[i].scaledMesh;
        console.log(predictions[i].annotations);
        // Draw facial keypoints.
        for (let j = 0; j < keypoints.length; j += 1) {
          const [x, y] = keypoints[j];
  
          context.beginPath();
          context.arc(x, y, 3 ,0 , 2*Math.PI);
          context.stroke();
        }
      }
    }
  };
  