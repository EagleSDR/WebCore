import IEagleContext from "../../lib/core/IEagleContext";
import EagleEventDispatcher from "../../lib/EagleEventDispatcher";
import EagleLoggable from "../../lib/EagleLoggable";
import { EagleDialogButtonType } from "../../lib/ui/dialog/button/EagleDialogButtonType";
import EagleObject from "../../lib/web/EagleObject";
import IEagleObjectConstructor from "../../lib/web/IEagleObjectConstructor";
import IEagleObjectContext from "../../lib/web/IEagleObjectContext";
import IEagleObjectFactory from "../../lib/web/IEagleObjectFactory";
import IEagleObjectManager from "../../lib/web/IEagleObjectManager";
import EagleApp from "../EagleApp";
import { EagleNetObjectInstance } from "./EagleNetObjectInstance";
import EagleNetObjectIO from "./EagleNetObjectIO";

class EagleObjectConstructionProxy implements IEagleObjectFactory {

    constructor(cls: IEagleObjectConstructor) {
        this.cls = cls;
    }

    private cls: IEagleObjectConstructor;

    InflateObject(context: IEagleObjectContext): EagleObject {
        return new this.cls(context);
    }

}

export default class EagleNetObjectManager extends EagleLoggable implements IEagleObjectManager {

    constructor(app: EagleApp) {
        super("EagleNetObjectManager");
        this.app = app;
    }

    Connect(url: string): Promise<EagleObject> {
        return new Promise<EagleObject>((resolve, reject) => {
            //Set
            this.connectCallback = resolve;

            //Create socket
            this.sock = new WebSocket(url);
            this.sock.addEventListener("open", (evt: Event) => {
                this.Log("WebSocket connection opened.");
                this.OnReady.Send(this);
            });
            this.sock.addEventListener("message", (evt: MessageEvent) => {
                this.OnRawMessage(JSON.parse(evt.data));
            });
            this.sock.addEventListener("close", (evt: CloseEvent) => {
                this.Log("WebSocket connection closed.");
                this.OnDisconnect();
            });
        });
    }

    OnReady: EagleEventDispatcher<EagleNetObjectManager> = new EagleEventDispatcher<EagleNetObjectManager>();

    private app: EagleApp;
    private sock: WebSocket;
    private classes: { [key: string]: IEagleObjectFactory } = {};
    private io: { [guid: string]: EagleNetObjectIO } = {};
    private connectCallback: (control: EagleObject) => void;

    GetContext(): IEagleContext {
        return this.app;
    }

    AddIoObject(obj: EagleNetObjectIO) {
        //Get GUID
        var guid = obj.GetGuid();

        //Make sure it doesn't already exist
        if (this.io[guid] != null)
            throw Error("Attempted to register duplicate GUID: " + guid);

        //Register
        this.io[guid] = obj;

        //Log
        this.Log("Registered new " + obj.GetLoggingName() + " with GUID [" + guid + "].");
    }

    RegisterClass(classname: string, constructor: IEagleObjectConstructor) {
        this.RegisterClassFactory(classname, new EagleObjectConstructionProxy(constructor));
    }

    RegisterClassFactory(classname: string, constructor: IEagleObjectFactory) {
        this.classes[classname] = constructor;
    }

    ResolveNetObject(guid: string) {
        //Resolve the GUID
        var ctx = this.ResolveGuid(guid) as EagleNetObjectInstance;

        //Make sure it has an associated type
        if (ctx.ctx == null)
            throw new Error("The net object you are attempting to resolve EXISTS, but no type was assigned to it at runtime. Make sure you assign a type to \"" + ctx.GetTypes()[0] + "\" or one of it's superclasses.");

        //Get it's associated type
        return ctx.ctx;
    }

    private ResolveGuid(guid: string): EagleNetObjectIO {
        var dest = this.io[guid];
        if (dest == null)
            throw Error("Attempted to resolve invalid GUID: " + guid);
        return dest;
    }

    private OnRawMessage(msg: any) {
        //Get the arguments
        var opcode = msg["o"] as number;
        var guid = msg["g"] as string;
        var payload = msg["p"] as any;

        //Switch on opcode
        switch (opcode) {
            case 1: this.OnMessageCreate(guid, payload); break;
            case 2: this.OnMessageDelete(guid, payload); break;
            case 3: this.OnMessageEvent(guid, payload); break;
            case 4: this.connectCallback(this.ResolveNetObject(guid)); break;
            case 5: this.OnMessageObjectReady(guid, payload); break;
            default: this.Error("Server sent unknown message opcode: " + opcode); break;
        }
    }

    private FindMatchingType(types: string[]): string {
        for (var i = 0; i < types.length; i++) {
            if (this.classes[types[i]] != null)
                return types[i];
        }
        return null;
    }

    private OnMessageObjectReady(guid: string, payload: any): void {
        //Do nothing for now...
    }

    private OnMessageCreate(guid: string, payload: any): void {
        //Create the instance
        var instance = new EagleNetObjectInstance(this, payload);

        //Get types and search for a matching one
        var mClassName = this.FindMatchingType(instance.GetTypes());
        if (mClassName == null) {
            //None found. Send a warning
            this.Warn("Creating NetObject as type \"" + instance.GetTypes()[0] + "\", but no matching registered classes were found! Make sure you register this class with an object. This will likely cause later bugs.");

            //Create a dummy context
            instance.ctx = {};
        } else {
            //Instantiate class
            instance.ctx = this.classes[mClassName].InflateObject(instance);
        }

        //Set ports
        var names = instance.GetPortNames();
        for (var i = 0; i < names.length; i++) {
            instance.ctx["Port" + names[i]] = instance.GetPort(names[i]);
        }

        //Log
        this.Log("Created NetObject [" + guid + "] of type: " + mClassName);
    }

    private OnMessageEvent(guid: string, payload: any): void {
        //Get the destination
        var destination: EagleNetObjectIO;
        try {
            destination = this.ResolveGuid(guid);
        } catch (e) {
            this.Error("Server sent message to invalid GUID: " + guid);
            return;
        }

        //Dispatch to this
        try {
            destination.OnMessage(payload);
        } catch (e) {
            this.Error("Eagle IO item threw an exception while handling message: " + e);
            return;
        }
    }

    private OnMessageDelete(guid: string, payload: any): void {
        /* Delete item */
    }

    SendRawMessage(opcode: number, guid: string, payload: any): void {
        var msg = {
            "o": opcode,
            "g": guid,
            "p": payload
        }
        this.sock.send(JSON.stringify(msg));
    }

    private OnDisconnect(): void {
        var builder = this.app.GetDialogManager().CreateDialogBuilder();
        builder.AddTitle("Connection Lost");
        builder.AddParagraph("There was a network problem communicating with the EagleSDR server. Check your internet connection.");
        var btn = builder.AddButton("Reload", EagleDialogButtonType.NEGATIVE, () => {
            btn.SetLoading(true);
            document.location.reload();            
        });
        builder.Show();
    }

}