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
    addParameter(attackParam = new juce::AudioParameterFloat("attack", "Attack", 0.0f, 5.0f, 0.01f));
    addParameter(decayParam = new juce::AudioParameterFloat("decay", "Decay", 0.0f, 5.0f, 0.1f));
    addParameter(sustainParam = new juce::AudioParameterFloat("sustain", "Sustain", 0.0f, 1.0f, 0.8f));
    addParameter(releaseParam = new juce::AudioParameterFloat("release", "Release", 0.0f, 5.0f, 0.3f));
    addParameter(masterVolParam = new juce::AudioParameterFloat("masterVol", "Master Volume", 0.0f, 1.0f, 0.8f));
    addParameter(velSensParam = new juce::AudioParameterFloat("velSens", "Velocity Sensitivity", 0.0f, 1.0f, 1.0f));
    addParameter(filterTypeParam = new juce::AudioParameterChoice("filterType", "Filter Type", juce::StringArray("Low Pass", "High Pass", "Band Pass", "Notch"), 0));
    addParameter(filterFreqParam = new juce::AudioParameterFloat("filterFreq", "Filter Frequency", juce::NormalisableRange<float>(20.0f, 20000.0f, 0.0f, 0.2f), 20000.0f));
    addParameter(filterQParam = new juce::AudioParameterFloat("filterQ", "Filter Q", 0.1f, 20.0f, 1.0f));
    addParameter(eqLowParam = new juce::AudioParameterFloat("eqLow", "EQ Low", -12.0f, 12.0f, 0.0f));
    addParameter(eqMidParam = new juce::AudioParameterFloat("eqMid", "EQ Mid", -12.0f, 12.0f, 0.0f));
    addParameter(eqHighParam = new juce::AudioParameterFloat("eqHigh", "EQ High", -12.0f, 12.0f, 0.0f));
    addParameter(roundRobinParam = new juce::AudioParameterBool("roundRobin", "Round Robin", false));
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
    auto xml = parametersTree.createXml();
    copyXmlToBinary(*xml, destData);
}

void SnowflakeInstrumentStudioAudioProcessor::setStateInformation(const void* data, int sizeInBytes)
{
    auto xmlState = getXmlFromBinary(data, sizeInBytes);

    if (xmlState != nullptr)
    parametersTree = juce::ValueTree::fromXml(*xmlState);
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

void SnowflakeInstrumentStudioAudioProcessor::valueTreePropertyChanged(juce::ValueTree&,
                                                                        const juce::Identifier&)
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
