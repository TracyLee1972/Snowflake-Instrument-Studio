#pragma once

#include <juce_audio_basics/juce_audio_basics.h>

class EQProcessor
{
public:
    EQProcessor();
    ~EQProcessor() = default;

    void setSampleRate(double sr);
    void setLowGain(float db);
    void setMidGain(float db);
    void setHighGain(float db);

    void process(juce::AudioBuffer<float>& buffer);

private:
    juce::IIRFilter lowFilters[2];   // Left/Right
    juce::IIRFilter midFilters[2];
    juce::IIRFilter highFilters[2];

    float lowGain = 0.0f;
    float midGain = 0.0f;
    float highGain = 0.0f;
    double sampleRate = 44100.0;

    void updateCoefficients();
};
