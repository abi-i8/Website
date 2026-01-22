
// State to hold latest gesture data
export const gestureData = {
    isActive: false,
    x: 0, // -1 (left) to 1 (right)
    y: 0, // -1 (up) to 1 (down) 
    zoom: 0, // -1 (far) to 1 (close)7
    isHandDetected: false
};

let hands;
let videoElement;

let animationFrameId;

// Initialize MediaPipe Hands (modified to not use Camera util immediately)
export function initGestures() {
    videoElement = document.querySelector('.input_video');

    hands = new window.Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);
}

// Start/Stop Camera using Native API
export async function toggleGestures(enable) {
    if (enable) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Camera API not supported in this browser context (try localhost or HTTPS).");
            return;
        }

        try {
            if (!hands) initGestures();
            if (!videoElement) videoElement = document.querySelector('.input_video');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: "user" }
            });

            videoElement.srcObject = stream;

            await new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    resolve();
                };
            });

            gestureData.isActive = true;
            console.log("Gestures: ON - Stream active");
            processVideo();

        } catch (err) {
            console.error("Camera Error:", err);
            alert("Camera failed to start: " + err.message + "\nCheck browser permissions.");
        }
    } else {
        gestureData.isActive = false;
        gestureData.isHandDetected = false;

        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        if (videoElement && videoElement.srcObject) {
            const tracks = videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoElement.srcObject = null;
        }

        console.log("Gestures: OFF");
    }
}

async function processVideo() {
    if (!gestureData.isActive) return;

    if (videoElement && hands) {
        // Send video frame to MediaPipe
        await hands.send({ image: videoElement });
    }

    // Loop
    animationFrameId = requestAnimationFrame(processVideo);
}

// Process Hand Data
function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        gestureData.isHandDetected = true;
        const landmarks = results.multiHandLandmarks[0];

        // 1. Position (Center of Palm - Landmark 9)
        // Normalize to -1 to 1 range
        const x = (landmarks[9].x - 0.5) * -2; // Invert X for mirror effect
        const y = (landmarks[9].y - 0.5) * 2;

        // Smoothing could be added here, but direct mapping for responsiveness first
        gestureData.x = x;
        gestureData.y = y;

        // 2. Zoom (Use Area/Width of hand as proxy for distance)
        // Distance between Wrist (0) and Middle Finger Tip (12)
        const v1 = landmarks[0];
        const v2 = landmarks[12];
        const distance = Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));

        // Calibrate: Far ~0.2, Close ~0.7
        // Map to -1 (Far) to 1 (Close)
        // dist: 0.2 -> -1
        // dist: 0.6 -> 1
        let z = (distance - 0.4) * 5;
        gestureData.zoom = Math.max(-1, Math.min(1, z));

    } else {
        gestureData.isHandDetected = false;
    }
}
