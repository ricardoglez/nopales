import { createMachine, assign } from "xstate";

const predictAction = (context, event) => {
  console.log('predict Action');
  return {
    target:"ready",
    actions: assign({
      predictions: event.predictions,
    })
  }
};

export const cameraMachine = createMachine({
    id: "cameraMachine",
    initial: "inactive",
    context: {
      predictions: [],
      stream: null,
      video: null,
      width: 640,
      height: 320,
    },
    states: {
      inactive: { 
        on: { 
          ACTIVATE: {
            target: "active",
            actions: assign({
              stream: (context, event) => event.stream,
              video: (context, event) => event.video
           })
          }
        },
      },
      active: { 
        on: {
          START: "processing", 
          DEACTIVATE: "inactive"
        }
      },
      processing: { 
        on: { 
         DEACTIVATE: "inactive",
         PREDICT: predictAction
        } 
      },
      error: {
        on: {
          DEACTIVATE: "inactive"
        }
      },
      ready: { 
        on: {
          DEACTIVATE: "inactive",
        }
      }
    }
  });

  