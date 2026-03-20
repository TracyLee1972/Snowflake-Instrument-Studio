#include "PluginEditor.h"

SnowflakeInstrumentStudioAudioProcessorEditor::SnowflakeInstrumentStudioAudioProcessorEditor(
    SnowflakeInstrumentStudioAudioProcessor& p)
    : AudioProcessorEditor(&p), audioProcessor(p),
      adsrGroup("ADSR Envelope"), filterGroup("Filter"), 
      eqGroup("3-Band EQ"), volumeGroup("Volume")
{
    setSize(600, 500);
    setResizable(false, false);

    // ADSR Group
    addAndMakeVisible(adsrGroup);
    setupLabel(attackLabel, "Attack (s)");
    setupSlider(attackSlider, 0.0f, 5.0f, 0.01f);
    setupLabel(decayLabel, "Decay (s)");
    setupSlider(decaySlider, 0.0f, 5.0f, 0.1f);
    setupLabel(sustainLabel, "Sustain");
    setupSlider(sustainSlider, 0.0f, 1.0f, 0.8f);
    setupLabel(releaseLabel, "Release (s)");
    setupSlider(releaseSlider, 0.0f, 5.0f, 0.3f);

    // Filter Group
    addAndMakeVisible(filterGroup);
    setupLabel(filterTypeLabel, "Type:");
    addAndMakeVisible(filterTypeCombo);
    filterTypeCombo.addItem("Low Pass", 1);
    filterTypeCombo.addItem("High Pass", 2);
    filterTypeCombo.addItem("Band Pass", 3);
    filterTypeCombo.addItem("Notch", 4);
    filterTypeCombo.setSelectedItemIndex(0);

    setupLabel(filterFreqLabel, "Frequency (Hz)");
    setupSlider(filterFreqSlider, 20.0f, 20000.0f, 20000.0f);
    setupLabel(filterQLabel, "Q");
    setupSlider(filterQSlider, 0.1f, 20.0f, 1.0f);

    // EQ Group
    addAndMakeVisible(eqGroup);
    setupLabel(eqLowLabel, "Low (250Hz)");
    setupSlider(eqLowSlider, -12.0f, 12.0f, 0.0f);
    setupLabel(eqMidLabel, "Mid (1kHz)");
    setupSlider(eqMidSlider, -12.0f, 12.0f, 0.0f);
    setupLabel(eqHighLabel, "High (4kHz)");
    setupSlider(eqHighSlider, -12.0f, 12.0f, 0.0f);

    // Volume Group
    addAndMakeVisible(volumeGroup);
    setupLabel(masterVolLabel, "Master Volume");
    setupSlider(masterVolSlider, 0.0f, 1.0f, 0.8f);
    setupLabel(velSensLabel, "Velocity Sensitivity");
    setupSlider(velSensSlider, 0.0f, 1.0f, 1.0f);

    // Round Robin
    addAndMakeVisible(roundRobinButton);
    roundRobinButton.setButtonText("Round Robin");
    roundRobinButton.addListener(this);

    // Sample Loading Group
    addAndMakeVisible(sampleGroup);
    setupButton(browseSamplesButton, "📂 Browse Samples");
    setupButton(autoMapButton, "🎹 Auto Map");
    setupLabel(samplesLoadedLabel, "No samples loaded");
    buildNoteCombo(rootNoteCombo);
    buildNoteCombo(loNoteCombo);
    buildNoteCombo(hiNoteCombo);
    setupButton(applyMappingButton, "✓ Apply");
    setupButton(clearMappingButton, "✕ Clear");

    // Recording Group
    addAndMakeVisible(recordGroup);
    setupButton(recordButton, "⏺ Record");
    setupButton(playButton, "▶ Play");
    setupButton(stopButton, "⏹ Stop");
    setupButton(exportWavButton, "💾 Export");
    setupLabel(recordTimeLabel, "00:00.000");
    setupLabel(recordEventsLabel, "— no recording —");
    addAndMakeVisible(playbackSlider);
    playbackSlider.setRange(0.0, 100.0, 0.1);
    playbackSlider.setValue(0);
    playbackSlider.addListener(this);

    // Background Image
    setupButton(uploadBgButton, "🖼️ Upload BG");

    // Keyboard Preview Group
    addAndMakeVisible(keyboardGroup);
    setupLabel(keyboardLabel, "Keys: A-L(whites) W-P(blacks) Z/X(octave)");
}

