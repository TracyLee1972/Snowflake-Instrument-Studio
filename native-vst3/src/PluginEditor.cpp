#include "PluginEditor.h"

namespace
{
enum class SnowflakeStyle
{
    subtleBold,
    showcaseBold
};

constexpr auto kSnowflakeStyle = SnowflakeStyle::showcaseBold;

struct SnowflakePaintStyle
{
    float radiusScale;
    float shadowOffset;
    int shadowAlpha;
    float shadowStroke;
    int outerGlowA;
    float outerGlowStrokeA;
    int outerGlowB;
    float outerGlowStrokeB;
    int whiteHighlightAlpha;
    float mainStroke;
};

SnowflakePaintStyle getSnowflakePaintStyle()
{
    if (kSnowflakeStyle == SnowflakeStyle::subtleBold)
    {
        return SnowflakePaintStyle {
            0.36f,
            2.8f,
            122,
            7.2f,
            40,
            10.5f,
            28,
            14.5f,
            190,
            5.9f
        };
    }

    return SnowflakePaintStyle {
        0.39f,
        3.5f,
        150,
        8.2f,
        55,
        13.0f,
        42,
        18.0f,
        205,
        6.8f
    };
}

void drawSnowflakeBackground (juce::Graphics& g, juce::Rectangle<float> area)
{
    const auto style = getSnowflakePaintStyle();
    const auto center = area.getCentre();
    const auto radius = juce::jmin (area.getWidth(), area.getHeight()) * style.radiusScale;

    juce::Path snowflake;
    for (int i = 0; i < 6; ++i)
    {
        const auto angle = juce::MathConstants<float>::twoPi * (static_cast<float> (i) / 6.0f);
        const auto dir = juce::Point<float> (std::cos (angle), std::sin (angle));
        const auto end = center + dir * radius;

        snowflake.startNewSubPath (center);
        snowflake.lineTo (end);

        const auto branchA = center + dir * (radius * 0.68f);
        const auto branchB = center + dir * (radius * 0.45f);
        const auto a1 = angle + juce::MathConstants<float>::pi / 7.0f;
        const auto a2 = angle - juce::MathConstants<float>::pi / 7.0f;

        const auto b1 = juce::Point<float> (std::cos (a1), std::sin (a1));
        const auto b2 = juce::Point<float> (std::cos (a2), std::sin (a2));

        snowflake.startNewSubPath (branchA);
        snowflake.lineTo (branchA - b1 * (radius * 0.18f));
        snowflake.startNewSubPath (branchA);
        snowflake.lineTo (branchA - b2 * (radius * 0.18f));

        snowflake.startNewSubPath (branchB);
        snowflake.lineTo (branchB - b1 * (radius * 0.12f));
        snowflake.startNewSubPath (branchB);
        snowflake.lineTo (branchB - b2 * (radius * 0.12f));
    }

    juce::Path innerHex;
    for (int i = 0; i < 6; ++i)
    {
        const auto angle = juce::MathConstants<float>::twoPi * (static_cast<float> (i) / 6.0f);
        const auto point = center + juce::Point<float> (std::cos (angle), std::sin (angle)) * (radius * 0.23f);
        if (i == 0)
            innerHex.startNewSubPath (point);
        else
            innerHex.lineTo (point);
    }
    innerHex.closeSubPath();

    auto shadow = snowflake;
    shadow.applyTransform (juce::AffineTransform::translation (style.shadowOffset, style.shadowOffset));
    g.setColour (juce::Colour::fromRGBA (12, 32, 60, style.shadowAlpha));
    g.strokePath (shadow, juce::PathStrokeType (style.shadowStroke, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));

    g.setColour (juce::Colour::fromRGBA (72, 164, 255, style.outerGlowA));
    g.strokePath (snowflake, juce::PathStrokeType (style.outerGlowStrokeA, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));
    g.setColour (juce::Colour::fromRGBA (180, 228, 255, style.outerGlowB));
    g.strokePath (snowflake, juce::PathStrokeType (style.outerGlowStrokeB, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));

    juce::ColourGradient gradient (juce::Colour::fromRGB (240, 248, 255), center.x, center.y - radius,
                                   juce::Colour::fromRGB (56, 154, 255), center.x, center.y + radius, false);
    gradient.addColour (0.35, juce::Colour::fromRGB (201, 235, 255));
    gradient.addColour (0.65, juce::Colour::fromRGB (130, 203, 255));
    g.setGradientFill (gradient);
    g.strokePath (snowflake, juce::PathStrokeType (style.mainStroke, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));

    g.setColour (juce::Colour::fromRGBA (255, 255, 255, style.whiteHighlightAlpha));
    g.strokePath (snowflake, juce::PathStrokeType (1.4f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));

    g.setColour (juce::Colour::fromRGBA (190, 233, 255, 185));
    g.fillPath (innerHex);
    g.setColour (juce::Colour::fromRGBA (245, 252, 255, 215));
    g.strokePath (innerHex, juce::PathStrokeType (1.6f));

    for (int i = 0; i < 6; ++i)
    {
        const auto angle = juce::MathConstants<float>::twoPi * (static_cast<float> (i) / 6.0f);
        const auto tip = center + juce::Point<float> (std::cos (angle), std::sin (angle)) * radius;
        g.setColour (juce::Colour::fromRGBA (255, 255, 255, 220));
        g.fillEllipse (juce::Rectangle<float> (8.0f, 8.0f).withCentre (tip));
        g.setColour (juce::Colour::fromRGBA (150, 214, 255, 225));
        g.drawEllipse (juce::Rectangle<float> (10.0f, 10.0f).withCentre (tip), 1.2f);
    }
}
}

