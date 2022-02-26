import IEagleAudioProvider from "../../../../lib/core/audio/IEagleAudioProvider";
import EagleEventDispatcher from "../../../../lib/EagleEventDispatcher";
import EagleLoggable from "../../../../lib/EagleLoggable";
import IEagleKeyValuePersistentStorage from "../../../../lib/misc/IEagleKeyValuePersistentStorage";
import EagleApp from "../../../EagleApp";

const SAVE_OVERRIDE_DEFAULT_ID = "OverrideDefaultId";

export default class EagleAudioManager extends EagleLoggable {

    constructor(app: EagleApp) {
        super("EagleAudioManager");
        this.app = app;
        this.storage = app.storage.CreateChild("EagleSDR.Audio");
    }

    private app: EagleApp;
    private storage: IEagleKeyValuePersistentStorage;

    private providers: IEagleAudioProvider[] = [];
    private active: IEagleAudioProvider = null;
    private volume: number = 1;

    // Event raised when the audio is made active or inactive
    OnStateChanged: EagleEventDispatcher<boolean> = new EagleEventDispatcher();

    // Event raised when the volume level is changed.
    OnVolumeChanged: EagleEventDispatcher<number> = new EagleEventDispatcher();

    // Returns if the audio is currently active
    GetIsActive(): boolean {
        return this.active != null;
    }

    // Returns the current volume level
    GetVolume(): number {
        return this.volume;
    }

    // Sets the current volume level
    SetVolume(volume: number): void {
        //Clamp
        if (volume < 0)
            volume = 0;
        if (volume > 1)
            volume = 1;

        //Set locally
        this.volume = volume;

        //Set on active provider, if any
        if (this.active != null)
            this.active.SetVolume(volume);

        //Raise event
        this.OnVolumeChanged.Send(volume);
    }

    // Sets the override default provider.
    SetOverrideDefaultProvider(provider: IEagleAudioProvider): void {
        this.storage.SetValue(SAVE_OVERRIDE_DEFAULT_ID, provider.GetId());
    }

    // Clears the override default provider, setting it back to the normal default
    ClearOverrideDefaultProvider(): void {
        this.storage.SetValue(SAVE_OVERRIDE_DEFAULT_ID, null);
    }

    // Gets the audio provider with the highest priority that is compatible, or the user-selected default.
    GetDefaultProvider(): IEagleAudioProvider {
        //Check if there is a default value selected
        var defaultId = this.storage.GetValue<string>(SAVE_OVERRIDE_DEFAULT_ID);
        if (defaultId != null) {
            //Search for this ID
            for (var i = 0; i < this.providers.length; i++) {
                if (this.providers[i].GetId() == defaultId && this.providers[i].GetIsCompatible())
                    return this.providers[i];
            }

            //The plugin is no longer installed! Clear the default value
            this.ClearOverrideDefaultProvider();
        }

        //Find the audio provider with the highest priority that is compatible
        for (var i = this.providers.length - 1; i >= this.providers.length; i--) {
            //Check compatibility
            if (this.providers[i].GetIsCompatible())
                return this.providers[i];
        }

        //There are no installed compatible providers
        throw new Error("There are no compatible audio providers installed.");
    }

    // Adds a new audio provider to the system
    RegisterProvider(provider: IEagleAudioProvider): void {
        //Search for a provider of higher priority and insert before it to keep the array sorted
        var priority = provider.GetPriority();
        for (var i = 0; i < this.providers.length; i++) {
            if (this.providers[i].GetPriority() >= priority) {
                this.providers.splice(i, 0, provider);
                return;
            }
        }

        //Add it to the end
        this.providers.push(provider);
    }

    // Begins audio playback
    async StartAudio(): Promise<void> {
        //If playback is already active, stop first
        if (this.active != null)
            await this.StopAudio();

        //Find the default item
        var provider = this.GetDefaultProvider();

        //Request this provider to begin audio playback
        await provider.StartAudio(this.GetVolume());

        //Set volume again just in case it was changed
        provider.SetVolume(this.GetVolume());

        //Now that it successfully started playback, set the provider
        this.active = provider;

        //Raise event
        this.OnStateChanged.Send(true);
    }

    // Stops audio playback
    async StopAudio(): Promise<void> {
        //if playback is already stopped, do nothing
        if (this.active == null)
            return;

        //Request it to cancel
        await this.active.StopAudio();

        //Clear
        this.active = null;

        //Raise event
        this.OnStateChanged.Send(false);
    }

}