#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_audio_utils/juce_audio_utils.h>
#include "AudioEngine.h"
#include "SampleManager.h"

class SnowflakeInstrumentStudioAudioProcessor : public juce::AudioProcessor,
                                                  public juce::ValueTree::Listener
{
public:
    using juce::AudioProcessor::processBlock;
    using juce::AudioProcessor::processBlockBypassed;

    SnowflakeInstrumentStudioAudioProcessor();
    ~SnowflakeInstrumentStudioAudioProcessor() override;

    // AudioProcessor interface
    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;

    bool isBusesLayoutSupported(const BusesLayout& layouts) const override;

    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
    void processBlockBypassed(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "Snowflake Instrument Studio"; }

    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 3.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return "Default"; }
    void changeProgramName(int, const juce::String&) override {}

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    // Audio Engine & Samples access
    AudioEngine& getAudioEngine() { return audioEngine; }
    SampleManager& getSampleManager() { return sampleManager; }

    // Parameters
    juce::AudioParameterFloat* attackParam = nullptr;
    juce::AudioParameterFloat* decayParam = nullptr;
    juce::AudioParameterFloat* sustainParam = nullptr;
    juce::AudioParameterFloat* releaseParam = nullptr;
    juce::AudioParameterFloat* masterVolParam = nullptr;
    juce::AudioParameterFloat* velSensParam = nullptr;
    juce::AudioParameterChoice* filterTypeParam = nullptr;
    juce::AudioParameterFloat* filterFreqParam = nullptr;
    juce::AudioParameterFloat* filterQParam = nullptr;
    juce::AudioParameterFloat* eqLowParam = nullptr;
    juce::AudioParameterFloat* eqMidParam = nullptr;
    juce::AudioParameterFloat* eqHighParam = nullptr;
    juce::AudioParameterBool* roundRobinParam = nullptr;

    // ValueTree for lightweight preset storage
    juce::ValueTree parametersTree;
    void valueTreePropertyChanged(juce::ValueTree& tree, const juce::Identifier& property) override;

private:
    AudioEngine audioEngine;
    SampleManager sampleManager;

    void createParameters();
    void updateEngineFromParameters();

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(SnowflakeInstrumentStudioAudioProcessor)
};
