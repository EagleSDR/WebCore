import EagleObject from "../../../../lib/web/EagleObject";
import IEagleObjectContext from "../../../../lib/web/IEagleObjectContext";
import IEaglePortApi from "../../../../lib/web/ports/IEaglePortApi";
import EagleControlComponents from "./EagleControlComponents";

export default class EagleControl extends EagleObject {

    constructor(net: IEagleObjectContext) {
        super("EagleControl", net);
    }

    private PortGetComponents: IEaglePortApi;
    private PortGetPluginModules: IEaglePortApi;

    async GetComponents(): Promise<EagleControlComponents> {
        var result = await this.PortGetComponents.SendRequest({});
        return new EagleControlComponents(result, this.net.GetManager());
    }

    async GetPluginModules(): Promise<{ [pluginId: string]: { [classname: string]: string } }> {
        var result = await this.PortGetPluginModules.SendRequest({});
        return result["plugins"];
    }

}