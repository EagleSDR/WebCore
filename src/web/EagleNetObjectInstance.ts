import IEagleObjectContext from "../../lib/web/IEagleObjectContext";
import IEagleObjectManager from "../../lib/web/IEagleObjectManager";
import IEaglePort from "../../lib/web/IEaglePort";
import IEaglePortApi from "../../lib/web/ports/IEaglePortApi";
import IEaglePortEvent from "../../lib/web/ports/IEaglePortEvent";
import IEaglePortProperty from "../../lib/web/ports/IEaglePortProperty";
import EagleNetObjectIO from "./EagleNetObjectIO";
import EagleNetObjectManager from "./EagleNetObjectManager";
import EagleNetObjectPort from "./EagleNetObjectPort";
import EagleNetObjectPortApi from "./ports/EagleNetObjectPortApi";
import EagleNetObjectPortEvent from "./ports/EagleNetObjectPortEvent";
import EagleNetObjectPortPropertyPrimitive from "./ports/EagleNetObjectPortPropertyPrimitive";
import EagleNetObjectPortPropertyObject from "./ports/EagleNetObjectPortPropertyObject";
import IEagleContext from "../../lib/core/IEagleContext";

export class EagleNetObjectInstance extends EagleNetObjectIO implements IEagleObjectContext {

    constructor(manager: EagleNetObjectManager, data: any) {
        super(manager, data);

        //Create all of our ports
        var portData = data["ports"] as any[];
        for (var i = 0; i < portData.length; i++) {
            var p = this.InflatePort(portData[i]);
            if (p != null)
                this.ports[p.GetName()] = p;
        }
    }

    private ports: { [name: string]: EagleNetObjectPort } = {};
    ctx: any;

    OnMessage(data: any): void {
        throw new Error("Method not implemented.");
    }

    GetLoggingName(): string {
        return "NetObject/" + this.GetTypes()[0];
    }

    private InflatePort(data: any): EagleNetObjectPort {
        var type = data["type"] as string;
        switch (type) {
            case "PORT_API": return new EagleNetObjectPortApi(this.manager, data);
            case "PORT_DISPATCHER": return new EagleNetObjectPortEvent(this.manager, data);
            case "PORT_PROPERTY_PRIMITIVE": return new EagleNetObjectPortPropertyPrimitive(this.manager, data);
            case "PORT_PROPERTY_OBJECT": return new EagleNetObjectPortPropertyObject(this.manager, data);
        }
        this.Error("Attempted to inflate port of unknown type: " + type);
        return null;
    }

    /* API */

    GetTypes(): string[] {
        return this.data["types"] as string[];
    }

    GetExtra(): any {
        return this.data["extra"];
    }

    GetManager(): IEagleObjectManager {
        return this.manager;
    }

    GetContext(): IEagleContext {
        return this.manager.GetContext();
    }

    GetPortNames(): string[] {
        return Object.keys(this.ports);
    }

    GetPort(name: string): IEaglePort {
        if (this.ports[name] == null) {
            this.Warn("Client [" + this.GetLoggingName() + "] attempted to get invalid port: " + name);
            throw new Error("Port does not exist.");
        }
        return this.ports[name];
    }

    GetPortApi(name: string): IEaglePortApi {
        return this.GetPort(name) as IEaglePortApi;
    }

    GetPortEvent(name: string): IEaglePortEvent {
        return this.GetPort(name) as IEaglePortEvent;
    }

    GetPortProperty<T>(name: string): IEaglePortProperty<T> {
        return this.GetPort(name) as IEaglePortProperty<T>;
    }

}