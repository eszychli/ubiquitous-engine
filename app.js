let jsonData = [];
let currentErrorIndex = 0;
let audioPlayer = document.getElementById('audioPlayer');
let playTimeout;  // To track the 20-second playback timeout
let isPlaying = false;  // To track whether the audio is currently playing

// Dropdown to select meeting and load files
document.getElementById('meetingSelect').addEventListener('change', function (event) {
    const selectedMeeting = event.target.value;

    if (selectedMeeting === 'meeting1') {
        loadMeetingData('meetings/sample_1.json', 'https://github.com/eszychli/ubiquitous-engine/raw/main/meetings/audio_1.aac');
    } else if (selectedMeeting === 'meeting2') {
        loadMeetingData('meetings/sample_2.json', 'https://github.com/eszychli/ubiquitous-engine/raw/main/meetings/audio_1.aac');
    }
});

// Function to load JSON data and MP4 file based on meeting
function loadMeetingData(jsonFile, mp4File) {
    // Load JSON file
    fetch(jsonFile)
        .then(response => response.json())
        .then(data => {
            jsonData = data;
            currentErrorIndex = 0;
            showError(currentErrorIndex);
        })
        .catch(error => {
            console.error('Error loading JSON:', error);
        });

    // Load MP4 file
    audioPlayer.src = mp4File;

    // Force the player to load the file
    audioPlayer.load();
}

// Show error on carousel (one at a time)
function showError(index) {
    stopPlayback();  // Stop playback when switching errors
    if (index >= 0 && index < jsonData.length) {
        const errorData = jsonData[index];
        const errorContent = document.getElementById('errorContent');
        const errorCarousel = document.getElementById('errorCarousel');

        errorContent.innerHTML = `
            <p><strong>Error:</strong> ${errorData.error}</p>
            <p><strong>Suggested Correction:</strong> ${errorData.suggestion}</p>
        `;

        errorCarousel.classList.remove('hidden');
        displayVttWindow(errorData);
    } else {
        document.getElementById('errorCarousel').classList.add('hidden');
        alert('No more errors.');
    }
}

// Display current, previous, and next utterances in VTT display
function displayVttWindow(errorData) {
    const vttDisplay = document.getElementById('vttDisplay');
    vttDisplay.innerHTML = `
        <p><strong>Previous Utterance (${errorData.previous.vtt_timestamp}):</strong> ${errorData.previous.utterance}</p>
        <p><strong>Current Utterance (${errorData.current.vtt_timestamp}):</strong> <span class="highlight">${errorData.current.utterance}</span></p>
        <p><strong>Next Utterance (${errorData.next.vtt_timestamp}):</strong> ${errorData.next.utterance}</p>
    `;

    // Scroll to the current utterance
    const highlightedElement = document.querySelector('.highlight');
    if (highlightedElement) {
        highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Sync the MP4 audio player to the correct timestamp and play for 20 seconds
function playAudioFromTimestamp(timestamp) {
    audioPlayer.currentTime = timestamp;  // Seek to the specified timestamp
    audioPlayer.play();
    togglePlayButton(true);  // Change "Play" to "Stop"
    isPlaying = true;

    // Stop the audio after 20 seconds
    clearTimeout(playTimeout);  // Clear any previous timeout
    playTimeout = setTimeout(() => {
        stopPlayback();  // Pause after 20 seconds
    }, 20000);  // 20 seconds = 20,000 milliseconds
}

// Stop the audio playback and reset
function stopPlayback() {
    if (isPlaying) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;  // Optionally reset to the beginning
        clearTimeout(playTimeout);  // Clear the timeout for playback
        togglePlayButton(false);  // Change "Stop" to "Play"
        isPlaying = false;
    }
}

// Toggle the "Play" and "Stop" button
function togglePlayButton(isPlaying) {
    const playButton = document.getElementById('playBtn');
    if (isPlaying) {
        playButton.textContent = 'Stop';
    } else {
        playButton.textContent = 'Play';
    }
}

// Accept or dismiss the current error and move to the next one
document.getElementById('acceptBtn').addEventListener('click', function () {
    stopPlayback();  // Stop playback when Accept is pressed
    const currentError = jsonData[currentErrorIndex];
    acceptCorrection(currentError.error, currentError.suggestion);
    currentErrorIndex++;
    showError(currentErrorIndex);
});

document.getElementById('dismissBtn').addEventListener('click', function () {
    stopPlayback();  // Stop playback when Dismiss is pressed
    currentErrorIndex++;
    showError(currentErrorIndex);
});

// Play button to play the audio from the current error's timestamp for 20 seconds
document.getElementById('playBtn').addEventListener('click', function () {
    if (isPlaying) {
        stopPlayback();  // Stop if it's already playing
    } else {
        const currentError = jsonData[currentErrorIndex];
        const timestamp = currentError.mp4_timestamp;
        playAudioFromTimestamp(timestamp);
    }
});

// Accept the correction by replacing the error with the suggestion in the displayed VTT window
function acceptCorrection(errorWord, suggestion) {
    const highlightedElement = document.querySelector('.highlight');
    if (highlightedElement) {
        highlightedElement.textContent = highlightedElement.textContent.replace(errorWord, suggestion);
    }
}
