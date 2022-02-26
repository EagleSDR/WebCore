import IEagleRadio from "../../../../lib/core/radio/IEagleRadio";
import IEagleRadioSession from "../../../../lib/core/radio/IEagleRadioSession";
import EagleEventDispatcher from "../../../../lib/EagleEventDispatcher";
import IEaglePluginSource from "../../../../lib/plugin/client/IEaglePluginSource";
import { EagleDialogButtonType } from "../../../../lib/ui/dialog/button/EagleDialogButtonType";
import EagleObject from "../../../../lib/web/EagleObject";
import IEagleObjectContext from "../../../../lib/web/IEagleObjectContext";
import IEaglePortProperty from "../../../../lib/web/ports/IEaglePortProperty";
import EagleRetargettableProxy from "../../property/EagleRetargettableProxy";
import EagleRadioSession from "./EagleRadioSession";

export default class EagleRadio extends EagleObject implements IEagleRadio {

    constructor(net: IEagleObjectContext) {
        super("EagleRadio", net);

        //Configure the session pointer with each property in IEagleRadioSession
        this.sessionPointer.AddProperty("FrequencyOffset");
        this.sessionPointer.AddProperty("FrequencyAbsolute");
        this.sessionPointer.AddProperty("VfoLocked");
        this.sessionPointer.AddProperty("Bandwidth");
        this.sessionPointer.AddProperty("Demodulator");
    }

    private sessionPointer: EagleRetargettableProxy<IEagleRadioSession> = new EagleRetargettableProxy();
    private sessions: EagleRadioSession[] = [];

    /* PUBLIC */

    // An event raised when the active session is switched
    OnActiveSessionChanged: EagleEventDispatcher<IEagleRadioSession> = new EagleEventDispatcher();

    // Gets the enabled port.
    Enabled(): IEaglePortProperty<boolean> {
        return this.net.GetPortProperty("IsEnabled");
    }

    // Gets the source port.
    Source(): IEaglePortProperty<EagleObject> {
        return this.net.GetPortProperty("Source");
    }

    // Gets the port of the center frequency of the current source. Changes as the current source is changed.
    CenterFrequency(): IEaglePortProperty<number> {
        return this.net.GetPortProperty("CenterFrequency");
    }

    // Returns a floating session pointer that will ALWAYS point to the active session, even if it's changed. Recommended.
    GetSession(): IEagleRadioSession {
        return this.sessionPointer.As();
    }

    // Gets the current active session, if any. This will always point to this item, even if the active session is changed. Not recommended unless you know what you're doing.
    GetCurrentSession(): IEagleRadioSession {
        return this.sessionPointer.GetCurrent();
    }

    /* INTERNAL */

    // Initializes the radio.
    async Init() {
        //Bind to error alerts
        this.net.GetPortEvent("OnError").OnEvent.Bind({
            HandleEvent: (data: any) => {
                this.net.GetContext().GetDialogManager().ShowAlertDialog("Radio Stopped", "The radio was stopped because of an error:\n\n" + data["message"], "Accept", EagleDialogButtonType.NEGATIVE);
            }
        });

        //Create our session
        var session = await this.CreateSession();

        //Set it as active
        this.ChangeActiveSession(session);
    }

    // Changes the active session
    ChangeActiveSession(session: IEagleRadioSession): void {
        //Update the session pointer
        this.sessionPointer.SetCurrent(session);

        //Raise event
        this.OnActiveSessionChanged.Send(session);
    }

    // Creates a new session. Note that it is NOT set as the active session.
    async CreateSession(): Promise<IEagleRadioSession> {
        //Send a create request
        var data = await this.net.GetPortApi("CreateSession").SendRequest({});

        //Resolve this as the object
        var session = this.ResolveNetObject<EagleRadioSession>(data["guid"] as string);

        //Add to list
        this.sessions.push(session);

        return session;
    }
 
}