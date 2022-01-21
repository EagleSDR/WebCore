import IEagleContext from "../../lib/core/IEagleContext";
import EagleEventDispatcher from "../../lib/EagleEventDispatcher";
import EagleLoggable from "../../lib/EagleLoggable";
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

    constructor(app: EagleApp, url: string) {
        super("EagleNetObjectManager");
        this.url = url;
        this.app = app;
    }

    Connect(): Promise<EagleObject> {
        return new Promise<EagleObject>((resolve, reject) => {
            //Set
            this.connectCallback = resolve;

            //Create socket
            this.sock = new WebSocket(this.url);
            this.sock.addEventListener("open", (evt: Event) => {
                this.Log("WebSocket connection opened.");
                this.OnReady.Send(this);
            });
            this.sock.addEventListener("message", (evt: MessageEvent) => {
                this.OnRawMessage(JSON.parse(evt.data));
            });
            this.sock.addEventListener("close", (evt: CloseEvent) => {
                this.Log("WebSocket connection closed.");
            });
        });
    }

    OnReady: EagleEventDispatcher<EagleNetObjectManager> = new EagleEventDispatcher<EagleNetObjectManager>();

    private app: EagleApp;
    private url: string;
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

    private OnMessageCreate(guid: string, payload: any): void {
        //Create the instance
        var instance = new EagleNetObjectInstance(this, payload);

        //Get types and search for a matching one
        var mClassName = this.FindMatchingType(instance.GetTypes());
        if (mClassName == null) {
            this.Warn("Attempted to create \"" + instance.GetTypes()[0] + "\", but no matching registered classes were found! Make sure you register this class with an object. This will likely cause later bugs.");
            return;
        }

        //Instantiate
        instance.ctx = this.classes[mClassName].InflateObject(instance);

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

}