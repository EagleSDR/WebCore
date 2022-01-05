import EagleLoggable from "../../lib/EagleLoggable";
import EagleNetObjectManager from "./EagleNetObjectManager";

export default abstract class EagleNetObjectIO extends EagleLoggable {

    constructor(manager: EagleNetObjectManager, data: any) {
        super("EagleNetObjectIO");
        this.manager = manager;
        this.data = data;
        this.manager.AddIoObject(this);
    }

    protected manager: EagleNetObjectManager;
    protected data: any;

    GetGuid(): string {
        return this.data["guid"] as string;
    }

    abstract OnMessage(data: any): void;
    abstract GetLoggingName(): string;

    protected SendMessage(payload: any) {
        this.manager.SendRawMessage(3, this.GetGuid(), payload);
    }

}