SnowflakeInstrumentStudioAudioProcessorEditor::~SnowflakeInstrumentStudioAudioProcessorEditor()
{
}

void SnowflakeInstrumentStudioAudioProcessorEditor::setupSlider(juce::Slider& slider,
                                                                 float min, float max, float defaultValue)
{
    addAndMakeVisible(slider);
    slider.setRange(min, max, 0.01f);
    slider.setValue(defaultValue);
    slider.setSliderStyle(juce::Slider::LinearHorizontal);
    slider.setTextBoxStyle(juce::Slider::TextBoxRight, false, 80, 20);
    slider.addListener(this);
}

void SnowflakeInstrumentStudioAudioProcessorEditor::setupLabel(juce::Label& label,
                                                               const juce::String& text)
{
    addAndMakeVisible(label);
    label.setText(text, juce::dontSendNotification);
    label.setJustificationType(juce::Justification::centredLeft);
}

void SnowflakeInstrumentStudioAudioProcessorEditor::setupButton(juce::TextButton& button,
                                                                const juce::String& text)
{
    addAndMakeVisible(button);
    button.setButtonText(text);
    button.addListener(this);
}

void SnowflakeInstrumentStudioAudioProcessorEditor::buildNoteCombo(juce::ComboBox& combo)
{
    addAndMakeVisible(combo);
    const juce::String notes[] = { "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" };
    for (int i = 0; i <= 127; ++i)
    {
        int oct = i / 12 - 1;
        combo.addItem(notes[i % 12] + juce::String(oct), i + 1);
    }
    combo.setSelectedItemIndex(60);  // Default to C4
}

void SnowflakeInstrumentStudioAudioProcessorEditor::paint(juce::Graphics& g)
{
    g.fillAll(juce::Colours::darkgrey);

    g.setColour(juce::Colours::white);
    g.setFont(16.0f);
    g.drawFittedText("❄️ Snowflake Instrument Studio VST3", 0, 10, getWidth(), 30,
                     juce::Justification::centred, 1);
}

void SnowflakeInstrumentStudioAudioProcessorEditor::resized()
{
    auto area = getLocalBounds().reduced(10);
    int labelW = 120;
    int sliderH = 24;
    int groupH = 150;
    int groupW = (area.getWidth() - 20) / 2;

    int y = 50;

    // ADSR Group
    adsrGroup.setBounds(area.getX(), y, groupW, groupH);
    auto adsrArea = adsrGroup.getBounds().reduced(10, 20);
    attackLabel.setBounds(adsrArea.getX(), adsrArea.getY(), labelW, sliderH);
    attackSlider.setBounds(adsrArea.getX() + labelW + 10, adsrArea.getY(), 180, sliderH);
    y = adsrArea.getY() + sliderH + 5;
    decayLabel.setBounds(adsrArea.getX(), y, labelW, sliderH);
    decaySlider.setBounds(adsrArea.getX() + labelW + 10, y, 180, sliderH);
    y += sliderH + 5;
    sustainLabel.setBounds(adsrArea.getX(), y, labelW, sliderH);
    sustainSlider.setBounds(adsrArea.getX() + labelW + 10, y, 180, sliderH);
    y += sliderH + 5;
    releaseLabel.setBounds(adsrArea.getX(), y, labelW, sliderH);
    releaseSlider.setBounds(adsrArea.getX() + labelW + 10, y, 180, sliderH);

    // Filter Group
    y = 50;
    filterGroup.setBounds(area.getX() + groupW + 10, y, groupW, groupH);
    auto filterArea = filterGroup.getBounds().reduced(10, 20);
    filterTypeLabel.setBounds(filterArea.getX(), filterArea.getY(), labelW, sliderH);
    filterTypeCombo.setBounds(filterArea.getX() + labelW + 10, filterArea.getY(), 140, sliderH);
    y = filterArea.getY() + sliderH + 5;
    filterFreqLabel.setBounds(filterArea.getX(), y, labelW, sliderH);
    filterFreqSlider.setBounds(filterArea.getX() + labelW + 10, y, 140, sliderH);
    y += sliderH + 5;
    filterQLabel.setBounds(filterArea.getX(), y, labelW, sliderH);
    filterQSlider.setBounds(filterArea.getX() + labelW + 10, y, 140, sliderH);

    // EQ Group
    y = 220;
    eqGroup.setBounds(area.getX(), y, groupW, groupH);
    auto eqArea = eqGroup.getBounds().reduced(10, 20);
    eqLowLabel.setBounds(eqArea.getX(), eqArea.getY(), labelW, sliderH);
    eqLowSlider.setBounds(eqArea.getX() + labelW + 10, eqArea.getY(), 180, sliderH);
    y = eqArea.getY() + sliderH + 5;
    eqMidLabel.setBounds(eqArea.getX(), y, labelW, sliderH);
    eqMidSlider.setBounds(eqArea.getX() + labelW + 10, y, 180, sliderH);
    y += sliderH + 5;
    eqHighLabel.setBounds(eqArea.getX(), y, labelW, sliderH);
    eqHighSlider.setBounds(eqArea.getX() + labelW + 10, y, 180, sliderH);

    // Volume Group
    y = 220;
    volumeGroup.setBounds(area.getX() + groupW + 10, y, groupW, groupH);
    auto volArea = volumeGroup.getBounds().reduced(10, 20);
    masterVolLabel.setBounds(volArea.getX(), volArea.getY(), labelW, sliderH);
    masterVolSlider.setBounds(volArea.getX() + labelW + 10, volArea.getY(), 140, sliderH);
    y = volArea.getY() + sliderH + 5;
    roundRobinButton.setBounds(volArea.getX(), y, 200, sliderH);
}

