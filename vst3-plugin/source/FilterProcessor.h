#pragma once

#include <juce_audio_basics/juce_audio_basics.h>

class FilterProcessor
{
public:
    FilterProcessor();
    ~FilterProcessor() = default;

    void setSampleRate(double sr);
    void setType(int typeIdx);     // 0=lowpass, 1=highpass, 2=bandpass, 3=notch
    void setFrequency(float freq);
    void setQ(float q);
    void setGain(float gain);

    void process(juce::AudioBuffer<float>& buffer);

private:
    juce::IIRFilter leftFilter, rightFilter;
    int filterType = 0;
    float frequency = 20000.0f;
    float Q = 1.0f;
    float gain = 0.0f;
    double sampleRate = 44100.0;

    void updateCoefficients();
};
