import { store } from 'src/store';

const Peer = require('simple-peer');
let channel = null;
let peerConnection = null;
let mediaStream = null;
// let restartTime = false;

// TODO: Verify that this gets called and works
MediaDevices.ondevicechange = () => {
  console.log('mediadevices Changed!, updating store');
  populateAvailableMediaDevices();
};

/**
 * @param  { Boolean } initiator
 * @param  { Function } onSignal
 * @param  { Function } onStream
 * @param  { Function } onMessage
 * @param  { Function } [onClose]
 * @param  { MediaStream } [stream]
 */
export async function createPeer (initiator, onSignal, onStream, onMessage, onClose, stream) {
  console.log('createPeer called with params:', arguments);
  // restartTime = _restartTime;
  store.commit('connectionSettings/setPeerConnectionState', initiator ? 'connecting' : 'waiting');
  // destroyPeer();

  const peerOpts = {
    initiator: initiator,

    // channelName: 'chat',
    // channelConfig: { negotiated: true, id: 0 },
  };

  if (!process.env.NO_TURN_SERVER) {
    peerOpts.config = {
      iceServers: [
        // { urls: 'stun:drive.robbit.se:3478' },
        // { urls: 'turn:drive.robbit.se:3478', username: 'rise-robbit-turn-user', credential: 'i-want-to-be-there' },
        { urls: `stun:${process.env.BACKEND_SERVER}:${process.env.TURN_UDP_PORT}` },
        { urls: `turn:${process.env.BACKEND_SERVER}:${process.env.TURN_UDP_PORT}`, username: process.env.TURN_USER, credential: process.env.TURN_PASSWORD },
      ],
    };
  }
  if (stream) {
    peerOpts.stream = stream;
  }
  peerConnection = new Peer(peerOpts);
  channel = peerConnection._pc.createDataChannel('chat', { negotiated: true, id: 1001 });
  mediaStream = stream;

  console.log('peer util stream obj:', mediaStream);

  channel.onmessage = (event) => {
    console.log('chatMessage', event.data);
    // this.receivedMessages.push(event.data);
    onMessage(event.data);
  };

  console.log('created a peer object', peerConnection);
  peerConnection.on('signal', data => {
    onSignal(data);
    // this.$socket.client.emit('signal', data);
  });

  peerConnection.on('connect', () => {
    console.log('peer connected');
    store.commit('connectionSettings/setPeerConnectionState', 'connected');
  });

  peerConnection.on('close', () => {
    console.log('peer connection was closed');
    destroyPeer();
    store.commit('connectionSettings/setPeerConnectionState', 'disconnected');
    if (onClose) {
      onClose();
    }
    // if (restartTime !== false) {
    //   setTimeout(() => {
    //     createPeer(initiator, onSignal, onStream, onMessage, mediaStream);
    //   }, restartTime);
    // }
  });

  peerConnection.on('error', (err) => {
    console.error('peer error: ', err);
  });
  peerConnection.on('stream', stream => {
    onStream(stream);
    // this.$refs.remoteVideo.srcObject = stream;
  });

  peerConnection.on('data', data => {
    console.log('got a message: ' + data);
    // onMessage(data);
    // this.receivedMessages.push(data);
  });
}

export function destroyPeer () {
  try {
    if (channel) {
      console.log('need to remove old channel');
      channel.close();
      channel = null;
    }
    if (peerConnection) {
      console.log('destroying peer');
      // peerConnection.on('close', () => console.log('actively ignored peer closed event'));
      peerConnection.removeAllListeners('close');
      peerConnection.destroy();
      store.commit('connectionSettings/setPeerConnectionState', 'disconnected');
    } else {
      console.log('no peer to destroy');
    }
  } catch (err) {
    console.error(err);
  }
}

export function signalPeer (data) {
  if (peerConnection) peerConnection.signal(data);
}

export function sendMessage (chatMessage) {
  console.log('sending message');
  try {
    // peerConnection.send(this.chatMessage);
    channel.send(chatMessage);
  } catch (err) {
    console.error(err);
  }
}

export function setPeerOutputStream (stream) {
  if (!stream) { return; }
  mediaStream = stream;
  if (peerConnection) {
    if (peerConnection.streams.length && peerConnection.streams[0]) {
      console.log('removing previous stream');
      peerConnection.removeStream(peerConnection.streams[0]);
    }
    peerConnection.addStream(stream);
  }
}

export async function populateAvailableMediaDevices () {
  const devices = await navigator.mediaDevices.enumerateDevices();
  store.commit('deviceSettings/setAvailableMediaDevices', devices);
  // console.log(store);
}

export async function getLocalMediaStream (videoConstraint, audioConstraint) {
  console.log('supported constraints: ', navigator.mediaDevices.getSupportedConstraints());
  return await navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: audioConstraint });
  // try {
  //   // const videoConstraint = this.chosenVideoInputId ? { deviceId: this.chosenVideoInputId } : true;
  //   // const audioConstraint = this.chosenAudioInputId ? { deviceId: this.chosenAudioInputId } : true;
  //   const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: audioConstraint });
  //   console.log(stream);
  //   // this.$refs.localVideo.srcObject = stream;
  //   // this.localStream = stream;
  //   return stream;
  // } catch (err) {
  //   this.$q.notify({
  //     message: 'Lyckades inte starta video/audio-enheten. So saad...',
  //     position: 'center',
  //     actions: [
  //       { label: 'Ok', color: 'white', handler: () => { /* ... */ } },
  //     ],
  //     color: 'negative',
  //     icon: 'report_problem',
  //   });
  //   console.error(err);
  // }
}

export default {
  populateAvailableMediaDevices,
  createPeer,
  destroyPeer,
  signalPeer,
  sendMessage,
  getLocalMediaStream,
  setPeerOutputStream,
};
