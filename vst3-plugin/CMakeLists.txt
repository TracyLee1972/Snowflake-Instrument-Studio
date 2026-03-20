cmake_minimum_required(VERSION 3.21)
project(SnowflakeInstrumentStudio VERSION 1.0.0 LANGUAGES CXX)

# ============================================================================
# Build Options
# ============================================================================
option(BUILD_VST3 "Build VST3 plugin" ON)
option(BUILD_STANDALONE "Build standalone application" ON)

# ============================================================================
# JUCE Setup
# ============================================================================
add_subdirectory(JUCE)

# ============================================================================
# Common Source Files
# ============================================================================
set(SNOWFLAKE_SOURCES
    source/PluginProcessor.h
    source/PluginProcessor.cpp
    source/PluginEditor.h
    source/PluginEditor.cpp
    source/AudioEngine.h
    source/AudioEngine.cpp
    source/SampleManager.h
    source/SampleManager.cpp
    source/ADSREnvelope.h
    source/ADSREnvelope.cpp
    source/FilterProcessor.h
    source/FilterProcessor.cpp
    source/EQProcessor.h
    source/EQProcessor.cpp
)

# ============================================================================
# VST3 Plugin Target
# ============================================================================
if(BUILD_VST3)
    juce_add_plugin(SnowflakeInstrumentStudio-VST3
        COMPANY_NAME                "TracyLee1972"
        COMPANY_WEBSITE             "https://github.com/TracyLee1972/Snowflake-Instrument-Studio"
        COMPANY_EMAIL               "support@example.com"
        PLUGIN_MANUFACTURER_CODE    "Trac"
        PLUGIN_CODE                 "Snis"
        FORMATS                     VST3
        PRODUCT_NAME                "Snowflake Instrument Studio"
        DESCRIPTION                 "Visual Sampler & Instrument Designer - VST3"
        IS_SYNTH                    TRUE
        NEEDS_MIDI_INPUT            TRUE
        NEEDS_MIDI_OUTPUT           FALSE
        IS_MIDI_EFFECT              FALSE
        EDITOR_WANTS_KEYBOARD_FOCUS FALSE
    )

    target_sources(SnowflakeInstrumentStudio-VST3 PRIVATE ${SNOWFLAKE_SOURCES})
    target_compile_features(SnowflakeInstrumentStudio-VST3 PRIVATE cxx_std_17)
    
    target_link_libraries(SnowflakeInstrumentStudio-VST3
        PRIVATE
            juce::juce_audio_utils
            juce::juce_audio_processors
            juce::juce_core
            juce::juce_gui_basics
            juce::juce_gui_extra
        PUBLIC
            juce::juce_recommended_config_flags
            juce::juce_recommended_lto_flags
            juce::juce_recommended_warning_flags
    )
endif()

# ============================================================================
# Standalone Application Target
# ============================================================================
if(BUILD_STANDALONE)
    juce_add_gui_app(SnowflakeInstrumentStudio-Standalone
        PRODUCT_NAME                "Snowflake Instrument Studio"
        COMPANY_NAME                "TracyLee1972"
        COMPANY_WEBSITE             "https://github.com/TracyLee1972/Snowflake-Instrument-Studio"
        COMPANY_EMAIL               "support@example.com"
        DESCRIPTION                 "Visual Sampler & Instrument Designer - Standalone"
        NEEDS_MIDI_INPUT            TRUE
        NEEDS_MIDI_OUTPUT           FALSE
    )

    target_sources(SnowflakeInstrumentStudio-Standalone PRIVATE 
        ${SNOWFLAKE_SOURCES}
        source/StandaloneApp.h
        source/StandaloneApp.cpp
    )

    target_compile_features(SnowflakeInstrumentStudio-Standalone PRIVATE cxx_std_17)
    
    target_link_libraries(SnowflakeInstrumentStudio-Standalone
        PRIVATE
            juce::juce_audio_utils
            juce::juce_audio_processors
            juce::juce_core
            juce::juce_gui_basics
            juce::juce_gui_extra
        PUBLIC
            juce::juce_recommended_config_flags
            juce::juce_recommended_lto_flags
            juce::juce_recommended_warning_flags
    )
endif()
