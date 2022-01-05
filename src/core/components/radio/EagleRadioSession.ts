import EagleObject from "../../../../lib/web/EagleObject";
import IEagleObjectContext from "../../../../lib/web/IEagleObjectContext";

export default class EagleRadioSession extends EagleObject {

    constructor(net: IEagleObjectContext) {
        super("EagleRadioSession", net);
    }

}