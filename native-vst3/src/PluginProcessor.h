#pragma once

#include <juce_audio_utils/juce_audio_utils.h>
#include <juce_dsp/juce_dsp.h>

class SnowflakeInstrumentStudioAudioProcessor final : public juce::AudioProcessor,
                                                      public juce::ChangeBroadcaster
{
public:
    SnowflakeInstrumentStudioAudioProcessor();
    ~SnowflakeInstrumentStudioAudioProcessor() override;

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;

    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
    void processBlock (juce::AudioBuffer<double>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return JucePlugin_Name; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    juce::AudioProcessorValueTreeState apvts;

    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    bool loadSampleFromFile (const juce::File& file);
    bool loadSampleFromMemory (const juce::String& sampleName, const void* data, size_t dataSize);

    bool setArtworkFromFile (const juce::File& file);
    bool setArtworkFromMemory (const void* data, size_t dataSize);

    juce::Image getArtworkImage() const;
    juce::String getLoadedSampleName() const;

private:
    juce::Synthesiser synth;
    juce::AudioFormatManager formatManager;

    juce::dsp::StateVariableTPTFilter<float> leftFilter;
    juce::dsp::StateVariableTPTFilter<float> rightFilter;

    juce::LinearSmoothedValue<float> gainSmoothed;

    juce::CriticalSection stateLock;
    juce::MemoryBlock sampleData;
    juce::String sampleName;

    juce::MemoryBlock artworkData;
    juce::Image artworkImage;

    void updateFilter();

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (SnowflakeInstrumentStudioAudioProcessor)
};
