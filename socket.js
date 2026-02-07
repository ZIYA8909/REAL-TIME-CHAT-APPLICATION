import io from "socket.io-client";

// Connect to the backend server running on port 3001
export const socket = io.connect("http://localhost:3001");