void SnowflakeInstrumentStudioAudioProcessorEditor::sliderValueChanged(juce::Slider* slider)
{
    if (slider == &attackSlider && audioProcessor.attackParam)
        audioProcessor.attackParam->setValueNotifyingHost(attackSlider.getValue());
    else if (slider == &decaySlider && audioProcessor.decayParam)
        audioProcessor.decayParam->setValueNotifyingHost(decaySlider.getValue());
    else if (slider == &masterVolSlider && audioProcessor.masterVolParam)
        audioProcessor.masterVolParam->setValueNotifyingHost(masterVolSlider.getValue());
    else if (slider == &velSensSlider && audioProcessor.velSensParam)
        audioProcessor.velSensParam->setValueNotifyingHost(velSensSlider.getValue());
    else if (slider == &filterFreqSlider && audioProcessor.filterFreqParam)
        audioProcessor.filterFreqParam->setValueNotifyingHost(filterFreqSlider.getValue());
    else if (slider == &filterQSlider && audioProcessor.filterQParam)
        audioProcessor.filterQParam->setValueNotifyingHost(filterQSlider.getValue());
    else if (slider == &eqLowSlider && audioProcessor.eqLowParam)
        audioProcessor.eqLowParam->setValueNotifyingHost(eqLowSlider.getValue());
    else if (slider == &eqMidSlider && audioProcessor.eqMidParam)
        audioProcessor.eqMidParam->setValueNotifyingHost(eqMidSlider.getValue());
    else if (slider == &eqHighSlider && audioProcessor.eqHighParam)
        audioProcessor.eqHighParam->setValueNotifyingHost(eqHighSlider.getValue());
}

