
import React, { useEffect, useRef, useState } from 'react'

import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import { Button, Slider } from '@mui/material'

import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import volume from "../icons/volume.svg"
import previewIcon from "../icons/preview.svg"

import "./cropper.css"
import { aspectRatioMap, playbackSpeedMap, previewMessage } from "../constants/appConstants"
const Cropper = () => {

    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const [currentTime, setCurrentTime] = useState(0)
    const [playStatus, setPlayStatus] = useState(null)
    const [duration, setDuration] = useState(0)
    const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [dragging, setDragging] = useState(false)
    const [aspectRatio, setAspectRatio] = useState(1.77)
    const [showCropper, setShowCropper] = useState(false)
    const [recordedData, setRecordedData] = useState([])
    const [volumeLevel, setVolumeLevel] = useState(.5)
    const videoRef = useRef(null)
    const progressRef = useRef(null)
    const canvasRef = useRef(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        const wrapper = document.getElementById("wrapper-video")
        const wrapperWidth = wrapper.offsetWidth
        const wrapperHeight = wrapper.offsetHeight

        video.onloadedmetadata = () => {
            updateCropBox(wrapperWidth, wrapperHeight, aspectRatio)
            setCurrentTime(video.currentTime)
            setDuration(video.duration || 0)
        }

        const updateProgress = () => setCurrentTime(video.currentTime)
        video.addEventListener("timeupdate", updateProgress)
        return () => video.removeEventListener("timeupdate", updateProgress)
    }, [])


    const updateCropBox = (wrapperWidth, wrapperHeight, aspectRatio) => {
        const overlay = document.getElementById("overlay")
        if (!overlay) return

        let newWidth, newHeight
        newHeight = wrapperHeight
        if (wrapperWidth / wrapperHeight > aspectRatio) {

            newWidth = newHeight * aspectRatio
        } else {
            newWidth = wrapperWidth
        }

        newWidth = Math.min(newWidth, wrapperWidth)

        const newX = (wrapperWidth - newWidth) / 2
        const newY = 0

        setCropBox({ x: newX, y: newY, width: newWidth, height: wrapperHeight })

        overlay.style.width = `${newWidth}px`
        overlay.style.height = `${newHeight}px`
        overlay.style.left = `${newX}px`
        overlay.style.top = `${newY}px`
    }

    const handlePlaybackSpeed = (event) => {
        const newSpeed = Number(event.target.value)
        setPlaybackSpeed(newSpeed)
        videoRef.current.playbackRate = newSpeed
    }


    const handleAspectRatioChange = (event) => {
        const newRatio = parseFloat(event.target.value)
        setAspectRatio(newRatio)

        const wrapper = document.getElementById("wrapper-video")
        if (wrapper) {
            updateCropBox(wrapper.offsetWidth, wrapper.offsetHeight, newRatio)
        }
    }


    const startDrag = (event) => {
        event.preventDefault()
        setDragging(true)

        const startX = event.clientX
        const startY = event.clientY
        const { x, y, width, height } = cropBox

        const wrapper = document.getElementById("wrapper-video")
        const wrapperWidth = wrapper.offsetWidth
        const wrapperHeight = wrapper.offsetHeight

        const onMouseMove = (e) => {

            const dx = e.clientX - startX
            const dy = e.clientY - startY

            let newX = x + dx
            let newY = y + dy

            newX = Math.max(0, Math.min(wrapperWidth - width, newX))
            newY = Math.max(0, Math.min(wrapperHeight - height, newY))

            setCropBox({ x: newX, y: newY, width, height })

            const overlay = document.getElementById("overlay")
            if (overlay) {
                overlay.style.left = `${newX}px`
                overlay.style.top = `${newY}px`
            }
        }

        const onMouseUp = () => {
            setDragging(false)
            document.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseup", onMouseUp)
        }

        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
    }


    useEffect(() => {
        if (dragging) {
            setRecordedData(prevData => [
                ...prevData,
                {
                    timeStamp: currentTime,
                    coordinates: [cropBox.x, cropBox.y, cropBox.width, cropBox.height],
                    volumeLevel,
                    playbackRate: playbackSpeed
                }
            ])
        }
    }, [dragging])

    const handlePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play()
            document.getElementById("canvas").style.display = "grid"
            document.querySelector(".preview-message").style.display = "none"
            setPlayStatus("play")
            if (showCropper) {
                showCroppedPreview()
            }
        }
        else {
            videoRef.current.pause()
            setPlayStatus("pause")
        }
    }

    const handleProgressClick = (e) => {
        const progressBar = progressRef.current
        const rect = progressBar.getBoundingClientRect()
        const offsetX = e.clientX - rect.left // Click position inside progress bar
        const newTime = (offsetX / rect.width) * duration // Calculate new time
        videoRef.current.currentTime = newTime
        setCurrentTime(newTime)
    }

    const formatTime = (time) => {
        if (isNaN(time)) return "00:00:00"

        const hours = Math.floor(time / 3600)
        const minutes = Math.floor((time % 3600) / 60)
        const seconds = Math.floor(time % 60)

        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    const handleVolumeChange = (e) => {
        const newVolume = Number((e.target.value) * .01)
        const video = videoRef.current
        video.volume = newVolume
        setVolumeLevel(newVolume)
    }

    const handleStartCropper = () => {
        setShowCropper(true)
        const overlay = document.getElementById("overlay")
        overlay.style.display = "grid"
    }

    const handleRemoveCropper = () => {
        setShowCropper(false)
        const overlay = document.getElementById("overlay")
        overlay.style.display = "none"
        const canvasDiv = document.getElementById("canvas")
        canvasDiv.style.display = "none"

        document.querySelector(".preview-message").style.display = "block"

        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext("2d")
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
    }


    const updateCropPreview = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        if (!video || !ctx) return

        const { x, y, width, height } = cropBox

        const videoRect = video.getBoundingClientRect()
        const scaleX = video.videoWidth / videoRect.width
        const scaleY = video.videoHeight / videoRect.height

        const sourceX = x * scaleX
        const sourceY = y * scaleY
        const sourceWidth = width * scaleX
        const sourceHeight = height * scaleY

        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        canvas.width = width
        canvas.height = height

        ctx.drawImage(
            video,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, width, height
        )

        requestAnimationFrame(updateCropPreview)
    }


    const showCroppedPreview = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return

        document.querySelector(".preview-message").style.display = "none"
        const canvasDiv = document.getElementById("canvas")
        canvasDiv.style.display = "block"

        canvas.width = cropBox.width
        canvas.height = cropBox.height

        requestAnimationFrame(updateCropPreview)
    }


    const downloadJsonData = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recordedData, null, 2))
        const downloadAnchor = document.createElement('a')
        downloadAnchor.href = dataStr
        downloadAnchor.download = "cropper_data.json"
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        document.body.removeChild(downloadAnchor)
    };


    const handlePlayFromJson = async () => {
        if (!videoRef.current) return;

        for (const data of recordedData) {
            const { timeStamp, coordinates, volumeLevel, playbackRate } = data;

            videoRef.current.currentTime = timeStamp;
            videoRef.current.volume = volumeLevel;
            videoRef.current.playbackRate = playbackRate;
            videoRef.current.play();

            setCropBox({
                x: coordinates[0],
                y: coordinates[1],
                width: coordinates[2],
                height: coordinates[3]
            });

            showCroppedPreview();

            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before next timestamp
        }
        videoRef.current.pause();

    }

    const handleCancel = () => {
        setPlaybackSpeed(1);
        setPlayStatus(null);
        setCurrentTime(0);
        setDuration(0);
        setAspectRatio(1.77);
        setCropBox({ x: 0, y: 0, width: 0, height: 0 });
        setShowCropper(false);
        setRecordedData([])

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            videoRef.current.playbackRate = 1;
            videoRef.current.volume = 1;
        }

        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }

        document.getElementById("overlay").style.display = "none"
        document.querySelector(".preview-message").style.display = "block"
        document.getElementById("canvas").style.display = "none"
    };


    return (
        <div className='container'>
            <div className='cropper-container' >
                <div className='cropper-header'>
                    <h1 className='heading'>Cropper</h1>
                </div>
                <div className='video-container'>
                    <div className='video-section'>
                        <div className='video-content'>
                            <div id="wrapper-video">
                                <video ref={videoRef} src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" id="video" autoplay="false" />
                            </div>
                            <div
                                id="overlay"
                                onMouseDown={startDrag}
                            >
                                <div></div><div></div><div></div>
                                <div></div><div></div><div></div>
                                <div></div><div></div><div></div>
                            </div>

                        </div>
                        <div className='play-slider'>
                            <div>
                                {playStatus === "play" ? <PauseIcon onClick={handlePlay} htmlColor='#FFFFFF' fontSize='large' /> : <PlayArrowIcon id="play-arrow" fontSize='large' onClick={handlePlay} htmlColor='#FFFFFF' />}
                            </div>
                            <div className="progress-container" onClick={handleProgressClick} ref={progressRef}>
                                <div className="progress-bar" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }} ></div>
                            </div>

                        </div>
                        <div className='currTime-elapseTime'>
                            <div style={{ textAlign: "center" }}>
                                <span> <span style={{ color: "#FFFFFF" }}>{formatTime(currentTime)} </span>  <span style={{ color: "#FFFFFF80" }}>|</span> <span style={{ color: "#FFFFFF80" }}>{formatTime(duration)}</span></span>
                            </div>
                            <div className='volume-container'>
                                <img src={volume} alt="volume" />
                                <Slider defaultValue={50} aria-label="Default" onChange={(e) => handleVolumeChange(e)} />
                            </div>
                        </div>

                        <div className='video-action-item'>
                            <FormControl>
                                <Select
                                    value={playbackSpeed}
                                    onChange={handlePlaybackSpeed}
                                    displayEmpty
                                    inputProps={{ 'aria-label': 'playback speed' }}
                                    className='playbackspeed'
                                >
                                    {Object.entries(playbackSpeedMap).map(([value, label]) => (
                                        <MenuItem key={value} value={parseFloat(value)}>
                                            {label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <Select
                                    value={aspectRatio}
                                    onChange={handleAspectRatioChange}
                                    displayEmpty
                                    inputProps={{ 'aria-label': 'aspect ratio' }}
                                    className='aspect-ratio'
                                >
                                    {Object.entries(aspectRatioMap).map(([value, label]) => (
                                        <MenuItem key={value} value={parseFloat(value)}>
                                            {label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>
                    </div>

                    <div className='preview-section'>
                        <div className='preview-header'> Preview</div>
                        <div className='preview-message'>
                            <div><img src={previewIcon} width={24} height={20} alt='preview-icon' ></img></div>
                            <div><span style={{ fontSize: "12px", fontWeight: 700, color: "#FFFFFF" }}>{previewMessage.NOT_AVAILABLE}</span></div>
                            <div><span style={{ fontSize: "12px", fontWeight: 500, color: "#FFFFFF80", textAlign: "center" }}>{previewMessage.MESSAGE}</span></div>
                        </div>
                        <div id="canvas-container">
                            <canvas ref={canvasRef} id="canvas"></canvas>
                        </div>
                    </div>
                </div>

                <div className='cropper-action-items'>
                    <div className='cropper-action-items-button'>
                        <Button className='cropper-button' onClick={handleStartCropper}>Start Cropper </Button>
                        <Button className='cropper-button' onClick={handleRemoveCropper} >Remove Cropper </Button>
                        <Button className='cropper-button' onClick={downloadJsonData}>Generate Preview</Button>
                        <Button className='cropper-button' onClick={handlePlayFromJson}>Generate Session</Button>
                    </div>
                    <div className='cropper-action-cancel-button'>
                        <Button className='cancel-button' onClick={handleCancel}>Cancel</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export { Cropper }


