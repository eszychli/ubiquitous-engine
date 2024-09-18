let jsonData = [];
let currentErrorIndex = 0;

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
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.src = mp4File;
    audioPlayer.load();
}

// Show error on carousel (one at a time)
function showError(index) {
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
        syncAudio(errorData.mp4_timestamp);
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

// Sync the MP4 audio player to the correct timestamp
function syncAudio(timestamp) {
    const audioPlayer = document.getElementById('audioPlayer');
    
    // Check if timestamp is valid before setting currentTime
    if (!isNaN(timestamp) && audioPlayer.readyState > 0) {
        audioPlayer.currentTime = timestamp;
    }
    audioPlayer.play();
}

// Accept or dismiss the current error and move to the next one
document.getElementById('acceptBtn').addEventListener('click', function () {
    const currentError = jsonData[currentErrorIndex];
    acceptCorrection(currentError.error, currentError.suggestion);
    currentErrorIndex++;
    showError(currentErrorIndex);
});

document.getElementById('dismissBtn').addEventListener('click', function () {
    currentErrorIndex++;
    showError(currentErrorIndex);
});

// Accept the correction by replacing the error with the suggestion in the displayed VTT window
function acceptCorrection(errorWord, suggestion) {
    const highlightedElement = document.querySelector('.highlight');
    if (highlightedElement) {
        highlightedElement.textContent = highlightedElement.textContent.replace(errorWord, suggestion);
    }
}
