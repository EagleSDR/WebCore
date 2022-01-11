import IEaglePluginDemodulator from "../../../lib/plugin/client/IEaglePluginDemodulator";
import IEaglePluginSource from "../../../lib/plugin/client/IEaglePluginSource";
import IEaglePluginAsset from "../../../lib/plugin/IEaglePluginAsset";
import IEaglePluginBootConfig from "../../../lib/plugin/IEaglePluginBootConfig";
import IEaglePluginContext from "../../../lib/plugin/IEaglePluginContext";
import IEaglePluginObjectConstructor from "../../../lib/plugin/IEaglePluginObjectConstructor";
import IEaglePluginWindowInstance from "../../../lib/plugin/IEaglePluginWindowInstance";
import IEaglePluginWindowRegistration from "../../../lib/plugin/IEaglePluginWindowRegistration";
import EagleObject from "../../../lib/web/EagleObject";
import IEagleObjectConstructor from "../../../lib/web/IEagleObjectConstructor";
import IEagleObjectContext from "../../../lib/web/IEagleObjectContext";
import IEagleObjectFactory from "../../../lib/web/IEagleObjectFactory";
import EagleApp from "../../EagleApp";
import EagleEndpointInfoPlugin from "../../web/endpoints/info/EagleEndpointInfoPlugin";
import EaglePluginAsset from "./EaglePluginAsset";
import EaglePluginManager from "./EaglePluginManager";
import EaglePluginWindowInstance from "./EaglePluginWindowInstance";
import EaglePluginWindowRegistration from "./EaglePluginWindowRegistration";

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

    private windows: EaglePluginWindowRegistration[] = [];
    private windowInstances: EaglePluginWindowInstance[] = [];

    GetInfo(): EagleEndpointInfoPlugin {
        return this.info;
    }

    GetId(): string {
        return this.GetInfo().id;
    }

    Configure(config: IEaglePluginBootConfig): void {
        //Add classes
        EaglePluginContext.HelperLoopDict(config.web_classes, (key: string, obj: IEaglePluginObjectConstructor) => {
            this.RegisterClass(key, obj);
        })

        //Add windows
        EaglePluginContext.HelperLoopDict(config.windows, (key: string, window: IEaglePluginWindowRegistration) => {
            this.RegisterWindow(key, window);
        })

        //Add demodulators
        for (var i = 0; i < config.demodulators.length; i++)
            this.RegisterDemodulator(config.demodulators[i]);

        //Add sources
        for (var i = 0; i < config.sources.length; i++)
            this.RegisterSource(config.sources[i]);
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

    RegisterWindowInstance(window: IEaglePluginWindowRegistration, instance: IEaglePluginWindowInstance): void {
        //Scan for the wrapper for the window
        var wrapper: EaglePluginWindowRegistration;
        for (var i = 0; i < this.windows.length; i++) {
            if (this.windows[i].GetRegistration() == window)
                wrapper = this.windows[i];
        }
        if (wrapper == null)
            throw Error("This window class has not been registered.");

        //Wrap
        var w = new EaglePluginWindowInstance(instance, wrapper);

        //Add locally
        this.windowInstances.push(w);

        //Register
        this.app.windowBar.AddItem(w);
    }

    UnregisterWindowInstance(instance: IEaglePluginWindowInstance): void {
        //Scan for the wrapper for the instance
        var wrapper: EaglePluginWindowInstance;
        for (var i = 0; i < this.windowInstances.length; i++) {
            if (this.windowInstances[i].GetInstance() == instance)
                wrapper = this.windowInstances[i];
        }
        if (wrapper == null)
            return;

        //Remove locally
        this.windowInstances.splice(i, 1);

        //Unregister
        this.app.windowBar.RemoveItem(wrapper);
    }

    private RegisterClass(classname: string, constructor: IEaglePluginObjectConstructor): void {
        this.app.net.RegisterClassFactory(classname, new EaglePluginObjectConstructionProxy(this, constructor));
    }

    private RegisterSource(source: IEaglePluginSource): void {
        throw new Error("Method not implemented.");
    }

    private RegisterDemodulator(demod: IEaglePluginDemodulator): void {
        throw new Error("Method not implemented.");
    }

    private RegisterWindow(classname: string, registration: IEaglePluginWindowRegistration) {
        //Create wrapper
        var w = new EaglePluginWindowRegistration(this, registration, classname);

        //Add locally
        this.windows.push(w);

        //Register
        this.app.windowManager.RegisterWindow(w.GetClassName(), w);
    }

    private static HelperLoopDict<T>(dict: { [key: string]: T }, each: (key: string, value: T) => void) {
        if (dict == null)
            return;
        var k = Object.keys(dict);
        for (var i = 0; i < k.length; i++)
            each(k[i], dict[k[i]]);
    }

}