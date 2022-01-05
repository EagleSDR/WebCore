import IEaglePort from "../../lib/web/IEaglePort";
import EagleNetObjectIO from "./EagleNetObjectIO";
import EagleNetObjectManager from "./EagleNetObjectManager";

export default abstract class EagleNetObjectPort extends EagleNetObjectIO implements IEaglePort {

    constructor(manager: EagleNetObjectManager, data: any) {
        super(manager, data);
    }

    GetName(): string {
        return this.data["name"] as string;
    }

    protected GetInfo(): any {
        return this.data["info"];
    }

}