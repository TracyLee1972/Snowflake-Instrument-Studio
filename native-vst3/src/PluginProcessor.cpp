#include "PluginProcessor.h"
#include "PluginEditor.h"

namespace
{
constexpr auto propSampleName = "sampleName";
constexpr auto propSampleData = "sampleData";
constexpr auto propArtworkData = "artworkData";
}

SnowflakeInstrumentStudioAudioProcessor::SnowflakeInstrumentStudioAudioProcessor()
    : AudioProcessor (BusesProperties().withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      apvts (*this, nullptr, "PARAMS", createParameterLayout())
{
    formatManager.registerBasicFormats();

    for (int i = 0; i < 16; ++i)
        synth.addVoice (new juce::SamplerVoice());

    gainSmoothed.reset (44100.0, 0.02);
    gainSmoothed.setCurrentAndTargetValue (0.8f);
}

SnowflakeInstrumentStudioAudioProcessor::~SnowflakeInstrumentStudioAudioProcessor() = default;

juce::AudioProcessorValueTreeState::ParameterLayout SnowflakeInstrumentStudioAudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;

    params.push_back (std::make_unique<juce::AudioParameterFloat> ("attack", "Attack", juce::NormalisableRange<float> (0.001f, 4.0f, 0.001f, 0.4f), 0.01f));
    params.push_back (std::make_unique<juce::AudioParameterFloat> ("release", "Release", juce::NormalisableRange<float> (0.001f, 10.0f, 0.001f, 0.4f), 0.3f));
    params.push_back (std::make_unique<juce::AudioParameterFloat> ("cutoff", "Cutoff", juce::NormalisableRange<float> (20.0f, 20000.0f, 1.0f, 0.35f), 20000.0f));
    params.push_back (std::make_unique<juce::AudioParameterFloat> ("resonance", "Resonance", juce::NormalisableRange<float> (0.1f, 2.0f, 0.001f, 1.0f), 0.7f));
    params.push_back (std::make_unique<juce::AudioParameterFloat> ("gain", "Gain", juce::NormalisableRange<float> (0.0f, 1.0f, 0.001f, 1.0f), 0.8f));

    return { params.begin(), params.end() };
}

void SnowflakeInstrumentStudioAudioProcessor::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    juce::ignoreUnused (samplesPerBlock);

    synth.setCurrentPlaybackSampleRate (sampleRate);
    gainSmoothed.reset (sampleRate, 0.02);

    juce::dsp::ProcessSpec spec { sampleRate, static_cast<juce::uint32> (samplesPerBlock), 1 };
    leftFilter.reset();
    rightFilter.reset();
    leftFilter.prepare (spec);
    rightFilter.prepare (spec);
    leftFilter.setType (juce::dsp::StateVariableTPTFilterType::lowpass);
    rightFilter.setType (juce::dsp::StateVariableTPTFilterType::lowpass);
    updateFilter();
}

void SnowflakeInstrumentStudioAudioProcessor::releaseResources()
{
}

bool SnowflakeInstrumentStudioAudioProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    return layouts.getMainOutputChannelSet() == juce::AudioChannelSet::mono()
        || layouts.getMainOutputChannelSet() == juce::AudioChannelSet::stereo();
}

void SnowflakeInstrumentStudioAudioProcessor::updateFilter()
{
    const auto cutoff = apvts.getRawParameterValue ("cutoff")->load();
    const auto resonance = apvts.getRawParameterValue ("resonance")->load();

    leftFilter.setCutoffFrequency (cutoff);
    rightFilter.setCutoffFrequency (cutoff);
    leftFilter.setResonance (resonance);
    rightFilter.setResonance (resonance);
}

void SnowflakeInstrumentStudioAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;

    for (auto i = getTotalNumInputChannels(); i < getTotalNumOutputChannels(); ++i)
        buffer.clear (i, 0, buffer.getNumSamples());

    buffer.clear();
    synth.renderNextBlock (buffer, midiMessages, 0, buffer.getNumSamples());

    updateFilter();

    juce::dsp::AudioBlock<float> audioBlock (buffer);
    if (buffer.getNumChannels() > 0)
    {
        auto leftBlock = audioBlock.getSingleChannelBlock (0);
        juce::dsp::ProcessContextReplacing<float> leftContext (leftBlock);
        leftFilter.process (leftContext);
    }

    if (buffer.getNumChannels() > 1)
    {
        auto rightBlock = audioBlock.getSingleChannelBlock (1);
        juce::dsp::ProcessContextReplacing<float> rightContext (rightBlock);
        rightFilter.process (rightContext);
    }

    gainSmoothed.setTargetValue (apvts.getRawParameterValue ("gain")->load());
    buffer.applyGain (gainSmoothed.getNextValue());
}

