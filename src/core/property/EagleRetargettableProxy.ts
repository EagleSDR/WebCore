import IEagleProperty from "../../../lib/core/port/IEagleProperty";
import EagleEventDispatcher from "../../../lib/EagleEventDispatcher";
import IEagleEventDispatcherHandler from "../../../lib/IEagleEventDispatcherHandler";

//Represents an item with property getters that can be seamlessly retargetted to point to a different item of the same type, automatically dispatching changes for each property.
export default class EagleRetargettableProxy<T> {

    constructor() {

    }

    private ports: EmulatedPortProperty[] = [];
    private target: T;

    As(): T {
        return (this as any) as T;
    }

    GetCurrent(): T {
        return this.target;
    }

    SetCurrent(target: T) {
        //Set
        this.target = target;

        //Loop through and retarget each port
        for (var i = 0; i < this.ports.length; i++)
            this.ports[i].Retarget(target);
    }

    AddProperty(funcName: string): void {
        //Create the port
        var port = new EmulatedPortProperty(funcName);

        //Add getter function
        (this as any)[funcName] = () => {
            return port;
        };

        //Add to ports list
        this.ports.push(port);
    }

}

class EmulatedPortProperty implements IEagleProperty<any> {

    constructor(funcName: string) {
        //Set
        this.funcName = funcName;

        //Create handler
        this.handler = {
            HandleEvent: (data) => this.OnUpdated.Send(data)
        };
    }

    private funcName: string;
    private underlying: IEagleProperty<any>;
    private handler: IEagleEventDispatcherHandler<any>;

    Retarget(holder: any) {
        //Get the port from the holder
        var port = holder[this.funcName]() as IEagleProperty<any>;

        //Unbind from old port
        if (this.underlying != null)
            this.underlying.OnUpdated.Unbind(this.handler);

        //Update
        this.underlying = port;

        //Bind
        if (this.underlying != null)
            this.underlying.OnUpdated.Bind(this.handler);

        //Send event
        try {
            if (this.underlying != null)
                this.OnUpdated.Send(this.GetValue());
        } catch (error: any) {
            //Ignore...
        }
    }

    /* IMPLEMENTATION */

    GetValue(): any {
        return this.underlying.GetValue();
    }

    SetValue(value: any): Promise<void> {
        return this.underlying.SetValue(value);
    }

    CanEdit(): boolean {
        return this.underlying.CanEdit();
    }

    OnUpdated: EagleEventDispatcher<any> = new EagleEventDispatcher<any>();

}