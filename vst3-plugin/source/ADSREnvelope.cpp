#include "ADSREnvelope.h"
#include <cmath>

ADSREnvelope::ADSREnvelope()
    : sampleRate(44100.0), output(2048, 0.0f)
{
}

void ADSREnvelope::noteOn(int voiceId)
{
    Voice& v = voices[voiceId];
    v.state = 1; // attack
    v.level = 0.0f;
    v.sampleCount = 0;
    v.startTime = 0.0;
}

void ADSREnvelope::noteOff(int voiceId)
{
    auto it = voices.find(voiceId);
    if (it != voices.end())
        it->second.state = 4; // release
}

int ADSREnvelope::getNoteIndex(int voiceId) const
{
    auto it = voices.find(voiceId);
    if (it != voices.end())
        return std::distance(voices.begin(), it);
    return 0;
}

std::vector<float>& ADSREnvelope::process(int numSamples)
{
    if (output.size() < numSamples)
        output.resize(numSamples);

    std::fill(output.begin(), output.end(), 0.0f);

    int idx = 0;
    for (auto it = voices.begin(); it != voices.end(); ++it, ++idx)
    {
        Voice& v = it->second;
        float attackSamples = attack * sampleRate;
        float decaySamples = decay * sampleRate;
        float releaseSamples = release * sampleRate;

        for (int i = 0; i < numSamples; ++i)
        {
            float envValue = 0.0f;

            if (v.state == 1) // Attack
            {
                envValue = v.sampleCount / attackSamples;
                if (v.sampleCount >= attackSamples)
                {
                    v.state = 2;
                    v.sampleCount = 0;
                    v.level = 1.0f;
                }
            }
            else if (v.state == 2) // Decay
            {
                float progress = v.sampleCount / decaySamples;
                envValue = 1.0f - progress * (1.0f - sustain);
                if (v.sampleCount >= decaySamples)
                {
                    v.state = 3;
                    v.level = sustain;
                    v.sampleCount = 0;
                }
            }
            else if (v.state == 3) // Sustain
            {
                envValue = sustain;
            }
            else if (v.state == 4) // Release
            {
                float progress = v.sampleCount / releaseSamples;
                envValue = v.level * (1.0f - progress);
                if (v.sampleCount >= releaseSamples)
                {
                    v.state = 0;
                    envValue = 0.0f;
                }
            }

            v.sampleCount++;

            if (idx < output.size())
                output[idx] = envValue;
        }
    }

    // Clean up finished voices
    std::vector<int> toRemove;
    for (auto& [voiceId, v] : voices)
    {
        if (v.state == 0)
            toRemove.push_back(voiceId);
    }
    for (int id : toRemove)
        voices.erase(id);

    return output;
}