SnowflakeInstrumentStudioAudioProcessorEditor::SnowflakeInstrumentStudioAudioProcessorEditor (SnowflakeInstrumentStudioAudioProcessor& p)
    : AudioProcessorEditor (&p), processor (p)
{
    setSize (820, 520);

    titleLabel.setText ("Snowflake Instrument Studio", juce::dontSendNotification);
    titleLabel.setJustificationType (juce::Justification::centredLeft);
    titleLabel.setFont (juce::FontOptions (22.0f, juce::Font::bold));
    addAndMakeVisible (titleLabel);

    sampleLabel.setText ("No sample loaded", juce::dontSendNotification);
    sampleLabel.setJustificationType (juce::Justification::centredLeft);
    sampleLabel.setColour (juce::Label::textColourId, juce::Colours::lightgrey);
    addAndMakeVisible (sampleLabel);

    loadSampleButton.addListener (this);
    setArtworkButton.addListener (this);
    addAndMakeVisible (loadSampleButton);
    addAndMakeVisible (setArtworkButton);

    artworkView.setImagePlacement (juce::RectanglePlacement::centred);
    addAndMakeVisible (artworkView);

    setupKnob (attackSlider, "Attack");
    setupKnob (releaseSlider, "Release");
    setupKnob (cutoffSlider, "Cutoff");
    setupKnob (resonanceSlider, "Res");
    setupKnob (gainSlider, "Gain");

    attackAttachment = std::make_unique<SliderAttachment> (processor.apvts, "attack", attackSlider);
    releaseAttachment = std::make_unique<SliderAttachment> (processor.apvts, "release", releaseSlider);
    cutoffAttachment = std::make_unique<SliderAttachment> (processor.apvts, "cutoff", cutoffSlider);
    resonanceAttachment = std::make_unique<SliderAttachment> (processor.apvts, "resonance", resonanceSlider);
    gainAttachment = std::make_unique<SliderAttachment> (processor.apvts, "gain", gainSlider);

    processor.addChangeListener (this);
    refreshFromProcessor();
}

SnowflakeInstrumentStudioAudioProcessorEditor::~SnowflakeInstrumentStudioAudioProcessorEditor()
{
    processor.removeChangeListener (this);
    loadSampleButton.removeListener (this);
    setArtworkButton.removeListener (this);
}

void SnowflakeInstrumentStudioAudioProcessorEditor::setupKnob (juce::Slider& slider, const juce::String& name)
{
    slider.setSliderStyle (juce::Slider::RotaryHorizontalVerticalDrag);
    slider.setTextBoxStyle (juce::Slider::TextBoxBelow, false, 64, 18);
    slider.setName (name);
    addAndMakeVisible (slider);
}

