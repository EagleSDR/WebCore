import IEaglePortProperty from "../../../lib/web/ports/IEaglePortProperty";
import EagleNetObjectManager from "../EagleNetObjectManager";
import EagleNetObjectPortProperty from "./EagleNetObjectPortProperty";

export default class EagleNetObjectPortPropertyPrimitive extends EagleNetObjectPortProperty {

    constructor(manager: EagleNetObjectManager, data: any) {
        super(manager, data);
    }

    GetLoggingName(): string {
        return "Port/Property/Primitive";
    }

    protected Serialize(value: any) {
        return value;
    }

    protected Deserialize(value: any) {
        return value;
    }

}