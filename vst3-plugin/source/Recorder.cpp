#include "Recorder.h"
#include <cmath>
#include <algorithm>

Recorder::Recorder(AudioEngine& engine)
    : audioEngine(engine), recording(false), playing(false), 
      recordStartTime(0.0), playbackTime(0.0), nextEventIndex(0)
{
}

Recorder::~Recorder()
{
    stopPlayback();
    stopTimer();
}

void Recorder::startRecording()
{
    if (recording) return;
    events.clear();
    recording = true;
    recordStartTime = juce::Time::getMillisecondCounterHiRes() / 1000.0;
}

void Recorder::stopRecording()
{
    recording = false;
}

void Recorder::clearRecording()
{
    events.clear();
    recordStartTime = 0.0;
    nextEventIndex = 0;
}

void Recorder::recordNoteOn(int midiNote, float velocity)
{
    if (!recording) return;
    double currentTime = juce::Time::getMillisecondCounterHiRes() / 1000.0 - recordStartTime;
    events.push_back({ currentTime, midiNote, velocity, true });
}

void Recorder::recordNoteOff(int midiNote)
{
    if (!recording) return;
    double currentTime = juce::Time::getMillisecondCounterHiRes() / 1000.0 - recordStartTime;
    events.push_back({ currentTime, midiNote, 0.0f, false });
}

void Recorder::startPlayback()
{
    if (playing || events.empty()) return;
    playing = true;
    playbackTime = 0.0;
    nextEventIndex = 0;
    audioEngine.allNotesOff();

    // Start timer to process playback events (10ms intervals)
    startTimer(10);
}

void Recorder::stopPlayback()
{
    if (!playing) return;
    playing = false;
    audioEngine.allNotesOff();
    playbackTime = 0.0;
    nextEventIndex = 0;
    stopTimer();
}

void Recorder::setPlaybackPosition(double time)
{
    playbackTime = juce::jlimit(0.0, getRecordingDuration(), time);
    nextEventIndex = 0;
    
    // Find next event to play
    for (size_t i = 0; i < events.size(); ++i)
    {
        if (events[i].time >= playbackTime)
        {
            nextEventIndex = i;
            break;
        }
    }
}

double Recorder::getRecordingDuration() const
{
    if (events.empty()) return 0.0;
    return events.back().time;
}

void Recorder::timerCallback()
{
    if (!playing || events.empty())
    {
        stopPlayback();
        return;
    }

    processPlayback();
}

void Recorder::processPlayback()
{
    double maxPlaybackTime = getRecordingDuration();
    
    // Process all events that should happen in the next time slice
    while (nextEventIndex < events.size() && events[nextEventIndex].time <= playbackTime)
    {
        const auto& ev = events[nextEventIndex];
        
        if (ev.isNoteOn)
            audioEngine.noteOn(ev.note, ev.velocity);
        else
            audioEngine.noteOff(ev.note);
        
        nextEventIndex++;
    }

    playbackTime += 0.01; // 10ms per timer callback

    // Stop playback when we reach the end + 2 second tail
    if (playbackTime > maxPlaybackTime + 2.0)
    {
        stopPlayback();
    }
}

bool Recorder::exportToWAV(const juce::File& outputFile, float tailDuration)
{
    if (events.empty()) return false;

    try
    {
        // Calculate total duration
        double recordingDuration = getRecordingDuration();
        double totalDuration = recordingDuration + tailDuration;
        int sampleRate = 44100;
        int numSamples = static_cast<int>(totalDuration * sampleRate);

        // Create offline audio buffer
        juce::AudioBuffer<float> buffer(2, numSamples);
        buffer.clear();

        // Simulate playback to render audio
        audioEngine.allNotesOff();
        double currentTime = 0.0;
        size_t eventIndex = 0;
        int blockSize = 512;

        for (int pos = 0; pos < numSamples; pos += blockSize)
        {
            int blockSamples = juce::jmin(blockSize, numSamples - pos);
            
            // Schedule events that fall in this block
            while (eventIndex < events.size() && events[eventIndex].time <= currentTime)
            {
                const auto& ev = events[eventIndex];
                if (ev.isNoteOn)
                    audioEngine.noteOn(ev.note, ev.velocity);
                else
                    audioEngine.noteOff(ev.note);
                eventIndex++;
            }

            // Render audio
            auto blockBuffer = buffer.getSubsetChannelDataPointers({ 0, 1 }, pos, blockSamples);
            audioEngine.processAudio(buffer, blockSamples);
            currentTime += blockSamples / static_cast<double>(sampleRate);
        }

        // Write to WAV file
        juce::WavAudioFormat wavFormat;
        std::unique_ptr<juce::AudioFormatWriter> writer(
            wavFormat.createWriterFor(
                new juce::FileOutputStream(outputFile),
                static_cast<double>(sampleRate),
                2,  // 2 channels (stereo)
                16, // 16-bit
                {},
                0
            )
        );

        if (!writer)
            return false;

        writer->writeFromAudioSampleBuffer(buffer, 0, numSamples);
        writer->flush();

        return outputFile.existsAsFile();
    }
    catch (const std::exception&)
    {
        return false;
    }
}
        {
            int samplePos = static_cast<int>(ev.time * sampleRate);
            if (samplePos < numSamples)
            {
                if (ev.isNoteOn)
                    audioEngine.noteOn(ev.note, ev.velocity);
                else
                    audioEngine.noteOff(ev.note);
            }
        }

        // Render audio (simplified - in production use proper offline rendering)
        // For now, this is a placeholder showing the structure
        
        // Write WAV file
        std::unique_ptr<juce::AudioFormat> wavFormat(new juce::WavAudioFormat());
        std::unique_ptr<juce::FileOutputStream> fileStream(new juce::FileOutputStream(outputFile));

        if (!fileStream->openedOk()) return false;

        std::unique_ptr<juce::AudioFormatWriter> writer(
            wavFormat->createWriterFor(fileStream.get(), sampleRate, 2, 16, {}, 0)
        );

        if (writer)
        {
            writer->writeFromAudioSampleBuffer(buffer, 0, numSamples);
            fileStream.release();
            writer.release();
            return true;
        }

        return false;
    }
    catch (...)
    {
        return false;
    }
}
