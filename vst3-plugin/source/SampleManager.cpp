#include "SampleManager.h"

SampleManager::SampleManager()
{
}

SampleManager::~SampleManager()
{
    clear();
}

void SampleManager::loadSample(int midiNote, const juce::File& file)
{
    if (!file.existsAsFile() || file.getFileExtension().toLowerCase() != ".wav")
        return;

    juce::AudioFormatManager formatManager;
    formatManager.registerBasicFormats();

    std::unique_ptr<juce::AudioFormatReader> reader(formatManager.createReaderFor(file));
    if (!reader)
        return;

    auto audioBuffer = std::make_unique<juce::AudioBuffer<float>>(
        static_cast<int>(reader->numChannels),
        static_cast<int>(reader->lengthInSamples)
    );

    reader->read(audioBuffer.get(), 0, static_cast<int>(reader->lengthInSamples), 0, true, true);

    // Add to the vector for this MIDI note (enables round-robin)
    sampleData[midiNote].push_back(std::move(audioBuffer));
}

void SampleManager::clear()
{
    sampleData.clear();
}
