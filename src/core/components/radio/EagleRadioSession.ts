import IEagleProperty from "../../../../lib/core/port/IEagleProperty";
import IEagleRadio from "../../../../lib/core/radio/IEagleRadio";
import IEagleRadioSession from "../../../../lib/core/radio/IEagleRadioSession";
import EagleEventDispatcher from "../../../../lib/EagleEventDispatcher";
import IEaglePluginDemodulator from "../../../../lib/plugin/client/IEaglePluginDemodulator";
import { EagleDialogButtonType } from "../../../../lib/ui/dialog/button/EagleDialogButtonType";
import EagleObject from "../../../../lib/web/EagleObject";
import IEagleObjectContext from "../../../../lib/web/IEagleObjectContext";
import IEaglePortProperty from "../../../../lib/web/ports/IEaglePortProperty";
import EagleBaseProperty from "../../property/EagleBaseProperty";
import EagleLocalProperty from "../../property/EagleLocalProperty";

export default class EagleRadioSession extends EagleObject implements IEagleRadioSession {

    constructor(net: IEagleObjectContext) {
        super("EagleRadioSession", net);

        //Bind to error alerts
        this.net.GetPortEvent("OnError").OnEvent.Bind({
            HandleEvent: (data: any) => {
                this.net.GetContext().GetDialogManager().ShowAlertDialog("Radio VFO Stopped", "The radio VFO was stopped because of an error:\n\n" + data["message"], "Accept", EagleDialogButtonType.NEGATIVE);
            }
        });
    }

    private vfoLocked: EagleLocalProperty<boolean> = new EagleLocalProperty(true);
    private absoluteFreq: VfoAbsoluteFreq = new VfoAbsoluteFreq(this);

    GetRadio(): IEagleRadio {
        return this.net.GetContext().GetRadio();
    }

    FrequencyOffset(): IEaglePortProperty<number> {
        return this.net.GetPortProperty("FrequencyOffset");
    }

    FrequencyAbsolute(): IEagleProperty<number> {
        return this.absoluteFreq;
    }

    VfoLocked(): IEagleProperty<boolean> {
        return this.vfoLocked;
    }

    Bandwidth(): IEaglePortProperty<number> {
        return this.net.GetPortProperty("Bandwidth");
    }

    Demodulator(): IEaglePortProperty<EagleObject> {
        return this.net.GetPortProperty("Demodulator");
    }

}

// Controls the absolute freq. Usually, setting this adjusts the freq of the source and keeps the offset set to 0. If the user locks the VFO, the source won't be changed but the offset will be
class VfoAbsoluteFreq extends EagleBaseProperty<number> {

    constructor(session: EagleRadioSession) {
        super(true);
        this.session = session;
    }

    private session: EagleRadioSession;

    private GetOffsetFreqProp(): IEagleProperty<number> {
        return this.session.FrequencyOffset();
    }

    private GetCenterFreqProp(): IEagleProperty<number> {
        return this.session.GetRadio().CenterFrequency();
    }

    GetValue(): number {
        //Add the center freq and the offset
        return this.GetCenterFreqProp().GetValue() + this.GetOffsetFreqProp().GetValue();
    }

    async SetValueInternal(value: number): Promise<void> {
        //Act differently depending on if the VFO is locked or not
        if (this.session.VfoLocked().GetValue()) {
            //VFO is locked. Just move the center frequency...
            await this.GetCenterFreqProp().SetValue(value);
        } else {
            //VFO is unlocked. Get the new offset from the center frequency
            var offset = value - this.GetCenterFreqProp().GetValue();

            //TODO: Do some bounds checking
            //...

            //Apply offset to the offset alone, leaving the center frequency untouched
            await this.GetOffsetFreqProp().SetValue(offset);
        }
    }

}