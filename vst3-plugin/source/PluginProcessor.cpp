#include "PluginProcessor.h"
#include "PluginEditor.h"

SnowflakeInstrumentStudioAudioProcessor::SnowflakeInstrumentStudioAudioProcessor()
    : AudioProcessor(BusesProperties()
          .withOutput("Output", juce::AudioChannelSet::stereo(), true))
{
    parametersTree = juce::ValueTree("Parameters");
    parametersTree.addListener(this);
    createParameters();
}

SnowflakeInstrumentStudioAudioProcessor::~SnowflakeInstrumentStudioAudioProcessor()
{
}

void SnowflakeInstrumentStudioAudioProcessor::createParameters()
{
    auto& params = getParameters();

    attackParam = dynamic_cast<juce::AudioParameterFloat*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterFloat>(
            "attack", "Attack", 0.0f, 5.0f, 0.01f)));

    decayParam = dynamic_cast<juce::AudioParameterFloat*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterFloat>(
            "decay", "Decay", 0.0f, 5.0f, 0.1f)));

    sustainParam = dynamic_cast<juce::AudioParameterFloat*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterFloat>(
            "sustain", "Sustain", 0.0f, 1.0f, 0.8f)));

    releaseParam = dynamic_cast<juce::AudioParameterFloat*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterFloat>(
            "release", "Release", 0.0f, 5.0f, 0.3f)));

    masterVolParam = dynamic_cast<juce::AudioParameterFloat*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterFloat>(
            "masterVol", "Master Volume", 0.0f, 1.0f, 0.8f)));

    velSensParam = dynamic_cast<juce::AudioParameterFloat*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterFloat>(
            "velSens", "Velocity Sensitivity", 0.0f, 1.0f, 1.0f)));

    filterTypeParam = dynamic_cast<juce::AudioParameterChoice*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterChoice>(
            "filterType", "Filter Type", juce::StringArray("Low Pass", "High Pass", "Band Pass", "Notch"), 0)));

    filterFreqParam = dynamic_cast<juce::AudioParameterFloat*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterFloat>(
            juce::NormalisableRange<float>(20.0f, 20000.0f, 0.0f, 0.2f),
            "filterFreq", "Filter Frequency", 20000.0f)));

    filterQParam = dynamic_cast<juce::AudioParameterFloat*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterFloat>(
            "filterQ", "Filter Q", 0.1f, 20.0f, 1.0f)));

    eqLowParam = dynamic_cast<juce::AudioParameterFloat*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterFloat>(
            "eqLow", "EQ Low", -12.0f, 12.0f, 0.0f)));

    eqMidParam = dynamic_cast<juce::AudioParameterFloat*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterFloat>(
            "eqMid", "EQ Mid", -12.0f, 12.0f, 0.0f)));

    eqHighParam = dynamic_cast<juce::AudioParameterFloat*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterFloat>(
            "eqHigh", "EQ High", -12.0f, 12.0f, 0.0f)));

    roundRobinParam = dynamic_cast<juce::AudioParameterBool*>(
        params.createAndAddParameter(std::make_unique<juce::AudioParameterBool>(
            "roundRobin", "Round Robin", false)));
}

void SnowflakeInstrumentStudioAudioProcessor::prepareToPlay(double sampleRate, int samplesPerBlock)
{
    audioEngine.prepare(sampleRate, samplesPerBlock);
    updateEngineFromParameters();
}

void SnowflakeInstrumentStudioAudioProcessor::releaseResources()
{
    audioEngine.reset();
}

void SnowflakeInstrumentStudioAudioProcessor::processBlock(juce::AudioBuffer<float>& buffer,
                                                            juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;
    auto totalNumInputChannels = getTotalNumInputChannels();
    auto totalNumOutputChannels = getTotalNumOutputChannels();

    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i)
        buffer.clear(i, 0, buffer.getNumSamples());

    updateEngineFromParameters();

    // Process MIDI messages
    for (auto metadata : midiMessages)
    {
        auto msg = metadata.getMessage();
        if (msg.isNoteOn())
            audioEngine.noteOn(msg.getNoteNumber(), msg.getVelocity() / 127.0f);
        else if (msg.isNoteOff())
            audioEngine.noteOff(msg.getNoteNumber());
    }

    // Process audio
    audioEngine.processAudio(buffer, buffer.getNumSamples());
}

void SnowflakeInstrumentStudioAudioProcessor::processBlockBypassed(juce::AudioBuffer<float>& buffer,
                                                                     juce::MidiBuffer&)
{
    buffer.clear();
}

bool SnowflakeInstrumentStudioAudioProcessor::isBusesLayoutSupported(const BusesLayout& layouts) const
{
    if (layouts.getMainOutputChannelSet() != juce::AudioChannelSet::mono()
        && layouts.getMainOutputChannelSet() != juce::AudioChannelSet::stereo())
        return false;

    return true;
}

juce::AudioProcessorEditor* SnowflakeInstrumentStudioAudioProcessor::createEditor()
{
    return new SnowflakeInstrumentStudioAudioProcessorEditor(*this);
}

void SnowflakeInstrumentStudioAudioProcessor::getStateInformation(juce::MemoryBlock& destData)
{
    auto state = parametersTree.state;

    auto xml = state.createXml();
    copyXmlToBinary(*xml, destData);
}

void SnowflakeInstrumentStudioAudioProcessor::setStateInformation(const void* data, int sizeInBytes)
{
    auto xmlState = getXmlFromBinary(data, sizeInBytes);

    if (xmlState != nullptr)
        parametersTree.state = juce::ValueTree::fromXml(*xmlState);
}

void SnowflakeInstrumentStudioAudioProcessor::updateEngineFromParameters()
{
    if (attackParam) audioEngine.setAttack(attackParam->get());
    if (decayParam) audioEngine.setDecay(decayParam->get());
    if (sustainParam) audioEngine.setSustain(sustainParam->get());
    if (releaseParam) audioEngine.setRelease(releaseParam->get());
    if (masterVolParam) audioEngine.setMasterVolume(masterVolParam->get());
    if (velSensParam) audioEngine.setVelocitySensitivity(velSensParam->get());
    if (filterTypeParam) audioEngine.setFilterType(filterTypeParam->getIndex());
    if (filterFreqParam) audioEngine.setFilterFrequency(filterFreqParam->get());
    if (filterQParam) audioEngine.setFilterQ(filterQParam->get());
    if (eqLowParam) audioEngine.setEqLow(eqLowParam->get());
    if (eqMidParam) audioEngine.setEqMid(eqMidParam->get());
    if (eqHighParam) audioEngine.setEqHigh(eqHighParam->get());
    if (roundRobinParam) audioEngine.setRoundRobinEnabled(roundRobinParam->get());
}

void SnowflakeInstrumentStudioAudioProcessor::valueTreePropertyChanged(juce::ValueTree& tree,
                                                                        const juce::Identifier& property)
{
    updateEngineFromParameters();
}

// ============================================================================
// Plugin Entry Point
// ============================================================================
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new SnowflakeInstrumentStudioAudioProcessor();
}