void SnowflakeInstrumentStudioAudioProcessorEditor::buttonClicked(juce::Button* button)
{
    if (button == &recordButton)
    {
        // Toggle recording state
        if (recordButton.getToggleState())
        {
            recordButton.setToggleState(false, juce::dontSendNotification);
        }
        else
        {
            recordButton.setToggleState(true, juce::dontSendNotification);
            recordTimeLabel.setText("00:00.000", juce::dontSendNotification);
        }
    }
    else if (button == &playButton)
    {
        playButton.setToggleState(true, juce::dontSendNotification);
    }
    else if (button == &stopButton)
    {
        recordButton.setToggleState(false, juce::dontSendNotification);
        playButton.setToggleState(false, juce::dontSendNotification);
        stopButton.setToggleState(false, juce::dontSendNotification);
    }
    else if (button == &exportWavButton)
    {
        fileChooser = std::make_unique<juce::FileChooser>(
            "Export Recording as WAV",
            juce::File::getSpecialLocation(juce::File::userDesktopDirectory),
            "*.wav",
            true,
            false,
            this
        );
        fileChooser->browseForFileToSave(false);
    }
    else if (button == &browseSamplesButton)
    {
        fileChooser = std::make_unique<juce::FileChooser>(
            "Select WAV Sample Files",
            juce::File::getSpecialLocation(juce::File::userMusicDirectory),
            "*.wav",
            true,
            false,
            this
        );
        fileChooser->browseForMultipleFilesToOpen();
    }
    else if (button == &autoMapButton)
    {
        samplesLoadedLabel.setText("Auto-mapping samples...", juce::dontSendNotification);
    }
    else if (button == &applyMappingButton)
    {
        int rootNote = rootNoteCombo.getSelectedItemIndex();
        int loNote = loNoteCombo.getSelectedItemIndex();
        int hiNote = hiNoteCombo.getSelectedItemIndex();
        juce::String msg = "Mapping applied: " + juce::String(rootNote) + "-" + juce::String(loNote) + "-" + juce::String(hiNote);
        samplesLoadedLabel.setText(msg, juce::dontSendNotification);
    }
    else if (button == &clearMappingButton)
    {
        samplesLoadedLabel.setText("No samples loaded", juce::dontSendNotification);
        loadedSampleCount = 0;
    }
    else if (button == &uploadBgButton)
    {
        fileChooser = std::make_unique<juce::FileChooser>(
            "Select Background Image",
            juce::File::getSpecialLocation(juce::File::userDesktopDirectory),
            "*.png;*.jpg;*.jpeg",
            true,
            false,
            this
        );
        fileChooser->browseForFileToOpen();
    }
    else if (button == &roundRobinButton)
    {
        if (audioProcessor.roundRobinParam)
            audioProcessor.roundRobinParam->setValueNotifyingHost(
                roundRobinButton.getToggleState() ? 1.0f : 0.0f
            );
    }
}

void SnowflakeInstrumentStudioAudioProcessorEditor::fileChooserBoxWaiting(juce::FileChooser*)
{
    // Optional: Show loading indicator
}

void SnowflakeInstrumentStudioAudioProcessorEditor::fileChooserBoxFinished(juce::FileChooser* chooser)
{
    if (!chooser)
        return;

    auto results = chooser->getResults();
    if (results.isEmpty())
        return;

    // Determine what type of file chooser this was based on button state
    // This is a simplified approach - production code would track the chooser type
    auto file = results[0];

    if (file.getFileExtension().toLowerCase() == ".wav")
    {
        // Sample file(s) selected
        loadedSampleCount = results.size();
        samplesLoadedLabel.setText(
            juce::String(loadedSampleCount) + " sample(s) loaded",
            juce::dontSendNotification
        );
    }
    else if (file.getFileExtension().toLowerCase() == ".png" || 
             file.getFileExtension().toLowerCase() == ".jpg" ||
             file.getFileExtension().toLowerCase() == ".jpeg")
    {
        // Background image selected
        backgroundImagePath = file.getFullPathName();
        backgroundImage = juce::ImageFileFormat::loadFrom(file);
        repaint();
    }
}

void SnowflakeInstrumentStudioAudioProcessorEditor::updateRecordingDisplay()
{
    // This would be called from a timer to update recording time
    // Placeholder for now
}

void SnowflakeInstrumentStudioAudioProcessorEditor::drawPianoKeyboard(juce::Graphics& g,
                                                                      const juce::Rectangle<int>& area)
{
    // Draw a simplified piano keyboard preview
    int whiteKeyWidth = 18;
    int blackKeyWidth = 11;
    int keyHeight = 60;
    
    // Draw white keys (C through B)
    const juce::String whiteNotes[] = { "C", "D", "E", "F", "G", "A", "B" };
    for (int i = 0; i < 7; ++i)
    {
        auto keyRect = juce::Rectangle<int>(area.getX() + i * whiteKeyWidth, area.getY(), whiteKeyWidth - 1, keyHeight);
        g.setColour(juce::Colours::white);
        g.fillRect(keyRect);
        g.setColour(juce::Colours::black);
        g.drawRect(keyRect, 1);
    }

    // Draw black keys
    const int blackKeyPositions[] = { 1, 2, 4, 5, 6 };  // Between white keys
    for (int pos : blackKeyPositions)
    {
        auto keyRect = juce::Rectangle<int>(
            area.getX() + pos * whiteKeyWidth - blackKeyWidth / 2,
            area.getY(),
            blackKeyWidth,
            keyHeight * 2 / 3
        );
        g.setColour(juce::Colours::black);
        g.fillRect(keyRect);
        g.setColour(juce::Colours::darkgrey);
        g.drawRect(keyRect, 1);
    }
}
