import EagleEventDispatcher from "../../../lib/EagleEventDispatcher";
import IEaglePortEvent from "../../../lib/web/ports/IEaglePortEvent";
import EagleNetObjectManager from "../EagleNetObjectManager";
import EagleNetObjectPort from "../EagleNetObjectPort";

export default class EagleNetObjectPortEvent extends EagleNetObjectPort implements IEaglePortEvent {

    constructor(manager: EagleNetObjectManager, data: any) {
        super(manager, data);
    }

    GetLoggingName(): string {
        return "Port/EventDispatcher";
    }

    OnEvent: EagleEventDispatcher<any> = new EagleEventDispatcher<any>();

    SendEvent(data: any) {
        this.SendMessage(data);
    }

    OnMessage(data: any): void {
        try {
            this.OnEvent.Send(data);
        } catch (e) {
            this.Error("Error handling broadcast event [" + this.GetGuid() + "] (" + this.GetName() + "): " + e);
        }
    }

}