import { useState, RefObject, useRef } from "react";
import { Socket } from "socket.io-client";

// Enhanced ICE server configuration for better NAT traversal
const ICE_SERVERS = {
    iceServers: [
        // Google's public STUN servers
        {
            urls: [
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
            ],
        },
        // Free TURN servers (you should replace these with your own in production)
        {
            urls: [
                "turn:openrelay.metered.ca:80",
                "turn:openrelay.metered.ca:443",
                "turn:openrelay.metered.ca:443?transport=tcp"
            ],
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:global.turn.twilio.com:3478?transport=udp",
            username:
                "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
            credential: "w1uxM55V9yVoqyVFjt+KsVE6iyTjRrPg20DjIHc8fBs=",
        },
    ],
    iceCandidatePoolSize: 10,
};

export type ConnectionStatus = "connecting" | "connected" | "failed" | "disconnected";

interface UseWebRTCProps {
    localAudioTrack: MediaStreamTrack | null;
    localVideoTrack: MediaStreamTrack | null;
    remoteVideoRef: RefObject<HTMLVideoElement>;
    setConnectionStatus: (status: ConnectionStatus) => void;
    setConnectionError: (error: string | null) => void;
}

export const useWebRTC = ({
    localAudioTrack,
    localVideoTrack,
    remoteVideoRef,
    setConnectionStatus,
    setConnectionError,
}: UseWebRTCProps) => {
    const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
    const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);

    // Use ref to store socket and buffered candidates
    const socketRef = useRef<Socket | null>(null);
    const bufferedCandidatesRef = useRef<{ sender: RTCIceCandidateInit[], receiver: RTCIceCandidateInit[] }>({
        sender: [],
        receiver: []
    });

    // Helper to process buffered candidates
    const processBufferedCandidates = (pc: RTCPeerConnection, type: "sender" | "receiver") => {
        const candidates = bufferedCandidatesRef.current[type];
        console.log(`Processing ${candidates.length} buffered ${type} candidates`);

        candidates.forEach(candidate => {
            pc.addIceCandidate(candidate).catch(e => {
                console.error(`Error adding buffered ICE candidate: ${e}`);
            });
        });

        // Clear processed candidates
        bufferedCandidatesRef.current[type] = [];
    };

    const createSendingPeerConnection = (roomId: string) => {
        const socket = socketRef.current;
        if (!socket) {
            console.error("Socket not available for sending peer connection");
            return;
        }

        console.log("Creating sending peer connection");
        setConnectionStatus("connecting");

        // Enhanced RTCPeerConnection configuration
        const pc = new RTCPeerConnection({
            ...ICE_SERVERS,
            iceTransportPolicy: 'all',  // Try both UDP and TCP
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            // Enable all ICE candidate types
            iceServers: ICE_SERVERS.iceServers.map(server => ({
                ...server,
                username: server.username || '',
                credential: server.credential || ''
            }))
        });

        // Add connection state logging and management
        pc.oniceconnectionstatechange = () => {
            console.log(`ICE Connection State (sending): ${pc.iceConnectionState}`);
            console.log(`Local ICE Candidates gathered so far:`, pc.localDescription?.sdp);

            if (
                pc.iceConnectionState === "connected" ||
                pc.iceConnectionState === "completed"
            ) {
                setConnectionStatus("connected");
                setConnectionError(null);
            } else if (
                pc.iceConnectionState === "failed" ||
                pc.iceConnectionState === "disconnected"
            ) {
                setConnectionStatus("failed");
                setConnectionError(
                    "Connection to peer failed. They might be behind a strict firewall."
                );
            }
        };

        // Enhanced ICE candidate gathering
        pc.onicegatheringstatechange = () => {
            console.log(`ICE Gathering State: ${pc.iceGatheringState}`);
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection State (sending): ${pc.connectionState}`);
            if (pc.connectionState === "connected") {
                setConnectionStatus("connected");
                setConnectionError(null);
                // Process any buffered candidates
                processBufferedCandidates(pc, "receiver");
            } else if (
                pc.connectionState === "failed" ||
                pc.connectionState === "disconnected"
            ) {
                setConnectionStatus("failed");
                setConnectionError(
                    "Connection failed. Try refreshing or use a different network."
                );
            }
        };

        setSendingPc(pc);

        // Add tracks
        if (localVideoTrack) {
            console.log("Adding video track to sending peer connection");
            pc.addTrack(localVideoTrack);
        }
        if (localAudioTrack) {
            console.log("Adding audio track to sending peer connection");
            pc.addTrack(localAudioTrack);
        }

        // Handle ICE candidates
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                console.log("Sending ICE candidate for sending peer connection");
                socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "sender",
                    roomId,
                });
            }
        };

        pc.onnegotiationneeded = async () => {
            try {
                console.log("Creating and sending offer");
                const sdp = await pc.createOffer();
                await pc.setLocalDescription(sdp);
                socket.emit("offer", {
                    sdp,
                    roomId,
                });
            } catch (error) {
                console.error("Error during offer creation:", error);
                setConnectionError("Failed to create connection offer");
            }
        };

        return pc;
    };

    const createReceivingPeerConnection = async (roomId: string, remoteSdp: RTCSessionDescriptionInit) => {
        const socket = socketRef.current;
        if (!socket) {
            console.error("Socket not available for receiving peer connection");
            return;
        }

        console.log("Creating receiving peer connection");

        // Enhanced RTCPeerConnection configuration
        const pc = new RTCPeerConnection({
            ...ICE_SERVERS,
            iceTransportPolicy: 'all',  // Try both UDP and TCP
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            // Enable all ICE candidate types
            iceServers: ICE_SERVERS.iceServers.map(server => ({
                ...server,
                username: server.username || '',
                credential: server.credential || ''
            }))
        });

        // Set the receiving PC immediately
        setReceivingPc(pc);

        // Add connection state handling
        pc.oniceconnectionstatechange = () => {
            console.log(`ICE Connection State (receiving): ${pc.iceConnectionState}`);

            if (
                pc.iceConnectionState === "connected" ||
                pc.iceConnectionState === "completed"
            ) {
                setConnectionStatus("connected");
                setConnectionError(null);
            } else if (
                pc.iceConnectionState === "failed" ||
                pc.iceConnectionState === "disconnected"
            ) {
                setConnectionStatus("failed");
                setConnectionError("Connection to peer failed");
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection State (receiving): ${pc.connectionState}`);
            if (pc.connectionState === "connected") {
                setConnectionStatus("connected");
                setConnectionError(null);
                // Process any buffered candidates
                processBufferedCandidates(pc, "sender");
            } else if (
                pc.connectionState === "failed" ||
                pc.connectionState === "disconnected"
            ) {
                setConnectionStatus("failed");
                setConnectionError("Connection failed");
            }
        };

        // Set up media handling before setting remote description
        const stream = new MediaStream();
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
        }
        setRemoteMediaStream(stream);

        pc.ontrack = (event) => {
            console.log("Received track:", event.track.kind);
            const track = event.track;
            const streams = event.streams;

            if (track.kind === "video") {
                setRemoteVideoTrack(track);
            } else if (track.kind === "audio") {
                setRemoteAudioTrack(track);
            }

            if (streams && streams.length > 0) {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = streams[0];
                    remoteVideoRef.current.play().catch(e => {
                        console.error("Error playing remote video:", e);
                    });
                }
                setRemoteMediaStream(streams[0]);
            } else if (remoteVideoRef.current?.srcObject) {
                const mediaStream = remoteVideoRef.current.srcObject as MediaStream;
                mediaStream.addTrack(track);
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (e) => {
            if (!e.candidate) return;

            console.log("Sending ICE candidate for receiving peer connection");
            socket.emit("add-ice-candidate", {
                candidate: e.candidate,
                type: "receiver",
                roomId,
            });
        };

        try {
            await pc.setRemoteDescription(remoteSdp);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("answer", {
                roomId,
                sdp: answer,
            });

            // Process any buffered candidates now that we're ready
            processBufferedCandidates(pc, "sender");
        } catch (error) {
            console.error("Error during answer creation:", error);
            setConnectionError("Failed to create connection answer");
            throw error;
        }

        return pc;
    };

    const handleAnswer = async (remoteSdp: RTCSessionDescriptionInit) => {
        if (!sendingPc) {
            console.error("No sending peer connection available");
            return;
        }

        try {
            await sendingPc.setRemoteDescription(remoteSdp);
            console.log("Remote description set successfully");
            // Process any buffered candidates now that we're ready
            processBufferedCandidates(sendingPc, "receiver");
        } catch (error) {
            console.error("Error setting remote description:", error);
            setConnectionError("Failed to complete connection setup");
            throw error;
        }
    };

    const addIceCandidate = async (candidate: RTCIceCandidateInit, type: "sender" | "receiver") => {
        console.log(`Adding ICE candidate for ${type}:`, candidate);

        try {
            if (type === "sender") {
                if (receivingPc && receivingPc.remoteDescription) {
                    await receivingPc.addIceCandidate(candidate);
                    console.log("Added ICE candidate to receiving PC");
                } else {
                    console.log("Buffering sender ICE candidate");
                    bufferedCandidatesRef.current.sender.push(candidate);
                }
            } else {
                if (sendingPc && sendingPc.remoteDescription) {
                    await sendingPc.addIceCandidate(candidate);
                    console.log("Added ICE candidate to sending PC");
                } else {
                    console.log("Buffering receiver ICE candidate");
                    bufferedCandidatesRef.current.receiver.push(candidate);
                }
            }
        } catch (error) {
            console.error(`Error adding ICE candidate for ${type}:`, error);
        }
    };

    const replaceTrack = (newTrack: MediaStreamTrack | null, kind: "video" | "audio") => {
        if (!sendingPc || !newTrack) return;

        const sender = sendingPc.getSenders().find((s) => s.track && s.track.kind === kind);
        if (sender) {
            sender.replaceTrack(newTrack);
            console.log(`[WebRTC] Replaced ${kind} track in peer connection`);
        }
    };

    const setSocket = (socket: Socket | null) => {
        socketRef.current = socket;
    };

    return {
        sendingPc,
        receivingPc,
        remoteVideoTrack,
        remoteAudioTrack,
        remoteMediaStream,
        createSendingPeerConnection,
        createReceivingPeerConnection,
        handleAnswer,
        addIceCandidate,
        replaceTrack,
        setSocket,
    };
}; 