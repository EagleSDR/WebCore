import IEaglePluginContext from "../../../lib/plugin/IEaglePluginContext";
import IEaglePluginWindowRegistration from "../../../lib/plugin/IEaglePluginWindowRegistration";
import EagleWindowImplementation from "../../../lib/ui/window/EagleWindowImplementation";
import IEagleWindowContext from "../../../lib/ui/window/IEagleWindowContext";
import IEagleWindowRegistration from "../../ui/window/IEagleWindowRegistration";
import EaglePluginContext from "./EaglePluginContext";

export default class EaglePluginWindowRegistration implements IEagleWindowRegistration {

    constructor(plugin: EaglePluginContext, type: IEaglePluginWindowRegistration, userClassname: string) {
        this.plugin = plugin;
        this.type = type;
        this.userClassname = userClassname;
    }

    private plugin: EaglePluginContext;
    private type: IEaglePluginWindowRegistration;
    private userClassname: string;

    GetRegistration(): IEaglePluginWindowRegistration {
        return this.type;
    }

    GetClassName(): string {
        return this.plugin.GetInfo().developer_name + "." + this.plugin.GetInfo().plugin_name + "." + this.userClassname;
    }

    GetDisplayName(): string {
        return this.userClassname;
    }

    Construct(context: IEagleWindowContext): EagleWindowImplementation {
        return new this.type(context, this.plugin);
    }


}