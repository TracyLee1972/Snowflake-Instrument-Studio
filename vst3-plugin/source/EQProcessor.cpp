#include "EQProcessor.h"
#include <cmath>

EQProcessor::EQProcessor()
    : lowGain(0.0f), midGain(0.0f), highGain(0.0f)
{
}

void EQProcessor::setSampleRate(double sr)
{
    sampleRate = sr;
    updateCoefficients();
}

void EQProcessor::setLowGain(float db)
{
    lowGain = juce::jlimit(-12.0f, 12.0f, db);
    updateCoefficients();
}

void EQProcessor::setMidGain(float db)
{
    midGain = juce::jlimit(-12.0f, 12.0f, db);
    updateCoefficients();
}

void EQProcessor::setHighGain(float db)
{
    highGain = juce::jlimit(-12.0f, 12.0f, db);
    updateCoefficients();
}

void EQProcessor::updateCoefficients()
{
    // Low-shelf at 250 Hz
    double A_low = std::pow(10.0, lowGain / 40.0);
    double w0_low = 2.0 * M_PI * 250.0 / sampleRate;
    double alpha_low = std::sin(w0_low) / (2.0 * 0.707);
    double b0_low = A_low * ((A_low + 1) - (A_low - 1) * std::cos(w0_low) + 2 * std::sqrt(A_low) * alpha_low);
    double b1_low = 2 * A_low * ((A_low - 1) - (A_low + 1) * std::cos(w0_low));
    double b2_low = A_low * ((A_low + 1) - (A_low - 1) * std::cos(w0_low) - 2 * std::sqrt(A_low) * alpha_low);
    double a0_low = (A_low + 1) + (A_low - 1) * std::cos(w0_low) + 2 * std::sqrt(A_low) * alpha_low;
    double a1_low = -2 * ((A_low - 1) + (A_low + 1) * std::cos(w0_low));
    double a2_low = (A_low + 1) + (A_low - 1) * std::cos(w0_low) - 2 * std::sqrt(A_low) * alpha_low;

    juce::IIRCoefficients coeffsLow(b0_low / a0_low, b1_low / a0_low, b2_low / a0_low, 1.0, a1_low / a0_low, a2_low / a0_low);

    // Peaking at 1 kHz
    double A_mid = std::pow(10.0, midGain / 40.0);
    double w0_mid = 2.0 * M_PI * 1000.0 / sampleRate;
    double alpha_mid = std::sin(w0_mid) / (2.0 * 0.707);
    double b0_mid = 1 + alpha_mid * A_mid;
    double b1_mid = -2 * std::cos(w0_mid);
    double b2_mid = 1 - alpha_mid * A_mid;
    double a0_mid = 1 + alpha_mid / A_mid;
    double a1_mid = -2 * std::cos(w0_mid);
    double a2_mid = 1 - alpha_mid / A_mid;

    juce::IIRCoefficients coeffsMid(b0_mid / a0_mid, b1_mid / a0_mid, b2_mid / a0_mid, 1.0, a1_mid / a0_mid, a2_mid / a0_mid);

    // High-shelf at 4 kHz
    double A_high = std::pow(10.0, highGain / 40.0);
    double w0_high = 2.0 * M_PI * 4000.0 / sampleRate;
    double alpha_high = std::sin(w0_high) / (2.0 * 0.707);
    double b0_high = A_high * ((A_high + 1) + (A_high - 1) * std::cos(w0_high) + 2 * std::sqrt(A_high) * alpha_high);
    double b1_high = -2 * A_high * ((A_high - 1) + (A_high + 1) * std::cos(w0_high));
    double b2_high = A_high * ((A_high + 1) + (A_high - 1) * std::cos(w0_high) - 2 * std::sqrt(A_high) * alpha_high);
    double a0_high = (A_high + 1) - (A_high - 1) * std::cos(w0_high) + 2 * std::sqrt(A_high) * alpha_high;
    double a1_high = 2 * ((A_high - 1) - (A_high + 1) * std::cos(w0_high));
    double a2_high = (A_high + 1) - (A_high - 1) * std::cos(w0_high) - 2 * std::sqrt(A_high) * alpha_high;

    juce::IIRCoefficients coeffsHigh(b0_high / a0_high, b1_high / a0_high, b2_high / a0_high, 1.0, a1_high / a0_high, a2_high / a0_high);

    for (int ch = 0; ch < 2; ++ch)
    {
        lowFilters[ch].setCoefficients(coeffsLow);
        midFilters[ch].setCoefficients(coeffsMid);
        highFilters[ch].setCoefficients(coeffsHigh);
    }
}

void EQProcessor::process(juce::AudioBuffer<float>& buffer)
{
    for (int ch = 0; ch < juce::jmin(2, buffer.getNumChannels()); ++ch)
    {
        auto* data = buffer.getWritePointer(ch);
        lowFilters[ch].processSamples(data, buffer.getNumSamples());
        midFilters[ch].processSamples(data, buffer.getNumSamples());
        highFilters[ch].processSamples(data, buffer.getNumSamples());
    }
}
