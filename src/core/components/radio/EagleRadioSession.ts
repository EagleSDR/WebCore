import IEaglePluginDemodulator from "../../../../lib/plugin/client/IEaglePluginDemodulator";
import EagleObject from "../../../../lib/web/EagleObject";
import IEagleObjectContext from "../../../../lib/web/IEagleObjectContext";
import IEaglePortProperty from "../../../../lib/web/ports/IEaglePortProperty";

export default class EagleRadioSession extends EagleObject {

    constructor(net: IEagleObjectContext) {
        super("EagleRadioSession", net);
    }

    PortFrequencyOffset: IEaglePortProperty<number>;
    PortBandwidth: IEaglePortProperty<number>;
    PortDemodulator: IEaglePortProperty<EagleObject>;

}