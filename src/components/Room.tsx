import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Socket, io } from "socket.io-client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

const URL = "https://omegle-backend-78um.onrender.com/";

// Add ICE server configuration for NAT traversal
const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302"
      ]
    },
    {
      // Free TURN server from Twilio (you should replace with your own in production)
      urls: "turn:global.turn.twilio.com:3478?transport=udp",
      username: "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
      credential: "w1uxM55V9yVoqyVFjt+KsVE6iyTjRrPg20DjIHc8fBs="
    }
  ],
  iceCandidatePoolSize: 10
};

export const Room = ({
    name,
    localAudioTrack,
    localVideoTrack,
    stream,
    videoEnabled,
    audioEnabled,
    onToggleVideo,
    onToggleAudio,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    onSelectVideoDevice,
    onSelectAudioDevice
}: {
    name: string,
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null,
    stream: MediaStream | null,
    videoEnabled: boolean,
    audioEnabled: boolean,
    onToggleVideo: () => void,
    onToggleAudio: () => void,
    videoDevices: { deviceId: string; label: string }[],
    audioDevices: { deviceId: string; label: string }[],
    selectedVideoDeviceId: string,
    selectedAudioDeviceId: string,
    onSelectVideoDevice: (deviceId: string) => void,
    onSelectAudioDevice: (deviceId: string) => void
}) => {
    const [_searchParams, _setSearchParams] = useSearchParams();
    const [lobby, setLobby] = useState(true);
    const [socket, setSocket] = useState<null | Socket>(null);
    const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
    const [_receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null);
    const [_remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [_remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [_remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);
    
    // Add connection state tracking
    const [connectionStatus, setConnectionStatus] = useState<string>("connecting");
    const [connectionError, setConnectionError] = useState<string | null>(null);
    
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const navigate = useNavigate();

    // chevron svg
    const chevronSvg = (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
    );

    useEffect(() => {
        const socket = io(URL, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
            transports: ['websocket', 'polling']
        });

        // Add socket connection error handling
        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setConnectionError(`Server connection failed: ${err.message}`);
        });
        
        socket.on('connect', () => {
            console.log('Socket connected successfully');
            setConnectionError(null);
        });

        socket.on('disconnect', (reason) => {
            console.log(`Socket disconnected: ${reason}`);
            if (reason === 'io server disconnect') {
                setConnectionError('Server disconnected');
            }
        });

        socket.on('send-offer', async ({roomId}) => {
            console.log("sending offer");
            setLobby(false);
            setConnectionStatus("connecting");
            // Use ICE server configuration
            const pc = new RTCPeerConnection(ICE_SERVERS);

            // Add connection state logging for debugging
            pc.oniceconnectionstatechange = () => {
                console.log(`ICE Connection State: ${pc.iceConnectionState}`);
                
                if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                    setConnectionStatus("connected");
                } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                    setConnectionStatus("failed");
                    setConnectionError("Connection to peer failed. They might be behind a strict firewall.");
                }
            };

            pc.onconnectionstatechange = () => {
                console.log(`Connection State: ${pc.connectionState}`);
                if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
                    console.error("WebRTC connection failed or disconnected");
                    setConnectionStatus("failed");
                    setConnectionError("Connection failed. Try refreshing or use a different network.");
                }
            };

            setSendingPc(pc);
            if (localVideoTrack) {
                console.error("added tack");
                console.log(localVideoTrack)
                pc.addTrack(localVideoTrack)
            }
            if (localAudioTrack) {
                console.error("added tack");
                console.log(localAudioTrack)
                pc.addTrack(localAudioTrack)
            }

            pc.onicecandidate = async (e) => {
                console.log("receiving ice candidate locally");
                if (e.candidate) {
                   socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "sender",
                    roomId
                   })
                }
            }

            pc.onnegotiationneeded = async () => {
                console.log("on negotiation neeeded, sending offer");
                const sdp = await pc.createOffer();
                //@ts-ignore
                pc.setLocalDescription(sdp)
                socket.emit("offer", {
                    sdp,
                    roomId
                })
            }
        });

        socket.on("offer", async ({roomId, sdp: remoteSdp}) => {
            console.log("received offer");
            setLobby(false);
            // Use ICE server configuration
            const pc = new RTCPeerConnection(ICE_SERVERS);
            
            // Add connection state logging for debugging
            pc.oniceconnectionstatechange = () => {
                console.log(`ICE Connection State: ${pc.iceConnectionState}`);
            };

            pc.onconnectionstatechange = () => {
                console.log(`Connection State: ${pc.connectionState}`);
                if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
                    console.error("WebRTC connection failed or disconnected");
                }
            };
            
            pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer();
            //@ts-ignore
            pc.setLocalDescription(sdp)
            const stream = new MediaStream();
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }

            setRemoteMediaStream(stream);
            // trickle ice 
            setReceivingPc(pc);
            (window as any).pcr = pc;
            pc.ontrack = (e) => {
                alert("ontrack");
                // console.error("inside ontrack");
                // const {track, type} = e;
                // if (type == 'audio') {
                //     // setRemoteAudioTrack(track);
                //     // @ts-ignore
                //     remoteVideoRef.current.srcObject.addTrack(track)
                // } else {
                //     // setRemoteVideoTrack(track);
                //     // @ts-ignore
                //     remoteVideoRef.current.srcObject.addTrack(track)
                // }
                // //@ts-ignore
                // remoteVideoRef.current.play();
            }

            pc.onicecandidate = async (e) => {
                if (!e.candidate) {
                    return;
                }
                console.log("omn ice candidate on receiving seide");
                if (e.candidate) {
                   socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "receiver",
                    roomId
                   })
                }
            }

            socket.emit("answer", {
                roomId,
                sdp: sdp
            });
            setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track
                const track2 = pc.getTransceivers()[1].receiver.track
                console.log(track1);
                if (track1.kind === "video") {
                    setRemoteAudioTrack(track2)
                    setRemoteVideoTrack(track1)
                } else {
                    setRemoteAudioTrack(track1)
                    setRemoteVideoTrack(track2)
                }
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track1)
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track2)
                //@ts-ignore
                remoteVideoRef.current.play();
                // if (type == 'audio') {
                //     // setRemoteAudioTrack(track);
                //     // @ts-ignore
                //     remoteVideoRef.current.srcObject.addTrack(track)
                // } else {
                //     // setRemoteVideoTrack(track);
                //     // @ts-ignore
                //     remoteVideoRef.current.srcObject.addTrack(track)
                // }
                // //@ts-ignore
            }, 5000)
        });

        socket.on("answer", ({roomId, sdp: remoteSdp}) => {
            setLobby(false);
            setSendingPc(pc => {
                pc?.setRemoteDescription(remoteSdp)
                return pc;
            });
            console.log("loop closed");
        })

        socket.on("lobby", () => {
            setLobby(true);
        })

        socket.on("add-ice-candidate", ({candidate, type}) => {
            console.log("add ice candidate from remote");
            console.log({candidate, type})
            if (type == "sender") {
                setReceivingPc(pc => {
                    if (!pc) {
                        console.error("receicng pc nout found")
                    } else {
                        console.error(pc.ontrack)
                    }
                    pc?.addIceCandidate(candidate)
                    return pc;
                });
            } else {
                setSendingPc(pc => {
                    if (!pc) {
                        console.error("sending pc nout found")
                    } else {
                        // console.error(pc.ontrack)
                    }
                    pc?.addIceCandidate(candidate)
                    return pc;
                });
            }
        })

        setSocket(socket)
    }, [name, localAudioTrack, localVideoTrack]);

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
                localVideoRef.current.play();
            } else {
                localVideoRef.current.srcObject = null;
            }
        }
    }, [localVideoTrack]);

    // Replace video/audio tracks in the peer connection when they change
    useEffect(() => {
        if (sendingPc) {
            // Replace video track
            if (localVideoTrack) {
                const videoSender = sendingPc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (videoSender) {
                    videoSender.replaceTrack(localVideoTrack);
                    console.log('[Room] Replaced video track in peer connection');
                }
            }
            // Replace audio track
            if (localAudioTrack) {
                const audioSender = sendingPc.getSenders().find(s => s.track && s.track.kind === 'audio');
                if (audioSender) {
                    audioSender.replaceTrack(localAudioTrack);
                    console.log('[Room] Replaced audio track in peer connection');
                }
            }
        }
    }, [localAudioTrack, localVideoTrack, sendingPc]);

    // UI Handlers
    const handleEndChat = () => {
        navigate("/");
    };
    const handleNextStranger = () => {
        // TODO: Implement next stranger logic
        window.location.reload(); // placeholder
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="border-b bg-white dark:bg-neutral-900">
                <div className="flex h-14 items-center justify-between px-4">
                    <h1 className="text-xl font-bold">Showcast</h1>
                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-neutral-800 font-semibold"
                        onClick={handleEndChat}
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
                        <span className="hidden sm:inline">End Chat</span>
                        <span className="sm:hidden">End</span>
                    </button>
                </div>
            </header>
            
            {/* Connection Status Bar - Added to show connection issues */}
            {connectionError && (
                <div className="bg-yellow-500 text-white text-center py-2 px-4">
                    <p className="text-sm font-medium">{connectionError}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="text-xs underline hover:no-underline ml-2"
                    >
                        Refresh
                    </button>
                </div>
            )}
            
            {/* Main Content */}
            <main className="flex-1 p-4 bg-neutral-50 dark:bg-neutral-900">
                <div className="mx-auto max-w-4xl">
                    <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                        {/* Stranger Video */}
                        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                            <video ref={remoteVideoRef} autoPlay className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                {lobby ? (
                                    <div className="text-center">
                                        <div className="mb-2 text-sm text-white">Looking for someone...</div>
                                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
                                    </div>
                                ) : connectionStatus === "connecting" ? (
                                    <div className="text-center">
                                        <div className="mb-2 text-sm text-white">Connecting to stranger...</div>
                                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
                                    </div>
                                ) : connectionStatus === "failed" ? (
                                    <div className="text-center bg-black/50 p-3 rounded">
                                        <div className="text-sm text-white mb-2">Connection failed</div>
                                        <button 
                                            onClick={handleNextStranger} 
                                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                        >
                                            Try Another Person
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-xs text-white rounded">Stranger</div>
                        </div>
                        {/* Your Video */}
                        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                            <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-xs text-white rounded">You</div>
                        </div>
                    </div>
                    {/* Controls */}
                    <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
                        {/* Video Dropdown */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={onToggleVideo}
                            className={`flex items-center justify-center w-12 h-12 rounded-full border transition focus:outline-none ${videoEnabled ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                            aria-label={videoEnabled ? 'Disable Video' : 'Enable Video'}
                          >
                            {videoEnabled ? (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="15" height="10" rx="2"/><polygon points="17 7 22 12 17 17 17 7"/></svg>
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="15" height="10" rx="2"/><polygon points="17 7 22 12 17 17 17 7"/><line x1="1" y1="1" x2="23" y2="23" stroke="#ea4335" strokeWidth="2.5"/></svg>
                            )}
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="flex items-center justify-center w-8 h-8 rounded-full border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 focus:outline-none"
                                aria-label="Select Camera"
                                tabIndex={0}
                              >
                                {chevronSvg}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" sideOffset={8} className="bg-white border border-blue-200 rounded-xl shadow-xl min-w-[180px]">
                              {videoDevices.map(device => (
                                <DropdownMenuItem
                                  key={device.deviceId}
                                  onSelect={() => onSelectVideoDevice(device.deviceId)}
                                  className={selectedVideoDeviceId === device.deviceId ? "font-semibold text-blue-500" : ""}
                                >
                                  {device.label || `Camera (${device.deviceId})`}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {/* Audio Dropdown */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={onToggleAudio}
                            className={`flex items-center justify-center w-12 h-12 rounded-full border transition focus:outline-none ${audioEnabled ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                            aria-label={audioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                          >
                            {audioEnabled ? (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/><line x1="1" y1="1" x2="23" y2="23" stroke="#ea4335" strokeWidth="2.5"/></svg>
                            )}
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="flex items-center justify-center w-8 h-8 rounded-full border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 focus:outline-none"
                                aria-label="Select Microphone"
                                tabIndex={0}
                              >
                                {chevronSvg}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" sideOffset={8} className="bg-white border border-blue-200 rounded-xl shadow-xl min-w-[180px]">
                              {audioDevices.map(device => (
                                <DropdownMenuItem
                                  key={device.deviceId}
                                  onSelect={() => onSelectAudioDevice(device.deviceId)}
                                  className={selectedAudioDeviceId === device.deviceId ? "font-semibold text-blue-500" : ""}
                                >
                                  {device.label || `Microphone (${device.deviceId})`}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {/* Next and End buttons unchanged */}
                        <button
                            onClick={handleNextStranger}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border bg-white text-blue-700 border-blue-300 hover:bg-blue-50 transition"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                            <span>Next</span>
                        </button>
                        <button
                            onClick={handleEndChat}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border bg-red-500 text-white border-red-600 hover:bg-red-600 transition"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
                            <span>End</span>
                        </button>
                    </div>
                    {/* Mobile Info */}
                    <div className="mt-3 text-center text-xs text-gray-500 sm:hidden">
                        <p>Tap Next to find another person</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

