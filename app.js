let jsonData = [];
let currentErrorIndex = 0;
let audioPlayer = document.getElementById('audioPlayer');
let playTimeout;  // To track the 20-second playback timeout
let isPlaying = false;  // To track whether the audio is currently playing
let errorCount = 0;  // Track the number of errors
let startTime;  // Track the start time for reviewing errors
let progressStarted = false;  // To ensure progress bar starts after the first action

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
            errorCount = jsonData.length;
            startTime = new Date();  // Record the start time
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
            <h3><span class="text-secondary">Error is:</span><strong> ${errorData.error}</strong></h3>
            <h3><span class="text-secondary">Correct to:</span><strong> ${errorData.suggestion}</strong></h3>
        `;

        errorCarousel.classList.remove('hidden');
        displayVttWindow(errorData);
        showButtons(true);  // Show buttons when reviewing errors
    } else {
        // All errors are done, show the summary screen in the error carousel
        showSummary();
    }
}

// Display current, previous, and next utterances in VTT display
function displayVttWindow(errorData) {
    const vttDisplay = document.getElementById('vttDisplay');
    vttDisplay.innerHTML = `
        <p><span class="text-secondary">${errorData.previous.vtt_timestamp}:</span> ${errorData.previous.utterance}</p>
        <p><span class="text-secondary">${errorData.current.vtt_timestamp}:</span> <span class="highlight">${errorData.current.utterance}</span></p>
        <p><span class="text-secondary">${errorData.next.vtt_timestamp}:</span> ${errorData.next.utterance}</p>
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

// Show or hide buttons (Accept, Dismiss, Play) based on the current state
function showButtons(show) {
    const acceptBtn = document.getElementById('acceptBtn');
    const dismissBtn = document.getElementById('dismissBtn');
    const playBtn = document.getElementById('playBtn');

    if (show) {
        acceptBtn.style.display = 'inline-block';
        dismissBtn.style.display = 'inline-block';
        playBtn.style.display = 'inline-block';
    } else {
        acceptBtn.style.display = 'none';
        dismissBtn.style.display = 'none';
        playBtn.style.display = 'none';
    }
}

// Update progress bar based on the number of reviewed errors
function updateProgressBar() {
    if (!progressStarted) return;  // Don't update until first action

    const progressBar = document.getElementById('progressBar');
    const progressPercentage = ((currentErrorIndex + 1) / errorCount) * 100;

    progressBar.style.width = `${progressPercentage}%`;
    progressBar.setAttribute('aria-valuenow', progressPercentage);
    progressBar.innerText = `${Math.round(progressPercentage)}%`;
}

// Accept or dismiss the current error and move to the next one
document.getElementById('acceptBtn').addEventListener('click', function () {
    if (!progressStarted) {
        progressStarted = true;  // Start progress tracking after first action
    }
    stopPlayback();  // Stop playback when Accept is pressed
    const currentError = jsonData[currentErrorIndex];
    acceptCorrection(currentError.error, currentError.suggestion);
    currentErrorIndex++;
    showError(currentErrorIndex);
    updateProgressBar();  // Update progress bar after action
});

document.getElementById('dismissBtn').addEventListener('click', function () {
    if (!progressStarted) {
        progressStarted = true;  // Start progress tracking after first action
    }
    stopPlayback();  // Stop playback when Dismiss is pressed
    currentErrorIndex++;
    showError(currentErrorIndex);
    updateProgressBar();  // Update progress bar after action
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

// Show summary screen after reviewing all errors in the error carousel
function showSummary() {
    const endTime = new Date();  // Record the end time
    const timeTaken = (endTime - startTime) / 1000;  // Calculate time in seconds
    const timeTakenMinutes = Math.floor(timeTaken / 60);
    const timeTakenSeconds = Math.floor(timeTaken % 60);

    const summaryHtml = `
        <div class="text-center">
            <div class="display-1 text-success mt-3">
                <i class="bi bi-check-circle-fill"></i> <!-- Bootstrap check icon -->
            </div>
            <h2 class="mt-3">Review completed!</h2>
            <p class="lead">You reviewed ${errorCount} errors.</p>
            <p class="text-secondary">It took you ${timeTakenMinutes} minutes and ${timeTakenSeconds} seconds to complete.</p>
            <button id="startOverBtn" class="btn btn-outline-secondary mt-3">Start over</button>
        </div>
    `;

    // Replace error carousel content with the summary
    document.getElementById('errorContent').innerHTML = summaryHtml;

    // Hide buttons when summary is shown
    showButtons(false);

    // Clear VTT window
    document.getElementById('vttDisplay').innerHTML = '';

    // Add event listener to "Start Over" button
    document.getElementById('startOverBtn').addEventListener('click', function () {
        startOver();
    });
}

// Restart the experience
function startOver() {
    currentErrorIndex = 0;  // Reset the current error index
    startTime = new Date();  // Reset the start time
    progressStarted = false;  // Reset progress bar tracking
    showError(currentErrorIndex);  // Show the first error
    document.getElementById('vttDisplay').innerHTML = '';  // Clear VTT display
    updateProgressBar();  // Reset progress bar to 0%
}