void SnowflakeInstrumentStudioAudioProcessor::processBlock (juce::AudioBuffer<double>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ignoreUnused (midiMessages);
    buffer.clear();
}

bool SnowflakeInstrumentStudioAudioProcessor::loadSampleFromFile (const juce::File& file)
{
    juce::MemoryBlock newData;
    if (!file.loadFileAsData (newData))
        return false;

    return loadSampleFromMemory (file.getFileNameWithoutExtension(), newData.getData(), newData.getSize());
}

bool SnowflakeInstrumentStudioAudioProcessor::loadSampleFromMemory (const juce::String& newSampleName, const void* data, size_t dataSize)
{
    if (data == nullptr || dataSize == 0)
        return false;

    auto stream = std::make_unique<juce::MemoryInputStream> (data, dataSize, false);
    std::unique_ptr<juce::AudioFormatReader> reader (formatManager.createReaderFor (std::move (stream)));

    if (reader == nullptr)
        return false;

    const auto attack = apvts.getRawParameterValue ("attack")->load();
    const auto release = apvts.getRawParameterValue ("release")->load();

    juce::BigInteger midiNotes;
    midiNotes.setRange (0, 128, true);

    auto samplerSound = std::make_unique<juce::SamplerSound> (newSampleName,
                                                               *reader,
                                                               midiNotes,
                                                               60,
                                                               attack,
                                                               release,
                                                               30.0);

    synth.clearSounds();
    synth.addSound (samplerSound.release());

    {
        const juce::ScopedLock lock (stateLock);
        sampleName = newSampleName;
        sampleData.replaceAll (data, dataSize);
    }

    sendChangeMessage();
    return true;
}

bool SnowflakeInstrumentStudioAudioProcessor::setArtworkFromFile (const juce::File& file)
{
    juce::MemoryBlock bytes;
    if (!file.loadFileAsData (bytes))
        return false;

    return setArtworkFromMemory (bytes.getData(), bytes.getSize());
}

bool SnowflakeInstrumentStudioAudioProcessor::setArtworkFromMemory (const void* data, size_t dataSize)
{
    if (data == nullptr || dataSize == 0)
        return false;

    juce::MemoryInputStream stream (data, dataSize, false);
    auto image = juce::ImageFileFormat::loadFrom (stream);

    if (!image.isValid())
        return false;

    {
        const juce::ScopedLock lock (stateLock);
        artworkData.replaceAll (data, dataSize);
        artworkImage = image;
    }

    sendChangeMessage();
    return true;
}

juce::Image SnowflakeInstrumentStudioAudioProcessor::getArtworkImage() const
{
    const juce::ScopedLock lock (stateLock);
    return artworkImage;
}

juce::String SnowflakeInstrumentStudioAudioProcessor::getLoadedSampleName() const
{
    const juce::ScopedLock lock (stateLock);
    return sampleName;
}

void SnowflakeInstrumentStudioAudioProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    auto state = apvts.copyState();

    {
        const juce::ScopedLock lock (stateLock);
        state.setProperty (propSampleName, sampleName, nullptr);
        state.setProperty (propSampleData, sampleData.toBase64Encoding(), nullptr);
        state.setProperty (propArtworkData, artworkData.toBase64Encoding(), nullptr);
    }

    std::unique_ptr<juce::XmlElement> xml (state.createXml());
    copyXmlToBinary (*xml, destData);
}

void SnowflakeInstrumentStudioAudioProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xml (getXmlFromBinary (data, sizeInBytes));
    if (xml == nullptr)
        return;

    auto loadedTree = juce::ValueTree::fromXml (*xml);
    if (!loadedTree.isValid())
        return;

    if (loadedTree.getType() == apvts.state.getType())
        apvts.replaceState (loadedTree);

    const auto loadedSampleName = loadedTree.getProperty (propSampleName).toString();
    const auto sampleBase64 = loadedTree.getProperty (propSampleData).toString();
    const auto artworkBase64 = loadedTree.getProperty (propArtworkData).toString();

    if (sampleBase64.isNotEmpty())
    {
        juce::MemoryBlock decoded;
        if (decoded.fromBase64Encoding (sampleBase64))
            loadSampleFromMemory (loadedSampleName, decoded.getData(), decoded.getSize());
    }

    if (artworkBase64.isNotEmpty())
    {
        juce::MemoryBlock decoded;
        if (decoded.fromBase64Encoding (artworkBase64))
            setArtworkFromMemory (decoded.getData(), decoded.getSize());
    }

    sendChangeMessage();
}

juce::AudioProcessorEditor* SnowflakeInstrumentStudioAudioProcessor::createEditor()
{
    return new SnowflakeInstrumentStudioAudioProcessorEditor (*this);
}
