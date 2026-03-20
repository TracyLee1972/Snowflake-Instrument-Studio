#include "FilterProcessor.h"

FilterProcessor::FilterProcessor()
    : filterType(0), frequency(20000.0f), Q(1.0f), gain(0.0f)
{
}

void FilterProcessor::setSampleRate(double sr)
{
    sampleRate = sr;
    updateCoefficients();
}

void FilterProcessor::setType(int typeIdx)
{
    filterType = typeIdx;
    updateCoefficients();
}

void FilterProcessor::setFrequency(float freq)
{
    frequency = juce::jlimit(20.0f, 20000.0f, freq);
    updateCoefficients();
}

void FilterProcessor::setQ(float q)
{
    Q = juce::jlimit(0.1f, 20.0f, q);
    updateCoefficients();
}

void FilterProcessor::setGain(float g)
{
    gain = juce::jlimit(-24.0f, 24.0f, g);
    updateCoefficients();
}

void FilterProcessor::updateCoefficients()
{
    double A = std::pow(10.0, gain / 40.0);
    double w0 = 2.0 * M_PI * frequency / sampleRate;
    double sinW0 = std::sin(w0);
    double cosW0 = std::cos(w0);
    double alpha = sinW0 / (2.0 * Q);

    double b0, b1, b2, a0, a1, a2;

    switch (filterType)
    {
        case 0: // Low Pass
            b0 = (1.0 - cosW0) / 2.0;
            b1 = 1.0 - cosW0;
            b2 = (1.0 - cosW0) / 2.0;
            a0 = 1.0 + alpha;
            a1 = -2.0 * cosW0;
            a2 = 1.0 - alpha;
            break;

        case 1: // High Pass
            b0 = (1.0 + cosW0) / 2.0;
            b1 = -(1.0 + cosW0);
            b2 = (1.0 + cosW0) / 2.0;
            a0 = 1.0 + alpha;
            a1 = -2.0 * cosW0;
            a2 = 1.0 - alpha;
            break;

        case 2: // Band Pass
            b0 = alpha;
            b1 = 0;
            b2 = -alpha;
            a0 = 1.0 + alpha;
            a1 = -2.0 * cosW0;
            a2 = 1.0 - alpha;
            break;

        case 3: // Notch
            b0 = 1;
            b1 = -2.0 * cosW0;
            b2 = 1;
            a0 = 1.0 + alpha;
            a1 = -2.0 * cosW0;
            a2 = 1.0 - alpha;
            break;

        default:
            return;
    }

    juce::IIRCoefficients coeffs(b0 / a0, b1 / a0, b2 / a0, 1.0, a1 / a0, a2 / a0);
    leftFilter.setCoefficients(coeffs);
    rightFilter.setCoefficients(coeffs);
}

void FilterProcessor::process(juce::AudioBuffer<float>& buffer)
{
    if (buffer.getNumChannels() >= 1)
        leftFilter.processSamples(buffer.getWritePointer(0), buffer.getNumSamples());

    if (buffer.getNumChannels() >= 2)
        rightFilter.processSamples(buffer.getWritePointer(1), buffer.getNumSamples());
}
