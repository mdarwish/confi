import { useRef, useEffect, useState } from "react";

import io from 'socket.io-client'

const socket = io(
    '/webRTCPeers',
    {
        path: '/confi'
    }
)

function App() {
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const pc = useRef(new RTCPeerConnection(null));
    const textRef = useRef()
    const [offerVisible, setOfferVisible] = useState(true)
    const [answerVisible, setAnswerVisible] = useState(false)
    const [status, setStatus] = useState('Make a call now')
    
    useEffect (() => {
        socket.on('connection-success', success => {
            console.log(success)
        })
        
        socket.on('sdp', data => {
            console.log(data)
            pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp))
            textRef.current.value = JSON.stringify(data.sdp)
            
            if(data.sdp.type === 'offer') {
                setOfferVisible(false)
                setAnswerVisible(true)
                setStatus('Incoming call ...')
            } else {
                setStatus('Call established!')
            }
        })
        
        socket.on('candidate', candidate => {
            console.log(candidate)
            pc.current.addIceCandidate(new RTCIceCandidate(candidate))
        })
        
        const constraints = {
            audio: false,
            video: true,
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                localVideoRef.current.srcObject = stream;
                
                stream.getTracks().forEach(track => {
                    _pc.addTrack(track, stream)
                })
            })
            .catch((e) => {
                console.log("getUserMedia error", e);
            })

        const _pc = new RTCPeerConnection(null)
        _pc.onicecandidate = (e) => {
            if (e.candidate) {
                console.log(JSON.stringify(e.candidate))
                sendToPeers('candidate', e.candidate)                
            }
        }
        
        _pc.ontrack = (e) => {
            // we got remote stream
            remoteVideoRef.current.srcObject = e.streams[0]
        }
        
        pc.current = _pc
                    
    }, [])
    
    const sendToPeers = (eventType, payload) => {
        //send sdp to server
        socket.emit(eventType, payload)    
    }
    
    const processSDP = (sdp) => {
        console.log(JSON.stringify(sdp))
        pc.current.setLocalDescription(sdp)
        
        //send sdp to server
        sendToPeers('sdp', { sdp })
    }
    
    const createOffer = () => {
        pc.current.createOffer({
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1,
        }).then( sdp => {
                processSDP(sdp)
                setOfferVisible(false)
                setStatus('Calling ...')
        }).catch(e => console.log(e))
    }
    
    const createAnswer = () => {
        pc.current.createAnswer({
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1,
        }).then( sdp => {
            processSDP(sdp)
            setAnswerVisible(true)
            setStatus('Call established!')
        }).catch(e => console.log(e))
    }
    
    const showHideButtons = () => {
        if (offerVisible) {
            return(
                <div>
                    <button onClick = {createOffer}> Call </button>
                </div>
            )
        } else if (answerVisible) {
            return(
                <div>
                    <button onClick = {createAnswer}> Answer </button>
                </div>
            )
        }
    }

    return ( 
        <div sttyle = {{ margin: 10 }}>
            <video style = {{width: 240, height: 240, margin: 5, backgroundColor: "black"}} ref = { localVideoRef } autoPlay></video> 
            <br />
            { showHideButtons() }
            <div>{ status }</div>
            <textarea ref = {textRef}></textarea>
            <br />
            <video style = {{width: 240, height: 240, margin: 5, backgroundColor: "black"}} ref = {remoteVideoRef } autoPlay></video> 
        </div>
    );
}

export default App;