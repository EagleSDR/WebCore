import EagleEventDispatcher from "../../lib/EagleEventDispatcher";
import EagleLoggable from "../../lib/EagleLoggable";
import IEagleManagedSocket from "../../lib/web/IEagleManagedSocket";
import EagleApp from "../EagleApp";

export default class EagleManagedSocket extends EagleLoggable implements IEagleManagedSocket {

    constructor(app: EagleApp, guid: string) {
        super("EagleManagedSocket");

        //Set
        this.id = guid;

        //Create URL
        this.url = app.CreateUrl(true, "/ws/sock", {
            "access_token": app.GetAccessToken(),
            "sock_id": guid
        });

        //Create socket
        this.sock = new WebSocket(this.url);
        this.sock.binaryType = "arraybuffer";
        this.sock.addEventListener("open", (evt: Event) => {
            this.Log("WebSocket connection opened.");

            //Set flag
            this.ready = true;

            //Send everything in queue
            for (var i = 0; i < this.queue.length; i++)
                this.Send(this.queue[i]);
            this.queue = [];

            //Send event
            this.OnReady.Send();
        });
        this.sock.addEventListener("message", (evt: MessageEvent) => {
            //Send event
            if (evt.data instanceof ArrayBuffer)
                this.OnBinaryMessage.Send(evt.data as ArrayBuffer);
            else
                this.OnTextMessage.Send(evt.data as string);
        });
        this.sock.addEventListener("close", (evt: CloseEvent) => {
            this.Log("WebSocket connection closed.");

            //Set flag
            this.ready = false;
        });
    }

    private id: string;
    private url: string;
    private sock: WebSocket;
    private ready: boolean = false;
    private queue: (string | ArrayBuffer)[] = [];

    GetId(): string {
        return this.id;
    }

    SendText(data: string): void {
        this.Send(data);
    }

    SendBinary(data: ArrayBuffer): void {
        this.Send(data);
    }

    private Send(data: string | ArrayBuffer): void {
        //If we're connected, send immediately. Otherwise push to the queue
        if (this.ready)
            this.sock.send(data);
        else
            this.queue.push(data);
    }

    Close(): void {
        this.sock.close();
    }

    OnReady: EagleEventDispatcher<void> = new EagleEventDispatcher();
    OnTextMessage: EagleEventDispatcher<string> = new EagleEventDispatcher();
    OnBinaryMessage: EagleEventDispatcher<ArrayBuffer> = new EagleEventDispatcher();

}