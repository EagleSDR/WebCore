import IEaglePortApi from "../../../lib/web/ports/IEaglePortApi";
import EagleNetObjectManager from "../EagleNetObjectManager";
import EagleNetObjectPort from "../EagleNetObjectPort";
import EagleNetObjectPortBaseAck from "./EagleNetObjectPortBaseAck";

export default class EagleNetObjectPortApi extends EagleNetObjectPortBaseAck implements IEaglePortApi {

    constructor(manager: EagleNetObjectManager, data: any) {
        super(manager, data);
    }

    GetLoggingName(): string {
        return "Port/API";
    }

    OnMessage(data: any): void {
        //Read everything out of the message
        var token = data["token"] as string;
        var ok = data["ok"] as boolean;
        var error = data["error"] as string;
        var result = data["result"] as any;

        //Fire the pending message
        if (ok)
            this.FireAckResponseOk(token, result);
        else
            this.FireAckResponseFail(token, error);
    }

    SendRequest(data: any): Promise<any> {
        return this.SendAckRequest((token: string) => {
            this.SendMessage({
                "token": token,
                "payload": data
            });
        });
    }

}