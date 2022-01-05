import IEaglePluginDemodulator from "../../../lib/plugin/client/IEaglePluginDemodulator";
import IEaglePluginSource from "../../../lib/plugin/client/IEaglePluginSource";
import IEaglePluginAsset from "../../../lib/plugin/IEaglePluginAsset";
import IEaglePluginBootConfig from "../../../lib/plugin/IEaglePluginBootConfig";
import IEaglePluginContext from "../../../lib/plugin/IEaglePluginContext";
import IEaglePluginObjectConstructor from "../../../lib/plugin/IEaglePluginObjectConstructor";
import EagleObject from "../../../lib/web/EagleObject";
import IEagleObjectConstructor from "../../../lib/web/IEagleObjectConstructor";
import IEagleObjectContext from "../../../lib/web/IEagleObjectContext";
import IEagleObjectFactory from "../../../lib/web/IEagleObjectFactory";
import EagleApp from "../../EagleApp";
import EagleEndpointInfoPlugin from "../../web/endpoints/info/EagleEndpointInfoPlugin";
import EaglePluginAsset from "./EaglePluginAsset";
import EaglePluginManager from "./EaglePluginManager";

class EaglePluginObjectConstructionProxy implements IEagleObjectFactory {

    constructor(ctx: IEaglePluginContext, cls: IEaglePluginObjectConstructor) {
        this.ctx = ctx;
        this.cls = cls;
    }

    private ctx: IEaglePluginContext;
    private cls: IEaglePluginObjectConstructor;

    InflateObject(context: IEagleObjectContext): EagleObject {
        return new this.cls(this.ctx, context);
    }

}

export default class EaglePluginContext implements IEaglePluginContext {

    constructor(app: EagleApp, manager: EaglePluginManager, info: EagleEndpointInfoPlugin) {
        this.app = app;
        this.manager = manager;
        this.info = info;
    }

    private app: EagleApp;
    private manager: EaglePluginManager;
    private info: EagleEndpointInfoPlugin;

    GetInfo(): EagleEndpointInfoPlugin {
        return this.info;
    }

    GetId(): string {
        return this.GetInfo().id;
    }

    Configure(config: IEaglePluginBootConfig): void {
        //Add classes
        var k = Object.keys(config.web_classes);
        for (var i = 0; i < k.length; i++)
            this.RegisterClass(k[i], config.web_classes[k[i]]);

        //Add demodulators
        for (var i = 0; i < config.demodulators.length; i++)
            this.RegisterDemodulator(config.demodulators[i]);

        //Add sources
        for (var i = 0; i < config.sources.length; i++)
            this.RegisterSource(config.sources[i]);
    }

    RegisterClass(classname: string, constructor: IEaglePluginObjectConstructor): void {
        this.app.net.RegisterClassFactory(classname, new EaglePluginObjectConstructionProxy(this, constructor));
    }

    WaitInit(): Promise<void> {
        return this.manager.WaitInit();
    }

    GetModule(classname: string): EagleObject {
        //Make sure we're ready
        if (this.app.pluginModules == null)
            throw new Error("The app hasn't finished initialization yet! Try using IEaglePluginContext.WaitInit().");

        //Retrieve this class
        var guid = this.app.pluginModules[this.info.id][classname];
        if (guid == null)
            throw new Error("The specified classname is invalid. Only classnames registered in this plugin's manifest are valid.");

        //Resolve
        return this.app.net.ResolveNetObject(guid);
    }

    GetAsset(name: string): IEaglePluginAsset {
        //Lookup this asset
        var hash = this.info.assets[name];
        if (hash == null)
            throw new Error("The requested asset is invalid: " + name);

        //Convert
        return new EaglePluginAsset(this.app, name, hash);
    }

    RegisterSource(source: IEaglePluginSource): void {
        throw new Error("Method not implemented.");
    }

    RegisterDemodulator(demod: IEaglePluginDemodulator): void {
        throw new Error("Method not implemented.");
    }

}