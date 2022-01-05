import IEaglePortApi from "../../../lib/web/ports/IEaglePortApi";
import EagleNetObjectManager from "../EagleNetObjectManager";
import EagleNetObjectPort from "../EagleNetObjectPort";

// A class that uses an ACK token to communicate.
export default abstract class EagleNetObjectPortBaseAck extends EagleNetObjectPort {

    constructor(manager: EagleNetObjectManager, data: any) {
        super(manager, data);
    }

    private nextToken: number = 0;
    private pending: { [token: string]: RegisteredPendingRequest } = {};

    protected SendAckRequest(sendCallback: (token: string) => void): Promise<any> {
        //Get our token
        var token = (this.nextToken++).toString();

        //Create promise and register it
        return new Promise((resolve, reject) => {
            //Register
            this.pending[token] = {
                resolve: resolve,
                reject: reject
            };

            //Send message
            sendCallback(token);
        });
    }

    private GetAckResponse(token: string): RegisteredPendingRequest {
        //Get the pending message
        var pending = this.pending[token];
        if (pending == null) {
            this.Warn("Got API response for an unregistered token! This is a bug. Dropping message...");
            return null;
        }

        //Remove from pending list
        delete this.pending[token];

        return pending;
    }

    protected FireAckResponseOk(token: string, result: any) {
        var callback = this.GetAckResponse(token);
        if (callback != null)
            callback.resolve(result);
    }

    protected FireAckResponseFail(token: string, reason: any) {
        var callback = this.GetAckResponse(token);
        if (callback != null)
            callback.reject(reason);
    }

}

interface RegisteredPendingRequest {

    resolve: (response: any) => void;
    reject: (reason: any) => void;

}