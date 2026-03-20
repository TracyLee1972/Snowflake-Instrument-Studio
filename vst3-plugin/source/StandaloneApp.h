#pragma once

#include <juce_gui_basics/juce_gui_basics.h>
#include "PluginProcessor.h"

class StandaloneMainWindow : public juce::DocumentWindow
{
public:
    StandaloneMainWindow(const juce::String& name)
        : DocumentWindow(name, juce::Colours::darkgrey, juce::DocumentWindow::allButtons, true)
    {
        audioProcessor = std::make_unique<SnowflakeInstrumentStudioAudioProcessor>();
        editor = audioProcessor->createEditor();

        setContentOwned(editor, true);
        setResizable(false, false);
        centreWithSize(600, 500);
        setVisible(true);

        setWantsKeyboardFocus(true);
    }

    ~StandaloneMainWindow() override
    {
    }

    void closeButtonPressed() override
    {
        juce::JUCEApplication::getInstance()->systemRequestedQuit();
    }

private:
    std::unique_ptr<SnowflakeInstrumentStudioAudioProcessor> audioProcessor;
    juce::AudioProcessorEditor* editor = nullptr;
};

class StandaloneApplication : public juce::JUCEApplication
{
public:
    StandaloneApplication() = default;

    const juce::String getApplicationName() override { return "Snowflake Instrument Studio"; }
    const juce::String getApplicationVersion() override { return "1.0.0"; }
    bool moreThanOneInstanceAllowed() override { return true; }

    void initialise(const juce::String&) override
    {
        mainWindow = std::make_unique<StandaloneMainWindow>(getApplicationName());
    }

    void shutdown() override
    {
        mainWindow = nullptr;
    }

    void systemRequestedQuit() override
    {
        quit();
    }

    void anotherInstanceStarted(const juce::String&) override
    {
    }

private:
    std::unique_ptr<StandaloneMainWindow> mainWindow;
};

// Macro for entry point
START_JUCE_APPLICATION(StandaloneApplication)
