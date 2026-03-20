#pragma once

#include <juce_core/juce_core.h>
#include <vector>
#include <map>

class ADSREnvelope
{
public:
    ADSREnvelope();
    ~ADSREnvelope() = default;

    void setSampleRate(double sr) { sampleRate = juce::jmax(1000.0, sr); } // Minimum 1kHz
    void setAttack(float ms)   { attack = juce::jmax(0.001f, ms); }  // Minimum 1ms
    void setDecay(float ms)    { decay = juce::jmax(0.001f, ms); }   // Minimum 1ms
    void setSustain(float val) { sustain = juce::jlimit(0.0f, 1.0f, val); }
    void setRelease(float ms)  { release = juce::jmax(0.001f, ms); } // Minimum 1ms

    void noteOn(int voiceId);
    void noteOff(int voiceId);
    
    std::vector<float>& process(int numSamples);
    int getNoteIndex(int voiceId) const;

private:
    struct Voice {
        int state = 0; // 0=idle, 1=attack, 2=decay, 3=sustain, 4=release
        float level = 0.0f;
        int sampleCount = 0;
        double startTime = 0.0;
    };

    double sampleRate = 44100.0;
    float attack = 0.01f;   // seconds
    float decay = 0.1f;
    float sustain = 0.8f;
    float release = 0.3f;

    std::map<int, Voice> voices;
    std::vector<float> output;
};
