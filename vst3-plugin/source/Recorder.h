#pragma once

#include <juce_core/juce_core.h>
#include <vector>
#include "AudioEngine.h"

class Recorder : private juce::Timer
{
public:
    Recorder(AudioEngine& engine);
    ~Recorder() override;

    // Recording control
    void startRecording();
    void stopRecording();
    void clearRecording();
    bool isRecording() const { return recording; }

    // Playback
    void startPlayback();
    void stopPlayback();
    bool isPlaying() const { return playing; }

    // Record events
    void recordNoteOn(int midiNote, float velocity);
    void recordNoteOff(int midiNote);

    // Export
    bool exportToWAV(const juce::File& outputFile, float duration = 10.0f);

    // Get info
    int getNumEvents() const { return static_cast<int>(events.size()); }
    double getRecordingDuration() const;

    // Playback control
    void setPlaybackPosition(double time);
    double getPlaybackPosition() const { return playbackTime; }

private:
    struct RecordedEvent {
        double time = 0.0;
        int note = 0;
        float velocity = 0.0f;
        bool isNoteOn = true;
    };

    AudioEngine& audioEngine;
    std::vector<RecordedEvent> events;

    bool recording = false;
    bool playing = false;
    double recordStartTime = 0.0;
    double playbackTime = 0.0;
    size_t nextEventIndex = 0;

    void timerCallback() override;
    void processPlayback();
};
