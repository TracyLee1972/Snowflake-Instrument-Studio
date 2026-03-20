#include "AudioEngine.h"
#include <cmath>

AudioEngine::AudioEngine()
    : sampleRate(44100.0), blockSize(512)
{
}

AudioEngine::~AudioEngine()
{
    reset();
}

void AudioEngine::prepare(double sr, int bs)
{
    sampleRate = sr;
    blockSize = bs;
    adsr.setSampleRate(sr);
    filter.setSampleRate(sr);
    eq.setSampleRate(sr);
}

void AudioEngine::reset()
{
    allNotesOff();
    samples.clear();
    roundRobinIndices.clear();
}

void AudioEngine::noteOn(int midiNote, float velocity)
{
    // Stop existing voice for this note
    noteOff(midiNote, true);

    auto it = samples.find(midiNote);
    if (it == samples.end() || it->second.empty())
        return;

    // Pick buffer (round-robin or first)
    int idx = 0;
    if (roundRobinEnabled)
    {
        int& rrIdx = roundRobinIndices[midiNote];
        idx = rrIdx % static_cast<int>(it->second.size());
        rrIdx++;
    }

    const auto& buffer = it->second[static_cast<size_t>(idx)];
    velocity = juce::jlimit(0.0f, 1.0f, velocity);

    // Velocity → gain: linear blend
    float velGain = 1.0f - velocitySens + velocitySens * velocity;

    VoiceData voice;
    voice.buffer = std::make_unique<juce::AudioBuffer<float>>(*buffer);
    voice.playPosition = 0;
    voice.envelope = 0.0f;
    voice.phase = 0.0f;
    voice.originalMidiNote = midiNote;
    voice.velocityGain = velGain;

    activeVoices[midiNote] = std::move(voice);
    adsr.noteOn(midiNote);
}

void AudioEngine::noteOff(int midiNote, bool immediate)
{
    auto it = activeVoices.find(midiNote);
    if (it != activeVoices.end())
    {
        if (immediate)
            activeVoices.erase(it);
        else
            adsr.noteOff(midiNote);
    }
}

void AudioEngine::allNotesOff()
{
    for (auto& [note, _] : activeVoices)
        adsr.noteOff(note);
    activeVoices.clear();
}

void AudioEngine::loadSample(int midiNote, const juce::AudioBuffer<float>& audioBuffer)
{
    auto buffer = std::make_unique<juce::AudioBuffer<float>>(audioBuffer);
    samples[midiNote].push_back(std::move(buffer));
    roundRobinIndices[midiNote] = 0;
}

void AudioEngine::clearSample(int midiNote)
{
    samples.erase(midiNote);
    roundRobinIndices.erase(midiNote);
}

void AudioEngine::clearAllSamples()
{
    samples.clear();
    roundRobinIndices.clear();
}

float AudioEngine::getMidiNotePitchShift(int targetNote, int sourceNote) const
{
    int semitones = targetNote - sourceNote + pitchShift;
    return std::pow(2.0f, semitones / 12.0f);
}

void AudioEngine::processAudio(juce::AudioBuffer<float>& buffer, int numSamples)
{
    buffer.clear();

    auto& envelopeValues = adsr.process(numSamples);

    std::vector<int> notesToRemove;

    for (auto& [midiNote, voice] : activeVoices)
    {
        if (!voice.buffer || voice.buffer->getNumSamples() == 0)
            continue;

        float pitchRate = getMidiNotePitchShift(midiNote, voice.originalMidiNote);
        float envGain = envelopeValues[static_cast<size_t>(adsr.getNoteIndex(midiNote))];

        for (int sample = 0; sample < numSamples; ++sample)
        {
            if (voice.playPosition >= voice.buffer->getNumSamples())
            {
                if (envGain < 0.001f)
                {
                    notesToRemove.push_back(midiNote);
                    break;
                }
                voice.playPosition = 0; // Loop
            }

            // Sample interpolation (linear)
            int pos = voice.playPosition;
            float frac = voice.playPosition - pos;

            float s0 = voice.buffer->getSample(0, pos % voice.buffer->getNumSamples());
            float s1 = voice.buffer->getSample(0, (pos + 1) % voice.buffer->getNumSamples());
            float sampleValue = s0 + frac * (s1 - s0);

            float outSample = sampleValue * envGain * voice.velocityGain * masterVolume;

            for (int ch = 0; ch < buffer.getNumChannels(); ++ch)
                buffer.addSample(ch, sample, outSample);

            voice.playPosition += pitchRate;
        }
    }

    for (int note : notesToRemove)
        activeVoices.erase(note);

    // Apply filter
    filter.process(buffer);

    // Apply EQ
    eq.process(buffer);
}
