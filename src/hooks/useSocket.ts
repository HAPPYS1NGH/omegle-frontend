import { useState, useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";

const URL = "http://localhost:3000";

interface UseSocketProps {
    name: string;
    onSendOffer: (data: { roomId: string }) => void;
    onOffer: (data: { roomId: string; sdp: RTCSessionDescriptionInit }) => void;
    onAnswer: (data: { roomId: string; sdp: RTCSessionDescriptionInit }) => void;
    onLobby: () => void;
    onAddIceCandidate: (data: { candidate: RTCIceCandidateInit; type: "sender" | "receiver" }) => void;
    setConnectionError: (error: string | null) => void;
}

export const useSocket = ({
    name,
    onSendOffer,
    onOffer,
    onAnswer,
    onLobby,
    onAddIceCandidate,
    setConnectionError,
}: UseSocketProps) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    // Use refs to store current callback functions to avoid re-creating socket
    const callbacksRef = useRef({
        onSendOffer,
        onOffer,
        onAnswer,
        onLobby,
        onAddIceCandidate,
        setConnectionError,
    });

    // Update refs when callbacks change
    useEffect(() => {
        callbacksRef.current = {
            onSendOffer,
            onOffer,
            onAnswer,
            onLobby,
            onAddIceCandidate,
            setConnectionError,
        };
    }, [onSendOffer, onOffer, onAnswer, onLobby, onAddIceCandidate, setConnectionError]);

    useEffect(() => {
        console.log("Creating new socket connection...");
        const socketInstance = io(URL, {
            // Match backend configuration
            transports: ['websocket', 'polling'],
            timeout: 30000,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            autoConnect: true,
            forceNew: false,
            // Add CORS credentials if needed
            withCredentials: true,
        });

        // Add socket connection error handling
        socketInstance.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            callbacksRef.current.setConnectionError(`Server connection failed: ${err.message}`);
        });

        socketInstance.on("connect", () => {
            console.log("Socket connected successfully with ID:", socketInstance.id);
            callbacksRef.current.setConnectionError(null);
        });

        socketInstance.on("disconnect", (reason) => {
            console.log(`Socket disconnected: ${reason}`);
            if (reason === "io server disconnect") {
                callbacksRef.current.setConnectionError("Server disconnected");
            }
        });

        // Add reconnection handlers
        socketInstance.on("reconnect", (attemptNumber) => {
            console.log(`Socket reconnected after ${attemptNumber} attempts`);
            callbacksRef.current.setConnectionError(null);
        });

        socketInstance.on("reconnect_attempt", (attemptNumber) => {
            console.log(`Socket reconnection attempt ${attemptNumber}`);
        });

        socketInstance.on("reconnect_failed", () => {
            console.error("Socket reconnection failed");
            callbacksRef.current.setConnectionError("Reconnection failed");
        });

        // Set up event listeners using refs
        socketInstance.on("send-offer", (data) => {
            console.log("Received send-offer event:", data);
            callbacksRef.current.onSendOffer(data);
        });

        socketInstance.on("offer", (data) => {
            console.log("Received offer event:", data);
            callbacksRef.current.onOffer(data);
        });

        socketInstance.on("answer", (data) => {
            console.log("Received answer event:", data);
            callbacksRef.current.onAnswer(data);
        });

        socketInstance.on("lobby", () => {
            console.log("Received lobby event");
            callbacksRef.current.onLobby();
        });

        socketInstance.on("add-ice-candidate", (data) => {
            console.log("Received add-ice-candidate event:", data);
            callbacksRef.current.onAddIceCandidate(data);
        });

        setSocket(socketInstance);

        return () => {
            console.log("Cleaning up socket connection...");
            socketInstance.removeAllListeners();
            socketInstance.disconnect();
        };
    }, [name]); // Only depend on name, not the callback functions

    return socket;
}; 