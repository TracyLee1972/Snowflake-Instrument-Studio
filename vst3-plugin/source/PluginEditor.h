#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "PluginProcessor.h"

class SnowflakeInstrumentStudioAudioProcessorEditor : public juce::AudioProcessorEditor,
                                                       public juce::Slider::Listener,
                                                       public juce::Button::Listener
{
public:
    SnowflakeInstrumentStudioAudioProcessorEditor(SnowflakeInstrumentStudioAudioProcessor&);
    ~SnowflakeInstrumentStudioAudioProcessorEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;
    void sliderValueChanged(juce::Slider* slider) override;
    void buttonClicked(juce::Button* button) override;

private:
    SnowflakeInstrumentStudioAudioProcessor& audioProcessor;

    // ===== ADSR Group =====
    juce::GroupComponent adsrGroup;
    juce::Label attackLabel, decayLabel, sustainLabel, releaseLabel;
    juce::Slider attackSlider, decaySlider, sustainSlider, releaseSlider;

    // ===== Filter Group =====
    juce::GroupComponent filterGroup;
    juce::Label filterTypeLabel, filterFreqLabel, filterQLabel;
    juce::ComboBox filterTypeCombo;
    juce::Slider filterFreqSlider, filterQSlider;

    // ===== EQ Group =====
    juce::GroupComponent eqGroup;
    juce::Label eqLowLabel, eqMidLabel, eqHighLabel;
    juce::Slider eqLowSlider, eqMidSlider, eqHighSlider;

    // ===== Volume & Velocity =====
    juce::GroupComponent volumeGroup;
    juce::Label masterVolLabel, velSensLabel;
    juce::Slider masterVolSlider, velSensSlider;
    juce::ToggleButton roundRobinButton;

    // ===== Sample Loading & Mapping =====
    juce::GroupComponent sampleGroup;
    juce::TextButton browseSamplesButton, autoMapButton;
    juce::Label samplesLoadedLabel;
    juce::ComboBox rootNoteCombo, loNoteCombo, hiNoteCombo;
    juce::TextButton applyMappingButton, clearMappingButton;

    // ===== Recording =====
    juce::GroupComponent recordGroup;
    juce::TextButton recordButton, playButton, stopButton, exportWavButton;
    juce::Label recordTimeLabel, recordEventsLabel;
    juce::Slider playbackSlider;

    // ===== Background Image =====
    juce::TextButton uploadBgButton;
    juce::Image backgroundImage;
    juce::String backgroundImagePath;

    // ===== Piano Keyboard Preview =====
    juce::GroupComponent keyboardGroup;
    juce::Label keyboardLabel;

    // State
    std::unique_ptr<juce::FileChooser> fileChooser;
    int loadedSampleCount = 0;

    void setupSlider(juce::Slider& slider, float min, float max, float defaultValue);
    void setupLabel(juce::Label& label, const juce::String& text);
    void setupButton(juce::TextButton& button, const juce::String& text);
    void buildNoteCombo(juce::ComboBox& combo);
    void handleFileChooserResult(const juce::FileChooser& chooser);
    void updateRecordingDisplay();
    void drawPianoKeyboard(juce::Graphics& g, const juce::Rectangle<int>& area);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(SnowflakeInstrumentStudioAudioProcessorEditor)
};
