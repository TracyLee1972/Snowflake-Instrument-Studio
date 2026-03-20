#pragma once

#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_core/juce_core.h>
#include <map>
#include <vector>
#include <memory>

class SampleManager
{
public:
    SampleManager();
    ~SampleManager();

    void loadSample(int midiNote, const juce::File& file);
    void clear();

private:
    // Map of MIDI note -> vector of audio buffers for round-robin
    std::map<int, std::vector<std::unique_ptr<juce::AudioBuffer<float>>>> sampleData;
};
