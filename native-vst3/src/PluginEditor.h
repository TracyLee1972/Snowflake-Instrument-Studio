#pragma once

#include <juce_audio_utils/juce_audio_utils.h>
#include "PluginProcessor.h"

class SnowflakeInstrumentStudioAudioProcessorEditor final : public juce::AudioProcessorEditor,
                                                            private juce::Button::Listener,
                                                            private juce::ChangeListener
{
public:
    explicit SnowflakeInstrumentStudioAudioProcessorEditor (SnowflakeInstrumentStudioAudioProcessor&);
    ~SnowflakeInstrumentStudioAudioProcessorEditor() override;

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    SnowflakeInstrumentStudioAudioProcessor& processor;

    juce::TextButton loadSampleButton { "Load WAV" };
    juce::TextButton setArtworkButton { "Set Picture" };

    juce::Label titleLabel;
    juce::Label sampleLabel;

    juce::ImageComponent artworkView;

    juce::Slider attackSlider;
    juce::Slider releaseSlider;
    juce::Slider cutoffSlider;
    juce::Slider resonanceSlider;
    juce::Slider gainSlider;

    using SliderAttachment = juce::AudioProcessorValueTreeState::SliderAttachment;

    std::unique_ptr<SliderAttachment> attackAttachment;
    std::unique_ptr<SliderAttachment> releaseAttachment;
    std::unique_ptr<SliderAttachment> cutoffAttachment;
    std::unique_ptr<SliderAttachment> resonanceAttachment;
    std::unique_ptr<SliderAttachment> gainAttachment;
    std::unique_ptr<juce::FileChooser> activeChooser;

    void setupKnob (juce::Slider& slider, const juce::String& name);
    void buttonClicked (juce::Button* button) override;
    void changeListenerCallback (juce::ChangeBroadcaster* source) override;
    void refreshFromProcessor();

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (SnowflakeInstrumentStudioAudioProcessorEditor)
};
