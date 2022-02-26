import { EagleDialogButtonType } from "../../../../lib/ui/dialog/button/EagleDialogButtonType";
import EagleAudioManager from "../../../core/components/audio/EagleAudioManager";
import EagleApp from "../../../EagleApp";
import EagleCoreSidebarBtn from "../sidebar/EagleCoreSidebarBtn";
require('./btns.css');

const CLASSNAME_MUTED = "eagle_core_btns_volume_off";
const CLASSNAME_PLAYING = "eagle_core_btns_volume_on";

export default class EagleCoreSidebarBtnMute extends EagleCoreSidebarBtn {

    constructor(app: EagleApp) {
        super(app.audio.GetIsActive() ? CLASSNAME_PLAYING : CLASSNAME_MUTED);
        this.app = app;
        this.app.audio.OnStateChanged.Bind({
            HandleEvent: () => this.ChangeCustomClassname(this.app.audio.GetIsActive() ? CLASSNAME_PLAYING : CLASSNAME_MUTED)
        });
    }

    private app: EagleApp;

    protected async HandleClick(): Promise<void> {
        if (this.app.audio.GetIsActive()) {
            //Currently playing, stop the audio
            try {
                await this.app.audio.StopAudio();
            } catch (error: any) {
                this.app.GetDialogManager().ShowAlertDialog("Couldn't Stop Audio", error, "Accept", EagleDialogButtonType.NEGATIVE);
            }
        } else {
            //Not currently playing, begin the audio
            try {
                await this.app.audio.StartAudio();
            } catch (error: any) {
                this.app.GetDialogManager().ShowAlertDialog("Couldn't Start Audio", error, "Accept", EagleDialogButtonType.NEGATIVE);
            }
        }
    }

}