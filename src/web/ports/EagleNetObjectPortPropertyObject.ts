import EagleObject from "../../../lib/web/EagleObject";
import IEaglePortProperty from "../../../lib/web/ports/IEaglePortProperty";
import EagleNetObjectManager from "../EagleNetObjectManager";
import EagleNetObjectPortProperty from "./EagleNetObjectPortProperty";

export default class EagleNetObjectPortPropertyObject extends EagleNetObjectPortProperty {

    constructor(manager: EagleNetObjectManager, data: any) {
        super(manager, data);
    }

    GetLoggingName(): string {
        return "Port/Property/Selector";
    }

    protected Serialize(value: any) {
        if (value == null)
            return null;
        return (value as EagleObject).GetGuid();
    }

    protected Deserialize(value: any) {
        if (value == null)
            return null;
        return this.manager.ResolveNetObject(value);
    }

}