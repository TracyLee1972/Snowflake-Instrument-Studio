#pragma once

#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_core/juce_core.h>
#include <map>
#include <vector>
#include "ADSREnvelope.h"
#include "FilterProcessor.h"
#include "EQProcessor.h"

class AudioEngine
{
public:
    AudioEngine();
    ~AudioEngine();

    void prepare(double sampleRate, int blockSize);
    void reset();

    void noteOn(int midiNote, float velocity);
    void noteOff(int midiNote, bool immediate = false);
    void allNotesOff();

    void processAudio(juce::AudioBuffer<float>& buffer, int numSamples);

    // Parameter setters
    void setAttack(float value)           { adsr.setAttack(value); }
    void setDecay(float value)            { adsr.setDecay(value); }
    void setSustain(float value)          { adsr.setSustain(value); }
    void setRelease(float value)          { adsr.setRelease(value); }
    void setMasterVolume(float value)     { masterVolume = juce::jlimit(0.0f, 1.0f, value); }
    void setVelocitySensitivity(float v)  { velocitySens = juce::jlimit(0.0f, 1.0f, v); }
    void setFilterType(int typeIdx)       { filter.setType(typeIdx); }
    void setFilterFrequency(float value)  { filter.setFrequency(value); }
    void setFilterQ(float value)          { filter.setQ(value); }
    void setFilterGain(float value)       { filter.setGain(value); }
    void setEqLow(float db)               { eq.setLowGain(db); }
    void setEqMid(float db)               { eq.setMidGain(db); }
    void setEqHigh(float db)              { eq.setHighGain(db); }
    void setRoundRobinEnabled(bool en)    { roundRobinEnabled = en; }
    void setPitchShift(float semitones)   { pitchShift = semitones; }

    // Sample loading
    void loadSample(int midiNote, const juce::AudioBuffer<float>& audioBuffer);
    void clearSample(int midiNote);
    void clearAllSamples();

private:
    struct VoiceData {
        std::unique_ptr<juce::AudioBuffer<float>> buffer;
        int playPosition = 0;
        float envelope = 0.0f;
        float phase = 0.0f;
        int originalMidiNote = -1;
        float velocityGain = 1.0f;
    };

    std::map<int, std::vector<std::unique_ptr<juce::AudioBuffer<float>>>> samples; // midiNote -> buffers
    std::map<int, VoiceData> activeVoices;

    ADSREnvelope adsr;
    FilterProcessor filter;
    EQProcessor eq;

    double sampleRate = 44100.0;
    int blockSize = 512;
    float masterVolume = 0.8f;
    float velocitySens = 1.0f;
    float pitchShift = 0.0f;
    bool roundRobinEnabled = false;
    
    std::map<int, int> roundRobinIndices; // midiNote -> current RR index

    float getMidiNotePitchShift(int targetNote, int sourceNote) const;
};