void SnowflakeInstrumentStudioAudioProcessorEditor::paint (juce::Graphics& g)
{
    g.fillAll (juce::Colour::fromRGB (13, 13, 16));
    drawSnowflakeBackground (g, getLocalBounds().toFloat());

    auto bounds = getLocalBounds().reduced (12);
    auto top = bounds.removeFromTop (90);
    g.setColour (juce::Colour::fromRGB (25, 27, 34).withAlpha (0.93f));
    g.fillRoundedRectangle (top.toFloat(), 8.0f);

    g.setColour (juce::Colour::fromRGB (36, 38, 48));
    g.drawRoundedRectangle (top.toFloat(), 8.0f, 1.0f);

    auto artArea = juce::Rectangle<int> (12, 112, 250, getHeight() - 124);
    g.setColour (juce::Colour::fromRGB (25, 27, 34).withAlpha (0.93f));
    g.fillRoundedRectangle (artArea.toFloat(), 8.0f);
    g.setColour (juce::Colour::fromRGB (36, 38, 48));
    g.drawRoundedRectangle (artArea.toFloat(), 8.0f, 1.0f);

    g.setColour (juce::Colour::fromRGB (92, 240, 224));
    g.drawFittedText ("Instrument Picture", artArea.removeFromTop (28), juce::Justification::centred, 1);

    auto controlArea = juce::Rectangle<int> (272, 112, getWidth() - 284, getHeight() - 124);
    g.setColour (juce::Colour::fromRGB (25, 27, 34).withAlpha (0.93f));
    g.fillRoundedRectangle (controlArea.toFloat(), 8.0f);
    g.setColour (juce::Colour::fromRGB (36, 38, 48));
    g.drawRoundedRectangle (controlArea.toFloat(), 8.0f, 1.0f);
}

void SnowflakeInstrumentStudioAudioProcessorEditor::resized()
{
    auto bounds = getLocalBounds().reduced (18);

    auto top = bounds.removeFromTop (70);
    titleLabel.setBounds (top.removeFromTop (32));

    auto topRow = top.removeFromTop (32);
    loadSampleButton.setBounds (topRow.removeFromLeft (140));
    topRow.removeFromLeft (8);
    setArtworkButton.setBounds (topRow.removeFromLeft (140));
    topRow.removeFromLeft (12);
    sampleLabel.setBounds (topRow);

    auto body = bounds.removeFromTop (getHeight() - 120);

    auto left = body.removeFromLeft (250);
    left.removeFromTop (36);
    artworkView.setBounds (left.reduced (12));

    body.removeFromLeft (14);

    auto knobs = body.reduced (12);
    const int knobWidth = 120;
    const int knobHeight = 160;

    attackSlider.setBounds (knobs.removeFromLeft (knobWidth).withHeight (knobHeight));
    releaseSlider.setBounds (knobs.removeFromLeft (knobWidth).withHeight (knobHeight));
    cutoffSlider.setBounds (knobs.removeFromLeft (knobWidth).withHeight (knobHeight));
    resonanceSlider.setBounds (knobs.removeFromLeft (knobWidth).withHeight (knobHeight));
    gainSlider.setBounds (knobs.removeFromLeft (knobWidth).withHeight (knobHeight));
}

void SnowflakeInstrumentStudioAudioProcessorEditor::buttonClicked (juce::Button* button)
{
    if (button == &loadSampleButton)
    {
        activeChooser = std::make_unique<juce::FileChooser> ("Select a WAV/AIFF sample", juce::File(), "*.wav;*.aiff;*.aif");
        activeChooser->launchAsync (juce::FileBrowserComponent::openMode | juce::FileBrowserComponent::canSelectFiles,
                                    [this] (const juce::FileChooser& chooser)
                                    {
                                        const auto file = chooser.getResult();
                                        if (file.existsAsFile())
                                            processor.loadSampleFromFile (file);
                                        activeChooser.reset();
                                    });
    }
    else if (button == &setArtworkButton)
    {
        activeChooser = std::make_unique<juce::FileChooser> ("Select instrument picture", juce::File(), "*.png;*.jpg;*.jpeg;*.webp;*.bmp");
        activeChooser->launchAsync (juce::FileBrowserComponent::openMode | juce::FileBrowserComponent::canSelectFiles,
                                    [this] (const juce::FileChooser& chooser)
                                    {
                                        const auto file = chooser.getResult();
                                        if (file.existsAsFile())
                                            processor.setArtworkFromFile (file);
                                        activeChooser.reset();
                                    });
    }
}

void SnowflakeInstrumentStudioAudioProcessorEditor::changeListenerCallback (juce::ChangeBroadcaster* source)
{
    if (source == &processor)
        refreshFromProcessor();
}

void SnowflakeInstrumentStudioAudioProcessorEditor::refreshFromProcessor()
{
    const auto name = processor.getLoadedSampleName();
    sampleLabel.setText (name.isNotEmpty() ? "Sample: " + name : "No sample loaded", juce::dontSendNotification);

    auto image = processor.getArtworkImage();
    artworkView.setImage (image);

    repaint();
}
