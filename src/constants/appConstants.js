const aspectRatioMap = {
    1.0: "Cropper Aspect Ratio 1:1",
    1.33: "Cropper Aspect Ratio 4:3",
    1.77: "Cropper Aspect Ratio 16:9",
    2.0: "Cropper Aspect Ratio 16:8",
    0.56: "Cropper Aspect Ratio 9:16",
    0.75: "Cropper Aspect Ratio 3:4"
};

const playbackSpeedMap = {
    0.5: "Playback speed 0.5x",
    1.0: "Playback speed 1x",
    1.5: "Playback speed 1.5x",
    2.0: "Playback speed 2x"
}

const previewMessage = {
    MESSAGE : `Please click on "Start Cropper" and then play video`,
    NOT_AVAILABLE: `Preview not available`
}

export { aspectRatioMap, playbackSpeedMap, previewMessage }