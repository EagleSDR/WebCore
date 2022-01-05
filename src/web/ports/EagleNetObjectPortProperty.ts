import EagleEventDispatcher from "../../../lib/EagleEventDispatcher";
import IEaglePortProperty from "../../../lib/web/ports/IEaglePortProperty";
import EagleNetObjectManager from "../EagleNetObjectManager";
import EagleNetObjectPort from "../EagleNetObjectPort";
import EagleNetObjectPortBaseAck from "./EagleNetObjectPortBaseAck";

export default abstract class EagleNetObjectPortProperty extends EagleNetObjectPortBaseAck implements IEaglePortProperty<any> {

    constructor(manager: EagleNetObjectManager, data: any) {
        super(manager, data);
        this.isWritable = data["writable"];
        this.requiredPermissions = data["required_permissions"];
        this.OnUpdated = new EagleEventDispatcher();
    }

    private currentValue: any;
    private isWritable: boolean;
    private requiredPermissions: string[];

    OnUpdated: EagleEventDispatcher<any>;

    OnMessage(data: any): void {
        this.OnPropMessage(data["opcode"], data["payload"]);
    }

    GetValue(): any {
        return this.currentValue;
    }

    SetValue(value: any): Promise<void> {
        return this.SendAckRequest((token: string) => {
            this.SendPropMessage("SET", {
                "token": token,
                "value": this.Serialize(value)
            });
        });
    }

    CanEdit(): boolean {
        //If it's not web writable at all, return false
        if (!this.isWritable)
            return false;

        return true; //TODO: Check to see if we have the required permissions
    }

    protected OnPropMessage(opcode: string, data: any): void {
        if (opcode == "ACK") {
            //ACK endpoint is a response to SET. It can either be good or bad.
            var token = data["token"] as string;
            if (data["ok"] as boolean)
                this.FireAckResponseOk(token, null);
            else
                this.FireAckResponseFail(token, data["error"] as string);
        }
        if (opcode == "UPDATE") {
            //UPDATE endpoints are sent when the value changes
            this.currentValue = this.Deserialize(data["value"]);
            this.OnUpdated.Send(this.currentValue);
        }
    }

    protected abstract Serialize(value: any): any;
    protected abstract Deserialize(value: any): any;

    protected SendPropMessage(opcode: string, data: any): void {
        this.SendMessage({
            "opcode": opcode,
            "payload": data
        });
    }

}